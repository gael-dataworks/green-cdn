export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const matPurple = new THREE.MeshStandardMaterial({ color: 0xD4C4E8, roughness: 0.6, metalness: 0.0 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0xC4E8D4, roughness: 0.6, metalness: 0.0 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xF0E8C4, roughness: 0.6, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0xE8A4A4, roughness: 0.5, metalness: 0.1 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4, metalness: 0.0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x405060, roughness: 0.1, metalness: 0.5 });
  const matDoor = new THREE.MeshStandardMaterial({ color: 0xA4D8E8, roughness: 0.5, metalness: 0.0 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.3, metalness: 0.5 });
  const matFoundation = new THREE.MeshStandardMaterial({ color: 0xC4B4A4, roughness: 0.7, metalness: 0.0 });
  const matStep = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.6, metalness: 0.0 });

  // --- Dimensions ---
  const houseW = 1.0;
  const houseD = 0.7;
  const wallH = 0.5;
  const roofH = 0.25;
  const sectionW = houseW / 3;
  
  // --- Helpers ---
  function createBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  function createWindow(x, y, z, ry, isSide) {
    const frameW = 0.12;
    const frameH = 0.14;
    const frameD = 0.02;
    
    // Frame
    const frame = createBox(frameW, frameH, frameD, matWhite, x, y, z, 0, ry, 0);
    
    // Glass
    const glass = createBox(frameW * 0.8, frameH * 0.8, 0.01, matGlass, x, y, z + (ry ? 0 : 0.015), 0, ry, 0);
    
    // Muntins (Grid)
    const muntinH = createBox(frameW * 0.8, 0.01, 0.01, matWhite, x, y, z + (ry ? 0 : 0.016), 0, ry, 0);
    const muntinV = createBox(0.01, frameH * 0.8, 0.01, matWhite, x, y, z + (ry ? 0 : 0.016), 0, ry, 0);
  }

  // --- Foundation ---
  createBox(houseW + 0.04, 0.04, houseD + 0.04, matFoundation, 0, -wallH / 2 - 0.02, 0);

  // --- Walls ---
  // Left Section (Purple)
  createBox(sectionW, wallH, houseD, matPurple, -houseW / 2 + sectionW / 2, 0, 0);
  
  // Center Section (Green) - Front face primarily
  // Making it a full block but green, though visually mostly front matters
  createBox(sectionW, wallH, houseD, matGreen, 0, 0, 0);
  
  // Right Section (Yellow)
  createBox(sectionW, wallH, houseD, matYellow, houseW / 2 - sectionW / 2, 0, 0);

  // --- Roof ---
  // Gable shape
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-houseW / 2 - 0.05, 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo(houseW / 2 + 0.05, 0);
  roofShape.lineTo(-houseW / 2 - 0.05, 0);
  
  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: houseD + 0.1,
    bevelEnabled: false
  });
  // Center the extrusion
  roofGeom.center();
  const roof = new THREE.Mesh(roofGeom, matRoof);
  roof.position.set(0, wallH / 2 + roofH / 2, 0);
  roof.rotation.y = Math.PI; // Flip to match shape orientation if needed
  root.add(roof);

  // Roof Ridges (Corrugation)
  const ridgeCount = 12;
  const ridgeSpacing = (houseD + 0.1) / ridgeCount;
  const ridgeStart = -(houseD + 0.1) / 2 + ridgeSpacing;
  for (let i = 0; i < ridgeCount; i++) {
    const zPos = ridgeStart + i * ridgeSpacing;
    // Place ridges on both slopes
    // Left slope
    createBox(0.01, 0.01, houseW * 0.9, matRoof, -houseW * 0.2, wallH / 2 + roofH * 0.5, zPos, 0, 0, -Math.atan(roofH / (houseW/2)));
    // Right slope
    createBox(0.01, 0.01, houseW * 0.9, matRoof, houseW * 0.2, wallH / 2 + roofH * 0.5, zPos, 0, 0, Math.atan(roofH / (houseW/2)));
  }
  
  // Roof Trim (Fascia)
  createBox(houseW + 0.1, 0.03, 0.03, matWhite, 0, wallH / 2, 0);
  createBox(houseW + 0.1, 0.03, 0.03, matWhite, 0, wallH / 2, houseD);


  // --- Door (on Green Wall) ---
  const doorW = 0.14;
  const doorH = 0.28;
  const doorY = -wallH / 2 + doorH / 2 + 0.02;
  const doorZ = houseD / 2 + 0.01;
  
  // Door Frame
  createBox(doorW + 0.02, doorH + 0.02, 0.02, matWhite, 0, doorY, doorZ);
  // Door Panel
  createBox(doorW, doorH, 0.01, matDoor, 0, doorY, doorZ + 0.01);
  // Handle
  createBox(0.01, 0.04, 0.02, matMetal, doorW / 2 - 0.02, doorY, doorZ + 0.015);
  // Step
  createBox(doorW + 0.1, 0.03, 0.1, matStep, 0, -wallH / 2 - 0.015, doorZ + 0.06);

  // --- Windows ---
  // Purple Wall (Left Side)
  createWindow(-houseW / 2 - 0.01, 0.05, 0, Math.PI / 2);
  // Yellow Wall (Front Right)
  createWindow(houseW / 2 - sectionW / 2, 0.05, houseD / 2 + 0.01, 0);
  // Yellow Wall (Right Side)
  createWindow(houseW / 2 + 0.01, 0.05, 0, -Math.PI / 2);

  // --- Vent (Back Yellow Gable) ---
  const ventW = 0.08;
  const ventH = 0.1;
  const ventY = wallH / 2 + roofH * 0.4;
  const ventZ = -houseD / 2 - 0.01;
  createBox(ventW, ventH, 0.02, matWhite, 0, ventY, ventZ);
  // Slats
  for(let i=0; i<4; i++) {
    createBox(ventW * 0.8, 0.01, 0.01, matGreen, 0, ventY - 0.03 + i * 0.02, ventZ - 0.01);
  }

  // --- Gutter & Downspout ---
  // Corner is at x = houseW/2 - sectionW/2 (approx 0.16), z = houseD/2
  const gutterX = houseW / 2 - sectionW / 2 + 0.02;
  const gutterZ = houseD / 2 + 0.02;
  
  // Vertical Downspout
  createBox(0.02, wallH + 0.1, 0.02, matMetal, gutterX, 0, gutterZ);
  
  // Horizontal Eave Pipe
  // Along the right side roof edge
  const eavePipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, houseD + 0.1, 8),
    matMetal
  );
  eavePipe.rotation.z = Math.PI / 2;
  eavePipe.position.set(gutterX, wallH / 2 + 0.05, 0);
  root.add(eavePipe);

  // Elbow connector
  createBox(0.02, 0.02, 0.02, matMetal, gutterX, wallH / 2 + 0.05, gutterZ);

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