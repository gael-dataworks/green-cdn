export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Wood: Walnut/Medium Brown
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Fabric: Patchwork Quilt (Procedural DataTexture)
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Generate Patchwork Texture
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const colors = [
    [0xd32f2f, 0xb71c1c], // Reds
    [0x1976d2, 0x0d47a1], // Blues
    [0x388e3c, 0x1b5e20], // Greens
    [0xfbc02d, 0xf57f17], // Yellows
    [0x7b1fa2, 0x4a148c], // Purples
    [0x00897b, 0x004d40], // Teals
    [0xf57c00, 0xe65100], // Oranges
    [0xc2185b, 0x880e4f], // Pinks
  ];

  const patchSize = 32; // 8x8 grid on 256x256
  const gridW = texSize / patchSize;
  const gridH = texSize / patchSize;

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      
      // Determine grid cell
      const gx = Math.floor(x / patchSize);
      const gy = Math.floor(y / patchSize);
      
      // Deterministic color selection based on cell index
      const colorIndex = (gx + gy * 3) % colors.length;
      const baseColor = colors[colorIndex][0];
      const darkColor = colors[colorIndex][1];
      
      // Simple noise simulation using sin/cos for fabric texture
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 0.5;
      
      // Stitching lines (dark borders)
      const isBorderX = (x % patchSize) < 3;
      const isBorderY = (y % patchSize) < 3;
      
      let r, g, b;
      
      if (isBorderX || isBorderY) {
        // Stitching color (dark brown/black)
        r = 60; g = 40; b = 30;
      } else {
        // Interpolate between base and dark based on noise
        const t = noise * 0.3; // Subtle variation
        r = ((baseColor >> 16) & 0xff) * (1 - t) + ((darkColor >> 16) & 0xff) * t;
        g = ((baseColor >> 8) & 0xff) * (1 - t) + ((darkColor >> 8) & 0xff) * t;
        b = (baseColor & 0xff) * (1 - t) + (darkColor & 0xff) * t;
      }
      
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const patchworkTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  patchworkTexture.colorSpace = THREE.SRGBColorSpace;
  patchworkTexture.wrapS = THREE.RepeatWrapping;
  patchworkTexture.wrapT = THREE.RepeatWrapping;
  patchworkTexture.repeat.set(1, 1);
  patchworkTexture.needsUpdate = true;
  fabricMat.map = patchworkTexture;

  // --- Dimensions ---
  const seatH = 0.45;
  const seatW = 0.60;
  const seatD = 0.55;
  const cushionThick = 0.14;
  const legHeight = 0.45;
  const backHeight = 0.85;
  const armHeight = 0.60;

  // --- Frame Parts ---

  // Helper for tapered legs
  function createLeg(x, zTop, zBottom, isFront) {
    const geom = new THREE.CylinderGeometry(0.035, 0.045, legHeight, 16);
    const leg = new THREE.Mesh(geom, woodMat);
    
    // Position at midpoint of leg
    const midY = legHeight / 2;
    const midZ = (zTop + zBottom) / 2;
    
    leg.position.set(x, midY, midZ);
    
    // Calculate angle
    const dz = zBottom - zTop;
    const angle = Math.atan2(dz, legHeight);
    
    // Rotate around X axis to splay forward/back
    leg.rotation.x = -angle; 
    
    // Splay out slightly (rotate around Z)
    // Front legs: Left (-x) rotates -Z, Right (+x) rotates +Z
    // Actually, simpler to just position bottom wider than top in the geometry or transform
    // Let's just rotate around Z slightly for splay
    const splayAngle = 0.1; 
    leg.rotation.z = x > 0 ? splayAngle : -splayAngle;
    
    return leg;
  }

  // Front Legs (Splayed Forward + Out)
  const fl_leg = createLeg(-0.28, 0.25, 0.38, true);
  const fr_leg = createLeg(0.28, 0.25, 0.38, true);
  root.add(fl_leg, fr_leg);

  // Back Legs (Splayed Backward + Out)
  const bl_leg = createLeg(-0.28, -0.25, -0.35, false);
  const br_leg = createLeg(0.28, -0.25, -0.35, false);
  root.add(bl_leg, br_leg);

  // Side Rails (Connecting front and back legs near bottom)
  const railGeom = new THREE.BoxGeometry(0.05, 0.06, 0.65);
  const leftRail = new THREE.Mesh(railGeom, woodMat);
  leftRail.position.set(-0.28, 0.08, 0.0);
  // Angle rail to match leg splay roughly
  leftRail.rotation.x = -0.15; 
  root.add(leftRail);

  const rightRail = new THREE.Mesh(railGeom, woodMat);
  rightRail.position.set(0.28, 0.08, 0.0);
  rightRail.rotation.x = -0.15;
  root.add(rightRail);

  // Front Stretcher (Optional, adds stability look)
  const frontStretcher = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.05, 0.05), woodMat);
  frontStretcher.position.set(0, 0.08, 0.35);
  root.add(frontStretcher);

  // Back Frame (Vertical support for back cushion)
  const backFrameGeom = new THREE.BoxGeometry(0.55, 0.70, 0.04);
  const backFrame = new THREE.Mesh(backFrameGeom, woodMat);
  backFrame.position.set(0, seatH + 0.35, -0.25);
  backFrame.rotation.x = -0.15; // Tilted back
  root.add(backFrame);

  // Armrests
  // Armrest structure: Vertical support from front leg, horizontal top
  function createArmrest(side) {
    const group = new THREE.Group();
    const dir = side; // -1 left, 1 right
    
    // Armrest Top: Paddle shape
    // Use a Box for the main part and a Sphere for the rounded front
    const armTopGeom = new THREE.BoxGeometry(0.08, 0.04, 0.45);
    const armTop = new THREE.Mesh(armTopGeom, woodMat);
    armTop.position.set(0, 0, -0.10);
    group.add(armTop);
    
    // Rounded front cap
    const capGeom = new THREE.SphereGeometry(0.045, 16, 16);
    const cap = new THREE.Mesh(capGeom, woodMat);
    cap.scale.set(1, 0.8, 0.6); // Flatten slightly
    cap.position.set(0, 0, 0.13);
    group.add(cap);

    // Support post (connects to front leg area)
    const supportGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 16);
    const support = new THREE.Mesh(supportGeom, woodMat);
    support.position.set(0, -0.12, 0.10);
    support.rotation.x = Math.PI / 2; // Horizontal cylinder acting as brace? 
    // Actually, looking at image, the armrest sits on a post that comes up from the front leg.
    // Let's simplify: Just position the armrest assembly relative to the leg.
    
    group.position.set(dir * 0.28, armHeight, 0.25);
    group.rotation.z = 0.1 * dir; // Slight tilt
    group.rotation.x = -0.1; // Slope down towards front
    
    return group;
  }

  const leftArm = createArmrest(-1);
  const rightArm = createArmrest(1);
  root.add(leftArm, rightArm);
  
  // Armrest inner padding/side (wooden panel inside the arm)
  const armSideGeom = new THREE.BoxGeometry(0.03, 0.25, 0.45);
  const leftArmSide = new THREE.Mesh(armSideGeom, woodMat);
  leftArmSide.position.set(-0.24, armHeight - 0.12, 0.05);
  leftArmSide.rotation.x = -0.1;
  root.add(leftArmSide);

  const rightArmSide = new THREE.Mesh(armSideGeom, woodMat);
  rightArmSide.position.set(0.24, armHeight - 0.12, 0.05);
  rightArmSide.rotation.x = -0.1;
  root.add(rightArmSide);


  // --- Cushions ---

  // Seat Cushion
  // Rounded box approximation using Cylinder or just Box with texture
  const seatCushionGeom = new THREE.BoxGeometry(seatW, cushionThick, seatD);
  const seatCushion = new THREE.Mesh(seatCushionGeom, fabricMat);
  seatCushion.position.set(0, seatH + cushionThick / 2 - 0.02, 0.05); // Slightly forward
  // Round the front edge visually by scaling or adding geometry? 
  // Let's add a front cylinder segment for the rounded nose
  const seatNoseGeom = new THREE.CylinderGeometry(cushionThick/2, cushionThick/2, seatW, 32, 1, false, 0, Math.PI);
  const seatNose = new THREE.Mesh(seatNoseGeom, fabricMat);
  seatNose.rotation.z = Math.PI / 2;
  seatNose.rotation.y = Math.PI / 2;
  seatNose.position.set(0, seatH + cushionThick/2 - 0.02, seatD/2);
  
  root.add(seatCushion, seatNose);

  // Back Cushion
  // Trapezoidal shape roughly. Box is fine if tilted.
  const backCushionGeom = new THREE.BoxGeometry(seatW * 0.9, 0.65, cushionThick);
  const backCushion = new THREE.Mesh(backCushionGeom, fabricMat);
  backCushion.position.set(0, seatH + 0.35, -0.15);
  backCushion.rotation.x = -0.15; // Match back frame tilt
  root.add(backCushion);
  
  // Side bolsters for back cushion (optional detail for comfort look)
  const bolsterGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.50, 16);
  const leftBolster = new THREE.Mesh(bolsterGeom, fabricMat);
  leftBolster.rotation.z = Math.PI / 2;
  leftBolster.rotation.y = 0.1;
  leftBolster.position.set(-0.22, seatH + 0.35, -0.10);
  root.add(leftBolster);

  const rightBolster = new THREE.Mesh(bolsterGeom, fabricMat);
  rightBolster.rotation.z = Math.PI / 2;
  rightBolster.rotation.y = -0.1;
  rightBolster.position.set(0.22, seatH + 0.35, -0.10);
  root.add(rightBolster);

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