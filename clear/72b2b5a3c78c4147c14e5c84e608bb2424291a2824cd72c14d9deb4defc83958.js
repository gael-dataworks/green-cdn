export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.98,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.85,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x558844,
    metalness: 0.0,
    roughness: 0.8,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x66aa55,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const petalMat = new THREE.MeshStandardMaterial({
    color: 0x8866cc,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const flowerCenterMat = new THREE.MeshStandardMaterial({
    color: 0x443366,
    metalness: 0.0,
    roughness: 0.9,
  });

  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.33,
    transparent: true,
  });

  // --- Glass Container (Lathe) ---
  // Profile points [radius, height]
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.30, 0.00), // Outer bottom edge
    new THREE.Vector2(0.30, 0.90), // Outer wall up
    new THREE.Vector2(0.32, 0.95), // Rim flare
    new THREE.Vector2(0.32, 1.00), // Top outer
    new THREE.Vector2(0.26, 1.00), // Top inner
    new THREE.Vector2(0.26, 0.15), // Inner wall down (thick base)
    new THREE.Vector2(0.00, 0.15), // Inner bottom center
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // --- Water ---
  const waterHeight = 0.92;
  const waterRadius = 0.255;
  const waterGeom = new THREE.CylinderGeometry(waterRadius, waterRadius, waterHeight, 32);
  const water = new THREE.Mesh(waterGeom, waterMat);
  water.position.y = waterHeight / 2;
  root.add(water);

  // --- Bubbles (InstancedMesh) ---
  const bubbleCount = 150;
  const bubbleGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const bubbles = new THREE.InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
  const dummy = new THREE.Object3D();
  
  for (let i = 0; i < bubbleCount; i++) {
    // Deterministic distribution
    const t = i / bubbleCount;
    const angle = i * 2.5; 
    const r = waterRadius * 0.85 * Math.sqrt(t); // More bubbles near edges/bottom
    const h = t * waterHeight * 0.95;
    
    // Add some noise-like variation using sine
    const noiseX = Math.sin(i * 13.5) * 0.1;
    const noiseZ = Math.cos(i * 7.2) * 0.1;

    dummy.position.set(
      r * Math.cos(angle) + noiseX * 0.1,
      h,
      r * Math.sin(angle) + noiseZ * 0.1
    );
    const scale = 0.5 + Math.sin(i * 5.3) * 0.3;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    bubbles.setMatrixAt(i, dummy.matrix);
  }
  root.add(bubbles);

  // --- Flower Stem ---
  // Stem goes from bottom of glass diagonally up to the rim
  const stemStart = new THREE.Vector3(-0.15, 0.05, 0.0);
  const stemEnd = new THREE.Vector3(0.15, 1.05, 0.15); // Leaning out
  
  const stemCurve = new THREE.QuadraticBezierCurve3(
    stemStart,
    new THREE.Vector3(0.0, 0.5, 0.05),
    stemEnd
  );
  const stemGeom = new THREE.TubeGeometry(stemCurve, 20, 0.012, 8, false);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  root.add(stem);

  // --- Leaves ---
  function addLeaf(position, rotationZ, scale) {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.08, 0.02, 0.15, 0);
    leafShape.quadraticCurveTo(0.08, -0.02, 0, 0);
    
    const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.002, bevelEnabled: false });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.copy(position);
    leaf.rotation.z = rotationZ;
    leaf.rotation.y = Math.PI / 2; // Orient flat
    leaf.scale.set(scale, scale, 1);
    root.add(leaf);
  }

  // Leaf 1 (submerged)
  addLeaf(new THREE.Vector3(-0.05, 0.3, 0.02), 0.5, 1.2);
  // Leaf 2 (above water)
  addLeaf(new THREE.Vector3(0.1, 0.8, 0.1), -0.2, 1.0);

  // --- Flower Head (Cornflower) ---
  const flowerGroup = new THREE.Group();
  const flowerPos = stemEnd.clone();
  flowerGroup.position.copy(flowerPos);
  
  // Tilt the flower head slightly to follow stem angle
  const stemTangent = stemCurve.getTangent(1);
  flowerGroup.lookAt(flowerPos.clone().add(stemTangent));
  flowerGroup.rotateX(Math.PI / 2); // Correct orientation for lookAt

  // Petals
  const petalCount = 35;
  const petalGeom = new THREE.CircleGeometry(0.06, 9); // Base shape, will scale
  const petals = new THREE.InstancedMesh(petalGeom, petalMat, petalCount);
  
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const radius = 0.08;
    
    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    dummy.rotation.z = angle;
    // Scale to make them tapered
    dummy.scale.set(0.4, 1.2, 1); 
    dummy.updateMatrix();
    petals.setMatrixAt(i, dummy.matrix);
  }
  flowerGroup.add(petals);

  // Flower Center
  const centerGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.02, 16);
  const center = new THREE.Mesh(centerGeom, flowerCenterMat);
  center.rotation.x = Math.PI / 2;
  flowerGroup.add(center);

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