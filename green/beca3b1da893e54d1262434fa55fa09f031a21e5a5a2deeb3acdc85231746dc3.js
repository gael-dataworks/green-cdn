export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Softer material for ear cushions (fabric/leatherette)
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Dark grille material
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Cable material
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Procedural Texture for Grille & Logo ---
  // Creates a 256x256 texture with a dot grid pattern and the "WAVE" logo
  function createHeadphoneTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    // Helper to set pixel
    const setPixel = (x, y, r, g, b) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return;
      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    };

    // Fill background (dark grey)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0x11;
      data[i + 1] = 0x11;
      data[i + 2] = 0x11;
      data[i + 3] = 255;
    }

    // Draw Grille Dots (grid pattern)
    const dotSpacing = 8;
    const dotRadius = 2;
    for (let y = 0; y < size; y += dotSpacing) {
      for (let x = 0; x < size; x += dotSpacing) {
        // Skip the center area where the logo goes
        const dx = x - size / 2;
        const dy = y - size / 2;
        if (dx * dx + dy * dy < 2500) continue; // Clear circle for logo

        for (let dyDot = -dotRadius; dyDot <= dotRadius; dyDot++) {
          for (let dxDot = -dotRadius; dxDot <= dotRadius; dxDot++) {
            if (dxDot * dxDot + dyDot * dyDot <= dotRadius * dotRadius) {
              setPixel(x + dxDot, y + dyDot, 0x05, 0x05, 0x05);
            }
          }
        }
      }
    }

    // Draw "WAVE" Logo in white block letters
    // Simple 5x7 bitmap font logic scaled up
    const letters = {
      'W': [
        [1,0,0,0,1], [1,0,0,0,1], [1,0,1,0,1], [1,0,1,0,1], [1,0,1,0,1], [1,1,0,1,1], [0,0,0,0,0]
      ],
      'A': [
        [0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,1,1,1,1], [1,0,0,0,1], [1,0,0,0,1], [0,0,0,0,0]
      ],
      'V': [
        [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,0,1,0], [0,1,0,1,0], [0,0,1,0,0], [0,0,0,0,0]
      ],
      'E': [
        [1,1,1,1,1], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,1,1,1,1]
      ]
    };

    const word = "WAVE";
    const charWidth = 20;
    const charHeight = 28;
    const startX = (size - (word.length * charWidth)) / 2;
    const startY = (size - charHeight) / 2;

    for (let c = 0; c < word.length; c++) {
      const charMap = letters[word[c]];
      const offsetX = startX + c * charWidth;
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (charMap[r][col] === 1) {
            // Draw a block for the pixel
            for (let py = 0; py < 4; py++) {
              for (let px = 0; px < 4; px++) {
                setPixel(offsetX + col * 4 + px, startY + r * 4 + py, 255, 255, 255);
              }
            }
          }
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const logoTexture = createHeadphoneTexture();
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  });

  // --- Headband ---
  // Arching curve from left to right
  const headbandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.85, 0.6, 0),
    new THREE.Vector3(-0.85, 1.35, 0),
    new THREE.Vector3(0, 1.55, 0),
    new THREE.Vector3(0.85, 1.35, 0),
    new THREE.Vector3(0.85, 0.6, 0),
  ]);

  const headbandGeom = new THREE.TubeGeometry(headbandCurve, 64, 0.12, 16, false);
  const headband = new THREE.Mesh(headbandGeom, plasticMat);
  // Flatten the tube to look like a strap (scale Z)
  headband.scale.set(1, 1, 0.45);
  root.add(headband);

  // --- Earcups ---
  const earcupRadius = 0.55;
  const earcupDepth = 0.25;
  
  // Base geometry for the earcup shell (flattened sphere)
  const earcupShellGeom = new THREE.SphereGeometry(earcupRadius, 32, 32);
  // We will scale this mesh to flatten it
  
  // Geometry for the cushion (Torus)
  const cushionGeom = new THREE.TorusGeometry(earcupRadius * 0.75, 0.06, 16, 32);

  // Geometry for the grille/logo plate (Circle)
  const grilleGeom = new THREE.CircleGeometry(earcupRadius * 0.85, 32);

  function createEarcup(side) {
    const group = new THREE.Group();
    const xPos = side * 0.95;
    
    // 1. Main Shell
    const shell = new THREE.Mesh(earcupShellGeom, plasticMat);
    shell.scale.set(1, 1.1, 0.4); // Flatten Z to make it a shallow dome
    // Rotate shell so the flat side faces inward (-X for right cup, +X for left cup)
    // Default sphere is centered. We want the "back" of the sphere to be the outer face.
    // Actually, let's just position it.
    // For Right Cup (side=1): Outer face is +X. Inner face is -X.
    // For Left Cup (side=-1): Outer face is -X. Inner face is +X.
    // Sphere geometry: we can just scale Z to flatten it along the head's width axis?
    // No, headphones are flattened along the X axis (width of head).
    // So scale X to 0.4.
    shell.scale.set(0.4, 1.1, 1); 
    
    // But wait, the grille is on the OUTSIDE.
    // If I flatten X, the outside is at x = +radius (for right cup).
    // So for Right Cup: Shell at x=0.95. Flatten X.
    // For Left Cup: Shell at x=-0.95. Flatten X.
    
    // Let's adjust:
    // Right Cup: Center at 0.95. Outer face at ~1.2. Inner face at ~0.7.
    // Left Cup: Center at -0.95. Outer face at ~-1.2. Inner face at ~-0.7.
    
    shell.position.x = xPos;
    group.add(shell);

    // 2. Cushion (Torus)
    // Torus lies in XY plane by default. We want it in YZ plane (facing X).
    const cushion = new THREE.Mesh(cushionGeom, cushionMat);
    cushion.rotation.y = Math.PI / 2;
    cushion.position.x = xPos + (side * 0.1); // Push slightly inward
    group.add(cushion);

    // 3. Grille/Logo Plate
    // Circle lies in XY plane. We want it in YZ plane (facing X).
    const grille = new THREE.Mesh(grilleGeom, logoMat);
    grille.rotation.y = Math.PI / 2;
    // Place on the outer face
    grille.position.x = xPos + (side * 0.22); 
    group.add(grille);

    // 4. Joint Connector (Cylinder)
    // Connects headband end to earcup top
    const jointGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
    const joint = new THREE.Mesh(jointGeom, plasticMat);
    joint.rotation.z = Math.PI / 2; // Horizontal cylinder
    joint.position.x = xPos;
    joint.position.y = 0.5; // Top of earcup
    group.add(joint);

    // 5. Buttons (Left cup only, based on reference)
    if (side === -1) {
      const btnGeom = new THREE.CapsuleGeometry(0.03, 0.08, 4, 8);
      const btn1 = new THREE.Mesh(btnGeom, plasticMat);
      btn1.rotation.x = Math.PI / 2;
      btn1.position.set(xPos - 0.22, -0.2, 0.15); // Bottom edge
      group.add(btn1);
      
      const btn2 = new THREE.Mesh(btnGeom, plasticMat);
      btn2.rotation.x = Math.PI / 2;
      btn2.position.set(xPos - 0.22, -0.2, -0.15);
      group.add(btn2);
    }
    
    // 6. Right cup specific: Slider/Button on side
    if (side === 1) {
       const sliderGeom = new THREE.BoxGeometry(0.02, 0.08, 0.04);
       const slider = new THREE.Mesh(sliderGeom, plasticMat);
       slider.position.set(xPos + 0.22, 0, 0.2);
       group.add(slider);
    }

    return group;
  }

  const leftEarcup = createEarcup(-1);
  // Tilt left cup slightly forward and in
  leftEarcup.rotation.x = 0.1;
  leftEarcup.rotation.y = 0.3;
  leftEarcup.rotation.z = 0.1;
  root.add(leftEarcup);

  const rightEarcup = createEarcup(1);
  // Tilt right cup slightly forward and in
  rightEarcup.rotation.x = 0.1;
  rightEarcup.rotation.y = -0.3;
  rightEarcup.rotation.z = -0.1;
  root.add(rightEarcup);

  // --- Cable ---
  // Extends from bottom of left earcup (viewer's left)
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, -0.4, 0.2), // Start bottom left cup
    new THREE.Vector3(-0.8, -0.8, 0.5),
    new THREE.Vector3(-0.5, -1.2, 0.8),
    new THREE.Vector3(0, -1.4, 1.0),
  ]);
  
  const cableGeom = new THREE.TubeGeometry(cableCurve, 32, 0.025, 8, false);
  const cable = new THREE.Mesh(cableGeom, cableMat);
  root.add(cable);

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