export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Medium brown, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Semi-transparent, slightly frosted
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
    ior: 1.5,
  });

  // Handle: Dark metal
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const totalWidth = 1.0;
  const totalHeight = 1.6;
  const frameDepth = 0.08;
  const frameThickness = 0.06;
  
  const openingWidth = totalWidth - 2 * frameThickness;
  const openingHeight = totalHeight - 2 * frameThickness;
  
  const leafWidth = openingWidth / 2;
  const leafHeight = openingHeight;
  const leafDepth = 0.04;
  
  const stileWidth = 0.05;
  const railHeight = 0.05;
  
  // Glass section setup
  const glassSectionHeight = leafHeight * 0.6; // Top 60% is glass
  const panelSectionHeight = leafHeight * 0.4; // Bottom 40% is panel
  
  const numGlassPanes = 3;
  const glassPaneHeight = (glassSectionHeight - 4 * railHeight) / 3; // 3 panes, 4 rails (top, 2 muntins, mid)
  // Actually, let's simplify: Top Rail, Muntin 1, Muntin 2, Mid Rail.
  // That's 4 horizontal bars in the glass section.
  
  // --- Helpers ---
  function createBox(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  function createDoorLeaf(sideMultiplier) {
    const leafGroup = new THREE.Group();
    const centerX = sideMultiplier * (leafWidth / 2 + frameThickness); // Position relative to center of opening
    // Actually, let's position the leaf group at the center of the leaf
    leafGroup.position.set(centerX, 0, 0);

    // Stiles (Vertical sides) - run full height
    const leftStile = createBox(stileWidth, leafHeight, leafDepth, woodMat, -leafWidth/2 + stileWidth/2, 0, 0);
    leafGroup.add(leftStile);
    
    const rightStile = createBox(stileWidth, leafHeight, leafDepth, woodMat, leafWidth/2 - stileWidth/2, 0, 0);
    leafGroup.add(rightStile);

    // Horizontal components
    const innerWidth = leafWidth - 2 * stileWidth;
    
    // 1. Top Rail
    createBox(innerWidth, railHeight, leafDepth, woodMat, 0, leafHeight/2 - railHeight/2, 0);
    leafGroup.children[leafGroup.children.length-1].position.set(0, leafHeight/2 - railHeight/2, 0); // Re-add to group logic handled by createBox adding to root, need to fix scope
    
    // Let's restart the leaf building logic to ensure everything goes into leafGroup
    // Clear previous adds to root for this function scope simulation
    // Better approach: Build meshes, add to leafGroup, then add leafGroup to root
  }
  
  // --- Re-implementing Door Construction for Clarity ---
  
  function buildDoorLeaf(xPos, hasHandle) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(xPos, 0, 0);
    
    const innerW = leafWidth - 2 * stileWidth;
    const startY = -leafHeight / 2;
    
    // Stiles
    const leftStile = new THREE.Mesh(new THREE.BoxGeometry(stileWidth, leafHeight, leafDepth), woodMat);
    leftStile.position.set(-leafWidth/2 + stileWidth/2, 0, 0);
    doorGroup.add(leftStile);
    
    const rightStile = new THREE.Mesh(new THREE.BoxGeometry(stileWidth, leafHeight, leafDepth), woodMat);
    rightStile.position.set(leafWidth/2 - stileWidth/2, 0, 0);
    doorGroup.add(rightStile);
    
    // Horizontal Bars
    // We have: Bottom Rail, Mid Rail, 2 Muntins, Top Rail
    // Total height = leafHeight
    // Panel Section Height = panelSectionHeight
    // Glass Section Height = glassSectionHeight
    
    // Bottom Rail
    const bottomRailY = startY + railHeight/2;
    const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(innerW, railHeight, leafDepth), woodMat);
    bottomRail.position.set(0, bottomRailY, 0);
    doorGroup.add(bottomRail);
    
    // Mid Rail (Separator between panel and glass)
    const midRailY = startY + panelSectionHeight - railHeight/2;
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(innerW, railHeight, leafDepth), woodMat);
    midRail.position.set(0, midRailY, 0);
    doorGroup.add(midRail);
    
    // Glass Muntins (2 of them)
    const glassAreaStart = midRailY + railHeight/2;
    const glassAreaEnd = leafHeight/2 - railHeight/2;
    const glassSpan = glassAreaEnd - glassAreaStart;
    const paneH = glassSpan / 3;
    
    const muntin1Y = glassAreaStart + paneH + railHeight/2;
    const muntin2Y = glassAreaStart + 2*paneH + railHeight/2;
    
    const muntin1 = new THREE.Mesh(new THREE.BoxGeometry(innerW, railHeight, leafDepth), woodMat);
    muntin1.position.set(0, muntin1Y, 0);
    doorGroup.add(muntin1);
    
    const muntin2 = new THREE.Mesh(new THREE.BoxGeometry(innerW, railHeight, leafDepth), woodMat);
    muntin2.position.set(0, muntin2Y, 0);
    doorGroup.add(muntin2);
    
    // Top Rail
    const topRailY = leafHeight/2 - railHeight/2;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(innerW, railHeight, leafDepth), woodMat);
    topRail.position.set(0, topRailY, 0);
    doorGroup.add(topRail);
    
    // Infills (Glass and Panel)
    // Panel (Bottom)
    const panelY = startY + panelSectionHeight/2;
    const panelH = panelSectionHeight - 2*railHeight; // Minus bottom and mid rail
    // Add a slight recess for the panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.02, panelH - 0.02, leafDepth - 0.01), woodMat);
    panel.position.set(0, panelY, 0.005); // Slightly forward
    doorGroup.add(panel);
    
    // Glass Panes (3)
    const glassDepth = 0.01;
    const glassZ = -leafDepth/2 + glassDepth/2; // Set back slightly
    
    // Pane 1 (Bottom of glass section)
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.02, paneH - 0.02, glassDepth), glassMat);
    g1.position.set(0, glassAreaStart + paneH/2, glassZ);
    doorGroup.add(g1);
    
    // Pane 2 (Middle)
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.02, paneH - 0.02, glassDepth), glassMat);
    g2.position.set(0, muntin1Y + railHeight/2 + paneH/2, glassZ);
    doorGroup.add(g2);
    
    // Pane 3 (Top)
    const g3 = new THREE.Mesh(new THREE.BoxGeometry(innerW - 0.02, paneH - 0.02, glassDepth), glassMat);
    g3.position.set(0, muntin2Y + railHeight/2 + paneH/2, glassZ);
    doorGroup.add(g3);
    
    // Handle (Only on right door, inner edge)
    if (hasHandle) {
      // Handle is on the RIGHT door, which is at positive X.
      // The inner edge is the LEFT side of the right door (negative X relative to door center).
      const handleY = 0; 
      const handleZ = leafDepth/2 + 0.02;
      
      // Backplate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.01), handleMat);
      plate.position.set(-stileWidth/2 - 0.01, handleY, handleZ);
      doorGroup.add(plate);
      
      // Lever
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 16), handleMat);
      lever.rotation.z = Math.PI / 2;
      lever.position.set(-stileWidth/2 + 0.04, handleY, handleZ + 0.01);
      doorGroup.add(lever);
      
      // Base cylinder
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16), handleMat);
      base.rotation.z = Math.PI / 2;
      base.position.set(-stileWidth/2 + 0.04, handleY, handleZ);
      doorGroup.add(base);
    }
    
    root.add(doorGroup);
  }

  // --- Build Frame ---
  // Left Frame Plank
  createBox(frameThickness, totalHeight, frameDepth, woodMat, -totalWidth/2 + frameThickness/2, 0, 0);
  // Right Frame Plank
  createBox(frameThickness, totalHeight, frameDepth, woodMat, totalWidth/2 - frameThickness/2, 0, 0);
  // Top Frame Plank
  createBox(totalWidth, frameThickness, frameDepth, woodMat, 0, totalHeight/2 - frameThickness/2, 0);
  // Bottom Frame Plank
  createBox(totalWidth, frameThickness, frameDepth, woodMat, 0, -totalHeight/2 + frameThickness/2, 0);

  // --- Build Doors ---
  // Left Door (x is negative)
  // Center of left opening: - (openingWidth / 4 + frameThickness)
  const leftDoorX = -(openingWidth / 4 + frameThickness);
  buildDoorLeaf(leftDoorX, false);
  
  // Right Door (x is positive)
  const rightDoorX = (openingWidth / 4 + frameThickness);
  buildDoorLeaf(rightDoorX, true);

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