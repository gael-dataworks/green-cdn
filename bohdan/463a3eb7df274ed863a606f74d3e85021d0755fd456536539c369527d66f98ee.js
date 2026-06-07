export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Weathered Wood Material
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8c857b,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Plaid Fabric Material (Procedural DataTexture)
  // Colors based on reference: Navy, Forest Green, Deep Red, Cream/White
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  const colorNavy = new THREE.Color(0x1a2b4a);
  const colorGreen = new THREE.Color(0x2d5a3f);
  const colorRed = new THREE.Color(0x8a2323);
  const colorCream = new THREE.Color(0xd4c5a3);
  const colorWhite = new THREE.Color(0xe8e8e8);

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      let col = colorNavy;

      // Simple plaid logic using modulo arithmetic
      // Vertical stripes
      const vx = x % 32;
      if (vx > 26 && vx < 30) col = colorWhite;
      else if (vx > 20 && vx <= 26) col = colorRed;
      else if (vx > 14 && vx <= 20) col = colorGreen;
      else if (vx > 8 && vx <= 14) col = colorWhite;
      else if (vx > 2 && vx <= 8) col = colorRed;
      
      // Horizontal stripes (blend/override)
      const vy = y % 32;
      let hCol = colorNavy;
      if (vy > 26 && vy < 30) hCol = colorWhite;
      else if (vy > 20 && vy <= 26) hCol = colorRed;
      else if (vy > 14 && vy <= 20) hCol = colorGreen;
      else if (vy > 8 && vy <= 14) hCol = colorWhite;
      else if (vy > 2 && vy <= 8) hCol = colorRed;

      // Simple blending: if either is light, take the lighter one, else average
      // For a crisper plaid, we can just pick based on dominance or mix
      if (hCol.equals(colorWhite) || col.equals(colorWhite)) {
        col = colorWhite;
      } else if (!hCol.equals(colorNavy) && !col.equals(colorNavy)) {
        // Intersection of colors
        col.copy(col).lerp(hCol, 0.5);
      } else if (!hCol.equals(colorNavy)) {
        col = hCol;
      }

      const i = (y * texSize + x) * 4;
      data[i] = Math.floor(col.r * 255);
      data[i + 1] = Math.floor(col.g * 255);
      data[i + 2] = Math.floor(col.b * 255);
      data[i + 3] = 255;
    }
  }

  const plaidTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  plaidTexture.colorSpace = THREE.SRGBColorSpace;
  plaidTexture.wrapS = THREE.RepeatWrapping;
  plaidTexture.wrapT = THREE.RepeatWrapping;
  plaidTexture.repeat.set(3, 2); // Repeat across cushions
  plaidTexture.needsUpdate = true;

  const fabricMat = new THREE.MeshStandardMaterial({
    map: plaidTexture,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Dimensions ---
  const postW = 0.08;
  const postH = 1.50;
  const beamH = 0.08;
  const beamW = 0.09;
  const seatW = 1.10;
  const seatD = 0.70;
  const seatH = 0.42;
  const cushionThick = 0.14;
  const backrestH = 0.55;
  
  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Frame: Posts ---
  // Positions: x is +/- width/2, z is +/- depth/2
  const halfW = seatW / 2 + 0.05; // Slightly wider than seat
  const halfD = seatD / 2 + 0.05;
  const postY = postH / 2;

  const fl_post = addBox(postW, postH, postW, woodMat, -halfW, postY, -halfD);
  const fr_post = addBox(postW, postH, postW, woodMat, halfW, postY, -halfD);
  const bl_post = addBox(postW, postH, postW, woodMat, -halfW, postY, halfD);
  const br_post = addBox(postW, postH, postW, woodMat, halfW, postY, halfD);

  // --- Frame: Top Canopy ---
  const topY = postH - beamH / 2;
  // Front & Back beams (long)
  addBox(beamW, beamH, seatW + postW, woodMat, 0, topY, -halfD);
  addBox(beamW, beamH, seatW + postW, woodMat, 0, topY, halfD);
  // Side beams (short, connecting front/back)
  addBox(seatW + postW, beamH, beamW, woodMat, -halfW, topY, 0);
  addBox(seatW + postW, beamH, beamW, woodMat, halfW, topY, 0);

  // --- Frame: Seat Level ---
  const seatFrameY = seatH - beamH / 2;
  // Side rails (long)
  addBox(beamW, beamH, seatD, woodMat, -halfW, seatFrameY, 0);
  addBox(beamW, beamH, seatD, woodMat, halfW, seatFrameY, 0);
  // Front rail
  addBox(seatW, beamH, beamW, woodMat, 0, seatFrameY, -halfD);
  // Back rail (part of backrest structure, slightly higher/thicker potentially, but keeping consistent)
  addBox(seatW, beamH, beamW, woodMat, 0, seatFrameY, halfD);

  // --- Frame: Lower Stretchers ---
  const lowerY = 0.15;
  addBox(beamW, beamH, seatD - 0.1, woodMat, -halfW, lowerY, 0);
  addBox(beamW, beamH, seatD - 0.1, woodMat, halfW, lowerY, 0);
  addBox(seatW - 0.1, beamH, beamW, woodMat, 0, lowerY, -halfD + 0.05);
  addBox(seatW - 0.1, beamH, beamW, woodMat, 0, lowerY, halfD - 0.05);

  // Diagonal Braces under seat (X shape or single diagonals)
  // Visible in image: diagonal from front-side to back-center or similar.
  // Let's add simple cross braces on the sides for stability visual.
  const braceLen = Math.sqrt(Math.pow(seatD - 0.2, 2) + Math.pow(0.1, 2));
  const braceAngle = Math.atan2(seatD - 0.2, 0.1); // Approx
  
  // Simplified: Just boxes rotated
  const braceY = lowerY + 0.05;
  // Left side brace
  const b1 = addBox(0.04, 0.04, seatD - 0.2, woodMat, -halfW + 0.05, braceY, 0, Math.PI / 6, 0, 0);
  // Right side brace
  const b2 = addBox(0.04, 0.04, seatD - 0.2, woodMat, halfW - 0.05, braceY, 0, -Math.PI / 6, 0, 0);


  // --- Backrest ---
  // Vertical spindles between seat frame and a mid-rail
  const spindleCount = 11;
  const spindleW = 0.025;
  const spindleGap = seatW / spindleCount;
  const backrestTopY = seatH + backrestH;
  
  // Backrest Top Rail
  addBox(beamW, beamH, seatW, woodMat, 0, backrestTopY - beamH/2, halfD);

  // Spindles
  for (let i = 0; i < spindleCount; i++) {
    const x = -seatW / 2 + (i + 0.5) * spindleGap;
    const h = backrestH - beamH;
    addBox(spindleW, h, spindleW, woodMat, x, seatH + h / 2, halfD);
  }

  // --- Cushions ---
  // Seat Cushions (2 distinct modules)
  const cushionW = seatW / 2 - 0.04; // Gap between cushions
  const cushionD = seatD - 0.08;
  const cushionY = seatH + cushionThick / 2;
  
  // Left Seat
  addBox(cushionW, cushionThick, cushionD, fabricMat, -cushionW / 2 - 0.02, cushionY, 0);
  // Right Seat
  addBox(cushionW, cushionThick, cushionD, fabricMat, cushionW / 2 + 0.02, cushionY, 0);

  // Back Cushions (2 distinct modules, leaning)
  const backCushionH = backrestH - 0.1;
  const backCushionThick = 0.12;
  const backCushionY = seatH + backCushionH / 2 + 0.05;
  const backCushionZ = halfD - 0.15; // Pushed forward from backrest
  
  // Left Back
  const lb = addBox(cushionW, backCushionH, backCushionThick, fabricMat, -cushionW / 2 - 0.02, backCushionY, backCushionZ);
  lb.rotation.x = -0.15; // Lean back slightly

  // Right Back
  const rb = addBox(cushionW, backCushionH, backCushionThick, fabricMat, cushionW / 2 + 0.02, backCushionY, backCushionZ);
  rb.rotation.x = -0.15;

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