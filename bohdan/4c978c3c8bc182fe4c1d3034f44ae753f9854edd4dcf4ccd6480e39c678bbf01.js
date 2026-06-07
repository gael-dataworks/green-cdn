export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Siding: Off-white, matte
  const sidingMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f0,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Roof: Terracotta red, slightly rough
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xc05040,
    metalness: 0.1,
    roughness: 0.7,
  });

  // Foundation: Grey-green concrete
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x607060,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Trim: Pure white
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Wood: Porch floor and door
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Transparent blueish
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
  });

  // Brick: Chimney
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x904030,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Black: Vents, door knob
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

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

  // --- Dimensions ---
  const houseW = 1.0;
  const houseD = 0.9;
  const wallH = 0.5;
  const roofH = 0.35;
  const foundH = 0.08;
  const porchD = 0.3;
  const porchH = 0.02;

  // --- Foundation ---
  const foundation = addBox(houseW + 0.04, foundH, houseD + 0.04, foundationMat, 0, -foundH / 2, 0);
  
  // Foundation vents (small black boxes)
  const ventW = 0.06, ventH = 0.03, ventD = 0.02;
  const ventY = -foundH / 2 + ventH / 2 + 0.01;
  // Front vents
  addBox(ventW, ventH, ventD, blackMat, -0.3, ventY, houseD / 2 + 0.01);
  addBox(ventW, ventH, ventD, blackMat, 0.3, ventY, houseD / 2 + 0.01);
  // Side vents
  addBox(ventW, ventH, ventD, blackMat, -houseW / 2 - 0.01, ventY, -0.2);
  addBox(ventW, ventH, ventD, blackMat, -houseW / 2 - 0.01, ventY, 0.2);

  // --- Main Walls ---
  // Main body box
  const mainWalls = addBox(houseW, wallH, houseD, sidingMat, 0, foundH + wallH / 2, 0);

  // --- Main Roof ---
  // Gable roof running along X axis. Use a triangular prism (Cylinder 3 segments)
  // Rotate so flat face is down? No, cylinder 3 segments is a prism.
  // Default cylinder is Y-up. We need ridge along X.
  // So rotate Z by 90 deg (PI/2).
  const roofWidth = houseD + 0.1; // Overhang
  const roofLength = houseW + 0.1; // Overhang
  const roofRadius = roofWidth / 2 / Math.sin(Math.PI / 3); // Approx for triangle height
  // Actually simpler: Two planes or a custom shape.
  // Let's use CylinderGeometry(0, radius, length, 3) -> Triangular Prism.
  // Height of triangle = radius * sin(60) * 2? No.
  // Let's just use two rotated boxes for the roof planes.
  const roofSlope = 0.6; // Rise over run
  const roofThickness = 0.03;
  const roofSpan = houseD + 0.15;
  const roofPlaneW = Math.sqrt((roofSpan / 2) ** 2 + (roofSpan / 2 * roofSlope) ** 2);
  const roofAngle = Math.atan(roofSlope);

  // Left Roof Plane
  const roofLeft = addBox(roofPlaneW, roofThickness, roofLength, roofMat, 0, foundH + wallH + (roofSpan / 2 * roofSlope) / 2, 0, -roofAngle, 0, 0);
  roofLeft.position.z = -roofSpan / 4;
  roofLeft.position.x = -roofSpan / 4 * Math.cos(roofAngle); // Shift to meet at ridge
  
  // Right Roof Plane
  const roofRight = addBox(roofPlaneW, roofThickness, roofLength, roofMat, 0, foundH + wallH + (roofSpan / 2 * roofSlope) / 2, 0, roofAngle, 0, 0);
  roofRight.position.z = roofSpan / 4;
  roofRight.position.x = -roofSpan / 4 * Math.cos(roofAngle);

  // Gable Ends (White triangles under roof)
  const gableH = roofSpan / 2 * roofSlope;
  const gableGeom = new THREE.BufferGeometry();
  const gableVerts = new Float32Array([
    0, -gableH / 2, 0,
    -houseW / 2 - 0.05, -gableH / 2, 0,
    -houseW / 2 - 0.05, gableH / 2, 0,
    0, -gableH / 2, 0,
    houseW / 2 + 0.05, -gableH / 2, 0,
    houseW / 2 + 0.05, gableH / 2, 0,
  ]);
  // Actually simpler: Just boxes cut or triangles. Let's use simple boxes for gable walls
  // Left Gable
  addBox(0.05, gableH, houseW, sidingMat, -houseW / 2 - 0.025, foundH + wallH + gableH / 2, 0);
  // Right Gable
  addBox(0.05, gableH, houseW, sidingMat, houseW / 2 + 0.025, foundH + wallH + gableH / 2, 0);

  // Gable Vents (small horizontal slats)
  const ventSlatW = 0.08, ventSlatH = 0.015;
  const gableVentY = foundH + wallH + gableH * 0.6;
  // Left Gable Vents
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, -houseW / 2 - 0.05, gableVentY, 0, 0, 0, 0);
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, -houseW / 2 - 0.05, gableVentY + 0.03, 0, 0, 0, 0);
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, -houseW / 2 - 0.05, gableVentY + 0.06, 0, 0, 0, 0);
  // Right Gable Vents
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, houseW / 2 + 0.05, gableVentY, 0, 0, 0, 0);
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, houseW / 2 + 0.05, gableVentY + 0.03, 0, 0, 0, 0);
  addBox(ventSlatW, ventSlatH, 0.01, blackMat, houseW / 2 + 0.05, gableVentY + 0.06, 0, 0, 0, 0);

  // --- Chimney ---
  const chimW = 0.12, chimD = 0.08, chimH = 0.25;
  const chimney = addBox(chimW, chimH, chimD, brickMat, houseW / 2 - 0.15, foundH + wallH + gableH + chimH / 2, 0.1);
  // Chimney Cap
  addBox(chimW + 0.04, 0.04, chimD + 0.04, brickMat, houseW / 2 - 0.15, foundH + wallH + gableH + chimH + 0.02, 0.1);

  // --- Porch ---
  // Porch is on the front (+Z) side, slightly offset to left in image? 
  // Image shows porch spanning most of the front right.
  // Let's place it centered on the front face but lower.
  const porchW = 0.6;
  const porchX = 0.1; // Offset slightly right
  const porchZ = houseD / 2 + porchD / 2;
  
  // Porch Floor
  const porchFloor = addBox(porchW, porchH, porchD, woodMat, porchX, foundH + porchH / 2, porchZ);
  
  // Porch Steps
  const stepW = 0.15, stepH = 0.04, stepD = 0.08;
  addBox(stepW, stepH, stepD, woodMat, porchX - porchW / 2 + stepW / 2, foundH + stepH / 2, porchZ + porchD / 2 + stepD / 2);
  addBox(stepW * 1.2, stepH, stepD * 1.2, woodMat, porchX - porchW / 2 + stepW * 0.6, foundH + stepH * 1.5, porchZ + porchD / 2 + stepD * 1.5);

  // Porch Roof (Lower gable or shed)
  // Image shows a roof over the porch. Let's make it a low gable parallel to main roof.
  const pRoofH = 0.15;
  const pRoofSpan = porchD + 0.1;
  const pRoofSlope = 0.5;
  const pRoofPlaneW = Math.sqrt((pRoofSpan / 2) ** 2 + (pRoofSpan / 2 * pRoofSlope) ** 2);
  const pRoofAngle = Math.atan(pRoofSlope);
  const pRoofY = foundH + wallH * 0.7; // Lower than main roof
  
  // Porch Roof Left
  const pRoofLeft = addBox(pRoofPlaneW, 0.025, porchW + 0.1, roofMat, porchX, pRoofY + (pRoofSpan / 2 * pRoofSlope) / 2, porchZ, -pRoofAngle, 0, 0);
  pRoofLeft.position.z = porchZ - pRoofSpan / 4;
  pRoofLeft.position.x = porchX - pRoofSpan / 4 * Math.cos(pRoofAngle);

  // Porch Roof Right
  const pRoofRight = addBox(pRoofPlaneW, 0.025, porchW + 0.1, roofMat, porchX, pRoofY + (pRoofSpan / 2 * pRoofSlope) / 2, porchZ, pRoofAngle, 0, 0);
  pRoofRight.position.z = porchZ + pRoofSpan / 4;
  pRoofRight.position.x = porchX - pRoofSpan / 4 * Math.cos(pRoofAngle);

  // Porch Columns
  const colH = pRoofY - foundH - porchH;
  const colR = 0.025;
  // Front Left
  addCylinder(colR, colR, colH, trimMat, porchX - porchW / 2 + 0.05, foundH + porchH + colH / 2, porchZ + porchD / 2 - 0.05);
  // Front Right
  addCylinder(colR, colR, colH, trimMat, porchX + porchW / 2 - 0.05, foundH + porchH + colH / 2, porchZ + porchD / 2 - 0.05);
  // Back Right (against wall)
  addCylinder(colR, colR, colH, trimMat, porchX + porchW / 2 - 0.05, foundH + porchH + colH / 2, porchZ - porchD / 2 + 0.05);

  // Porch Railing
  const railH = 0.35;
  const railMatWhite = trimMat;
  // Front Railing
  const railGroup = new THREE.Group();
  railGroup.position.set(porchX, foundH + porchH + railH / 2, porchZ + porchD / 2 - 0.08);
  // Top rail
  addBox(porchW - 0.1, 0.02, 0.02, railMatWhite, 0, railH / 2 - 0.01, 0, 0, 0, 0); // Relative to group
  // Bottom rail
  addBox(porchW - 0.1, 0.02, 0.02, railMatWhite, 0, -railH / 2 + 0.01, 0, 0, 0, 0);
  // Slats
  const slatCount = 12;
  const slatW = 0.02;
  const slatGap = (porchW - 0.1) / slatCount;
  for (let i = 0; i < slatCount; i++) {
    const sx = - (porchW - 0.1) / 2 + slatGap / 2 + i * slatGap;
    addBox(slatW, railH - 0.04, 0.02, railMatWhite, sx, 0, 0, 0, 0, 0);
  }
  root.add(railGroup);

  // --- Windows ---
  const winFrameMat = trimMat;
  const winGlassMat = glassMat;
  const winDepth = 0.03;

  // Front Porch Windows (Large panes)
  // Left pane
  addBox(0.15, 0.25, winDepth, winFrameMat, porchX - porchW / 2 + 0.15, foundH + porchH + 0.15, porchZ - porchD / 2 + 0.02);
  addBox(0.14, 0.24, 0.01, winGlassMat, porchX - porchW / 2 + 0.15, foundH + porchH + 0.15, porchZ - porchD / 2 + 0.04);
  // Right pane
  addBox(0.15, 0.25, winDepth, winFrameMat, porchX - porchW / 2 + 0.35, foundH + porchH + 0.15, porchZ - porchD / 2 + 0.02);
  addBox(0.14, 0.24, 0.01, winGlassMat, porchX - porchW / 2 + 0.35, foundH + porchH + 0.15, porchZ - porchD / 2 + 0.04);

  // Right Wall Windows
  // Large 3-pane window
  const rwX = houseW / 2 + 0.02;
  const rwY = foundH + wallH * 0.6;
  const rwZ = 0.1;
  addBox(0.35, 0.2, winDepth, winFrameMat, rwX, rwY, rwZ, 0, Math.PI / 2, 0);
  addBox(0.34, 0.19, 0.01, winGlassMat, rwX + 0.02, rwY, rwZ, 0, Math.PI / 2, 0);
  // Small window next to it
  addBox(0.12, 0.15, winDepth, winFrameMat, rwX, rwY, rwZ + 0.25, 0, Math.PI / 2, 0);
  addBox(0.11, 0.14, 0.01, winGlassMat, rwX + 0.02, rwY, rwZ + 0.25, 0, Math.PI / 2, 0);

  // Left Wall Window
  const lwX = -houseW / 2 - 0.02;
  const lwY = foundH + wallH * 0.5;
  const lwZ = -0.1;
  addBox(0.2, 0.25, winDepth, winFrameMat, lwX, lwY, lwZ, 0, -Math.PI / 2, 0);
  addBox(0.19, 0.24, 0.01, winGlassMat, lwX - 0.02, lwY, lwZ, 0, -Math.PI / 2, 0);

  // --- Door ---
  const doorW = 0.12, doorH = 0.28, doorD = 0.04;
  const doorX = porchX - porchW / 2 + 0.1;
  const doorY = foundH + porchH + doorH / 2;
  const doorZ = porchZ - porchD / 2 + 0.02;
  
  const door = addBox(doorW, doorH, doorD, woodMat, doorX, doorY, doorZ);
  // Door Knob
  addCylinder(0.01, 0.01, 0.02, blackMat, doorX + doorW / 2 + 0.01, doorY, doorZ + doorD / 2 + 0.01, 0, 0, Math.PI / 2);
  // Door Frame
  addBox(doorW + 0.02, doorH + 0.02, 0.01, trimMat, doorX, doorY, doorZ - doorD / 2 - 0.01);

  // --- Trim / Gutters ---
  // White fascia along roof edges
  const fasciaH = 0.04;
  // Main roof fascia
  addBox(roofLength, fasciaH, 0.02, trimMat, 0, foundH + wallH + gableH - 0.02, -roofSpan / 2);
  addBox(roofLength, fasciaH, 0.02, trimMat, 0, foundH + wallH + gableH - 0.02, roofSpan / 2);
  
  // Downspout (White cylinder on corner)
  const dsX = houseW / 2 + 0.06;
  const dsZ = houseD / 2 + 0.06;
  const dsH = wallH + foundH;
  addCylinder(0.015, 0.015, dsH, trimMat, dsX, foundH + dsH / 2, dsZ);
  // Elbow at bottom
  addCylinder(0.015, 0.015, 0.08, trimMat, dsX + 0.04, foundH + 0.02, dsZ, Math.PI / 2, 0, 0);

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