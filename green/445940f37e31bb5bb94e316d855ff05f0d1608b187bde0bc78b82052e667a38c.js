export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const matPurple = new THREE.MeshStandardMaterial({ color: 0xD8B5E6, roughness: 0.8, metalness: 0.0 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0xB8E6C9, roughness: 0.8, metalness: 0.0 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xFDE6B8, roughness: 0.8, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0xE69B9B, roughness: 0.6, metalness: 0.1 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5, metalness: 0.0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.2, metalness: 0.1 });
  const matDoor = new THREE.MeshStandardMaterial({ color: 0xA8D8E6, roughness: 0.6, metalness: 0.0 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0xC4A484, roughness: 0.7, metalness: 0.0 });
  const matGutter = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.4, metalness: 0.3 });
  const matKnob = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.3, metalness: 0.5 });

  // --- Dimensions ---
  const wallH = 0.50;
  const wallThick = 0.04;
  const houseW = 1.10; // Total width
  const houseD = 0.80; // Total depth
  const roofOverhang = 0.08;
  const roofH = 0.25;  // Height of roof triangle

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  function addCylinder(rTop, rBot, h, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- Walls ---
  // We build walls as separate boxes to handle pastel colors easily.
  // Coordinate system: Center of house is (0,0,0).
  // Front face is at Z = houseD/2.
  
  const zFront = houseD / 2;
  const zBack = -houseD / 2;
  const yWallBase = 0;

  // 1. Front Left Wall (Purple)
  // Width approx 1/3 of front
  const wPurple = houseW * 0.33;
  addBox(wPurple, wallH, wallThick, matPurple, -houseW/2 + wPurple/2, wallH/2, zFront);

  // 2. Front Center Wall (Green) - Contains Door
  const wGreen = houseW * 0.34;
  addBox(wGreen, wallH, wallThick, matGreen, -houseW/2 + wPurple + wGreen/2, wallH/2, zFront);

  // 3. Front Right Wall (Yellow)
  const wYellowFront = houseW - wPurple - wGreen;
  addBox(wYellowFront, wallH, wallThick, matYellow, houseW/2 - wYellowFront/2, wallH/2, zFront);

  // 4. Side Right Wall (Yellow)
  // Connects front right corner to back
  addBox(wallThick, wallH, houseD, matYellow, houseW/2, wallH/2, 0);

  // 5. Back Wall (Purple - to match left side aesthetic)
  addBox(houseW, wallH, wallThick, matPurple, 0, wallH/2, zBack);

  // 6. Side Left Wall (Purple)
  addBox(wallThick, wallH, houseD, matPurple, -houseW/2, wallH/2, 0);

  // --- Baseboard ---
  // Thin strip around the bottom
  const baseH = 0.04;
  const baseY = baseH / 2;
  // Front
  addBox(houseW + wallThick*2, baseH, wallThick, matBase, 0, baseY, zFront + wallThick/2);
  // Back
  addBox(houseW + wallThick*2, baseH, wallThick, matBase, 0, baseY, zBack - wallThick/2);
  // Sides
  addBox(wallThick, baseH, houseD, matBase, -houseW/2 - wallThick/2, baseY, 0);
  addBox(wallThick, baseH, houseD, matBase, houseW/2 + wallThick/2, baseY, 0);


  // --- Roof ---
  // Gabled roof using ExtrudeGeometry for the triangle profile
  const roofShape = new THREE.Shape();
  roofShape.moveTo(0, 0);
  roofShape.lineTo(- (houseW/2 + roofOverhang), 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo((houseW/2 + roofOverhang), 0);
  roofShape.lineTo(0, 0);

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: houseD + roofOverhang * 2,
    bevelEnabled: false
  });
  // Center the geometry
  roofGeom.center();
  
  const roof = new THREE.Mesh(roofGeom, matRoof);
  roof.position.set(0, wallH + roofH/2, 0);
  // Rotate to align with Z axis (extrude is along Z by default in Shape logic usually, 
  // but let's check: Shape is in XY, extrude is Z. So the triangle is in XY plane.
  // We want the triangle in XZ plane? No, triangle in XY plane, extruded along Z is correct for a tunnel.
  // Wait, standard ExtrudeGeometry extrudes along Z. So the shape lies in XY.
  // My shape definition: (0,0) to (-W, 0) to (0, H). This is in XY plane.
  // Extruding along Z creates a prism running along Z. This is correct.
  root.add(roof);

  // Roof Corrugation (Ridges)
  // Add thin boxes along the slope
  const ridgeCount = 12;
  const ridgeW = 0.015;
  const ridgeH = 0.01;
  const slopeLen = Math.sqrt(Math.pow(houseW/2 + roofOverhang, 2) + Math.pow(roofH, 2));
  const slopeAngle = Math.atan2(roofH, houseW/2 + roofOverhang);
  
  for (let i = 0; i < ridgeCount; i++) {
    // Distribute along the slope
    const t = (i + 0.5) / ridgeCount; // 0 to 1
    // Position along slope from peak (t=0) to eave (t=1)
    // Actually let's just place them on the roof surface
    // We need to place them on both sides of the roof
    
    // Right side slope
    const distR = t * slopeLen;
    const xR = distR * Math.cos(slopeAngle);
    const yR = roofH - distR * Math.sin(slopeAngle);
    
    const ridgeR = addBox(ridgeW, ridgeH, houseD + roofOverhang*2 + 0.02, matRoof, xR, wallH + yR, 0);
    ridgeR.rotation.z = -slopeAngle;

    // Left side slope
    const xL = -xR;
    const ridgeL = addBox(ridgeW, ridgeH, houseD + roofOverhang*2 + 0.02, matRoof, xL, wallH + yR, 0);
    ridgeL.rotation.z = slopeAngle;
  }


  // --- Windows ---
  function createWindowFrame(x, y, z, ry, panesX, panesY, w, h) {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(x, y, z);
    frameGroup.rotation.y = ry;
    root.add(frameGroup);

    // Outer Frame
    addBox(w + 0.04, h + 0.04, 0.02, matWhite, 0, 0, 0, 0, 0, 0); // Relative to group
    
    // Glass
    addBox(w, h, 0.01, matGlass, 0, 0, 0.01, 0, 0, 0);

    // Muntins (Grid)
    const muntinThick = 0.015;
    const muntinDepth = 0.02;
    
    // Vertical muntins
    for (let i = 1; i < panesX; i++) {
      const mx = -w/2 + (w / panesX) * i;
      addBox(muntinThick, h, muntinDepth, matWhite, mx, 0, 0.01, 0, 0, 0);
    }
    // Horizontal muntins
    for (let i = 1; i < panesY; i++) {
      const my = -h/2 + (h / panesY) * i;
      addBox(w, muntinThick, muntinDepth, matWhite, 0, my, 0.01, 0, 0, 0);
    }
  }

  const winY = wallH * 0.6;
  const winW = 0.12;
  const winH = 0.14;

  // Window 1: Front Left (Purple) - 2 pane (1x2)
  createWindowFrame(-houseW/2 + wPurple/2, winY, zFront + wallThick/2 + 0.01, 0, 1, 2, winW, winH);

  // Window 2: Front Center (Green) - 4 pane (2x2) - Wait, door is here. 
  // Looking at image: Green section has Door. Window is to the left of door? 
  // No, the image shows: Purple(1 win), Green(Door), Yellow(2 wins).
  // Wait, let's re-examine image.
  // Left (Purple): 1 window (2-pane vertical).
  // Middle (Green): Door. Above door? No window above door.
  // Right (Yellow Front): 1 window (4-pane).
  // Side (Yellow): 1 window (2-pane vertical).
  // Gable (Purple): Vent.
  
  // Correction:
  // Front Left (Purple): Window at x = -0.35 approx.
  // Front Middle (Green): Door at x = 0.
  // Front Right (Yellow): Window at x = 0.35 approx.
  
  // Let's adjust positions based on wall segments defined earlier.
  // Purple center: -houseW/2 + wPurple/2 = -0.55 + 0.18 = -0.37
  createWindowFrame(-0.37, winY, zFront + wallThick/2 + 0.01, 0, 1, 2, winW, winH);

  // Yellow Front center: houseW/2 - wYellowFront/2 = 0.55 - 0.18 = 0.37
  createWindowFrame(0.37, winY, zFront + wallThick/2 + 0.01, 0, 2, 2, winW, winH);

  // Yellow Side center: x = houseW/2 + wallThick/2 + 0.01, z = 0
  createWindowFrame(houseW/2 + wallThick/2 + 0.01, winY, 0, Math.PI/2, 1, 2, winW, winH);


  // --- Door ---
  const doorW = 0.14;
  const doorH = 0.28;
  const doorY = doorH / 2;
  const doorZ = zFront + wallThick/2 + 0.01;
  const doorX = -houseW/2 + wPurple + wGreen/2; // Center of green section

  // Door Frame
  addBox(doorW + 0.04, doorH + 0.04, 0.02, matWhite, doorX, doorY, doorZ);
  // Door Slab
  addBox(doorW, doorH, 0.02, matDoor, doorX, doorY, doorZ + 0.01);
  // Knob
  addCylinder(0.01, 0.01, 0.02, matKnob, doorX + doorW/2 + 0.01, doorY, doorZ + 0.02, 0, 0, 0);
  // Step
  addBox(doorW + 0.1, 0.02, 0.1, matWhite, doorX, 0.01, zFront + wallThick + 0.05);


  // --- Gable Vent ---
  // On the Purple gable end (Left side, high up)
  const ventX = -houseW/2 - wallThick/2 - 0.01;
  const ventY = wallH + roofH * 0.6;
  const ventZ = 0;
  
  const ventW = 0.06;
  const ventH = 0.08;
  // Vent Frame
  addBox(ventW, ventH, 0.02, matWhite, ventX, ventY, ventZ, 0, Math.PI/2, 0);
  // Vent Slats (black lines)
  for(let i=0; i<4; i++) {
    const sy = ventY - ventH/2 + 0.015 + i * 0.015;
    addBox(ventW * 0.8, 0.005, 0.01, new THREE.MeshStandardMaterial({color:0x333333}), ventX, sy, ventZ, 0, Math.PI/2, 0);
  }


  // --- Gutter & Downspout ---
  // On the Right side (Yellow)
  const gutterR = 0.015;
  const gutterLen = houseD + roofOverhang * 2;
  
  // Horizontal Gutter along roof edge (Right side)
  // Position: x = houseW/2 + roofOverhang, y = wallH, z = 0
  // Rotate to match roof slope? No, gutter hangs off the eave.
  // Eave is at y = wallH.
  const gutterY = wallH - 0.02;
  const gutterX = houseW/2 + roofOverhang/2;
  
  // Main horizontal pipe
  addCylinder(gutterR, gutterR, gutterLen, matGutter, gutterX, gutterY, 0, Math.PI/2, 0, 0);
  
  // Downspout (Vertical pipe at front corner)
  const downspoutH = wallH;
  const downspoutX = houseW/2 + roofOverhang/2;
  const downspoutZ = houseD/2 + roofOverhang/2;
  addCylinder(gutterR, gutterR, downspoutH, matGutter, downspoutX, downspoutH/2, downspoutZ, 0, 0, 0);
  
  // Elbow at top
  addCylinder(gutterR, gutterR, 0.05, matGutter, downspoutX, gutterY, downspoutZ - 0.025, Math.PI/2, 0, 0);
  // Elbow at bottom
  addCylinder(gutterR, gutterR, 0.05, matGutter, downspoutX, 0.02, downspoutZ - 0.025, Math.PI/2, 0, 0);


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