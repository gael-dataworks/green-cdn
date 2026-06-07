export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const stoneColors = [0x8c8c8c, 0xa3a3a3, 0xb8b8b8, 0xc2b298, 0x9e8c7a, 0x7a7a7a];
  
  function getStoneMat(index) {
    const color = stoneColors[index % stoneColors.length];
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.0,
    });
  }

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a47c,
    roughness: 0.6,
    metalness: 0.0,
  });

  const fireboxFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.3,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });

  const logMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.9,
    metalness: 0.0,
  });

  const gravelMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.0,
  });

  // --- Dimensions ---
  const totalWidth = 1.4;
  const totalHeight = 1.3;
  const depth = 0.6;
  const hearthHeight = 0.12;
  const fireboxWidth = 0.8;
  const fireboxHeight = 0.55;
  const fireboxY = hearthHeight + 0.05; // Slightly above hearth
  const stoneSize = 0.18; // Approximate stone height
  
  // --- Helper: Add Box ---
  function addBox(w, h, d, mat, x, y, z, rx=0, ry=0, rz=0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- 1. Hearth (Base Slabs) ---
  const hearthDepth = 0.8;
  const hearthY = hearthHeight / 2;
  const numHearthSlabs = 7;
  const slabWidth = totalWidth / numHearthSlabs;
  
  for (let i = 0; i < numHearthSlabs; i++) {
    const x = -totalWidth/2 + slabWidth/2 + i * slabWidth;
    // Vary depth slightly for realism
    const dVar = 0.75 + (i % 3) * 0.05; 
    addBox(slabWidth - 0.01, hearthHeight, dVar, getStoneMat(i), x, hearthY, 0);
  }

  // --- 2. Stone Columns (Left & Right) ---
  const columnWidth = 0.25;
  const leftColX = -totalWidth/2 + columnWidth/2;
  const rightColX = totalWidth/2 - columnWidth/2;
  
  // Stack stones up to firebox top
  const colTopY = fireboxY + fireboxHeight/2;
  let currentY = hearthHeight + stoneSize/2;
  let stoneIdx = 10;

  while (currentY < colTopY) {
    const h = stoneSize * (0.8 + (stoneIdx % 3) * 0.1);
    const y = currentY + h/2;
    
    // Left Column
    addBox(columnWidth - 0.01, h, depth, getStoneMat(stoneIdx), leftColX, y, 0);
    // Right Column
    addBox(columnWidth - 0.01, h, depth, getStoneMat(stoneIdx + 1), rightColX, y, 0);
    
    currentY += h;
    stoneIdx += 2;
  }

  // --- 3. Firebox ---
  const fbZ = 0;
  const fbFrameDepth = 0.05;
  
  // Firebox Casing (Black Box)
  const fbCase = new THREE.Mesh(
    new THREE.BoxGeometry(fireboxWidth + 0.1, fireboxHeight + 0.1, 0.4),
    fireboxFrameMat
  );
  fbCase.position.set(0, fireboxY + fireboxHeight/2, 0);
  root.add(fbCase);

  // Firebox Frame (Front Border)
  const frameThick = 0.06;
  // Top
  addBox(fireboxWidth + frameThick*2, frameThick, fbFrameDepth, fireboxFrameMat, 0, fireboxY + fireboxHeight/2 + frameThick/2, 0.02);
  // Bottom
  addBox(fireboxWidth + frameThick*2, frameThick, fbFrameDepth, fireboxFrameMat, 0, fireboxY - frameThick/2, 0.02);
  // Left
  addBox(frameThick, fireboxHeight, fbFrameDepth, fireboxFrameMat, -fireboxWidth/2 - frameThick/2, fireboxY, 0.02);
  // Right
  addBox(frameThick, fireboxHeight, fbFrameDepth, fireboxFrameMat, fireboxWidth/2 + frameThick/2, fireboxY, 0.02);

  // Glass Pane
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(fireboxWidth - 0.02, fireboxHeight - 0.02),
    glassMat
  );
  glass.position.set(0, fireboxY, 0.04);
  root.add(glass);

  // Interior Logs
  const logGroup = new THREE.Group();
  logGroup.position.set(0, fireboxY - fireboxHeight/2 + 0.05, -0.1);
  
  function addLog(r, l, x, y, z, rx, ry, rz) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 12), logMat);
    log.position.set(x, y, z);
    log.rotation.set(rx, ry, rz);
    logGroup.add(log);
  }
  
  // Base logs
  addLog(0.06, 0.5, -0.15, 0.05, 0, 0, 0, Math.PI/2);
  addLog(0.05, 0.5, 0.15, 0.05, 0, 0, 0, Math.PI/2);
  // Cross logs
  addLog(0.05, 0.4, 0, 0.12, 0.05, Math.PI/4, 0, 0);
  addLog(0.04, 0.35, 0, 0.15, -0.05, -Math.PI/6, 0, 0);
  
  root.add(logGroup);

  // Gravel/Embers
  for (let i = 0; i < 30; i++) {
    const r = 0.015 + (i % 5) * 0.005;
    const x = (i % 10 - 5) * 0.08;
    const z = (Math.floor(i / 10) - 1) * 0.08;
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), gravelMat);
    pebble.position.set(x, fireboxY - fireboxHeight/2 + r, z - 0.1);
    root.add(pebble);
  }

  // --- 4. Upper Stone Fill (Above Firebox) ---
  const upperStartY = colTopY + stoneSize/2;
  const mantelBottomY = totalHeight - 0.15; // Leave room for corbels/mantel
  
  currentY = upperStartY;
  while (currentY < mantelBottomY) {
    const h = stoneSize * (0.8 + (stoneIdx % 3) * 0.1);
    const y = currentY + h/2;
    const fillWidth = totalWidth - 2 * columnWidth;
    
    // Center fill stones (split into 2-3 blocks)
    addBox(fillWidth/2 - 0.01, h, depth, getStoneMat(stoneIdx), -fillWidth/4, y, 0);
    addBox(fillWidth/2 - 0.01, h, depth, getStoneMat(stoneIdx+1), fillWidth/4, y, 0);
    
    currentY += h;
    stoneIdx += 2;
  }

  // --- 5. Corbels (Wooden Brackets) ---
  // Use ExtrudeGeometry for the scroll shape
  const corbelShape = new THREE.Shape();
  corbelShape.moveTo(0, 0);
  corbelShape.lineTo(0.12, 0);
  corbelShape.quadraticCurveTo(0.12, 0.05, 0.08, 0.1);
  corbelShape.quadraticCurveTo(0.04, 0.15, 0.02, 0.18);
  corbelShape.lineTo(0, 0.18);
  corbelShape.lineTo(0, 0);
  
  const corbelGeom = new THREE.ExtrudeGeometry(corbelShape, {
    depth: 0.18,
    bevelEnabled: false
  });
  // Center geometry
  corbelGeom.translate(-0.06, 0, -0.09); 

  const leftCorbel = new THREE.Mesh(corbelGeom, woodMat);
  leftCorbel.position.set(-totalWidth/2 + 0.2, mantelBottomY + 0.05, 0);
  leftCorbel.rotation.z = Math.PI; // Flip upside down to hang from mantel
  root.add(leftCorbel);

  const rightCorbel = new THREE.Mesh(corbelGeom, woodMat);
  rightCorbel.position.set(totalWidth/2 - 0.2, mantelBottomY + 0.05, 0);
  rightCorbel.rotation.set(Math.PI, Math.PI, 0); // Flip and mirror
  root.add(rightCorbel);

  // --- 6. Mantel Shelf ---
  const mantelThick = 0.12;
  const mantelY = totalHeight - mantelThick/2;
  const mantelOverhang = 0.1;
  
  const mantel = new THREE.Mesh(
    new THREE.BoxGeometry(totalWidth + mantelOverhang*2, mantelThick, depth + 0.1),
    woodMat
  );
  mantel.position.set(0, mantelY, 0);
  root.add(mantel);
  
  // Mantel Edge Molding (Simple torus slice or just a smaller box underneath)
  const molding = new THREE.Mesh(
    new THREE.BoxGeometry(totalWidth + mantelOverhang*2, 0.04, 0.04),
    woodMat
  );
  molding.position.set(0, mantelY - mantelThick/2, depth/2 + 0.02);
  root.add(molding);

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