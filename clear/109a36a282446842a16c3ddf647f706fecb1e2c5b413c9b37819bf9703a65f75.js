export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.35,
  });

  const puddingMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2ea,
    metalness: 0.0,
    roughness: 0.65,
  });

  const darkSeedMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.4,
  });

  const lightSeedMat = new THREE.MeshStandardMaterial({
    color: 0xc4a470,
    metalness: 0.0,
    roughness: 0.4,
  });

  const syrupMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a017,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.65,
    ior: 1.45,
    transparent: true,
    opacity: 0.9,
  });

  // --- Bowl ---
  // Profile: outer bottom -> outer wall -> rim -> inner wall -> inner bottom
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.36, 0.00), // Outer bottom edge
    new THREE.Vector2(0.46, 0.32), // Outer belly
    new THREE.Vector2(0.49, 0.46), // Outer rim lip
    new THREE.Vector2(0.43, 0.46), // Inner rim lip
    new THREE.Vector2(0.34, 0.12), // Inner wall curve
    new THREE.Vector2(0.00, 0.12), // Inner bottom center (closes the loop effectively for solid)
  ];
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  root.add(bowl);

  // --- Pudding Base ---
  // A flattened sphere/cap sitting inside the bowl
  const puddingGeom = new THREE.SphereGeometry(0.38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const pudding = new THREE.Mesh(puddingGeom, puddingMat);
  pudding.position.y = 0.14;
  pudding.scale.set(1, 0.6, 1); // Flatten it slightly to look like a mound
  root.add(pudding);

  // --- Chia Seeds (Instanced) ---
  // We use two instanced meshes: one for dark seeds, one for light/tan seeds
  const seedCount = 900;
  const lightSeedCount = 120;
  const darkSeedCount = seedCount - lightSeedCount;
  
  const seedGeom = new THREE.SphereGeometry(0.006, 6, 6);
  
  const darkSeeds = new THREE.InstancedMesh(seedGeom, darkSeedMat, darkSeedCount);
  const lightSeeds = new THREE.InstancedMesh(seedGeom, lightSeedMat, lightSeedCount);
  
  const dummy = new THREE.Object3D();
  const puddingRadius = 0.36;
  
  // Deterministic placement using golden angle spiral + noise
  for (let i = 0; i < seedCount; i++) {
    // Determine if this seed is light or dark
    const isLight = i < lightSeedCount;
    const targetMesh = isLight ? lightSeeds : darkSeeds;
    const index = isLight ? i : i - lightSeedCount;
    
    // Spiral distribution
    const angle = i * 2.4; // Approx golden angle in radians
    // Radius grows with sqrt(i) to fill area evenly, capped at pudding edge
    const maxR = puddingRadius * 0.92;
    const r = (Math.sqrt(i) / Math.sqrt(seedCount)) * maxR;
    
    // Add some deterministic jitter to radius and angle for natural look
    const jitterR = Math.sin(i * 13.5) * 0.015;
    const jitterA = Math.cos(i * 7.2) * 0.15;
    
    const finalR = Math.max(0, r + jitterR);
    const finalA = angle + jitterA;
    
    const x = Math.cos(finalA) * finalR;
    const z = Math.sin(finalA) * finalR;
    
    // Height follows a simple mound shape: higher in center, lower at edges
    // Base height 0.14 + mound height ~0.08 at center
    const moundHeight = 0.09 * (1 - (finalR / maxR));
    const y = 0.14 + moundHeight + 0.003; // +0.003 to sit on top
    
    dummy.position.set(x, y, z);
    
    // Random rotation for seeds
    dummy.rotation.set(
      Math.sin(i * 3.1) * Math.PI,
      Math.cos(i * 5.7) * Math.PI,
      Math.sin(i * 9.2) * Math.PI
    );
    
    // Slight scale variation
    const s = 0.8 + Math.sin(i * 11.3) * 0.4;
    dummy.scale.setScalar(s);
    
    dummy.updateMatrix();
    targetMesh.setMatrixAt(index, dummy.matrix);
  }
  
  root.add(darkSeeds);
  root.add(lightSeeds);

  // --- Syrup Drizzle ---
  // A few glossy blobs on top of the seeds
  const syrupGeom = new THREE.SphereGeometry(0.04, 16, 16);
  
  function addSyrupBlob(x, y, z, sx, sy, sz) {
    const blob = new THREE.Mesh(syrupGeom, syrupMat);
    blob.position.set(x, y, z);
    blob.scale.set(sx, sy, sz);
    blob.rotation.set(
      Math.sin(x * 10) * 0.5,
      0,
      Math.cos(z * 10) * 0.5
    );
    root.add(blob);
  }

  // Central large blob
  addSyrupBlob(0.02, 0.24, -0.03, 1.8, 0.6, 1.4);
  // Smaller drips
  addSyrupBlob(-0.12, 0.21, 0.08, 1.2, 0.4, 1.0);
  addSyrupBlob(0.15, 0.20, 0.10, 1.0, 0.3, 1.2);
  addSyrupBlob(-0.05, 0.22, 0.15, 1.1, 0.35, 0.9);

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