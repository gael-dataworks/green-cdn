export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.6,
    metalness: 0.1,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4,
    metalness: 0.2,
  });

  // Procedural screen texture
  const screenData = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < 128 * 128; i++) {
    // Dark blue background
    screenData[i * 4] = 20;
    screenData[i * 4 + 1] = 30;
    screenData[i * 4 + 2] = 80;
    screenData[i * 4 + 3] = 255;
  }
  // Draw "text" lines
  for (let y = 10; y < 110; y += 12) {
    const lineLen = 60 + Math.floor((y % 30) * 2);
    for (let x = 10; x < 10 + lineLen; x++) {
      const idx = (y * 128 + x) * 4;
      screenData[idx] = 200;
      screenData[idx + 1] = 220;
      screenData[idx + 2] = 255;
    }
    // Orange bar at bottom
    if (y > 90) {
       for (let x = 10; x < 50; x++) {
        const idx = (y * 128 + x) * 4;
        screenData[idx] = 255;
        screenData[idx + 1] = 100;
        screenData[idx + 2] = 50;
       }
    }
  }
  const screenTex = new THREE.DataTexture(screenData, 128, 128, THREE.RGBAFormat);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.needsUpdate = true;

  const screenDisplayMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: screenTex,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x223366,
    emissiveIntensity: 0.2,
  });

  const btnRedMat = new THREE.MeshStandardMaterial({ color: 0x8b3a3a, roughness: 0.7, metalness: 0.0 });
  const btnGreenMat = new THREE.MeshStandardMaterial({ color: 0x3a8b5e, roughness: 0.7, metalness: 0.0 });
  const btnDarkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.1 });
  const btnBlueMat = new THREE.MeshStandardMaterial({ color: 0x3a5e8b, roughness: 0.7, metalness: 0.0 });
  
  const portMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.3 });
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.0 });
  const screwMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.6 });

  // --- Main Body ---
  // Profile in YZ plane, extruded along X
  // Front is +Z, Back is -Z, Up is +Y
  const bodyShape = new THREE.Shape();
  const depth = 0.55;
  const heightBack = 0.32;
  const heightFront = 0.14;
  const width = 0.75;

  bodyShape.moveTo(0, 0); // Front Bottom
  bodyShape.lineTo(0, -depth); // Back Bottom
  bodyShape.lineTo(heightBack, -depth); // Back Top
  bodyShape.lineTo(heightFront, 0); // Front Top (slanted)
  bodyShape.lineTo(0, 0); // Close

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the geometry
  bodyGeom.translate(-width / 2, 0, depth / 2);
  
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Screen Assembly ---
  // Positioned on the slanted top face
  // Calculate slant angle
  const slantAngle = Math.atan2(heightBack - heightFront, depth);
  const screenW = 0.35;
  const screenH = 0.22;
  const screenDepth = 0.01;
  
  // Bezel
  const bezelGeom = new THREE.BoxGeometry(screenW + 0.04, screenDepth, screenH + 0.04);
  const bezel = new THREE.Mesh(bezelGeom, screenBezelMat);
  // Position: Centered on X, Y at slant mid-height, Z at slant mid-depth
  // Slant mid point approx:
  const midY = heightFront + (heightBack - heightFront) / 2;
  const midZ = -depth / 2;
  
  bezel.position.set(0, midY + 0.02, midZ);
  bezel.rotation.x = -slantAngle;
  root.add(bezel);

  // Display
  const displayGeom = new THREE.PlaneGeometry(screenW, screenH);
  const display = new THREE.Mesh(displayGeom, screenDisplayMat);
  display.position.set(0, midY + 0.025, midZ - 0.001);
  display.rotation.x = -slantAngle;
  root.add(display);

  // --- Keypad ---
  const keypadGroup = new THREE.Group();
  keypadGroup.position.set(0, midY - 0.08, midZ + 0.05);
  keypadGroup.rotation.x = -slantAngle;
  root.add(keypadGroup);

  // Button helper
  function addBtn(x, z, r, h, mat) {
    const geom = new THREE.CylinderGeometry(r, r, h, 16);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = Math.PI / 2; // Flat on XZ plane relative to group
    mesh.position.set(x, 0, z);
    keypadGroup.add(mesh);
    return mesh;
  }

  // Left column (Red/Brown)
  addBtn(-0.28, -0.15, 0.035, 0.04, btnRedMat);
  addBtn(-0.28, -0.05, 0.035, 0.04, btnRedMat);

  // Right column (Green/Blue)
  addBtn(0.28, -0.15, 0.035, 0.04, btnGreenMat);
  addBtn(0.28, -0.05, 0.035, 0.04, btnBlueMat);

  // Middle Grid (Small dark buttons)
  // 4 rows, 3 cols approx
  const startX = -0.14;
  const startZ = -0.12;
  const gapX = 0.07;
  const gapZ = 0.05;
  
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      // Skip some to match layout (looks like 3x4 grid but shifted)
      // Let's just place a dense grid
      const bx = startX + c * gapX;
      const bz = startZ + r * gapZ;
      // Offset slightly to avoid overlapping large buttons
      if (r === 3 && c === 0) continue; 
      if (r === 3 && c === 2) continue;
      
      addBtn(bx, bz, 0.022, 0.03, btnDarkMat);
    }
  }
  
  // Small LED
  const ledGeom = new THREE.CircleGeometry(0.015, 16);
  const led = new THREE.Mesh(ledGeom, new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }));
  led.rotation.x = Math.PI / 2;
  led.position.set(-0.1, 0, 0.15);
  keypadGroup.add(led);


  // --- Side Details (Right Side, +X) ---
  // We need to attach these to the body or position them in world space relative to body
  // Body width is 0.75, so right face is at x = 0.375
  
  const sideX = width / 2 + 0.015; // Slightly offset to avoid z-fighting

  // Vents (Top right)
  const ventGroup = new THREE.Group();
  ventGroup.position.set(sideX, heightBack - 0.08, -depth * 0.6);
  
  for (let i = 0; i < 5; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.08), ventMat);
    vent.position.y = -i * 0.015;
    ventGroup.add(vent);
  }
  root.add(ventGroup);

  // Ports (Bottom right)
  const portGroup = new THREE.Group();
  portGroup.position.set(sideX, 0.08, -depth * 0.6);
  
  for (let i = 0; i < 3; i++) {
    // Port frame
    const portFrame = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.05), portMat);
    portFrame.position.z = i * 0.07;
    portGroup.add(portFrame);
    
    // Inner hole
    const portHole = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.035, 0.035), new THREE.MeshStandardMaterial({color: 0x000000}));
    portHole.position.z = i * 0.07;
    portGroup.add(portHole);
  }
  root.add(portGroup);
  
  // Text labels near ports (simulated with tiny boxes)
  // Skipping complex text geometry for brevity, relying on ports to convey function

  // --- Screw (Front Bottom Left) ---
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 6), screwMat);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(-width/2 + 0.05, 0.03, 0.05);
  root.add(screw);

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