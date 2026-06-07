export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  // Normalized dimensions before fitToUnitCube
  const totalWidth = 1.2;
  const totalDepth = 0.38;
  const bodyHeight = 0.08;
  const backPanelHeight = 0.06;
  const keyCount = 61; // 5 Octaves
  const keyWidth = totalWidth / keyCount;
  const whiteKeyDepth = 0.24;
  const blackKeyDepth = 0.14;
  const blackKeyWidth = keyWidth * 0.6;

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.6,
  });

  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.4,
  });

  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.1,
    roughness: 0.3,
  });

  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.5,
  });

  const sliderMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.4,
    roughness: 0.4,
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.2,
    roughness: 0.6,
  });

  // --- Helper: Procedural Control Panel Texture ---
  function createPanelTexture() {
    const width = 512;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Fill background (dark gray)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 40;
      data[i * 4 + 1] = 40;
      data[i * 4 + 2] = 45;
      data[i * 4 + 3] = 255;
    }

    // Draw Text/Labels (White rectangles/lines)
    // Helper to draw a rect
    function drawRect(x, y, w, h, r, g, b) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const idx = (iy * width + ix) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    // Brand Name "Digital Piano" area (Right side)
    drawRect(300, 20, 180, 30, 200, 200, 200); // Main label
    drawRect(300, 60, 180, 10, 150, 150, 150); // Sub label
    
    // "GHS" Label (Left side of panel)
    drawRect(50, 40, 60, 20, 220, 220, 220);
    
    // Slider tracks
    for (let i = 0; i < 6; i++) {
      const sx = 100 + i * 50;
      drawRect(sx, 80, 4, 100, 50, 50, 50); // Track
      drawRect(sx - 2, 100 + (i % 3) * 30, 8, 20, 200, 200, 200); // Slider cap
    }

    // Button grid
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        drawRect(320 + c * 40, 120 + r * 40, 30, 30, 60, 60, 70);
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const panelTexture = createPanelTexture();
  const panelTexturedMat = new THREE.MeshStandardMaterial({
    map: panelTexture,
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.5,
  });

  // --- Chassis Construction ---

  // Main Base Body
  const baseGeom = new THREE.BoxGeometry(totalWidth, bodyHeight, totalDepth);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = bodyHeight / 2;
  root.add(base);

  // Back Panel Housing (Raised section)
  const backPanelWidth = totalWidth;
  const backPanelDepth = totalDepth * 0.6;
  const backPanelGeom = new THREE.BoxGeometry(backPanelWidth, backPanelHeight, backPanelDepth);
  const backPanel = new THREE.Mesh(backPanelGeom, bodyMat);
  backPanel.position.set(0, bodyHeight + backPanelHeight / 2, -totalDepth * 0.15);
  root.add(backPanel);

  // Pitch Bend Wheel (Left Side)
  const wheelGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const wheel = new THREE.Mesh(wheelGeom, bodyMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(-totalWidth / 2 - 0.02, bodyHeight * 0.8, totalDepth * 0.3);
  root.add(wheel);

  // Control Panel Surface (Top of back panel, right side)
  const controlPanelGeom = new THREE.PlaneGeometry(backPanelWidth * 0.6, backPanelDepth * 0.8);
  const controlPanel = new THREE.Mesh(controlPanelGeom, panelTexturedMat);
  controlPanel.rotation.x = Math.PI / 2;
  // Position on top of back panel, shifted right
  controlPanel.position.set(totalWidth * 0.1, bodyHeight + backPanelHeight + 0.001, -totalDepth * 0.15);
  root.add(controlPanel);

  // Physical Sliders (on top of control panel)
  const sliderGeom = new THREE.BoxGeometry(0.02, 0.04, 0.03);
  for (let i = 0; i < 5; i++) {
    const slider = new THREE.Mesh(sliderGeom, sliderMat);
    // Distribute across the panel area
    const sx = totalWidth * 0.15 + i * (backPanelWidth * 0.5 / 5);
    slider.position.set(sx, bodyHeight + backPanelHeight + 0.025, -totalDepth * 0.15);
    root.add(slider);
  }

  // --- Keybed Construction ---

  // White Keys
  const whiteKeyGeom = new THREE.BoxGeometry(keyWidth * 0.96, 0.05, whiteKeyDepth);
  // Use InstancedMesh for performance if many keys, but loop is fine for 61
  for (let i = 0; i < keyCount; i++) {
    const key = new THREE.Mesh(whiteKeyGeom, whiteKeyMat);
    // Calculate X position centered
    const x = -totalWidth / 2 + (i * keyWidth) + (keyWidth / 2);
    key.position.set(x, bodyHeight + 0.025, totalDepth * 0.1);
    root.add(key);
  }

  // Black Keys
  const blackKeyGeom = new THREE.BoxGeometry(blackKeyWidth * 0.9, 0.06, blackKeyDepth);
  // Pattern: 2 black, gap, 3 black, gap. 
  // Indices in 7-white-key octave: 0(C), 1(D), 2(E), 3(F), 4(G), 5(A), 6(B)
  // Black keys after: 0, 1, (skip 2), 3, 4, 5, (skip 6)
  
  let octaveIndex = 0;
  for (let i = 0; i < keyCount; i++) {
    const noteInOctave = i % 7;
    const hasBlackKey = (noteInOctave === 0 || noteInOctave === 1 || noteInOctave === 3 || noteInOctave === 4 || noteInOctave === 5);
    
    // Don't place a black key after the very last white key if it's a B (end of octave)
    // Also check bounds
    if (hasBlackKey && i < keyCount - 1) {
      const key = new THREE.Mesh(blackKeyGeom, blackKeyMat);
      
      // Position: Between white key i and i+1
      const x = -totalWidth / 2 + (i * keyWidth) + keyWidth; 
      // Z: Further back than white keys
      const z = totalDepth * 0.1 - (whiteKeyDepth - blackKeyDepth) * 0.5;
      
      key.position.set(x, bodyHeight + 0.06, z);
      root.add(key);
    }
  }

  // Side Speakers/Grille Detail (Subtle boxes on sides)
  const speakerGeom = new THREE.BoxGeometry(0.02, 0.06, 0.15);
  const speakerL = new THREE.Mesh(speakerGeom, bodyMat);
  speakerL.position.set(-totalWidth / 2 + 0.05, bodyHeight + 0.05, -totalDepth * 0.3);
  root.add(speakerL);
  
  const speakerR = new THREE.Mesh(speakerGeom, bodyMat);
  speakerR.position.set(totalWidth / 2 - 0.05, bodyHeight + 0.05, -totalDepth * 0.3);
  root.add(speakerR);

  // --- Final Normalization ---
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