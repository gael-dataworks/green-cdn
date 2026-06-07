export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const matPurple = new THREE.MeshStandardMaterial({ color: 0xdccfe9, roughness: 0.6, metalness: 0.0 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0xccead8, roughness: 0.6, metalness: 0.0 });
  const matPeach = new THREE.MeshStandardMaterial({ color: 0xf5e0c6, roughness: 0.6, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0xd48a8a, roughness: 0.5, metalness: 0.0 });
  const matTrim = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.0 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0x8b6f55, roughness: 0.7, metalness: 0.0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.1, metalness: 0.1 });
  const matDoor = new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.5, metalness: 0.0 });
  const matStep = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6, metalness: 0.0 });
  const matGutter = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.3 });

  // --- Dimensions ---
  const houseW = 1.2;
  const houseD = 0.8;
  const wallH = 0.6;
  const roofH = 0.35;
  const baseH = 0.04;
  const overhang = 0.08;

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  function addCylinder(rTop, rBot, h, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Base Board ---
  addBox(houseW + 0.04, baseH, houseD + 0.04, matBase, 0, baseH / 2, 0);

  // --- Walls ---
  // Left Side (Purple lower, Peach upper gable)
  // We construct the gable end as a prism using extrude logic or just boxes + triangle
  // Simplified: Box for lower, Prism for upper.
  const wallThickness = 0.04;
  
  // Left Wall Lower (Purple)
  addBox(wallThickness, wallH, houseD, matPurple, -houseW / 2 + wallThickness / 2, wallH / 2, 0);
  
  // Gable End Upper (Peach) - Triangle prism
  // Using a custom shape for the gable triangle
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseW / 2, wallH);
  gableShape.lineTo(houseW / 2, wallH);
  gableShape.lineTo(0, wallH + roofH);
  gableShape.lineTo(-houseW / 2, wallH);
  
  const gableGeom = new THREE.ExtrudeGeometry(gableShape, { depth: wallThickness, bevelEnabled: false });
  // The extrude goes along Z. We need it to face X (side wall).
  // Default extrude is Z. Rotate Y 90 deg to face X.
  const gableMesh = new THREE.Mesh(gableGeom, matPeach);
  gableMesh.rotation.y = Math.PI / 2;
  gableMesh.position.set(-houseW / 2 + wallThickness / 2, wallH + roofH / 2, 0);
  root.add(gableMesh);

  // Front Walls (Green left, Peach right)
  const frontSplit = -0.2; // Split point on X
  // Green Section
  addBox(frontSplit - (-houseW / 2), wallH, wallThickness, matGreen, 
    (-houseW / 2 + frontSplit) / 2, wallH / 2, houseD / 2 - wallThickness / 2);
  // Peach Section
  addBox(houseW / 2 - frontSplit, wallH, wallThickness, matPeach, 
    (frontSplit + houseW / 2) / 2, wallH / 2, houseD / 2 - wallThickness / 2);

  // Right Wall (Peach)
  addBox(wallThickness, wallH, houseD, matPeach, houseW / 2 - wallThickness / 2, wallH / 2, 0);

  // Back Wall (Peach - simple closure)
  addBox(houseW, wallH, wallThickness, matPeach, 0, wallH / 2, -houseD / 2 + wallThickness / 2);

  // --- Roof ---
  // Main Roof Prism
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-houseW / 2 - overhang, wallH);
  roofShape.lineTo(houseW / 2 + overhang, wallH);
  roofShape.lineTo(0, wallH + roofH);
  roofShape.lineTo(-houseW / 2 - overhang, wallH);

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, { depth: houseD + overhang * 2, bevelEnabled: false });
  const roofMesh = new THREE.Mesh(roofGeom, matRoof);
  // Extrude is Z, we want it centered.
  roofMesh.position.set(0, wallH + roofH / 2, -overhang); 
  root.add(roofMesh);

  // Roof Corrugation (Ridges)
  const ridgeCount = 12;
  const ridgeSpacing = (houseD + overhang * 2) / ridgeCount;
  for (let i = 0; i < ridgeCount; i++) {
    const z = -houseD / 2 - overhang + i * ridgeSpacing + ridgeSpacing / 2;
    // Thin box acting as a ridge
    addBox(houseW + overhang * 2, 0.005, 0.015, matRoof, 0, wallH + roofH + 0.002, z);
  }

  // White Fascia/Trim under eaves
  addBox(houseW + overhang * 2 + 0.02, 0.03, 0.03, matTrim, 0, wallH - 0.015, houseD / 2 + overhang / 2);
  addBox(houseW + overhang * 2 + 0.02, 0.03, 0.03, matTrim, 0, wallH - 0.015, -houseD / 2 - overhang / 2);

  // --- Windows ---
  function createWindow(x, y, z, ry) {
    const wFrame = 0.14;
    const hFrame = 0.16;
    const dFrame = 0.02;
    
    // Frame
    addBox(wFrame, hFrame, dFrame, matTrim, x, y, z, 0, ry, 0);
    
    // Glass Panes (4 small ones)
    const paneW = 0.05;
    const paneH = 0.06;
    const gap = 0.01;
    const glassZ = z + (ry === 0 ? 0.01 : 0); // Slight offset based on rotation
    
    // Top Left
    addBox(paneW, paneH, 0.01, matGlass, x - paneW/2 - gap/2, y + paneH/2 + gap/2, z + 0.005, 0, ry, 0);
    // Top Right
    addBox(paneW, paneH, 0.01, matGlass, x + paneW/2 + gap/2, y + paneH/2 + gap/2, z + 0.005, 0, ry, 0);
    // Bottom Left
    addBox(paneW, paneH, 0.01, matGlass, x - paneW/2 - gap/2, y - paneH/2 - gap/2, z + 0.005, 0, ry, 0);
    // Bottom Right
    addBox(paneW, paneH, 0.01, matGlass, x + paneW/2 + gap/2, y - paneH/2 - gap/2, z + 0.005, 0, ry, 0);
  }

  // Window 1 (Left side, Purple wall)
  createWindow(-houseW / 2 + wallThickness / 2 + 0.01, wallH * 0.6, -0.15, Math.PI / 2);
  
  // Window 2 (Front, Green wall)
  createWindow(-0.45, wallH * 0.6, houseD / 2 - wallThickness / 2 - 0.01, 0);

  // Window 3 (Front, Peach wall)
  createWindow(0.25, wallH * 0.6, houseD / 2 - wallThickness / 2 - 0.01, 0);

  // Window 4 (Right side, Peach wall)
  createWindow(houseW / 2 - wallThickness / 2 - 0.01, wallH * 0.6, 0.15, -Math.PI / 2);

  // --- Door ---
  const doorW = 0.12;
  const doorH = 0.35;
  const doorD = 0.02;
  const doorX = 0.05;
  const doorY = doorH / 2;
  const doorZ = houseD / 2 - wallThickness / 2 - 0.01;
  
  addBox(doorW, doorH, doorD, matDoor, doorX, doorY, doorZ, 0, 0, 0);
  // Door Knob
  addCylinder(0.01, 0.01, 0.03, matTrim, doorX + doorW / 2 - 0.02, doorY, doorZ + doorD / 2 + 0.01, 0, 0, 0);
  
  // Step
  addBox(0.18, 0.03, 0.1, matStep, doorX, 0.015, doorZ + 0.06);

  // --- Vent ---
  // Small white slats on the gable
  const ventY = wallH + roofH * 0.6;
  const ventZ = 0;
  for (let i = 0; i < 4; i++) {
    addBox(0.06, 0.005, 0.01, matTrim, -houseW / 2 + wallThickness / 2 + 0.01, ventY + i * 0.025, ventZ, 0, Math.PI/2, 0);
  }

  // --- Gutter / Downspout ---
  // Corner downspout on the right front corner
  const cornerX = houseW / 2 - wallThickness / 2;
  const cornerZ = houseD / 2 - wallThickness / 2;
  
  // Vertical pipe
  addCylinder(0.015, 0.015, wallH + 0.1, matGutter, cornerX + 0.02, wallH / 2, cornerZ + 0.02, 0, 0, 0);
  // Elbow at top
  addCylinder(0.015, 0.015, 0.06, matGutter, cornerX + 0.02, wallH + 0.05, cornerZ + 0.02, Math.PI / 2, 0, 0);
  // Horizontal gutter along front
  addCylinder(0.015, 0.015, houseW / 2, matGutter, 0, wallH + 0.05, cornerZ + 0.02, 0, 0, Math.PI / 2);


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