export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Soft foam/leather for ear cushions
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x0f0f0f,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Metallic gray for the slider/yoke mechanism
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Darker plastic for buttons
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Cable material
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Procedural Texture for Right Earcup Grille (Mesh + Logo) ---
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const logoText = "WHJE";
  
  // Helper to draw on texture
  function setPixel(x, y, r, g, b) {
    const idx = (y * texSize + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  // Fill base dark gray
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // Mesh pattern: small dots
      const isDot = (x % 4 === 0) && (y % 4 === 0);
      const val = isDot ? 40 : 20; // Dark gray base with slightly lighter dots
      setPixel(x, y, val, val, val);
    }
  }

  // Draw "WHJE" logo roughly in center
  // Simple blocky font simulation
  function drawChar(char, startX, startY, size, colorVal) {
    // Very simplified rasterization for 4 letters
    // W
    if (char === 'W') {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = startX + i;
          const y = startY + j;
          if (x < texSize && y < texSize) {
            // W shape logic
            const leftBar = i < size * 0.25;
            const rightBar = i > size * 0.75;
            const vShape = (j > i * 1.5) && (j > (size - i) * 1.5);
            if (leftBar || rightBar || vShape) setPixel(x, y, colorVal, colorVal, colorVal);
          }
        }
      }
    }
    // H
    if (char === 'H') {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = startX + i;
          const y = startY + j;
          if (x < texSize && y < texSize) {
            const left = i < size * 0.25;
            const right = i > size * 0.75;
            const mid = (j > size * 0.4 && j < size * 0.6);
            if (left || right || mid) setPixel(x, y, colorVal, colorVal, colorVal);
          }
        }
      }
    }
    // J
    if (char === 'J') {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = startX + i;
          const y = startY + j;
          if (x < texSize && y < texSize) {
            const top = j < size * 0.2;
            const right = i > size * 0.75;
            const bottomCurve = (j > size * 0.8) && (i < size * 0.6);
            if (top || right || bottomCurve) setPixel(x, y, colorVal, colorVal, colorVal);
          }
        }
      }
    }
    // E
    if (char === 'E') {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = startX + i;
          const y = startY + j;
          if (x < texSize && y < texSize) {
            const left = i < size * 0.25;
            const top = j < size * 0.2;
            const mid = (j > size * 0.4 && j < size * 0.6);
            const bottom = j > size * 0.8;
            if (left || top || mid || bottom) setPixel(x, y, colorVal, colorVal, colorVal);
          }
        }
      }
    }
  }

  // Draw letters centered
  const letterSize = 24;
  const totalWidth = letterSize * 4 + 10; // 4 letters + spacing
  let startLogoX = (texSize - totalWidth) / 2;
  let startLogoY = (texSize - letterSize) / 2;
  
  drawChar('W', startLogoX, startLogoY, letterSize, 220);
  drawChar('H', startLogoX + letterSize + 2, startLogoY, letterSize, 220);
  drawChar('J', startLogoX + (letterSize + 2) * 2, startLogoY, letterSize, 220);
  drawChar('E', startLogoX + (letterSize + 2) * 3, startLogoY, letterSize, 220);

  const grilleTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.needsUpdate = true;

  const grilleMat = new THREE.MeshStandardMaterial({
    map: grilleTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Geometry Construction ---

  // 1. Headband Arch
  // Curve from left earcup top to right earcup top
  const headbandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.35, 0.0),   // Left connection
    new THREE.Vector3(-0.15, 0.55, 0.0),   // Left curve start
    new THREE.Vector3(0.0, 0.65, 0.05),    // Top center (slight back tilt)
    new THREE.Vector3(0.15, 0.55, 0.0),    // Right curve start
    new THREE.Vector3(0.18, 0.35, 0.0),    // Right connection
  ]);
  
  const headbandGeom = new THREE.TubeGeometry(headbandCurve, 64, 0.045, 16, false);
  const headband = new THREE.Mesh(headbandGeom, plasticMat);
  root.add(headband);

  // 2. Earcup Housing (Shared Geometry, scaled/rotated per side)
  // Main body is a rounded capsule/cylinder shape
  const earcupBodyGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 32);
  // We will scale this to be oval and deeper
  
  function createEarcup(side) {
    const group = new THREE.Group();
    const dir = side === 'left' ? -1 : 1;

    // Main Housing
    const housing = new THREE.Mesh(earcupBodyGeom, plasticMat);
    // Scale to make it oval and deeper
    housing.scale.set(1.4, 1.6, 1.0); 
    // Rotate to face inward
    housing.rotation.z = Math.PI / 2; 
    housing.position.set(dir * 0.12, 0.0, 0.0);
    group.add(housing);

    // Outer Face Plate (where grille/cushion attaches)
    const facePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.02, 32),
      plasticMat
    );
    facePlate.rotation.z = Math.PI / 2;
    facePlate.position.set(dir * 0.16, 0.0, 0.0);
    // Scale to match housing oval
    facePlate.scale.set(1.4, 1.6, 1.0);
    group.add(facePlate);

    // Grille (Right side only has visible logo in reference, left is hidden but similar)
    if (side === 'right') {
      const grille = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.025, 32),
        grilleMat
      );
      grille.rotation.z = Math.PI / 2;
      grille.position.set(dir * 0.175, 0.0, 0.0);
      grille.scale.set(1.4, 1.6, 1.0);
      group.add(grille);
      
      // Small port indicator on grille
      const port = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
      );
      port.rotation.z = Math.PI / 2;
      port.position.set(dir * 0.19, -0.08, 0.0);
      port.scale.set(1.0, 0.6, 1.0);
      group.add(port);
    } else {
        // Left side grille (plain dark mesh)
        const grille = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.025, 32),
            new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 })
        );
        grille.rotation.z = Math.PI / 2;
        grille.position.set(dir * 0.175, 0.0, 0.0);
        grille.scale.set(1.4, 1.6, 1.0);
        group.add(grille);
    }

    // Cushion (Torus)
    const cushion = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.035, 16, 32),
      cushionMat
    );
    cushion.rotation.z = Math.PI / 2;
    cushion.position.set(dir * 0.14, 0.0, 0.0);
    cushion.scale.set(1.4, 1.6, 1.0);
    group.add(cushion);

    // Buttons (Right side)
    if (side === 'right') {
      const btnGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 16);
      
      const btn1 = new THREE.Mesh(btnGeom, buttonMat);
      btn1.rotation.x = Math.PI / 2;
      btn1.position.set(dir * 0.12, 0.05, 0.04); // Top button
      group.add(btn1);

      const btn2 = new THREE.Mesh(btnGeom, buttonMat);
      btn2.rotation.x = Math.PI / 2;
      btn2.position.set(dir * 0.12, -0.05, 0.04); // Bottom button
      group.add(btn2);
    }

    // Yoke/Slider mechanism connecting to headband
    const yoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.12, 0.03),
      metalMat
    );
    // Position yoke to connect housing top to headband end
    yoke.position.set(dir * 0.12, 0.12, 0.0);
    // Tilt slightly to match headband curve angle
    yoke.rotation.x = side === 'left' ? 0.2 : -0.2;
    group.add(yoke);

    return group;
  }

  const leftEarcup = createEarcup('left');
  const rightEarcup = createEarcup('right');
  root.add(leftEarcup);
  root.add(rightEarcup);

  // 3. Cable (Left side bottom)
  const cablePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, -0.15, 0.05), // Start at bottom of left earcup
    new THREE.Vector3(-0.25, -0.25, 0.1),  // Curve out
    new THREE.Vector3(-0.35, -0.35, 0.0),  // End point
  ]);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(cablePath, 20, 0.008, 8, false),
    cableMat
  );
  root.add(cable);

  // Normalize
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