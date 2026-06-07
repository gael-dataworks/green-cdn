export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed Steel (Body, Base, Spout)
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Black Matte Plastic (Lid, Knob)
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Translucent Blue Plastic (Handle Outer)
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.3,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Glowing Blue LED (Handle Inner)
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x0088ff,
    emissiveIntensity: 2.5,
    toneMapped: false,
  });

  // Logo Material (uses generated texture)
  const logoTexture = createLogoTexture(THREE);
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: logoTexture,
    metalness: 0.0,
    roughness: 0.5,
    transparent: true,
  });

  // --- Dimensions ---
  const bodyRadius = 0.32;
  const bodyHeight = 0.75;
  const baseHeight = 0.15;
  const totalHeight = bodyHeight + baseHeight;
  const centerY = baseHeight / 2 + bodyHeight / 2;

  // --- 1. Base ---
  // Lower wider part
  const baseLowerGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 32);
  const baseLower = new THREE.Mesh(baseLowerGeom, steelMat);
  baseLower.position.y = 0.03;
  root.add(baseLower);

  // Upper connector part
  const baseUpperGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.09, 32);
  const baseUpper = new THREE.Mesh(baseUpperGeom, steelMat);
  baseUpper.position.y = 0.105;
  root.add(baseUpper);

  // --- 2. Main Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- 3. Spout (Left Side, -X) ---
  // Triangular profile extruded
  const spoutShape = new THREE.Shape();
  spoutShape.moveTo(0, 0);
  spoutShape.lineTo(0.12, 0.08); // Tip
  spoutShape.lineTo(0, 0.16);    // Top connection
  spoutShape.lineTo(0, 0);       // Close
  const spoutGeom = new THREE.ExtrudeGeometry(spoutShape, {
    depth: 0.14,
    bevelEnabled: false,
  });
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  // Position on the left side of the body
  spout.position.set(-bodyRadius - 0.02, baseHeight + bodyHeight * 0.85, 0);
  spout.rotation.z = Math.PI / 2; // Point tip along -X
  spout.rotation.y = Math.PI / 2; // Face forward/side
  root.add(spout);

  // --- 4. Lid (Top) ---
  const lidGeom = new THREE.CylinderGeometry(bodyRadius + 0.01, bodyRadius + 0.01, 0.04, 32);
  const lid = new THREE.Mesh(lidGeom, blackPlasticMat);
  lid.position.y = baseHeight + bodyHeight + 0.02;
  root.add(lid);

  // Lid Knob
  const knobGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
  const knob = new THREE.Mesh(knobGeom, blackPlasticMat);
  knob.position.y = baseHeight + bodyHeight + 0.055;
  root.add(knob);

  // --- 5. Handle (Right Side, +X) ---
  // Curve path for the handle
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.05, baseHeight + bodyHeight * 0.85, 0),   // Top attach
    new THREE.Vector3(bodyRadius + 0.18, baseHeight + bodyHeight * 0.85, 0.05), // Top curve out
    new THREE.Vector3(bodyRadius + 0.22, baseHeight + bodyHeight * 0.45, 0.08), // Mid curve
    new THREE.Vector3(bodyRadius + 0.18, baseHeight + bodyHeight * 0.15, 0.05), // Bottom curve in
    new THREE.Vector3(bodyRadius + 0.05, baseHeight + bodyHeight * 0.15, 0),    // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, bluePlasticMat);
  root.add(handle);

  // Inner Glow Strip (follows similar path but tighter and glowing)
  const glowPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.08, baseHeight + bodyHeight * 0.80, 0.02),
    new THREE.Vector3(bodyRadius + 0.15, baseHeight + bodyHeight * 0.45, 0.05),
    new THREE.Vector3(bodyRadius + 0.08, baseHeight + bodyHeight * 0.20, 0.02),
  ]);
  const glowGeom = new THREE.TubeGeometry(glowPath, 10, 0.015, 8, false);
  const glowStrip = new THREE.Mesh(glowGeom, glowMat);
  root.add(glowStrip);

  // --- 6. Logo (Front, +Z) ---
  const logoWidth = 0.18;
  const logoHeight = 0.06;
  const logoGeom = new THREE.PlaneGeometry(logoWidth, logoHeight);
  const logoMesh = new THREE.Mesh(logoGeom, logoMat);
  // Position on front of body, slightly offset to prevent z-fighting
  logoMesh.position.set(0, baseHeight + bodyHeight * 0.65, bodyRadius + 0.006);
  root.add(logoMesh);

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

