export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Warm brown, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Frosted/Transmissive
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Metal: Dark matte hardware
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.3,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const totalWidth = 1.8;
  const totalHeight = 2.6;
  const depth = 0.15;
  const frameThickness = 0.12;
  const doorWidth = (totalWidth - frameThickness * 2) / 2;
  const doorHeight = totalHeight - frameThickness * 2;
  
  // Door internal structure
  const stileWidth = 0.09;
  const railHeight = 0.08;
  const muntinHeight = 0.06;
  
  // Glass panel heights (3 panes)
  // Available height for glass section = doorHeight - bottomPanelHeight - topRail - muntins
  const bottomPanelHeight = 0.6;
  const glassSectionHeight = doorHeight - bottomPanelHeight - railHeight - muntinHeight * 2;
  const glassPaneHeight = (glassSectionHeight - muntinHeight * 2) / 3;

  // --- Helper Functions ---
  function createBox(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  // --- Outer Frame ---
  // 4 boxes forming the casing
  const frameLeft = createBox(frameThickness, totalHeight, depth, woodMat, -totalWidth / 2 + frameThickness / 2, 0, 0);
  const frameRight = createBox(frameThickness, totalHeight, depth, woodMat, totalWidth / 2 - frameThickness / 2, 0, 0);
  const frameTop = createBox(totalWidth - frameThickness * 2, frameThickness, depth, woodMat, 0, totalHeight / 2 - frameThickness / 2, 0);
  const frameBottom = createBox(totalWidth, frameThickness, depth, woodMat, 0, -totalHeight / 2 + frameThickness / 2, 0);
  
  root.add(frameLeft, frameRight, frameTop, frameBottom);

  // --- Door Construction Function ---
  function buildDoor(side, hasLockPlate) {
    const doorGroup = new THREE.Group();
    const xPos = side * (frameThickness + doorWidth / 2);
    
    // 1. Vertical Stiles (Left and Right of the door)
    const stileLeft = createBox(stileWidth, doorHeight, depth, woodMat, xPos - doorWidth / 2 + stileWidth / 2, 0, 0);
    const stileRight = createBox(stileWidth, doorHeight, depth, woodMat, xPos + doorWidth / 2 - stileWidth / 2, 0, 0);
    doorGroup.add(stileLeft, stileRight);

    // 2. Horizontal Rails & Muntins
    // Top Rail
    const topRailY = doorHeight / 2 - railHeight / 2;
    const topRail = createBox(doorWidth - stileWidth * 2, railHeight, depth, woodMat, xPos, topRailY, 0);
    doorGroup.add(topRail);

    // Bottom Rail (Top of solid panel)
    const bottomRailY = -doorHeight / 2 + bottomPanelHeight + railHeight / 2;
    const bottomRail = createBox(doorWidth - stileWidth * 2, railHeight, depth, woodMat, xPos, bottomRailY, 0);
    doorGroup.add(bottomRail);

    // Muntins (separating glass panes)
    // Muntin 1 (between glass 1 and 2)
    const muntin1Y = topRailY - railHeight / 2 - glassPaneHeight - muntinHeight / 2;
    const muntin1 = createBox(doorWidth - stileWidth * 2, muntinHeight, depth, woodMat, xPos, muntin1Y, 0);
    doorGroup.add(muntin1);

    // Muntin 2 (between glass 2 and 3)
    const muntin2Y = muntin1Y - glassPaneHeight - muntinHeight;
    const muntin2 = createBox(doorWidth - stileWidth * 2, muntinHeight, depth, woodMat, xPos, muntin2Y, 0);
    doorGroup.add(muntin2);

    // 3. Glass Panes
    const glassDepth = 0.02;
    const glassZ = depth / 2 - glassDepth / 2 - 0.005; // Slightly inset
    const glassWidth = doorWidth - stileWidth * 2 - 0.02; // Slight gap for fit

    // Glass 1 (Top)
    const g1Y = topRailY - railHeight / 2 - glassPaneHeight / 2;
    const glass1 = createBox(glassWidth, glassPaneHeight, glassDepth, glassMat, xPos, g1Y, glassZ);
    doorGroup.add(glass1);

    // Glass 2 (Middle)
    const g2Y = muntin1Y - muntinHeight / 2 - glassPaneHeight / 2;
    const glass2 = createBox(glassWidth, glassPaneHeight, glassDepth, glassMat, xPos, g2Y, glassZ);
    doorGroup.add(glass2);

    // Glass 3 (Bottom)
    const g3Y = muntin2Y - muntinHeight / 2 - glassPaneHeight / 2;
    const glass3 = createBox(glassWidth, glassPaneHeight, glassDepth, glassMat, xPos, g3Y, glassZ);
    doorGroup.add(glass3);

    // 4. Bottom Solid Panel
    // Frame for the panel
    const panelFrameY = -doorHeight / 2 + bottomPanelHeight / 2;
    const panelFrameW = doorWidth - stileWidth * 2;
    const panelFrameH = bottomPanelHeight - railHeight * 2; // Adjusted to fit inside rails
    
    // We simulate the raised panel by creating a recessed box inside the door frame area
    // Actually, simpler: Just a solid wood box filling the bottom area, framed by stiles/rails
    const bottomPanel = createBox(panelFrameW, panelFrameH, depth, woodMat, xPos, panelFrameY, 0);
    doorGroup.add(bottomPanel);

    // Raised detail on bottom panel (a smaller box on top)
    const detailW = panelFrameW * 0.7;
    const detailH = panelFrameH * 0.7;
    const detailD = 0.02;
    const detailBox = createBox(detailW, detailH, detailD, woodMat, xPos, panelFrameY, depth / 2 + detailD / 2);
    doorGroup.add(detailBox);

    // 5. Hardware
    const handleY = 0;
    const handleZ = depth / 2 + 0.02;
    
    // Handle Lever
    const leverGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16);
    leverGeom.rotateZ(Math.PI / 2);
    const handle = new THREE.Mesh(leverGeom, metalMat);
    handle.position.set(xPos + (side * 0.05), handleY, handleZ);
    doorGroup.add(handle);

    // Lock Plate (Right door only)
    if (hasLockPlate) {
      const plateW = 0.04;
      const plateH = 0.25;
      const plateD = 0.01;
      const plate = createBox(plateW, plateH, plateD, metalMat, xPos + (side * 0.05), handleY, handleZ - 0.01);
      doorGroup.add(plate);
      
      // Keyhole
      const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 16), metalMat);
      keyhole.rotation.x = Math.PI / 2;
      keyhole.position.set(xPos + (side * 0.05), handleY - 0.06, handleZ - 0.015);
      doorGroup.add(keyhole);
    }

    return doorGroup;
  }

  // --- Assemble Doors ---
  const leftDoor = buildDoor(-1, false);
  const rightDoor = buildDoor(1, true);

  root.add(leftDoor);
  root.add(rightDoor);

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