export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // White ceramic bowl: glossy, non-metallic
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Pudding base: creamy, slightly rougher than ceramic
  const puddingMat = new THREE.MeshStandardMaterial({
    color: 0xfdfbf7,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Chia seeds: dark, matte
  const chiaMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Nuts/hemp hearts: light tan, matte
  const nutMat = new THREE.MeshStandardMaterial({
    color: 0xd4c4a8,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Syrup/Honey: amber, glossy, translucent
  const syrupMat = new THREE.MeshPhysicalMaterial({
    color: 0xffaa00,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.4,
    transparent: true,
  });

  // --- 1. Bowl ---
  // Profile for a rounded bowl with a rim
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.09, 0.00), // Bottom outer edge
    new THREE.Vector2(0.12, 0.08), // Belly
    new THREE.Vector2(0.135, 0.13), // Upper side
    new THREE.Vector2(0.145, 0.145), // Rim outer lip
    new THREE.Vector2(0.135, 0.145), // Rim top inner
    new THREE.Vector2(0.125, 0.135), // Inside wall start
    new THREE.Vector2(0.05, 0.05),   // Inside curve
    new THREE.Vector2(0.00, 0.05),   // Inside bottom center
  ];
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, bowlMat);
  root.add(bowl);

  // --- 2. Pudding Base ---
  // A sphere segment filling the bowl
  const puddingRadius = 0.125;
  const puddingGeom = new THREE.SphereGeometry(puddingRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const pudding = new THREE.Mesh(puddingGeom, puddingMat);
  // Position so it sits inside the bowl, top near rim
  pudding.position.y = 0.04;
  pudding.rotation.x = Math.PI; // Flip to make the flat side up? No, sphere segment is dome.
  // Actually, SphereGeometry with phiLength < PI creates a segment.
  // Let's just use a full sphere scaled down and positioned, it's inside the bowl so bottom doesn't matter much.
  // Better: Use a Lathe for the pudding surface to match bowl interior exactly?
  // Simpler: A sphere scaled Y=0.7 to look like a soft mound.
  pudding.scale.set(1, 0.7, 1);
  pudding.position.y = 0.06;
  root.add(pudding);

  // --- 3. Seeds (InstancedMesh) ---
  // We need many small spheres on the top surface of the pudding.
  const seedCount = 450;
  const seedSize = 0.004;
  const seedGeom = new THREE.SphereGeometry(seedSize, 6, 6);
  
  // Chia seeds instanced mesh
  const chiaMesh = new THREE.InstancedMesh(seedGeom, chiaMat, seedCount);
  const nutMesh = new THREE.InstancedMesh(seedGeom, nutMat, Math.floor(seedCount * 0.15)); // ~15% nuts
  
  const dummy = new THREE.Object3D();
  const puddingTopY = pudding.position.y + (puddingRadius * 0.7); // Approx top of mound
  
  let chiaIdx = 0;
  let nutIdx = 0;

  // Deterministic distribution on a dome
  for (let i = 0; i < seedCount; i++) {
    // Golden angle spiral for even distribution on a dome
    const y = i / seedCount; // 0 to 1
    const radiusAtY = puddingRadius * Math.sqrt(1 - y * y); // Circle radius at this height
    // Actually we want them on the TOP surface mostly.
    // Let's use spherical coords for the top cap.
    const theta = Math.acos(1 - 2 * (i / seedCount)); // 0 to PI
    const phi = Math.sqrt(seedCount * Math.PI) * theta * 2.39996; // Golden angle
    
    // Restrict to top hemisphere (theta < PI/2)
    // Map i to a cap
    const capRatio = i / seedCount; // 0 (top) to 1 (equator)
    const angleFromTop = capRatio * (Math.PI / 2.2); // Slightly past equator to cover sides
    
    const r = puddingRadius * 1.02; // Slightly above surface
    const x = r * Math.sin(angleFromTop) * Math.cos(phi);
    const z = r * Math.sin(angleFromTop) * Math.sin(phi);
    const yVal = r * Math.cos(angleFromTop);
    
    // Shift to pudding position
    const posX = x;
    const posY = pudding.position.y + yVal - puddingRadius; // Adjust for sphere center
    const posZ = z;

    // Decide if nut or chia (deterministic pattern)
    // Every 7th seed is a nut, roughly
    const isNut = (i % 7 === 0);

    dummy.position.set(posX, posY, posZ);
    // Random rotation for variety (deterministic based on i)
    dummy.rotation.set((i * 0.5) % Math.PI, (i * 0.3) % Math.PI, (i * 0.1) % Math.PI);
    dummy.updateMatrix();

    if (isNut && nutIdx < nutMesh.count) {
      nutMesh.setMatrixAt(nutIdx++, dummy.matrix);
      // Scale nuts slightly larger
      const nutScale = 1.5;
      dummy.scale.set(nutScale, nutScale, nutScale);
      dummy.updateMatrix();
      // We need to update the matrix for the nut mesh specifically if we want different scale
      // But InstancedMesh shares geometry scale. Let's just use same size for simplicity or 
      // rely on color difference. To keep it simple, same size.
      nutMesh.setMatrixAt(nutIdx-1, dummy.matrix); 
      dummy.scale.set(1, 1, 1); // Reset
    } else if (chiaIdx < chiaMesh.count) {
      chiaMesh.setMatrixAt(chiaIdx++, dummy.matrix);
    }
  }
  
  root.add(chiaMesh);
  root.add(nutMesh);

  // --- 4. Syrup Globs ---
  // A few flattened spheres on top to represent honey/syrup
  const syrupGeom = new THREE.SphereGeometry(0.03, 16, 16);
  
  const syrup1 = new THREE.Mesh(syrupGeom, syrupMat);
  syrup1.position.set(0.02, puddingTopY + 0.01, 0.02);
  syrup1.scale.set(1, 0.4, 1); // Flatten
  syrup1.rotation.z = 0.2;
  root.add(syrup1);

  const syrup2 = new THREE.Mesh(syrupGeom, syrupMat);
  syrup2.position.set(-0.03, puddingTopY + 0.015, -0.01);
  syrup2.scale.set(1.2, 0.3, 0.8);
  syrup2.rotation.x = 0.1;
  root.add(syrup2);

  const syrup3 = new THREE.Mesh(syrupGeom, syrupMat);
  syrup3.position.set(0.0, puddingTopY + 0.02, -0.04);
  syrup3.scale.set(0.8, 0.3, 0.8);
  root.add(syrup3);

  // --- Normalization ---
  fitToUnitCube(THREE, root);
  return root;
}

function fitToUnitCube(THREE, root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 0.95 / maxDim;
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}