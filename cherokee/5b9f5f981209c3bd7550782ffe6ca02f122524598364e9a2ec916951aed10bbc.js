export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Fabric materials (nylon/polyester kite sail)
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  // Frame material (bamboo/wood)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.7,
    metalness: 0.0
  });

  // Binding tape (black reinforcement)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.0
  });

  // Tail line (white string)
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.0
  });

  // --- Geometry Constants ---
  // Kite dimensions (local units before normalization)
  const topY = 0.5;
  const tipY = -0.1;
  const bottomY = -0.4;
  const tipX = 0.6;
  const midX = 0.4;
  const innerX = 0.1;
  const seamY = 0.2;
  const lowerSeamY = -0.1;

  // --- Helper: Create Sail Panel ---
  function createPanel(points, material, zOffset) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();
    const geom = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.z = zOffset;
    return mesh;
  }

  // --- Helper: Create Seam Tape ---
  function addSeamTape(p1, p2, z) {
    const v1 = new THREE.Vector3(p1[0], p1[1], z);
    const v2 = new THREE.Vector3(p2[0], p2[1], z);
    const dist = v1.distanceTo(v2);
    const tapeGeom = new THREE.CylinderGeometry(0.006, 0.006, dist, 6);
    const tape = new THREE.Mesh(tapeGeom, blackMat);
    const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    tape.position.copy(mid);
    tape.lookAt(v2);
    tape.rotateX(Math.PI / 2); // Align cylinder (Y-axis) to lookAt direction (Z-axis)
    root.add(tape);
  }

  // --- SAIL PANELS ---
  // 1. Top Blue Triangle
  const topBluePanel = createPanel([
    [0, topY], [-innerX, seamY], [innerX, seamY]
  ], blueMat, 0.002);
  root.add(topBluePanel);

  // 2. Mid Red Left
  const midRedLeftPanel = createPanel([
    [-innerX, seamY], [0, seamY], [0, lowerSeamY], [-midX, lowerSeamY]
  ], redMat, 0.002);
  root.add(midRedLeftPanel);

  // 3. Mid Red Right
  const midRedRightPanel = createPanel([
    [innerX, seamY], [0, seamY], [0, lowerSeamY], [midX, lowerSeamY]
  ], redMat, 0.002);
  root.add(midRedRightPanel);

  // 4. Wing Blue Left
  const wingBlueLeftPanel = createPanel([
    [-midX, lowerSeamY], [0, lowerSeamY], [-tipX, tipY]
  ], blueMat, 0.002);
  root.add(wingBlueLeftPanel);

  // 5. Wing Blue Right
  const wingBlueRightPanel = createPanel([
    [midX, lowerSeamY], [0, lowerSeamY], [tipX, tipY]
  ], blueMat, 0.002);
  root.add(wingBlueRightPanel);

  // 6. Bottom Red Triangle
  const bottomRedPanel = createPanel([
    [0, lowerSeamY], [-midX, lowerSeamY], [0, bottomY], [midX, lowerSeamY]
  ], redMat, 0.002);
  root.add(bottomRedPanel);

  // --- FRAME (SPARS) ---
  // Central Spine
  const spineHeight = topY - bottomY;
  const spineGeom = new THREE.CylinderGeometry(0.008, 0.008, spineHeight, 8);
  const centralSpine = new THREE.Mesh(spineGeom, woodMat);
  centralSpine.position.y = (topY + bottomY) / 2;
  centralSpine.position.z = 0.005; // Slightly in front of sail
  root.add(centralSpine);

  // Cross Spar (Left)
  const leftSparGeom = new THREE.CylinderGeometry(0.008, 0.008, tipX, 8);
  const leftSpar = new THREE.Mesh(leftSparGeom, woodMat);
  const leftSparMidX = -tipX / 2;
  const leftSparMidY = (seamY + tipY) / 2;
  leftSpar.position.set(leftSparMidX, leftSparMidY, 0.005);
  const leftSparAngle = Math.atan2(tipY - seamY, -tipX);
  leftSpar.rotation.z = leftSparAngle;
  root.add(leftSpar);

  // Cross Spar (Right)
  const rightSpar = leftSpar.clone();
  rightSpar.position.set(-leftSparMidX, leftSparMidY, 0.005);
  rightSpar.rotation.z = -leftSparAngle;
  root.add(rightSpar);

  // --- BINDING TAPE (Seams) ---
  // Central vertical seams
  addSeamTape([0, topY], [0, seamY], 0.006);
  addSeamTape([0, seamY], [0, lowerSeamY], 0.006);
  addSeamTape([0, lowerSeamY], [0, bottomY], 0.006);

  // Horizontal seams
  addSeamTape([-innerX, seamY], [innerX, seamY], 0.006);
  addSeamTape([-midX, lowerSeamY], [midX, lowerSeamY], 0.006);

  // Diagonal seams (along spars)
  addSeamTape([0, seamY], [-tipX, tipY], 0.006);
  addSeamTape([0, seamY], [tipX, tipY], 0.006);

  // Perimeter tape (outer edges)
  addSeamTape([0, topY], [-tipX, tipY], 0.006);
  addSeamTape([-tipX, tipY], [0, bottomY], 0.006);
  addSeamTape([0, bottomY], [tipX, tipY], 0.006);
  addSeamTape([tipX, tipY], [0, topY], 0.006);

  // --- TAILS ---
  // Left Tail (Red ribbon)
  const leftTailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-tipX, tipY, 0),
    new THREE.Vector3(-tipX - 0.1, tipY - 0.3, 0.1),
    new THREE.Vector3(-tipX - 0.2, tipY - 0.6, -0.1),
    new THREE.Vector3(-tipX - 0.1, tipY - 0.9, 0.1)
  ]);
  const leftTailGeom = new THREE.TubeGeometry(leftTailCurve, 20, 0.015, 8, false);
  const leftTail = new THREE.Mesh(leftTailGeom, redMat);
  root.add(leftTail);

  // Right Tail (Blue ribbon)
  const rightTailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(tipX, tipY, 0),
    new THREE.Vector3(tipX + 0.1, tipY - 0.3, 0.1),
    new THREE.Vector3(tipX + 0.2, tipY - 0.6, -0.1),
    new THREE.Vector3(tipX + 0.1, tipY - 0.9, 0.1)
  ]);
  const rightTailGeom = new THREE.TubeGeometry(rightTailCurve, 20, 0.015, 8, false);
  const rightTail = new THREE.Mesh(rightTailGeom, blueMat);
  root.add(rightTail);

  // Center Line (White string)
  const centerLineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, bottomY, 0),
    new THREE.Vector3(0.1, bottomY - 0.5, 0.2),
    new THREE.Vector3(-0.1, bottomY - 1.0, -0.2),
    new THREE.Vector3(0.1, bottomY - 1.5, 0.2)
  ]);
  const centerLineGeom = new THREE.TubeGeometry(centerLineCurve, 30, 0.005, 8, false);
  const centerLine = new THREE.Mesh(centerLineGeom, whiteMat);
  root.add(centerLine);

  // Center Tail End (Red ribbon at bottom of line)
  const centerTailEndCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, bottomY - 1.5, 0.2),
    new THREE.Vector3(0.2, bottomY - 1.8, 0.3),
    new THREE.Vector3(0.1, bottomY - 2.1, 0.2)
  ]);
  const centerTailEndGeom = new THREE.TubeGeometry(centerTailEndCurve, 20, 0.02, 8, false);
  const centerTailEnd = new THREE.Mesh(centerTailEndGeom, redMat);
  root.add(centerTailEnd);

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