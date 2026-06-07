export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Taupe/Beige fabric for duvet and pillows
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb8afa6,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Slightly darker fabric for seams/shadows to enhance quilted look
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x968e85,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Dark metal for legs
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.4,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const mattressHeight = 0.25;
  const duvetThickness = 0.12;
  const pillowWidth = 0.7;
  const pillowLength = 0.5;
  const pillowHeight = 0.18;

  // --- 1. Mattress Base ---
  // Mostly hidden, but provides structure under the duvet
  const mattressGeom = new THREE.BoxGeometry(bedWidth, mattressHeight, bedLength);
  const mattress = new THREE.Mesh(mattressGeom, fabricMat);
  mattress.position.y = mattressHeight / 2;
  root.add(mattress);

  // --- 2. Duvet (Comforter) ---
  // The duvet is constructed from a grid of "puffy" squares on top,
  // and draped panels on the sides/foot.

  const quiltCols = 4;
  const quiltRows = 6;
  const puffWidth = (bedWidth - 0.1) / quiltCols;
  const puffLength = (bedLength - 0.4) / quiltRows; // Leave room for fold at top
  const puffHeight = 0.06;

  const puffGeom = new THREE.BoxGeometry(puffWidth - 0.01, puffHeight, puffLength - 0.01);

  // Top Grid of Puffs
  // Positioned slightly above the mattress to account for fold
  const gridStartZ = -bedLength / 2 + 0.3; // Offset from head for fold
  const gridStartX = -bedWidth / 2 + puffWidth / 2;
  
  for (let r = 0; r < quiltRows; r++) {
    for (let c = 0; c < quiltCols; c++) {
      const puff = new THREE.Mesh(puffGeom, fabricMat);
      const x = gridStartX + c * puffWidth;
      const z = gridStartZ + r * puffLength;
      // Add slight random-looking variation using deterministic math (sine) for natural look
      const yOffset = Math.sin(c * 1.5) * Math.cos(r * 1.2) * 0.01; 
      puff.position.set(x, mattressHeight + puffHeight / 2 + yOffset, z);
      root.add(puff);
    }
  }

  // Seams (Grid lines) to define the squares clearly
  const seamDepth = 0.02;
  const seamWidth = 0.03;
  
  // Horizontal seams
  for (let r = 0; r <= quiltRows; r++) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(bedWidth - 0.1, seamDepth, seamWidth),
      seamMat
    );
    const z = gridStartZ + r * puffLength - puffLength / 2;
    seam.position.set(0, mattressHeight + 0.01, z);
    root.add(seam);
  }

  // Vertical seams
  for (let c = 0; c <= quiltCols; c++) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(seamWidth, seamDepth, (quiltRows * puffLength) - 0.1),
      seamMat
    );
    const x = gridStartX + c * puffWidth - puffWidth / 2;
    seam.position.set(x, mattressHeight + 0.01, gridStartZ + (quiltRows * puffLength) / 2);
    root.add(seam);
  }

  // Duvet Side Panels (Left and Right drapes)
  const sideDrapeHeight = 0.35; // How far down it hangs
  const sideDrapeGeom = new THREE.BoxGeometry(0.15, sideDrapeHeight, bedLength - 0.2);
  
  const leftDrape = new THREE.Mesh(sideDrapeGeom, fabricMat);
  leftDrape.position.set(-bedWidth / 2 - 0.05, mattressHeight - sideDrapeHeight / 2, 0);
  root.add(leftDrape);

  const rightDrape = new THREE.Mesh(sideDrapeGeom, fabricMat);
  rightDrape.position.set(bedWidth / 2 + 0.05, mattressHeight - sideDrapeHeight / 2, 0);
  root.add(rightDrape);

  // Duvet Foot Panel (Front drape)
  const footDrapeGeom = new THREE.BoxGeometry(bedWidth + 0.3, sideDrapeHeight, 0.15);
  const footDrape = new THREE.Mesh(footDrapeGeom, fabricMat);
  footDrape.position.set(0, mattressHeight - sideDrapeHeight / 2, bedLength / 2 + 0.05);
  root.add(footDrape);

  // Folded down header (Top of duvet folded back)
  const headerFoldGeom = new THREE.BoxGeometry(bedWidth - 0.2, 0.05, 0.3);
  const headerFold = new THREE.Mesh(headerFoldGeom, fabricMat);
  headerFold.position.set(0, mattressHeight + 0.05, -bedLength / 2 + 0.15);
  root.add(headerFold);

  // --- 3. Pillows ---
  // Two plump pillows at the head
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowLength);
  
  const pillowLeft = new THREE.Mesh(pillowGeom, fabricMat);
  pillowLeft.position.set(-pillowWidth / 2 - 0.05, mattressHeight + duvetThickness + pillowHeight / 2, -bedLength / 2 + 0.3);
  pillowLeft.rotation.x = -0.1; // Slight tilt back
  root.add(pillowLeft);

  const pillowRight = new THREE.Mesh(pillowGeom, fabricMat);
  pillowRight.position.set(pillowWidth / 2 + 0.05, mattressHeight + duvetThickness + pillowHeight / 2, -bedLength / 2 + 0.3);
  pillowRight.rotation.x = -0.1;
  root.add(pillowRight);

  // --- 4. Legs ---
  // Small cylindrical legs at corners, barely visible under the drapes
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
  const legPositions = [
    [-bedWidth / 2 + 0.1, 0, -bedLength / 2 + 0.1],
    [bedWidth / 2 - 0.1, 0, -bedLength / 2 + 0.1],
    [-bedWidth / 2 + 0.1, 0, bedLength / 2 - 0.1],
    [bedWidth / 2 - 0.1, 0, bedLength / 2 - 0.1],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
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