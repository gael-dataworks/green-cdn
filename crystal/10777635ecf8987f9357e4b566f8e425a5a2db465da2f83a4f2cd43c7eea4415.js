export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Light oak, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xA67B5B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Frosted, semi-transparent
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xE8E8E8,
    metalness: 0.0,
    roughness: 0.3,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
    ior: 1.5,
  });

  // Metal: Dark iron/bronze handle
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions (Logical Units) ---
  const totalWidth = 1.8;
  const totalHeight = 2.2;
  const frameDepth = 0.15;
  const doorThickness = 0.08;
  
  const leafWidth = 0.8;
  const gap = 0.02; // Gap between doors
  
  const stileWidth = 0.11;
  const railHeight = 0.09;
  
  const glassPaneHeight = 0.32;
  const glassGap = 0.04;
  
  const bottomPanelHeight = 0.55;
  const bottomPanelInset = 0.04;

  // --- Helper: Create a single door leaf ---
  function createDoorLeaf(isLeft) {
    const doorGroup = new THREE.Group();
    const dir = isLeft ? -1 : 1;
    const xOffset = isLeft ? - (leafWidth / 2 + gap / 2) : (leafWidth / 2 + gap / 2);

    // 1. Stiles (Vertical sides of the door leaf)
    const stileGeom = new THREE.BoxGeometry(stileWidth, totalHeight, doorThickness);
    
    const stileLeft = new THREE.Mesh(stileGeom, woodMat);
    stileLeft.position.set(-leafWidth / 2 + stileWidth / 2, 0, 0);
    doorGroup.add(stileLeft);

    const stileRight = new THREE.Mesh(stileGeom, woodMat);
    stileRight.position.set(leafWidth / 2 - stileWidth / 2, 0, 0);
    doorGroup.add(stileRight);

    // 2. Rails (Horizontal dividers)
    // We have 3 glass panes, so we need: Top Rail, Mid Rail 1, Mid Rail 2, Bottom Rail (top of panel section)
    // Let's calculate Y positions from top down.
    // Top of door is totalHeight / 2.
    
    const topY = totalHeight / 2 - railHeight / 2;
    const mid1Y = topY - glassPaneHeight - glassGap / 2 - railHeight / 2;
    const mid2Y = mid1Y - glassPaneHeight - glassGap / 2 - railHeight / 2;
    const panelTopY = mid2Y - glassPaneHeight - glassGap / 2 - railHeight / 2;

    const railWidth = leafWidth - stileWidth * 2;
    const railGeom = new THREE.BoxGeometry(railWidth, railHeight, doorThickness);

    const railTop = new THREE.Mesh(railGeom, woodMat);
    railTop.position.set(0, topY, 0);
    doorGroup.add(railTop);

    const railMid1 = new THREE.Mesh(railGeom, woodMat);
    railMid1.position.set(0, mid1Y, 0);
    doorGroup.add(railMid1);

    const railMid2 = new THREE.Mesh(railGeom, woodMat);
    railMid2.position.set(0, mid2Y, 0);
    doorGroup.add(railMid2);

    const railPanelTop = new THREE.Mesh(railGeom, woodMat);
    railPanelTop.position.set(0, panelTopY, 0);
    doorGroup.add(railPanelTop);

    // 3. Bottom Panel Frame & Insert
    // The bottom section is a solid wood panel, slightly recessed.
    const panelFrameHeight = bottomPanelHeight;
    const panelFrameWidth = leafWidth - stileWidth * 2;
    
    // Frame borders (Top, Bottom, Left, Right of the panel area)
    const borderThickness = 0.06;
    const borderGeomH = new THREE.BoxGeometry(panelFrameWidth, borderThickness, doorThickness * 0.8); // Slightly thinner
    const borderGeomV = new THREE.BoxGeometry(borderThickness, panelFrameHeight - borderThickness * 2, doorThickness * 0.8);

    const panelTopBorder = new THREE.Mesh(borderGeomH, woodMat);
    panelTopBorder.position.set(0, panelTopY - borderThickness / 2, 0);
    doorGroup.add(panelTopBorder);

    const panelBottomBorder = new THREE.Mesh(borderGeomH, woodMat);
    panelBottomBorder.position.set(0, -totalHeight / 2 + railHeight / 2 + borderThickness / 2, 0);
    doorGroup.add(panelBottomBorder);

    const panelLeftBorder = new THREE.Mesh(borderGeomV, woodMat);
    panelLeftBorder.position.set(-leafWidth / 2 + stileWidth / 2 + borderThickness / 2, -totalHeight / 2 + railHeight / 2 + panelFrameHeight / 2, 0);
    doorGroup.add(panelLeftBorder);

    const panelRightBorder = new THREE.Mesh(borderGeomV, woodMat);
    panelRightBorder.position.set(leafWidth / 2 - stileWidth / 2 - borderThickness / 2, -totalHeight / 2 + railHeight / 2 + panelFrameHeight / 2, 0);
    doorGroup.add(panelRightBorder);

    // Inner Panel (Recessed)
    const innerPanelW = panelFrameWidth - borderThickness * 2;
    const innerPanelH = panelFrameHeight - borderThickness * 2;
    const innerPanelGeom = new THREE.BoxGeometry(innerPanelW, innerPanelH, doorThickness * 0.6);
    const innerPanel = new THREE.Mesh(innerPanelGeom, woodMat);
    innerPanel.position.set(0, -totalHeight / 2 + railHeight / 2 + panelFrameHeight / 2, -0.01); // Slightly back
    doorGroup.add(innerPanel);

    // 4. Glass Panes (3 of them)
    const glassWidth = leafWidth - stileWidth * 2 - 0.02; // Slight inset
    const glassDepth = 0.02;
    const glassGeom = new THREE.BoxGeometry(glassWidth, glassPaneHeight, glassDepth);

    // Glass 1 (Top)
    const glass1 = new THREE.Mesh(glassGeom, glassMat);
    glass1.position.set(0, topY - glassPaneHeight / 2 - railHeight / 2, -doorThickness / 2 + glassDepth / 2);
    doorGroup.add(glass1);

    // Glass 2 (Middle)
    const glass2 = new THREE.Mesh(glassGeom, glassMat);
    glass2.position.set(0, mid1Y - glassPaneHeight / 2 - railHeight / 2, -doorThickness / 2 + glassDepth / 2);
    doorGroup.add(glass2);

    // Glass 3 (Bottom of glass section)
    const glass3 = new THREE.Mesh(glassGeom, glassMat);
    glass3.position.set(0, mid2Y - glassPaneHeight / 2 - railHeight / 2, -doorThickness / 2 + glassDepth / 2);
    doorGroup.add(glass3);

    // 5. Handle
    // Only add handle if it's the active side or both. Image shows handles on meeting stiles.
    const handleY = 0; // Approximate center height
    const handleZ = doorThickness / 2 + 0.03;
    
    // Backplate
    const plateGeom = new THREE.BoxGeometry(0.04, 0.12, 0.01);
    const plate = new THREE.Mesh(plateGeom, metalMat);
    // Position on the inner edge of the door
    const plateX = isLeft ? (leafWidth / 2 - stileWidth / 2) : -(leafWidth / 2 + stileWidth / 2);
    plate.position.set(plateX, handleY, handleZ);
    doorGroup.add(plate);

    // Lever
    const leverGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16);
    const lever = new THREE.Mesh(leverGeom, metalMat);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(plateX + (isLeft ? 0.04 : -0.04), handleY, handleZ);
    doorGroup.add(lever);

    // Position the whole door group
    doorGroup.position.x = xOffset;
    
    return doorGroup;
  }

  // --- Outer Frame ---
  // Four boxes surrounding the doors
  const frameThickness = 0.12;
  const frameMat = woodMat;

  // Top Frame
  const topFrameGeom = new THREE.BoxGeometry(totalWidth + frameThickness * 2, frameThickness, frameDepth);
  const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
  topFrame.position.set(0, totalHeight / 2 + frameThickness / 2, 0);
  root.add(topFrame);

  // Left Frame
  const sideFrameH = totalHeight + frameThickness;
  const sideFrameGeom = new THREE.BoxGeometry(frameThickness, sideFrameH, frameDepth);
  const leftFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  leftFrame.position.set(-totalWidth / 2 - frameThickness / 2, 0, 0);
  root.add(leftFrame);

  // Right Frame
  const rightFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  rightFrame.position.set(totalWidth / 2 + frameThickness / 2, 0, 0);
  root.add(rightFrame);
  
  // Bottom Frame (Threshold)
  const botFrameGeom = new THREE.BoxGeometry(totalWidth + frameThickness * 2, frameThickness, frameDepth);
  const botFrame = new THREE.Mesh(botFrameGeom, frameMat);
  botFrame.position.set(0, -totalHeight / 2 - frameThickness / 2, 0);
  root.add(botFrame);

  // --- Assemble Doors ---
  const leftDoor = createDoorLeaf(true);
  root.add(leftDoor);

  const rightDoor = createDoorLeaf(false);
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