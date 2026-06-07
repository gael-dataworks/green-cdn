export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed steel body
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Matte black lid
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Blue translucent handle
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.3,
    transparent: true,
    opacity: 0.85,
  });

  // Glowing LED strip
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x0088ff,
    emissiveIntensity: 1.5,
  });

  // Logo material (will get map assigned)
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
    transparent: true,
    opacity: 0.9,
  });

  // --- Dimensions ---
  const bodyR = 0.32;
  const bodyH = 0.65;
  const baseR = 0.36;
  const baseH = 0.12;
  const lidH = 0.06;
  const totalH = baseH + bodyH + lidH;
  
  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseR, baseR, baseH, 32);
  const base = new THREE.Mesh(baseGeom, steelMat);
  base.position.y = baseH / 2;
  root.add(base);

  // --- Body ---
  // Lower section (slightly wider seam)
  const bodyLowerH = 0.15;
  const bodyLowerGeom = new THREE.CylinderGeometry(bodyR, bodyR, bodyLowerH, 32);
  const bodyLower = new THREE.Mesh(bodyLowerGeom, steelMat);
  bodyLower.position.y = baseH + bodyLowerH / 2;
  root.add(bodyLower);

  // Upper section (main body)
  const bodyUpperH = bodyH - bodyLowerH;
  const bodyUpperGeom = new THREE.CylinderGeometry(bodyR, bodyR, bodyUpperH, 32);
  const bodyUpper = new THREE.Mesh(bodyUpperGeom, steelMat);
  bodyUpper.position.y = baseH + bodyLowerH + bodyUpperH / 2;
  root.add(bodyUpper);

  // --- Spout ---
  // Triangular prism-like shape using a scaled cone/cylinder
  const spoutL = 0.14;
  const spoutGeom = new THREE.CylinderGeometry(0.02, 0.06, spoutL, 16);
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  // Position on left (-X), angled up and forward
  spout.position.set(-bodyR - spoutL/2, baseH + bodyH - 0.05, 0.05);
  spout.rotation.z = Math.PI / 2; // Point along X
  spout.rotation.y = -Math.PI / 6; // Angle forward
  spout.rotation.x = Math.PI / 8; // Angle up slightly
  root.add(spout);

  // --- Lid ---
  const lidGeom = new THREE.CylinderGeometry(bodyR + 0.01, bodyR + 0.01, lidH, 32);
  const lid = new THREE.Mesh(lidGeom, blackMat);
  lid.position.y = baseH + bodyH + lidH / 2;
  root.add(lid);

  // Lid Knob
  const knobGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
  const knob = new THREE.Mesh(knobGeom, blackMat);
  knob.position.y = baseH + bodyH + lidH + 0.02;
  root.add(knob);

  // --- Handle ---
  // Ergonomic D-shape curve
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyR, baseH + 0.15, 0),       // Bottom attach
    new THREE.Vector3(bodyR + 0.12, baseH + 0.10, 0.05), // Bottom curve out
    new THREE.Vector3(bodyR + 0.18, baseH + 0.40, 0.05), // Mid
    new THREE.Vector3(bodyR + 0.12, baseH + 0.65, 0.05), // Top curve in
    new THREE.Vector3(bodyR, baseH + 0.70, 0),       // Top attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, blueMat);
  root.add(handle);

  // Handle Glow Strip (inner tube)
  const glowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyR + 0.02, baseH + 0.20, 0.02),
    new THREE.Vector3(bodyR + 0.10, baseH + 0.40, 0.02),
    new THREE.Vector3(bodyR + 0.02, baseH + 0.60, 0.02),
  ]);
  const glowGeom = new THREE.TubeGeometry(glowCurve, 10, 0.015, 8, false);
  const glowStrip = new THREE.Mesh(glowGeom, glowMat);
  root.add(glowStrip);

  // --- Logo Texture & Mesh ---
  const logoTexture = createLogoTexture(THREE);
  logoMat.map = logoTexture;
  logoMat.transparent = true;
  
  // Logo plane positioned slightly in front of body
  const logoW = 0.18;
  const logoH = 0.06;
  const logoGeom = new THREE.PlaneGeometry(logoW, logoH);
  const logoMesh = new THREE.Mesh(logoGeom, logoMat);
  // Position: Front (+Z), Height: mid-upper body
  const logoY = baseH + bodyH * 0.65;
  logoMesh.position.set(0, logoY, bodyR + 0.005);
  root.add(logoMesh);

  fitToUnitCube(THREE, root);
  return root;
}

function createLogoTexture(THREE) {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  
  // Clear transparent
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;     // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 0; // A
  }

  // Helper to draw a filled rect
  function fillRect(x, y, w, h, r, g, b, a) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
          const idx = (iy * width + ix) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  // Draw "NURCAL" (Blocky approximation)
  const textY = 20;
  const charW = 14;
  const charH = 30;
  const gap = 6;
  let startX = 40;

  // N
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX + 10, textY, 4, charH, 0, 0, 0, 255);
  // Diagonal
  for (let i = 0; i < charH; i++) {
    const dx = Math.floor((i / charH) * 10);
    fillRect(startX + 2 + dx, textY + i, 2, 2, 0, 0, 0, 255);
  }
  startX += charW + gap;

  // U
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX + 10, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX, textY + charH - 4, 14, 4, 0, 0, 0, 255);
  startX += charW + gap;

  // R
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX, textY, 10, 4, 0, 0, 0, 255); // Top bar
  fillRect(startX, textY + 14, 10, 4, 0, 0, 0, 255); // Mid bar
  fillRect(startX + 10, textY, 4, 14, 0, 0, 0, 255); // Top right
  fillRect(startX + 10, textY + 14, 4, 16, 0, 0, 0, 255); // Leg
  startX += charW + gap;

  // C
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX, textY, 12, 4, 0, 0, 0, 255);
  fillRect(startX, textY + charH - 4, 12, 4, 0, 0, 0, 255);
  startX += charW + gap;

  // A
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX + 10, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX, textY + 14, 14, 4, 0, 0, 0, 255); // Cross
  startX += charW + gap;

  // L
  fillRect(startX, textY, 4, charH, 0, 0, 0, 255);
  fillRect(startX, textY + charH - 4, 12, 4, 0, 0, 0, 255);
  startX += charW + gap;

  // "COFFEE" smaller below
  const smallY = textY + 45;
  const sW = 10;
  const sH = 14;
  const sGap = 4;
  startX = 55;

  // C
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 8, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + sH - 3, 8, 3, 0, 0, 0, 255);
  startX += sW + sGap;

  // O
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX + 7, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 10, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + sH - 3, 10, 3, 0, 0, 0, 255);
  startX += sW + sGap;

  // F
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 8, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + 6, 6, 3, 0, 0, 0, 255);
  startX += sW + sGap;

  // F
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 8, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + 6, 6, 3, 0, 0, 0, 255);
  startX += sW + sGap;

  // E
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 8, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + 6, 6, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + sH - 3, 8, 3, 0, 0, 0, 255);
  startX += sW + sGap;

  // E
  fillRect(startX, smallY, 3, sH, 0, 0, 0, 255);
  fillRect(startX, smallY, 8, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + 6, 6, 3, 0, 0, 0, 255);
  fillRect(startX, smallY + sH - 3, 8, 3, 0, 0, 0, 255);

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
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