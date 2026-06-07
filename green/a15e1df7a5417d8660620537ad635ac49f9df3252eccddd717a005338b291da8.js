export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue matte plastic for body and cap
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2b55cc,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Black rubber/plastic for the base
  const blackBaseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Geometry Construction ---

  // 1. Base (Black bottom cap)
  // Simple cylinder, slightly wider than the bottle bottom
  const baseRadius = 0.28;
  const baseHeight = 0.08;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, blackBaseMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // 2. Main Body (Blue ergonomic curve)
  // Profile points [radius, y] relative to the start of the body (top of base)
  // Body starts at y=0 (local to body mesh), which is world y = baseHeight
  const bodyProfilePoints = [
    new THREE.Vector2(0.0, 0.0),          // Center bottom (closed)
    new THREE.Vector2(0.26, 0.0),         // Bottom edge (slightly narrower than base)
    new THREE.Vector2(0.27, 0.15),        // Start of curve
    new THREE.Vector2(0.33, 0.55),        // Max width (grip area)
    new THREE.Vector2(0.30, 0.85),        // Tapering up
    new THREE.Vector2(0.26, 1.05),        // Neck start
    new THREE.Vector2(0.26, 1.15),        // Neck end (before cap)
    new THREE.Vector2(0.0, 1.15),         // Center top (closed)
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, bluePlasticMat);
  body.position.y = baseHeight; // Sit on top of base
  root.add(body);

  // 3. Cap (Blue top part)
  // Slightly angled or distinct shape. In the image it looks like a flip cap.
  // We'll model it as a slightly tapered cylinder with a rounded top.
  const capHeight = 0.35;
  const capBottomRadius = 0.26;
  const capTopRadius = 0.22;
  
  const capProfilePoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(capBottomRadius, 0.0),
    new THREE.Vector2(capBottomRadius, 0.05), // Small lip
    new THREE.Vector2(capTopRadius, capHeight - 0.05),
    new THREE.Vector2(capTopRadius, capHeight),
    new THREE.Vector2(0.0, capHeight),
  ];

  const capGeom = new THREE.LatheGeometry(capProfilePoints, 32);
  const cap = new THREE.Mesh(capGeom, bluePlasticMat);
  // Position cap on top of the body neck
  // Body neck top is at baseHeight + 1.15
  cap.position.y = baseHeight + 1.15;
  root.add(cap);

  // 4. Seam Detail (Optional thin ring to emphasize cap separation)
  const seamGeom = new THREE.TorusGeometry(capBottomRadius, 0.005, 8, 32);
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x1a40a0, metalness: 0.0, roughness: 0.5 });
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = baseHeight + 1.15;
  root.add(seam);

  // Normalize to fit unit cube
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