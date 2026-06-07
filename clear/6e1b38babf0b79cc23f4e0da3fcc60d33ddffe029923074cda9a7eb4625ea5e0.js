export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc5,
    metalness: 0.0,
    roughness: 0.6,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const seatW = 0.48;
  const seatD = 0.42;
  const seatH = 0.04;
  const seatY = 0.45;
  
  const legR_bottom = 0.035;
  const legR_top = 0.030;
  const legHeight = 0.45;
  
  const backrestW = 0.52;
  const backrestH = 0.10;
  const backrestThickness = 0.025;
  const backrestY = 0.75;
  const backrestCurveRadius = 0.60;

  // --- Seat ---
  // Using a box for the main seat volume
  const seatGeom = new THREE.BoxGeometry(seatW, seatH, seatD);
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.y = seatY;
  // Round the front corners visually by scaling or just accept box for now
  // To make it look nicer, we can use a slightly rounded box approach or just trust the material
  root.add(seat);

  // --- Front Legs ---
  const frontLegGeom = new THREE.CylinderGeometry(legR_bottom, legR_top, legHeight, 16);
  // Front legs are straight but splayed slightly outward
  const frontLegOffsetX = seatW / 2 - 0.05;
  const frontLegOffsetZ = seatD / 2 - 0.05;
  
  const fl_left = new THREE.Mesh(frontLegGeom, woodMat);
  fl_left.position.set(-frontLegOffsetX, seatY - legHeight / 2, frontLegOffsetZ);
  fl_left.rotation.z = 0.08; // Slight outward splay
  root.add(fl_left);

  const fl_right = new THREE.Mesh(frontLegGeom, woodMat);
  fl_right.position.set(frontLegOffsetX, seatY - legHeight / 2, frontLegOffsetZ);
  fl_right.rotation.z = -0.08;
  root.add(fl_right);

  // --- Rear Legs (Curved) ---
  // Path from floor to backrest top
  // Floor point is further out, seat point is under corner, top point is backrest support
  const rearLegPathPoints = [
    new THREE.Vector3(-seatW / 2 + 0.08, 0, seatD / 2 + 0.05), // Left Floor (splayed out)
    new THREE.Vector3(-seatW / 2 + 0.02, legHeight * 0.4, seatD / 2 - 0.02), // Left Knee
    new THREE.Vector3(-seatW / 2 + 0.02, seatY, seatD / 2 - 0.02), // Left Seat Joint
    new THREE.Vector3(-seatW / 2 + 0.05, backrestY, -0.05), // Left Backrest Top
  ];
  
  const rearLegCurveLeft = new THREE.CatmullRomCurve3(rearLegPathPoints);
  const rearLegGeomLeft = new THREE.TubeGeometry(rearLegCurveLeft, 20, 0.032, 12, false);
  const rearLegLeft = new THREE.Mesh(rearLegGeomLeft, woodMat);
  root.add(rearLegLeft);

  const rearLegPathPointsRight = [
    new THREE.Vector3(seatW / 2 - 0.08, 0, seatD / 2 + 0.05), // Right Floor
    new THREE.Vector3(seatW / 2 - 0.02, legHeight * 0.4, seatD / 2 - 0.02), // Right Knee
    new THREE.Vector3(seatW / 2 - 0.02, seatY, seatD / 2 - 0.02), // Right Seat Joint
    new THREE.Vector3(seatW / 2 - 0.05, backrestY, -0.05), // Right Backrest Top
  ];

  const rearLegCurveRight = new THREE.CatmullRomCurve3(rearLegPathPointsRight);
  const rearLegGeomRight = new THREE.TubeGeometry(rearLegCurveRight, 20, 0.032, 12, false);
  const rearLegRight = new THREE.Mesh(rearLegGeomRight, woodMat);
  root.add(rearLegRight);

  // --- Center Back Support ---
  // Vertical post from seat back edge to backrest center
  const supportHeight = backrestY - seatY;
  const supportGeom = new THREE.CylinderGeometry(0.025, 0.025, supportHeight, 12);
  const centerSupport = new THREE.Mesh(supportGeom, woodMat);
  centerSupport.position.set(0, seatY + supportHeight / 2, -seatD / 2 + 0.02);
  root.add(centerSupport);

  // --- Backrest ---
  // Curved horizontal slat. Using ExtrudeGeometry along an ArcCurve for the horizontal curve.
  const backShape = new THREE.Shape();
  const bw = backrestW / 2;
  const bh = backrestH / 2;
  // Draw a rounded rectangle profile for the cross-section of the backrest
  backShape.moveTo(-bw, -bh);
  backShape.lineTo(bw, -bh);
  backShape.lineTo(bw, bh);
  backShape.lineTo(-bw, bh);
  backShape.lineTo(-bw, -bh);

  const backCurve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    backrestCurveRadius, backrestCurveRadius, // xRadius, yRadius
    Math.PI - 0.45, Math.PI + 0.45, // aStartAngle, aEndAngle (curved backwards)
    false,           // aClockwise
    0                // aRotation
  );
  
  const backPoints = backCurve.getPoints(20);
  // Convert 2D points to 3D Vector3 for CurvePath (in XZ plane)
  const path3D = new THREE.CatmullRomCurve3(backPoints.map(p => new THREE.Vector3(p.x, 0, p.y)));

  const backrestGeom = new THREE.ExtrudeGeometry(backShape, {
    extrudePath: path3D,
    steps: 20,
    bevelEnabled: false,
  });

  const backrest = new THREE.Mesh(backrestGeom, woodMat);
  // Position the backrest. The extrusion happens from the shape plane.
  // We need to rotate and position it to sit on top of the legs.
  // The curve is in XZ. The shape is in XY (relative to path).
  // We want the backrest to be vertical (Y up) and curved in X.
  // The EllipseCurve above creates points in XY. We mapped them to XZ (x, 0, y).
  // So the path lies on the floor (XZ). The shape extrudes along Y.
  // This creates a vertical curved wall.
  backrest.position.set(0, backrestY, -0.05);
  root.add(backrest);

  // --- Feet ---
  const footGeom = new THREE.CylinderGeometry(0.036, 0.036, 0.01, 12);
  
  // Front Feet
  const footFL = new THREE.Mesh(footGeom, footMat);
  footFL.position.copy(fl_left.position).setY(0.005);
  // Match leg rotation roughly for flat contact, or just flat on floor
  footFL.rotation.z = fl_left.rotation.z; 
  root.add(footFL);

  const footFR = new THREE.Mesh(footGeom, footMat);
  footFR.position.copy(fl_right.position).setY(0.005);
  footFR.rotation.z = fl_right.rotation.z;
  root.add(footFR);

  // Rear Feet (approximate position at bottom of tube)
  const footRL = new THREE.Mesh(footGeom, footMat);
  footRL.position.copy(rearLegPathPoints[0]).setY(0.005);
  root.add(footRL);

  const footRR = new THREE.Mesh(footGeom, footMat);
  footRR.position.copy(rearLegPathPointsRight[0]).setY(0.005);
  root.add(footRR);

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