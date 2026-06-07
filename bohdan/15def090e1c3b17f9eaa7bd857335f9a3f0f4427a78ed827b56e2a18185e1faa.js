export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Canvas: Beige/Tan, high roughness, no metalness.
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xc2bca8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Zipper/Accents: Lime Green, plastic/nylon look.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xccff00,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Stitching: Slightly darker than canvas.
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0xa09a88,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Main Body ---
  // Shape: Rectangle with rounded top, extruded for depth.
  const bodyShape = new THREE.Shape();
  const bw = 0.35; // Half width
  const bh = 0.45; // Half height (approx)
  const topCurveY = 0.35;
  
  bodyShape.moveTo(-bw, -bh);
  bodyShape.lineTo(bw, -bh);
  bodyShape.lineTo(bw, topCurveY);
  // Quadratic curve for rounded top
  bodyShape.quadraticCurveTo(0, bh + 0.1, -bw, topCurveY);
  bodyShape.lineTo(-bw, -bh);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
    steps: 1,
  });
  
  // Center the geometry
  bodyGeom.center();
  
  const main_body = new THREE.Mesh(bodyGeom, canvasMat);
  root.add(main_body);

  // --- Front Pocket ---
  // Simple box attached to the front lower section.
  const pocketW = 0.55;
  const pocketH = 0.32;
  const pocketD = 0.12;
  const frontPocketGeom = new THREE.BoxGeometry(pocketW, pocketH, pocketD);
  // Round the top corners of the pocket slightly via scaling or just box is fine for low poly
  const front_pocket = new THREE.Mesh(frontPocketGeom, canvasMat);
  // Position: Front face (z is positive), lower half (y is negative)
  // Main body depth is 0.28 + bevels ~ 0.35 total. Front face is at ~0.175.
  front_pocket.position.set(0, -0.25, 0.20);
  root.add(front_pocket);

  // Pocket Top Rim/Stitching
  const pocketRimGeom = new THREE.BoxGeometry(pocketW + 0.02, 0.02, pocketD + 0.02);
  const pocket_rim = new THREE.Mesh(pocketRimGeom, canvasMat);
  pocket_rim.position.set(0, -0.09, 0.20);
  root.add(pocket_rim);

  // --- Zipper Track ---
  // Runs up the right side (viewer's right, object's +X), over the top, down the back.
  // Curve points in local space of the backpack.
  const zipperPoints = [
    new THREE.Vector3(0.20, -0.10, 0.18), // Start front right
    new THREE.Vector3(0.20, 0.35, 0.18),  // Up front right
    new THREE.Vector3(0.10, 0.52, 0.00),  // Curve top right
    new THREE.Vector3(0.00, 0.55, -0.15), // Top center back
    new THREE.Vector3(-0.10, 0.52, -0.15),// Top left back
    new THREE.Vector3(-0.20, 0.35, -0.15) // Down back left
  ];
  const zipperCurve = new THREE.CatmullRomCurve3(zipperPoints);
  const zipperGeom = new THREE.TubeGeometry(zipperCurve, 32, 0.018, 8, false);
  const zipper_track = new THREE.Mesh(zipperGeom, accentMat);
  root.add(zipper_track);

  // Zipper Pull Tab
  const pullGeom = new THREE.BoxGeometry(0.04, 0.06, 0.02);
  const zipper_pull = new THREE.Mesh(pullGeom, accentMat);
  zipper_pull.position.set(0.20, -0.15, 0.19);
  zipper_pull.rotation.x = 0.2;
  root.add(zipper_pull);

  // --- Top Handle ---
  // Loop at the very top.
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, 0.55, 0.05),
    new THREE.Vector3(0.08, 0.75, 0.05),
    new THREE.Vector3(-0.08, 0.75, 0.05),
    new THREE.Vector3(-0.08, 0.55, 0.05)
  ]);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 16, 0.025, 8, false);
  const top_handle = new THREE.Mesh(handleGeom, accentMat);
  root.add(top_handle);

  // --- Side Pocket (Left Side in Image) ---
  // Attached to the side (-X).
  const sidePocketShape = new THREE.Shape();
  sidePocketShape.moveTo(0, -0.3);
  sidePocketShape.lineTo(0.12, -0.3);
  sidePocketShape.lineTo(0.12, 0.1);
  sidePocketShape.quadraticCurveTo(0.06, 0.2, 0, 0.1);
  sidePocketShape.lineTo(0, -0.3);
  
  const sidePocketGeom = new THREE.ExtrudeGeometry(sidePocketShape, {
    depth: 0.15,
    bevelEnabled: false,
    steps: 1
  });
  // Rotate to face X axis
  sidePocketGeom.rotateY(Math.PI / 2);
  sidePocketGeom.center(); // Center locally then position
  
  const side_pocket = new THREE.Mesh(sidePocketGeom, canvasMat);
  side_pocket.position.set(-0.35, -0.15, 0.0);
  root.add(side_pocket);

  // Side Pocket Rim (Green)
  const rimShape = new THREE.Shape();
  rimShape.moveTo(0, -0.3);
  rimShape.lineTo(0.12, -0.3);
  rimShape.lineTo(0.12, 0.1);
  rimShape.quadraticCurveTo(0.06, 0.2, 0, 0.1);
  rimShape.lineTo(0, -0.3);
  // Make a hole for the rim thickness? No, just a thin extrusion on top.
  const sideRimGeom = new THREE.ExtrudeGeometry(rimShape, {
    depth: 0.02,
    bevelEnabled: false
  });
  sideRimGeom.rotateY(Math.PI / 2);
  const side_pocket_rim = new THREE.Mesh(sideRimGeom, accentMat);
  side_pocket_rim.position.set(-0.35, -0.15, 0.08); // Slightly offset from body
  root.add(side_pocket_rim);

  // --- Stitching Details ---
  // Vertical seam on the front left (viewer's left)
  const seamGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.8, 8);
  seamGeom.rotateX(Math.PI / 2);
  const front_seam = new THREE.Mesh(seamGeom, stitchMat);
  front_seam.position.set(-0.18, 0.1, 0.18);
  root.add(front_seam);

  // Bottom edge stitching
  const bottomSeamCurve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    0.35, 0.15,      // xRadius, yRadius
    0, 2 * Math.PI,  // aStartAngle, aEndAngle
    false,           // aClockwise
    0                // aRotation
  );
  // Approximate bottom edge with points
  const bottomPoints = [];
  for(let i=0; i<=20; i++) {
    const t = i/20;
    const angle = t * 2 * Math.PI;
    // Map ellipse to rounded rect bottom approx
    const x = (i < 5 || i > 15) ? (i < 5 ? -0.3 : 0.3) : (t - 0.25) * 0.6;
    const y = -0.45;
    const z = (i < 5 || i > 15) ? (Math.sin(angle) * 0.14) : 0; 
    // Simplified: Just a line across the bottom front
  }
  // Let's just add a simple tube along the bottom front edge
  const bottomSeamPoints = [
    new THREE.Vector3(-0.3, -0.45, 0.1),
    new THREE.Vector3(0.3, -0.45, 0.1)
  ];
  const bottomSeamCurveObj = new THREE.CatmullRomCurve3(bottomSeamPoints);
  const bottomSeamGeom = new THREE.TubeGeometry(bottomSeamCurveObj, 16, 0.005, 6, false);
  const bottom_seam = new THREE.Mesh(bottomSeamGeom, stitchMat);
  root.add(bottom_seam);

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