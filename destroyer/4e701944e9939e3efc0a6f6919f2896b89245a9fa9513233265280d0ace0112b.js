export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Body: Matte black plastic
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // White Keys: Glossy white plastic
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Black Keys: Matte black plastic (slightly different roughness than body)
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Control Panel Labels: Emissive for text/buttons on dark background
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const totalLength = 1.2;
  const totalDepth = 0.38;
  const bodyHeight = 0.08;
  const keybedY = bodyHeight * 0.5; // Keys sit on top of the base
  
  // Key dimensions
  const numWhiteKeys = 25; // ~2 octaves + C
  const whiteKeyWidth = 0.036;
  const whiteKeyDepth = 0.24;
  const whiteKeyHeight = 0.025;
  
  const blackKeyWidth = 0.022;
  const blackKeyDepth = 0.15;
  const blackKeyHeight = 0.035;

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- Main Body Chassis ---
  // Base slab
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(totalLength, bodyHeight, totalDepth),
    bodyMat
  );
  base.position.y = 0;
  root.add(base);

  // Back panel / Control housing (slightly taller at the back)
  const backPanelHeight = 0.04;
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(totalLength, backPanelHeight, totalDepth * 0.6),
    bodyMat
  );
  backPanel.position.set(0, bodyHeight / 2 + backPanelHeight / 2, -totalDepth * 0.2);
  root.add(backPanel);

  // --- Control Panel Texture (Procedural) ---
  // Create a texture for the right-side control area
  const texWidth = 256;
  const texHeight = 128;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill background dark gray
  for (let i = 0; i < texWidth * texHeight * 4; i += 4) {
    data[i] = 30;     // R
    data[i + 1] = 30; // G
    data[i + 2] = 35; // B
    data[i + 3] = 255;// A
  }

  // Draw "buttons" (light gray circles/rects) and text lines (white)
  // Helper to draw a rect on the texture buffer
  function drawRect(x, y, w, h, r, g, b) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < texWidth && iy >= 0 && iy < texHeight) {
          const idx = (iy * texWidth + ix) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }

  // Brand text area (top right)
  drawRect(180, 10, 60, 15, 200, 200, 200); // "Brand" block
  drawRect(180, 30, 10, 10, 100, 100, 100); // Small logo
  
  // Buttons row
  for (let i = 0; i < 4; i++) {
    drawRect(160 + i * 20, 60, 16, 16, 150, 150, 160); // Button body
    drawRect(164 + i * 20, 64, 8, 8, 255, 255, 255);   // Button highlight
  }
  
  // Slider/Track
  drawRect(160, 90, 70, 6, 80, 80, 80);
  drawRect(190, 88, 10, 10, 200, 50, 50); // Knob/Slider head

  const controlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  controlTexture.colorSpace = THREE.SRGBColorSpace;
  controlTexture.needsUpdate = true;
  controlTexture.flipY = true;

  const controlPanelMat = new THREE.MeshStandardMaterial({
    map: controlTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Control Panel Geometry (Right side, raised slightly)
  const panelWidth = totalLength * 0.25;
  const panelDepth = totalDepth * 0.5;
  const panelHeight = 0.01;
  const controlPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
    controlPanelMat
  );
  // Position on the right side (positive X), at the back
  controlPanel.position.set(
    totalLength / 2 - panelWidth / 2, 
    bodyHeight + backPanelHeight + panelHeight / 2, 
    -totalDepth * 0.25
  );
  root.add(controlPanel);


  // --- Keys Generation ---
  
  // Pattern for black keys: 0=no, 1=yes (relative to white key index)
  // Standard pattern repeats every 7 white keys: 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0
  // Indices with black keys after them: 0(C), 1(D), 3(F), 4(G), 5(A)
  const hasBlackAfter = [true, true, false, true, true, true, false]; 

  const keybedStartX = -totalLength / 2 + 0.02; // Small margin
  
  // White Keys
  for (let i = 0; i < numWhiteKeys; i++) {
    const x = keybedStartX + i * whiteKeyWidth + whiteKeyWidth / 2;
    const y = keybedY + whiteKeyHeight / 2;
    const z = 0.05; // Slightly forward
    
    const key = new THREE.Mesh(
      new THREE.BoxGeometry(whiteKeyWidth - 0.002, whiteKeyHeight, whiteKeyDepth),
      whiteKeyMat
    );
    key.position.set(x, y, z);
    root.add(key);

    // Black Keys
    if (hasBlackAfter[i % 7]) {
      // Black key sits between this white key and the next
      const bx = x + whiteKeyWidth / 2;
      const by = keybedY + blackKeyHeight / 2;
      const bz = z - (whiteKeyDepth - blackKeyDepth) / 2; // Pushed back slightly

      const bKey = new THREE.Mesh(
        new THREE.BoxGeometry(blackKeyWidth - 0.002, blackKeyHeight, blackKeyDepth),
        blackKeyMat
      );
      bKey.position.set(bx, by, bz);
      root.add(bKey);
    }
  }

  // --- Side Caps / Speakers (Optional detail for realism) ---
  // Small grilles on the far left and right ends of the back panel
  const speakerGrilleGeom = new THREE.BoxGeometry(0.08, 0.03, 0.01);
  const speakerGrilleMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  
  const leftSpeaker = new THREE.Mesh(speakerGrilleGeom, speakerGrilleMat);
  leftSpeaker.position.set(-totalLength / 2 + 0.1, bodyHeight + backPanelHeight / 2, -totalDepth * 0.2);
  root.add(leftSpeaker);

  const rightSpeaker = new THREE.Mesh(speakerGrilleGeom, speakerGrilleMat);
  rightSpeaker.position.set(totalLength / 2 - 0.1, bodyHeight + backPanelHeight / 2, -totalDepth * 0.2);
  root.add(rightSpeaker);


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