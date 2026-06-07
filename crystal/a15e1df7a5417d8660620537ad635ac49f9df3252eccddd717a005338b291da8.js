export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue body: Matte plastic, vibrant blue.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e55d6,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Black cap: Matte plastic/rubber, dark.
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Cap (Base) ---
  // Standard flip-top cap shape, slightly wider than the neck.
  const capRadius = 0.16;
  const capHeight = 0.12;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = capHeight / 2;
  root.add(cap);

  // --- Body (Blue Bottle) ---
  // Profile for LatheGeometry. Defined from bottom (interface with cap) to top.
  // Coordinates are local to the body mesh before positioning.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.14, 0.00), // Neck base radius
    new THREE.Vector2(0.15, 0.05), // Slight ridge
    new THREE.Vector2(0.19, 0.35), // Max belly width
    new THREE.Vector2(0.18, 0.60), // Tapering up
    new THREE.Vector2(0.16, 0.80), // Neck
    new THREE.Vector2(0.15, 0.95), // Top rim
    new THREE.Vector2(0.00, 0.95), // Center top (to close volume)
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);

  // Apply slant to the top of the bottle.
  // We modify the vertices directly. The top is around y = 0.95.
  // We want the right side (positive x) to be lower than the left side (negative x)
  // based on the reference image orientation (slant goes down from left to right).
  // Actually, looking at the image, the high point is on the left, low on the right.
  const positions = bodyGeom.attributes.position;
  const vertex = new THREE.Vector3();
  const slantFactor = 0.35; // How steep the cut is
  const slantThreshold = 0.80; // Start slanting from this height

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    if (vertex.y > slantThreshold) {
      // Shear the Y coordinate based on X to create a diagonal plane
      // High X (right) -> Lower Y. Low X (left) -> Higher Y.
      // Formula: newY = oldY - (x * factor)
      // But we need to pivot around the center of the neck roughly.
      // Let's just offset Y based on X.
      const yOffset = -vertex.x * slantFactor;
      vertex.y += yOffset;
      positions.setY(i, vertex.y);
    }
  }
  
  // Recompute normals after vertex manipulation for correct lighting
  bodyGeom.computeVertexNormals();

  const body = new THREE.Mesh(bodyGeom, bodyMat);
  // Position body on top of the cap
  body.position.y = capHeight;
  root.add(body);

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