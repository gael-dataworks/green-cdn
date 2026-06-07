export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Glossy white plastic for white keys
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Glossy black plastic for black keys
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Material for the control panel surface (will have a map)
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  // Approximate proportions based on a 25-key mini controller
  const totalKeys = 25;
  const keyWidth = 0.028; // Width of a white key
  const keySpacing = 0.001;
  const whiteKeyLength = 0.14;
  const blackKeyLength = 0.08;
  const blackKeyWidth = 0.016;
  
  const keyboardWidth = totalKeys * (keyWidth + keySpacing);
  const bodyDepth = 0.22;
  const baseHeight = 0.03;
  const controlPanelHeight = 0.05; // Raised section height
  const controlPanelDepth = 0.09;  // Depth of the raised back section

  // --- Helpers ---
  function createBox(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  // --- 1. Main Chassis ---
  // Lower front section (keybed base)
  const frontBase = new THREE.Mesh(
    new THREE.BoxGeometry(keyboardWidth + 0.02, baseHeight, bodyDepth - controlPanelDepth + 0.01),
    bodyMat
  );
  frontBase.position.set(0, baseHeight / 2, (bodyDepth - controlPanelDepth) / 2 + 0.005);
  root.add(frontBase);

  // Raised back section (control panel housing)
  const backBase = new THREE.Mesh(
    new THREE.BoxGeometry(keyboardWidth + 0.02, baseHeight + controlPanelHeight, controlPanelDepth),
    bodyMat
  );
  backBase.position.set(0, (baseHeight + controlPanelHeight) / 2, - (bodyDepth - controlPanelDepth) / 2 - controlPanelDepth / 2);
  root.add(backBase);

  // Side cheeks (curved ends typical of this form factor)
  // Left cheek
  const cheekGeom = new THREE.BoxGeometry(0.015, baseHeight + controlPanelHeight, bodyDepth);
  const leftCheek = new THREE.Mesh(cheekGeom, bodyMat);
  leftCheek.position.set(-keyboardWidth / 2 - 0.0075, (baseHeight + controlPanelHeight) / 2, 0);
  root.add(leftCheek);
  
  // Right cheek
  const rightCheek = new THREE.Mesh(cheekGeom, bodyMat);
  rightCheek.position.set(keyboardWidth / 2 + 0.0075, (baseHeight + controlPanelHeight) / 2, 0);
  root.add(rightCheek);

  // --- 2. Keys ---
  // We need to place 25 white keys and the corresponding black keys
  // Pattern: W, B, W, B, W, W, B, W, B, W, B, W (Octave 1) ... repeat
  
  const startX = -keyboardWidth / 2 + keyWidth / 2;
  const keyY = baseHeight + 0.005; // Slightly above base
  const blackKeyY = baseHeight + 0.005 + (whiteKeyLength - blackKeyLength) * 0.3; // Raised relative to white keys? No, usually same pivot but shorter.
  // Actually, on synths, black keys are often physically higher or same level but shorter. 
  // Let's make them sit on the same plane but be shorter, so they appear higher at the front.
  // Wait, standard piano: black keys are raised. 
  // Let's position white keys at Z=0 (front of keybed).
  // Black keys are shorter and sit further back.
  
  const keyZFront = (bodyDepth - controlPanelDepth) / 2 + 0.01; // Front edge of keybed
  
  // White keys geometry (shared)
  const whiteKeyGeom = new THREE.BoxGeometry(keyWidth, 0.015, whiteKeyLength);
  // Black keys geometry (shared)
  const blackKeyGeom = new THREE.BoxGeometry(blackKeyWidth, 0.018, blackKeyLength);

  // Key pattern array: 1 = white, 0 = black (position relative to white keys)
  // Standard pattern offsets for black keys within an octave (12 semitones)
  // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
  // Black keys are between: C-D, D-E, F-G, G-A, A-B
  // Indices of white keys that have a black key AFTER them: 0, 1, 3, 4, 5 (0-indexed within octave)
  
  let currentX = startX;
  
  for (let i = 0; i < totalKeys; i++) {
    // Determine octave and note index
    const noteInOctave = i % 12;
    const isC = noteInOctave === 0;
    const isF = noteInOctave === 5;
    
    // Place White Key
    const whiteKey = new THREE.Mesh(whiteKeyGeom, whiteKeyMat);
    whiteKey.position.set(currentX, keyY, keyZFront - whiteKeyLength / 2);
    root.add(whiteKey);

    // Place Black Key if needed (after C, D, F, G, A)
    // C# (after C), D# (after D), F# (after F), G# (after G), A# (after A)
    // Notes: 0(C), 1(C#), 2(D), 3(D#), 4(E), 5(F), 6(F#), 7(G), 8(G#), 9(A), 10(A#), 11(B)
    // White keys are at indices: 0, 2, 4, 5, 7, 9, 11 (relative to chromatic scale)
    // But we are iterating white keys. 
    // White key 0 (C) -> has black key after
    // White key 1 (D) -> has black key after
    // White key 2 (E) -> NO black key
    // White key 3 (F) -> has black key after
    // White key 4 (G) -> has black key after
    // White key 5 (A) -> has black key after
    // White key 6 (B) -> NO black key
    
    const hasBlackAfter = [0, 1, 3, 4, 5].includes(noteInOctave);
    
    if (hasBlackAfter && i < totalKeys - 1) {
      const blackKey = new THREE.Mesh(blackKeyGeom, blackKeyMat);
      // Position black key between this white key and the next
      const nextX = currentX + keyWidth + keySpacing;
      const blackX = currentX + (keyWidth + keySpacing) / 2 + (keyWidth + keySpacing) / 2; 
      // Actually, simpler: black key is centered between white keys roughly
      // Let's approximate: offset from current white key center by ~0.6 * whiteWidth
      blackKey.position.set(
        currentX + keyWidth * 0.65, 
        keyY + 0.005, // Slightly higher
        keyZFront - blackKeyLength / 2 - 0.01 // Pushed back slightly more
      );
      root.add(blackKey);
    }

    currentX += keyWidth + keySpacing;
  }

  // --- 3. Control Panel Texture & Surface ---
  // Create a procedural texture for the labels on the right side
  const texWidth = 256;
  const texHeight = 128;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill background (dark gray)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 40;     // R
    data[i + 1] = 40; // G
    data[i + 2] = 45; // B
    data[i + 3] = 255; // A
  }

  // Draw simple "text" lines and blocks (white/light gray)
  // We simulate labels like "K25", "TRANS", "OCT", etc.
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = ((y + dy) * texWidth + (x + dx)) * 4;
        if (idx < data.length) {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Header text area (top right)
  drawRect(140, 10, 100, 15, 200, 200, 200); // "Classic Lab Keys" simulation
  drawRect(140, 30, 20, 5, 150, 150, 150);   // Subtext line
  
  // Buttons area
  // Button 1
  drawRect(140, 60, 25, 25, 60, 60, 60); // Button base
  drawRect(145, 65, 15, 15, 220, 220, 220); // Button top
  // Button 2
  drawRect(175, 60, 25, 25, 60, 60, 60);
  drawRect(180, 65, 15, 15, 220, 220, 220);
  // Button 3
  drawRect(210, 60, 25, 25, 60, 60, 60);
  drawRect(215, 65, 15, 15, 220, 220, 220);
  
  // Labels under buttons
  drawRect(142, 90, 20, 4, 180, 180, 180);
  drawRect(177, 90, 20, 4, 180, 180, 180);
  drawRect(212, 90, 20, 4, 180, 180, 180);

  const panelTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.needsUpdate = true;
  panelTexture.wrapS = THREE.ClampToEdgeWrapping;
  panelTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  panelMat.map = panelTexture;

  // Control Panel Surface Mesh
  // Positioned on top of the back base, right side
  const panelWidth = keyboardWidth * 0.35;
  const panelDepth = controlPanelDepth - 0.02;
  const panelX = keyboardWidth / 2 - panelWidth / 2;
  const panelY = baseHeight + controlPanelHeight - 0.001; // Slightly inset
  const panelZ = - (bodyDepth - controlPanelDepth) / 2 - controlPanelDepth / 2;

  const controlSurface = new THREE.Mesh(
    new THREE.BoxGeometry(panelWidth, 0.002, panelDepth),
    panelMat
  );
  controlSurface.position.set(panelX, panelY, panelZ);
  root.add(controlSurface);

  // Physical Buttons (simple cylinders)
  const buttonGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 16);
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  
  const btnPositions = [
    { x: panelX - panelWidth/2 + 0.03, z: panelZ },
    { x: panelX - panelWidth/2 + 0.07, z: panelZ },
    { x: panelX - panelWidth/2 + 0.11, z: panelZ },
  ];

  btnPositions.forEach(pos => {
    const btn = new THREE.Mesh(buttonGeom, buttonMat);
    btn.position.set(pos.x, panelY + 0.006, pos.z);
    root.add(btn);
  });

  // Pitch/Mod wheels (left side of control panel)
  // Two small cylinders
  const wheelGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  
  const wheelZ = panelZ + 0.02;
  const wheelY = panelY + 0.004;
  
  const wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
  wheel1.rotation.x = Math.PI / 2;
  wheel1.position.set(panelX - 0.04, wheelY, wheelZ);
  root.add(wheel1);

  const wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
  wheel2.rotation.x = Math.PI / 2;
  wheel2.position.set(panelX - 0.02, wheelY, wheelZ);
  root.add(wheel2);


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