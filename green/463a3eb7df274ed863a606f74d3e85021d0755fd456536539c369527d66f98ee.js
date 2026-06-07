export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Weathered rustic wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B7D6B,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Procedural Plaid Fabric Texture
  // Pattern: Tartan with Red, Green, Navy, and Cream lines
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Define colors for the plaid (RGBA)
  const cRed = [140, 40, 40, 255];
  const cGreen = [40, 90, 60, 255];
  const cNavy = [30, 40, 80, 255];
  const cCream = [240, 235, 220, 255];
  const cDarkRed = [90, 20, 20, 255];

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      let r = cRed[0], g = cRed[1], b = cRed[2], a = 255;

      // Horizontal bands
      const hy = y % 64;
      if (hy > 2 && hy < 10) { r = cGreen[0]; g = cGreen[1]; b = cGreen[2]; }
      if (hy > 12 && hy < 16) { r = cNavy[0]; g = cNavy[1]; b = cNavy[2]; }
      if (hy > 30 && hy < 34) { r = cCream[0]; g = cCream[1]; b = cCream[2]; }
      if (hy > 48 && hy < 56) { r = cGreen[0]; g = cGreen[1]; b = cGreen[2]; }

      // Vertical bands (blend simply by averaging or overwriting for crispness)
      const hx = x % 64;
      let vr = r, vg = g, vb = b;
      
      if (hx > 2 && hx < 10) { vr = cGreen[0]; vg = cGreen[1]; vb = cGreen[2]; }
      if (hx > 12 && hx < 16) { vr = cNavy[0]; vg = cNavy[1]; vb = cNavy[2]; }
      if (hx > 30 && hx < 34) { vr = cCream[0]; vg = cCream[1]; vb = cCream[2]; }
      if (hx > 48 && hx < 56) { vr = cGreen[0]; vg = cGreen[1]; vb = cGreen[2]; }

      // Simple blending logic for intersections
      // If vertical stripe is active, it dominates or mixes
      if (hx > 2 && hx < 56) {
         // Mix horizontal base with vertical stripe color roughly
         r = Math.floor((r + vr) / 2);
         g = Math.floor((g + vg) / 2);
         b = Math.floor((b + vb) / 2);
      }

      const i = (y * texSize + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  const plaidTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  plaidTexture.colorSpace = THREE.SRGBColorSpace;
  plaidTexture.wrapS = THREE.RepeatWrapping;
  plaidTexture.wrapT = THREE.RepeatWrapping;
  plaidTexture.repeat.set(3, 3); // Repeat pattern across cushions
  plaidTexture.needsUpdate = true;

  const fabricMat = new THREE.MeshStandardMaterial({
    map: plaidTexture,
    metalness: 0.0,
    roughness: 0.9,
    color: 0xffffff, // Keep white to let texture colors show true
  });

  // --- Dimensions ---
  const postW = 0.09;
  const postD = 0.09;
  const postH = 1.9;
  const width = 1.3;
  const depth = 0.85;
  const seatH = 0.42;
  const cushionThick = 0.14;
  const railH = 0.08;
  const railW = 0.08;

  // --- Frame Construction ---

  // 1. Posts (4 corners)
  const postGeom = new THREE.BoxGeometry(postW, postH, postD);
  const postPositions = [
    [-width/2, postH/2, -depth/2], // Back Left
    [ width/2, postH/2, -depth/2], // Back Right
    [-width/2, postH/2,  depth/2], // Front Left
    [ width/2, postH/2,  depth/2], // Front Right
  ];

  for (const pos of postPositions) {
    const post = new THREE.Mesh(postGeom, woodMat);
    post.position.set(...pos);
    root.add(post);

    // Add subtle peg details on posts (cylinders)
    const pegGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8);
    pegGeom.rotateZ(Math.PI/2);
    
    // Front face pegs
    const peg1 = new THREE.Mesh(pegGeom, woodMat);
    peg1.position.set(pos[0] + (pos[0]>0?1:-1)*(postW/2 + 0.02), seatH + 0.1, pos[2] + (pos[2]>0?1:-1)*(postD/2 + 0.02));
    // Rotate peg to face outwards
    if(pos[0] < 0) peg1.rotation.y = -Math.PI/2;
    if(pos[0] > 0) peg1.rotation.y = Math.PI/2;
    if(pos[2] < 0) peg1.rotation.y = Math.PI; 
    // Simplification: Just place small cylinders sticking out of sides
    root.add(peg1);
  }

  // 2. Lower Side Rails (Left and Right)
  const sideRailLen = depth - postW;
  const sideRailGeom = new THREE.BoxGeometry(postW, railH, sideRailLen);
  
  const leftRail = new THREE.Mesh(sideRailGeom, woodMat);
  leftRail.position.set(-width/2, seatH - railH/2, 0);
  root.add(leftRail);

  const rightRail = new THREE.Mesh(sideRailGeom, woodMat);
  rightRail.position.set(width/2, seatH - railH/2, 0);
  root.add(rightRail);

  // 3. Lower Front/Back Rails
  const frontBackRailLen = width - postW;
  const fbRailGeom = new THREE.BoxGeometry(frontBackRailLen, railH, postD);

  const backRail = new THREE.Mesh(fbRailGeom, woodMat);
  backRail.position.set(0, seatH - railH/2, -depth/2);
  root.add(backRail);

  const frontRail = new THREE.Mesh(fbRailGeom, woodMat);
  frontRail.position.set(0, seatH - railH/2, depth/2);
  root.add(frontRail);

  // 4. Canopy Top Frame
  const canopyH = postH - 0.1;
  const topSideLen = depth - postW;
  const topFBLen = width - postW;
  
  const topSideGeom = new THREE.BoxGeometry(postW, railH * 1.2, topSideLen);
  const topFBGeom = new THREE.BoxGeometry(topFBLen, railH * 1.2, postD);

  // Top Side Rails
  const topLeftRail = new THREE.Mesh(topSideGeom, woodMat);
  topLeftRail.position.set(-width/2, canopyH, 0);
  root.add(topLeftRail);

  const topRightRail = new THREE.Mesh(topSideGeom, woodMat);
  topRightRail.position.set(width/2, canopyH, 0);
  root.add(topRightRail);

  // Top Front/Back Rails
  const topBackRail = new THREE.Mesh(topFBGeom, woodMat);
  topBackRail.position.set(0, canopyH, -depth/2);
  root.add(topBackRail);

  const topFrontRail = new THREE.Mesh(topFBGeom, woodMat);
  topFrontRail.position.set(0, canopyH, depth/2);
  root.add(topFrontRail);

  // 5. Backrest Slats (Spindles)
  const slatGeom = new THREE.CylinderGeometry(0.018, 0.018, seatH - 0.1, 8);
  const slatCount = 9;
  const slatSpacing = (width - postW * 2) / (slatCount + 1);
  
  for (let i = 1; i <= slatCount; i++) {
    const slat = new THREE.Mesh(slatGeom, woodMat);
    const x = -width/2 + postW/2 + i * slatSpacing;
    slat.position.set(x, seatH + (seatH - 0.1)/2 - 0.05, -depth/2 + postD/2 + 0.02);
    root.add(slat);
  }
  
  // Top rail for backrest slats
  const backrestTopRailGeom = new THREE.BoxGeometry(width - postW * 2, 0.06, 0.04);
  const backrestTopRail = new THREE.Mesh(backrestTopRailGeom, woodMat);
  backrestTopRail.position.set(0, seatH + (seatH - 0.1) - 0.03, -depth/2 + postD/2 + 0.02);
  root.add(backrestTopRail);

  // 6. Side Armrest Slats (Shorter)
  const armSlatCount = 5;
  const armSlatSpacing = (depth - postD * 2) / (armSlatCount + 1);
  const armSlatH = 0.35;
  const armSlatGeom = new THREE.CylinderGeometry(0.018, 0.018, armSlatH, 8);

  for (let i = 1; i <= armSlatCount; i++) {
    const z = -depth/2 + postD/2 + i * armSlatSpacing;
    
    // Left side
    const slatL = new THREE.Mesh(armSlatGeom, woodMat);
    slatL.position.set(-width/2 + postW/2 + 0.02, seatH + armSlatH/2, z);
    root.add(slatL);

    // Right side
    const slatR = new THREE.Mesh(armSlatGeom, woodMat);
    slatR.position.set(width/2 - postW/2 - 0.02, seatH + armSlatH/2, z);
    root.add(slatR);
  }

  // Armrest Top Rails
  const armTopRailGeom = new THREE.BoxGeometry(0.06, 0.05, depth - postD * 2);
  const armTopL = new THREE.Mesh(armTopRailGeom, woodMat);
  armTopL.position.set(-width/2 + postW/2 + 0.02, seatH + armSlatH, 0);
  root.add(armTopL);

  const armTopR = new THREE.Mesh(armTopRailGeom, woodMat);
  armTopR.position.set(width/2 - postW/2 - 0.02, seatH + armSlatH, 0);
  root.add(armTopR);

  // 7. Base Slats (under cushions)
  const baseSlatGeom = new THREE.BoxGeometry(width - postW * 2 - 0.05, 0.03, 0.08);
  for(let i=0; i<5; i++) {
      const z = -depth/2 + postD + 0.05 + i * ((depth - postD*2 - 0.1)/4);
      const baseSlat = new THREE.Mesh(baseSlatGeom, woodMat);
      baseSlat.position.set(0, seatH - railH/2 - 0.015, z);
      root.add(baseSlat);
  }

  // 8. Cushions
  // Seat Cushions (2 distinct modules)
  const seatCushW = (width - postW * 2 - 0.1) / 2;
  const seatCushD = depth - postD * 2 - 0.1;
  const seatCushGeom = new THREE.BoxGeometry(seatCushW, cushionThick, seatCushD);
  
  // Soften edges visually by scaling slightly or just positioning
  // Left Seat Cushion
  const seatCushL = new THREE.Mesh(seatCushGeom, fabricMat);
  seatCushL.position.set(-width/4, seatH + cushionThick/2, 0);
  root.add(seatCushL);

  // Right Seat Cushion
  const seatCushR = new THREE.Mesh(seatCushGeom, fabricMat);
  seatCushR.position.set(width/4, seatH + cushionThick/2, 0);
  root.add(seatCushR);

  // Back Cushions (2 distinct modules, leaning back)
  const backCushH = seatH - 0.15;
  const backCushW = seatCushW;
  const backCushThick = 0.10;
  const backCushGeom = new THREE.BoxGeometry(backCushW, backCushH, backCushThick);

  const backCushL = new THREE.Mesh(backCushGeom, fabricMat);
  // Position: leaning against back slats
  backCushL.position.set(-width/4, seatH + backCushH/2 + 0.05, -depth/2 + postD + backCushThick/2 + 0.05);
  backCushL.rotation.x = -0.1; // Slight recline
  root.add(backCushL);

  const backCushR = new THREE.Mesh(backCushGeom, fabricMat);
  backCushR.position.set(width/4, seatH + backCushH/2 + 0.05, -depth/2 + postD + backCushThick/2 + 0.05);
  backCushR.rotation.x = -0.1;
  root.add(backCushR);

  // 9. Cross Bracing (Bottom X or diagonal)
  const braceGeom = new THREE.BoxGeometry(0.06, 0.04, 0.6);
  const braceL = new THREE.Mesh(braceGeom, woodMat);
  braceL.position.set(-width/2 + 0.2, 0.1, 0);
  braceL.rotation.y = Math.PI / 4;
  root.add(braceL);
  
  const braceR = new THREE.Mesh(braceGeom, woodMat);
  braceR.position.set(width/2 - 0.2, 0.1, 0);
  braceR.rotation.y = Math.PI / 4;
  root.add(braceR);

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