export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Black leather: matte, high roughness, no metalness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Black cord/rope: similar to leather but maybe slightly different roughness.
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Stitching thread: slightly lighter dark gray to be visible against black leather.
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Body (Leather Pendant) ---
  // Shape: Inverted rounded triangle / teardrop.
  const bodyShape = new THREE.Shape();
  const topWidth = 0.18;
  const bodyHeight = 0.55;
  const bottomWidth = 0.04;
  const cornerRadius = 0.025;

  // Start top-left
  bodyShape.moveTo(-topWidth + cornerRadius, bodyHeight / 2);
  // Top edge
  bodyShape.lineTo(topWidth - cornerRadius, bodyHeight / 2);
  // Top-right corner
  bodyShape.quadraticCurveTo(topWidth, bodyHeight / 2, topWidth, bodyHeight / 2 - cornerRadius);
  // Right side tapering down
  bodyShape.lineTo(bottomWidth / 2 + cornerRadius, -bodyHeight / 2 + cornerRadius);
  // Bottom tip (rounded)
  bodyShape.quadraticCurveTo(0, -bodyHeight / 2, -bottomWidth / 2 - cornerRadius, -bodyHeight / 2 + cornerRadius);
  // Left side tapering up
  bodyShape.lineTo(-topWidth, bodyHeight / 2 - cornerRadius);
  // Top-left corner
  bodyShape.quadraticCurveTo(-topWidth, bodyHeight / 2, -topWidth + cornerRadius, bodyHeight / 2);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });

  const body = new THREE.Mesh(bodyGeom, leatherMat);
  // Center the geometry vertically so y=0 is the middle of the pendant
  bodyGeom.center(); 
  root.add(body);

  // --- Stitching ---
  // Two lines of stitching running along the sides.
  // We use thin TubeGeometry for the thread.
  const stitchPathLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-topWidth + 0.03, bodyHeight / 2 - 0.05, 0.018),
    new THREE.Vector3(-bottomWidth / 2 - 0.01, -bodyHeight / 2 + 0.05, 0.018),
  ]);
  
  const stitchPathRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(topWidth - 0.03, bodyHeight / 2 - 0.05, 0.018),
    new THREE.Vector3(bottomWidth / 2 + 0.01, -bodyHeight / 2 + 0.05, 0.018),
  ]);

  const stitchGeomLeft = new THREE.TubeGeometry(stitchPathLeft, 20, 0.004, 8, false);
  const stitchGeomRight = new THREE.TubeGeometry(stitchPathRight, 20, 0.004, 8, false);

  const stitchLeft = new THREE.Mesh(stitchGeomLeft, stitchMat);
  const stitchRight = new THREE.Mesh(stitchGeomRight, stitchMat);
  root.add(stitchLeft);
  root.add(stitchRight);

  // --- Knot ---
  // A small knot at the top center where the cord attaches.
  // Using a TorusKnotGeometry scaled down to look like a tangled knot.
  const knotGeom = new THREE.TorusKnotGeometry(0.025, 0.008, 64, 8, 2, 3);
  const knot = new THREE.Mesh(knotGeom, cordMat);
  knot.position.set(0, bodyHeight / 2 + 0.02, 0);
  knot.rotation.set(0.5, 0, 0); // Tilt slightly
  knot.scale.set(1, 1, 0.6); // Flatten slightly
  root.add(knot);

  // --- Cord Loop ---
  // A loop of cord hanging from the knot.
  const loopHeight = 0.25;
  const loopWidth = 0.12;
  
  // Define the path for the loop: starts at knot, goes up, curves, comes down.
  const loopPoints = [
    new THREE.Vector3(0, bodyHeight / 2 + 0.02, 0), // Start at knot base
    new THREE.Vector3(0, bodyHeight / 2 + 0.02, -0.02), // Slight back
    new THREE.Vector3(-loopWidth / 2, bodyHeight / 2 + loopHeight, -0.02), // Top left
    new THREE.Vector3(0, bodyHeight / 2 + loopHeight + 0.05, 0), // Top center apex
    new THREE.Vector3(loopWidth / 2, bodyHeight / 2 + loopHeight, -0.02), // Top right
    new THREE.Vector3(0, bodyHeight / 2 + 0.02, -0.02), // End at knot base (back)
  ];
  
  const loopCurve = new THREE.CatmullRomCurve3(loopPoints);
  // Ensure the curve is closed smoothly if needed, but here we want it to merge into the knot.
  // Actually, let's make a full loop that passes through the knot area.
  // Simpler approach: A torus that is scaled and positioned.
  
  const loopTorusGeom = new THREE.TorusGeometry(loopWidth / 2, 0.009, 16, 32, Math.PI);
  const loopTorus = new THREE.Mesh(loopTorusGeom, cordMat);
  loopTorus.position.set(0, bodyHeight / 2 + loopHeight / 2 + 0.02, -0.02);
  loopTorus.rotation.x = Math.PI; // Flip to arch upwards
  
  // We need to close the loop at the bottom. The TorusGeometry with Math.PI is a semi-circle.
  // Let's use a full TubeGeometry with a closed curve for better control.
  
  const closedLoopPoints = [
    new THREE.Vector3(0, bodyHeight / 2 + 0.03, 0.01), // Front of knot
    new THREE.Vector3(-loopWidth / 2, bodyHeight / 2 + loopHeight, 0), // Left top
    new THREE.Vector3(0, bodyHeight / 2 + loopHeight + 0.04, -0.03), // Back top
    new THREE.Vector3(loopWidth / 2, bodyHeight / 2 + loopHeight, 0), // Right top
    new THREE.Vector3(0, bodyHeight / 2 + 0.03, 0.01), // Close loop
  ];
  
  const closedLoopCurve = new THREE.CatmullRomCurve3(closedLoopPoints);
  closedLoopCurve.closed = true;
  
  const cordLoopGeom = new THREE.TubeGeometry(closedLoopCurve, 40, 0.009, 12, true);
  const cordLoop = new THREE.Mesh(cordLoopGeom, cordMat);
  root.add(cordLoop);

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