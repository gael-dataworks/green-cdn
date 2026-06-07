export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.0,
    roughness: 0.85,
  });

  const screenBezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  const btnDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const btnRedMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a3a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const btnGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b4a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const btnTealMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b8b,
    metalness: 0.0,
    roughness: 0.9,
  });

  const btnOrangeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a3a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Screen Texture (Procedural DataTexture) ---
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Gradient background (Dark Blue to Purple)
      const t = y / H;
      const r = Math.floor(20 + 40 * t);
      const g = Math.floor(30 + 20 * t);
      const b = Math.floor(60 + 60 * t);
      
      // Text lines (White)
      let isText = false;
      if (y > 20 && y < 200) {
        const lineIdx = Math.floor((y - 20) / 14);
        if (lineIdx % 2 === 0) { // Every other line
           // Simulate code blocks
           if (x > 20 && x < 200 && (x % 10 < 6)) isText = true;
        }
      }
      
      // Orange status bar at bottom
      if (y > 230) {
        data[idx] = 200; data[idx+1] = 100; data[idx+2] = 50; data[idx+3] = 255;
        continue;
      }

      if (isText) {
        data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
      } else {
        data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
      }
    }
  }
  const screenTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.needsUpdate = true;
  
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x222244,
    emissiveIntensity: 0.5,
  });

  // --- Dimensions ---
  const width = 0.50;
  const depth = 0.30;
  const baseH = 0.10;
  const topH = 0.28;
  const tiltAngle = -0.35; // Radians

  // --- Chassis ---
  // Base Block
  const baseGeom = new THREE.BoxGeometry(width, baseH, depth);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = baseH / 2;
  root.add(base);

  // Top Angled Block
  const topGeom = new THREE.BoxGeometry(width, topH, depth * 0.85);
  const topBody = new THREE.Mesh(topGeom, bodyMat);
  topBody.position.set(0, baseH + topH / 2, -0.02); // Slight offset back
  topBody.rotation.x = tiltAngle;
  root.add(topBody);

  // --- Screen Assembly ---
  const screenW = 0.32;
  const screenH = 0.18;
  const screenD = 0.02;
  
  // Bezel
  const bezelGeom = new THREE.BoxGeometry(screenW, screenH, screenD);
  const bezel = new THREE.Mesh(bezelGeom, screenBezelMat);
  // Position on the tilted face. Local Y of topBody is the normal.
  // topH/2 is the surface.
  bezel.position.set(0, topH / 2 + screenD / 2, 0.04); 
  topBody.add(bezel);

  // Display
  const displayGeom = new THREE.PlaneGeometry(screenW * 0.92, screenH * 0.92);
  const display = new THREE.Mesh(displayGeom, screenMat);
  display.position.z = screenD / 2 + 0.001;
  bezel.add(display);

  // --- Keypad ---
  const btnRadius = 0.022;
  const btnHeight = 0.015;
  const btnGeom = new THREE.CylinderGeometry(btnRadius, btnRadius, btnHeight, 16);
  // Rotate cylinder to stand up on the tilted face (default cylinder is Y-up, face is tilted X)
  // Actually, if we add buttons to topBody, and topBody is tilted, we want buttons to be perpendicular to the face.
  // Default Cylinder is Y-up. TopBody local Y is perpendicular to the face. So no extra rotation needed for the cylinder itself relative to parent.
  
  const btnY = topH / 2 + btnHeight / 2;

  // Helper to add button to topBody
  function addBtn(x, z, mat) {
    const btn = new THREE.Mesh(btnGeom, mat);
    btn.position.set(x, btnY, z);
    topBody.add(btn);
    return btn;
  }

  // Top Row (4 small)
  const topRowZ = 0.08;
  addBtn(-0.12, topRowZ, btnOrangeMat);
  addBtn(-0.04, topRowZ, btnDarkMat);
  addBtn(0.04, topRowZ, btnDarkMat);
  addBtn(0.12, topRowZ, btnDarkMat);

  // Main Grid (3 rows x 4 cols approx)
  const gridStartZ = 0.02;
  const gridStepZ = 0.035;
  const gridStepX = 0.05;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = -0.075 + c * gridStepX;
      const z = gridStartZ - r * gridStepZ;
      addBtn(x, z, btnDarkMat);
    }
  }

  // Bottom Large Buttons
  const botRowZ = -0.08;
  addBtn(-0.12, botRowZ, btnRedMat);    // Red
  addBtn(0.00, botRowZ, btnTealMat);    // Teal
  addBtn(0.12, botRowZ, btnGreenMat);   // Green

  // Small LED indicator
  const ledGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.005, 8);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
  const led = new THREE.Mesh(ledGeom, ledMat);
  led.position.set(0.06, btnY, -0.12);
  topBody.add(led);

  // --- Side Details (Right Side: +X) ---
  // We need to attach these to the root or base to avoid the tilt affecting their orientation relative to world
  // But they are on the side of the device. The device side is vertical.
  // The topBody tilt might distort the side face if we just use one box.
  // To be precise, let's assume the side face is composed of the base side and the top side.
  // Since topBody is tilted, its side face is also tilted.
  // The reference shows vents on the upper rear part (tilted section side) and ports on the lower part (base section side).
  
  const sideX = width / 2 + 0.001;

  // Vents (on tilted top part side)
  // We need to calculate world positions or add to topBody.
  // If added to topBody, they tilt with it. The vents in the image look horizontal relative to the device body, 
  // but since the top is tilted, the vents on the side of the top part will also be tilted.
  // Let's add them to topBody.
  const ventW = 0.04, ventH = 0.008, ventD = 0.005;
  const ventGeom = new THREE.BoxGeometry(ventD, ventH, ventW); // D is thickness (X), H is height (Y), W is width (Z)
  // Wait, on the side face (X plane), the normal is X. So thickness is X.
  // Vents are horizontal slits. So they are long in Z, short in Y.
  
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(ventGeom, portMat);
    // Position on topBody side: x = width/2, y = some height, z = some depth
    // topBody local coords: x is width, y is thickness of top block, z is depth.
    // Side face is at x = width/2.
    vent.position.set(width / 2 + ventD / 2, 0.15, -0.05 + i * 0.025);
    topBody.add(vent);
  }

  // Ports (on base side)
  // 3 rectangular ports.
  const portW = 0.04, portH = 0.025, portD = 0.01;
  const portGeom = new THREE.BoxGeometry(portD, portH, portW);
  for (let i = 0; i < 3; i++) {
    const port = new THREE.Mesh(portGeom, portMat);
    // Base side is vertical.
    // x = width/2, y = low, z = distributed
    port.position.set(width / 2 + portD / 2, 0.05, -0.08 + i * 0.06);
    root.add(port); // Add to root because base is not tilted
  }

  // Side Screws (small details)
  const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 6);
  const screwMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 });
  const screw1 = new THREE.Mesh(screwGeom, screwMat);
  screw1.rotation.x = Math.PI / 2;
  screw1.position.set(width / 2 + 0.003, 0.05, 0.12);
  root.add(screw1);
  
  const screw2 = new THREE.Mesh(screwGeom, screwMat);
  screw2.rotation.x = Math.PI / 2;
  screw2.position.set(width / 2 + 0.003, 0.05, -0.12);
  root.add(screw2);

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