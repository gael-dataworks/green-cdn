export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished metal for rim and hooks
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Wire mesh material (slightly darker/thinner look)
  const meshMat = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.8,
  });

  // Light wood for handle and reinforcement band
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c08d,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Constants ---
  const rimRadius = 0.35;
  const rimTube = 0.018;
  const bowlDepth = 0.32; // Slightly less than radius for shallow bowl
  const handleLength = 0.45;
  const handleWidth = 0.07;
  const handleThickness = 0.015;

  // --- 1. Rim (Torus) ---
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 24, 64);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  root.add(rim);

  // --- 2. Mesh Bowl (LineSegments) ---
  // Create a hemispherical grid of lines
  const meshGroup = new THREE.Group();
  const segmentsLat = 20; // Rings
  const segmentsLon = 32; // Spokes
  const meshRadius = rimRadius - rimTube; // Fit inside rim

  // Concentric rings
  for (let i = 1; i <= segmentsLat; i++) {
    const phi = (i / segmentsLat) * (Math.PI / 2);
    const y = Math.cos(phi) * meshRadius;
    const r = Math.sin(phi) * meshRadius;
    const ringGeom = new THREE.RingGeometry(r - 0.001, r + 0.001, segmentsLon);
    // RingGeometry is in XY plane, need to rotate to XZ and move Y
    // Actually easier to use Torus with tiny tube or just LineLoop
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.0015, 8, segmentsLon),
      meshMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -y; // Bowl hangs down (-Y)
    meshGroup.add(ring);
  }

  // Meridian spokes (curved lines)
  // Using TubeGeometry for smooth curves
  for (let i = 0; i < segmentsLon; i++) {
    const theta = (i / segmentsLon) * Math.PI * 2;
    const points = [];
    for (let j = 0; j <= 20; j++) {
      const phi = (j / 20) * (Math.PI / 2);
      const y = -Math.cos(phi) * meshRadius;
      const r = Math.sin(phi) * meshRadius;
      points.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const spoke = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, 0.0015, 8, false),
      meshMat
    );
    meshGroup.add(spoke);
  }
  root.add(meshGroup);

  // --- 3. Reinforcement Band (Wood) ---
  // A wooden ring around the middle of the bowl
  const bandY = -meshRadius * 0.6;
  const bandR = Math.sqrt(meshRadius * meshRadius - bandY * bandY);
  const bandGeom = new THREE.TorusGeometry(bandR, 0.025, 16, 64);
  const band = new THREE.Mesh(bandGeom, woodMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = bandY;
  root.add(band);

  // --- 4. Handle (Extruded Wood) ---
  // Shape: Tapered rectangle with rounded end and hole
  const handleShape = new THREE.Shape();
  const hw = handleWidth / 2;
  const hl = handleLength;
  const holeR = 0.015;
  const holeDist = 0.04; // from end

  // Outline
  handleShape.moveTo(-hw, 0);
  handleShape.lineTo(-hw, hl);
  // Rounded end
  handleShape.absarc(0, hl, hw, Math.PI, 0, false);
  handleShape.lineTo(hw, 0);
  handleShape.lineTo(0, 0); // Close at attachment point (center)

  // Hole path (counter-clockwise for hole)
  const holePath = new THREE.Path();
  holePath.absarc(0, hl - holeDist, holeR, 0, Math.PI * 2, true);
  handleShape.holes.push(holePath);

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: handleThickness,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Center the geometry locally so attachment point is at origin
  handleGeom.center(); 
  // The extrusion is along Z. We want it along X.
  handle.rotation.z = Math.PI / 2;
  handle.position.x = rimRadius + (handleLength / 2) + 0.02; // Offset from rim center
  // Adjust position to attach cleanly to rim
  handle.position.x = rimRadius + 0.02; 
  handle.position.y = 0;
  root.add(handle);

  // --- 5. Hooks/Rests (Metal Tubes) ---
  // Two hooks on the opposite side of the handle (-X)
  function createHook(sideZ) {
    // Curve starts at rim attachment, goes down, hooks in
    const attachX = -rimRadius;
    const attachY = 0;
    const attachZ = sideZ * (rimRadius * 0.6); // Attached on the side of the rim

    const points = [
      new THREE.Vector3(attachX, attachY, attachZ),
      new THREE.Vector3(attachX - 0.05, attachY - 0.08, attachZ), // Down and out
      new THREE.Vector3(attachX - 0.12, attachY - 0.15, attachZ), // Further down
      new THREE.Vector3(attachX - 0.15, attachY - 0.15, attachZ + sideZ * 0.05), // Hook inward
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const hook = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, 0.004, 12, false),
      metalMat
    );
    return hook;
  }

  const hookLeft = createHook(1);
  const hookRight = createHook(-1);
  root.add(hookLeft);
  root.add(hookRight);

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