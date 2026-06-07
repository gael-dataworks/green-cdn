export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Helper to create a siding texture (horizontal lines)
  function createSidingTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // White background
        data[i] = 240;
        data[i + 1] = 240;
        data[i + 2] = 240;
        data[i + 3] = 255;
        
        // Dark gray lines every ~32 pixels
        const lineY = y % 32;
        if (lineY > 28) {
          data[i] = 180;
          data[i + 1] = 180;
          data[i + 2] = 180;
        }
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  // Helper to create a shingle texture
  function createShingleTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Base red
        data[i] = 160;
        data[i + 1] = 60;
        data[i + 2] = 50;
        data[i + 3] = 255;

        // Shingle rows
        const row = Math.floor(y / 16);
        if (row % 2 === 0) {
           // Darker gap
           data[i] = 120;
           data[i + 1] = 40;
           data[i + 2] = 35;
        }
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  const sidingTex = createSidingTexture();
  const shingleTex = createShingleTexture();

  const sidingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sidingTex,
    roughness: 0.8,
    metalness: 0.0,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb54a3c,
    map: shingleTex,
    roughness: 0.7,
    metalness: 0.1,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.0,
  });

  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x6a7068,
    roughness: 0.9,
    metalness: 0.0,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    ior: 1.5,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.7,
    metalness: 0.0,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x8f4b3e,
    roughness: 0.6,
    metalness: 0.0,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xa04030,
    roughness: 0.8,
    metalness: 0.0,
  });

  const ventMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const houseW = 1.2;
  const houseD = 1.0;
  const floorH = 0.35;
  const roofH = 0.25;
  const foundationH = 0.08;
  const porchD = 0.35;
  const porchH = floorH; 

  // --- Foundation ---
  const foundationGeom = new THREE.BoxGeometry(houseW, foundationH, houseD);
  const foundation = new THREE.Mesh(foundationGeom, foundationMat);
  foundation.position.y = -foundationH / 2;
  root.add(foundation);

  // Foundation Vents
  const ventGeom = new THREE.BoxGeometry(0.08, 0.04, 0.02);
  const ventPositions = [
    [-0.4, -foundationH/2, houseD/2 + 0.01],
    [0.0, -foundationH/2, houseD/2 + 0.01],
    [0.4, -foundationH/2, houseD/2 + 0.01],
    [-0.4, -foundationH/2, -houseD/2 - 0.01],
    [0.4, -foundationH/2, -houseD/2 - 0.01],
  ];
  ventPositions.forEach(pos => {
    const vent = new THREE.Mesh(ventGeom, ventMat);
    vent.position.set(...pos);
    root.add(vent);
  });

  // --- Walls ---
  // We build walls as boxes. Siding texture repeats based on UVs.
  // To make texture scale correctly, we might need to adjust UVs or geometry size.
  // For simplicity, we assume default UVs and let the texture repeat naturally.
  
  const wallThickness = 0.04;
  
  // First Floor Walls
  function createWall(w, h, d, x, y, z) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, sidingMat);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  // Left Wall
  createWall(wallThickness, floorH, houseD, -houseW/2, floorH/2, 0);
  // Right Wall
  createWall(wallThickness, floorH, houseD, houseW/2, floorH/2, 0);
  // Back Wall
  createWall(houseW, floorH, wallThickness, 0, floorH/2, -houseD/2);
  // Front Wall (partial, due to porch)
  // The front wall is split by the porch.
  // Left part of front wall (where door is)
  createWall(houseW * 0.4, floorH, wallThickness, -houseW * 0.3, floorH/2, houseD/2);
  // Right part of front wall (windows) - actually behind porch columns
  createWall(houseW * 0.6, floorH, wallThickness, houseW * 0.2, floorH/2, houseD/2);

  // Second Floor Walls
  const floor2Y = floorH + floorH / 2;
  // Left
  createWall(wallThickness, floorH, houseD * 0.8, -houseW/2, floor2Y, 0);
  // Right
  createWall(wallThickness, floorH, houseD * 0.8, houseW/2, floor2Y, 0);
  // Back
  createWall(houseW, floorH, wallThickness, 0, floor2Y, -houseD/2);
  // Front (Gable end)
  // We need a gable shape. Let's use a prism or just a box for the rectangular part + triangle
  const gableBaseY = floorH + floorH;
  const gableH = roofH;
  const gableW = houseW;
  
  // Gable Wall (Front)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-gableW/2, 0);
  gableShape.lineTo(gableW/2, 0);
  gableShape.lineTo(0, gableH);
  gableShape.lineTo(-gableW/2, 0);
  const gableGeom = new THREE.ExtrudeGeometry(gableShape, { depth: wallThickness, bevelEnabled: false });
  const gableWall = new THREE.Mesh(gableGeom, sidingMat);
  gableWall.position.set(0, gableBaseY, houseD/2);
  // Rotate to face forward if extruded along Z? Extrude goes +Z by default.
  // We want it on the front face.
  root.add(gableWall);

  // Gable Wall (Back)
  const gableWallBack = new THREE.Mesh(gableGeom, sidingMat);
  gableWallBack.position.set(0, gableBaseY, -houseD/2);
  gableWallBack.rotation.y = Math.PI;
  root.add(gableWallBack);

  // --- Roof ---
  // Main Roof: Triangular Prism
  const roofSpan = houseD + 0.1; // Overhang
  const roofWidth = houseW + 0.1; // Overhang
  const roofLength = houseD + 0.2;
  
  // Using Cylinder with 3 sides for a prism
  const roofGeom = new THREE.CylinderGeometry(roofH / Math.sin(Math.PI/3), roofH / Math.sin(Math.PI/3), roofLength, 3, 1);
  // Rotate to align ridge with Z
  roofGeom.rotateZ(Math.PI / 2); 
  roofGeom.rotateY(Math.PI / 2); // Ridge along Z
  
  const mainRoof = new THREE.Mesh(roofGeom, roofMat);
  mainRoof.position.set(0, floorH * 2 + roofH * 0.6, 0);
  // Scale to fit width
  mainRoof.scale.set(houseW / 2, 1, 1); // Adjust width scaling carefully
  // Actually, let's just use a box rotated 45 degrees for simplicity if prism is tricky to scale
  // Re-doing roof with Box for reliability
  const roofBoxGeom = new THREE.BoxGeometry(houseW + 0.1, roofH * 2.5, roofLength);
  const roofLeft = new THREE.Mesh(roofBoxGeom, roofMat);
  roofLeft.position.set(- (houseW + 0.1)/4, floorH * 2 + roofH * 0.8, 0);
  roofLeft.rotation.z = -Math.PI / 4;
  root.add(roofLeft);

  const roofRight = new THREE.Mesh(roofBoxGeom, roofMat);
  roofRight.position.set((houseW + 0.1)/4, floorH * 2 + roofH * 0.8, 0);
  roofRight.rotation.z = Math.PI / 4;
  root.add(roofRight);

  // --- Porch ---
  const porchGroup = new THREE.Group();
  root.add(porchGroup);

  // Porch Floor
  const porchFloorGeom = new THREE.BoxGeometry(houseW * 0.6, 0.02, porchD);
  const porchFloor = new THREE.Mesh(porchFloorGeom, woodMat);
  porchFloor.position.set(houseW * 0.1, floorH - 0.01, houseD/2 + porchD/2);
  porchGroup.add(porchFloor);

  // Porch Roof
  const pRoofW = houseW * 0.65;
  const pRoofD = porchD + 0.1;
  const pRoofH = 0.15;
  
  const pRoofLeft = new THREE.Mesh(new THREE.BoxGeometry(pRoofW/2, pRoofH * 2, pRoofD), roofMat);
  pRoofLeft.position.set(houseW * 0.1 - pRoofW/4, floorH + pRoofH * 0.8, houseD/2 + porchD/2);
  pRoofLeft.rotation.z = -Math.PI / 6;
  porchGroup.add(pRoofLeft);

  const pRoofRight = new THREE.Mesh(new THREE.BoxGeometry(pRoofW/2, pRoofH * 2, pRoofD), roofMat);
  pRoofRight.position.set(houseW * 0.1 + pRoofW/4, floorH + pRoofH * 0.8, houseD/2 + porchD/2);
  pRoofRight.rotation.z = Math.PI / 6;
  porchGroup.add(pRoofRight);

  // Porch Columns
  const colGeom = new THREE.CylinderGeometry(0.02, 0.02, floorH, 8);
  const colPositions = [
    [houseW * 0.1 - pRoofW/2 + 0.05, floorH/2, houseD/2 + porchD/2],
    [houseW * 0.1, floorH/2, houseD/2 + porchD/2],
    [houseW * 0.1 + pRoofW/2 - 0.05, floorH/2, houseD/2 + porchD/2]
  ];
  colPositions.forEach(pos => {
    const col = new THREE.Mesh(colGeom, trimMat);
    col.position.set(...pos);
    porchGroup.add(col);
  });

  // Porch Railing
  const railTopGeom = new THREE.BoxGeometry(pRoofW, 0.02, 0.02);
  const railTop = new THREE.Mesh(railTopGeom, trimMat);
  railTop.position.set(houseW * 0.1, floorH * 0.4, houseD/2 + porchD/2 - 0.05);
  porchGroup.add(railTop);

  // Railing Slats
  for(let i=0; i<10; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.3, 0.02), trimMat);
    slat.position.set(
      houseW * 0.1 - pRoofW/2 + 0.05 + (i * (pRoofW - 0.1) / 9),
      floorH * 0.25,
      houseD/2 + porchD/2 - 0.05
    );
    porchGroup.add(slat);
  }

  // --- Door ---
  const doorGeom = new THREE.BoxGeometry(0.12, 0.28, 0.02);
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(-houseW * 0.3, floorH/2, houseD/2 + 0.02);
  root.add(door);
  
  // Door Frame
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.30, 0.03), trimMat);
  doorFrame.position.set(-houseW * 0.3, floorH/2, houseD/2 + 0.01);
  root.add(doorFrame);

  // Door Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshStandardMaterial({color: 0xccaaaa, metalness: 0.8, roughness: 0.2}));
  knob.position.set(-houseW * 0.3 + 0.04, floorH/2, houseD/2 + 0.03);
  root.add(knob);

  // Steps
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.1), woodMat);
  step1.position.set(-houseW * 0.3, 0.02, houseD/2 + 0.15);
  root.add(step1);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.1), woodMat);
  step2.position.set(-houseW * 0.3, 0.06, houseD/2 + 0.25);
  root.add(step2);

  // --- Windows ---
  function createWindow(x, y, z, w, h, facing) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), trimMat);
    frame.position.set(x, y, z);
    if(facing === 'x') frame.rotation.y = Math.PI/2;
    root.add(frame);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.8), glassMat);
    glass.position.set(x, y, facing === 'z' ? z + 0.02 : z);
    if(facing === 'x') {
        glass.rotation.y = Math.PI/2;
        glass.position.set(x + 0.02, y, z);
    }
    root.add(glass);
    
    // Cross bars
    const barH = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.01, 0.01), trimMat);
    barH.position.set(x, y, facing === 'z' ? z + 0.02 : z);
    if(facing === 'x') {
        barH.rotation.y = Math.PI/2;
        barH.position.set(x + 0.02, y, z);
    }
    root.add(barH);

    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.01, h * 0.8, 0.01), trimMat);
    barV.position.set(x, y, facing === 'z' ? z + 0.02 : z);
    if(facing === 'x') {
        barV.rotation.y = Math.PI/2;
        barV.position.set(x + 0.02, y, z);
    }
    root.add(barV);
  }

  // Side Window (Left)
  createWindow(-houseW/2 - 0.02, floorH * 0.6, 0, 0.15, 0.2, 'x');
  
  // Front Windows (Right side of porch)
  // Large window group
  createWindow(houseW * 0.2, floorH * 0.6, houseD/2 + 0.02, 0.25, 0.2, 'z');
  createWindow(houseW * 0.45, floorH * 0.6, houseD/2 + 0.02, 0.1, 0.2, 'z');

  // Upper Windows (Gable vents)
  const ventWinGeom = new THREE.BoxGeometry(0.08, 0.06, 0.02);
  const ventWinL = new THREE.Mesh(ventWinGeom, ventMat);
  ventWinL.position.set(-houseW * 0.2, floorH * 2 + roofH * 0.5, houseD/2 + 0.02);
  root.add(ventWinL);
  
  const ventWinR = new THREE.Mesh(ventWinGeom, ventMat);
  ventWinR.position.set(houseW * 0.2, floorH * 2 + roofH * 0.5, houseD/2 + 0.02);
  root.add(ventWinR);

  // --- Chimney ---
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), brickMat);
  chimney.position.set(houseW * 0.3, floorH * 2 + roofH + 0.15, -houseD * 0.3);
  root.add(chimney);
  
  // Chimney Cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.12), brickMat);
  cap.position.set(houseW * 0.3, floorH * 2 + roofH + 0.32, -houseD * 0.3);
  root.add(cap);

  // --- Gutters / Downspout ---
  const gutterGeom = new THREE.CylinderGeometry(0.015, 0.015, houseD + 0.2, 8);
  gutterGeom.rotateZ(Math.PI/2);
  const gutter = new THREE.Mesh(gutterGeom, trimMat);
  gutter.position.set(houseW/2 + 0.05, floorH * 2, 0);
  root.add(gutter);

  const downspoutGeom = new THREE.CylinderGeometry(0.015, 0.015, floorH * 2, 8);
  const downspout = new THREE.Mesh(downspoutGeom, trimMat);
  downspout.position.set(houseW/2 + 0.05, floorH, houseD/2);
  root.add(downspout);

  // --- Normalize ---
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