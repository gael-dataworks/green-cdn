export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel. High metalness, low roughness. 
  // Emissive added to ensure brightness in neutral lighting.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // --- Dimensions ---
  const trayLength = 1.0;
  const trayWidth = 0.45;
  const trayHeight = 0.12;
  const wallThickness = 0.03;
  const wireRadius = 0.025;
  const handleHeight = 0.55; // Height of the back handle above the tray bottom

  // --- Tray Body ---
  // Constructed from 5 boxes for sharp, clean corners.
  
  // Bottom plate
  const bottomGeom = new THREE.BoxGeometry(trayWidth, wallThickness, trayLength);
  const trayBottom = new THREE.Mesh(bottomGeom, steelMat);
  trayBottom.position.y = wallThickness / 2;
  root.add(trayBottom);

  // Front wall
  const frontWallGeom = new THREE.BoxGeometry(trayWidth, trayHeight, wallThickness);
  const trayFront = new THREE.Mesh(frontWallGeom, steelMat);
  trayFront.position.set(0, trayHeight / 2, trayLength / 2 - wallThickness / 2);
  root.add(trayFront);

  // Back wall
  const backWallGeom = new THREE.BoxGeometry(trayWidth, trayHeight, wallThickness);
  const trayBack = new THREE.Mesh(backWallGeom, steelMat);
  trayBack.position.set(0, trayHeight / 2, -trayLength / 2 + wallThickness / 2);
  root.add(trayBack);

  // Left wall
  const leftWallGeom = new THREE.BoxGeometry(wallThickness, trayHeight, trayLength);
  const trayLeft = new THREE.Mesh(leftWallGeom, steelMat);
  trayLeft.position.set(-trayWidth / 2 + wallThickness / 2, trayHeight / 2, 0);
  root.add(trayLeft);

  // Right wall
  const rightWallGeom = new THREE.BoxGeometry(wallThickness, trayHeight, trayLength);
  const trayRight = new THREE.Mesh(rightWallGeom, steelMat);
  trayRight.position.set(trayWidth / 2 - wallThickness / 2, trayHeight / 2, 0);
  root.add(trayRight);

  // --- Wire Frame ---
  // Two side arches connected by a front bar. The back handle is the top of the arch.
  
  function createSideArch(sideMultiplier) {
    const x = sideMultiplier * (trayWidth / 2);
    const zFront = trayLength / 2;
    const zBack = -trayLength / 2;
    const yBase = trayHeight; // Wire starts at top of wall
    
    // Path for the side wire: Front-Bottom -> Up -> Back-Top -> Down -> Back-Bottom
    // We use CatmullRomCurve3 for smooth bends.
    const points = [
      new THREE.Vector3(x, yBase, zFront - 0.05), // Start slightly in front
      new THREE.Vector3(x, yBase + 0.15, zFront), // Curve out/up at front corner
      new THREE.Vector3(x, yBase + handleHeight, zFront), // Go up
      new THREE.Vector3(x, yBase + handleHeight, zBack), // Top bar (handle)
      new THREE.Vector3(x, yBase + 0.15, zBack), // Curve down at back corner
      new THREE.Vector3(x, yBase, zBack + 0.05), // End slightly behind
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    // Tension 0.5 gives nice rounded corners
    curve.tension = 0.5; 

    const tubeGeom = new THREE.TubeGeometry(curve, 20, wireRadius, 8, false);
    const mesh = new THREE.Mesh(tubeGeom, steelMat);
    return mesh;
  }

  const leftArch = createSideArch(-1);
  root.add(leftArch);

  const rightArch = createSideArch(1);
  root.add(rightArch);

  // Front cross-bar
  // Connects the two side arches at the front, slightly above the tray rim
  const frontBarZ = trayLength / 2 - 0.02;
  const frontBarY = trayHeight + 0.08;
  const frontBarWidth = trayWidth - 0.1; // Slightly inset from outer edges

  const frontBarGeom = new THREE.CylinderGeometry(wireRadius, wireRadius, frontBarWidth, 8);
  const frontBar = new THREE.Mesh(frontBarGeom, steelMat);
  frontBar.rotation.z = Math.PI / 2; // Align along X
  frontBar.position.set(0, frontBarY, frontBarZ);
  root.add(frontBar);

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