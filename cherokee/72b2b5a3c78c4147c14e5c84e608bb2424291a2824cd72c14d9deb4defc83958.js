export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5a8f3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const petalMat = new THREE.MeshStandardMaterial({
    color: 0x8a6fd9,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const flowerCenterMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a69,
    metalness: 0.0,
    roughness: 0.7,
  });

  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.33,
    transparent: true,
  });

  // --- Dimensions ---
  const glassHeight = 1.2;
  const glassRadiusOut = 0.35;
  const glassRadiusIn = 0.31;
  const glassBottomThick = 0.15;
  const liquidHeight = glassHeight - 0.1;

  // --- Glass Container (Lathe) ---
  // Profile: x (radius), y (height)
  const glassProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(glassRadiusOut, 0),
    new THREE.Vector2(glassRadiusOut, glassHeight),
    new THREE.Vector2(glassRadiusIn, glassHeight),
    new THREE.Vector2(glassRadiusIn, glassBottomThick),
    new THREE.Vector2(0, glassBottomThick),
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // --- Liquid ---
  const liquidGeom = new THREE.CylinderGeometry(glassRadiusIn - 0.01, glassRadiusIn - 0.01, liquidHeight, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = glassBottomThick + liquidHeight / 2;
  root.add(liquid);

  // --- Bubbles (InstancedMesh) ---
  const bubbleCount = 150;
  const bubbleGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const bubbles = new THREE.InstancedMesh(bubbleGeom, bubbleMat, bubbleCount);
  
  // Deterministic pseudo-random placement
  for (let i = 0; i < bubbleCount; i++) {
    const t = i / bubbleCount;
    // Use trigonometric functions for deterministic distribution
    const angle = i * 2.34; 
    const r = (glassRadiusIn - 0.05) * (0.1 + 0.8 * Math.abs(Math.sin(i * 13.5)));
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = glassBottomThick + (liquidHeight - 0.05) * (Math.abs(Math.sin(i * 7.2)));
    
    const scale = 0.5 + 0.5 * Math.abs(Math.sin(i * 3.1));
    
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Vector3(scale, scale, scale)
    );
    bubbles.setMatrixAt(i, matrix);
  }
  root.add(bubbles);

  // --- Flower Stem ---
  // Curve from bottom left to top right
  const stemPoints = [
    new THREE.Vector3(-glassRadiusIn + 0.05, glassBottomThick + 0.05, 0),
    new THREE.Vector3(-glassRadiusIn * 0.5, glassBottomThick + liquidHeight * 0.3, 0.05),
    new THREE.Vector3(0, glassBottomThick + liquidHeight * 0.7, -0.05),
    new THREE.Vector3(glassRadiusIn * 0.4, glassHeight + 0.1, 0),
  ];
  const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 20, 0.025, 8, false);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  root.add(stem);

  // --- Leaves ---
  // Attach 2 leaves to the stem curve
  function addLeaf(tParam, side, length, width) {
    const point = stemCurve.getPoint(tParam);
    const tangent = stemCurve.getTangent(tParam).normalize();
    
    // Create a leaf shape
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(length * 0.5, width, 0, length);
    leafShape.quadraticCurveTo(-length * 0.5, width, 0, 0);
    
    const leafGeom = new THREE.ExtrudeGeometry(leafShape, { depth: 0.01, bevelEnabled: false });
    const leaf = new THREE.Mesh(leafGeom, stemMat);
    
    // Orient leaf
    const up = new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const angle = Math.acos(up.dot(tangent));
    
    leaf.position.copy(point);
    leaf.rotateOnAxis(axis, angle);
    leaf.rotateZ(side * Math.PI / 4); // Flare out slightly
    leaf.translateY(0.02); // Offset from stem
    
    root.add(leaf);
  }
  
  addLeaf(0.3, 1, 0.15, 0.06);
  addLeaf(0.6, -1, 0.12, 0.05);

  // --- Flower Head ---
  const flowerGroup = new THREE.Group();
  const flowerPos = stemPoints[3];
  flowerGroup.position.copy(flowerPos);
  
  // Center
  const centerGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const center = new THREE.Mesh(centerGeom, flowerCenterMat);
  flowerGroup.add(center);

  // Petals (InstancedMesh)
  const petalCount = 24;
  const petalGeom = new THREE.ConeGeometry(0.025, 0.18, 8);
  // Cone points up by default, we want them radiating out.
  // We will rotate instances.
  const petals = new THREE.InstancedMesh(petalGeom, petalMat, petalCount);
  
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const tilt = Math.PI / 4; // Angle from vertical
    
    // Position on a ring around center
    const x = Math.cos(angle) * 0.05;
    const z = Math.sin(angle) * 0.05;
    const y = 0.05;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(x, y, z);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(tilt, angle, 0, 'YXZ'));
    const scale = new THREE.Vector3(0.6, 1, 0.6); // Flatten cone slightly
    
    matrix.compose(position, quaternion, scale);
    petals.setMatrixAt(i, matrix);
  }
  flowerGroup.add(petals);
  
  // Stamens (small lines sticking out from center)
  const stamenCount = 12;
  const stamenGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 4);
  const stamens = new THREE.InstancedMesh(stamenGeom, flowerCenterMat, stamenCount);
  
  for (let i = 0; i < stamenCount; i++) {
    const angle = (i / stamenCount) * Math.PI * 2;
    const x = Math.cos(angle) * 0.03;
    const z = Math.sin(angle) * 0.03;
    const y = 0.08;
    
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(Math.PI / 3, angle, 0, 'YXZ'));
    const position = new THREE.Vector3(x, y, z);
    const scale = new THREE.Vector3(1, 1, 1);
    
    matrix.compose(position, quaternion, scale);
    stamens.setMatrixAt(i, matrix);
  }
  flowerGroup.add(stamens);

  root.add(flowerGroup);

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