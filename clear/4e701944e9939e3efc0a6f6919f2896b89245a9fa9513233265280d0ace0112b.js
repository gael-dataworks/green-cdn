export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Slightly glossier black for keys
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Off-white for natural keys
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Dark gray for control panel surface
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const keyCount = 25;
  const whiteKeyWidth = 0.032;
  const whiteKeyLength = 0.22;
  const whiteKeyHeight = 0.012;
  const blackKeyWidth = 0.018;
  const blackKeyLength = 0.13;
  const blackKeyHeight = 0.014;
  
  const totalKeyboardWidth = keyCount * whiteKeyWidth;
  const marginX = 0.04;
  const totalWidth = totalKeyboardWidth + marginX * 2;
  const bodyDepth = 0.28;
  const bodyHeight = 0.02;
  const controlHeight = 0.035;

  // --- Body Chassis ---
  // Main base plate
  const baseGeom = new THREE.BoxGeometry(totalWidth, bodyHeight, bodyDepth);
  const bodyBase = new THREE.Mesh(baseGeom, bodyMat);
  bodyBase.position.y = bodyHeight / 2;
  root.add(bodyBase);

  // Raised back section (control deck)
  // It spans the whole width but has distinct visual sections
  const deckGeom = new THREE.BoxGeometry(totalWidth, controlHeight, bodyDepth * 0.6);
  const controlDeck = new THREE.Mesh(deckGeom, bodyMat);
  controlDeck.position.set(0, bodyHeight + controlHeight / 2, -bodyDepth * 0.15);
  root.add(controlDeck);

  // --- Keys ---
  // We need to place 25 white keys and appropriate black keys
  // Pattern of semitones in an octave: W, B, W, B, W, W, B, W, B, W, B, W
  // White keys indices: 0, 1, 2, 3, 4, 5, 6 (C, D, E, F, G, A, B)
  // Black keys appear after: C(0), D(1), F(3), G(4), A(5)
  
  const startX = -totalKeyboardWidth / 2 + whiteKeyWidth / 2;
  const keyZ = 0.02; // Slight offset from back

  // Helper to check if a white key index has a black key after it
  function hasBlackAfter(index) {
    const mod = index % 7;
    return mod === 0 || mod === 1 || mod === 3 || mod === 4 || mod === 5;
  }

  // White Keys
  const whiteKeyGeom = new THREE.BoxGeometry(whiteKeyWidth - 0.002, whiteKeyHeight, whiteKeyLength);
  for (let i = 0; i < keyCount; i++) {
    const key = new THREE.Mesh(whiteKeyGeom, whiteKeyMat);
    key.position.set(
      startX + i * whiteKeyWidth,
      bodyHeight + whiteKeyHeight / 2,
      keyZ + whiteKeyLength / 2
    );
    root.add(key);
  }

  // Black Keys
  const blackKeyGeom = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
  let whiteIndex = 0;
  for (let i = 0; i < keyCount; i++) {
    // Place black key if this white key is followed by one
    if (hasBlackAfter(whiteIndex) && i < keyCount - 1) {
      const key = new THREE.Mesh(blackKeyGeom, blackKeyMat);
      // Position between current white key and next
      const x = startX + i * whiteKeyWidth + whiteKeyWidth * 0.65;
      key.position.set(
        x,
        bodyHeight + whiteKeyHeight + blackKeyHeight / 2,
        keyZ + blackKeyLength / 2
      );
      root.add(key);
    }
    whiteIndex++;
    if (whiteIndex >= 7) whiteIndex = 0;
  }

  // --- Control Panel Texture & Labels ---
  // Create a procedural texture for the right-side control panel
  const texWidth = 256;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill background (dark gray)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 40;     // R
    data[i + 1] = 40; // G
    data[i + 2] = 40; // B
    data[i + 3] = 255;// A
  }

  // Helper to draw a white rect on the texture data
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < texWidth && py >= 0 && py < texHeight) {
          const idx = (py * texWidth + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Draw "OCTAVE LAB" text simulation (blocks)
  drawRect(20, 10, 80, 10, 200, 200, 200); // Title bar
  drawRect(20, 25, 60, 4, 150, 150, 150);  // Subtext line 1
  drawRect(20, 32, 40, 4, 150, 150, 150);  // Subtext line 2

  // Draw buttons (right side)
  // Row of small buttons
  for (let i = 0; i < 6; i++) {
    drawRect(140 + i * 18, 15, 12, 12, 220, 220, 220); // Button face
    drawRect(140 + i * 18, 15, 12, 2, 100, 100, 100);  // Shadow/Detail
  }
  // Labels under buttons
  for (let i = 0; i < 6; i++) {
    drawRect(140 + i * 18, 30, 10, 2, 180, 180, 180);
  }

  // Pad/Wheel area on left (visual only)
  drawRect(20, 45, 30, 15, 50, 50, 50); // Pad
  drawRect(60, 45, 30, 15, 50, 50, 50); // Pad

  const controlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  controlTexture.colorSpace = THREE.SRGBColorSpace;
  controlTexture.needsUpdate = true;
  // Flip Y because texture coords usually start top-left, but we drew bottom-up logic or vice versa
  // Actually DataTexture is bottom-up by default in WebGL, but let's just flip the geometry or texture
  controlTexture.flipY = true;

  const panelLabelMat = new THREE.MeshStandardMaterial({
    map: controlTexture,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Apply texture to the top of the right control section
  // The deck is split visually. Let's place a thin plane on top of the right half.
  const labelWidth = totalWidth * 0.45;
  const labelDepth = bodyDepth * 0.5;
  const labelGeom = new THREE.PlaneGeometry(labelWidth, labelDepth);
  const controlLabels = new THREE.Mesh(labelGeom, panelLabelMat);
  controlLabels.rotation.x = -Math.PI / 2;
  controlLabels.position.set(
    totalWidth * 0.275, // Right side
    bodyHeight + controlHeight + 0.001, // Slightly above deck
    -bodyDepth * 0.15
  );
  root.add(controlLabels);

  // Add some physical buttons as geometry on the right side
  const buttonGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 16);
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const btn = new THREE.Mesh(buttonGeom, buttonMat);
    btn.position.set(
      totalWidth * 0.1 + i * 0.025,
      bodyHeight + controlHeight + 0.005,
      -bodyDepth * 0.15
    );
    root.add(btn);
  }

  // Pitch/Mod wheel area on left (simple cylinder)
  const wheelGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 32);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const wheel = new THREE.Mesh(wheelGeom, wheelMat);
  wheel.rotation.x = Math.PI / 2;
  wheel.position.set(
    -totalWidth * 0.35,
    bodyHeight + controlHeight + 0.005,
    -bodyDepth * 0.15
  );
  root.add(wheel);

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