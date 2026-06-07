export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Slightly glossier black for keys
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Off-white for white keys
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Material for the control panel texture (emissive for labels)
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  // Approximate proportions for a slim 88-key digital piano
  const totalWidth = 1.30;
  const totalDepth = 0.32;
  const baseHeight = 0.06;
  const topSectionHeight = 0.05;
  const topSectionDepth = 0.14;
  
  const keyCount = 88;
  const whiteKeyWidth = totalWidth / keyCount;
  const whiteKeyLength = 0.22;
  const whiteKeyHeight = 0.015;
  
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const blackKeyLength = 0.13;
  const blackKeyHeight = 0.025;

  // --- Chassis Geometry ---
  
  // 1. Lower Base (Keybed area + front lip)
  // Extends full width, most of depth
  const baseGeom = new THREE.BoxGeometry(totalWidth, baseHeight, totalDepth);
  const baseMesh = new THREE.Mesh(baseGeom, bodyMat);
  baseMesh.position.y = baseHeight / 2;
  // Shift back slightly so front lip is visible
  baseMesh.position.z = (totalDepth - topSectionDepth) / 2; 
  root.add(baseMesh);

  // 2. Upper Section (Control panel + rear housing)
  // Sits on top of the back part of the base
  const topGeom = new THREE.BoxGeometry(totalWidth, topSectionHeight, topSectionDepth);
  const topMesh = new THREE.Mesh(topGeom, bodyMat);
  topMesh.position.y = baseHeight + topSectionHeight / 2;
  topMesh.position.z = - (totalDepth - topSectionDepth) / 2;
  root.add(topMesh);

  // 3. Side Grilles / Speakers (Subtle details on top left/right)
  const grilleGeom = new THREE.BoxGeometry(0.12, 0.01, 0.08);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  
  const grilleLeft = new THREE.Mesh(grilleGeom, grilleMat);
  grilleLeft.position.set(-totalWidth/2 + 0.15, baseHeight + topSectionHeight + 0.001, -0.05);
  root.add(grilleLeft);

  const grilleRight = new THREE.Mesh(grilleGeom, grilleMat);
  grilleRight.position.set(totalWidth/2 - 0.15, baseHeight + topSectionHeight + 0.001, -0.05);
  root.add(grilleRight);

  // --- Keys ---

  // We need to place 52 white keys and 36 black keys.
  // White keys are the base layer. Black keys sit on top.
  // Pattern of black keys (semitones): W B W B W W B W B W B W (repeat)
  // Indices with black keys after them: 0, 2, 4, 5, 7, 9, 11 (0-based white key index)
  // But simpler: iterate 0..87. If it's a black key position, place black key.
  
  // White Keys InstancedMesh
  const whiteKeyGeom = new THREE.BoxGeometry(whiteKeyWidth * 0.95, whiteKeyHeight, whiteKeyLength);
  // Round the front edge slightly via scale or just box is fine for low poly
  const whiteKeys = new THREE.InstancedMesh(whiteKeyGeom, whiteKeyMat, 52);
  
  // Black Keys InstancedMesh
  const blackKeyGeom = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
  const blackKeys = new THREE.InstancedMesh(blackKeyGeom, blackKeyMat, 36);

  const dummy = new THREE.Object3D();
  let whiteIdx = 0;
  let blackIdx = 0;

  // Map of semitone to key type (0=white, 1=black) for one octave: 0,1,0,1,0,0,1,0,1,0,1,0
  // Pattern: W, B, W, B, W, W, B, W, B, W, B, W
  const octavePattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  
  const startX = -totalWidth / 2 + whiteKeyWidth / 2;

  for (let i = 0; i < keyCount; i++) {
    const octaveIndex = i % 12;
    const isBlack = octavePattern[octaveIndex] === 1;
    
    // Calculate X position
    // White keys are evenly spaced
    const xWhite = startX + i * whiteKeyWidth;

    if (!isBlack) {
      // Place White Key
      dummy.position.set(xWhite, baseHeight + whiteKeyHeight/2, 0); // z=0 is front of keybed roughly
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      whiteKeys.setMatrixAt(whiteIdx++, dummy.matrix);
    } else {
      // Place Black Key
      // Black keys are centered between the surrounding white keys
      // The previous white key was at i-1. Current conceptual position is between i-1 and i.
      // Actually, in the loop, 'i' is the semitone index. 
      // If i is black, it sits between white key (i-1) and white key (i+1 conceptually in chromatic scale)
      // But in white key index space:
      // White key index for the one to the left is whiteIdx - 1.
      // White key index for the one to the right is whiteIdx.
      // So position is average of those two white keys.
      
      const xLeft = startX + (whiteIdx - 1) * whiteKeyWidth;
      const xRight = startX + whiteIdx * whiteKeyWidth;
      const xBlack = (xLeft + xRight) / 2;
      
      // Black keys are raised higher and set back
      const zBlack = -0.04; // Set back from front edge
      
      dummy.position.set(xBlack, baseHeight + whiteKeyHeight + blackKeyHeight/2, zBlack);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      blackKeys.setMatrixAt(blackIdx++, dummy.matrix);
    }
  }
  
  root.add(whiteKeys);
  root.add(blackKeys);

  // --- Control Panel Texture & Decal ---
  // The control panel is on the top-right of the upper section.
  // We will create a DataTexture for the labels and buttons.
  
  const texWidth = 512;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill black background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 10;     // R
    data[i+1] = 10;   // G
    data[i+2] = 10;   // B
    data[i+3] = 255;  // A
  }
  
  // Helper to draw text/rects roughly (procedural pixel manipulation)
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = ((y + dy) * texWidth + (x + dx)) * 4;
        if (idx < data.length) {
          data[idx] = r;
          data[idx+1] = g;
          data[idx+2] = b;
          data[idx+3] = 255;
        }
      }
    }
  }

  function drawText(text, x, y, size, r, g, b) {
    // Very crude bitmap text representation for "CASIO" and buttons
    // Since we can't load fonts, we draw simple shapes representing buttons
    // and a block for the logo.
  }

  // Draw Logo Area (Left side of panel)
  // "CASIO" block
  drawRect(20, 40, 100, 30, 200, 200, 200); // Casio logo placeholder
  
  // Draw "Privia" text area
  drawRect(20, 80, 80, 20, 150, 150, 150);

  // Draw Buttons (Right side of panel)
  // Power button
  drawRect(300, 40, 40, 40, 50, 200, 50); // Greenish power LED look
  drawRect(315, 50, 10, 20, 0, 0, 0); // Power symbol-ish
  
  // Volume buttons
  drawRect(360, 40, 30, 30, 200, 200, 200);
  drawRect(400, 40, 30, 30, 200, 200, 200);
  
  // Function buttons row
  for(let i=0; i<6; i++) {
    drawRect(300 + i*35, 100, 25, 25, 180, 180, 180);
  }

  const controlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  controlTexture.colorSpace = THREE.SRGBColorSpace;
  controlTexture.needsUpdate = true;
  controlTexture.flipY = true; // DataTextures often need flipping depending on UVs

  const panelDecalMat = new THREE.MeshStandardMaterial({
    map: controlTexture,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x222222,
    emissiveMap: controlTexture,
    emissiveIntensity: 0.2
  });

  // Panel Plane
  // Position on top of the right side of the upper chassis
  const panelWidth = totalWidth * 0.4;
  const panelDepth = topSectionDepth * 0.8;
  const panelGeom = new THREE.PlaneGeometry(panelWidth, panelDepth);
  const panelMesh = new THREE.Mesh(panelGeom, panelDecalMat);
  
  // Rotate to face up
  panelMesh.rotation.x = -Math.PI / 2;
  // Position: Top of upper section, aligned to right
  panelMesh.position.set(
    totalWidth/2 - panelWidth/2 - 0.02, // Slight margin from edge
    baseHeight + topSectionHeight + 0.002, // Just above surface
    - (totalDepth - topSectionDepth) / 2 - topSectionDepth/2 + panelDepth/2 + 0.02 // Aligned to back-right
  );
  
  root.add(panelMesh);

  // --- Power LED Indicator (Small glowing dot) ---
  const ledGeom = new THREE.CircleGeometry(0.008, 16);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const led = new THREE.Mesh(ledGeom, ledMat);
  led.rotation.x = -Math.PI / 2;
  led.position.set(
    totalWidth/2 - 0.08,
    baseHeight + topSectionHeight + 0.003,
    - (totalDepth - topSectionDepth) / 2 - topSectionDepth/2 + 0.04
  );
  root.add(led);

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