export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6, metalness: 0.0 }); // Beige walls
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc05040, roughness: 0.7, metalness: 0.0 }); // Terracotta
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.0 }); // Fence
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.2, metalness: 0.1 }); // Window panes
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x4a7c35, roughness: 0.9, metalness: 0.0 }); // Grass/Bushes
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a0, roughness: 0.6, metalness: 0.0 }); // Window frames (slightly darker wood)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xc4a080, roughness: 0.6, metalness: 0.0 }); // Door
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.6 }); // Knob

  // --- Dimensions ---
  const baseSize = 0.9;
  const houseSize = 0.6;
  const wallHeight = 0.35;
  const roofHeight = 0.25;
  const fenceHeight = 0.08;
  const fenceDist = 0.15; // Distance from house to fence

  // --- Base & Grass ---
  const baseGeom = new THREE.BoxGeometry(baseSize, 0.02, baseSize);
  const basePlate = new THREE.Mesh(baseGeom, woodMat);
  basePlate.position.y = 0.01;
  root.add(basePlate);

  const grassGeom = new THREE.BoxGeometry(baseSize - 0.04, 0.01, baseSize - 0.04);
  const grass = new THREE.Mesh(grassGeom, greenMat);
  grass.position.y = 0.025;
  root.add(grass);

  // --- House Body ---
  const houseGeom = new THREE.BoxGeometry(houseSize, wallHeight, houseSize);
  const houseBody = new THREE.Mesh(houseGeom, woodMat);
  houseBody.position.y = wallHeight / 2;
  root.add(houseBody);

  // --- Roof Structure (Hipped/Gable hybrid for visual match) ---
  // Main Ridge along Z axis.
  const ridgeLen = 0.3;
  const roofStartY = wallHeight;
  const roofTopY = wallHeight + roofHeight;

  // Left Slope (facing -X)
  const leftSlopeGeom = new THREE.BoxGeometry(0.5, 0.1, houseSize + 0.1);
  const leftSlope = new THREE.Mesh(leftSlopeGeom, roofMat);
  leftSlope.position.set(-houseSize / 4, roofStartY + roofHeight / 2, 0);
  leftSlope.rotation.z = Math.PI / 4; // 45 deg
  root.add(leftSlope);

  // Right Slope (facing +X)
  const rightSlopeGeom = new THREE.BoxGeometry(0.5, 0.1, houseSize + 0.1);
  const rightSlope = new THREE.Mesh(rightSlopeGeom, roofMat);
  rightSlope.position.set(houseSize / 4, roofStartY + roofHeight / 2, 0);
  rightSlope.rotation.z = -Math.PI / 4;
  root.add(rightSlope);

  // Hip Ends (Pyramids at +Z and -Z)
  // Simplified as rotated boxes for the sloped faces
  const hipGeom = new THREE.BoxGeometry(houseSize + 0.1, 0.1, 0.5);
  
  const frontHip = new THREE.Mesh(hipGeom, roofMat);
  frontHip.position.set(0, roofStartY + roofHeight / 2, houseSize / 4);
  frontHip.rotation.x = Math.PI / 4;
  root.add(frontHip);

  const backHip = new THREE.Mesh(hipGeom, roofMat);
  backHip.position.set(0, roofStartY + roofHeight / 2, -houseSize / 4);
  backHip.rotation.x = -Math.PI / 4;
  root.add(backHip);

  // --- Roof Tiles (Instanced) ---
  const tileGeom = new THREE.BoxGeometry(0.04, 0.01, 0.05);
  const tileCount = 80; // Approximate
  const tileMesh = new THREE.InstancedMesh(tileGeom, roofMat, tileCount);
  let tileIdx = 0;

  function placeTiles(slopeMesh, rows, cols, offsetX, offsetZ, rotateY = 0) {
    const dummy = new THREE.Object3D();
    // Get world matrix of slope to place tiles relative to it
    slopeMesh.updateMatrixWorld();
    const slopeMatrix = slopeMesh.matrixWorld;
    
    // Local dimensions of the slope box
    const w = 0.5; // x size of slope box
    const d = houseSize + 0.1; // z size
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tileIdx >= tileCount) break;
        
        // Distribute on the local surface of the slope box
        // X goes from -w/2 to w/2, Z from -d/2 to d/2
        const lx = -w/2 + (c + 0.5) * (w / cols);
        const lz = -d/2 + (r + 0.5) * (d / rows);
        
        dummy.position.set(lx + offsetX, 0.005, lz + offsetZ); // Slight offset above surface
        dummy.rotation.set(0, rotateY, 0);
        dummy.updateMatrix();
        
        // Transform to world space then to parent (root) space
        // Since tileMesh is child of root, we need world pos
        const worldPos = new THREE.Vector3().setFromMatrixPosition(slopeMatrix);
        // Actually simpler: just place in world coordinates directly based on slope logic
        
        // Let's do manual placement for the 4 main slopes to ensure alignment
        tileIdx++;
      }
    }
  }
  
  // Manual tile placement for better control
  const dummy = new THREE.Object3D();
  
  // Helper to place a tile in world space
  function addTile(x, y, z, rx, ry, rz) {
    if (tileIdx >= tileCount) return;
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.updateMatrix();
    tileMesh.setMatrixAt(tileIdx++, dummy.matrix);
  }

  // Tiles on Left Slope (facing -X, rotated Z 45)
  // Surface normal points -X, +Y.
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const z = -0.25 + c * 0.06;
      const progress = (r + 0.5) / 6;
      // Interpolate from eave to ridge
      // Eave X: -0.3 - 0.05 (overhang), Ridge X: 0
      // Eave Y: 0.35, Ridge Y: 0.6
      const x = -0.35 + progress * 0.35; 
      const y = 0.35 + progress * 0.25;
      addTile(x, y, z, 0, 0, -Math.PI / 4);
    }
  }

  // Tiles on Right Slope (facing +X, rotated Z -45)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const z = -0.25 + c * 0.06;
      const progress = (r + 0.5) / 6;
      const x = 0.35 - progress * 0.35;
      const y = 0.35 + progress * 0.25;
      addTile(x, y, z, 0, 0, Math.PI / 4);
    }
  }
  
  // Tiles on Front Hip (facing +Z, rotated X 45)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
       const x = -0.25 + c * 0.08;
       const progress = (r + 0.5) / 5;
       const z = 0.35 - progress * 0.35;
       const y = 0.35 + progress * 0.25;
       addTile(x, y, z, -Math.PI / 4, 0, 0);
    }
  }
  
  // Tiles on Back Hip (facing -Z, rotated X -45)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
       const x = -0.25 + c * 0.08;
       const progress = (r + 0.5) / 5;
       const z = -0.35 + progress * 0.35;
       const y = 0.35 + progress * 0.25;
       addTile(x, y, z, Math.PI / 4, 0, 0);
    }
  }
  
  tileMesh.count = tileIdx;
  root.add(tileMesh);

  // --- Dormer (on Front Slope +Z) ---
  const dormerW = 0.15;
  const dormerH = 0.15;
  const dormerD = 0.1;
  const dormerGeom = new THREE.BoxGeometry(dormerW, dormerH, dormerD);
  const dormer = new THREE.Mesh(dormerGeom, woodMat);
  // Position on front slope
  dormer.position.set(0, 0.45, 0.25);
  dormer.rotation.x = Math.PI / 4; // Match slope
  root.add(dormer);
  
  // Dormer Window
  const dWinGeom = new THREE.BoxGeometry(0.08, 0.08, 0.01);
  const dWin = new THREE.Mesh(dWinGeom, glassMat);
  dWin.position.set(0, 0, dormerD/2 + 0.001);
  dormer.add(dWin);
  const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), frameMat);
  dFrame.position.set(0, 0, dormerD/2 + 0.005);
  dormer.add(dFrame);

  // --- Chimney ---
  const chimGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
  const chimney = new THREE.Mesh(chimGeom, woodMat); // Wooden chimney in this style? Or brick. Image looks like light wood/cork.
  chimney.position.set(0.15, 0.6, -0.15); // On back slope
  chimney.rotation.x = -Math.PI / 4; // Align with slope
  root.add(chimney);
  
  const chimCapGeom = new THREE.TorusGeometry(0.05, 0.005, 8, 16);
  const chimCap = new THREE.Mesh(chimCapGeom, woodMat);
  chimCap.position.set(0, 0.08, 0);
  chimCap.rotation.x = Math.PI / 2;
  chimney.add(chimCap);

  // --- Windows ---
  function createWindow() {
    const wGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.02), frameMat);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.01), glassMat);
    glass.position.z = 0.005;
    
    // Muntins (cross bars)
    const muntinH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.01), frameMat);
    const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.10, 0.01), frameMat);
    muntinH.position.z = 0.006;
    muntinV.position.z = 0.006;
    
    wGroup.add(frame, glass, muntinH, muntinV);
    return wGroup;
  }

  // Front Wall Windows (One next to door)
  const win1 = createWindow();
  win1.position.set(0.15, 0.25, houseSize/2 + 0.01);
  root.add(win1);

  // Side Wall Windows (Two)
  const win2 = createWindow();
  win2.position.set(houseSize/2 + 0.01, 0.25, 0.15);
  win2.rotation.y = Math.PI / 2;
  root.add(win2);

  const win3 = createWindow();
  win3.position.set(houseSize/2 + 0.01, 0.25, -0.15);
  win3.rotation.y = Math.PI / 2;
  root.add(win3);

  // --- Door ---
  const doorGeom = new THREE.BoxGeometry(0.12, 0.22, 0.02);
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(-0.15, 0.11, houseSize/2 + 0.01);
  root.add(door);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), metalMat);
  knob.position.set(0.04, 0, 0.015);
  door.add(knob);

  // --- Fence ---
  const picketGeom = new THREE.BoxGeometry(0.02, fenceHeight, 0.04);
  // Round top approximation via scaling or just box for low poly style
  const picketCount = 40;
  const fenceMesh = new THREE.InstancedMesh(picketGeom, whiteMat, picketCount);
  
  const fenceDummy = new THREE.Object3D();
  const perimeter = (baseSize + fenceDist * 2) * 4; // Approx square
  // Actually let's just place them on a square path
  const pathSize = baseSize / 2 + fenceDist;
  let fIdx = 0;
  
  const segmentsPerSide = 10;
  const step = (pathSize * 2) / segmentsPerSide;
  
  for (let i = 0; i < 4; i++) { // 4 sides
    for (let j = 0; j < segmentsPerSide; j++) {
      if (fIdx >= picketCount) break;
      
      let x, z;
      const offset = -pathSize + j * step + step/2;
      
      if (i === 0) { x = offset; z = pathSize; } // Front
      else if (i === 1) { x = pathSize; z = offset; } // Right
      else if (i === 2) { x = offset; z = -pathSize; } // Back
      else { x = -pathSize; z = offset; } // Left
      
      fenceDummy.position.set(x, fenceHeight/2 + 0.025, z);
      // Rotate to face center
      if (i === 0) fenceDummy.rotation.y = 0;
      if (i === 1) fenceDummy.rotation.y = Math.PI / 2;
      if (i === 2) fenceDummy.rotation.y = Math.PI;
      if (i === 3) fenceDummy.rotation.y = -Math.PI / 2;
      
      fenceDummy.updateMatrix();
      fenceMesh.setMatrixAt(fIdx++, fenceDummy.matrix);
    }
  }
  fenceMesh.count = fIdx;
  root.add(fenceMesh);
  
  // Fence Rails (Horizontal bars connecting pickets)
  const railGeom = new THREE.BoxGeometry(pathSize * 2 + 0.1, 0.015, 0.02);
  const rail1 = new THREE.Mesh(railGeom, whiteMat);
  rail1.position.y = 0.05;
  root.add(rail1);
  const rail2 = new THREE.Mesh(railGeom, whiteMat);
  rail2.position.y = 0.09;
  root.add(rail2);
  // Rotate rails to form square
  const rail3 = rail1.clone();
  rail3.rotation.y = Math.PI / 2;
  root.add(rail3);
  const rail4 = rail2.clone();
  rail4.rotation.y = Math.PI / 2;
  root.add(rail4);

  // --- Bushes ---
  const bushGeom = new THREE.DodecahedronGeometry(0.04, 1);
  const bushCount = 6;
  const bushMesh = new THREE.InstancedMesh(bushGeom, greenMat, bushCount);
  const bushDummy = new THREE.Object3D();
  
  const bushPos = [
    [-0.3, 0.04, 0.3], [0.3, 0.04, 0.3], // Front corners
    [-0.3, 0.04, -0.3], [0.3, 0.04, -0.3], // Back corners
    [0, 0.04, 0.42], [0, 0.04, -0.42] // Mid front/back
  ];
  
  for (let i = 0; i < bushCount; i++) {
    const [x, y, z] = bushPos[i];
    bushDummy.position.set(x, y, z);
    const s = 0.8 + Math.sin(i) * 0.2;
    bushDummy.scale.set(s, s, s);
    bushDummy.updateMatrix();
    bushMesh.setMatrixAt(i, bushDummy.matrix);
  }
  root.add(bushMesh);

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