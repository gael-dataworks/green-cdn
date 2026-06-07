export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: High transmission, low roughness, slight blue tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f5,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Water: Slightly lower transmission, cyan tint
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.33,
    transparent: true,
  });

  // Stem/Leaves: Matte green
  const plantMat = new THREE.MeshStandardMaterial({
    color: 0x5c8a5c,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Petals: Violet purple
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0x8a7cba,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Flower Center: Dark purple/brown
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x4b3b6b,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Bubbles: White, slightly shiny
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Glass Container (Lathe) ---
  // Profile points (radius, y) defining outer and inner walls
  const glassProfile = [
    new THREE.Vector2(0.0, 0.0),    // Bottom center
    new THREE.Vector2(0.14, 0.0),   // Bottom outer edge
    new THREE.Vector2(0.14, 0.45),  // Side outer top
    new THREE.Vector2(0.15, 0.47),  // Rim flare out
    new THREE.Vector2(0.15, 0.48),  // Rim top outer
    new THREE.Vector2(0.145, 0.48), // Rim top inner
    new THREE.Vector2(0.145, 0.02), // Side inner down
    new THREE.Vector2(0.13, 0.02),  // Bottom inner step
    new THREE.Vector2(0.0, 0.02),   // Bottom inner center
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // --- Water Volume ---
  // Cylinder slightly smaller than inner glass dimensions
  const waterGeom = new THREE.CylinderGeometry(0.135, 0.135, 0.44, 32);
  const water = new THREE.Mesh(waterGeom, waterMat);
  water.position.y = 0.02 + 0.44 / 2; // Sit on bottom thickness
  root.add(water);

  // --- Stem ---
  // Tapered cylinder, angled
  const stemGeom = new THREE.CylinderGeometry(0.008, 0.012, 0.55, 12);
  const stem = new THREE.Mesh(stemGeom, plantMat);
  // Position base near bottom left, angle up to right
  stem.position.set(-0.05, 0.15, 0.0);
  stem.rotation.z = -0.3; // Lean right
  stem.rotation.x = 0.2;  // Lean back slightly
  root.add(stem);

  // --- Leaves ---
  // Simple pointed shapes attached to stem
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.04, 0.02, 0.12, 0);
  leafShape.quadraticCurveTo(0.04, -0.02, 0, 0);
  const leafGeom = new THREE.ExtrudeGeometry(leafShape, { depth: 0.002, bevelEnabled: false });
  
  // Leaf 1 (lower)
  const leaf1 = new THREE.Mesh(leafGeom, plantMat);
  leaf1.position.set(-0.03, 0.20, 0.0);
  leaf1.rotation.set(0.5, 0, -0.5);
  root.add(leaf1);

  // Leaf 2 (upper, near rim)
  const leaf2 = new THREE.Mesh(leafGeom, plantMat);
  leaf2.position.set(0.02, 0.45, 0.05);
  leaf2.rotation.set(-0.2, 0.5, -0.2);
  root.add(leaf2);

  // --- Flower Head ---
  const flowerGroup = new THREE.Group();
  
  // Center
  const centerGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const flowerCenter = new THREE.Mesh(centerGeom, centerMat);
  flowerGroup.add(flowerCenter);

  // Petals (InstancedMesh)
  // Cornflower has many thin petals radiating out
  const petalCount = 40;
  const petalGeom = new THREE.ConeGeometry(0.015, 0.06, 8); // Tall thin cone
  // Flatten the cone to look like a petal
  petalGeom.scale(1, 1, 0.2); 
  const petalMesh = new THREE.InstancedMesh(petalGeom, petalMat, petalCount);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const radius = 0.02;
    
    // Position around center
    dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    
    // Rotate to face outward and up slightly
    dummy.rotation.y = -angle;
    dummy.rotation.x = Math.PI / 2; // Lie flat initially
    dummy.rotation.z = Math.PI / 4; // Flare out
    
    // Scale variation for natural look (deterministic)
    const scaleVar = 0.8 + 0.4 * Math.sin(i * 2.5);
    dummy.scale.set(scaleVar, scaleVar, scaleVar);
    
    dummy.updateMatrix();
    petalMesh.setMatrixAt(i, dummy.matrix);
  }
  flowerGroup.add(petalMesh);

  // Position flower head at top of stem
  flowerGroup.position.set(0.08, 0.48, 0.05);
  flowerGroup.rotation.z = -0.3; // Match stem lean
  flowerGroup.rotation.x = 0.2;
  root.add(flowerGroup);

  // --- Bubbles ---
  // Deterministic distribution inside water volume
  const bubbleCount = 150;
  const bubbleGeom = new THREE.SphereGeometry(0.004, 8, 8);
  const bubbles = new THREE.InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
  
  for (let i = 0; i < bubbleCount; i++) {
    // Deterministic pseudo-random using trig
    const t = i / bubbleCount;
    const r = 0.12 * Math.sqrt(t); // Distribute in circle
    const theta = t * 100.5; 
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = 0.02 + t * 0.44; // Height within water
    
    // Add some deterministic jitter based on index
    const jitterX = 0.01 * Math.sin(i * 13.7);
    const jitterZ = 0.01 * Math.cos(i * 9.3);
    
    dummy.position.set(x + jitterX, y, z + jitterZ);
    const s = 0.5 + 0.5 * Math.sin(i * 5.1);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    bubbles.setMatrixAt(i, dummy.matrix);
  }
  root.add(bubbles);

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