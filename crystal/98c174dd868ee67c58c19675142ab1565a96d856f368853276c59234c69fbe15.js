export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stainless steel: bright silver, moderate metalness, low roughness.
  // Using emissive to ensure brightness in the dim renderer.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3
  });

  // --- Dimensions ---
  const length = 1.0;
  const width = 0.45;
  const baseHeight = 0.08;
  const wallThickness = 0.02;
  const railHeight = 0.18; // Height of the rail above the base bottom
  const railRadius = 0.025;
  const dividerCount = 2;

  // --- Base Tray ---
  // Outer box
  const baseOuterGeom = new THREE.BoxGeometry(width, baseHeight, length);
  const baseOuter = new THREE.Mesh(baseOuterGeom, steelMat);
  baseOuter.position.y = baseHeight / 2;
  root.add(baseOuter);

  // Inner cavity (slightly smaller box to create walls visually, or just add walls)
  // Let's add walls explicitly for better control over the "rim".
  // Actually, a simple subtraction logic via scaling works for a shallow tray.
  // Inner box to cut out (negative scale or just don't render).
  // Better: Build walls.
  
  // Floor plate (inside)
  const floorGeom = new THREE.BoxGeometry(width - wallThickness * 2, 0.01, length - wallThickness * 2);
  const floor = new THREE.Mesh(floorGeom, steelMat);
  floor.position.y = 0.015; // Slightly above bottom
  root.add(floor);

  // Side walls (Long sides)
  const sideWallGeom = new THREE.BoxGeometry(wallThickness, baseHeight, length);
  const leftWall = new THREE.Mesh(sideWallGeom, steelMat);
  leftWall.position.set(-width / 2 + wallThickness / 2, baseHeight / 2, 0);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeom, steelMat);
  rightWall.position.set(width / 2 - wallThickness / 2, baseHeight / 2, 0);
  root.add(rightWall);

  // End walls (Short sides)
  const endWallWidth = width - wallThickness * 2;
  const endWallGeom = new THREE.BoxGeometry(endWallWidth, baseHeight, wallThickness);
  const frontWall = new THREE.Mesh(endWallGeom, steelMat);
  frontWall.position.set(0, baseHeight / 2, -length / 2 + wallThickness / 2);
  root.add(frontWall);

  const backWall = new THREE.Mesh(endWallGeom, steelMat);
  backWall.position.set(0, baseHeight / 2, length / 2 - wallThickness / 2);
  root.add(backWall);

  // --- Internal Dividers ---
  // Two thin walls running the length inside the tray
  const dividerSpacing = width / 3;
  const dividerGeom = new THREE.BoxGeometry(0.015, baseHeight * 0.8, length - wallThickness * 2);
  
  for (let i = -1; i <= 1; i += 2) {
    const divider = new THREE.Mesh(dividerGeom, steelMat);
    divider.position.set(i * dividerSpacing, baseHeight * 0.4, 0);
    root.add(divider);
  }

  // --- Side Rails ---
  // The rails run along the length, elevated, with looped ends.
  // We will construct them using TubeGeometry for smooth curves at the ends.
  
  function createRail(xOffset) {
    const railGroup = new THREE.Group();
    
    // Path points for the rail
    // Starts at front loop, goes back, ends at back loop
    const zStart = -length / 2;
    const zEnd = length / 2;
    const yBase = baseHeight; 
    const yRail = railHeight;
    const loopRadius = railRadius * 2.5;

    // Curve definition
    // Front loop: starts low, curves up and back
    // Main bar: straight
    // Back loop: curves up and forward
    
    // Let's approximate with segments for simplicity and robustness
    // 1. Front vertical support
    const supportGeom = new THREE.CylinderGeometry(railRadius, railRadius, yRail - yBase, 16);
    const frontSupport = new THREE.Mesh(supportGeom, steelMat);
    frontSupport.position.set(xOffset, (yRail + yBase) / 2, zStart + wallThickness);
    railGroup.add(frontSupport);

    const backSupport = new THREE.Mesh(supportGeom, steelMat);
    backSupport.position.set(xOffset, (yRail + yBase) / 2, zEnd - wallThickness);
    railGroup.add(backSupport);

    // 2. Main horizontal bar
    const barLength = length - wallThickness * 2 - loopRadius;
    const barGeom = new THREE.CylinderGeometry(railRadius, railRadius, barLength, 16);
    const mainBar = new THREE.Mesh(barGeom, steelMat);
    mainBar.rotation.x = Math.PI / 2; // Align with Z
    mainBar.position.set(xOffset, yRail, 0);
    railGroup.add(mainBar);

    // 3. End Loops (Torus segments)
    // Front loop: Quarter torus turning up and forward
    const loopGeom = new THREE.TorusGeometry(loopRadius, railRadius, 16, 32, Math.PI); // Half circle
    const frontLoop = new THREE.Mesh(loopGeom, steelMat);
    frontLoop.rotation.z = Math.PI / 2; // Stand up
    frontLoop.rotation.x = Math.PI / 2; // Lie flat in XZ? No.
    // Torus is in XY plane. We want it in YZ plane.
    // Rotate 90 deg around X to put it in YZ.
    frontLoop.rotation.x = Math.PI / 2;
    // Position at the end of the bar
    frontLoop.position.set(xOffset, yRail - loopRadius, zStart + wallThickness + loopRadius);
    railGroup.add(frontLoop);

    const backLoop = new THREE.Mesh(loopGeom, steelMat);
    backLoop.rotation.x = Math.PI / 2;
    backLoop.position.set(xOffset, yRail - loopRadius, zEnd - wallThickness - loopRadius);
    railGroup.add(backLoop);

    return railGroup;
  }

  const leftRail = createRail(-width / 2);
  root.add(leftRail);

  const rightRail = createRail(width / 2);
  root.add(rightRail);

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