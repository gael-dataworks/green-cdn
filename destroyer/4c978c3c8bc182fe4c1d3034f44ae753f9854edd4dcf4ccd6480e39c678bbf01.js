export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Siding: White, matte, with procedural texture for clapboard lines
  const sidingMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Roof: Terracotta red, slightly rough
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb85c46,
    metalness: 0.1,
    roughness: 0.7,
  });

  // Foundation: Dark grey/green stone
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x5a6a5e,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Trim/Columns: Clean white
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Porch Floor: Wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Door: Reddish brown
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x8b4538,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Chimney: Brick
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x8a4b38,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Glass: Transparent
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
  });

  // --- Procedural Siding Texture ---
  // Creates horizontal lines to simulate clapboard siding
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Base white
      let r = 245, g = 245, b = 240;
      // Dark line every ~12 pixels
      if (y % 12 < 2) {
        r = 200; g = 200; b = 200;
      }
      texData[idx] = r;
      texData[idx + 1] = g;
      texData[idx + 2] = b;
      texData[idx + 3] = 255;
    }
  }
  const sidingTexture = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  sidingTexture.colorSpace = THREE.SRGBColorSpace;
  sidingTexture.wrapS = THREE.RepeatWrapping;
  sidingTexture.wrapT = THREE.RepeatWrapping;
  sidingTexture.repeat.set(1, 4); // Repeat vertically to match wall height
  sidingTexture.needsUpdate = true;
  sidingMat.map = sidingTexture;

  // --- Dimensions ---
  const houseW = 1.2;
  const houseD = 1.0;
  const wallH = 0.7;
  const foundationH = 0.06;
  const porchD = 0.35;
  const porchH = 0.35;
  const roofOverhang = 0.08;

  // --- Foundation ---
  const foundationGeom = new THREE.BoxGeometry(houseW + 0.04, foundationH, houseD + 0.04);
  const foundation = new THREE.Mesh(foundationGeom, foundationMat);
  foundation.position.y = -foundationH / 2;
  root.add(foundation);

  // --- Main Walls ---
  // Main body box
  const mainWallsGeom = new THREE.BoxGeometry(houseW, wallH, houseD);
  const mainWalls = new THREE.Mesh(mainWallsGeom, sidingMat);
  mainWalls.position.y = foundationH + wallH / 2;
  root.add(mainWalls);

  // --- Main Roof ---
  // Profile: Triangle with overhangs
  const roofProfileShape = new THREE.Shape();
  const roofW = houseW + roofOverhang * 2;
  const roofH = 0.35;
  const roofStartX = -roofW / 2;
  
  roofProfileShape.moveTo(roofStartX, 0);
  roofProfileShape.lineTo(roofStartX + 0.05, 0); // Eave lip
  roofProfileShape.lineTo(0, roofH); // Peak
  roofProfileShape.lineTo(-roofStartX + 0.05, 0); // Other eave lip
  roofProfileShape.lineTo(-roofStartX, 0);
  
  const roofExtrudeSettings = {
    steps: 1,
    depth: houseD + roofOverhang * 2,
    bevelEnabled: false
  };
  const mainRoofGeom = new THREE.ExtrudeGeometry(roofProfileShape, roofExtrudeSettings);
  const mainRoof = new THREE.Mesh(mainRoofGeom, roofMat);
  // Center and position
  mainRoof.position.set(0, foundationH + wallH + roofH / 2, -roofOverhang);
  // Rotate to align ridge with Z axis (profile is in XY, extrusion is Z)
  // Actually ExtrudeGeometry extrudes along Z by default. 
  // The shape is in XY plane. So the roof runs along Z.
  // We need to rotate it 90 deg around X to make the triangle stand up? 
  // No, the shape is drawn in XY. Extrusion goes Z. So it's a prism lying on its side?
  // Wait, Shape is in XY. Extrude goes +Z. So the face is XY.
  // We want the triangle face to be XZ (gable end) or XY (front face)?
  // Standard gable: Triangle in XY plane, extruded along Z.
  // So the face is visible from Front/Back.
  // My shape is defined in XY. So the triangle is in XY plane.
  // Extrusion adds depth in Z.
  // This creates a roof that has a triangular face on the Front/Back.
  // But the image shows a gable on the Side (Left).
  // So I need the triangle in YZ plane, extruded along X.
  // Or rotate the mesh.
  // Let's rotate the mesh 90 deg around Y.
  mainRoof.rotation.y = Math.PI / 2;
  // Now the ridge runs Front-to-Back (Z).
  // Center it:
  mainRoof.position.set(0, foundationH + wallH + roofH / 2, 0);
  root.add(mainRoof);

  // --- Porch ---
  // Porch is attached to the front (+Z), slightly to the right? 
  // Image: Porch spans most of the front, maybe offset right.
  // Let's place it front-right.
  const porchW = houseW * 0.6;
  const porchX = houseW * 0.1; // Offset right
  
  // Porch Floor
  const porchFloorGeom = new THREE.BoxGeometry(porchW, 0.02, porchD);
  const porchFloor = new THREE.Mesh(porchFloorGeom, woodMat);
  porchFloor.position.set(porchX, foundationH + 0.01, houseD / 2 + porchD / 2);
  root.add(porchFloor);

  // Porch Roof
  // Smaller gable roof
  const porchRoofW = porchW + 0.1;
  const porchRoofH = 0.15;
  const porchRoofShape = new THREE.Shape();
  const pStartX = -porchRoofW / 2;
  porchRoofShape.moveTo(pStartX, 0);
  porchRoofShape.lineTo(pStartX + 0.03, 0);
  porchRoofShape.lineTo(0, porchRoofH);
  porchRoofShape.lineTo(-pStartX + 0.03, 0);
  porchRoofShape.lineTo(-pStartX, 0);
  
  const porchRoofGeom = new THREE.ExtrudeGeometry(porchRoofShape, { steps: 1, depth: porchD + 0.1, bevelEnabled: false });
  const porchRoof = new THREE.Mesh(porchRoofGeom, roofMat);
  porchRoof.rotation.y = Math.PI / 2;
  porchRoof.position.set(porchX, foundationH + porchH + porchRoofH / 2, houseD / 2 + porchD / 2);
  root.add(porchRoof);

  // Porch Columns
  const colGeom = new THREE.CylinderGeometry(0.025, 0.025, porchH, 8);
  const colPositions = [
    [porchX - porchW / 2 + 0.05, foundationH + porchH / 2, houseD / 2 + porchD / 2],
    [porchX + porchW / 2 - 0.05, foundationH + porchH / 2, houseD / 2 + porchD / 2],
    [porchX, foundationH + porchH / 2, houseD / 2 + porchD / 2] // Center column
  ];
  for (const [x, y, z] of colPositions) {
    const col = new THREE.Mesh(colGeom, trimMat);
    col.position.set(x, y, z);
    root.add(col);
  }

  // Porch Railing
  const railH = 0.03;
  const railY = foundationH + 0.15;
  const railGeom = new THREE.BoxGeometry(porchW, railH, 0.02);
  const topRail = new THREE.Mesh(railGeom, trimMat);
  topRail.position.set(porchX, railY + railH / 2, houseD / 2 + porchD / 2);
  root.add(topRail);
  
  // Railing posts
  const postGeom = new THREE.BoxGeometry(0.02, 0.15, 0.02);
  for (let i = 0; i < 6; i++) {
    const px = porchX - porchW / 2 + (porchW / 5) * i;
    const post = new THREE.Mesh(postGeom, trimMat);
    post.position.set(px, railY - 0.075, houseD / 2 + porchD / 2);
    root.add(post);
  }

  // --- Door ---
  const doorW = 0.12;
  const doorH = 0.22;
  const doorD = 0.02;
  const doorGeom = new THREE.BoxGeometry(doorW, doorH, doorD);
  const door = new THREE.Mesh(doorGeom, doorMat);
  // Located on the front wall, left of porch
  door.position.set(porchX - porchW / 2 - doorW / 2 - 0.05, foundationH + doorH / 2, houseD / 2 + 0.01);
  root.add(door);

  // Steps
  const stepW = 0.4;
  const stepD = 0.2;
  const step1 = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.03, stepD), woodMat);
  step1.position.set(door.position.x, foundationH + 0.015, houseD / 2 + porchD / 2 + 0.1);
  root.add(step1);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.03, stepD), woodMat);
  step2.position.set(door.position.x, foundationH + 0.045, houseD / 2 + porchD / 2 + 0.2);
  root.add(step2);

  // --- Windows ---
  function createWindow(w, h, x, y, z, ry) {
    const frameGeom = new THREE.BoxGeometry(w, h, 0.03);
    const frame = new THREE.Mesh(frameGeom, trimMat);
    frame.position.set(x, y, z);
    frame.rotation.y = ry;
    root.add(frame);

    const glassGeom = new THREE.BoxGeometry(w * 0.8, h * 0.8, 0.01);
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.set(x, y, z + (ry === 0 ? 0.02 : 0));
    glass.rotation.y = ry;
    root.add(glass);
    
    // Window panes (cross)
    const paneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.5 });
    const vPane = new THREE.Mesh(new THREE.BoxGeometry(0.01, h * 0.8, 0.02), paneMat);
    vPane.position.set(x, y, z + (ry === 0 ? 0.02 : 0));
    vPane.rotation.y = ry;
    root.add(vPane);
    
    const hPane = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.01, 0.02), paneMat);
    hPane.position.set(x, y, z + (ry === 0 ? 0.02 : 0));
    hPane.rotation.y = ry;
    root.add(hPane);
  }

  // Left side window
  createWindow(0.12, 0.15, -houseW / 2 - 0.015, foundationH + wallH * 0.5, 0, Math.PI / 2);

  // Front upper window (above porch roof)
  createWindow(0.25, 0.12, porchX, foundationH + wallH * 0.75, houseD / 2 + 0.015, 0);

  // Porch windows (large)
  createWindow(0.15, 0.25, porchX - 0.15, foundationH + porchH * 0.6, houseD / 2 + porchD / 2 - 0.05, 0);
  createWindow(0.15, 0.25, porchX + 0.15, foundationH + porchH * 0.6, houseD / 2 + porchD / 2 - 0.05, 0);

  // --- Chimney ---
  const chimW = 0.1;
  const chimD = 0.1;
  const chimH = 0.3;
  const chimGeom = new THREE.BoxGeometry(chimW, chimH, chimD);
  const chimney = new THREE.Mesh(chimGeom, brickMat);
  // Place on roof, right side, back
  chimney.position.set(houseW * 0.3, foundationH + wallH + roofH + chimH / 2, -houseD * 0.3);
  root.add(chimney);

  // --- Gutters ---
  const gutterGeom = new THREE.CylinderGeometry(0.015, 0.015, houseD + roofOverhang * 2, 8);
  gutterGeom.rotateZ(Math.PI / 2); // Align along Z
  const gutterLeft = new THREE.Mesh(gutterGeom, trimMat);
  gutterLeft.position.set(-houseW / 2 - roofOverhang / 2, foundationH + wallH, 0);
  root.add(gutterLeft);
  
  const gutterRight = new THREE.Mesh(gutterGeom, trimMat);
  gutterRight.position.set(houseW / 2 + roofOverhang / 2, foundationH + wallH, 0);
  root.add(gutterRight);

  // Downspout
  const dsGeom = new THREE.CylinderGeometry(0.01, 0.01, wallH, 6);
  const downspout = new THREE.Mesh(dsGeom, trimMat);
  downspout.position.set(houseW / 2 + roofOverhang / 2, foundationH + wallH / 2, 0);
  root.add(downspout);

  // --- Vents ---
  const ventGeom = new THREE.BoxGeometry(0.08, 0.06, 0.02);
  const ventLeft = new THREE.Mesh(ventGeom, trimMat);
  ventLeft.position.set(-houseW * 0.3, foundationH + wallH * 0.85, houseD / 2 + 0.01);
  root.add(ventLeft);
  
  const ventRight = new THREE.Mesh(ventGeom, trimMat);
  ventRight.position.set(houseW * 0.3, foundationH + wallH * 0.85, houseD / 2 + 0.01);
  root.add(ventRight);

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