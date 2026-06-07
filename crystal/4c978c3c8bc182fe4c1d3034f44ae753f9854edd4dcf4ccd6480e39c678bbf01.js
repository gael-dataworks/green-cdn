export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const sidingMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    roughness: 0.8,
    metalness: 0.0,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb84a3a,
    roughness: 0.7,
    metalness: 0.0,
  });

  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x556b55,
    roughness: 0.9,
    metalness: 0.0,
  });

  const porchFloorMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.6,
    metalness: 0.0,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.0,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x8b3030,
    roughness: 0.5,
    metalness: 0.0,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    roughness: 0.1,
    metalness: 0.0,
    transmission: 0.9,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xa04030,
    roughness: 0.8,
    metalness: 0.0,
  });

  // --- Procedural Textures ---

  // Siding Texture (Horizontal lines)
  function createSidingTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const color = new THREE.Color(0xf5f5f0);
    const shadow = new THREE.Color(0xd0d0d0);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Every 32 pixels is a plank
        const plankY = y % 32;
        // Bottom 4 pixels of each plank are shadow/gap
        const isGap = plankY > 28;
        
        const c = isGap ? shadow : color;
        data[i] = Math.floor(c.r * 255);
        data[i + 1] = Math.floor(c.g * 255);
        data[i + 2] = Math.floor(c.b * 255);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  // Shingle Texture
  function createShingleTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const base = new THREE.Color(0xb84a3a);
    const dark = new THREE.Color(0x8a3020);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const row = Math.floor(y / 64);
        const offset = (row % 2) * 64;
        const col = Math.floor((x + offset) / 64);
        
        // Simple grid pattern for shingles
        const isEdge = (y % 64 < 4) || ((x + offset) % 64 < 4);
        const c = isEdge ? dark : base;
        
        data[i] = Math.floor(c.r * 255);
        data[i + 1] = Math.floor(c.g * 255);
        data[i + 2] = Math.floor(c.b * 255);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }

  const sidingTex = createSidingTexture();
  sidingMat.map = sidingTex;
  sidingTex.repeat.set(1, 2); // Adjust for house height

  const shingleTex = createShingleTexture();
  roofMat.map = shingleTex;

  // --- Dimensions ---
  const houseW = 1.0;
  const houseD = 0.8;
  const houseH = 0.7;
  const foundationH = 0.06;
  const roofH = 0.25;
  const porchD = 0.3;
  const porchH = 0.35;

  // --- Foundation ---
  const foundationGeom = new THREE.BoxGeometry(houseW + 0.04, foundationH, houseD + 0.04);
  const foundation = new THREE.Mesh(foundationGeom, foundationMat);
  foundation.position.y = -foundationH / 2;
  root.add(foundation);

  // --- Main Body ---
  const bodyGeom = new THREE.BoxGeometry(houseW, houseH, houseD);
  const body = new THREE.Mesh(bodyGeom, sidingMat);
  body.position.y = foundationH + houseH / 2;
  root.add(body);

  // --- Main Roof ---
  // Constructed from two prisms for a gable/hip mix look
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-houseW / 2 - 0.05, 0);
  roofShape.lineTo(houseW / 2 + 0.05, 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo(-houseW / 2 - 0.05, 0);

  const roofExtrudeSettings = {
    steps: 1,
    depth: houseD + 0.1,
    bevelEnabled: false,
  };
  
  const mainRoofGeom = new THREE.ExtrudeGeometry(roofShape, roofExtrudeSettings);
  const mainRoof = new THREE.Mesh(mainRoofGeom, roofMat);
  mainRoof.position.set(0, foundationH + houseH, - (houseD + 0.1) / 2);
  // Rotate to align with Z axis if needed, but extrude is along Z by default
  // Actually ExtrudeGeometry extrudes along Z. The shape is in XY.
  // So the roof ridge is along Z.
  // Let's rotate it 90 deg around Y so ridge is along X? 
  // No, standard gable roof ridge is usually along the long axis.
  // Let's assume ridge is along Z for this shape.
  root.add(mainRoof);

  // Front Gable Extension (The part sticking out over the porch area roughly)
  // Actually, looking at the image, it's a complex roof. Let's simplify to a main roof 
  // and a lower porch roof.
  
  // --- Porch ---
  const porchGroup = new THREE.Group();
  
  // Porch Floor
  const porchFloorGeom = new THREE.BoxGeometry(houseW * 0.6, 0.02, porchD);
  const porchFloor = new THREE.Mesh(porchFloorGeom, porchFloorMat);
  porchFloor.position.set(-houseW * 0.1, foundationH + 0.01, houseD / 2 + porchD / 2 - 0.05);
  porchGroup.add(porchFloor);

  // Porch Roof
  const porchRoofShape = new THREE.Shape();
  porchRoofShape.moveTo(-houseW * 0.35, 0);
  porchRoofShape.lineTo(houseW * 0.35, 0);
  porchRoofShape.lineTo(0, 0.15);
  porchRoofShape.lineTo(-houseW * 0.35, 0);

  const porchRoofGeom = new THREE.ExtrudeGeometry(porchRoofShape, { steps: 1, depth: porchD + 0.1, bevelEnabled: false });
  const porchRoof = new THREE.Mesh(porchRoofGeom, roofMat);
  porchRoof.position.set(-houseW * 0.1, foundationH + porchH, houseD / 2 + porchD / 2 - (porchD + 0.1) / 2);
  porchGroup.add(porchRoof);

  // Porch Columns
  const colGeom = new THREE.CylinderGeometry(0.015, 0.015, porchH, 8);
  const colPositions = [
    [-houseW * 0.25, foundationH + porchH / 2, houseD / 2 + porchD - 0.02],
    [houseW * 0.05, foundationH + porchH / 2, houseD / 2 + porchD - 0.02],
  ];
  
  colPositions.forEach(pos => {
    const col = new THREE.Mesh(colGeom, trimMat);
    col.position.set(...pos);
    porchGroup.add(col);
  });

  // Porch Railing
  const railGeom = new THREE.BoxGeometry(houseW * 0.6, 0.02, 0.02);
  const railTop = new THREE.Mesh(railGeom, trimMat);
  railTop.position.set(-houseW * 0.1, foundationH + 0.15, houseD / 2 + porchD - 0.02);
  porchGroup.add(railTop);
  
  const railBot = new THREE.Mesh(railGeom, trimMat);
  railBot.position.set(-houseW * 0.1, foundationH + 0.05, houseD / 2 + porchD - 0.02);
  porchGroup.add(railBot);

  // Railing Slats
  for(let i=0; i<8; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.01), trimMat);
    slat.position.set(-houseW * 0.25 + (i * (houseW * 0.5 / 7)), foundationH + 0.1, houseD / 2 + porchD - 0.02);
    porchGroup.add(slat);
  }

  root.add(porchGroup);

  // --- Chimney ---
  const chimneyGeom = new THREE.BoxGeometry(0.08, 0.2, 0.08);
  const chimney = new THREE.Mesh(chimneyGeom, brickMat);
  // Place on roof
  chimney.position.set(houseW * 0.2, foundationH + houseH + roofH * 0.5, -houseD * 0.2);
  root.add(chimney);

  // --- Door ---
  const doorGeom = new THREE.BoxGeometry(0.12, 0.22, 0.02);
  const door = new THREE.Mesh(doorGeom, doorMat);
  // Place on front wall, under porch
  door.position.set(-houseW * 0.15, foundationH + 0.11, houseD / 2 + 0.01);
  root.add(door);

  // Door Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshStandardMaterial({color: 0xccaa00, metalness: 0.8, roughness: 0.2}));
  knob.position.set(-houseW * 0.15 + 0.05, foundationH + 0.11, houseD / 2 + 0.025);
  root.add(knob);

  // --- Windows ---
  const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const winGlassMat = glassMat;

  function createWindow(w, h, x, y, z, rotY) {
    const group = new THREE.Group();
    
    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), winFrameMat);
    group.add(frame);
    
    // Glass
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.8), winGlassMat);
    glass.position.z = 0.011;
    group.add(glass);

    // Muntins (grid)
    const muntinH = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.005, 0.005), winFrameMat);
    muntinH.position.z = 0.012;
    group.add(muntinH);
    
    const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.005, h * 0.8, 0.005), winFrameMat);
    muntinV.position.z = 0.012;
    group.add(muntinV);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    return group;
  }

  // Front Window (Left of door)
  const win1 = createWindow(0.12, 0.15, -houseW * 0.35, foundationH + 0.2, houseD / 2 + 0.01, 0);
  root.add(win1);

  // Side Window
  const win2 = createWindow(0.12, 0.15, -houseW / 2 - 0.01, foundationH + 0.2, 0, Math.PI / 2);
  root.add(win2);

  // Upper Windows (Dormer/Front face)
  const win3 = createWindow(0.1, 0.1, houseW * 0.15, foundationH + houseH * 0.6, houseD / 2 + 0.01, 0);
  root.add(win3);
  
  const win4 = createWindow(0.06, 0.1, houseW * 0.35, foundationH + houseH * 0.6, houseD / 2 + 0.01, 0);
  root.add(win4);

  // Porch Windows (Screened porch look)
  const porchWinGroup = new THREE.Group();
  const pWin1 = createWindow(0.15, 0.2, -houseW * 0.05, foundationH + 0.15, houseD / 2 + porchD - 0.01, 0);
  const pWin2 = createWindow(0.15, 0.2, houseW * 0.15, foundationH + 0.15, houseD / 2 + porchD - 0.01, 0);
  porchWinGroup.add(pWin1);
  porchWinGroup.add(pWin2);
  root.add(porchWinGroup);

  // --- Vents ---
  const ventGeom = new THREE.PlaneGeometry(0.06, 0.04);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
  const vent1 = new THREE.Mesh(ventGeom, ventMat);
  vent1.position.set(-houseW * 0.2, foundationH + houseH * 0.8, -houseD / 2 - 0.01);
  vent1.rotation.y = Math.PI; // Face back
  root.add(vent1);

  const vent2 = new THREE.Mesh(ventGeom, ventMat);
  vent2.position.set(houseW * 0.2, foundationH + houseH * 0.8, -houseD / 2 - 0.01);
  vent2.rotation.y = Math.PI;
  root.add(vent2);

  // --- Gutters ---
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const gutterGeom = new THREE.TubeGeometry(
    new THREE.LineCurve3(
      new THREE.Vector3(-houseW/2 - 0.05, foundationH + houseH, -houseD/2),
      new THREE.Vector3(houseW/2 + 0.05, foundationH + houseH, -houseD/2)
    ),
    1, 0.01, 4, false
  );
  const gutter = new THREE.Mesh(gutterGeom, gutterMat);
  root.add(gutter);

  // Downspout
  const downspoutGeom = new THREE.CylinderGeometry(0.005, 0.005, houseH, 6);
  const downspout = new THREE.Mesh(downspoutGeom, gutterMat);
  downspout.position.set(houseW * 0.3, foundationH + houseH / 2, -houseD / 2 - 0.01);
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