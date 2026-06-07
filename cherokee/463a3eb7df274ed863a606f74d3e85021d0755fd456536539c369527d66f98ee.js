export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Weathered rustic wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B7D6B,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Plaid fabric procedural texture
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  // Plaid colors: Deep Red, Forest Green, Navy Blue, Cream
  const cRed = [139, 0, 0];
  const cGreen = [0, 100, 0];
  const cBlue = [0, 0, 139];
  const cCream = [245, 245, 220];
  const cDark = [50, 50, 50]; // for thin grid lines

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = cCream[0], g = cCream[1], b = cCream[2];
      
      // Create stripes based on position
      // Vertical stripes
      const vx = x % 64;
      if (vx < 8) { r = cRed[0]; g = cRed[1]; b = cRed[1]; } // Red band
      else if (vx >= 20 && vx < 24) { r = cGreen[0]; g = cGreen[1]; b = cGreen[2]; } // Green band
      else if (vx >= 40 && vx < 48) { r = cBlue[0]; g = cBlue[1]; b = cBlue[2]; } // Blue band
      else if (vx === 12 || vx === 32 || vx === 56) { r = cDark[0]; g = cDark[1]; b = cDark[2]; } // Thin lines

      // Horizontal stripes (blend)
      const vy = y % 64;
      let hr = cCream[0], hg = cCream[1], hb = cCream[2];
      if (vy < 8) { hr = cRed[0]; hg = cRed[1]; hb = cRed[2]; }
      else if (vy >= 20 && vy < 24) { hr = cGreen[0]; hg = cGreen[1]; hb = cGreen[2]; }
      else if (vy >= 40 && vy < 48) { hr = cBlue[0]; hg = cBlue[1]; hb = cBlue[2]; }
      else if (vy === 12 || vy === 32 || vy === 56) { hr = cDark[0]; hg = cDark[1]; hb = cDark[2]; }

      // Simple additive blend for plaid effect
      const idx = (y * W + x) * 4;
      data[idx] = Math.min(255, (r + hr) / 2);
      data[idx + 1] = Math.min(255, (g + hg) / 2);
      data[idx + 2] = Math.min(255, (b + hb) / 2);
      data[idx + 3] = 255;
    }
  }
  const plaidTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  plaidTexture.colorSpace = THREE.SRGBColorSpace;
  plaidTexture.needsUpdate = true;
  plaidTexture.wrapS = THREE.RepeatWrapping;
  plaidTexture.wrapT = THREE.RepeatWrapping;
  fabricMat.map = plaidTexture;

  // --- Dimensions ---
  const legW = 0.09;
  const legD = 0.09;
  const benchW = 1.3;
  const benchD = 0.75;
  const seatH = 0.45;
  const totalH = 1.7;
  const beamThick = 0.1;
  const slatW = 0.035;
  const cushionThick = 0.12;

  // --- Frame Construction ---

  // 1. Legs (4 posts)
  const legGeom = new THREE.BoxGeometry(legW, totalH, legD);
  const legPositions = [
    { x: -benchW / 2, z: -benchD / 2 }, // Back Left
    { x: benchW / 2, z: -benchD / 2 },  // Back Right
    { x: -benchW / 2, z: benchD / 2 },  // Front Left
    { x: benchW / 2, z: benchD / 2 }    // Front Right
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeom, woodMat);
    leg.position.set(pos.x, totalH / 2, pos.z);
    root.add(leg);
  });

  // 2. Seat Base Platform
  const seatBaseGeom = new THREE.BoxGeometry(benchW + legW, 0.05, benchD + legD);
  const seatBase = new THREE.Mesh(seatBaseGeom, woodMat);
  seatBase.position.set(0, seatH, 0);
  root.add(seatBase);

  // 3. Backrest Structure
  const backZ = -benchD / 2;
  const backrestTopY = seatH + 0.55;
  const backrestBotY = seatH + 0.15;
  
  // Top rail
  const backTopRailGeom = new THREE.BoxGeometry(benchW, beamThick, beamThick);
  const backTopRail = new THREE.Mesh(backTopRailGeom, woodMat);
  backTopRail.position.set(0, backrestTopY + beamThick/2, backZ);
  root.add(backTopRail);

  // Bottom rail (above seat base)
  const backBotRailGeom = new THREE.BoxGeometry(benchW, beamThick, beamThick);
  const backBotRail = new THREE.Mesh(backBotRailGeom, woodMat);
  backBotRail.position.set(0, backrestBotY - beamThick/2, backZ);
  root.add(backBotRail);

  // Vertical Slats
  const slatCount = 11;
  const slatGap = benchW / slatCount;
  const slatH = backrestTopY - backrestBotY;
  const slatGeom = new THREE.BoxGeometry(slatW, slatH, 0.04);
  
  for (let i = 1; i < slatCount; i++) {
    const slat = new THREE.Mesh(slatGeom, woodMat);
    slat.position.set(-benchW/2 + i * slatGap, (backrestTopY + backrestBotY)/2, backZ);
    root.add(slat);
  }

  // 4. Armrests
  const armW = 0.12;
  const armH = 0.06;
  const armL = benchD + 0.1; // Extends slightly forward
  const armGeom = new THREE.BoxGeometry(armW, armH, armL);
  
  // Left Arm
  const armLeft = new THREE.Mesh(armGeom, woodMat);
  armLeft.position.set(-benchW/2 - armW/2 + legW/2, seatH + 0.25, 0);
  root.add(armLeft);

  // Right Arm
  const armRight = new THREE.Mesh(armGeom, woodMat);
  armRight.position.set(benchW/2 + armW/2 - legW/2, seatH + 0.25, 0);
  root.add(armRight);

  // 5. Roof Frame
  const roofY = totalH - 0.05;
  const roofBeamL = benchW + legW;
  const roofBeamD = benchD + legW;
  
  // Side beams (connecting front/back posts)
  const roofSideGeom = new THREE.BoxGeometry(legW, beamThick, roofBeamD);
  const roofSideLeft = new THREE.Mesh(roofSideGeom, woodMat);
  roofSideLeft.position.set(-benchW/2, roofY, 0);
  root.add(roofSideLeft);

  const roofSideRight = new THREE.Mesh(roofSideGeom, woodMat);
  roofSideRight.position.set(benchW/2, roofY, 0);
  root.add(roofSideRight);

  // Front/Back beams (connecting side posts)
  const roofFrontBackGeom = new THREE.BoxGeometry(roofBeamL, beamThick * 0.8, legW);
  const roofFront = new THREE.Mesh(roofFrontBackGeom, woodMat);
  roofFront.position.set(0, roofY - 0.02, benchD/2);
  root.add(roofFront);

  const roofBack = new THREE.Mesh(roofFrontBackGeom, woodMat);
  roofBack.position.set(0, roofY - 0.02, -benchD/2);
  root.add(roofBack);

  // Cross beam in middle of roof
  const roofCrossGeom = new THREE.BoxGeometry(legW, beamThick * 0.8, roofBeamD);
  const roofCross = new THREE.Mesh(roofCrossGeom, woodMat);
  roofCross.position.set(0, roofY - 0.02, 0);
  root.add(roofCross);

  // 6. Lower Bracing & Stretchers
  // Side stretchers (connecting legs under seat)
  const stretcherY = seatH - 0.15;
  const stretcherGeom = new THREE.BoxGeometry(legW, 0.05, benchD - 0.1);
  const stretcherLeft = new THREE.Mesh(stretcherGeom, woodMat);
  stretcherLeft.position.set(-benchW/2, stretcherY, 0);
  root.add(stretcherLeft);
  
  const stretcherRight = new THREE.Mesh(stretcherGeom, woodMat);
  stretcherRight.position.set(benchW/2, stretcherY, 0);
  root.add(stretcherRight);

  // Front stretcher
  const frontStretcherGeom = new THREE.BoxGeometry(benchW - 0.1, 0.05, legW);
  const frontStretcher = new THREE.Mesh(frontStretcherGeom, woodMat);
  frontStretcher.position.set(0, stretcherY, benchD/2);
  root.add(frontStretcher);

  // Diagonal brace (visible on side in reference)
  // Connects front leg (under arm) to back leg (under seat)
  const braceStart = new THREE.Vector3(-benchW/2 + legW/2, stretcherY + 0.05, benchD/2 - 0.1);
  const braceEnd = new THREE.Vector3(-benchW/2 + legW/2, seatH - 0.05, -benchD/2 + 0.2);
  const braceMid = braceStart.clone().lerp(braceEnd, 0.5);
  const braceLen = braceStart.distanceTo(braceEnd);
  const braceGeom = new THREE.BoxGeometry(0.04, braceLen, 0.06);
  const brace = new THREE.Mesh(braceGeom, woodMat);
  brace.position.copy(braceMid);
  brace.lookAt(braceEnd);
  brace.rotateX(Math.PI / 2); // Align cylinder/box axis
  root.add(brace);

  // --- Cushions ---
  // Two seat cushions, two back cushions
  const cushionW = (benchW - 0.15) / 2;
  const cushionD = benchD - 0.1;
  const seatCushionGeom = new THREE.BoxGeometry(cushionW, cushionThick, cushionD);
  const backCushionGeom = new THREE.BoxGeometry(cushionW, 0.45, 0.08);

  // Seat Cushions
  const seatCushLeft = new THREE.Mesh(seatCushionGeom, fabricMat);
  seatCushLeft.position.set(-cushionW/2 - 0.05, seatH + cushionThick/2, 0);
  root.add(seatCushLeft);

  const seatCushRight = new THREE.Mesh(seatCushionGeom, fabricMat);
  seatCushRight.position.set(cushionW/2 + 0.05, seatH + cushionThick/2, 0);
  root.add(seatCushRight);

  // Back Cushions
  const backCushLeft = new THREE.Mesh(backCushionGeom, fabricMat);
  backCushLeft.position.set(-cushionW/2 - 0.05, seatH + 0.25, backZ + 0.04);
  root.add(backCushLeft);

  const backCushRight = new THREE.Mesh(backCushionGeom, fabricMat);
  backCushRight.position.set(cushionW/2 + 0.05, seatH + 0.25, backZ + 0.04);
  root.add(backCushRight);

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