function createLogoTexture(THREE) {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);

  // Fill background (transparent white/silver)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 255; // G
    data[i + 2] = 255; // B
    data[i + 3] = 0;   // Alpha (transparent)
  }

  // Helper to draw a filled rectangle (letter part)
  function drawRect(x, y, w, h) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          data[idx] = 20;     // Dark gray text
          data[idx + 1] = 20;
          data[idx + 2] = 20;
          data[idx + 3] = 255; // Opaque
        }
      }
    }
  }

  // Draw "NURCAL" block letters
  const startX = 40;
  const startY = 50;
  const charW = 14;
  const charH = 24;
  const gap = 6;
  const stroke = 4;

  // N
  drawRect(startX, startY, stroke, charH);
  drawRect(startX + charW - stroke, startY, stroke, charH);
  // Diagonal for N (approximated with steps)
  for (let i = 0; i < charH; i++) {
    const x = startX + stroke + (i / charH) * (charW - 2 * stroke);
    drawRect(Math.floor(x), startY + i, stroke, 1);
  }

  // U
  const ux = startX + charW + gap;
  drawRect(ux, startY, stroke, charH);
  drawRect(ux + charW - stroke, startY, stroke, charH);
  drawRect(ux, startY + charH - stroke, charW, stroke);

  // R
  const rx = ux + charW + gap;
  drawRect(rx, startY, stroke, charH);
  drawRect(rx, startY, charW, stroke); // Top bar
  drawRect(rx, startY + charH / 2, charW - stroke, stroke); // Mid bar
  drawRect(rx + charW - stroke, startY + charH / 2, stroke, charH / 2); // Leg
  // Curve of R
  drawRect(rx + charW - stroke * 2, startY + stroke, stroke, charH / 2 - stroke);

  // C
  const cx = rx + charW + gap;
  drawRect(cx, startY, charW, stroke); // Top
  drawRect(cx, startY + charH - stroke, charW, stroke); // Bottom
  drawRect(cx, startY, stroke, charH); // Left

  // A
  const ax = cx + charW + gap;
  drawRect(ax, startY, stroke, charH);
  drawRect(ax + charW - stroke, startY, stroke, charH);
  drawRect(ax, startY + charH / 2, charW, stroke); // Crossbar
  // Roof
  for (let i = 0; i < charH / 2; i++) {
    drawRect(ax + stroke + i, startY + i, 1, 1);
    drawRect(ax + charW - stroke - i, startY + i, 1, 1);
  }

  // L
  const lx = ax + charW + gap;
  drawRect(lx, startY, stroke, charH);
  drawRect(lx, startY + charH - stroke, charW, stroke);

  // Draw "COFFEE" smaller below
  const subY = startY + charH + 10;
  const subH = 10;
  const subW = 8;
  const subGap = 4;
  let sx = startX + 10;

  // C
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH - 3, subW, 3);
  drawRect(sx, subY, 3, subH);
  sx += subW + subGap;

  // O
  drawRect(sx, subY, 3, subH);
  drawRect(sx + subW - 3, subY, 3, subH);
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH - 3, subW, 3);
  sx += subW + subGap;

  // F
  drawRect(sx, subY, 3, subH);
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH / 2, subW - 2, 3);
  sx += subW + subGap;

  // F
  drawRect(sx, subY, 3, subH);
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH / 2, subW - 2, 3);
  sx += subW + subGap;

  // E
  drawRect(sx, subY, 3, subH);
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH / 2, subW - 2, 3);
  drawRect(sx, subY + subH - 3, subW, 3);
  sx += subW + subGap;

  // E
  drawRect(sx, subY, 3, subH);
  drawRect(sx, subY, subW, 3);
  drawRect(sx, subY + subH / 2, subW - 2, 3);
  drawRect(sx, subY + subH - 3, subW, 3);

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}