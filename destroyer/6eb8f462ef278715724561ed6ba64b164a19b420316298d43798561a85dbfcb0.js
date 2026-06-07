export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const stoneMatBase = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.9,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a47c,
    roughness: 0.5,
    metalness: 0.0,
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.5,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 0.3,
  });

  const logMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.8,
    metalness: 0.0,
  });

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Dimensions ---
  const totalWidth = 1.2;
  const totalHeight = 1.3;
  const totalDepth = 0.6;
  const hearthHeight = 0.12;
  const hearthDepth = 0.45;
  
  const fireboxWidth = 0.65;
  const fireboxHeight = 0.55;
  const fireboxDepth = 0.35;
  const fireboxY = hearthHeight + 0.15;
  const fireboxZ = 0.05; // Recessed slightly from front face

  const mantelHeight = 0.15;
  const mantelOverhang = 0.1;

  // --- Helpers ---
  const stoneColors = [
    0x888899, 0x999999, 0xaaaaaa, // Greys
    0xc0b090, 0xd0c0a0,            // Tans
    0x907060, 0x806050,            // Browns
    0x606060, 0x505050             // Dark Greys
  ];

  function getStoneColor(index) {
    return stoneColors[index % stoneColors.length];
  }

  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  function addStone(x, y, z, w, h, d, colorIndex) {
    const mat = stoneMatBase.clone();
    mat.color.setHex(getStoneColor(colorIndex));
    // Add slight random-ish variation to roughness/color based on position for realism
    // Using deterministic math based on coordinates
    const variation = (Math.sin(x * 10) + Math.cos(y * 10)) * 0.05;
    mat.roughness = 0.85 + Math.abs(variation);
    
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    root.add(mesh);
  }

  // --- 1. Hearth ---
  // Base slab
  addBox(totalWidth + 0.2, hearthHeight, hearthDepth, stoneMatBase, 0, hearthHeight / 2, 0.1);
  
  // Hearth top stones (visual detail)
  const hearthStoneW = 0.3;
  const hearthStoneH = 0.04;
  const hearthStoneD = hearthDepth - 0.05;
  let hIdx = 0;
  for (let x = -totalWidth / 2 + 0.1; x < totalWidth / 2 - 0.1; x += hearthStoneW) {
    const w = Math.min(hearthStoneW, totalWidth / 2 - 0.1 - x + hearthStoneW/2); // Clamp last one
    addStone(x + w/2 - hearthStoneW/2, hearthHeight + hearthStoneH/2, 0.1, w, hearthStoneH, hearthStoneD, hIdx++);
  }

  // --- 2. Stone Wall Body ---
  // We build rows of stones, skipping the firebox area.
  const stoneRowHeight = 0.12;
  const stoneDepth = 0.4;
  const wallStartY = hearthHeight;
  const wallEndY = totalHeight - mantelHeight;
  
  let sIdx = 100; // Offset index for wall stones
  let currentY = wallStartY + stoneRowHeight / 2;

  while (currentY < wallEndY) {
    const rowH = stoneRowHeight * (0.8 + Math.sin(currentY) * 0.2); // Vary height slightly
    const isFireboxRow = (currentY >= fireboxY - rowH/2 && currentY <= fireboxY + fireboxHeight + rowH/2);
    
    let currentX = -totalWidth / 2 + 0.05;
    let offset = (Math.floor(currentY / stoneRowHeight) % 2) * 0.15; // Stagger joints
    
    while (currentX < totalWidth / 2 - 0.05) {
      // Determine stone width
      let stoneW = 0.15 + Math.abs(Math.sin(currentX * 5 + currentY * 3)) * 0.15;
      if (currentX + stoneW > totalWidth / 2) stoneW = totalWidth / 2 - currentX;

      // Check collision with firebox
      const fbLeft = -fireboxWidth / 2 - 0.05; // Leave gap for frame
      const fbRight = fireboxWidth / 2 + 0.05;
      
      let drawStone = true;
      let drawX = currentX + offset;
      let drawW = stoneW;

      if (isFireboxRow) {
        if (drawX + drawW > fbLeft && drawX < fbRight) {
          // Intersection logic: split stone or skip
          if (drawX < fbLeft) {
            drawW = fbLeft - drawX;
          } else if (drawX > fbRight) {
            // Draw normally
          } else {
            // Completely inside firebox area, skip
            drawStone = false;
          }
        }
      }

      if (drawStone && drawW > 0.05) {
        // Center the stone logic
        const finalX = drawX + drawW / 2 - offset; 
        // Re-calculate based on grid to avoid gaps
        const gridX = currentX + stoneW/2;
        
        // Simple placement: if the center of the potential stone is outside firebox bounds
        const centerCheck = currentX + offset + stoneW/2;
        const inFirebox = (centerCheck > fbLeft && centerCheck < fbRight && isFireboxRow);

        if (!inFirebox) {
           // Adjust width if it overlaps firebox edge
           let finalW = stoneW;
           let finalXPos = currentX + offset + stoneW/2;
           
           if (currentX + offset < fbLeft && currentX + offset + stoneW > fbLeft) {
             finalW = fbLeft - (currentX + offset);
             finalXPos = (currentX + offset) + finalW/2;
           } else if (currentX + offset < fbRight && currentX + offset + stoneW > fbRight) {
             finalW = (currentX + offset + stoneW) - fbRight;
             finalXPos = fbRight + finalW/2;
           }

           if (finalW > 0.04) {
             addStone(finalXPos, currentY, 0, finalW, rowH * 0.95, stoneDepth, sIdx++);
           }
        }
      }
      currentX += stoneW;
    }
    currentY += rowH;
  }

  // --- 3. Firebox ---
  // Interior Cavity (Black Box)
  addBox(fireboxWidth + 0.1, fireboxHeight + 0.1, fireboxDepth, 
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 }), 
    0, fireboxY + fireboxHeight/2, -0.1);

  // Frame (4 bars)
  const frameThick = 0.04;
  const frameDepth = 0.05;
  // Top
  addBox(fireboxWidth + frameThick*2, frameThick, frameDepth, blackMetalMat, 0, fireboxY + fireboxHeight + frameThick/2, fireboxZ);
  // Bottom
  addBox(fireboxWidth + frameThick*2, frameThick, frameDepth, blackMetalMat, 0, fireboxY - frameThick/2, fireboxZ);
  // Left
  addBox(frameThick, fireboxHeight, frameDepth, blackMetalMat, -fireboxWidth/2 - frameThick/2, fireboxY, fireboxZ);
  // Right
  addBox(frameThick, fireboxHeight, frameDepth, blackMetalMat, fireboxWidth/2 + frameThick/2, fireboxY, fireboxZ);

  // Glass Pane
  addBox(fireboxWidth - 0.02, fireboxHeight - 0.02, 0.01, glassMat, 0, fireboxY, fireboxZ + frameDepth/2 + 0.005);

  // Logs (Procedural pile)
  const logGroup = new THREE.Group();
  logGroup.position.set(0, fireboxY - fireboxHeight/2 + 0.05, 0);
  
  function addLog(r, l, x, y, z, rx, ry, rz) {
    const geom = new THREE.CylinderGeometry(r, r, l, 12);
    const mesh = new THREE.Mesh(geom, logMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    logGroup.add(mesh);
  }

  // Base logs
  addLog(0.04, 0.35, -0.1, 0.04, 0, 0, 0, Math.PI/2);
  addLog(0.04, 0.35, 0.1, 0.04, 0, 0, 0, Math.PI/2);
  addLog(0.03, 0.3, 0, 0.08, -0.1, Math.PI/4, 0, 0);
  addLog(0.03, 0.3, 0, 0.12, 0.1, -Math.PI/4, 0, 0);
  
  // Embers/Gravel (Small spheres)
  for (let i = 0; i < 20; i++) {
    const r = 0.01 + Math.abs(Math.sin(i)) * 0.015;
    const x = (Math.sin(i * 13) * 0.2);
    const z = (Math.cos(i * 7) * 0.15);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), emberMat);
    ember.position.set(x, 0.02, z);
    logGroup.add(ember);
  }
  root.add(logGroup);

  // --- 4. Mantel Shelf ---
  // Main shelf block
  const shelfW = totalWidth + mantelOverhang * 2;
  const shelfH = 0.08;
  const shelfD = totalDepth + 0.1;
  addBox(shelfW, shelfH, shelfD, woodMat, 0, totalHeight - shelfH/2, 0.05);

  // Mantel Molding (Ogee profile via Extrude)
  const moldShape = new THREE.Shape();
  moldShape.moveTo(0, 0);
  moldShape.bezierCurveTo(0.02, 0, 0.02, 0.04, 0.06, 0.04); // Top curve out
  moldShape.bezierCurveTo(0.08, 0.04, 0.08, 0.02, 0.06, 0.02); // Bottom curve in
  moldShape.lineTo(0, 0.02);
  moldShape.lineTo(0, 0);

  const moldGeom = new THREE.ExtrudeGeometry(moldShape, {
    depth: shelfW,
    bevelEnabled: false,
  });
  const molding = new THREE.Mesh(moldGeom, woodMat);
  molding.rotation.z = Math.PI / 2;
  molding.rotation.y = Math.PI / 2;
  molding.position.set(0, totalHeight - shelfH - 0.02, shelfD/2 - 0.03);
  root.add(molding);

  // --- 5. Corbels (Brackets) ---
  const corbelShape = new THREE.Shape();
  corbelShape.moveTo(0, 0);
  corbelShape.lineTo(0, 0.18);
  corbelShape.bezierCurveTo(0, 0.22, 0.05, 0.22, 0.08, 0.18); // Top curve
  corbelShape.bezierCurveTo(0.12, 0.14, 0.12, 0.08, 0.08, 0.04); // S-curve belly
  corbelShape.bezierCurveTo(0.05, 0.02, 0.02, 0.02, 0, 0); // Bottom curve
  corbelShape.lineTo(0, 0);

  const corbelGeom = new THREE.ExtrudeGeometry(corbelShape, {
    depth: 0.12,
    bevelEnabled: false,
  });

  // Left Corbel
  const leftCorbel = new THREE.Mesh(corbelGeom, woodMat);
  leftCorbel.rotation.z = Math.PI / 2; // Stand up
  leftCorbel.rotation.y = Math.PI; // Face inward
  leftCorbel.position.set(-totalWidth/2 + 0.15, totalHeight - mantelHeight - 0.09, totalDepth/2 - 0.02);
  root.add(leftCorbel);

  // Right Corbel
  const rightCorbel = new THREE.Mesh(corbelGeom, woodMat);
  rightCorbel.rotation.z = Math.PI / 2;
  rightCorbel.rotation.y = 0; // Face inward
  rightCorbel.position.set(totalWidth/2 - 0.15, totalHeight - mantelHeight - 0.09, totalDepth/2 - 0.02);
  root.add(rightCorbel);

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