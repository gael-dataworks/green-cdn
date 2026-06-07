export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3d3d3d,
    metalness: 0.0,
    roughness: 0.9,
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    metalness: 0.0,
    roughness: 0.9,
  });

  const beddingMat = new THREE.MeshStandardMaterial({
    color: 0xdcdcdc,
    metalness: 0.0,
    roughness: 0.9,
  });

  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Dimensions ---
  const bedW = 1.6;
  const bedL = 2.1;
  const frameH = 0.30;
  const mattressH = 0.25;
  const legH = 0.12;
  const legR = 0.035;

  // --- Frame ---
  const frameGeom = new THREE.BoxGeometry(bedW, frameH, bedL);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.y = frameH / 2;
  root.add(frame);

  // --- Legs ---
  const legGeom = new THREE.CylinderGeometry(legR, legR, legH, 16);
  const legPositions = [
    [bedW / 2 - 0.1, legH / 2, bedL / 2 - 0.1],
    [-bedW / 2 + 0.1, legH / 2, bedL / 2 - 0.1],
    [bedW / 2 - 0.1, legH / 2, -bedL / 2 + 0.1],
    [-bedW / 2 + 0.1, legH / 2, -bedL / 2 + 0.1],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- Mattress ---
  const mattressGeom = new THREE.BoxGeometry(bedW - 0.05, mattressH, bedL - 0.05);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = frameH + mattressH / 2;
  root.add(mattress);

  // --- Duvet (Main Body) ---
  // Covers the foot and sides, puffy
  const duvetBaseH = 0.22;
  const duvetBaseGeom = new THREE.BoxGeometry(bedW - 0.02, duvetBaseH, bedL * 0.65);
  const duvetBase = new THREE.Mesh(duvetBaseGeom, beddingMat);
  duvetBase.position.set(0, frameH + mattressH + duvetBaseH / 2 - 0.02, bedL * 0.1);
  root.add(duvetBase);

  // --- Duvet (Fold at Head) ---
  // The part folded back over the top
  const duvetFoldGeom = new THREE.BoxGeometry(bedW - 0.02, 0.08, bedL * 0.45);
  const duvetFold = new THREE.Mesh(duvetFoldGeom, beddingMat);
  duvetFold.position.set(0, frameH + mattressH + duvetBaseH + 0.04, -bedL * 0.15);
  root.add(duvetFold);

  // --- Pillows ---
  const pillowW = 0.7;
  const pillowH = 0.12;
  const pillowD = 0.5;
  const pillowGeom = new THREE.BoxGeometry(pillowW, pillowH, pillowD);
  
  // Left Pillow
  const leftPillow = new THREE.Mesh(pillowGeom, beddingMat);
  leftPillow.position.set(-bedW / 4, frameH + mattressH + duvetBaseH + 0.06, -bedL / 2 + 0.35);
  leftPillow.rotation.x = -0.3; // Tilted back
  leftPillow.rotation.z = 0.1;  // Slight lean
  root.add(leftPillow);

  // Right Pillow
  const rightPillow = new THREE.Mesh(pillowGeom, beddingMat);
  rightPillow.position.set(bedW / 4, frameH + mattressH + duvetBaseH + 0.06, -bedL / 2 + 0.35);
  rightPillow.rotation.x = -0.3;
  rightPillow.rotation.z = -0.1;
  root.add(rightPillow);

  // --- Throw Blanket ---
  // Draped across the foot using a TubeGeometry curve
  const throwCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-bedW / 2 + 0.2, frameH + mattressH + 0.15, bedL / 2 - 0.3),
    new THREE.Vector3(-bedW / 4, frameH + mattressH + 0.05, bedL / 2 - 0.1),
    new THREE.Vector3(0, frameH + mattressH + 0.18, bedL / 2),
    new THREE.Vector3(bedW / 4, frameH + mattressH + 0.05, bedL / 2 + 0.1),
    new THREE.Vector3(bedW / 2 - 0.2, frameH + mattressH + 0.15, bedL / 2 + 0.3),
  ]);

  const throwGeom = new THREE.TubeGeometry(throwCurve, 20, 0.09, 8, false);
  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  root.add(throwBlanket);

  // --- Throw Fringe ---
  // Small cylinders along the front edge of the throw
  const fringeGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6);
  const fringeCount = 12;
  
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    // Sample points along the curve for position
    const point = throwCurve.getPoint(t);
    // Get tangent to orient fringe downwards
    const tangent = throwCurve.getTangent(t);
    
    const fringe = new THREE.Mesh(fringeGeom, throwMat);
    fringe.position.copy(point);
    fringe.position.y -= 0.06; // Hang down
    
    // Align with tangent roughly, but mostly vertical
    // Simple approach: just place them, maybe slight tilt
    fringe.lookAt(point.clone().add(tangent).add(new THREE.Vector3(0, -1, 0)));
    
    root.add(fringe);
  }

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