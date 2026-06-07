export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Slightly glossier black for keys
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Off-white plastic for white keys
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Dark gray for buttons
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Emissive material for text/labels on the control panel
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  });

  // --- Dimensions ---
  const totalWidth = 1.0;
  const totalDepth = 0.32;
  const totalHeight = 0.06;
  const keybedWidth = 0.82;
  const keybedDepth = 0.22;
  const keybedZ = -0.02; // Slightly set back from front edge
  
  // Key dimensions
  const numWhiteKeys = 15;
  const whiteKeyWidth = keybedWidth / numWhiteKeys;
  const whiteKeyDepth = keybedDepth;
  const whiteKeyHeight = 0.015;
  
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyDepth = keybedDepth * 0.6;
  const blackKeyHeight = 0.022;

  // --- Geometry Reuse ---
  const whiteKeyGeom = new THREE.BoxGeometry(whiteKeyWidth - 0.002, whiteKeyHeight, whiteKeyDepth);
  const blackKeyGeom = new THREE.BoxGeometry(blackKeyWidth - 0.002, blackKeyHeight, blackKeyDepth);
  const buttonGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 16);

  // --- Main Chassis ---
  // Base body
  const chassisGeom = new THREE.BoxGeometry(totalWidth, totalHeight, totalDepth);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = totalHeight / 2;
  root.add(chassis);

  // Top face plate (slightly raised areas)
  const topPlateGeom = new THREE.BoxGeometry(totalWidth, 0.015, totalDepth - 0.02);
  const topPlate = new THREE.Mesh(topPlateGeom, bodyMat);
  topPlate.position.y = totalHeight + 0.0075;
  topPlate.position.z = -0.01;
  root.add(topPlate);

  // --- Pitch/Mod Block (Left Side) ---
  const pitchBlockWidth = 0.12;
  const pitchBlockGeom = new THREE.BoxGeometry(pitchBlockWidth, 0.025, totalDepth - 0.04);
  const pitchBlock = new THREE.Mesh(pitchBlockGeom, bodyMat);
  pitchBlock.position.set(-totalWidth / 2 + pitchBlockWidth / 2, totalHeight + 0.0125, 0);
  root.add(pitchBlock);
  
  // Pitch wheel strip (visual detail)
  const pitchWheelGeom = new THREE.BoxGeometry(0.04, 0.005, 0.08);
  const pitchWheel = new THREE.Mesh(pitchWheelGeom, bodyMat);
  pitchWheel.position.set(-totalWidth / 2 + pitchBlockWidth / 2, totalHeight + 0.025, 0.04);
  root.add(pitchWheel);

  // --- Control Panel (Right Side) ---
  const controlPanelWidth = 0.25;
  const controlPanelGeom = new THREE.BoxGeometry(controlPanelWidth, 0.025, totalDepth - 0.04);
  const controlPanel = new THREE.Mesh(controlPanelGeom, bodyMat);
  controlPanel.position.set(totalWidth / 2 - controlPanelWidth / 2, totalHeight + 0.0125, 0);
  root.add(controlPanel);

  // --- Procedural Texture for Control Panel Labels ---
  // We need to draw "XKEY25" and button labels
  const texWidth = 256;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Helper to draw a rect
  function drawRect(x, y, w, h, r, g, b, a) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < texWidth && iy >= 0 && iy < texHeight) {
          const idx = (iy * texWidth + ix) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  // Helper to draw simple block text (5x7 font approximation)
  const font = {
    'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1]],
    'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'Y': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    '2': [[1,1,1,0,0],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]],
    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,0,0],[0,0,0,1,0],[1,1,1,0,0]],
    'C': [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    'R': [[1,1,1,0,0],[1,0,0,1,0],[1,1,1,0,0],[1,0,1,0,0],[1,0,0,1,0]],
    'A': [[0,1,1,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
    'S': [[0,1,1,1,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  };

  function drawText(text, startX, startY, scale, colorR, colorG, colorB) {
    let cursorX = startX;
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase();
      const glyph = font[char] || font[' '];
      if (glyph) {
        for (let gy = 0; gy < glyph.length; gy++) {
          for (let gx = 0; gx < glyph[gy].length; gx++) {
            if (glyph[gy][gx] === 1) {
              drawRect(cursorX + gx * scale, startY + gy * scale, scale, scale, colorR, colorG, colorB, 255);
            }
          }
        }
        cursorX += 6 * scale;
      }
    }
  }

  // Fill background black
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 20; data[i+1] = 20; data[i+2] = 20; data[i+3] = 255;
  }

  // Draw "XKEY25"
  drawText("XKEY25", 20, 10, 4, 200, 200, 200);
  // Draw "CME"
  drawText("CME", 20, 45, 3, 150, 150, 150);
  // Draw button labels
  drawText("OCT", 140, 15, 2, 255, 255, 255);
  drawText("TRANS", 180, 15, 2, 255, 255, 255);
  drawText("SUSTAIN", 140, 40, 2, 255, 255, 255);

  const controlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  controlTexture.colorSpace = THREE.SRGBColorSpace;
  controlTexture.needsUpdate = true;
  
  // Apply texture to a plane on the control panel
  const labelGeom = new THREE.PlaneGeometry(controlPanelWidth - 0.04, 0.06);
  const labelMesh = new THREE.Mesh(labelGeom, new THREE.MeshStandardMaterial({ 
    map: controlTexture, 
    transparent: true,
    opacity: 0.9
  }));
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0, 0.013, -0.02);
  controlPanel.add(labelMesh);

  // --- Buttons on Control Panel ---
  const buttonPositions = [
    { x: 0.06, z: 0.02 }, { x: 0.06, z: -0.02 },
    { x: -0.02, z: 0.02 }, { x: -0.02, z: -0.02 },
    { x: -0.10, z: 0.02 }, { x: -0.10, z: -0.02 }
  ];
  
  for (const pos of buttonPositions) {
    const btn = new THREE.Mesh(buttonGeom, buttonMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(pos.x, 0.013, pos.z);
    controlPanel.add(btn);
  }

  // --- Keys ---
  // We need to place 15 white keys and 10 black keys
  // White keys are evenly spaced. Black keys are positioned relative to white keys.
  // Pattern: W, B, W, B, W, W, B, W, B, W, B, W (Octave 1) ...
  
  const keyStartX = -keybedWidth / 2 + whiteKeyWidth / 2;
  
  // White Keys
  for (let i = 0; i < numWhiteKeys; i++) {
    const key = new THREE.Mesh(whiteKeyGeom, whiteKeyMat);
    const x = keyStartX + i * whiteKeyWidth;
    // Taper the white key slightly at the back for realism
    key.position.set(x, totalHeight + whiteKeyHeight / 2, keybedZ - whiteKeyDepth / 2 + 0.02);
    root.add(key);
  }

  // Black Keys
  // Indices of white keys after which a black key appears:
  // 0(C)->C#, 1(D)->D#, 3(F)->F#, 4(G)->G#, 5(A)->A#
  // 7(C)->C#, 8(D)->D#, 10(F)->F#, 11(G)->G#, 12(A)->A#
  const blackKeyOffsets = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];
  
  for (let i = 0; i < blackKeyOffsets.length; i++) {
    const whiteIndex = blackKeyOffsets[i];
    const key = new THREE.Mesh(blackKeyGeom, blackKeyMat);
    
    // Position between whiteIndex and whiteIndex+1
    const x = keyStartX + whiteIndex * whiteKeyWidth + whiteKeyWidth / 2;
    
    // Black keys are raised and set back
    const z = keybedZ - blackKeyDepth / 2; 
    const y = totalHeight + blackKeyHeight / 2 + 0.002; // Slightly above white keys
    
    key.position.set(x, y, z);
    root.add(key);
  }

  // --- Rear Strip (Hinge area) ---
  const rearStripGeom = new THREE.BoxGeometry(totalWidth, 0.01, 0.02);
  const rearStrip = new THREE.Mesh(rearStripGeom, bodyMat);
  rearStrip.position.set(0, totalHeight + 0.005, -totalDepth / 2 + 0.01);
  root.add(rearStrip);

  // --- USB Port Detail (Back center) ---
  const usbPortGeom = new THREE.BoxGeometry(0.03, 0.015, 0.01);
  const usbPort = new THREE.Mesh(usbPortGeom, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.2 }));
  usbPort.position.set(0, totalHeight / 2, -totalDepth / 2 - 0.005);
  root.add(usbPort);

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