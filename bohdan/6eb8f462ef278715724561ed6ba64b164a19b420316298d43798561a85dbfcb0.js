export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stone palette colors
  const stoneColors = [
    0x8a8a8a, // gray
    0xa0a0a0, // light gray
    0xb8a890, // beige
    0xc0b098, // sand
    0x908070, // brownish
    0x706060  // dark gray
  ];

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.5,
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    opacity: 0.3,
  });

  const logMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.9,
  });

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const totalWidth = 1.4;
  const totalHeight = 1.3;
  const depth = 0.6;
  const hearthHeight = 0.12;
  const fireboxWidth = 0.7;
  const fireboxHeight = 0.65;
  const fireboxDepth = 0.35;
  const mantelThickness = 0.12;
  const mantelOverhang = 0.1;

  // --- Helpers ---
  
  // Deterministic pseudo-random for stone variation
  function hash(i) {
    let x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function getStoneColor(i) {
    const idx = Math.floor(hash(i) * stoneColors.length);
    return stoneColors[idx];
  }

  // --- 1. Hearth (Base) ---
  // Made of several large slabs
  const hearthY = -totalHeight / 2;
  const hearthGroup = new THREE.Group();
  
  // Front row of hearth stones
  const slabCount = 5;
  const slabWidth = totalWidth / slabCount;
  for (let i = 0; i < slabCount; i++) {
    const w = slabWidth * (0.9 + hash(i) * 0.2); // slight width variation
    const h = hearthHeight;
    const d = depth * 0.9;
    const geom = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: getStoneColor(i + 100),
      roughness: 0.85,
      metalness: 0.0
    });
    const slab = new THREE.Mesh(geom, mat);
    // Position to fill the width
    const xOffset = -totalWidth / 2 + (totalWidth / slabCount) * (i + 0.5);
    slab.position.set(xOffset, hearthY + h / 2, 0);
    hearthGroup.add(slab);
  }
  root.add(hearthGroup);

  // --- 2. Stone Body ---
  const bodyGroup = new THREE.Group();
  const bodyY = hearthY + hearthHeight;
  const bodyHeight = totalHeight - hearthHeight - mantelThickness;
  
  // We need to fill the area around the firebox with stones
  // Approx stone size: 0.15w x 0.08h
  const stoneH = 0.08;
  const rows = Math.ceil(bodyHeight / stoneH);
  
  let stoneIndex = 0;
  for (let r = 0; r < rows; r++) {
    const y = bodyY + r * stoneH + stoneH / 2;
    // Offset every other row for brick pattern
    const rowOffset = (r % 2 === 0) ? 0 : 0.1;
    
    // Fill left side
    let x = -totalWidth / 2 + rowOffset;
    while (x < -fireboxWidth / 2 - 0.05) {
      const w = 0.12 + hash(stoneIndex) * 0.1;
      const h = stoneH * (0.8 + hash(stoneIndex + 1) * 0.4);
      const d = depth * (0.8 + hash(stoneIndex + 2) * 0.2);
      
      // Check bounds
      const actualW = Math.min(w, (-fireboxWidth / 2 - 0.05) - x);
      if (actualW > 0.04) {
        const geom = new THREE.BoxGeometry(actualW, h, d);
        const mat = new THREE.MeshStandardMaterial({
          color: getStoneColor(stoneIndex),
          roughness: 0.85,
          metalness: 0.0
        });
        const stone = new THREE.Mesh(geom, mat);
        stone.position.set(x + actualW / 2, y, 0);
        bodyGroup.add(stone);
      }
      x += actualW + 0.01; // gap
      stoneIndex++;
    }

    // Fill right side
    x = fireboxWidth / 2 + 0.05 + rowOffset;
    while (x < totalWidth / 2) {
      const w = 0.12 + hash(stoneIndex) * 0.1;
      const h = stoneH * (0.8 + hash(stoneIndex + 1) * 0.4);
      const d = depth * (0.8 + hash(stoneIndex + 2) * 0.2);
      
      const actualW = Math.min(w, (totalWidth / 2) - x);
      if (actualW > 0.04) {
        const geom = new THREE.BoxGeometry(actualW, h, d);
        const mat = new THREE.MeshStandardMaterial({
          color: getStoneColor(stoneIndex),
          roughness: 0.85,
          metalness: 0.0
        });
        const stone = new THREE.Mesh(geom, mat);
        stone.position.set(x + actualW / 2, y, 0);
        bodyGroup.add(stone);
      }
      x += actualW + 0.01;
      stoneIndex++;
    }
  }
  bodyGroup.position.y = bodyY;
  root.add(bodyGroup);

  // --- 3. Firebox ---
  const fireboxGroup = new THREE.Group();
  const fbY = bodyY + (bodyHeight - fireboxHeight) / 2;
  
  // Frame (4 strips)
  const frameThick = 0.04;
  // Top
  const fbTop = new THREE.Mesh(new THREE.BoxGeometry(fireboxWidth, frameThick, 0.05), blackMetalMat);
  fbTop.position.set(0, fireboxHeight / 2 - frameThick / 2, 0.02);
  fireboxGroup.add(fbTop);
  // Bottom
  const fbBottom = new THREE.Mesh(new THREE.BoxGeometry(fireboxWidth, frameThick, 0.05), blackMetalMat);
  fbBottom.position.set(0, -fireboxHeight / 2 + frameThick / 2, 0.02);
  fireboxGroup.add(fbBottom);
  // Left
  const fbLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThick, fireboxHeight, 0.05), blackMetalMat);
  fbLeft.position.set(-fireboxWidth / 2 + frameThick / 2, 0, 0.02);
  fireboxGroup.add(fbLeft);
  // Right
  const fbRight = new THREE.Mesh(new THREE.BoxGeometry(frameThick, fireboxHeight, 0.05), blackMetalMat);
  fbRight.position.set(fireboxWidth / 2 - frameThick / 2, 0, 0.02);
  fireboxGroup.add(fbRight);

  // Glass
  const glassGeom = new THREE.PlaneGeometry(fireboxWidth - frameThick * 2, fireboxHeight - frameThick * 2);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.set(0, 0, 0.04);
  fireboxGroup.add(glass);

  // Interior (Back wall & Floor)
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const fbBack = new THREE.Mesh(new THREE.BoxGeometry(fireboxWidth * 0.9, fireboxHeight * 0.9, 0.02), interiorMat);
  fbBack.position.set(0, 0, -fireboxDepth / 2);
  fireboxGroup.add(fbBack);
  
  const fbFloor = new THREE.Mesh(new THREE.BoxGeometry(fireboxWidth * 0.9, 0.02, fireboxDepth * 0.8), interiorMat);
  fbFloor.position.set(0, -fireboxHeight / 2 + 0.05, -fireboxDepth / 2);
  fireboxGroup.add(fbFloor);

  // Logs
  const logsGroup = new THREE.Group();
  // Log 1
  const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), logMat);
  log1.rotation.z = Math.PI / 2;
  log1.rotation.x = 0.2;
  log1.position.set(-0.1, -fireboxHeight / 2 + 0.15, -fireboxDepth / 2 + 0.1);
  logsGroup.add(log1);
  // Log 2
  const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), logMat);
  log2.rotation.z = Math.PI / 2;
  log2.rotation.x = -0.3;
  log2.position.set(0.15, -fireboxHeight / 2 + 0.18, -fireboxDepth / 2 + 0.1);
  logsGroup.add(log2);
  // Log 3 (leaning)
  const log3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12), logMat);
  log3.rotation.z = Math.PI / 2;
  log3.rotation.y = 0.5;
  log3.position.set(0, -fireboxHeight / 2 + 0.25, -fireboxDepth / 2 + 0.15);
  logsGroup.add(log3);
  
  // Embers/Stones
  for (let i = 0; i < 15; i++) {
    const r = 0.02 + hash(i) * 0.02;
    const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), emberMat);
    ember.position.set(
      (hash(i) - 0.5) * fireboxWidth * 0.8,
      -fireboxHeight / 2 + 0.05,
      -fireboxDepth / 2 + 0.1 + (hash(i + 10) - 0.5) * fireboxDepth * 0.5
    );
    logsGroup.add(ember);
  }
  fireboxGroup.add(logsGroup);

  fireboxGroup.position.set(0, fbY, 0);
  root.add(fireboxGroup);

  // --- 4. Mantel Shelf ---
  const mantelGroup = new THREE.Group();
  // Main shelf block
  const shelfGeom = new THREE.BoxGeometry(totalWidth + mantelOverhang * 2, mantelThickness, depth + mantelOverhang);
  const shelf = new THREE.Mesh(shelfGeom, woodMat);
  shelf.position.set(0, mantelThickness / 2, 0);
  mantelGroup.add(shelf);
  
  // Decorative molding strip under the front edge
  const moldGeom = new THREE.BoxGeometry(totalWidth + mantelOverhang * 2, 0.04, 0.06);
  const mold = new THREE.Mesh(moldGeom, woodMat);
  mold.position.set(0, 0, depth / 2 + mantelOverhang / 2);
  mantelGroup.add(mold);

  mantelGroup.position.set(0, hearthY + hearthHeight + bodyHeight, 0);
  root.add(mantelGroup);

  // --- 5. Corbels (Brackets) ---
  // Create a shape for the corbel profile
  const corbelShape = new THREE.Shape();
  corbelShape.moveTo(0, 0);
  corbelShape.lineTo(0.12, 0); // bottom width
  corbelShape.bezierCurveTo(0.12, 0.05, 0.08, 0.1, 0.08, 0.15); // curve out then in
  corbelShape.lineTo(0.05, 0.15); // top width
  corbelShape.lineTo(0, 0.15); // top inner
  corbelShape.lineTo(0, 0); // close

  const corbelExtrudeSettings = {
    steps: 1,
    depth: 0.15,
    bevelEnabled: false
  };
  const corbelGeom = new THREE.ExtrudeGeometry(corbelShape, corbelExtrudeSettings);
  // Center the geometry roughly
  corbelGeom.center();

  // Left Corbel
  const leftCorbel = new THREE.Mesh(corbelGeom, woodMat);
  // Position under the mantel, on the left side of the stone body
  leftCorbel.position.set(
    -totalWidth / 2 + 0.2, 
    hearthY + hearthHeight + bodyHeight - 0.15, 
    0
  );
  root.add(leftCorbel);

  // Right Corbel (mirror)
  const rightCorbel = new THREE.Mesh(corbelGeom, woodMat);
  rightCorbel.scale.x = -1; // Mirror
  rightCorbel.position.set(
    totalWidth / 2 - 0.2, 
    hearthY + hearthHeight + bodyHeight - 0.15, 
    0
  );
  root.add(rightCorbel);

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