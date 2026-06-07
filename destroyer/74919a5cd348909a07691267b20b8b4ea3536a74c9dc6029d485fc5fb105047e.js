export default function generate(THREE) {
  // --- Materials ---
  // Matte black plastic for the main body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Slightly darker/glossy black for details (grille, LEDs)
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.4,
  });

  // Bright blue plastic for the button
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // --- Geometry Helpers ---

  // 1. Main Body (Lathe)
  // Profile from bottom-center outwards and up
  const profilePoints = [
    new THREE.Vector2(0, 0),          // Bottom center
    new THREE.Vector2(0.24, 0),       // Bottom edge
    new THREE.Vector2(0.24, 0.04),    // Base thickness
    new THREE.Vector2(0.20, 0.04),    // Base step in
    new THREE.Vector2(0.17, 0.55),    // Body taper (narrowest)
    new THREE.Vector2(0.21, 0.85),    // Upper flare
    new THREE.Vector2(0.225, 0.92),   // Top rim outer
    new THREE.Vector2(0.225, 0.96),   // Top rim top
    new THREE.Vector2(0.19, 0.96),    // Top rim inner (opening)
    new THREE.Vector2(0.19, 0.85),    // Inner wall down
    new THREE.Vector2(0.21, 0.04),    // Inner base
    new THREE.Vector2(0, 0.04),       // Close bottom inner
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  // Center the lathe geometry vertically (it builds from 0 up)
  body.position.y = -0.48; 

  // 2. Base Disc (Visual separation at bottom)
  const baseGeom = new THREE.CylinderGeometry(0.245, 0.245, 0.02, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = -0.49;

  // 3. Top Rim Ring (Visual separation at top)
  const rimGeom = new THREE.TorusGeometry(0.215, 0.015, 16, 32);
  const topRim = new THREE.Mesh(rimGeom, bodyMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.44;

  // 4. Front Panel (Rounded Rectangle)
  // We create a shape and extrude it slightly to sit on the surface
  const panelShape = new THREE.Shape();
  const pw = 0.14; // panel width
  const ph = 0.35; // panel height
  const pr = 0.03; // corner radius
  // Draw rounded rect
  panelShape.moveTo(-pw/2 + pr, -ph/2);
  panelShape.lineTo(pw/2 - pr, -ph/2);
  panelShape.quadraticCurveTo(pw/2, -ph/2, pw/2, -ph/2 + pr);
  panelShape.lineTo(pw/2, ph/2 - pr);
  panelShape.quadraticCurveTo(pw/2, ph/2, pw/2 - pr, ph/2);
  panelShape.lineTo(-pw/2 + pr, ph/2);
  panelShape.quadraticCurveTo(-pw/2, ph/2, -pw/2, ph/2 - pr);
  panelShape.lineTo(-pw/2, -ph/2 + pr);
  panelShape.quadraticCurveTo(-pw/2, -ph/2, -pw/2 + pr, -ph/2);

  const panelGeom = new THREE.ExtrudeGeometry(panelShape, {
    depth: 0.005,
    bevelEnabled: false,
  });
  // Center the geometry
  panelGeom.center();
  const panel = new THREE.Mesh(panelGeom, bodyMat);
  // Position on the front surface (Z is forward)
  // The body radius at panel height (y ~ 0) is approx 0.18
  panel.position.set(0, -0.05, 0.175);
  // Slight curvature simulation: scale X slightly less than Z? 
  // For a flat panel on a curve, just placing it is usually fine for this scale.
  // But let's rotate it slightly to match the surface normal if needed. 
  // For simplicity, we keep it flat facing Z, slightly inset/outsed.
  // To make it look "inset", we can use a slightly darker material or just rely on shadows.
  // Let's use the same material but place it 0.002 BEHIND the theoretical surface
  panel.position.z = 0.172; 


  // 5. Blue Button
  const buttonGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 24);
  const button = new THREE.Mesh(buttonGeom, buttonMat);
  // Position relative to panel (panel is at y=-0.05)
  // Button is near top of panel
  button.position.set(0, 0.08, 0.01); // Local to panel
  panel.add(button);

  // 6. Grille (Speaker holes)
  // Column of small cylinders below the button
  const holeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8);
  const holeMat = detailMat;
  const holeCount = 12;
  const holeSpacing = 0.012;
  const startY = -0.05; // Below button
  
  // Use InstancedMesh for the grille holes
  const grilleMesh = new THREE.InstancedMesh(holeGeom, holeMat, holeCount);
  const dummy = new THREE.Object3D();
  
  for (let i = 0; i < holeCount; i++) {
    // Staggered grid or single column? Image looks like a single column of dots
    // Actually looks like a grid of dots. Let's do 2 columns.
    const col = i % 2;
    const row = Math.floor(i / 2);
    const hx = (col - 0.5) * 0.025; // spread
    const hy = startY - (row * holeSpacing);
    
    dummy.position.set(hx, hy, 0.01); // On panel surface
    dummy.rotation.x = Math.PI / 2; // Holes face out
    dummy.updateMatrix();
    grilleMesh.setMatrixAt(i, dummy.matrix);
  }
  panel.add(grilleMesh);

  // 7. Text "mini CO2" (Procedural DataTexture)
  // We need to draw this into a texture and apply it to a plane
  const texWidth = 128;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Helper to draw a pixel
  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= texWidth || y < 0 || y >= texHeight) return;
    const idx = (y * texWidth + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // Simple 5x7 bitmap font map (1 = on, 0 = off)
  const font = {
    'm': [
      [1,0,0,0,1], [1,1,0,1,1], [1,0,1,0,1], [1,0,0,0,1], [1,0,0,0,1]
    ],
    'i': [
      [0,1,0], [0,0,0], [0,1,0], [0,1,0], [0,1,0]
    ],
    'n': [
      [1,0,0,0,1], [1,1,0,0,1], [1,0,1,0,1], [1,0,0,1,1], [1,0,0,0,1]
    ],
    ' ': [
      [0,0], [0,0], [0,0], [0,0], [0,0]
    ],
    'C': [
      [0,1,1,1,0], [1,0,0,0,0], [1,0,0,0,0], [1,0,0,0,0], [0,1,1,1,0]
    ],
    'O': [
      [0,1,1,1,0], [1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1], [0,1,1,1,0]
    ],
    '2': [
      [0,1,1,1,0], [1,0,0,0,1], [0,0,0,1,0], [0,0,1,0,0], [1,1,1,1,1]
    ]
  };

  const textStr = "mini CO2";
  const charSize = 6; // Scale factor
  const letterSpacing = 2;
  let cursorX = 10;
  const cursorY = 10;

  // Fill background black (transparent)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0;
  }

  for (let c = 0; c < textStr.length; c++) {
    const char = textStr[c];
    const map = font[char] || font[' '];
    if (map) {
      for (let r = 0; r < map.length; r++) {
        for (let col = 0; col < map[r].length; col++) {
          if (map[r][col] === 1) {
            // Draw block
            for (let dy = 0; dy < charSize; dy++) {
              for (let dx = 0; dx < charSize; dx++) {
                setPixel(cursorX + col * charSize + dx, cursorY + r * charSize + dy, 200, 200, 200, 255);
              }
            }
          }
        }
      }
      cursorX += (map[0].length * charSize) + letterSpacing;
    }
  }

  const textTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.needsUpdate = true;
  // Flip Y because texture coords are bottom-up usually, but canvas/DataTexture is top-down? 
  // Three.js DataTexture is bottom-up. Our drawing loop was top-down (y=0 at top).
  // So we need to flip the texture or the UVs. Let's flip the texture data vertically.
  // Actually, simpler: just draw from bottom up in the loop next time, or flip now.
  // Let's flip the buffer vertically.
  const rowSize = texWidth * 4;
  const halfH = Math.floor(texHeight / 2);
  for (let y = 0; y < halfH; y++) {
    const topOffset = y * rowSize;
    const botOffset = (texHeight - 1 - y) * rowSize;
    for (let x = 0; x < rowSize; x++) {
      const temp = data[topOffset + x];
      data[topOffset + x] = data[botOffset + x];
      data[botOffset + x] = temp;
    }
  }
  textTexture.needsUpdate = true;

  const textMat = new THREE.MeshBasicMaterial({ 
    map: textTexture, 
    transparent: true, 
    side: THREE.DoubleSide 
  });
  const textGeom = new THREE.PlaneGeometry(0.08, 0.04);
  const textMesh = new THREE.Mesh(textGeom, textMat);
  // Position at bottom of panel
  textMesh.position.set(0, -0.14, 0.015);
  // Scale to fit
  textMesh.scale.set(1, 1, 1);
  panel.add(textMesh);


  // 8. Top LEDs (Two small dots)
  const ledGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
  const ledLeft = new THREE.Mesh(ledGeom, detailMat);
  ledLeft.rotation.x = Math.PI / 2;
  ledLeft.position.set(-0.05, 0.40, 0.21); // On the upper flare
  // Rotate to face normal
  ledLeft.lookAt(new THREE.Vector3(-0.05, 0.40, 0.5));
  
  const ledRight = new THREE.Mesh(ledGeom, detailMat);
  ledRight.rotation.x = Math.PI / 2;
  ledRight.position.set(0.05, 0.40, 0.21);
  ledRight.lookAt(new THREE.Vector3(0.05, 0.40, 0.5));


  // --- Assembly ---
  const root = new THREE.Group();
  root.add(body);
  root.add(base);
  root.add(topRim);
  root.add(panel);
  root.add(ledLeft);
  root.add(ledRight);

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