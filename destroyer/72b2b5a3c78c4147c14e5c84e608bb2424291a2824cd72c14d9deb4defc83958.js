export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: High transmission, low roughness, slight ior
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Liquid: Slightly blue tint, high transmission
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef5ff,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.85,
    ior: 1.33,
    transparent: true,
  });

  // Bubble: White, shiny
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
  });

  // Stem: Matte green
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5a8f4a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Leaf: Slightly lighter green
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x6abf5a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Flower Petal: Purple
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0x8a6cbf,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Flower Center: Darker purple/blue
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x4b2c8a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- 1. Glass Tumbler ---
  // Profile for Lathe: [radius, height]
  // Outer wall, thick base, rim
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.34, 0.00), // Outer bottom edge
    new THREE.Vector2(0.34, 0.06), // Base thickness
    new THREE.Vector2(0.30, 0.06), // Inner bottom start
    new THREE.Vector2(0.31, 0.92), // Inner wall top
    new THREE.Vector2(0.35, 0.92), // Outer rim edge
    new THREE.Vector2(0.35, 1.00), // Top of rim
    new THREE.Vector2(0.00, 1.00), // Center top
  ];

  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass_body = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass_body);

  // --- 2. Liquid ---
  // Cylinder inside the glass
  const liquidHeight = 0.88;
  const liquidRadius = 0.29;
  const liquidGeom = new THREE.CylinderGeometry(liquidRadius, liquidRadius, liquidHeight, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = liquidHeight / 2 + 0.06; // Sit on base
  root.add(liquid);

  // --- 3. Bubbles ---
  // InstancedMesh for performance
  const bubbleCount = 150;
  const bubbleGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const bubbles = new THREE.InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < bubbleCount; i++) {
    // Deterministic pseudo-random positions
    const u = Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453);
    const v = Math.sin(i * 78.233) * 92758.1231 - Math.floor(Math.sin(i * 78.233) * 92758.1231);
    const w = Math.sin(i * 45.112) * 34891.4421 - Math.floor(Math.sin(i * 45.112) * 34891.4421);

    // Cylindrical distribution within liquid
    const r = Math.sqrt(u) * (liquidRadius - 0.02);
    const theta = v * Math.PI * 2;
    const h = w * (liquidHeight - 0.05) + 0.05;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = h + 0.06; // Offset by base

    dummy.position.set(x, y, z);
    // Random scale variation
    const s = 0.5 + u * 0.8;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    bubbles.setMatrixAt(i, dummy.matrix);
  }
  root.add(bubbles);

  // --- 4. Flower ---
  const flowerGroup = new THREE.Group();
  
  // Stem
  const stemHeight = 1.4;
  const stemGeom = new THREE.CylinderGeometry(0.025, 0.035, stemHeight, 12);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  // Position stem so bottom is at glass bottom, angled up
  stem.position.y = stemHeight / 2;
  flowerGroup.add(stem);

  // Leaves (2 leaves on stem)
  const leafGeom = new THREE.ConeGeometry(0.04, 0.12, 8);
  // Leaf 1
  const leaf1 = new THREE.Mesh(leafGeom, leafMat);
  leaf1.position.set(0, stemHeight * 0.4, 0);
  leaf1.rotation.z = -Math.PI / 2; // Point out
  leaf1.rotation.y = Math.PI / 4;
  leaf1.scale.set(1, 1, 0.2); // Flatten
  flowerGroup.add(leaf1);
  
  // Leaf 2
  const leaf2 = new THREE.Mesh(leafGeom, leafMat);
  leaf2.position.set(0, stemHeight * 0.6, 0);
  leaf2.rotation.z = -Math.PI / 2;
  leaf2.rotation.y = -Math.PI / 3;
  leaf2.scale.set(1, 1, 0.2);
  flowerGroup.add(leaf2);

  // Flower Head Group (at top of stem)
  const headGroup = new THREE.Group();
  headGroup.position.y = stemHeight;
  flowerGroup.add(headGroup);

  // Center of flower (dark cluster)
  const centerGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const flowerCenter = new THREE.Mesh(centerGeom, centerMat);
  headGroup.add(flowerCenter);

  // Inner florets (small tubes around center)
  const floretGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8);
  const floretCount = 12;
  for (let i = 0; i < floretCount; i++) {
    const angle = (i / floretCount) * Math.PI * 2;
    const floret = new THREE.Mesh(floretGeom, centerMat);
    const r = 0.05;
    floret.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    floret.lookAt(0, 0.5, 0); // Point up/out
    floret.rotateX(Math.PI / 2); // Correct orientation
    headGroup.add(floret);
  }

  // Outer Petals (large purple rays)
  // Use flattened cones
  const petalGeom = new THREE.ConeGeometry(0.03, 0.18, 8);
  const petalCount = 16;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeom, petalMat);
    
    // Position around center
    const r = 0.06;
    petal.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    
    // Orient: Base at center, tip out
    petal.lookAt(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
    petal.rotateX(Math.PI / 2); // Cone points Z, need to align
    
    // Flatten the cone to look like a petal
    petal.scale.set(1.5, 1, 0.3);
    
    // Slight random rotation for natural look (deterministic)
    const twist = Math.sin(i * 5.5) * 0.2;
    petal.rotateZ(twist);

    headGroup.add(petal);
  }

  // Position and Rotate entire flower to lean out of glass
  // Stem base at (0, 0.06, 0) inside glass
  flowerGroup.position.set(0, 0.06, 0);
  // Lean towards +X and slightly +Z
  flowerGroup.rotation.z = -0.3; 
  flowerGroup.rotation.x = 0.1;

  root.add(flowerGroup);

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