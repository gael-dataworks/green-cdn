export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // White ceramic bowl: glossy but not mirror, very low metalness.
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.25,
  });

  // Pudding/Yogurt: creamy off-white, matte/satin finish.
  const puddingMat = new THREE.MeshStandardMaterial({
    color: 0xfdfbf7,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Chia seeds: two colors for variation.
  const seedDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.6,
  });
  const seedLightMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Honey/Syrup: amber, translucent, glossy.
  const syrupMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a017,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.6,
    ior: 1.45,
    transparent: true,
    opacity: 0.9,
  });

  // --- 1. Bowl ---
  // Profile for LatheGeometry (right half cross-section)
  // Starts at bottom center (0,0), goes out to base, up side, in for rim, down inside, to inner bottom center.
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00),  // Bottom center (outside)
    new THREE.Vector2(0.06, 0.00),  // Bottom edge (outside)
    new THREE.Vector2(0.18, 0.10),  // Max width
    new THREE.Vector2(0.19, 0.125), // Rim outer edge
    new THREE.Vector2(0.175, 0.125),// Rim inner edge
    new THREE.Vector2(0.165, 0.05), // Inner wall
    new THREE.Vector2(0.05, 0.02),  // Inner bottom edge
    new THREE.Vector2(0.00, 0.02),  // Inner bottom center
  ];
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, bowlMat);
  root.add(bowl);

  // --- 2. Pudding/Yogurt Base ---
  // Fills the bowl. Modeled as a slightly flattened sphere cap or lathe.
  // Using a lathe to match the bowl's inner curve up to the fill line, then mounding up.
  const puddingProfile = [
    new THREE.Vector2(0.00, 0.03),  // Center top of mound
    new THREE.Vector2(0.08, 0.04),  // Mound slope
    new THREE.Vector2(0.16, 0.03),  // Edge where it meets bowl wall
    new THREE.Vector2(0.165, 0.05), // Follows bowl wall down slightly
    new THREE.Vector2(0.05, 0.02),  // Inner bottom
    new THREE.Vector2(0.00, 0.02),  // Center bottom
  ];
  const puddingGeom = new THREE.LatheGeometry(puddingProfile, 32);
  const pudding = new THREE.Mesh(puddingGeom, puddingMat);
  // Shift up slightly to sit on bowl bottom
  pudding.position.y = 0.0; 
  root.add(pudding);

  // --- 3. Chia Seeds (InstancedMesh) ---
  // Deterministic distribution on top of the pudding mound.
  const seedCount = 450;
  const seedGeom = new THREE.SphereGeometry(0.004, 5, 5);
  const seeds = new THREE.InstancedMesh(seedGeom, seedDarkMat, seedCount);
  
  const dummy = new THREE.Object3D();
  const colorDark = new THREE.Color(0x2a2a2a);
  const colorLight = new THREE.Color(0x8b5a2b);

  // Pudding surface approximation for height: y = 0.03 + 0.02 * (1 - (r/0.16)^2)
  // We distribute seeds in a spiral or grid on the XZ plane within radius 0.15
  for (let i = 0; i < seedCount; i++) {
    // Deterministic pseudo-random using golden angle
    const angle = i * 2.399963229728653; 
    const radius = 0.005 + (Math.sqrt(i) / Math.sqrt(seedCount)) * 0.14;
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Calculate height based on radius (mound shape) + some noise based on index
    // Base height 0.03, peak 0.05 at center, 0.03 at edge
    const normalizedR = radius / 0.14;
    const surfaceY = 0.03 + 0.02 * Math.max(0, (1 - normalizedR * normalizedR));
    
    // Add tiny vertical jitter based on index to avoid perfect Z-fighting
    const jitterY = (i % 3) * 0.002; 

    dummy.position.set(x, surfaceY + jitterY, z);
    
    // Random rotation
    dummy.rotation.set(
      (i * 0.5) % Math.PI, 
      (i * 1.3) % Math.PI, 
      (i * 0.7) % Math.PI
    );
    
    // Scale variation
    const scaleVar = 0.8 + (i % 5) * 0.1;
    dummy.scale.setScalar(scaleVar);

    dummy.updateMatrix();
    seeds.setMatrixAt(i, dummy.matrix);

    // Color variation: roughly 20% light seeds
    if (i % 5 === 0) {
      seeds.setColorAt(i, colorLight);
    } else {
      seeds.setColorAt(i, colorDark);
    }
  }
  root.add(seeds);

  // --- 4. Honey/Syrup Drizzle ---
  // Translucent amber blobs on top of the seeds.
  // Using flattened, stretched spheres to simulate viscous liquid pooling.
  
  const syrupBlobGeom = new THREE.SphereGeometry(1, 16, 16);
  
  function addSyrupBlob(x, y, z, sx, sy, sz, rotX, rotZ) {
    const blob = new THREE.Mesh(syrupBlobGeom, syrupMat);
    blob.position.set(x, y, z);
    blob.scale.set(sx, sy, sz);
    blob.rotation.set(rotX, 0, rotZ);
    root.add(blob);
  }

  // Central pool
  addSyrupBlob(0.00, 0.055, 0.00, 0.08, 0.015, 0.09, 0, 0);
  // Drips extending outward
  addSyrupBlob(0.05, 0.050, 0.05, 0.04, 0.012, 0.05, 0.2, 0.5);
  addSyrupBlob(-0.06, 0.048, -0.04, 0.05, 0.010, 0.06, -0.1, -0.3);
  addSyrupBlob(0.02, 0.052, -0.08, 0.03, 0.012, 0.04, 0.3, 0.1);

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