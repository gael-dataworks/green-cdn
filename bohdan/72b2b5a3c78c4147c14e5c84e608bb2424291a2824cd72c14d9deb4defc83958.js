export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: Clear, high transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Water: Slightly blue tint, high transmission
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.33,
    transparent: true,
  });

  // Stem/Leaves: Matte green
  const plantMat = new THREE.MeshStandardMaterial({
    color: 0x558844,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Flower: Vibrant purple/blue cornflower
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0x8a6db6,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const flowerCenterMat = new THREE.MeshStandardMaterial({
    color: 0x4a3b66,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Glass Vessel ---
  // Lathe profile for a drinking glass with a thick base
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00),   // Center bottom
    new THREE.Vector2(0.35, 0.00),   // Outer bottom edge
    new THREE.Vector2(0.35, 0.10),   // Base thickness
    new THREE.Vector2(0.32, 0.10),   // Inner bottom edge
    new THREE.Vector2(0.32, 0.90),   // Inner top edge
    new THREE.Vector2(0.35, 0.95),   // Outer rim
    new THREE.Vector2(0.00, 0.95),   // Close top (visual cap)
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // --- Water ---
  // Cylinder inside the glass
  const waterHeight = 0.82;
  const waterGeom = new THREE.CylinderGeometry(0.31, 0.31, waterHeight, 32);
  const water = new THREE.Mesh(waterGeom, waterMat);
  water.position.y = waterHeight / 2 + 0.01; // Slightly above base
  root.add(water);

  // --- Bubbles ---
  // InstancedMesh for deterministic bubbles inside water
  const bubbleCount = 150;
  const bubbleGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const bubbleMesh = new THREE.InstancedMesh(bubbleGeom, glassMat, bubbleCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < bubbleCount; i++) {
    // Deterministic pseudo-random distribution using sine/cosine
    const t = i / bubbleCount;
    const angle = i * 137.5 * (Math.PI / 180); // Golden angle
    const r = 0.28 * Math.sqrt(t);
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = 0.05 + (i % 40) * 0.02 + (Math.sin(i * 0.5) * 0.1);

    // Keep within water cylinder bounds roughly
    if (x * x + z * z > 0.31 * 0.31) continue;
    if (y > waterHeight) continue;

    dummy.position.set(x, y, z);
    const scale = 0.5 + (i % 5) * 0.2;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    bubbleMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(bubbleMesh);

  // --- Stem ---
  // Angled stem inside the glass
  const stemHeight = 1.4;
  const stemGeom = new THREE.CylinderGeometry(0.015, 0.018, stemHeight, 12);
  const stem = new THREE.Mesh(stemGeom, plantMat);
  // Position stem base near bottom, angle it
  stem.position.set(-0.15, stemHeight / 2 * 0.6, -0.15);
  stem.rotation.z = Math.PI / 8; // Tilt right
  stem.rotation.x = -Math.PI / 12; // Tilt back slightly
  root.add(stem);

  // --- Leaves ---
  // Two leaves attached to stem
  function addLeaf(x, y, z, rotZ, rotX, scaleX) {
    const leafGeom = new THREE.CircleGeometry(0.08, 16);
    const leaf = new THREE.Mesh(leafGeom, plantMat);
    leaf.position.set(x, y, z);
    leaf.rotation.z = rotZ;
    leaf.rotation.x = rotX;
    leaf.scale.set(scaleX, 0.3, 1); // Flatten and elongate
    leaf.rotation.y = Math.PI / 2; // Orient along stem
    stem.add(leaf); // Attach to stem so it moves with it
  }

  // Leaf 1 (lower)
  addLeaf(0, 0.3, 0, Math.PI / 6, 0, 1.0);
  // Leaf 2 (upper, sticking out of glass)
  addLeaf(0, 0.7, 0, -Math.PI / 8, 0, 0.8);

  // --- Flower Head ---
  const flowerGroup = new THREE.Group();
  // Position flower head at top of stem
  // Approximate top of stem based on rotation and height
  flowerGroup.position.set(0.25, 0.95, -0.05);
  flowerGroup.rotation.z = Math.PI / 8;
  flowerGroup.rotation.x = -Math.PI / 12;
  root.add(flowerGroup);

  // Center disk
  const centerGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.03, 16);
  const center = new THREE.Mesh(centerGeom, flowerCenterMat);
  center.rotation.x = Math.PI / 2;
  flowerGroup.add(center);

  // Petals
  // Cornflowers have ray florets (outer) and disc florets (inner)
  // Outer petals: larger, flared
  const outerPetalCount = 12;
  const outerPetalGeom = new THREE.ConeGeometry(0.02, 0.12, 8);
  for (let i = 0; i < outerPetalCount; i++) {
    const angle = (i / outerPetalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(outerPetalGeom, flowerMat);
    petal.position.set(
      Math.cos(angle) * 0.05,
      Math.sin(angle) * 0.05,
      0
    );
    petal.rotation.z = angle + Math.PI / 2;
    petal.rotation.x = Math.PI / 2; // Lay flat in XY plane initially
    petal.scale.set(1, 0.4, 1); // Flatten
    // Flare tips slightly
    petal.geometry.translate(0, 0.06, 0); // Pivot at base
    petal.rotation.y = -0.2; // Curl slightly
    flowerGroup.add(petal);
  }

  // Inner petals: smaller, tubular
  const innerPetalCount = 16;
  const innerPetalGeom = new THREE.CylinderGeometry(0.005, 0.01, 0.06, 8);
  for (let i = 0; i < innerPetalCount; i++) {
    const angle = (i / innerPetalCount) * Math.PI * 2 + (Math.PI / 16);
    const petal = new THREE.Mesh(innerPetalGeom, flowerMat);
    petal.position.set(
      Math.cos(angle) * 0.03,
      Math.sin(angle) * 0.03,
      0.01
    );
    petal.rotation.z = angle + Math.PI / 2;
    petal.rotation.x = Math.PI / 2;
    flowerGroup.add(petal);
  }

  // Extra leaf near flower head (bract)
  const bractGeom = new THREE.CircleGeometry(0.04, 16);
  const bract = new THREE.Mesh(bractGeom, plantMat);
  bract.position.set(0, 0, -0.02);
  bract.rotation.x = Math.PI / 2;
  bract.scale.set(1, 0.3, 1);
  flowerGroup.add(bract);

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