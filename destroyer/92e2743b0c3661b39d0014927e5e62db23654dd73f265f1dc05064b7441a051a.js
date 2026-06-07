export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte plastic / rubber finish as per reference (light gray)
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xd3d3d3,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Dark recessed ports
  const portMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry Helpers ---

  // Create a rounded rectangular slab using ExtrudeGeometry
  function createRoundedCase(width, height, depth, radius, bevelSize) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    // Draw rounded rectangle path
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 8,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  // --- Main Case Body ---
  // Dimensions approximating a modern smartphone
  const caseWidth = 0.50;
  const caseHeight = 0.95;
  const caseDepth = 0.045; // Thickness
  const cornerRadius = 0.06;
  const edgeBevel = 0.015;

  const caseGeom = createRoundedCase(caseWidth, caseHeight, caseDepth, cornerRadius, edgeBevel);
  // Center the geometry so (0,0,0) is the center of the case
  caseGeom.center(); 
  
  const case_body = new THREE.Mesh(caseGeom, caseMat);
  root.add(case_body);

  // --- Kickstand ---
  // A flat plate extending from the back
  const standWidth = 0.28;
  const standLength = 0.35;
  const standThickness = 0.025;

  const standGeom = new THREE.BoxGeometry(standWidth, standThickness, standLength);
  // Taper the stand slightly for style (optional, but looks better)
  // We'll just use a box for simplicity and robustness
  
  const kickstand = new THREE.Mesh(standGeom, caseMat);
  
  // Position: Attached to the back face (negative Z relative to case center)
  // The case is centered at 0,0,0. Back face is at z = -caseDepth/2.
  // We want the hinge near the bottom third.
  const hingeY = -0.25; 
  const hingeZ = -caseDepth / 2;
  
  kickstand.position.set(0, hingeY, hingeZ);
  
  // Rotate to stand up. 
  // The stand lies flat against the back initially (XY plane). 
  // We need to rotate it around X axis to prop the phone up.
  // Angle approx 50-60 degrees from the back plane.
  kickstand.rotation.x = Math.PI / 2.5; // ~72 degrees from flat, or ~18 degrees from vertical?
  // Let's visualize: Phone leans back. Stand goes down and back.
  // If phone is vertical, stand needs to go back.
  // Rotation X positive rotates top away, bottom towards.
  // We want the stand to extend backwards (negative Z) and downwards (negative Y).
  // Actually, the stand is hinged at the top of the stand piece.
  // Let's pivot around the top edge of the stand mesh.
  kickstand.geometry.translate(0, -standLength / 2, 0); // Move pivot to top edge
  kickstand.position.set(0, hingeY, hingeZ);
  kickstand.rotation.x = -Math.PI / 3.5; // Angle back
  
  root.add(kickstand);

  // --- Side Buttons ---
  // Pill-shaped buttons on the side edge (Positive X side in this view)
  const buttonWidth = 0.035;
  const buttonHeight = 0.012;
  const buttonDepth = 0.06; // Protrusion + thickness
  
  // Use Capsule for rounded buttons
  const buttonGeom = new THREE.CapsuleGeometry(buttonWidth / 2, buttonDepth, 4, 8);
  // Capsule is Y-up by default. We need it along X axis.
  buttonGeom.rotateZ(Math.PI / 2);

  const side_button_top = new THREE.Mesh(buttonGeom, caseMat);
  // Position on the right edge (caseWidth/2)
  side_button_top.position.set(caseWidth / 2, 0.15, 0);
  root.add(side_button_top);

  const side_button_bottom = new THREE.Mesh(buttonGeom, caseMat);
  side_button_bottom.position.set(caseWidth / 2, -0.05, 0);
  root.add(side_button_bottom);

  // --- Bottom Ports ---
  // Recessed dark shapes on the bottom face (Negative Y)
  
  // USB-C Port (Center)
  const usbWidth = 0.08;
  const usbHeight = 0.025;
  const usbDepth = 0.015;
  const usbGeom = new THREE.BoxGeometry(usbWidth, usbHeight, usbDepth);
  const bottom_port_usb = new THREE.Mesh(usbGeom, portMat);
  bottom_port_usb.position.set(0, -caseHeight / 2 - 0.005, 0); // Slightly inset
  root.add(bottom_port_usb);

  // Speaker Grilles (Left and Right of USB)
  const speakerHoleSize = 0.012;
  const speakerGeom = new THREE.CylinderGeometry(speakerHoleSize/2, speakerHoleSize/2, 0.015, 6);
  speakerGeom.rotateX(Math.PI / 2); // Lay flat on bottom face

  // Left Speaker Group
  const speaker_left_group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const hole = new THREE.Mesh(speakerGeom, portMat);
    // Space them out
    hole.position.set(-0.12 + i * 0.025, 0, 0); 
    speaker_left_group.add(hole);
  }
  speaker_left_group.position.set(0, -caseHeight / 2 - 0.005, 0);
  root.add(speaker_left_group);

  // Right Speaker Group
  const speaker_right_group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const hole = new THREE.Mesh(speakerGeom, portMat);
    hole.position.set(-0.12 + i * 0.025, 0, 0);
    speaker_right_group.add(hole);
  }
  speaker_right_group.position.set(0, -caseHeight / 2 - 0.005, 0.12); // Offset to right side
  root.add(speaker_right_group);

  // --- Camera Bump (Subtle) ---
  // Top left corner on the back
  const camBumpWidth = 0.12;
  const camBumpHeight = 0.12;
  const camBumpDepth = 0.01;
  const camBumpGeom = new THREE.BoxGeometry(camBumpWidth, camBumpHeight, camBumpDepth);
  // Round the corners of the bump slightly? Box is fine for low poly.
  const camera_bump = new THREE.Mesh(camBumpGeom, caseMat);
  camera_bump.position.set(-caseWidth/2 + 0.08, caseHeight/2 - 0.08, -caseDepth/2 - camBumpDepth/2);
  root.add(camera_bump);

  // Lens cutouts on the bump
  const lensGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16);
  lensGeom.rotateX(Math.PI / 2);
  const lens1 = new THREE.Mesh(lensGeom, portMat);
  lens1.position.set(-0.03, 0.03, 0.01);
  camera_bump.add(lens1);
  
  const lens2 = new THREE.Mesh(lensGeom, portMat);
  lens2.position.set(0.03, -0.03, 0.01);
  camera_bump.add(lens2);

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