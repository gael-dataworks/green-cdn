export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.4,
  });

  const keyDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const keyRedMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a3a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const keyGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b5e,
    metalness: 0.0,
    roughness: 0.7,
  });

  const keyOrangeMat = new THREE.MeshStandardMaterial({
    color: 0x8b6a3a,
    metalness: 0.0,
    roughness: 0.7,
  });
  
  const keyBlueMat = new THREE.MeshStandardMaterial({
    color: 0x3a5a8b,
    metalness: 0.0,
    roughness: 0.7,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Procedural Screen Texture ---
  // Mimics the terminal interface: blue bg, white text lines, orange bar
  const texWidth = 256;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const idx = (y * texWidth + x) * 4;
      
      // Base blue gradient
      const gradient = 0.1 + (y / texHeight) * 0.2;
      data[idx] = Math.floor(20 * gradient);     // R
      data[idx + 1] = Math.floor(50 * gradient); // G
      data[idx + 2] = Math.floor(180 * gradient); // B
      data[idx + 3] = 255;

      // White text lines (simulated)
      if (y > 20 && y < 180) {
        const lineSpacing = 15;
        const lineY = y % lineSpacing;
        if (lineY > 4 && lineY < 10) {
           // Randomize "text" blocks deterministically
           const block = Math.sin(x * 0.1 + y * 0.05) > 0.2;
           if (block) {
             data[idx] = 200;
             data[idx + 1] = 220;
             data[idx + 2] = 255;
           }
        }
      }

      // Orange bar at bottom
      if (y > 200) {
        data[idx] = 200;
        data[idx + 1] = 100;
        data[idx + 2] = 50;
      }
      
      // Top status bar
      if (y < 15) {
         data[idx] = 50;
         data[idx + 1] = 200;
         data[idx + 2] = 50;
      }
    }
  }
  
  const screenTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.needsUpdate = true;
  screenTexture.flipY = true; // Adjust for UV mapping if needed, usually BoxGeometry maps differently

  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x2244aa,
    emissiveIntensity: 0.2,
  });

  // --- Geometry Construction ---

  // 1. Main Body (Extruded Profile)
  // Profile: Flat bottom, angled front face, flat top, vertical back
  const bodyShape = new THREE.Shape();
  const depth = 0.6; // Width of the device
  const hBase = 0.15;
  const hTotal = 0.55;
  const dBase = 0.45;
  const dTop = 0.30;
  const angleStart = 0.15; // Where the angle starts from bottom

  bodyShape.moveTo(0, 0);
  bodyShape.lineTo(0, hBase); // Front bottom vertical lip
  bodyShape.lineTo(dBase - 0.05, hTotal - 0.08); // Angled face top
  bodyShape.lineTo(dBase, hTotal); // Top front corner (rounded via bevel later or just sharp)
  bodyShape.lineTo(dTop, hTotal); // Top surface
  bodyShape.lineTo(dTop, 0); // Back vertical
  bodyShape.lineTo(0, 0); // Close

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3
  };

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
  // Center the geometry
  bodyGeom.center();
  
  const mainBody = new THREE.Mesh(bodyGeom, caseMat);
  // Rotate to stand up correctly (Extrude is along Z, we want Y up)
  // Actually, let's keep Extrude along Z and rotate the mesh -90 deg around X
  mainBody.rotation.x = -Math.PI / 2;
  root.add(mainBody);

  // 2. Screen Assembly
  // Positioned on the top angled face
  const screenW = 0.18;
  const screenH = 0.12;
  const screenD = 0.005;
  
  const screenGeom = new THREE.BoxGeometry(screenW, screenH, screenD);
  const screenMesh = new THREE.Mesh(screenGeom, screenMat);
  
  // Calculate position on the angled face
  // The face goes from roughly (front, low) to (back, high)
  // Approximate center of the angled region
  const screenX = 0; // Centered width
  const screenY = 0.15; // Height offset
  const screenZ = 0.10; // Depth offset (forward)
  
  // Tilt to match the body angle (~45-60 degrees)
  const screenAngle = -Math.PI / 3.5; // Tilt back
  
  screenMesh.position.set(screenX, screenY + 0.12, screenZ - 0.05);
  screenMesh.rotation.x = screenAngle;
  root.add(screenMesh);

  // Screen Bezel (surrounding the screen)
  const bezelGeom = new THREE.BoxGeometry(screenW + 0.04, screenH + 0.04, 0.002);
  const bezelMesh = new THREE.Mesh(bezelGeom, screenBezelMat);
  bezelMesh.position.copy(screenMesh.position);
  bezelMesh.position.z -= 0.004; // Slightly behind screen
  bezelMesh.rotation.x = screenAngle;
  root.add(bezelMesh);


  // 3. Keypad
  // Buttons on the lower angled face
  const keyRadius = 0.018;
  const keyHeight = 0.015;
  const keyGeom = new THREE.CylinderGeometry(keyRadius, keyRadius * 0.9, keyHeight, 16);
  
  // Key layout definition (row, col, type)
  // Types: 'num', 'func', 'cancel', 'enter', 'action'
  const keys = [
    { r: 0, c: 0, type: 'cancel', label: 'X' },
    { r: 0, c: 1, type: 'func', label: '' },
    { r: 0, c: 2, type: 'func', label: '' },
    { r: 0, c: 3, type: 'func', label: '' },
    { r: 0, c: 4, type: 'action', label: 'OK' }, // Blue
    
    { r: 1, c: 0, type: 'num', label: '1' },
    { r: 1, c: 1, type: 'num', label: '2' },
    { r: 1, c: 2, type: 'num', label: '3' },
    { r: 1, c: 3, type: 'num', label: '4' },
    { r: 1, c: 4, type: 'num', label: '5' },

    { r: 2, c: 0, type: 'num', label: '6' },
    { r: 2, c: 1, type: 'num', label: '7' },
    { r: 2, c: 2, type: 'num', label: '8' },
    { r: 2, c: 3, type: 'num', label: '9' },
    { r: 2, c: 4, type: 'num', label: '0' },

    { r: 3, c: 0, type: 'enter', label: 'ENT' },
    { r: 3, c: 1, type: 'num', label: '.' },
    { r: 3, c: 2, type: 'num', label: '00' },
    { r: 3, c: 3, type: 'num', label: '#' },
    { r: 3, c: 4, type: 'num', label: '*' },
  ];

  const keypadGroup = new THREE.Group();
  // Position keypad group to align with the lower slope
  // The slope starts around y=0.15 and goes down to y=0
  const kpY = 0.08;
  const kpZ = 0.12;
  const kpAngle = -Math.PI / 4.5; // Shallower angle than screen

  keypadGroup.position.set(0, kpY, kpZ);
  keypadGroup.rotation.x = kpAngle;
  root.add(keypadGroup);

  const keySpacingX = 0.045;
  const keySpacingY = 0.050;
  const startX = -0.085;
  const startY = 0.09;

  keys.forEach(k => {
    let mat = keyDarkMat;
    if (k.type === 'cancel') mat = keyRedMat;
    if (k.type === 'enter') mat = keyGreenMat;
    if (k.type === 'action') mat = keyBlueMat;
    if (k.c === 0 && k.r === 0) mat = keyOrangeMat; // Top left special

    const keyMesh = new THREE.Mesh(keyGeom, mat);
    const x = startX + k.c * keySpacingX;
    const y = startY - k.r * keySpacingY;
    
    keyMesh.position.set(x, y, 0.005); // Slightly raised
    keypadGroup.add(keyMesh);
  });

  // 4. Side Panel Details (Right Side)
  // Vents and Ports
  const sideGroup = new THREE.Group();
  // Position on the right side of the body
  // Body width is 'depth' (0.6). Center is 0. So right side is at +0.3
  sideGroup.position.set(depth / 2 + 0.005, 0, 0);
  root.add(sideGroup);

  // Vents (Horizontal slits at top)
  const ventW = 0.08;
  const ventH = 0.008;
  const ventD = 0.005;
  const ventGeom = new THREE.BoxGeometry(ventD, ventH, ventW); // D is thickness (x-local), H is height (y), W is width (z)
  
  for (let i = 0; i < 5; i++) {
    const vent = new THREE.Mesh(ventGeom, portMat);
    vent.position.set(0, 0.35 - i * 0.025, 0);
    sideGroup.add(vent);
  }

  // Ports (Rectangular at bottom)
  const portW = 0.05;
  const portH = 0.04;
  const portD = 0.01;
  const portGeom = new THREE.BoxGeometry(portD, portH, portW);
  
  const portPositions = [-0.15, 0, 0.15];
  portPositions.forEach(pz => {
    const port = new THREE.Mesh(portGeom, portMat);
    port.position.set(0, 0.08, pz);
    sideGroup.add(port);
    
    // Port inner detail (black hole)
    const innerGeom = new THREE.BoxGeometry(portD + 0.002, portH - 0.01, portW - 0.01);
    const inner = new THREE.Mesh(innerGeom, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    inner.position.set(0.001, 0, 0);
    port.add(inner);
  });

  // Labels near ports (simulated with small raised boxes or just geometry)
  // Skipping complex text geometry for ports, relying on shape context

  // 5. Screws
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 6);
  const screw1 = new THREE.Mesh(screwGeom, screwMat);
  screw1.rotation.x = Math.PI / 2;
  screw1.position.set(-depth/2 - 0.002, -0.1, 0.2); // Left side front
  root.add(screw1);

  const screw2 = new THREE.Mesh(screwGeom, screwMat);
  screw2.rotation.x = Math.PI / 2;
  screw2.position.set(-depth/2 - 0.002, -0.1, -0.2); // Left side back
  root.add(screw2);
  
  // Front corner screw visible in reference
  const screw3 = new THREE.Mesh(screwGeom, screwMat);
  screw3.rotation.y = Math.PI / 2; // Facing front-ish
  screw3.position.set(0.15, -0.12, depth/2 + 0.002);
  root.add(screw3);


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