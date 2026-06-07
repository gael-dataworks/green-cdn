export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const orangePlasticMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.0,
    roughness: 0.6,
  });

  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  const darkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.4,
  });

  // --- Procedural Label Texture ---
  // Creates a texture with black background and white "text" blocks
  function createLabelTexture() {
    const w = 256, h = 128;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      // Black background
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 255;
    }
    // Draw white blocks to simulate text "SUPER TOOL" and "10000"
    // Top label area
    for (let y = 20; y < 50; y++) {
      for (let x = 40; x < 200; x++) {
        // Simple blocky font simulation
        if ((x > 50 && x < 190 && y > 25 && y < 45) || // Main bar
            (x > 60 && x < 70 && y > 20 && y < 50) ||   // S
            (x > 180 && x < 190 && y > 20 && y < 50)    // L
        ) {
           const idx = (y * w + x) * 4;
           data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255;
        }
      }
    }
    // Bottom label area "10000"
    for (let y = 70; y < 100; y++) {
      for (let x = 60; x < 180; x++) {
         if (y > 75 && y < 95) {
            const idx = (y * w + x) * 4;
            data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255;
         }
      }
    }
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  const labelTexture = createLabelTexture();
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Geometry Construction ---

  // 1. Main Body (Orange) - Lathe for ergonomic handle
  const bodyProfile = [
    new THREE.Vector2(0.0, 0.0),       // Center rear
    new THREE.Vector2(0.065, 0.0),     // Rear cap edge
    new THREE.Vector2(0.075, 0.15),    // Grip swell
    new THREE.Vector2(0.070, 0.35),    // Grip taper start
    new THREE.Vector2(0.055, 0.55),    // Neck
    new THREE.Vector2(0.060, 0.65),    // Head junction flare
    new THREE.Vector2(0.0, 0.65),      // Top center
  ];
  // We need a full profile for lathe (bottom to top, radius >= 0)
  // Actually, let's use a simpler approach: Cylinder segments for better control of the "flat" sides of a tool handle
  // Tools aren't perfectly round. Let's use a scaled Box or Extrude for the main body to get the flat grip sides.
  
  // Revised Body: Extruded shape for the handle to get flat sides for switches
  const handleShape = new THREE.Shape();
  handleShape.moveTo(-0.07, -0.05);
  handleShape.lineTo(0.07, -0.05);
  handleShape.quadraticCurveTo(0.09, -0.05, 0.09, 0.0);
  handleShape.lineTo(0.09, 0.6);
  handleShape.quadraticCurveTo(0.09, 0.7, 0.07, 0.7);
  handleShape.lineTo(-0.07, 0.7);
  handleShape.quadraticCurveTo(-0.09, 0.7, -0.09, 0.6);
  handleShape.lineTo(-0.09, 0.0);
  handleShape.quadraticCurveTo(-0.09, -0.05, -0.07, -0.05);
  
  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry
  handleGeom.center();
  const main_body = new THREE.Mesh(handleGeom, orangePlasticMat);
  // Rotate to lie along Z
  main_body.rotation.x = Math.PI / 2;
  main_body.position.z = 0.15; 
  root.add(main_body);

  // 2. Head Housing (Black)
  const headGeom = new THREE.BoxGeometry(0.16, 0.14, 0.22);
  // Round the corners by scaling vertices or just use a box for now (low poly style)
  // Let's make it slightly tapered
  const head_housing = new THREE.Mesh(headGeom, blackPlasticMat);
  head_housing.position.set(0, 0.02, 0.65); // Front of handle
  // Taper the front
  head_housing.scale.set(1, 1, 1); 
  root.add(head_housing);

  // Head Top Cap (Orange accent or Black vent area)
  const headTopGeom = new THREE.BoxGeometry(0.14, 0.02, 0.15);
  const head_top = new THREE.Mesh(headTopGeom, blackPlasticMat);
  head_top.position.set(0, 0.08, 0.60);
  root.add(head_top);

  // 3. Base Plate / Foot (Black/Dark Grey)
  // Curved front, flat bottom
  const footShape = new THREE.Shape();
  footShape.moveTo(-0.08, 0.0);
  footShape.lineTo(0.08, 0.0);
  footShape.lineTo(0.08, 0.12);
  footShape.quadraticCurveTo(0.08, 0.18, 0.0, 0.18);
  footShape.quadraticCurveTo(-0.08, 0.18, -0.08, 0.12);
  footShape.lineTo(-0.08, 0.0);
  
  const footGeom = new THREE.ExtrudeGeometry(footShape, {
    depth: 0.04,
    bevelEnabled: false,
  });
  footGeom.center();
  const base_plate = new THREE.Mesh(footGeom, darkGreyMat);
  base_plate.rotation.x = Math.PI / 2;
  base_plate.position.set(0, -0.06, 0.78); // Under the head
  root.add(base_plate);

  // 4. End Cap (Orange bulb at rear)
  const endCapGeom = new THREE.SphereGeometry(0.075, 16, 16);
  const end_cap = new THREE.Mesh(endCapGeom, orangePlasticMat);
  end_cap.scale.set(1, 1, 0.8); // Flatten slightly
  end_cap.position.set(0, 0, -0.15); // Rear of handle
  root.add(end_cap);

  // 5. Side Vents (Black slots on handle)
  const ventGeom = new THREE.BoxGeometry(0.04, 0.015, 0.005);
  const ventPositions = [
    [0, 0.06, 0.25], [0, 0.06, 0.30], [0, 0.06, 0.35], [0, 0.06, 0.40]
  ];
  for (const [x, y, z] of ventPositions) {
    const vent = new THREE.Mesh(ventGeom, blackPlasticMat);
    vent.position.set(x, y, z);
    vent.rotation.x = Math.PI / 2; // Align with handle surface
    root.add(vent);
  }
  // Vents on the other side too (symmetric)
  for (const [x, y, z] of ventPositions) {
    const vent = new THREE.Mesh(ventGeom, blackPlasticMat);
    vent.position.set(x, -y, z); // Mirror Y (since handle is flat top/bottom in our model, actually vents are usually on sides)
    // Correction: Our handle is flat X (width) and Y (height). Vents are usually on the side faces (X).
    // Let's place them on the side face X = 0.07
    const sideVent = new THREE.Mesh(ventGeom, blackPlasticMat);
    sideVent.position.set(0.075, 0.0, z);
    sideVent.rotation.y = Math.PI / 2;
    root.add(sideVent);
  }

  // 6. Speed Switch (Black slider on side)
  const switchGeom = new THREE.BoxGeometry(0.03, 0.01, 0.06);
  const speed_switch = new THREE.Mesh(switchGeom, blackPlasticMat);
  speed_switch.position.set(0.08, 0.0, 0.45);
  root.add(speed_switch);

  // 7. Labels (Decals)
  // Top label "SUPER TOOL"
  const labelTopGeom = new THREE.PlaneGeometry(0.12, 0.04);
  const label_top = new THREE.Mesh(labelTopGeom, labelMat);
  label_top.position.set(0.081, 0.02, 0.35); // On the side face
  label_top.rotation.y = Math.PI / 2;
  root.add(label_top);

  // Bottom label "10000"
  const labelBotGeom = new THREE.PlaneGeometry(0.10, 0.03);
  const label_bottom = new THREE.Mesh(labelBotGeom, labelMat);
  label_bottom.position.set(0.081, -0.02, 0.50);
  label_bottom.rotation.y = Math.PI / 2;
  root.add(label_bottom);

  // 8. Screws (Small black dots on head)
  const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
  const screwPositions = [
    [0.06, 0.05, 0.60], [-0.06, 0.05, 0.60],
    [0.06, -0.05, 0.60], [-0.06, -0.05, 0.60]
  ];
  for (const [x, y, z] of screwPositions) {
    const screw = new THREE.Mesh(screwGeom, blackPlasticMat);
    screw.position.set(x, y, z);
    screw.rotation.x = Math.PI / 2;
    root.add(screw);
  }

  // 9. Blade Clamp / Front Nose (Black cylinder)
  const noseGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.08, 16);
  const nose = new THREE.Mesh(noseGeom, blackPlasticMat);
  nose.rotation.z = Math.PI / 2;
  nose.position.set(0, 0, 0.75);
  root.add(nose);

  // --- Orientation Adjustment ---
  // The model is currently built along Z axis. 
  // The reference image shows it angled: Handle back-right, Head front-left.
  // We rotate the whole group to match this dynamic pose.
  root.rotation.y = -Math.PI / 4; // Turn left
  root.rotation.x = Math.PI / 6;  // Tilt up slightly
  root.rotation.z = Math.PI / 8;  // Roll slightly

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