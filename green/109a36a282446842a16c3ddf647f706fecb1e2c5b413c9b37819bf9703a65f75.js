export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic bowl: White, slightly rough, non-metallic.
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Pudding: Creamy off-white, slightly glossy (wet dairy).
  const puddingMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Chia seeds: Dark grey/black, wet look.
  const seedMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Tan seeds: Lighter brown for variety.
  const tanSeedMat = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Geometry: Bowl ---
  // Profile for a thick-walled ceramic bowl.
  // Points define the cross-section from bottom-center, out to rim, across rim thickness, down inside, to bottom thickness.
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.02, 0.00),   // Bottom thickness start
    new THREE.Vector2(0.02, 0.03),   // Inner bottom corner
    new THREE.Vector2(0.14, 0.03),   // Inner wall base
    new THREE.Vector2(0.17, 0.16),   // Inner wall curve
    new THREE.Vector2(0.19, 0.20),   // Inner rim
    new THREE.Vector2(0.22, 0.20),   // Outer rim
    new THREE.Vector2(0.22, 0.21),   // Top of rim
    new THREE.Vector2(0.21, 0.21),   // Top inner rim
    new THREE.Vector2(0.19, 0.15),   // Outer wall curve
    new THREE.Vector2(0.15, 0.00),   // Outer base edge
    new THREE.Vector2(0.00, 0.00),   // Close bottom
  ];
  
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, bowlMat);
  root.add(bowl);

  // --- Geometry: Pudding ---
  // The pudding fills the bowl up to y ~ 0.19.
  // Profile: Center top -> Edge top -> Follow inner bowl wall down -> Close bottom.
  const puddingFillY = 0.19;
  const puddingProfile = [
    new THREE.Vector2(0.00, puddingFillY), // Center surface
    new THREE.Vector2(0.18, puddingFillY), // Edge surface (slightly inside rim)
    new THREE.Vector2(0.17, 0.16),         // Match bowl inner wall
    new THREE.Vector2(0.14, 0.03),         // Match bowl inner base
    new THREE.Vector2(0.02, 0.03),         // Inner bottom corner
    new THREE.Vector2(0.02, 0.00),         // Bottom thickness
    new THREE.Vector2(0.00, 0.00),         // Center bottom
  ];

  const puddingGeom = new THREE.LatheGeometry(puddingProfile, 32);
  const pudding = new THREE.Mesh(puddingGeom, puddingMat);
  // Slightly offset to ensure no z-fighting with bowl interior
  pudding.position.set(0, 0.001, 0); 
  root.add(pudding);

  // --- Geometry: Chia Seeds (InstancedMesh) ---
  const seedCount = 900;
  const seedGeom = new THREE.SphereGeometry(0.0035, 5, 5);
  
  // We need two instanced meshes for two colors, or update color per instance.
  // Updating color per instance is more efficient for draw calls.
  const seeds = new THREE.InstancedMesh(seedGeom, seedMat, seedCount);
  const tanSeeds = new THREE.InstancedMesh(seedGeom, tanSeedMat, Math.floor(seedCount * 0.15));
  
  const dummy = new THREE.Object3D();
  const _color = new THREE.Color();

  // Deterministic pseudo-random generator
  function pseudoRandom(index) {
    const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // Distribution parameters
  const maxRadius = 0.17; // Radius of pudding surface
  const centerY = puddingFillY + 0.002; // Slightly above surface

  for (let i = 0; i < seedCount; i++) {
    // Polar coordinates for disk distribution
    const angle = pseudoRandom(i) * Math.PI * 2;
    // Use sqrt for uniform distribution on disk, but bias towards center for the "mound" look
    // The image shows a dense cluster in the middle.
    const rBias = Math.pow(pseudoRandom(i + 1), 0.7) * maxRadius; 
    
    const x = Math.cos(angle) * rBias;
    const z = Math.sin(angle) * rBias;
    
    // Y variation for clumping depth
    const yVar = pseudoRandom(i + 2) * 0.008; 
    const y = centerY + yVar;

    dummy.position.set(x, y, z);
    
    // Random rotation
    dummy.rotation.set(
      pseudoRandom(i + 3) * Math.PI,
      pseudoRandom(i + 4) * Math.PI,
      pseudoRandom(i + 5) * Math.PI
    );
    
    // Scale variation
    const s = 0.8 + pseudoRandom(i + 6) * 0.5;
    dummy.scale.set(s, s, s);

    dummy.updateMatrix();
    seeds.setMatrixAt(i, dummy.matrix);
  }
  root.add(seeds);

  // Add tan seeds
  const tanCount = tanSeeds.count;
  for (let i = 0; i < tanCount; i++) {
    const angle = pseudoRandom(i + 1000) * Math.PI * 2;
    const rBias = Math.pow(pseudoRandom(i + 1001), 0.7) * maxRadius;
    const x = Math.cos(angle) * rBias;
    const z = Math.sin(angle) * rBias;
    const y = centerY + pseudoRandom(i + 1002) * 0.008;

    dummy.position.set(x, y, z);
    dummy.rotation.set(
      pseudoRandom(i + 1003) * Math.PI,
      pseudoRandom(i + 1004) * Math.PI,
      pseudoRandom(i + 1005) * Math.PI
    );
    const s = 0.8 + pseudoRandom(i + 1006) * 0.5;
    dummy.scale.set(s, s, s);
    
    dummy.updateMatrix();
    tanSeeds.setMatrixAt(i, dummy.matrix);
  }
  root.add(tanSeeds);

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