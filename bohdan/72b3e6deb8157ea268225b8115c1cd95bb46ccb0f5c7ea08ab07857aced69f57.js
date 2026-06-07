export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B, // Walnut
    metalness: 0.0,
    roughness: 0.6,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Procedural Patchwork Texture
  function createPatchworkTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const colors = [
      [0.8, 0.2, 0.2], // Red
      [0.2, 0.4, 0.8], // Blue
      [0.9, 0.8, 0.2], // Yellow
      [0.2, 0.7, 0.3], // Green
      [0.9, 0.5, 0.2], // Orange
      [0.8, 0.2, 0.6], // Pink
      [0.4, 0.2, 0.6], // Purple
      [0.2, 0.6, 0.7], // Teal
    ];

    const patchSize = 64; // 8x8 grid
    const gridW = size / patchSize;
    const gridH = size / patchSize;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = Math.floor(x / patchSize);
        const gy = Math.floor(y / patchSize);
        
        // Deterministic color selection based on grid position
        const colorIndex = (gx * 3 + gy * 7) % colors.length;
        const baseColor = colors[colorIndex];
        
        // Add fabric noise
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.1) + 0.1;
        
        // Stitch lines (borders between patches)
        const isStitchX = (x % patchSize < 4) || (x % patchSize > patchSize - 4);
        const isStitchY = (y % patchSize < 4) || (y % patchSize > patchSize - 4);
        
        let r, g, b;
        if (isStitchX || isStitchY) {
          // Stitch color (off-white/cream)
          r = 0.9; g = 0.85; b = 0.75;
        } else {
          r = baseColor[0] + noise;
          g = baseColor[1] + noise;
          b = baseColor[2] + noise;
        }

        const idx = (y * size + x) * 4;
        data[idx] = Math.min(255, r * 255);
        data[idx + 1] = Math.min(255, g * 255);
        data[idx + 2] = Math.min(255, b * 255);
        data[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  const patchworkTex = createPatchworkTexture();
  const fabricMat = new THREE.MeshStandardMaterial({
    map: patchworkTex,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const legHeight = 0.42;
  const seatHeight = 0.42;
  const seatWidth = 0.65;
  const seatDepth = 0.58;
  const cushionThickness = 0.14;
  const backHeight = 0.75;
  const armHeight = 0.62;
  const legTopRadius = 0.045;
  const legBotRadius = 0.028;

  // --- Frame Parts ---

  // Legs Helper
  function createLeg(x, z, rotZ, rotX) {
    const geom = new THREE.CylinderGeometry(legBotRadius, legTopRadius, legHeight, 16);
    const leg = new THREE.Mesh(geom, woodMat);
    leg.position.set(x, legHeight / 2, z);
    leg.rotation.z = rotZ;
    leg.rotation.x = rotX;
    return leg;
  }

  // Front Legs (splay out slightly)
  const frontLeftLeg = createLeg(-seatWidth / 2, seatDepth / 2, -0.1, 0);
  const frontRightLeg = createLeg(seatWidth / 2, seatDepth / 2, 0.1, 0);
  root.add(frontLeftLeg, frontRightLeg);

  // Back Legs (angle back significantly)
  const backLeftLeg = createLeg(-seatWidth / 2 + 0.05, -seatDepth / 2 + 0.05, 0.15, 0.15);
  const backRightLeg = createLeg(seatWidth / 2 - 0.05, -seatDepth / 2 + 0.05, -0.15, 0.15);
  root.add(backLeftLeg, backRightLeg);

  // Side Rails
  const sideRailGeom = new THREE.BoxGeometry(0.06, 0.08, seatDepth - 0.1);
  const leftRail = new THREE.Mesh(sideRailGeom, woodMat);
  leftRail.position.set(-seatWidth / 2 + 0.03, seatHeight - 0.04, 0);
  root.add(leftRail);

  const rightRail = new THREE.Mesh(sideRailGeom, woodMat);
  rightRail.position.set(seatWidth / 2 - 0.03, seatHeight - 0.04, 0);
  root.add(rightRail);

  // Front Rail
  const frontRailGeom = new THREE.BoxGeometry(seatWidth - 0.1, 0.08, 0.06);
  const frontRail = new THREE.Mesh(frontRailGeom, woodMat);
  frontRail.position.set(0, seatHeight - 0.04, seatDepth / 2 - 0.03);
  root.add(frontRail);

  // Back Rail (Lower)
  const backRailGeom = new THREE.BoxGeometry(seatWidth - 0.1, 0.08, 0.06);
  const backRail = new THREE.Mesh(backRailGeom, woodMat);
  backRail.position.set(0, seatHeight - 0.04, -seatDepth / 2 + 0.03);
  root.add(backRail);

  // Back Support (Vertical)
  const backSupportGeom = new THREE.BoxGeometry(seatWidth - 0.15, backHeight, 0.05);
  const backSupport = new THREE.Mesh(backSupportGeom, woodMat);
  backSupport.position.set(0, seatHeight + backHeight / 2, -seatDepth / 2 + 0.025);
  backSupport.rotation.x = 0.1; // Lean back
  root.add(backSupport);

  // Armrests
  function createArmrest(side) {
    const armGeom = new THREE.BoxGeometry(0.08, 0.05, seatDepth + 0.15);
    const arm = new THREE.Mesh(armGeom, woodMat);
    // Position on top of front leg, extending back
    const x = side * (seatWidth / 2 - 0.02);
    arm.position.set(x, armHeight, 0);
    arm.rotation.x = 0.1; // Follow back lean slightly
    return arm;
  }

  const leftArm = createArmrest(-1);
  const rightArm = createArmrest(1);
  root.add(leftArm, rightArm);

  // Armrest Supports (Vertical bits under armrests at back)
  const armSupportGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12);
  const leftArmSupport = new THREE.Mesh(armSupportGeom, woodMat);
  leftArmSupport.position.set(-seatWidth / 2 + 0.05, armHeight - 0.12, -seatDepth / 2 + 0.1);
  leftArmSupport.rotation.x = 0.1;
  root.add(leftArmSupport);

  const rightArmSupport = new THREE.Mesh(armSupportGeom, woodMat);
  rightArmSupport.position.set(seatWidth / 2 - 0.05, armHeight - 0.12, -seatDepth / 2 + 0.1);
  rightArmSupport.rotation.x = 0.1;
  root.add(rightArmSupport);

  // Screws/Bolts on side rails near front legs
  function addScrew(x, y, z, rotY) {
    const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
    const screw = new THREE.Mesh(screwGeom, screwMat);
    screw.rotation.y = rotY;
    screw.position.set(x, y, z);
    root.add(screw);
  }
  addScrew(-seatWidth / 2 + 0.065, seatHeight - 0.04, seatDepth / 2 - 0.05, Math.PI / 2);
  addScrew(seatWidth / 2 - 0.065, seatHeight - 0.04, seatDepth / 2 - 0.05, -Math.PI / 2);


  // --- Cushions ---

  // Seat Cushion
  const seatCushionGeom = new THREE.BoxGeometry(seatWidth - 0.08, cushionThickness, seatDepth - 0.08);
  const seatCushion = new THREE.Mesh(seatCushionGeom, fabricMat);
  seatCushion.position.set(0, seatHeight + cushionThickness / 2, 0);
  // Slight rounding effect via scale or just box is fine for this style
  root.add(seatCushion);

  // Back Cushion
  const backCushionGeom = new THREE.BoxGeometry(seatWidth - 0.12, backHeight - 0.1, cushionThickness + 0.04);
  const backCushion = new THREE.Mesh(backCushionGeom, fabricMat);
  backCushion.position.set(0, seatHeight + (backHeight - 0.1) / 2 + 0.05, -seatDepth / 2 + 0.08);
  backCushion.rotation.x = 0.1; // Match back support lean
  root.add(backCushion);

  // Side Bolsters/Piping for cushions (optional detail to soften edges)
  // Using thin tubes to simulate piping
  const pipingMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.8 });
  const pipingGeom = new THREE.CylinderGeometry(0.015, 0.015, seatWidth - 0.1, 8);
  
  const seatPipingFront = new THREE.Mesh(pipingGeom, pipingMat);
  seatPipingFront.rotation.z = Math.PI / 2;
  seatPipingFront.position.set(0, seatHeight + cushionThickness/2, seatDepth/2 - 0.05);
  root.add(seatPipingFront);

  const seatPipingSideL = new THREE.Mesh(pipingGeom, pipingMat);
  seatPipingSideL.rotation.x = Math.PI / 2;
  seatPipingSideL.position.set(-seatWidth/2 + 0.05, seatHeight + cushionThickness/2, 0);
  root.add(seatPipingSideL);

  const seatPipingSideR = new THREE.Mesh(pipingGeom, pipingMat);
  seatPipingSideR.rotation.x = Math.PI / 2;
  seatPipingSideR.position.set(seatWidth/2 - 0.05, seatHeight + cushionThickness/2, 0);
  root.add(seatPipingSideR);

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