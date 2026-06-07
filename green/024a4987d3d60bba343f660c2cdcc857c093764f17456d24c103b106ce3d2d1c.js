export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const bodyRadius = 0.35;
  const bodyHeight = 0.55;
  const baseHeight = 0.08;
  const lidHeight = 0.14;
  const handleOffset = 0.38;
  const handleWidth = 0.06;
  const handleDepth = 0.12;

  // --- Materials ---
  // Brushed Stainless Steel (Body/Lid)
  // Metalness capped at 0.6 per rules. Color carries the silver shade.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Dark Base (Plastic/Rubber)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Black Plastic (Handles/Knob)
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Control Panel Surface (Glossy Black)
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Helper: Procedural Display Texture ---
  function createDisplayTexture() {
    const width = 256;
    const height = 128;
    const data = new Uint8Array(width * height * 4);
    
    // Fill background (dark gray/black)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 20;     // R
      data[i + 1] = 20; // G
      data[i + 2] = 25; // B
      data[i + 3] = 255; // A
    }

    // Helper to draw a filled rect
    function drawRect(x, y, w, h, r, g, b) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const idx = (iy * width + ix) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    // Draw "3:58" in green (7-segment style approximation)
    const digitColor = [50, 255, 50];
    const segW = 12;
    const segH = 4;
    const digitW = 30;
    const digitH = 50;
    const startX = 80;
    const startY = 40;

    // Simplified digit drawing (just blocks for now to ensure visibility)
    // 3
    drawRect(startX, startY, digitW, segH, ...digitColor); // Top
    drawRect(startX + digitW - segW, startY, segW, digitH / 2, ...digitColor); // Top Right
    drawRect(startX, startY + digitH / 2 - segH/2, digitW, segH, ...digitColor); // Mid
    drawRect(startX + digitW - segW, startY + digitH / 2, segW, digitH / 2, ...digitColor); // Bot Right
    drawRect(startX, startY + digitH - segH, digitW, segH, ...digitColor); // Bot

    // :
    drawRect(startX + digitW + 5, startY + 10, 6, 6, ...digitColor);
    drawRect(startX + digitW + 5, startY + 34, 6, 6, ...digitColor);

    // 5
    const x2 = startX + digitW + 20;
    drawRect(x2, startY, digitW, segH, ...digitColor); // Top
    drawRect(x2, startY, segW, digitH / 2, ...digitColor); // Top Left
    drawRect(x2, startY + digitH / 2 - segH/2, digitW, segH, ...digitColor); // Mid
    drawRect(x2 + digitW - segW, startY + digitH / 2, segW, digitH / 2, ...digitColor); // Bot Right
    drawRect(x2, startY + digitH - segH, digitW, segH, ...digitColor); // Bot

    // 8
    const x3 = x2 + digitW + 10;
    drawRect(x3, startY, digitW, segH, ...digitColor); // Top
    drawRect(x3, startY, segW, digitH / 2, ...digitColor); // Top Left
    drawRect(x3 + digitW - segW, startY, segW, digitH / 2, ...digitColor); // Top Right
    drawRect(x3, startY + digitH / 2 - segH/2, digitW, segH, ...digitColor); // Mid
    drawRect(x3, startY + digitH / 2, segW, digitH / 2, ...digitColor); // Bot Left
    drawRect(x3 + digitW - segW, startY + digitH / 2, segW, digitH / 2, ...digitColor); // Bot Right
    drawRect(x3, startY + digitH - segH, digitW, segH, ...digitColor); // Bot

    // Icons (Red Power, Blue Settings)
    // Red Circle Left
    for (let y = 10; y < 40; y++) {
      for (let x = 20; x < 50; x++) {
        const dx = x - 35;
        const dy = y - 25;
        if (dx*dx + dy*dy < 100) {
          const idx = (y * width + x) * 4;
          data[idx] = 255; data[idx+1] = 50; data[idx+2] = 50;
        }
      }
    }
    // Blue Circle Right
    for (let y = 10; y < 40; y++) {
      for (let x = 200; x < 230; x++) {
        const dx = x - 215;
        const dy = y - 25;
        if (dx*dx + dy*dy < 100) {
          const idx = (y * width + x) * 4;
          data[idx] = 50; data[idx+1] = 50; data[idx+2] = 255;
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const displayTexture = createDisplayTexture();
  const displayMat = new THREE.MeshStandardMaterial({
    map: displayTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x111111,
    emissiveMap: displayTexture,
    emissiveIntensity: 0.5
  });

  // --- Geometry Construction ---

  // 1. Base (Dark bottom section)
  const baseGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.95, baseHeight, 32);
  // Round the bottom edge slightly by scaling or just accept cylinder
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -bodyHeight / 2 - baseHeight / 2;
  root.add(base);

  // 2. Main Body (Stainless Steel Cylinder)
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = -baseHeight / 2; // Sit on top of base
  root.add(body);

  // 3. Lid (Domed Top)
  // Use Lathe for smooth dome profile
  const lidProfile = [
    new THREE.Vector2(0, 0),                  // Center Top
    new THREE.Vector2(0.12, 0),               // Knob base start
    new THREE.Vector2(0.12, 0.02),            // Knob base end
    new THREE.Vector2(0.0, 0.02),             // Knob stem top (gap)
    
    // Actual Lid Dome Profile (relative to lid center)
    new THREE.Vector2(0.0, lidHeight),        // Top Center
    new THREE.Vector2(0.25, lidHeight * 0.8), // Dome curve start
    new THREE.Vector2(bodyRadius + 0.02, 0.02), // Lip overhang
    new THREE.Vector2(bodyRadius + 0.02, 0.0),  // Lip bottom
    new THREE.Vector2(bodyRadius - 0.02, 0.0)   // Inner rim
  ];
  
  // Re-doing lid profile to be cleaner: Outer shell
  const lidPoints = [
    new THREE.Vector2(0, lidHeight),          // Top Center
    new THREE.Vector2(0.20, lidHeight),       // Flat top
    new THREE.Vector2(bodyRadius + 0.03, 0.05), // Curved edge
    new THREE.Vector2(bodyRadius + 0.03, 0.0),  // Bottom of lip
    new THREE.Vector2(bodyRadius - 0.01, 0.0)   // Inner seal
  ];
  
  const lidGeom = new THREE.LatheGeometry(lidPoints, 32);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  lid.position.y = bodyHeight / 2;
  root.add(lid);

  // 4. Handles (Left & Right)
  // Shape: Thick loop attached to side. Using Torus segment or Tube.
  // Let's use a Torus cut in half for the main loop, and boxes for attachment.
  const handleRadius = 0.08;
  const handleTube = 0.025;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 24, Math.PI);
  
  function createHandle(side) {
    const group = new THREE.Group();
    
    // Main Loop
    const loop = new THREE.Mesh(handleGeom, blackPlasticMat);
    // Torus is in XY plane. We want it in YZ plane facing X.
    loop.rotation.y = Math.PI / 2; 
    // Rotate to make the open part face the body
    loop.rotation.z = Math.PI; 
    loop.position.set(0, 0, 0);
    group.add(loop);

    // Attachment Bracket (Box connecting loop to body)
    const bracketGeom = new THREE.BoxGeometry(0.04, 0.12, 0.06);
    const bracket = new THREE.Mesh(bracketGeom, blackPlasticMat);
    bracket.position.set(0, -0.02, 0); // Connect to bottom of loop
    group.add(bracket);

    // Position relative to body
    const x = side * (bodyRadius + 0.05);
    const y = bodyHeight / 2 - 0.1; // Slightly below lid
    group.position.set(x, y, 0);
    
    // Rotate handle to face out
    group.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
    
    return group;
  }

  const leftHandle = createHandle(-1);
  const rightHandle = createHandle(1);
  root.add(leftHandle);
  root.add(rightHandle);

  // 5. Control Panel (On Lid Front)
  // Oval shape inset on the lid
  const panelWidth = 0.22;
  const panelHeight = 0.08;
  const panelGeom = new THREE.CircleGeometry(panelWidth / 2, 32);
  panelGeom.scale(1, panelHeight / panelWidth, 1); // Make oval
  
  const panel = new THREE.Mesh(panelGeom, displayMat);
  // Position on the front of the lid, angled to face user
  const panelY = bodyHeight / 2 + 0.06;
  const panelZ = Math.sqrt(Math.pow(bodyRadius, 2) - Math.pow(panelWidth/2, 2)) - 0.02;
  
  panel.position.set(0, panelY, panelZ * 0.9); // Slightly forward
  // Tilt it up to match lid curvature roughly
  panel.rotation.x = -0.4; 
  root.add(panel);

  // 6. Knob / Valve Assembly (Top Center)
  const knobBaseH = 0.04;
  const knobBaseR = 0.06;
  const knobTopH = 0.05;
  const knobTopR = 0.08;

  const knobBaseGeom = new THREE.CylinderGeometry(knobBaseR, knobBaseR, knobBaseH, 16);
  const knobBase = new THREE.Mesh(knobBaseGeom, blackPlasticMat);
  knobBase.position.y = lidHeight + knobBaseH / 2;
  root.add(knobBase);

  const knobTopGeom = new THREE.CylinderGeometry(knobTopR, knobTopR * 0.9, knobTopH, 16);
  const knobTop = new THREE.Mesh(knobTopGeom, blackPlasticMat);
  knobTop.position.y = lidHeight + knobBaseH + knobTopH / 2;
  root.add(knobTop);
  
  // Small silver button near knob
  const buttonGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 16);
  const button = new THREE.Mesh(buttonGeom, steelMat);
  button.position.set(0.08, lidHeight + 0.01, 0);
  root.add(button);

  // 7. Seam Detail (Gap between lid and body)
  // A thin dark ring
  const seamGeom = new THREE.TorusGeometry(bodyRadius + 0.01, 0.005, 16, 64);
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.0, roughness: 0.5 });
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = bodyHeight / 2 - 0.01;
  root.add(seam);

  // Normalize
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