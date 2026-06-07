export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Black leather: matte, high roughness, no metalness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Cord material: similar to leather but slightly different sheen.
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Stitching thread: slightly lighter grey to be visible against black leather.
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- 1. Leather Body ---
  // Shape: Tapered triangle with rounded bottom.
  const bodyShape = new THREE.Shape();
  const topWidth = 0.28;
  const bodyHeight = 0.65;
  const bottomRadius = 0.04;

  // Start top-left
  bodyShape.moveTo(-topWidth / 2, bodyHeight / 2);
  // Top edge
  bodyShape.lineTo(topWidth / 2, bodyHeight / 2);
  // Right side tapering down
  bodyShape.lineTo(bottomRadius, -bodyHeight / 2 + bottomRadius);
  // Rounded bottom
  bodyShape.absarc(0, -bodyHeight / 2 + bottomRadius, bottomRadius, 0, Math.PI, true);
  // Left side tapering up
  bodyShape.lineTo(-topWidth / 2, bodyHeight / 2);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });

  const body = new THREE.Mesh(bodyGeom, leatherMat);
  // Center the geometry locally so pivot is at the knot attachment point later if needed
  // ExtrudeGeometry centers by default somewhat, but let's ensure it sits nicely.
  // The shape was drawn from -h/2 to h/2, so it's vertically centered.
  root.add(body);

  // --- 2. Stitching ---
  // Create a path following the perimeter of the front face, slightly offset in Z.
  const stitchPoints = [];
  const offsetZ = 0.025; // Slightly in front of the front face (depth is 0.04 + bevels)
  const segments = 40;

  // We reconstruct the path points mathematically to match the shape
  // Top edge
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    stitchPoints.push(new THREE.Vector3(
      THREE.MathUtils.lerp(-topWidth / 2 + 0.02, topWidth / 2 - 0.02, t),
      bodyHeight / 2 - 0.02,
      offsetZ
    ));
  }
  // Right side
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(topWidth / 2 - 0.02, bottomRadius, t);
    const y = THREE.MathUtils.lerp(bodyHeight / 2 - 0.02, -bodyHeight / 2 + bottomRadius, t);
    stitchPoints.push(new THREE.Vector3(x, y, offsetZ));
  }
  // Bottom arc
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI + (Math.PI * i) / segments; // PI to 2PI (or 0 to PI depending on coord sys)
    // Arc is from right side bottom to left side bottom.
    // Center at (0, -bodyHeight/2 + bottomRadius)
    const cx = 0;
    const cy = -bodyHeight / 2 + bottomRadius;
    // Angle from 0 (right) to PI (left) going counter-clockwise? 
    // Shape drawing: LineTo(right_bottom), absarc(..., 0, Math.PI, true). 
    // In Three.js Shape, absarc 0 to PI draws the bottom half.
    const a = Math.PI - (Math.PI * i) / segments; 
    stitchPoints.push(new THREE.Vector3(
      cx + Math.cos(a) * bottomRadius,
      cy + Math.sin(a) * bottomRadius,
      offsetZ
    ));
  }
  // Left side
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = THREE.MathUtils.lerp(-bottomRadius, -topWidth / 2 + 0.02, t);
    const y = THREE.MathUtils.lerp(-bodyHeight / 2 + bottomRadius, bodyHeight / 2 - 0.02, t);
    stitchPoints.push(new THREE.Vector3(x, y, offsetZ));
  }

  const stitchCurve = new THREE.CatmullRomCurve3(stitchPoints);
  stitchCurve.closed = true;
  const stitchGeom = new THREE.TubeGeometry(stitchCurve, 64, 0.004, 8, true);
  const stitching = new THREE.Mesh(stitchGeom, stitchMat);
  root.add(stitching);

  // --- 3. Knot ---
  // A simple knot at the top center.
  // Using a TorusKnot for a generic knotted look, scaled down.
  const knotGeom = new THREE.TorusKnotGeometry(0.035, 0.012, 64, 8, 2, 3);
  const knot = new THREE.Mesh(knotGeom, cordMat);
  knot.position.set(0, bodyHeight / 2 + 0.04, 0);
  // Rotate to align with the cord loop
  knot.rotation.x = Math.PI / 2; 
  knot.rotation.y = Math.PI / 4;
  root.add(knot);

  // --- 4. Cord Loop ---
  // A torus standing vertically.
  const loopRadius = 0.09;
  const tubeRadius = 0.012;
  const loopGeom = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 32);
  const loop = new THREE.Mesh(loopGeom, cordMat);
  // Torus is in XY plane by default. We want it in YZ plane (standing up).
  loop.rotation.x = Math.PI / 2;
  loop.position.set(0, bodyHeight / 2 + 0.04 + loopRadius, 0);
  root.add(loop);

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