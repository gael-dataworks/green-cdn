export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed Stainless Steel
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Black Plastic (Handles, Base, Knob)
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Dark Grey Plastic (Base rim variation)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Control Panel Background
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bodyRadius = 0.35;
  const bodyHeight = 0.55;
  const baseHeight = 0.08;
  const lidHeight = 0.14;
  const lidRadius = bodyRadius + 0.01; // Slight overhang

  // --- 1. Base ---
  // Rounded bottom cap
  const baseGeom = new THREE.SphereGeometry(bodyRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.scale.set(1, 0.4, 1); // Flatten sphere
  base.position.y = -bodyHeight / 2 - baseHeight * 0.5; 
  // Adjust position so flat top is at -bodyHeight/2
  base.position.y = -bodyHeight / 2; 
  root.add(base);

  // --- 2. Main Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = 0;
  root.add(body);

  // --- 3. Lid ---
  // Domed lid
  const lidGeom = new THREE.SphereGeometry(lidRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  lid.scale.set(1, 0.6, 1);
  lid.position.y = bodyHeight / 2;
  root.add(lid);

  // Lid Rim (thin cylinder under the dome for detail)
  const lidRimGeom = new THREE.CylinderGeometry(lidRadius, lidRadius, 0.02, 32);
  const lidRim = new THREE.Mesh(lidRimGeom, steelMat);
  lidRim.position.y = bodyHeight / 2 - 0.01;
  root.add(lidRim);

  // --- 4. Lid Knob ---
  const knobStemGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
  const knobStem = new THREE.Mesh(knobStemGeom, plasticMat);
  knobStem.position.y = bodyHeight / 2 + lidHeight * 0.6;
  root.add(knobStem);

  const knobTopGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16);
  const knobTop = new THREE.Mesh(knobTopGeom, plasticMat);
  knobTop.position.y = bodyHeight / 2 + lidHeight * 0.6 + 0.03;
  root.add(knobTop);

  // --- 5. Side Handles ---
  function createSideHandle(side) {
    const handleGroup = new THREE.Group();
    
    // Main loop (Torus)
    const loopGeom = new THREE.TorusGeometry(0.09, 0.025, 16, 24, Math.PI);
    const loop = new THREE.Mesh(loopGeom, plasticMat);
    loop.rotation.z = Math.PI / 2; // Open downwards
    loop.position.y = bodyHeight / 2 - 0.05;
    handleGroup.add(loop);

    // Attachment points (cylinders connecting to body)
    const attachGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12);
    const attach1 = new THREE.Mesh(attachGeom, plasticMat);
    attach1.rotation.x = Math.PI / 2;
    attach1.position.set(0, bodyHeight / 2 - 0.05, 0.09);
    handleGroup.add(attach1);

    const attach2 = new THREE.Mesh(attachGeom, plasticMat);
    attach2.rotation.x = Math.PI / 2;
    attach2.position.set(0, bodyHeight / 2 - 0.05, -0.09);
    handleGroup.add(attach2);

    // Position on side
    handleGroup.position.set(side * (bodyRadius + 0.02), 0, 0);
    // Rotate handle to face outwards
    handleGroup.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
    
    root.add(handleGroup);
  }

  createSideHandle(-1); // Left
  createSideHandle(1);  // Right

  // --- 6. Control Panel (Procedural Texture) ---
  // Create texture for the display
  const texWidth = 256;
  const texHeight = 128;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill background (dark grey)
  for (let i = 0; i < texWidth * texHeight; i++) {
    data[i * 4 + 0] = 30;
    data[i * 4 + 1] = 30;
    data[i * 4 + 2] = 35;
    data[i * 4 + 3] = 255;
  }

  // Helper to draw rect
  function drawRect(x, y, w, h, r, g, b, a) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < texWidth && py >= 0 && py < texHeight) {
          const idx = (py * texWidth + px) * 4;
          data[idx + 0] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  // Draw "3:58" (Green digits approximation)
  // Simple blocky font simulation
  const digitColor = [0, 255, 100]; 
  const startX = 80;
  const startY = 40;
  const segW = 12;
  const segH = 4;
  const gap = 6;

  // Digit 3
  drawRect(startX, startY, segW, segH, ...digitColor, 255); // Top
  drawRect(startX + segW - segH, startY, segH, segH * 2.5, ...digitColor, 255); // Top Right
  drawRect(startX, startY + segH * 2.5, segW, segH, ...digitColor, 255); // Mid
  drawRect(startX + segW - segH, startY + segH * 2.5, segH, segH * 2.5, ...digitColor, 255); // Bot Right
  drawRect(startX, startY + segH * 5, segW, segH, ...digitColor, 255); // Bot

  // Colon
  drawRect(startX + segW + gap + 2, startY + segH * 1.5, 4, 4, ...digitColor, 255);
  drawRect(startX + segW + gap + 2, startY + segH * 3.5, 4, 4, ...digitColor, 255);

  // Digit 5
  const x5 = startX + segW + gap + 15;
  drawRect(x5, startY, segW, segH, ...digitColor, 255); // Top
  drawRect(x5, startY, segH, segH * 2.5, ...digitColor, 255); // Top Left
  drawRect(x5, startY + segH * 2.5, segW, segH, ...digitColor, 255); // Mid
  drawRect(x5 + segW - segH, startY + segH * 2.5, segH, segH * 2.5, ...digitColor, 255); // Bot Right
  drawRect(x5, startY + segH * 5, segW, segH, ...digitColor, 255); // Bot

  // Digit 8
  const x8 = x5 + segW + gap;
  drawRect(x8, startY, segW, segH, ...digitColor, 255);
  drawRect(x8, startY, segH, segH * 2.5, ...digitColor, 255);
  drawRect(x8 + segW - segH, startY, segH, segH * 2.5, ...digitColor, 255);
  drawRect(x8, startY + segH * 2.5, segW, segH, ...digitColor, 255);
  drawRect(x8, startY + segH * 2.5, segH, segH * 2.5, ...digitColor, 255);
  drawRect(x8 + segW - segH, startY + segH * 2.5, segH, segH * 2.5, ...digitColor, 255);
  drawRect(x8, startY + segH * 5, segW, segH, ...digitColor, 255);

  // Buttons (White circles)
  const btnColor = [200, 200, 200];
  function drawBtn(cx, cy, r) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x*x + y*y <= r*r) {
           const px = cx + x;
           const py = cy + y;
           if (px >= 0 && px < texWidth && py >= 0 && py < texHeight) {
             const idx = (py * texWidth + px) * 4;
             data[idx + 0] = btnColor[0];
             data[idx + 1] = btnColor[1];
             data[idx + 2] = btnColor[2];
             data[idx + 3] = 255;
           }
        }
      }
    }
  }
  // Left buttons
  drawBtn(40, 50, 8);
  drawBtn(40, 80, 8);
  // Right buttons
  drawBtn(216, 50, 8);
  drawBtn(216, 80, 8);

  const panelTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.needsUpdate = true;

  const panelMatWithMap = new THREE.MeshStandardMaterial({
    map: panelTexture,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Panel Geometry (Flattened Sphere segment or Plane)
  // Using a slightly curved plane to match lid curvature
  const panelGeom = new THREE.PlaneGeometry(0.18, 0.09);
  const panel = new THREE.Mesh(panelGeom, panelMatWithMap);
  
  // Position on front of lid
  const panelY = bodyHeight / 2 + lidHeight * 0.4;
  const panelZ = Math.sqrt(lidRadius * lidRadius - 0.05 * 0.05); // Approx projection
  panel.position.set(0, panelY, lidRadius - 0.01);
  
  // Rotate to face forward and match curve
  panel.rotation.x = -0.4; 
  root.add(panel);

  // --- 7. Steam Valve ---
  const valveBaseGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12);
  const valveBase = new THREE.Mesh(valveBaseGeom, steelMat);
  valveBase.position.set(0.08, bodyHeight / 2 + lidHeight * 0.7, -0.1);
  valveBase.rotation.x = 0.2;
  root.add(valveBase);

  const valveTopGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12);
  const valveTop = new THREE.Mesh(valveTopGeom, plasticMat);
  valveTop.position.copy(valveBase.position);
  valveTop.y += 0.03;
  valveTop.rotation.x = 0.2;
  root.add(valveTop);

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