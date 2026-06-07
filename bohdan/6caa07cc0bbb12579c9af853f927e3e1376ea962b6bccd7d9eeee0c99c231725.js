export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.1,
    roughness: 0.7,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.2,
    roughness: 0.4,
  });

  const btnDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const btnRedMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const btnGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b5a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.5,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.3,
    roughness: 0.4,
  });

  // --- Procedural Screen Texture ---
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  // Background: Deep Blue
  for (let i = 0; i < W * H; i++) {
    data[i * 4] = 30;     // R
    data[i * 4 + 1] = 60; // G
    data[i * 4 + 2] = 140;// B
    data[i * 4 + 3] = 255;// A
  }
  // Text Lines (White)
  function drawLine(yStart, height, colorR, colorG, colorB) {
    for (let y = yStart; y < yStart + height; y++) {
      for (let x = 20; x < W - 20; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = colorR;
        data[idx + 1] = colorG;
        data[idx + 2] = colorB;
      }
    }
  }
  // Simulate code lines
  drawLine(40, 4, 255, 255, 255);
  drawLine(50, 4, 255, 255, 255);
  drawLine(60, 4, 255, 255, 255);
  drawLine(70, 4, 255, 255, 255);
  drawLine(80, 4, 255, 255, 255);
  drawLine(90, 4, 200, 200, 255);
  drawLine(100, 4, 255, 255, 255);
  
  // Orange highlight bar at bottom
  for (let y = 200; y < 230; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 100;
      data[idx + 2] = 50;
    }
  }
  // Battery icon top right
  for (let y = 10; y < 25; y++) {
    for (let x = W - 40; x < W - 10; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255;
    }
  }

  const screenTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.needsUpdate = true;
  screenTex.flipY = true;

  const screenDisplayMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x222222,
    emissiveIntensity: 0.2,
  });

  // --- Geometry Construction ---

  // 1. Main Body (Wedge Shape)
  // Profile in YZ plane, extruded along X
  const bodyShape = new THREE.Shape();
  const depth = 0.8;
  const frontH = 0.12;
  const backH = 0.45;
  const radius = 0.04;

  // Draw profile counter-clockwise starting bottom-left
  bodyShape.moveTo(-depth/2, -frontH/2);
  bodyShape.lineTo(depth/2, -frontH/2); // Bottom front
  bodyShape.lineTo(depth/2, frontH/2);  // Front face up
  // Slanted top
  bodyShape.lineTo(-depth/2 + 0.15, backH/2); 
  bodyShape.lineTo(-depth/2, backH/2);  // Back top
  bodyShape.lineTo(-depth/2, -backH/2); // Back face down
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 8
  });
  // Center geometry
  bodyGeom.center();
  
  const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
  // Rotate to stand up correctly (profile was YZ, extrusion X)
  // Actually ExtrudeGeometry extrudes along Z by default. 
  // My shape was defined in XY plane effectively if I use standard coords.
  // Let's re-orient: Shape in YZ plane, extrude along X.
  // Three.js ExtrudeGeometry extrudes along local Z.
  // So I need to rotate the mesh to align Z with X.
  mainBody.rotation.y = Math.PI / 2;
  root.add(mainBody);

  // 2. Screen Assembly
  const screenGroup = new THREE.Group();
  
  // Bezel
  const screenW = 0.32;
  const screenH = 0.22;
  const bezelGeom = new THREE.BoxGeometry(screenW, 0.02, screenH);
  const bezel = new THREE.Mesh(bezelGeom, screenBezelMat);
  screenGroup.add(bezel);

  // Display Surface
  const displayGeom = new THREE.PlaneGeometry(screenW * 0.9, screenH * 0.85);
  const display = new THREE.Mesh(displayGeom, screenDisplayMat);
  display.position.z = 0.011; // Slightly in front of bezel
  screenGroup.add(display);

  // Position screen on the slanted face
  // The slanted face is roughly at Y=0.2, Z=-0.2 (local to body before rotation)
  // After body rotation (Y=90), the slanted face is on top, angled.
  // Let's position relative to root for simplicity, matching the visual.
  screenGroup.position.set(0, 0.15, -0.15);
  screenGroup.rotation.x = -0.5; // Tilt back
  root.add(screenGroup);

  // 3. Keypad
  const keypadGroup = new THREE.Group();
  
  function createButton(mat, x, z, r, h) {
    const geom = new THREE.CylinderGeometry(r, r, h, 16);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = Math.PI / 2; // Lay flat on XZ plane (relative to keypad group which is tilted)
    mesh.position.set(x, 0, z);
    return mesh;
  }

  // Keypad base plane (slightly raised from body)
  const keyBaseGeom = new THREE.BoxGeometry(0.5, 0.01, 0.5);
  const keyBase = new THREE.Mesh(keyBaseGeom, bodyMat);
  keyBase.position.set(0, 0.005, 0.15);
  keypadGroup.add(keyBase);

  // Button Grid
  // Left column (Red/Brown)
  keypadGroup.add(createButton(btnRedMat, -0.18, 0.25, 0.025, 0.015));
  keypadGroup.add(createButton(btnRedMat, -0.18, 0.15, 0.025, 0.015));
  
  // Center Grid (Dark) - 3 columns, 4 rows
  const startX = -0.06;
  const startZ = 0.25;
  const gap = 0.05;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      keypadGroup.add(createButton(btnDarkMat, startX + c * gap, startZ - r * gap, 0.02, 0.012));
    }
  }

  // Right Column (Green)
  keypadGroup.add(createButton(btnGreenMat, 0.18, 0.25, 0.025, 0.015));
  keypadGroup.add(createButton(btnGreenMat, 0.18, 0.15, 0.025, 0.015));

  // LED Indicator
  const ledGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
  const led = new THREE.Mesh(ledGeom, ledMat);
  led.rotation.x = Math.PI / 2;
  led.position.set(0.05, 0.006, 0.05);
  keypadGroup.add(led);

  // Attach keypad group to main body
  // The keypad sits on the lower flat section.
  // Since mainBody is rotated Y=90, its "top" flat section is now facing +Y roughly.
  // But we positioned screenGroup and keypadGroup in root space to match the visual angle.
  // Let's parent them to mainBody for coherence, but adjust local transforms.
  // Actually, simpler: Keep everything in root, just position carefully.
  // The mainBody is rotated Y=90. Its local Z is now World X. Its local X is now World -Z.
  // This is getting confusing. Let's reset mainBody transform and build in local space properly.
  
  // RE-STRATEGY: Build everything in a logical local space, then rotate the whole group at the end if needed.
  // Logical Space: Y=Up, Z=Forward (screen faces +Z), X=Right.
  // Body Profile in YZ plane. Extrude along X.
  
  root.remove(mainBody);
  root.remove(screenGroup);
  root.remove(keypadGroup);

  // Re-create Body in Logical Space
  // Profile: Bottom at y=0. Front at z=0.4. Back at z=-0.4.
  // Front height y=0.15. Back height y=0.5.
  const profileShape = new THREE.Shape();
  profileShape.moveTo(0.4, 0);       // Front Bottom
  profileShape.lineTo(0.4, 0.15);    // Front Top
  profileShape.lineTo(-0.3, 0.5);    // Back Top (slanted)
  profileShape.lineTo(-0.4, 0.5);    // Back Top Corner
  profileShape.lineTo(-0.4, 0);      // Back Bottom
  profileShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(profileShape, {
    depth: 0.65, // Width along X
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    steps: 1
  });
  // Center the extrusion along X
  bodyGeo.translate(-0.325, 0, 0); 
  // Center along Z roughly
  bodyGeo.translate(0, 0, 0);

  const deviceBody = new THREE.Mesh(bodyGeo, bodyMat);
  // Rotate so it sits on Y=0 plane nicely if needed, but let's keep origin at center of mass roughly
  deviceBody.position.y = 0.05; // Lift slightly so bottom is near 0
  root.add(deviceBody);

  // Screen in Logical Space
  // Positioned on the slanted face.
  // Slanted face center approx: x=0, y=0.35, z=-0.05. Normal points up/back.
  const screenAssembly = new THREE.Group();
  const sbGeo = new THREE.BoxGeometry(0.35, 0.02, 0.24);
  const screenBezel = new THREE.Mesh(sbGeo, screenBezelMat);
  screenAssembly.add(screenBezel);
  
  const sdGeo = new THREE.PlaneGeometry(0.30, 0.20);
  const screenDisplay = new THREE.Mesh(sdGeo, screenDisplayMat);
  screenDisplay.position.z = 0.011;
  screenAssembly.add(screenDisplay);

  screenAssembly.position.set(0, 0.35, -0.05);
  screenAssembly.rotation.x = -0.6; // Tilt to match slope
  root.add(screenAssembly);

  // Keypad in Logical Space
  // Positioned on the flat lower top face.
  // Face center approx: x=0, y=0.15, z=0.2. Normal points +Y.
  const keypadAssembly = new THREE.Group();
  
  // Base plate
  const kpBaseGeo = new THREE.BoxGeometry(0.55, 0.01, 0.50);
  const kpBase = new THREE.Mesh(kpBaseGeo, new THREE.MeshStandardMaterial({color:0x333333, roughness:0.7}));
  kpBase.position.y = 0.005;
  keypadAssembly.add(kpBase);

  // Buttons
  function addBtn(m, x, z, r, h) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), m);
    b.rotation.x = Math.PI / 2;
    b.position.set(x, h/2 + 0.005, z);
    keypadAssembly.add(b);
  }

  // Left Red
  addBtn(btnRedMat, -0.20, 0.20, 0.028, 0.015);
  addBtn(btnRedMat, -0.20, 0.10, 0.028, 0.015);
  
  // Center Grid
  for(let r=0; r<4; r++) {
    for(let c=0; c<3; c++) {
      addBtn(btnDarkMat, -0.08 + c*0.055, 0.20 - r*0.055, 0.022, 0.012);
    }
  }

  // Right Green
  addBtn(btnGreenMat, 0.20, 0.20, 0.028, 0.015);
  addBtn(btnGreenMat, 0.20, 0.10, 0.028, 0.015);

  // LED
  const ledMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8), ledMat);
  ledMesh.rotation.x = Math.PI / 2;
  ledMesh.position.set(0.05, 0.008, -0.15);
  keypadAssembly.add(ledMesh);

  keypadAssembly.position.set(0, 0.15, 0.15);
  root.add(keypadAssembly);

  // Side Details (Right Side: x = 0.325)
  const sideGroup = new THREE.Group();
  
  // Vents (Horizontal slots)
  const ventMat = new THREE.MeshStandardMaterial({color:0x111111, roughness:0.8});
  for(let i=0; i<4; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.08), ventMat);
    v.position.set(0.326, 0.35 - i*0.04, -0.25);
    sideGroup.add(v);
  }

  // Ports (Square sockets)
  for(let i=0; i<3; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.04), portMat);
    p.position.set(0.326, 0.10, -0.25 + i*0.12 - 0.12);
    sideGroup.add(p);
    
    // Port Labels (Tiny raised text blocks simulation)
    const lbl = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.015, 0.03), bodyMat);
    lbl.position.set(0.326, 0.10, -0.25 + i*0.12 - 0.12 - 0.06);
    sideGroup.add(lbl);
  }
  
  root.add(sideGroup);

  // Screws (Front face, near bottom corners)
  const screwMat = new THREE.MeshStandardMaterial({color:0x555555, metalness:0.8, roughness:0.3});
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 6);
  
  const s1 = new THREE.Mesh(screwGeom, screwMat);
  s1.rotation.x = Math.PI / 2;
  s1.position.set(-0.30, 0.05, 0.30); // Front Left
  root.add(s1);

  const s2 = new THREE.Mesh(screwGeom, screwMat);
  s2.rotation.x = Math.PI / 2;
  s2.position.set(0.30, 0.05, 0.30); // Front Right
  root.add(s2);

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