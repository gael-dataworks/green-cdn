export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed Stainless Steel
  // Rules: metalness <= 0.6, use color for shade, moderate roughness for brushed look.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Dimensions
  const trayLength = 1.0;
  const trayWidth = 0.45;
  const trayHeight = 0.12;
  const wallThick = 0.02;
  const tubeRadius = 0.015;
  const frameHeight = 0.15; // Height of frame above tray rim

  // --- TRAY ---
  const trayGroup = new THREE.Group();

  // Base plate
  const baseGeom = new THREE.BoxGeometry(trayWidth, wallThick, trayLength);
  const base = new THREE.Mesh(baseGeom, steelMat);
  base.position.y = wallThick / 2;
  trayGroup.add(base);

  // Walls
  // Front & Back walls
  const wallFBGeom = new THREE.BoxGeometry(trayWidth, trayHeight, wallThick);
  const wallFront = new THREE.Mesh(wallFBGeom, steelMat);
  wallFront.position.set(0, trayHeight / 2 + wallThick, trayLength / 2 + wallThick / 2);
  trayGroup.add(wallFront);

  const wallBack = new THREE.Mesh(wallFBGeom, steelMat);
  wallBack.position.set(0, trayHeight / 2 + wallThick, -trayLength / 2 - wallThick / 2);
  trayGroup.add(wallBack);

  // Left & Right walls (inner length to fit between front/back walls)
  const innerLength = trayLength - wallThick * 2;
  const wallSidesGeom = new THREE.BoxGeometry(wallThick, trayHeight, innerLength);
  const wallLeft = new THREE.Mesh(wallSidesGeom, steelMat);
  wallLeft.position.set(-trayWidth / 2 - wallThick / 2, trayHeight / 2 + wallThick, 0);
  trayGroup.add(wallLeft);

  const wallRight = new THREE.Mesh(wallSidesGeom, steelMat);
  wallRight.position.set(trayWidth / 2 + wallThick / 2, trayHeight / 2 + wallThick, 0);
  trayGroup.add(wallRight);

  // Drainage Ridges (inside the tray)
  const ridgeGeom = new THREE.BoxGeometry(0.015, 0.015, innerLength - 0.05);
  const ridgeSpacing = trayWidth / 4;
  for (let i = -1; i <= 1; i++) {
    const ridge = new THREE.Mesh(ridgeGeom, steelMat);
    ridge.position.set(i * ridgeSpacing, wallThick + 0.0075, 0);
    trayGroup.add(ridge);
  }

  root.add(trayGroup);

  // --- FRAME ---
  const frameGroup = new THREE.Group();
  const frameY = trayHeight + wallThick + frameHeight / 2; // Center Y of horizontal bars

  // Corner Posts (Cylinders)
  const postGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, frameHeight, 16);
  const postPositions = [
    [-trayWidth / 2, frameY, trayLength / 2],  // Front Left
    [trayWidth / 2, frameY, trayLength / 2],   // Front Right
    [-trayWidth / 2, frameY, -trayLength / 2], // Back Left
    [trayWidth / 2, frameY, -trayLength / 2],  // Back Right
  ];

  for (const pos of postPositions) {
    const post = new THREE.Mesh(postGeom, steelMat);
    post.position.set(...pos);
    frameGroup.add(post);
  }

  // Horizontal Bars
  const barLength = trayWidth - tubeRadius * 2; // Distance between post centers approx
  const barGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, barLength, 16);
  
  // Front Bar
  const barFront = new THREE.Mesh(barGeom, steelMat);
  barFront.rotation.z = Math.PI / 2;
  barFront.position.set(0, frameY, trayLength / 2);
  frameGroup.add(barFront);

  // Back Bar
  const barBack = new THREE.Mesh(barGeom, steelMat);
  barBack.rotation.z = Math.PI / 2;
  barBack.position.set(0, frameY, -trayLength / 2);
  frameGroup.add(barBack);

  // Left Bar
  const leftBarLength = trayLength - tubeRadius * 2;
  const barLeftGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, leftBarLength, 16);
  const barLeft = new THREE.Mesh(barLeftGeom, steelMat);
  barLeft.rotation.x = Math.PI / 2;
  barLeft.position.set(-trayWidth / 2, frameY, 0);
  frameGroup.add(barLeft);

  // Right Bar (with decorative loop)
  // We model the straight part and add a torus for the loop
  const rightBarLength = trayLength - tubeRadius * 2 - 0.06; // Stop short for loop
  const barRightGeom = new THREE.CylinderGeometry(tubeRadius, tubeRadius, rightBarLength, 16);
  const barRight = new THREE.Mesh(barRightGeom, steelMat);
  barRight.rotation.x = Math.PI / 2;
  // Shift slightly back so the loop sits at the front corner
  barRight.position.set(trayWidth / 2, frameY, -0.03); 
  frameGroup.add(barRight);

  // Decorative Loop at Front-Right
  const loopRadius = 0.035;
  const loopTube = 0.015;
  const loopGeom = new THREE.TorusGeometry(loopRadius, loopTube, 12, 24, Math.PI * 1.8); // Almost full circle
  const loop = new THREE.Mesh(loopGeom, steelMat);
  loop.rotation.x = Math.PI / 2; // Lie flat in XZ plane
  loop.rotation.z = -Math.PI / 4; // Angle it slightly
  loop.position.set(trayWidth / 2 - 0.02, frameY, trayLength / 2 - 0.02);
  frameGroup.add(loop);

  root.add(frameGroup);

  // Normalization
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