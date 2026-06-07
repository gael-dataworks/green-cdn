export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.1,
    roughness: 0.8,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dimensions
  const width = 0.32;
  const height = 0.58;
  const depth = 0.035;
  const cornerRadius = 0.045;
  const wallThickness = 0.004;

  // 1. Main Case Body (Back and Sides)
  // We create a rounded rectangle shape for the back face
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = cornerRadius;

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, 1.5 * Math.PI, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, 0.5 * Math.PI, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, 0.5 * Math.PI, 1 * Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, 1 * Math.PI, 1.5 * Math.PI, false);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 3,
  };

  const caseGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry
  caseGeom.translate(-width / 2, -height / 2, 0);
  
  const caseBody = new THREE.Mesh(caseGeom, caseMat);
  // Rotate so back faces +Z (camera), front (cavity) faces -Z
  caseBody.rotation.y = Math.PI; 
  root.add(caseBody);

  // 2. Kickstand
  // It's a flap attached to the back. In the image, it's deployed.
  // Dimensions approx: width 0.12, height 0.15, thickness 0.005
  const standW = 0.12;
  const standH = 0.14;
  const standD = 0.005;
  
  const standGeom = new THREE.BoxGeometry(standW, standH, standD);
  const kickstand = new THREE.Mesh(standGeom, caseMat);
  
  // Position on the back of the case
  // Case is rotated PI around Y, so local +Z is front, -Z is back.
  // We want the stand on the back surface.
  // In local space of caseBody (before rotation), back is at z = depth.
  // But we added caseBody to root and rotated it.
  // Let's position kickstand in root space relative to caseBody.
  // caseBody is at 0,0,0 rotated PI. Its back face is at z = -depth/2 roughly? 
  // Actually ExtrudeGeometry goes from 0 to depth. Center is depth/2.
  // After rotation PI, the "front" (z=0 face) is at z=0 facing -Z. The "back" (z=depth face) is at z=0 facing +Z.
  // Wait, ExtrudeGeometry creates geometry from z=0 to z=depth.
  // We translated it by -width/2, -height/2. Z is 0 to depth.
  // Rotation Y=PI around center.
  // Center of caseBody is roughly (0, 0, depth/2).
  // Let's just place the kickstand manually in the group.
  
  kickstand.position.set(0, -0.12, depth / 2 + standD / 2 + 0.002);
  // Angle it back. The hinge is at the bottom of the stand.
  // In the image, the stand forms a triangle with the case.
  // Let's rotate it around X to lean back.
  kickstand.rotation.x = -0.6; // Lean back
  
  // We need a hinge mechanism or just place it.
  // To make it look attached, let's shift pivot.
  // Simpler: Just place a wedge.
  // The stand in the image is a flat plate.
  // Let's create a pivot group for the stand to rotate correctly around its bottom edge.
  const standPivot = new THREE.Group();
  standPivot.position.set(0, -0.12 + standH / 2, depth / 2 + 0.001);
  // The stand geometry center is at 0,0,0. We want bottom edge to be pivot.
  // So shift geometry up by H/2 inside the mesh? Or shift mesh in group.
  kickstand.position.y = standH / 2; 
  kickstand.rotation.x = -Math.PI / 3.5; // ~50 degrees
  standPivot.add(kickstand);
  root.add(standPivot);

  // 3. Buttons (Side)
  // Image shows buttons on the right side (when viewing back).
  // In our orientation (back facing +Z), right side is -X.
  // Wait, if back faces +Z, then right hand is -X.
  // Let's verify: Front faces -Z. Right hand is +X.
  // Image shows back. Buttons are on the right side of the image.
  // So in world space, buttons are at +X.
  // In local case space (rotated PI), +X is left.
  // Let's just place them in root coordinates based on visual.
  // Case width 0.32. Side is at x = 0.16.
  
  const btnW = 0.015;
  const btnH = 0.04;
  const btnD = 0.005;
  const btnGeom = new THREE.BoxGeometry(btnD, btnH, btnW); // Oriented for side mount
  
  // Volume Up
  const volUp = new THREE.Mesh(btnGeom, caseMat);
  volUp.position.set(0.16 + btnD/2, 0.15, 0);
  volUp.rotation.y = Math.PI / 2;
  root.add(volUp);

  // Volume Down
  const volDown = new THREE.Mesh(btnGeom, caseMat);
  volDown.position.set(0.16 + btnD/2, 0.08, 0);
  volDown.rotation.y = Math.PI / 2;
  root.add(volDown);

  // Power Button (higher up, opposite side or same? Image shows same side, higher)
  // Actually image shows two buttons close together (volume) and one separate (power).
  // In image, power is above volume? Or below?
  // Usually power is on the other side or above.
  // Image shows: Top button (power?), then gap, then two volume buttons?
  // Let's look closely. Side visible has 3 buttons.
  // Top one is longer? No, looks like Power (top), Volume Up, Volume Down.
  // Or Volume Up, Volume Down, Power (bottom).
  // Let's assume standard: Power on right side (image right), Volume on left.
  // But image shows all on the visible side.
  // Let's put 3 buttons on the right side (+X).
  
  const powerBtn = new THREE.Mesh(btnGeom, caseMat);
  powerBtn.position.set(0.16 + btnD/2, 0.22, 0);
  powerBtn.rotation.y = Math.PI / 2;
  root.add(powerBtn);

  // 4. Ports (Bottom)
  // Charging port center, speakers corners.
  // Bottom of case is at y = -height/2.
  const bottomY = -height / 2;
  
  // Charging Port (USB-C shape)
  const portW = 0.025;
  const portH = 0.008;
  const portGeom = new THREE.BoxGeometry(0.005, portH, portW);
  const chargePort = new THREE.Mesh(portGeom, darkMat);
  chargePort.position.set(0, bottomY + 0.005, 0);
  root.add(chargePort);

  // Speaker Grilles (Left and Right of charging port)
  const speakerW = 0.012;
  const speakerH = 0.004;
  const speakerGeom = new THREE.BoxGeometry(0.005, speakerH, speakerW);
  
  const speakerL = new THREE.Mesh(speakerGeom, darkMat);
  speakerL.position.set(-0.06, bottomY + 0.005, 0);
  root.add(speakerL);

  const speakerR = new THREE.Mesh(speakerGeom, darkMat);
  speakerR.position.set(0.06, bottomY + 0.005, 0);
  root.add(speakerR);

  // 5. Camera Bump (Top Left of back)
  // In image, top left corner (back view).
  // In our coords (back facing +Z), top left is -X, +Y.
  const camW = 0.08;
  const camH = 0.08;
  const camD = 0.004;
  const camGeom = new THREE.BoxGeometry(camW, camH, camD);
  const camBump = new THREE.Mesh(camGeom, caseMat);
  // Position on back surface
  camBump.position.set(-0.12, 0.24, depth / 2 + camD / 2);
  // Rounded corners for cam bump? Box is fine for low poly.
  root.add(camBump);
  
  // Camera Lenses (black circles on the bump)
  const lensR = 0.012;
  const lensGeom = new THREE.CylinderGeometry(lensR, lensR, 0.002, 16);
  const lens1 = new THREE.Mesh(lensGeom, darkMat);
  lens1.rotation.x = Math.PI / 2;
  lens1.position.set(-0.12 + 0.02, 0.24 + 0.02, depth / 2 + camD + 0.001);
  root.add(lens1);
  
  const lens2 = new THREE.Mesh(lensGeom, darkMat);
  lens2.rotation.x = Math.PI / 2;
  lens2.position.set(-0.12 - 0.02, 0.24 - 0.02, depth / 2 + camD + 0.001);
  root.add(lens2);

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