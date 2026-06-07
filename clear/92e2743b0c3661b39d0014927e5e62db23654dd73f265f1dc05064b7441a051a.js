export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte silicone/plastic look: high roughness, zero metalness.
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.0,
    roughness: 0.85,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const phoneW = 0.60;
  const phoneH = 1.20;
  const caseDepth = 0.10;
  const cornerR = 0.06;
  const bevelSize = 0.015;
  const bevelThickness = 0.015;

  // --- 1. Main Case Body ---
  // Create a rounded rectangle shape for the profile
  const shape = new THREE.Shape();
  const hw = phoneW / 2;
  const hh = phoneH / 2;
  
  // Start bottom-left, go counter-clockwise
  shape.moveTo(-hw + cornerR, -hh);
  shape.lineTo(hw - cornerR, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + cornerR);
  shape.lineTo(hw, hh - cornerR);
  shape.quadraticCurveTo(hw, hh, hw - cornerR, hh);
  shape.lineTo(-hw + cornerR, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - cornerR);
  shape.lineTo(-hw, -hh + cornerR);
  shape.quadraticCurveTo(-hw, -hh, -hw + cornerR, -hh);

  const extrudeSettings = {
    depth: caseDepth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelThickness,
  };

  const caseGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry so the pivot is at the center of the phone
  caseGeom.center();
  
  const caseBody = new THREE.Mesh(caseGeom, caseMat);
  // Orient: Y is up, Z is depth. Extrude is along Z by default.
  // We want the phone to stand on its bottom edge.
  // The shape is in XY plane. Extrusion is Z.
  // So the face is XY. This is correct for a phone facing Z.
  root.add(caseBody);

  // --- 2. Kickstand ---
  // A flat plate hinged at the back.
  const standW = 0.25;
  const standH = 0.45;
  const standThick = 0.02;
  
  const standShape = new THREE.Shape();
  const sw2 = standW / 2;
  const sh2 = standH / 2;
  const sCorner = 0.03;
  
  standShape.moveTo(-sw2 + sCorner, -sh2);
  standShape.lineTo(sw2 - sCorner, -sh2);
  standShape.quadraticCurveTo(sw2, -sh2, sw2, -sh2 + sCorner);
  standShape.lineTo(sw2, sh2 - sCorner);
  standShape.quadraticCurveTo(sw2, sh2, sw2 - sCorner, sh2);
  standShape.lineTo(-sw2 + sCorner, sh2);
  standShape.quadraticCurveTo(-sw2, sh2, -sw2, sh2 - sCorner);
  standShape.lineTo(-sw2, -sh2 + sCorner);
  standShape.quadraticCurveTo(-sw2, -sh2, -sw2 + sCorner, -sh2);

  const standGeom = new THREE.ExtrudeGeometry(standShape, {
    depth: standThick,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  standGeom.center();

  const kickstand = new THREE.Mesh(standGeom, caseMat);
  
  // Position hinge: Back of case (negative Z), slightly below center Y.
  // Case depth is ~0.1. Back face is at z = -caseDepth/2 - bevel.
  // Let's approximate back face z ~ -0.07.
  const hingeZ = -0.07;
  const hingeY = -0.15; // Hinge is lower than center
  
  kickstand.position.set(0, hingeY, hingeZ);
  
  // Rotate to deploy. Hinge is at the top of the stand piece relative to its local coords?
  // The shape is centered. We need to pivot around the top edge.
  // Local height is standH. Top edge is at standH/2.
  // Move pivot to top edge:
  kickstand.translateY(standH / 2);
  // Rotate around X axis to angle it back (positive rotation leans back towards -Z)
  kickstand.rotateX(Math.PI / 3.5); // ~50 degrees
  
  root.add(kickstand);

  // --- 3. Buttons (Side) ---
  // Visible on the right side (positive X).
  // Power button (top), Volume buttons (middle).
  const btnW = 0.025;
  const btnH = 0.06;
  const btnD = 0.015; // protrusion
  const btnGeom = new THREE.BoxGeometry(btnW, btnH, btnD);
  
  // Power Button
  const powerBtn = new THREE.Mesh(btnGeom, caseMat);
  powerBtn.position.set(phoneW / 2 + btnD / 2, phoneH * 0.25, 0);
  root.add(powerBtn);

  // Volume Up
  const volUpBtn = new THREE.Mesh(btnGeom, caseMat);
  volUpBtn.position.set(phoneW / 2 + btnD / 2, phoneH * 0.05, 0);
  root.add(volUpBtn);

  // Volume Down
  const volDownBtn = new THREE.Mesh(btnGeom, caseMat);
  volDownBtn.position.set(phoneW / 2 + btnD / 2, -phoneH * 0.05, 0);
  root.add(volDownBtn);

  // --- 4. Bottom Ports ---
  // USB-C Port (Center)
  const portW = 0.08;
  const portH = 0.025;
  const portD = 0.02;
  const usbPort = new THREE.Mesh(new THREE.BoxGeometry(portW, portH, portD), portMat);
  usbPort.position.set(0, -phoneH / 2 - portD / 2 + 0.01, 0);
  root.add(usbPort);

  // Speaker Grilles (Left and Right of USB)
  const grilleW = 0.01;
  const grilleH = 0.015;
  const grilleD = 0.02;
  
  function addGrille(x) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(grilleW, grilleH, grilleD), portMat);
    g.position.set(x, -phoneH / 2 - grilleD / 2 + 0.01, 0);
    root.add(g);
  }
  
  // Left grilles
  addGrille(-0.15);
  addGrille(-0.18);
  addGrille(-0.21);
  
  // Right grilles
  addGrille(0.15);
  addGrille(0.18);
  addGrille(0.21);

  // --- 5. Camera Cutout (Back Top Left) ---
  // From back view, top left is negative X, positive Y.
  // We place a dark shape on the back surface.
  const camW = 0.12;
  const camH = 0.12;
  const camD = 0.01;
  const camCutout = new THREE.Mesh(new THREE.BoxGeometry(camW, camH, camD), portMat);
  // Back face Z is approx -0.07. We place this slightly in front of that to simulate depth.
  camCutout.position.set(-phoneW / 2 + 0.08, phoneH / 2 - 0.08, -0.06);
  root.add(camCutout);

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