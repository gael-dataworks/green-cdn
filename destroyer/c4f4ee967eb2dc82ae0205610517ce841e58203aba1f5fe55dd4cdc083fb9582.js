export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3e3e3e,
    metalness: 0.0,
    roughness: 0.9,
  });

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.9,
  });

  const beddingMat = new THREE.MeshStandardMaterial({
    color: 0xdcdcdc,
    metalness: 0.0,
    roughness: 0.9,
  });

  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xbcaaa4,
    metalness: 0.0,
    roughness: 0.95,
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const frameHeight = 0.25;
  const mattressThickness = 0.28;
  const legHeight = 0.12;
  const legRadius = 0.035;

  // --- Frame Base ---
  const frameGeom = new THREE.BoxGeometry(bedWidth, frameHeight, bedLength);
  const frameBase = new THREE.Mesh(frameGeom, frameMat);
  frameBase.position.y = legHeight + frameHeight / 2;
  root.add(frameBase);

  // Frame Seams (upholstery detail)
  const seamOffset = 0.02;
  const seamThick = 0.005;
  const seamDepth = 0.01;
  
  // Horizontal seam around the frame
  const seamBoxGeom = new THREE.BoxGeometry(bedWidth + 0.01, seamThick, bedLength + 0.01);
  const seamBox = new THREE.Mesh(seamBoxGeom, seamMat);
  seamBox.position.y = legHeight + frameHeight * 0.6;
  root.add(seamBox);

  // Vertical corner seams
  function addCornerSeam(x, z) {
    const seamLeg = new THREE.Mesh(new THREE.CylinderGeometry(seamThick, seamThick, frameHeight * 0.8, 8), seamMat);
    seamLeg.position.set(x, legHeight + frameHeight * 0.5, z);
    root.add(seamLeg);
  }
  addCornerSeam(bedWidth / 2 - 0.05, bedLength / 2 - 0.05);
  addCornerSeam(-bedWidth / 2 + 0.05, bedLength / 2 - 0.05);
  addCornerSeam(bedWidth / 2 - 0.05, -bedLength / 2 + 0.05);
  addCornerSeam(-bedWidth / 2 + 0.05, -bedLength / 2 + 0.05);

  // --- Legs ---
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
  const legPositions = [
    [bedWidth / 2 - 0.15, bedLength / 2 - 0.15],
    [-bedWidth / 2 + 0.15, bedLength / 2 - 0.15],
    [bedWidth / 2 - 0.15, -bedLength / 2 + 0.15],
    [-bedWidth / 2 + 0.15, -bedLength / 2 + 0.15],
  ];

  for (const [x, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, legHeight / 2, z);
    root.add(leg);
  }

  // --- Mattress ---
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.04, mattressThickness, bedLength - 0.04);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = legHeight + frameHeight + mattressThickness / 2;
  root.add(mattress);

  // Mattress piping/edge
  const mattressEdgeGeom = new THREE.TorusGeometry(bedWidth / 2 - 0.02, 0.015, 8, 32);
  // Simplified edge: just a box outline for stability
  const mattressEdge = new THREE.Mesh(new THREE.BoxGeometry(bedWidth - 0.02, 0.03, bedLength - 0.02), seamMat);
  mattressEdge.position.y = legHeight + frameHeight + mattressThickness - 0.015;
  root.add(mattressEdge);

  // --- Duvet / Comforter ---
  // Main body covering the mattress
  const duvetGeom = new THREE.BoxGeometry(bedWidth - 0.02, 0.15, bedLength - 0.3);
  const duvet = new THREE.Mesh(duvetGeom, beddingMat);
  duvet.position.y = legHeight + frameHeight + mattressThickness + 0.075;
  duvet.position.z = 0.1; // Shifted slightly towards foot
  root.add(duvet);

  // Top fold (near pillows)
  const duvetFoldGeom = new THREE.BoxGeometry(bedWidth - 0.02, 0.08, 0.25);
  const duvetFold = new THREE.Mesh(duvetFoldGeom, beddingMat);
  duvetFold.position.y = legHeight + frameHeight + mattressThickness + 0.12;
  duvetFold.position.z = -bedLength / 2 + 0.4;
  duvetFold.rotation.x = -0.3; // Angled back slightly
  root.add(duvetFold);

  // Duvet wrinkles/folds (procedural bumps)
  function addDuvetFold(x, z, w, h, d, rotZ) {
    const fold = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), beddingMat);
    fold.position.set(x, duvet.position.y + 0.05, z);
    fold.rotation.z = rotZ;
    root.add(fold);
  }
  addDuvetFold(0.3, 0.4, 0.4, 0.04, 0.3, 0.2);
  addDuvetFold(-0.2, 0.6, 0.5, 0.05, 0.3, -0.1);

  // --- Pillows ---
  const pillowW = 0.65;
  const pillowH = 0.12;
  const pillowD = 0.45;
  
  function createPillow(x, z, rotY) {
    const pillowGeom = new THREE.BoxGeometry(pillowW, pillowH, pillowD);
    const pillow = new THREE.Mesh(pillowGeom, beddingMat);
    pillow.position.set(x, legHeight + frameHeight + mattressThickness + 0.15, z);
    pillow.rotation.x = -0.4; // Leaning back
    pillow.rotation.y = rotY;
    root.add(pillow);
    
    // Pillow puffiness (center bump)
    const puff = new THREE.Mesh(new THREE.BoxGeometry(pillowW * 0.6, pillowH * 0.4, pillowD * 0.6), beddingMat);
    puff.position.copy(pillow.position);
    puff.position.y += 0.06;
    puff.rotation.copy(pillow.rotation);
    root.add(puff);
  }

  createPillow(-0.35, -bedLength / 2 + 0.35, 0.1);
  createPillow(0.35, -bedLength / 2 + 0.35, -0.1);

  // --- Throw Blanket ---
  // Draped over the foot-left corner
  const throwW = 0.7;
  const throwL = 0.9;
  const throwGeom = new THREE.BoxGeometry(throwW, 0.02, throwL);
  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  throwBlanket.position.set(-0.4, legHeight + frameHeight + mattressThickness + 0.16, 0.6);
  throwBlanket.rotation.z = 0.15;
  throwBlanket.rotation.x = 0.1;
  root.add(throwBlanket);

  // Throw folds
  const throwFold1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), throwMat);
  throwFold1.rotation.x = Math.PI / 2;
  throwFold1.position.set(-0.5, legHeight + frameHeight + mattressThickness + 0.18, 0.5);
  throwFold1.rotation.z = 0.2;
  root.add(throwFold1);

  const throwFold2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), throwMat);
  throwFold2.rotation.x = Math.PI / 2;
  throwFold2.position.set(-0.3, legHeight + frameHeight + mattressThickness + 0.19, 0.7);
  throwFold2.rotation.z = -0.1;
  root.add(throwFold2);

  // Fringe (simple lines/cylinders at the end)
  const fringeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.12, 4);
  for (let i = 0; i < 8; i++) {
    const fringe = new THREE.Mesh(fringeGeom, throwMat);
    const fx = -0.7 + (i * 0.15);
    const fz = 0.95;
    fringe.position.set(fx, legHeight + frameHeight + mattressThickness + 0.1, fz);
    fringe.rotation.x = Math.PI / 2 + 0.2;
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