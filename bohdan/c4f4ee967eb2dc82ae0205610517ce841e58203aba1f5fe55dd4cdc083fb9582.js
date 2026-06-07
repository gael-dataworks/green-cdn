export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const frameHeight = 0.25;
  const mattressHeight = 0.30;
  const legHeight = 0.15;
  const legRadius = 0.04;

  // --- Materials ---
  // Frame: Dark gray upholstered fabric
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Legs: Black painted wood or metal
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Mattress: Off-white fabric
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Bedding (Duvet & Pillows): Light gray fabric
  const beddingMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Throw Blanket: Beige/Tan knit
  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xc4b098,
    metalness: 0.0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // --- Frame ---
  // Main upholstered box
  const frameGeom = new THREE.BoxGeometry(bedWidth, frameHeight, bedLength);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.y = frameHeight / 2 + legHeight;
  root.add(frame);

  // Add a subtle top edge detail (piping/seam simulation)
  const seamGeom = new THREE.BoxGeometry(bedWidth + 0.02, 0.02, bedLength + 0.02);
  const seam = new THREE.Mesh(seamGeom, frameMat);
  seam.position.y = frameHeight + legHeight;
  root.add(seam);

  // --- Legs ---
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
  const legPositions = [
    [bedWidth / 2 - 0.1, 0, bedLength / 2 - 0.1],
    [-bedWidth / 2 + 0.1, 0, bedLength / 2 - 0.1],
    [bedWidth / 2 - 0.1, 0, -bedLength / 2 + 0.1],
    [-bedWidth / 2 + 0.1, 0, -bedLength / 2 + 0.1],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- Mattress ---
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.05, mattressHeight, bedLength - 0.05);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = frameHeight + legHeight + mattressHeight / 2;
  root.add(mattress);

  // --- Pillows ---
  const pillowW = 0.7;
  const pillowD = 0.5;
  const pillowH = 0.15;
  const pillowGeom = new THREE.BoxGeometry(pillowW, pillowH, pillowD);
  
  // Left Pillow
  const pillowLeft = new THREE.Mesh(pillowGeom, beddingMat);
  pillowLeft.position.set(-bedWidth / 4, frameHeight + legHeight + mattressHeight + pillowH / 2, -bedLength / 2 + 0.3);
  pillowLeft.rotation.x = -0.3; // Tilt back against headboard area
  root.add(pillowLeft);

  // Right Pillow
  const pillowRight = new THREE.Mesh(pillowGeom, beddingMat);
  pillowRight.position.set(bedWidth / 4, frameHeight + legHeight + mattressHeight + pillowH / 2, -bedLength / 2 + 0.3);
  pillowRight.rotation.x = -0.3;
  root.add(pillowRight);

  // --- Duvet ---
  // Main body covering most of the bed
  const duvetH = 0.15;
  const duvetGeom = new THREE.BoxGeometry(bedWidth - 0.02, duvetH, bedLength - 0.5);
  const duvet = new THREE.Mesh(duvetGeom, beddingMat);
  duvet.position.y = frameHeight + legHeight + mattressHeight + duvetH / 2;
  duvet.position.z = 0.15; // Shifted slightly towards foot
  root.add(duvet);

  // Folded part at the head (top)
  const foldH = 0.06;
  const foldGeom = new THREE.BoxGeometry(bedWidth - 0.02, foldH, 0.45);
  const duvetFold = new THREE.Mesh(foldGeom, beddingMat);
  duvetFold.position.y = frameHeight + legHeight + mattressHeight + duvetH + foldH / 2;
  duvetFold.position.z = -bedLength / 2 + 0.25;
  duvetFold.rotation.x = -0.6; // Angled down to look folded over
  root.add(duvetFold);

  // --- Throw Blanket ---
  // Create a group to hold the blanket mesh and its fringes
  const throwGroup = new THREE.Group();
  
  const throwW = 0.9;
  const throwL = 1.1;
  const throwSegs = 24;
  const throwGeom = new THREE.PlaneGeometry(throwW, throwL, throwSegs, throwSegs);
  
  // Modify vertices to create deterministic folds/draping
  const posAttr = throwGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    
    // Deterministic noise for folds
    const noise = Math.sin(x * 6) * Math.cos(y * 4) * 0.04;
    // Drape curve: higher in middle, lower at edges
    const drape = Math.pow(x / (throwW / 2), 2) * 0.08;
    
    // Modify Z (normal of the plane) to create height variation
    posAttr.setZ(i, noise + drape);
  }
  throwGeom.computeVertexNormals();

  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  throwGroup.add(throwBlanket);

  // --- Fringes ---
  const fringeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6);
  const fringeCount = 18;
  const fringeStart = -throwW / 2 + 0.05;
  const fringeStep = (throwW - 0.1) / (fringeCount - 1);
  
  for (let i = 0; i < fringeCount; i++) {
    const fringe = new THREE.Mesh(fringeGeom, throwMat);
    // Position along the bottom edge of the plane (local Y = -throwL/2)
    const fx = fringeStart + i * fringeStep;
    const fy = -throwL / 2 - 0.045; // Hang off the edge
    const fz = 0;
    fringe.position.set(fx, fy, fz);
    // Rotate cylinder to hang down along local -Z (which becomes world -Y after group rotation)
    // Cylinder is Y-aligned. We want it aligned with Z.
    fringe.rotation.x = Math.PI / 2; 
    throwGroup.add(fringe);
  }
  
  // Position and orient the throw group
  // Place at foot of bed, slightly left
  throwGroup.position.set(-0.3, frameHeight + legHeight + mattressHeight + 0.05, 0.5);
  // Rotate to lie flat on bed (Plane XY -> World XZ)
  throwGroup.rotation.x = Math.PI / 2;
  // Slight tilt to look casual
  throwGroup.rotation.z = 0.15;
  throwGroup.rotation.y = 0.1;
  
  root.add(throwGroup);

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