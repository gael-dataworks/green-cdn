export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Satin finish, medium brown
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Clear, slight blue tint, high transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Metal: Dark matte (handle)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const doorWidth = 0.70;
  const doorHeight = 2.20;
  const doorDepth = 0.08;
  const stileWidth = 0.09;
  const railHeight = 0.09;
  const muntinHeight = 0.06;
  
  // Glass section: Top 3 panes
  const glassSectionHeight = 1.35;
  const paneHeight = (glassSectionHeight - 2 * muntinHeight) / 3;
  const paneWidth = doorWidth - 2 * stileWidth - 0.02; // slight inset
  
  // Panel section: Bottom
  const panelSectionHeight = doorHeight - glassSectionHeight - railHeight;
  const panelHeight = panelSectionHeight - 0.04;
  const panelWidth = doorWidth - 2 * stileWidth - 0.04;

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  function buildDoorLeaf(xOffset, hasHandle) {
    const doorGroup = new THREE.Group();
    doorGroup.position.x = xOffset;

    // 1. Stiles (Vertical sides)
    const stileGeom = new THREE.BoxGeometry(stileWidth, doorHeight, doorDepth);
    const leftStile = new THREE.Mesh(stileGeom, woodMat);
    leftStile.position.set(-doorWidth / 2 + stileWidth / 2, 0, 0);
    doorGroup.add(leftStile);

    const rightStile = new THREE.Mesh(stileGeom, woodMat);
    rightStile.position.set(doorWidth / 2 - stileWidth / 2, 0, 0);
    doorGroup.add(rightStile);

    // 2. Rails (Horizontal structural bars)
    // Top Rail
    const topRailW = doorWidth - 2 * stileWidth;
    const topRail = addBox(topRailW, railHeight, doorDepth, woodMat, 0, doorHeight / 2 - railHeight / 2, 0, 0, 0, 0);
    doorGroup.add(topRail);

    // Bottom Rail (above panel)
    const bottomRailY = -doorHeight / 2 + panelSectionHeight + railHeight / 2;
    const bottomRail = addBox(topRailW, railHeight, doorDepth, woodMat, 0, bottomRailY, 0, 0, 0, 0);
    doorGroup.add(bottomRail);

    // 3. Muntins (Dividers between glass panes)
    // We have 3 panes, so 2 muntins
    const muntinW = topRailW;
    const muntin1Y = doorHeight / 2 - railHeight - paneHeight - muntinHeight / 2;
    const muntin2Y = muntin1Y - paneHeight - muntinHeight;
    
    const muntin1 = addBox(muntinW, muntinHeight, doorDepth, woodMat, 0, muntin1Y, 0, 0, 0, 0);
    doorGroup.add(muntin1);
    
    const muntin2 = addBox(muntinW, muntinHeight, doorDepth, woodMat, 0, muntin2Y, 0, 0, 0, 0);
    doorGroup.add(muntin2);

    // 4. Glass Panes (3 per door)
    const glassDepth = 0.02;
    const glassZ = 0; // Centered in depth
    
    const pane1Y = doorHeight / 2 - railHeight - paneHeight / 2;
    const pane2Y = pane1Y - paneHeight - muntinHeight;
    const pane3Y = pane2Y - paneHeight - muntinHeight;

    const glassGeom = new THREE.BoxGeometry(paneWidth, paneHeight, glassDepth);
    
    const g1 = new THREE.Mesh(glassGeom, glassMat);
    g1.position.set(0, pane1Y, glassZ);
    doorGroup.add(g1);

    const g2 = new THREE.Mesh(glassGeom, glassMat);
    g2.position.set(0, pane2Y, glassZ);
    doorGroup.add(g2);

    const g3 = new THREE.Mesh(glassGeom, glassMat);
    g3.position.set(0, pane3Y, glassZ);
    doorGroup.add(g3);

    // 5. Bottom Solid Panel
    // Frame around the panel
    const panelFrameThick = 0.02;
    const panelFrameW = panelWidth + panelFrameThick * 2;
    const panelFrameH = panelHeight + panelFrameThick * 2;
    const panelY = -doorHeight / 2 + panelSectionHeight / 2;
    
    // Create a frame using 4 thin boxes
    const pfTop = addBox(panelFrameW, panelFrameThick, doorDepth * 0.8, woodMat, 0, panelY + panelFrameH/2 - panelFrameThick/2, 0.01);
    doorGroup.add(pfTop);
    const pfBottom = addBox(panelFrameW, panelFrameThick, doorDepth * 0.8, woodMat, 0, panelY - panelFrameH/2 + panelFrameThick/2, 0.01);
    doorGroup.add(pfBottom);
    const pfLeft = addBox(panelFrameThick, panelFrameH - 2*panelFrameThick, doorDepth * 0.8, woodMat, -panelFrameW/2 + panelFrameThick/2, panelY, 0.01);
    doorGroup.add(pfLeft);
    const pfRight = addBox(panelFrameThick, panelFrameH - 2*panelFrameThick, doorDepth * 0.8, woodMat, panelFrameW/2 - panelFrameThick/2, panelY, 0.01);
    doorGroup.add(pfRight);

    // The actual panel insert (slightly recessed)
    const panelInsert = addBox(panelWidth, panelHeight, doorDepth * 0.6, woodMat, 0, panelY, 0.02);
    doorGroup.add(panelInsert);

    // 6. Handle (Only on right door)
    if (hasHandle) {
      const handleY = 0; // Approximate middle of door height visually, usually lower but let's center on glass/panel divide area
      const handleZ = doorDepth / 2 + 0.02;
      const handleX = doorWidth / 2 - 0.08; // On the stile

      // Backplate
      const plate = addBox(0.04, 0.12, 0.01, metalMat, handleX, handleY, handleZ, 0, 0, 0);
      doorGroup.add(plate);

      // Lever (Cylinder rotated)
      const leverGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 16);
      const lever = new THREE.Mesh(leverGeom, metalMat);
      lever.rotation.z = Math.PI / 2;
      lever.position.set(handleX + 0.02, handleY, handleZ + 0.01);
      doorGroup.add(lever);
      
      // Base of lever
      const baseGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
      const base = new THREE.Mesh(baseGeom, metalMat);
      base.rotation.z = Math.PI / 2;
      base.position.set(handleX, handleY, handleZ + 0.01);
      doorGroup.add(base);
    }

    root.add(doorGroup);
  }

  // --- Outer Frame (Jamb) ---
  const frameDepth = 0.12;
  const frameWidthTotal = 2 * doorWidth + 0.04; // Gap between doors
  const frameHeightTotal = doorHeight + 0.04;
  const jambWidth = 0.10;

  // Left Jamb
  addBox(jambWidth, frameHeightTotal, frameDepth, woodMat, -frameWidthTotal / 2 - jambWidth / 2, 0, 0);
  // Right Jamb
  addBox(jambWidth, frameHeightTotal, frameDepth, woodMat, frameWidthTotal / 2 + jambWidth / 2, 0, 0);
  // Header (Top)
  addBox(frameWidthTotal + 2 * jambWidth, jambWidth, frameDepth, woodMat, 0, frameHeightTotal / 2 + jambWidth / 2, 0);
  // Threshold (Bottom) - slightly thicker visually usually, but keep consistent
  addBox(frameWidthTotal + 2 * jambWidth, jambWidth, frameDepth, woodMat, 0, -frameHeightTotal / 2 - jambWidth / 2, 0);

  // --- Doors ---
  // Left Door (Inactive)
  buildDoorLeaf(-doorWidth / 2 - 0.02, false);
  // Right Door (Active with handle)
  buildDoorLeaf(doorWidth / 2 + 0.02, true);

  // Normalize
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