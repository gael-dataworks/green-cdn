export default function generate(THREE) {
  const root = new THREE.Group();

  // Dimensions
  const bodyW = 0.42;
  const bodyD = 0.55;
  const bodyH = 0.22;
  const slopeAngle = Math.PI / 10;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a40,
    metalness: 0.0,
    roughness: 0.65,
  });

  const screenFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a20,
    metalness: 0.0,
    roughness: 0.5,
  });

  const buttonGrayMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a30,
    metalness: 0.0,
    roughness: 0.7,
  });

  const buttonRedMat = new THREE.MeshStandardMaterial({
    color: 0x8b3a3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const buttonGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b5a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const buttonOrangeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x151518,
    metalness: 0.0,
    roughness: 0.8,
  });

  const ventMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c,
    metalness: 0.0,
    roughness: 0.9,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x5a5a60,
    metalness: 0.3,
    roughness: 0.5,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x3a8b3a,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0x3a8b3a,
    emissiveIntensity: 0.5,
  });

  // Procedural screen texture with colorful display content
  const screenW = 128;
  const screenH = 80;
  const screenData = new Uint8Array(screenW * screenH * 4);
  
  for (let y = 0; y < screenH; y++) {
    for (let x = 0; x < screenW; x++) {
      const idx = (y * screenW + x) * 4;
      
      // Gradient background: purple to blue
      const t = y / screenH;
      const r = Math.floor(60 + 80 * Math.sin(t * Math.PI));
      const g = Math.floor(40 + 60 * t);
      const b = Math.floor(120 + 80 * t);
      
      // Add some "text" lines
      const lineSpacing = 8;
      const isTextLine = (y % lineSpacing) < 5 && y > 10 && y < screenH - 15;
      const textX = (x + Math.floor(y / 3)) % 12;
      const isText = isTextLine && textX < 8;
      
      if (isText) {
        screenData[idx] = 200;
        screenData[idx + 1] = 220;
        screenData[idx + 2] = 255;
      } else {
        screenData[idx] = r;
        screenData[idx + 1] = g;
        screenData[idx + 2] = b;
      }
      screenData[idx + 3] = 255;
    }
  }
  
  // Add orange bar at bottom
  for (let y = screenH - 12; y < screenH - 4; y++) {
    for (let x = 8; x < 40; x++) {
      const idx = (y * screenW + x) * 4;
      screenData[idx] = 220;
      screenData[idx + 1] = 100;
      screenData[idx + 2] = 60;
    }
  }

  const screenTexture = new THREE.DataTexture(screenData, screenW, screenH, THREE.RGBAFormat);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.needsUpdate = true;

  const screenDisplayMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    metalness: 0.0,
    roughness: 0.3,
    emissive: 0x404060,
    emissiveIntensity: 0.3,
  });

  // Main body - composed of base and angled top section
  const baseGeom = new THREE.BoxGeometry(bodyW, bodyH * 0.6, bodyD);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = bodyH * 0.3;
  root.add(base);

  // Angled top section
  const topHeight = bodyH * 0.5;
  const topDepth = bodyD * 0.65;
  const topGeom = new THREE.BoxGeometry(bodyW, topHeight, topDepth);
  const top = new THREE.Mesh(topGeom, bodyMat);
  top.position.y = bodyH * 0.6 + topHeight * 0.5;
  top.position.z = -bodyD * 0.15;
  top.rotation.x = -slopeAngle;
  root.add(top);

  // Back vertical section
  const backHeight = bodyH * 0.35;
  const backGeom = new THREE.BoxGeometry(bodyW, backHeight, bodyD * 0.25);
  const back = new THREE.Mesh(backGeom, bodyMat);
  back.position.y = bodyH * 0.6 + topHeight * 0.7;
  back.position.z = -bodyD * 0.38;
  root.add(back);

  // Screen frame (recessed area)
  const screenFrameW = bodyW * 0.75;
  const screenFrameH = topHeight * 0.75;
  const screenFrameD = 0.008;
  const screenFrameGeom = new THREE.BoxGeometry(screenFrameW, screenFrameH, screenFrameD);
  const screenFrame = new THREE.Mesh(screenFrameGeom, screenFrameMat);
  screenFrame.position.y = bodyH * 0.6 + topHeight * 0.55;
  screenFrame.position.z = -bodyD * 0.12;
  screenFrame.rotation.x = -slopeAngle;
  root.add(screenFrame);

  // Screen display (emissive)
  const screenDisplayW = screenFrameW * 0.88;
  const screenDisplayH = screenFrameH * 0.85;
  const screenDisplayGeom = new THREE.PlaneGeometry(screenDisplayW, screenDisplayH);
  const screenDisplay = new THREE.Mesh(screenDisplayGeom, screenDisplayMat);
  screenDisplay.position.y = bodyH * 0.6 + topHeight * 0.55;
  screenDisplay.position.z = -bodyD * 0.115;
  screenDisplay.rotation.x = -slopeAngle;
  root.add(screenDisplay);

  // Button panel area (slightly recessed)
  const buttonPanelW = bodyW * 0.85;
  const buttonPanelD = bodyD * 0.45;
  const buttonPanelGeom = new THREE.BoxGeometry(buttonPanelW, 0.005, buttonPanelD);
  const buttonPanel = new THREE.Mesh(buttonPanelGeom, bodyMat);
  buttonPanel.position.y = bodyH * 0.6 + topHeight * 0.35;
  buttonPanel.position.z = bodyD * 0.08;
  buttonPanel.rotation.x = -slopeAngle;
  root.add(buttonPanel);

  // Button layout - grid of buttons
  const buttonRows = 5;
  const buttonCols = 4;
  const buttonSpacingX = buttonPanelW / (buttonCols + 1);
  const buttonSpacingZ = buttonPanelD / (buttonRows + 1);
  const buttonRadius = buttonSpacingX * 0.35;
  const buttonHeight = 0.012;

  // Button positions and colors (matching reference)
  const buttonConfig = [
    // Row 0 (top)
    { row: 0, col: 0, color: buttonOrangeMat },
    { row: 0, col: 1, color: buttonGrayMat },
    { row: 0, col: 2, color: buttonGrayMat },
    { row: 0, col: 3, color: buttonGrayMat },
    // Row 1
    { row: 1, col: 0, color: buttonRedMat },
    { row: 1, col: 1, color: buttonGrayMat },
    { row: 1, col: 2, color: buttonGrayMat },
    { row: 1, col: 3, color: buttonGrayMat },
    // Row 2
    { row: 2, col: 0, color: buttonGrayMat },
    { row: 2, col: 1, color: buttonGrayMat },
    { row: 2, col: 2, color: buttonGrayMat },
    { row: 2, col: 3, color: buttonGreenMat },
    // Row 3
    { row: 3, col: 0, color: buttonGrayMat },
    { row: 3, col: 1, color: buttonGrayMat },
    { row: 3, col: 2, color: buttonGrayMat },
    { row: 3, col: 3, color: buttonGrayMat },
    // Row 4 (bottom)
    { row: 4, col: 0, color: buttonGrayMat },
    { row: 4, col: 1, color: buttonGrayMat },
    { row: 4, col: 2, color: buttonGreenMat },
    { row: 4, col: 3, color: buttonGrayMat },
  ];

  const buttonGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, buttonHeight, 16);

  for (const btn of buttonConfig) {
    const bx = (btn.col - (buttonCols - 1) / 2) * buttonSpacingX;
    const bz = (btn.row - (buttonRows - 1) / 2) * buttonSpacingZ;
    
    const button = new THREE.Mesh(buttonGeom, btn.color);
    button.position.y = bodyH * 0.6 + topHeight * 0.35 + buttonHeight * 0.5;
    button.position.x = bx;
    button.position.z = bodyD * 0.08 + bz;
    button.rotation.x = -slopeAngle;
    root.add(button);
  }

  // Small red LED indicator
  const ledGeom = new THREE.CircleGeometry(0.008, 12);
  const led = new THREE.Mesh(ledGeom, ledMat);
  led.position.y = bodyH * 0.6 + topHeight * 0.22;
  led.position.x = -buttonPanelW * 0.35;
  led.position.z = bodyD * 0.08 + buttonSpacingZ * 2.2;
  led.rotation.x = -slopeAngle;
  root.add(led);

  // Side ports (left side from viewer perspective)
  const portW = 0.035;
  const portH = 0.055;
  const portD = 0.025;
  const portGeom = new THREE.BoxGeometry(portD, portH, portW);
  
  const portPositions = [
    { x: -bodyW / 2 - portD / 2, y: bodyH * 0.35, z: bodyD * 0.25 },
    { x: -bodyW / 2 - portD / 2, y: bodyH * 0.35, z: bodyD * 0.12 },
    { x: -bodyW / 2 - portD / 2, y: bodyH * 0.35, z: bodyD * -0.02 },
    { x: -bodyW / 2 - portD / 2, y: bodyH * 0.35, z: bodyD * -0.15 },
  ];

  for (const pos of portPositions) {
    const port = new THREE.Mesh(portGeom, portMat);
    port.position.set(pos.x, pos.y, pos.z);
    root.add(port);
  }

  // Port labels (small raised text areas)
  const labelGeom = new THREE.BoxGeometry(0.003, 0.015, 0.025);
  const labelPositions = [
    { x: -bodyW / 2 + 0.002, y: bodyH * 0.28, z: bodyD * 0.25 },
    { x: -bodyW / 2 + 0.002, y: bodyH * 0.28, z: bodyD * 0.12 },
    { x: -bodyW / 2 + 0.002, y: bodyH * 0.28, z: bodyD * -0.02 },
    { x: -bodyW / 2 + 0.002, y: bodyH * 0.28, z: bodyD * -0.15 },
  ];

  for (const pos of labelPositions) {
    const label = new THREE.Mesh(labelGeom, bodyMat);
    label.position.set(pos.x, pos.y, pos.z);
    root.add(label);
  }

  // Ventilation grilles (right side)
  const ventW = 0.008;
  const ventH = 0.025;
  const ventD = 0.035;
  const ventGeom = new THREE.BoxGeometry(ventD, ventH, ventW);

  const ventRows = 5;
  const ventSpacing = 0.018;
  for (let i = 0; i < ventRows; i++) {
    const vent = new THREE.Mesh(ventGeom, ventMat);
    vent.position.set(
      bodyW / 2 + ventD / 2,
      bodyH * 0.55 - i * ventSpacing,
      bodyD * -0.25
    );
    root.add(vent);
  }

  // Small circular vent holes above the slats
  const holeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8);
  for (let i = 0; i < 4; i++) {
    const hole = new THREE.Mesh(holeGeom, ventMat);
    hole.rotation.z = Math.PI / 2;
    hole.position.set(
      bodyW / 2 + 0.005,
      bodyH * 0.65,
      bodyD * -0.25 + (i - 1.5) * 0.012
    );
    root.add(hole);
  }

  // Screws on body corners
  const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 6);
  const screwPositions = [
    { x: -bodyW / 2 + 0.025, y: 0.005, z: bodyD / 2 - 0.025 },
    { x: bodyW / 2 - 0.025, y: 0.005, z: bodyD / 2 - 0.025 },
    { x: -bodyW / 2 + 0.025, y: 0.005, z: -bodyD / 2 + 0.025 },
    { x: bodyW / 2 - 0.025, y: 0.005, z: -bodyD / 2 + 0.025 },
  ];

  for (const pos of screwPositions) {
    const screw = new THREE.Mesh(screwGeom, screwMat);
    screw.position.set(pos.x, pos.y, pos.z);
    root.add(screw);
  }

  // Rounded edge detail on front
  const edgeGeom = new THREE.BoxGeometry(bodyW * 0.95, 0.015, 0.02);
  const edge = new THREE.Mesh(edgeGeom, bodyMat);
  edge.position.set(0, bodyH * 0.53, bodyD / 2 - 0.01);
  root.add(edge);

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