export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f8,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const totalWidth = 1.4;
  const totalHeight = 2.2;
  const depth = 0.12;
  const frameThickness = 0.08;
  const doorGap = 0.02;
  
  const doorWidth = (totalWidth - frameThickness * 2 - doorGap) / 2;
  const doorHeight = totalHeight - frameThickness * 2;
  
  const glassSectionHeight = 1.3;
  const panelSectionHeight = doorHeight - glassSectionHeight;
  
  const stileWidth = 0.08;
  const railHeight = 0.08;
  const muntinHeight = 0.04;
  
  const glassPaneHeight = (glassSectionHeight - railHeight * 2 - muntinHeight * 2) / 3;
  const glassPaneWidth = doorWidth - stileWidth * 2 - 0.01; // slight inset

  // --- Helper ---
  function createBox(w, h, d, mat, x, y, z, parent) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // --- Outer Frame ---
  const outerFrame = new THREE.Group();
  root.add(outerFrame);

  // Top frame
  createBox(totalWidth, frameThickness, depth, woodMat, 0, totalHeight / 2 - frameThickness / 2, 0, outerFrame);
  // Bottom frame
  createBox(totalWidth, frameThickness, depth, woodMat, 0, -totalHeight / 2 + frameThickness / 2, 0, outerFrame);
  // Left frame
  createBox(frameThickness, totalHeight - frameThickness * 2, depth, woodMat, -totalWidth / 2 + frameThickness / 2, 0, 0, outerFrame);
  // Right frame
  createBox(frameThickness, totalHeight - frameThickness * 2, depth, woodMat, totalWidth / 2 - frameThickness / 2, 0, 0, outerFrame);

  // --- Door Construction Function ---
  function createDoor(side, parent) {
    const doorGroup = new THREE.Group();
    const dir = side === 'left' ? -1 : 1;
    const centerX = dir * (doorWidth / 2 + frameThickness + doorGap / 2);
    const centerY = 0; // Aligned with frame center vertically (minus top/bottom frame offset handled by global coords)
    // Actually, let's align door center to (0,0) relative to its group, then position group
    // Door local center is 0,0,0.
    
    // 1. Door Base Slab (thin background)
    createBox(doorWidth, doorHeight, depth * 0.8, woodMat, 0, 0, 0, doorGroup);

    // 2. Stiles (Vertical sides)
    createBox(stileWidth, doorHeight, depth, woodMat, -doorWidth / 2 + stileWidth / 2, 0, 0, doorGroup);
    createBox(stileWidth, doorHeight, depth, woodMat, doorWidth / 2 - stileWidth / 2, 0, 0, doorGroup);

    // 3. Top Rail
    const topRailY = doorHeight / 2 - railHeight / 2;
    createBox(doorWidth - stileWidth * 2, railHeight, depth, woodMat, 0, topRailY, 0, doorGroup);

    // 4. Lock Rail (Middle horizontal)
    const lockRailY = -doorHeight / 2 + panelSectionHeight + railHeight / 2;
    createBox(doorWidth - stileWidth * 2, railHeight, depth, woodMat, 0, lockRailY, 0, doorGroup);

    // 5. Bottom Rail
    const botRailY = -doorHeight / 2 + railHeight / 2;
    createBox(doorWidth - stileWidth * 2, railHeight, depth, woodMat, 0, botRailY, 0, doorGroup);

    // 6. Muntins (Horizontal dividers in glass)
    const muntin1Y = topRailY - railHeight / 2 - glassPaneHeight - muntinHeight / 2;
    const muntin2Y = muntin1Y - glassPaneHeight - muntinHeight;
    
    createBox(doorWidth - stileWidth * 2 - 0.02, muntinHeight, depth * 0.9, woodMat, 0, muntin1Y, 0, doorGroup);
    createBox(doorWidth - stileWidth * 2 - 0.02, muntinHeight, depth * 0.9, woodMat, 0, muntin2Y, 0, doorGroup);

    // 7. Glass Panes (3 of them)
    const glassZ = depth * 0.45; // Slightly in front of back slab, behind frame
    const glass1Y = topRailY - railHeight / 2 - glassPaneHeight / 2;
    const glass2Y = muntin1Y - muntinHeight / 2 - glassPaneHeight / 2;
    const glass3Y = muntin2Y - muntinHeight / 2 - glassPaneHeight / 2;

    createBox(glassPaneWidth, glassPaneHeight, 0.02, glassMat, 0, glass1Y, glassZ, doorGroup);
    createBox(glassPaneWidth, glassPaneHeight, 0.02, glassMat, 0, glass2Y, glassZ, doorGroup);
    createBox(glassPaneWidth, glassPaneHeight, 0.02, glassMat, 0, glass3Y, glassZ, doorGroup);

    // 8. Bottom Panel (Raised)
    const panelY = -doorHeight / 2 + panelSectionHeight / 2 + railHeight / 2;
    const panelW = doorWidth - stileWidth * 2 - 0.04;
    const panelH = panelSectionHeight - railHeight * 2 - 0.04;
    // Main panel box
    createBox(panelW, panelH, depth * 0.9, woodMat, 0, panelY, 0, doorGroup);
    // Bevel detail (smaller box on top)
    createBox(panelW - 0.04, panelH - 0.04, depth * 0.95, woodMat, 0, panelY, 0.01, doorGroup);

    // 9. Handle
    const handleY = lockRailY;
    const handleX = dir * (doorWidth / 2 - 0.15);
    
    // Handle Base (Rosette)
    const baseGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
    baseGeom.rotateX(Math.PI / 2);
    const handleBase = new THREE.Mesh(baseGeom, metalMat);
    handleBase.position.set(handleX, handleY, depth / 2 + 0.01);
    doorGroup.add(handleBase);

    // Handle Lever
    const leverGeom = new THREE.BoxGeometry(0.02, 0.02, 0.12);
    const handleLever = new THREE.Mesh(leverGeom, metalMat);
    handleLever.position.set(handleX + dir * 0.06, handleY, depth / 2 + 0.02);
    // Rotate lever to point outwards
    handleLever.rotation.y = dir * Math.PI / 2; // Point along X axis
    // Wait, lever should point along Z? No, handles usually point along the door width or perpendicular.
    // In the image, handles point along the Z axis (out from door face).
    // My door faces +Z. So lever should extend in +Z.
    handleLever.rotation.y = 0; 
    handleLever.position.set(handleX, handleY, depth / 2 + 0.06);
    doorGroup.add(handleLever);

    // 10. Lock Plate (Right door only)
    if (side === 'right') {
      const plateGeom = new THREE.BoxGeometry(0.04, 0.15, 0.02);
      const lockPlate = new THREE.Mesh(plateGeom, metalMat);
      lockPlate.position.set(handleX, handleY, depth / 2 + 0.01);
      doorGroup.add(lockPlate);
    }

    // Position the whole door group in world space relative to root
    doorGroup.position.set(centerX, 0, 0);
    parent.add(doorGroup);
  }

  createDoor('left', root);
  createDoor('right', root);

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