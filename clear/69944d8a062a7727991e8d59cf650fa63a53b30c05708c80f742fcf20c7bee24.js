export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass body: Light blue, transparent, physical
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Dark base plug inside the bottle to simulate thick glass/liquid at bottom
  const darkGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // Cap: Brushed silver metal
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Dip tube: Translucent white plastic
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.6,
  });

  // --- Procedural Textures ---

  // 1. Cap Pattern Texture (Engraved Swirls)
  const capSize = 256;
  const capData = new Uint8Array(capSize * capSize * 4);
  const capCtx = { w: capSize, h: capSize, data: capData };
  
  // Fill base silver
  for (let i = 0; i < capData.length; i += 4) {
    capData[i] = 200;     // R
    capData[i + 1] = 200; // G
    capData[i + 2] = 200; // B
    capData[i + 3] = 255; // A
  }

  // Draw swirls (darker lines for engraving effect)
  // We simulate engraving by drawing darker lines on the texture
  // Map texture coords (u, v) to angle and height
  for (let y = 0; y < capSize; y++) {
    for (let x = 0; x < capSize; x++) {
      const u = x / capSize; // 0..1 around circumference
      const v = y / capSize; // 0..1 up height
      
      // Convert u to angle 0..2PI
      const angle = u * Math.PI * 2;
      
      // Pattern logic: Intersecting sine waves to create swirls
      // Swirl 1
      const s1 = Math.sin(angle * 2 + v * 10);
      // Swirl 2
      const s2 = Math.sin(angle * 3 - v * 8);
      
      // Combine to find lines
      const line1 = Math.abs(s1) < 0.15;
      const line2 = Math.abs(s2) < 0.15;
      
      if (line1 || line2) {
        const idx = (y * capSize + x) * 4;
        // Darken the pixel to simulate depth/engraving shadow
        capData[idx] = 140;
        capData[idx + 1] = 140;
        capData[idx + 2] = 140;
      }
    }
  }

  const capTexture = new THREE.DataTexture(capData, capSize, capSize, THREE.RGBAFormat);
  capTexture.colorSpace = THREE.SRGBColorSpace;
  capTexture.wrapS = THREE.RepeatWrapping;
  capTexture.wrapT = THREE.ClampToEdgeWrapping;
  capTexture.needsUpdate = true;
  capMat.map = capTexture;
  // Use the same texture for roughness to make lines look etched (rougher)
  capMat.roughnessMap = capTexture;
  capMat.roughness = 0.5; // Base roughness


  // 2. Bottle Label Texture ("XANADU")
  const labelW = 512;
  const labelH = 256;
  const labelData = new Uint8Array(labelW * labelH * 4);
  
  // Fill transparent base
  for (let i = 0; i < labelData.length; i += 4) {
    labelData[i] = 255;
    labelData[i + 1] = 255;
    labelData[i + 2] = 255;
    labelData[i + 3] = 0; // Transparent
  }

  // Helper to draw text-like shapes (blocky serif-ish)
  function drawChar(cx, cy, char, color) {
    // Simple bitmap font simulation for XANADU
    // This is a very rough approximation to avoid external assets
    const scale = 15;
    const yOffset = 40;
    
    // We will draw directly into the buffer for specific letters
    // X
    if (char === 'X') {
      for(let i=0; i<scale*1.2; i++) {
         for(let j=0; j<2; j++) {
            setPixel(cx + i, cy + yOffset + i, color);
            setPixel(cx + i, cy + yOffset + scale*1.2 - i, color);
         }
      }
    }
    // A
    else if (char === 'A') {
      for(let i=0; i<scale; i++) {
        for(let j=0; j<2; j++) {
           setPixel(cx + i, cy + yOffset + i, color);
           setPixel(cx + scale*1.2 - i, cy + yOffset + i, color);
        }
        if (i > scale*0.4 && i < scale*0.6) {
           for(let k=0; k<scale*0.6; k++) setPixel(cx + k, cy + yOffset + i, color);
        }
      }
    }
    // N
    else if (char === 'N') {
      for(let i=0; i<scale*1.2; i++) {
        for(let j=0; j<2; j++) {
           setPixel(cx, cy + yOffset + i, color);
           setPixel(cx + scale*1.2, cy + yOffset + i, color);
        }
        // Diagonal
        const diagX = cx + (i / (scale*1.2)) * scale*1.2;
        setPixel(diagX, cy + yOffset + i, color);
      }
    }
    // D
    else if (char === 'D') {
      for(let i=0; i<scale*1.2; i++) {
        setPixel(cx, cy + yOffset + i, color);
        const width = Math.sin((i/scale*1.2) * Math.PI) * scale * 0.8;
        for(let w=0; w<width; w++) setPixel(cx + w, cy + yOffset + i, color);
      }
    }
    // U
    else if (char === 'U') {
      for(let i=0; i<scale*1.2; i++) {
        setPixel(cx, cy + yOffset + i, color);
        setPixel(cx + scale*1.2, cy + yOffset + i, color);
      }
      for(let i=0; i<scale*1.2; i++) {
         if (i > scale*0.8) {
            for(let w=0; w<scale*1.2; w++) setPixel(cx + w, cy + yOffset + i, color);
         }
      }
    }
  }

  function setPixel(x, y, color) {
    if (x < 0 || x >= labelW || y < 0 || y >= labelH) return;
    const idx = (Math.floor(y) * labelW + Math.floor(x)) * 4;
    labelData[idx] = color[0];
    labelData[idx + 1] = color[1];
    labelData[idx + 2] = color[2];
    labelData[idx + 3] = 200; // Semi-transparent white for etching look
  }

  // Draw "XANADU" centered
  const startX = labelW / 2 - 100;
  const startY = labelH / 2 - 20;
  const spacing = 35;
  const text = "XANADU";
  const textColor = [200, 220, 255]; // Light blueish white

  for (let i = 0; i < text.length; i++) {
    drawChar(startX + i * spacing, startY, text[i], textColor);
  }

  const labelTexture = new THREE.DataTexture(labelData, labelW, labelH, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.wrapS = THREE.ClampToEdgeWrapping;
  labelTexture.wrapT = THREE.ClampToEdgeWrapping;
  labelTexture.needsUpdate = true;
  
  // Apply label to glass material
  // We use a separate material for the front or mix via map. 
  // Since Lathe UVs wrap, we can just assign the map.
  glassMat.map = labelTexture;
  glassMat.transparent = true;
  // Blend mode for etching effect
  glassMat.blending = THREE.NormalBlending;


  // --- Geometries ---

  // 1. Bottle Body (Lathe)
  // Profile points [radius, y]
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00),   // Center bottom
    new THREE.Vector2(0.24, 0.00),   // Outer bottom edge
    new THREE.Vector2(0.24, 0.03),   // Slight rim
    new THREE.Vector2(0.23, 0.55),   // Main body up to shoulder
    new THREE.Vector2(0.20, 0.65),   // Shoulder curve start
    new THREE.Vector2(0.12, 0.75),   // Neck start
    new THREE.Vector2(0.10, 0.80),   // Lip
    new THREE.Vector2(0.00, 0.80),   // Top center
  ];
  
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const bottleBody = new THREE.Mesh(bodyGeom, glassMat);
  root.add(bottleBody);

  // 2. Dark Base (Inner cylinder to simulate thick glass bottom)
  const baseGeom = new THREE.CylinderGeometry(0.20, 0.20, 0.08, 32);
  const basePlug = new THREE.Mesh(baseGeom, darkGlassMat);
  basePlug.position.y = 0.04;
  root.add(basePlug);

  // 3. Cap (Cylinder)
  const capH = 0.25;
  const capR = 0.11;
  const capGeom = new THREE.CylinderGeometry(capR, capR, capH, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 0.80 + capH / 2;
  root.add(cap);

  // 4. Dip Tube (Tube)
  // Path: Start at neck, go down, curve at bottom
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.75, 0),   // Top (nozzle area)
    new THREE.Vector3(0, 0.40, 0),   // Straight down
    new THREE.Vector3(0, 0.15, 0),   // Start curve
    new THREE.Vector3(0.10, 0.05, 0), // Curve out
    new THREE.Vector3(0.15, 0.02, 0)  // End near bottom edge
  ]);
  
  const tubeGeom = new THREE.TubeGeometry(tubePath, 20, 0.015, 8, false);
  const dipTube = new THREE.Mesh(tubeGeom, tubeMat);
  // Rotate to align with bottle axis if needed, but path is defined in local space
  // The path is already aligned with Y up.
  root.add(dipTube);

  // 5. Nozzle/Sprayer (Small cylinder under cap)
  const nozzleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.4 });
  const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
  nozzle.position.y = 0.775;
  root.add(nozzle);


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