export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige fabric body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xB8B5A0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Lime green accents (zipper, handle, loops)
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xD4FF00,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Helper: Create Rounded Rect Shape ---
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    const w = width;
    const h = height;
    const r = radius;

    shape.moveTo(x, y + r);
    shape.lineTo(x, y + h - r);
    shape.quadraticCurveTo(x, y + h, x + r, y + h);
    shape.lineTo(x + w - r, y + h);
    shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    shape.lineTo(x + w, y + r);
    shape.quadraticCurveTo(x + w, y, x + w - r, y);
    shape.lineTo(x + r, y);
    shape.quadraticCurveTo(x, y, x, y + r);
    return shape;
  }

  // --- Main Body ---
  // Profile: Width 0.5, Height 0.7, Top Radius 0.15
  const bodyShape = createRoundedRectShape(0.50, 0.70, 0.15);
  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry
  bodyGeom.center();
  const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(mainBody);

  // --- Front Pocket ---
  // Profile: Width 0.42, Height 0.25, Radius 0.05
  const pocketShape = createRoundedRectShape(0.42, 0.25, 0.05);
  const pocketGeom = new THREE.ExtrudeGeometry(pocketShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  pocketGeom.center();
  const frontPocket = new THREE.Mesh(pocketGeom, bodyMat);
  // Position on front face, lower half
  // Body depth is 0.25, so front face is at z = 0.125.
  // Pocket depth is 0.08, so offset by half of that + body half + small gap
  frontPocket.position.set(0, -0.20, 0.125 + 0.04 + 0.005);
  root.add(frontPocket);

  // --- Zipper Track ---
  // Curve going from front, over top, to back
  // Points in YZ plane (X=0)
  const zipperPoints = [
    new THREE.Vector3(0, -0.10, 0.135), // Start front
    new THREE.Vector3(0, 0.25, 0.135),  // Up front
    new THREE.Vector3(0, 0.36, 0.05),   // Top curve front
    new THREE.Vector3(0, 0.36, -0.05),  // Top curve back
    new THREE.Vector3(0, 0.25, -0.135), // Down back
    new THREE.Vector3(0, -0.10, -0.135) // End back
  ];
  const zipperCurve = new THREE.CatmullRomCurve3(zipperPoints);
  const zipperGeom = new THREE.TubeGeometry(zipperCurve, 20, 0.012, 8, false);
  const zipperTrack = new THREE.Mesh(zipperGeom, accentMat);
  root.add(zipperTrack);

  // --- Zipper Pull ---
  // Small tab at the front of the zipper
  const pullGeom = new THREE.BoxGeometry(0.025, 0.04, 0.01);
  const zipperPull = new THREE.Mesh(pullGeom, accentMat);
  // Position at start of zipper curve
  zipperPull.position.set(0, -0.10, 0.135 + 0.01);
  root.add(zipperPull);

  // --- Top Handle ---
  // Arching loop at the top center
  const handlePoints = [
    new THREE.Vector3(-0.08, 0.36, 0),
    new THREE.Vector3(0, 0.46, 0),
    new THREE.Vector3(0.08, 0.36, 0)
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  // Make it a closed loop for thickness, or just a thick tube
  // To make a loop, we need thickness in X direction too.
  // Let's use a TorusGeometry sliced, or just a thick Tube with circular profile?
  // TubeGeometry creates a pipe. We want a flat strap.
  // Let's use ExtrudeGeometry along the curve? No, Tube is easier.
  // To make it look like a strap, we can scale the tube or use a custom shape.
  // Simple Tube is fine for this resolution.
  const handleGeom = new THREE.TubeGeometry(handleCurve, 10, 0.015, 8, false);
  const handle = new THREE.Mesh(handleGeom, accentMat);
  root.add(handle);
  
  // Handle anchors (small pads where handle meets body)
  const anchorGeom = new THREE.BoxGeometry(0.04, 0.01, 0.03);
  const anchorLeft = new THREE.Mesh(anchorGeom, accentMat);
  anchorLeft.position.set(-0.08, 0.36, 0);
  root.add(anchorLeft);
  const anchorRight = new THREE.Mesh(anchorGeom, accentMat);
  anchorRight.position.set(0.08, 0.36, 0);
  root.add(anchorRight);

  // --- Side Loop (Left) ---
  // Small rectangular loop on the side
  const sideLoopPoints = [
    new THREE.Vector3(-0.26, -0.10, 0),
    new THREE.Vector3(-0.32, -0.10, 0),
    new THREE.Vector3(-0.32, -0.05, 0),
    new THREE.Vector3(-0.26, -0.05, 0)
  ];
  // Close the loop
  sideLoopPoints.push(sideLoopPoints[0]);
  const sideLoopCurve = new THREE.CatmullRomCurve3(sideLoopPoints);
  // TubeGeometry for the loop strap
  const sideLoopGeom = new THREE.TubeGeometry(sideLoopCurve, 8, 0.012, 6, false); // false = open, but points are closed
  // Actually TubeGeometry with closed=false draws a line. If points are closed, it draws a loop.
  // But TubeGeometry connects points with curves. For sharp corners, we need more points or LineCurve3 segments.
  // Let's just use a Torus slice or manual boxes for simplicity and sharpness.
  
  // Manual Side Loop construction (3 boxes: side, top, bottom)
  const strapW = 0.015;
  const strapH = 0.015; // thickness
  const loopW = 0.06; // protrusion
  const loopH = 0.05; // height
  
  const slSide = new THREE.Mesh(new THREE.BoxGeometry(strapW, loopH, strapH), accentMat);
  slSide.position.set(-0.26 - loopW/2, -0.075, 0);
  root.add(slSide);
  
  const slTop = new THREE.Mesh(new THREE.BoxGeometry(loopW, strapH, strapH), accentMat);
  slTop.position.set(-0.26 - loopW/2, -0.05 + strapH/2, 0);
  root.add(slTop);

  const slBot = new THREE.Mesh(new THREE.BoxGeometry(loopW, strapH, strapH), accentMat);
  slBot.position.set(-0.26 - loopW/2, -0.10 - strapH/2, 0);
  root.add(slBot);

  // --- Right Side Loop (Symmetric) ---
  const slSideR = new THREE.Mesh(new THREE.BoxGeometry(strapW, loopH, strapH), accentMat);
  slSideR.position.set(0.26 + loopW/2, -0.075, 0);
  root.add(slSideR);
  
  const slTopR = new THREE.Mesh(new THREE.BoxGeometry(loopW, strapH, strapH), accentMat);
  slTopR.position.set(0.26 + loopW/2, -0.05 + strapH/2, 0);
  root.add(slTopR);

  const slBotR = new THREE.Mesh(new THREE.BoxGeometry(loopW, strapH, strapH), accentMat);
  slBotR.position.set(0.26 + loopW/2, -0.10 - strapH/2, 0);
  root.add(slBotR);

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