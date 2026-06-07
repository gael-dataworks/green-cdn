export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Satin finish, warm brown
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Clear, physical material for transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Metal: Matte black/dark gray for hardware
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const totalWidth = 1.0;
  const totalHeight = 1.6;
  const doorDepth = 0.08;
  const frameWidth = 0.08;
  const doorGap = 0.005;
  const halfWidth = totalWidth / 2;
  const halfHeight = totalHeight / 2;
  
  // Door leaf dimensions
  const leafWidth = (totalWidth - frameWidth * 2 - doorGap) / 2;
  const leafHeight = totalHeight - frameWidth * 2;
  
  // Glass section
  const glassSectionHeight = leafHeight * 0.60;
  const panelSectionHeight = leafHeight * 0.40;
  const paneHeight = (glassSectionHeight - 0.04 * 2) / 3; // 3 panes, 2 muntins
  const muntinThickness = 0.04;

  // --- Outer Frame ---
  // A box that surrounds the doors. We make it a hollow-ish frame by using a large box 
  // and relying on the doors to fill the inside, or just a thick border.
  // Simpler: Just a big box with a hole? No, constructive solid geometry is hard.
  // Let's make 4 boxes for the frame: Top, Bottom, Left, Right.
  
  const frameMat = woodMat;

  // Left Frame Stile
  const leftFrameStile = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, totalHeight, doorDepth),
    frameMat
  );
  leftFrameStile.position.set(-halfWidth + frameWidth / 2, 0, 0);
  root.add(leftFrameStile);

  // Right Frame Stile
  const rightFrameStile = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth, totalHeight, doorDepth),
    frameMat
  );
  rightFrameStile.position.set(halfWidth - frameWidth / 2, 0, 0);
  root.add(rightFrameStile);

  // Top Frame Rail
  const topFrameRail = new THREE.Mesh(
    new THREE.BoxGeometry(totalWidth - frameWidth * 2, frameWidth, doorDepth),
    frameMat
  );
  topFrameRail.position.set(0, halfHeight - frameWidth / 2, 0);
  root.add(topFrameRail);

  // Bottom Frame Rail (Threshold)
  const bottomFrameRail = new THREE.Mesh(
    new THREE.BoxGeometry(totalWidth - frameWidth * 2, frameWidth, doorDepth),
    frameMat
  );
  bottomFrameRail.position.set(0, -halfHeight + frameWidth / 2, 0);
  root.add(bottomFrameRail);

  // --- Helper to build a Door Leaf ---
  function createDoorLeaf(side) {
    const doorGroup = new THREE.Group();
    const isLeft = side === 'left';
    const centerX = isLeft ? -leafWidth / 2 - doorGap / 2 : leafWidth / 2 + doorGap / 2;
    
    // 1. Stiles (Vertical sides of the door)
    const stileWidth = 0.08;
    const leftStile = new THREE.Mesh(
      new THREE.BoxGeometry(stileWidth, leafHeight, doorDepth),
      woodMat
    );
    leftStile.position.set(centerX - leafWidth / 2 + stileWidth / 2, 0, 0);
    doorGroup.add(leftStile);

    const rightStile = new THREE.Mesh(
      new THREE.BoxGeometry(stileWidth, leafHeight, doorDepth),
      woodMat
    );
    rightStile.position.set(centerX + leafWidth / 2 - stileWidth / 2, 0, 0);
    doorGroup.add(rightStile);

    // 2. Rails (Horizontal parts)
    // Top Rail
    const topRailY = halfHeight - frameWidth - glassSectionHeight / 2;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth - stileWidth * 2, 0.06, doorDepth),
      woodMat
    );
    topRail.position.set(centerX, topRailY, 0);
    doorGroup.add(topRail);

    // Middle Rail (Separator between glass and panel)
    const midRailY = -panelSectionHeight / 2 + 0.03; // Slightly above panel center
    const midRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth - stileWidth * 2, 0.08, doorDepth),
      woodMat
    );
    midRail.position.set(centerX, midRailY, 0);
    doorGroup.add(midRail);

    // Bottom Rail
    const bottomRailY = -halfHeight + frameWidth + panelSectionHeight / 2;
    const bottomRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth - stileWidth * 2, 0.08, doorDepth),
      woodMat
    );
    bottomRail.position.set(centerX, bottomRailY, 0);
    doorGroup.add(bottomRail);

    // 3. Glass Panes (3 per door)
    // Glass is recessed slightly (z + 0.01)
    const glassZ = 0.01;
    const glassWidth = leafWidth - stileWidth * 2 - 0.02;
    
    // Top Pane
    const glassTopY = topRailY + glassSectionHeight / 2 - paneHeight / 2 - 0.04;
    const glassTop = new THREE.Mesh(
      new THREE.BoxGeometry(glassWidth, paneHeight, 0.02),
      glassMat
    );
    glassTop.position.set(centerX, glassTopY, glassZ);
    doorGroup.add(glassTop);

    // Middle Pane
    const glassMidY = topRailY;
    const glassMid = new THREE.Mesh(
      new THREE.BoxGeometry(glassWidth, paneHeight, 0.02),
      glassMat
    );
    glassMid.position.set(centerX, glassMidY, glassZ);
    doorGroup.add(glassMid);

    // Bottom Pane
    const glassBotY = topRailY - glassSectionHeight / 2 + paneHeight / 2 + 0.04;
    const glassBot = new THREE.Mesh(
      new THREE.BoxGeometry(glassWidth, paneHeight, 0.02),
      glassMat
    );
    glassBot.position.set(centerX, glassBotY, glassZ);
    doorGroup.add(glassBot);

    // Muntins (Dividers between glass panes)
    const muntin1Y = glassTopY - paneHeight / 2 - 0.02;
    const muntin1 = new THREE.Mesh(
      new THREE.BoxGeometry(glassWidth, muntinThickness, doorDepth),
      woodMat
    );
    muntin1.position.set(centerX, muntin1Y, 0);
    doorGroup.add(muntin1);

    const muntin2Y = glassBotY + paneHeight / 2 + 0.02;
    const muntin2 = new THREE.Mesh(
      new THREE.BoxGeometry(glassWidth, muntinThickness, doorDepth),
      woodMat
    );
    muntin2.position.set(centerX, muntin2Y, 0);
    doorGroup.add(muntin2);

    // 4. Bottom Solid Panel
    // This is a raised panel. We make a base box and a slightly smaller top box for the bevel effect.
    const panelY = -halfHeight + frameWidth + panelSectionHeight / 2;
    const panelWidth = leafWidth - stileWidth * 2 - 0.04;
    const panelHeight = panelSectionHeight - 0.08;
    
    // Panel Frame (Recessed border)
    const panelFrame = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth + 0.04, panelHeight + 0.04, 0.01),
      woodMat
    );
    panelFrame.position.set(centerX, panelY, 0.02);
    doorGroup.add(panelFrame);

    // Panel Center (Raised part)
    const panelCenter = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth, panelHeight, 0.015),
      woodMat
    );
    panelCenter.position.set(centerX, panelY, 0.025);
    doorGroup.add(panelCenter);

    // 5. Hardware (Only on Right Door)
    if (!isLeft) {
      // Lock Plate
      const plateWidth = 0.02;
      const plateHeight = 0.15;
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(plateWidth, plateHeight, 0.01),
        metalMat
      );
      // Positioned on the left edge of the right door (meeting stile)
      plate.position.set(centerX - leafWidth / 2 + 0.02, 0, 0.04);
      doorGroup.add(plate);

      // Handle Lever
      const handleLen = 0.12;
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, handleLen, 16),
        metalMat
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(centerX - leafWidth / 2 + 0.02, 0, 0.05);
      doorGroup.add(handle);
      
      // Handle Base (Rosette)
      const rosette = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16),
        metalMat
      );
      rosette.rotation.x = Math.PI / 2;
      rosette.position.set(centerX - leafWidth / 2 + 0.02, 0, 0.035);
      doorGroup.add(rosette);
    }

    return doorGroup;
  }

  // --- Assemble Doors ---
  const leftDoor = createDoorLeaf('left');
  root.add(leftDoor);

  const rightDoor = createDoorLeaf('right');
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