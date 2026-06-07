export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const sidingMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.8,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb05040,
    metalness: 0.1,
    roughness: 0.7,
  });

  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x606060,
    metalness: 0.0,
    roughness: 0.9,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  const woodDoorMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    metalness: 0.0,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    ior: 1.5,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a45,
    metalness: 0.0,
    roughness: 0.9,
  });

  const porchFloorMat = new THREE.MeshStandardMaterial({
    color: 0x9c8b75,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const houseW = 1.2;
  const houseD = 0.9;
  const wallH = 0.6;
  const foundationH = 0.08;
  const roofPitch = 0.4; // Height of roof peak above wall

  // --- Foundation ---
  const foundationGeom = new THREE.BoxGeometry(houseW + 0.04, foundationH, houseD + 0.04);
  const foundation = new THREE.Mesh(foundationGeom, foundationMat);
  foundation.position.y = foundationH / 2;
  root.add(foundation);

  // Foundation Vents
  const ventGeom = new THREE.BoxGeometry(0.08, 0.04, 0.02);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const ventPositions = [
    [-0.4, foundationH / 2, houseD / 2 + 0.01],
    [0.4, foundationH / 2, houseD / 2 + 0.01],
    [-0.4, foundationH / 2, -houseD / 2 - 0.01],
    [0.4, foundationH / 2, -houseD / 2 - 0.01],
  ];
  ventPositions.forEach((pos) => {
    const vent = new THREE.Mesh(ventGeom, ventMat);
    vent.position.set(...pos);
    root.add(vent);
  });

  // --- Main Walls ---
  const wallGeom = new THREE.BoxGeometry(houseW, wallH, houseD);
  const mainWalls = new THREE.Mesh(wallGeom, sidingMat);
  mainWalls.position.y = foundationH + wallH / 2;
  root.add(mainWalls);

  // --- Main Roof (Gable, ridge along X) ---
  const roofW = houseW + 0.1; // Overhang
  const roofD = houseD + 0.1;
  const roofSlantLen = Math.sqrt(Math.pow(roofW / 2, 2) + Math.pow(roofPitch, 2));
  const roofAngle = Math.atan2(roofPitch, roofW / 2);

  const roofPanelGeom = new THREE.BoxGeometry(roofSlantLen, 0.03, roofD);
  
  // Left Roof Panel
  const roofLeft = new THREE.Mesh(roofPanelGeom, roofMat);
  roofLeft.position.set(-roofW / 4, foundationH + wallH + roofPitch / 2, 0);
  roofLeft.rotation.z = -roofAngle;
  root.add(roofLeft);

  // Right Roof Panel
  const roofRight = new THREE.Mesh(roofPanelGeom, roofMat);
  roofRight.position.set(roofW / 4, foundationH + wallH + roofPitch / 2, 0);
  roofRight.rotation.z = roofAngle;
  root.add(roofRight);

  // Ridge Cap
  const ridgeGeom = new THREE.BoxGeometry(0.06, 0.06, roofD + 0.02);
  const ridge = new THREE.Mesh(ridgeGeom, roofMat);
  ridge.position.set(0, foundationH + wallH + roofPitch, 0);
  root.add(ridge);

  // Gable Ends (Triangles)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseW / 2, 0);
  gableShape.lineTo(houseW / 2, 0);
  gableShape.lineTo(0, roofPitch);
  gableShape.lineTo(-houseW / 2, 0);
  
  const gableGeom = new THREE.ExtrudeGeometry(gableShape, { depth: 0.02, bevelEnabled: false });
  
  // Front Gable End
  const gableFront = new THREE.Mesh(gableGeom, sidingMat);
  gableFront.position.set(0, foundationH + wallH, houseD / 2 + 0.01);
  root.add(gableFront);

  // Back Gable End
  const gableBack = new THREE.Mesh(gableGeom, sidingMat);
  gableBack.position.set(0, foundationH + wallH, -houseD / 2 - 0.01);
  gableBack.rotation.y = Math.PI;
  root.add(gableBack);

  // Gable Vents
  const ventSlatGeom = new THREE.BoxGeometry(0.12, 0.015, 0.01);
  const addGableVent = (z, yOff) => {
    for (let i = 0; i < 4; i++) {
      const slat = new THREE.Mesh(ventSlatGeom, trimMat);
      slat.position.set(0, foundationH + wallH + 0.15 + i * 0.025, z);
      root.add(slat);
    }
  };
  addGableVent(houseD / 2 + 0.02, 0);
  addGableVent(-houseD / 2 - 0.02, 0);

  // --- Front Wing / Gable Projection ---
  const wingW = 0.5;
  const wingD = 0.25;
  const wingH = wallH * 0.8;
  
  const wingWallsGeom = new THREE.BoxGeometry(wingW, wingH, wingD);
  const wingWalls = new THREE.Mesh(wingWallsGeom, sidingMat);
  wingWalls.position.set(0, foundationH + wingH / 2, houseD / 2 + wingD / 2);
  root.add(wingWalls);

  // Wing Roof
  const wingRoofPitch = 0.25;
  const wingRoofW = wingW + 0.08;
  const wingRoofD = wingD + 0.08;
  const wingSlantLen = Math.sqrt(Math.pow(wingRoofW / 2, 2) + Math.pow(wingRoofPitch, 2));
  const wingRoofAngle = Math.atan2(wingRoofPitch, wingRoofW / 2);

  const wingRoofPanelGeom = new THREE.BoxGeometry(wingSlantLen, 0.03, wingRoofD);
  
  const wingRoofLeft = new THREE.Mesh(wingRoofPanelGeom, roofMat);
  wingRoofLeft.position.set(-wingRoofW / 4, foundationH + wingH + wingRoofPitch / 2, houseD / 2 + wingD / 2);
  wingRoofLeft.rotation.z = -wingRoofAngle;
  root.add(wingRoofLeft);

  const wingRoofRight = new THREE.Mesh(wingRoofPanelGeom, roofMat);
  wingRoofRight.position.set(wingRoofW / 4, foundationH + wingH + wingRoofPitch / 2, houseD / 2 + wingD / 2);
  wingRoofRight.rotation.z = wingRoofAngle;
  root.add(wingRoofRight);
  
  const wingRidge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, wingRoofD + 0.02), roofMat);
  wingRidge.position.set(0, foundationH + wingH + wingRoofPitch, houseD / 2 + wingD / 2);
  root.add(wingRidge);

  // Wing Gable Front
  const wingGableShape = new THREE.Shape();
  wingGableShape.moveTo(-wingW / 2, 0);
  wingGableShape.lineTo(wingW / 2, 0);
  wingGableShape.lineTo(0, wingRoofPitch);
  const wingGableGeom = new THREE.ExtrudeGeometry(wingGableShape, { depth: 0.02, bevelEnabled: false });
  const wingGableFront = new THREE.Mesh(wingGableGeom, sidingMat);
  wingGableFront.position.set(0, foundationH + wingH, houseD / 2 + wingD / 2 + 0.01);
  root.add(wingGableFront);

  // --- Porch ---
  const porchW = 0.9;
  const porchD = 0.35;
  const porchH = 0.05;
  const porchY = foundationH;
  
  const porchFloorGeom = new THREE.BoxGeometry(porchW, porchH, porchD);
  const porchFloor = new THREE.Mesh(porchFloorGeom, porchFloorMat);
  porchFloor.position.set(0, porchY + porchH / 2, houseD / 2 + porchD / 2);
  root.add(porchFloor);

  // Porch Roof (Low slope)
  const porchRoofW = porchW + 0.1;
  const porchRoofD = porchD + 0.1;
  const porchRoofGeom = new THREE.BoxGeometry(porchRoofW, 0.03, porchRoofD);
  const porchRoof = new THREE.Mesh(porchRoofGeom, roofMat);
  porchRoof.position.set(0, foundationH + wingH + 0.05, houseD / 2 + porchD / 2);
  // Slight slope
  porchRoof.rotation.x = -0.1; 
  root.add(porchRoof);

  // Porch Columns
  const colGeom = new THREE.CylinderGeometry(0.025, 0.025, wingH, 8);
  const colPositions = [
    [-porchW / 2 + 0.05, porchY + wingH / 2, houseD / 2 + porchD / 2],
    [-0.15, porchY + wingH / 2, houseD / 2 + porchD / 2],
    [0.15, porchY + wingH / 2, houseD / 2 + porchD / 2],
    [porchW / 2 - 0.05, porchY + wingH / 2, houseD / 2 + porchD / 2],
  ];
  colPositions.forEach((pos) => {
    const col = new THREE.Mesh(colGeom, trimMat);
    col.position.set(...pos);
    root.add(col);
  });

  // Porch Railing
  const railPostGeom = new THREE.BoxGeometry(0.015, 0.25, 0.015);
  const railTopGeom = new THREE.BoxGeometry(porchW, 0.02, 0.02);
  
  // Front railing posts
  for (let i = 0; i < 6; i++) {
    const x = -porchW / 2 + 0.1 + i * ((porchW - 0.2) / 5);
    const post = new THREE.Mesh(railPostGeom, trimMat);
    post.position.set(x, porchY + 0.125, houseD / 2 + porchD / 2 - 0.05);
    root.add(post);
  }
  // Front railing top
  const railTop = new THREE.Mesh(railTopGeom, trimMat);
  railTop.position.set(0, porchY + 0.25, houseD / 2 + porchD / 2 - 0.05);
  root.add(railTop);

  // --- Chimney ---
  const chimW = 0.12;
  const chimD = 0.12;
  const chimH = 0.3;
  const chimGeom = new THREE.BoxGeometry(chimW, chimH, chimD);
  const chimney = new THREE.Mesh(chimGeom, brickMat);
  // Position on right roof slope
  chimney.position.set(0.3, foundationH + wallH + roofPitch * 0.6, -0.2);
  chimney.rotation.z = roofAngle; // Align with roof slope
  // Adjust Y because rotation pivots at center
  chimney.position.y += 0.1; 
  root.add(chimney);
  
  // Chimney Cap
  const capGeom = new THREE.BoxGeometry(chimW + 0.04, 0.04, chimD + 0.04);
  const cap = new THREE.Mesh(capGeom, brickMat);
  cap.position.copy(chimney.position);
  cap.position.y += chimH / 2 + 0.02;
  cap.rotation.z = 0; // Cap is flat
  root.add(cap);

  // --- Windows ---
  const winFrameMat = trimMat;
  
  // Helper to create window
  function createWindow(w, h, x, y, z, ry, panesX, panesY) {
    const group = new THREE.Group();
    
    // Frame
    const frameGeom = new THREE.BoxGeometry(w, h, 0.03);
    const frame = new THREE.Mesh(frameGeom, winFrameMat);
    group.add(frame);
    
    // Glass
    const glassGeom = new THREE.PlaneGeometry(w * 0.9, h * 0.9);
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.z = 0.02;
    group.add(glass);
    
    // Muntins (Grid)
    const muntinMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const muntinH = new THREE.BoxGeometry(w * 0.9, 0.01, 0.01);
    const muntinV = new THREE.BoxGeometry(0.01, h * 0.9, 0.01);
    
    if (panesX > 1) {
        for (let i = 1; i < panesX; i++) {
            const m = new THREE.Mesh(muntinV, muntinMat);
            m.position.x = -w/2 + (w/panesX) * i;
            group.add(m);
        }
    }
    if (panesY > 1) {
        for (let i = 1; i < panesY; i++) {
            const m = new THREE.Mesh(muntinH, muntinMat);
            m.position.y = -h/2 + (h/panesY) * i;
            group.add(m);
        }
    }

    group.position.set(x, y, z);
    group.rotation.y = ry;
    return group;
  }

  // Side Window (Left Wall)
  const winSide = createWindow(0.15, 0.2, -houseW / 2 - 0.015, foundationH + wallH * 0.6, 0, Math.PI / 2, 2, 2);
  root.add(winSide);

  // Front Wing Window (Triple)
  const winFrontGroup = new THREE.Group();
  const winFront = createWindow(0.25, 0.18, 0, foundationH + wingH * 0.6, houseD / 2 + wingD / 2 + 0.015, 0, 3, 1);
  winFrontGroup.add(winFront);
  root.add(winFrontGroup);

  // Small Side Window on Wing
  const winWingSide = createWindow(0.08, 0.12, wingW / 2 + 0.015, foundationH + wingH * 0.6, houseD / 2 + wingD / 2, Math.PI / 2, 2, 2);
  root.add(winWingSide);

  // Porch Windows (Large Panes)
  const porchWinGroup = new THREE.Group();
  // Left Porch Window
  const pWinL = createWindow(0.18, 0.3, -0.35, foundationH + 0.15, houseD / 2 + porchD / 2 + 0.015, 0, 1, 2);
  porchWinGroup.add(pWinL);
  // Right Porch Window (Double)
  const pWinR1 = createWindow(0.18, 0.3, 0.15, foundationH + 0.15, houseD / 2 + porchD / 2 + 0.015, 0, 1, 2);
  const pWinR2 = createWindow(0.18, 0.3, 0.35, foundationH + 0.15, houseD / 2 + porchD / 2 + 0.015, 0, 1, 2);
  porchWinGroup.add(pWinR1);
  porchWinGroup.add(pWinR2);
  root.add(porchWinGroup);

  // --- Door ---
  const doorW = 0.14;
  const doorH = 0.35;
  const doorGeom = new THREE.BoxGeometry(doorW, doorH, 0.03);
  const door = new THREE.Mesh(doorGeom, woodDoorMat);
  door.position.set(-0.55, foundationH + doorH / 2, houseD / 2 + 0.015);
  root.add(door);

  // Door Frame
  const doorFrameGeom = new THREE.BoxGeometry(doorW + 0.04, doorH + 0.04, 0.04);
  const doorFrame = new THREE.Mesh(doorFrameGeom, trimMat);
  doorFrame.position.set(-0.55, foundationH + doorH / 2, houseD / 2 + 0.015);
  root.add(doorFrame);

  // Door Handle
  const handleGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.8, roughness: 0.2 });
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(-0.55 + doorW / 2 - 0.02, foundationH + doorH / 2, houseD / 2 + 0.03);
  root.add(handle);

  // Steps
  const stepGeom = new THREE.BoxGeometry(0.2, 0.04, 0.1);
  const step1 = new THREE.Mesh(stepGeom, woodDoorMat);
  step1.position.set(-0.55, foundationH + 0.02, houseD / 2 + 0.15);
  root.add(step1);
  const step2 = new THREE.Mesh(stepGeom, woodDoorMat);
  step2.position.set(-0.55, foundationH + 0.06, houseD / 2 + 0.25);
  root.add(step2);

  // --- Skylight ---
  const skyGeom = new THREE.BoxGeometry(0.15, 0.02, 0.2);
  const skyMat = new THREE.MeshPhysicalMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.2,
    transmission: 0.5,
    transparent: true
  });
  const skylight = new THREE.Mesh(skyGeom, skyMat);
  skylight.position.set(0.4, foundationH + wallH + roofPitch * 0.8, 0.1);
  skylight.rotation.z = roofAngle;
  skylight.rotation.y = -0.2;
  root.add(skylight);

  // --- Gutters / Trim ---
  const gutterGeom = new THREE.CylinderGeometry(0.015, 0.015, houseW, 8);
  const gutterLeft = new THREE.Mesh(gutterGeom, trimMat);
  gutterLeft.rotation.z = Math.PI / 2;
  gutterLeft.rotation.y = Math.PI / 2;
  gutterLeft.position.set(0, foundationH + wallH, houseD / 2 + 0.05);
  root.add(gutterLeft);

  const downspoutGeom = new THREE.CylinderGeometry(0.01, 0.01, wallH, 8);
  const downspout = new THREE.Mesh(downspoutGeom, trimMat);
  downspout.position.set(houseW / 2 + 0.05, foundationH + wallH / 2, houseD / 2 + 0.05);
  root.add(downspout);

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