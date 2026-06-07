export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stainless Steel (Brushed) - Capped metalness at 0.6 per rules
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Black Plastic (Matte)
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Dark Base Plastic
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Procedural Control Panel Texture ---
  // Required for the digital display "3:58" and buttons
  const panelWidth = 256;
  const panelHeight = 128;
  const panelData = new Uint8Array(panelWidth * panelHeight * 4);

  // Helper to draw a filled rect on the texture data
  function drawRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (px >= 0 && px < panelWidth && py >= 0 && py < panelHeight) {
          const idx = (py * panelWidth + px) * 4;
          panelData[idx] = r;
          panelData[idx + 1] = g;
          panelData[idx + 2] = b;
          panelData[idx + 3] = a;
        }
      }
    }
  }

  // Helper to draw a circle
  function drawCircle(cx, cy, radius, r, g, b) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          drawRect(cx + x, cy + y, 1, 1, r, g, b);
        }
      }
    }
  }

  // Background: Dark Gray/Black Panel
  for (let i = 0; i < panelData.length; i += 4) {
    panelData[i] = 20;
    panelData[i + 1] = 20;
    panelData[i + 2] = 25;
    panelData[i + 3] = 255;
  }

  // Draw Green Digits "3:58" (Blocky 7-segment style approximation)
  const digitColor = [0, 255, 100]; // Bright Green
  const digitH = 40;
  const digitW = 24;
  const startY = 44;
  
  // Digit 1 (3)
  drawRect(40, startY, digitW, 6, ...digitColor); // Top
  drawRect(64, startY, 6, digitH / 2, ...digitColor); // Top Right
  drawRect(40, startY + digitH / 2, digitW, 6, ...digitColor); // Mid
  drawRect(64, startY + digitH / 2, 6, digitH / 2, ...digitColor); // Bot Right
  drawRect(40, startY + digitH - 6, digitW, 6, ...digitColor); // Bot

  // Colon
  drawCircle(80, startY + digitH / 2, 4, ...digitColor);
  drawCircle(80, startY + digitH / 2 + 12, 4, ...digitColor);

  // Digit 2 (5)
  drawRect(95, startY, digitW, 6, ...digitColor); // Top
  drawRect(95, startY, 6, digitH / 2, ...digitColor); // Top Left
  drawRect(95, startY + digitH / 2, digitW, 6, ...digitColor); // Mid
  drawRect(95 + digitW - 6, startY + digitH / 2, 6, digitH / 2, ...digitColor); // Bot Right
  drawRect(95, startY + digitH - 6, digitW, 6, ...digitColor); // Bot

  // Digit 3 (8)
  const x3 = 130;
  drawRect(x3, startY, digitW, 6, ...digitColor); // Top
  drawRect(x3, startY, 6, digitH / 2, ...digitColor); // Top Left
  drawRect(x3 + digitW - 6, startY, 6, digitH / 2, ...digitColor); // Top Right
  drawRect(x3, startY + digitH / 2, digitW, 6, ...digitColor); // Mid
  drawRect(x3, startY + digitH / 2, 6, digitH / 2, ...digitColor); // Bot Left
  drawRect(x3 + digitW - 6, startY + digitH / 2, 6, digitH / 2, ...digitColor); // Bot Right
  drawRect(x3, startY + digitH - 6, digitW, 6, ...digitColor); // Bot

  // Buttons/Icons (Red and Blue circles)
  drawCircle(30, 100, 8, 255, 50, 50); // Red button left
  drawCircle(226, 100, 8, 50, 150, 255); // Blue button right

  const panelTexture = new THREE.DataTexture(panelData, panelWidth, panelHeight, THREE.RGBAFormat);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.needsUpdate = true;

  const panelMat = new THREE.MeshStandardMaterial({
    map: panelTexture,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Geometry Construction ---

  // 1. Base
  const baseGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 32);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -0.25;
  root.add(base);

  // 2. Main Body
  // Slightly tapered cylinder for the pot
  const bodyGeom = new THREE.CylinderGeometry(0.25, 0.255, 0.45, 32);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = -0.025;
  root.add(body);

  // 3. Lid (Domed)
  // Profile from center outwards to rim
  const lidProfile = [
    new THREE.Vector2(0.0, 0.25),   // Center top
    new THREE.Vector2(0.08, 0.25),  // Flat top section
    new THREE.Vector2(0.12, 0.23),  // Start curve down
    new THREE.Vector2(0.20, 0.18),  // Mid curve
    new THREE.Vector2(0.24, 0.10),  // Lower curve
    new THREE.Vector2(0.26, 0.05),  // Rim lip
    new THREE.Vector2(0.26, 0.00),  // Rim bottom
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  lid.position.y = 0.225;
  root.add(lid);

  // 4. Lid Handle Assembly
  const handleGroup = new THREE.Group();
  
  // Stem
  const stemGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16);
  const stem = new THREE.Mesh(stemGeom, plasticMat);
  stem.position.y = 0.03;
  handleGroup.add(stem);

  // Grip (Flattened Sphere/Capsule shape)
  const gripGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const grip = new THREE.Mesh(gripGeom, plasticMat);
  grip.scale.set(1.4, 0.6, 1.4);
  grip.position.y = 0.08;
  handleGroup.add(grip);

  handleGroup.position.y = 0.25; // On top of lid
  root.add(handleGroup);

  // 5. Pressure Valve (Small nub on lid)
  const valveGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12);
  const valve = new THREE.Mesh(valveGeom, steelMat);
  valve.position.set(0.12, 0.225 + 0.015, 0.0); // Offset from center
  root.add(valve);

  // 6. Side Handles (Left and Right)
  // Using Extrude for a clean D-shape loop
  const handleShape = new THREE.Shape();
  // Outer D
  handleShape.moveTo(-0.02, -0.06);
  handleShape.lineTo(-0.02, 0.06);
  handleShape.absarc(0, 0.06, 0.02, Math.PI, 0, false);
  handleShape.lineTo(0.02, -0.06);
  handleShape.absarc(0, -0.06, 0.02, 0, Math.PI, false);
  
  // Inner hole (counter-clockwise)
  const holePath = new THREE.Path();
  holePath.moveTo(-0.01, -0.05);
  holePath.lineTo(-0.01, 0.05);
  holePath.absarc(0, 0.05, 0.01, Math.PI, 0, false);
  holePath.lineTo(0.01, -0.05);
  holePath.absarc(0, -0.05, 0.01, 0, Math.PI, false);
  handleShape.holes.push(holePath);

  const handleExtrudeSettings = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 };
  const sideHandleGeom = new THREE.ExtrudeGeometry(handleShape, handleExtrudeSettings);
  
  // Right Handle
  const rightHandle = new THREE.Mesh(sideHandleGeom, plasticMat);
  rightHandle.position.set(0.26, 0.15, 0.0);
  rightHandle.rotation.y = Math.PI / 2;
  root.add(rightHandle);

  // Left Handle
  const leftHandle = new THREE.Mesh(sideHandleGeom, plasticMat);
  leftHandle.position.set(-0.26, 0.15, 0.0);
  leftHandle.rotation.y = -Math.PI / 2;
  root.add(leftHandle);

  // 7. Control Panel (On the lid slope)
  // Create a slightly curved plane or flattened box to sit on the lid
  const panelGeom = new THREE.PlaneGeometry(0.14, 0.07);
  const controlPanel = new THREE.Mesh(panelGeom, panelMat);
  
  // Position on the front slope of the lid
  // Approximate position based on lid profile
  controlPanel.position.set(0, 0.24, 0.21); 
  controlPanel.rotation.x = -0.4; // Tilt to match lid slope
  root.add(controlPanel);


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