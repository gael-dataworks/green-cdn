export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
    map: createPatchworkTexture(THREE),
  });

  // --- Dimensions ---
  const legHeight = 0.45;
  const seatHeight = 0.45;
  const seatWidth = 0.70;
  const seatDepth = 0.65;
  const cushionThick = 0.14;
  const backrestHeight = 0.55;
  const armrestHeight = 0.62;
  const legTopRad = 0.035;
  const legBotRad = 0.025;

  // --- Frame: Legs ---
  const legGeom = new THREE.CylinderGeometry(legBotRad, legTopRad, legHeight, 12);
  
  // Front Legs (taller, support arms)
  const frontLegL = new THREE.Mesh(legGeom, woodMat);
  frontLegL.position.set(-seatWidth / 2, legHeight / 2, seatDepth / 2);
  frontLegL.rotation.z = 0.08; // Slight outward splay
  root.add(frontLegL);

  const frontLegR = new THREE.Mesh(legGeom, woodMat);
  frontLegR.position.set(seatWidth / 2, legHeight / 2, seatDepth / 2);
  frontLegR.rotation.z = -0.08;
  root.add(frontLegR);

  // Back Legs (support backrest)
  const backLegGeom = new THREE.CylinderGeometry(legBotRad, legTopRad, legHeight + backrestHeight - 0.1, 12);
  const backLegL = new THREE.Mesh(backLegGeom, woodMat);
  backLegL.position.set(-seatWidth / 2, (legHeight + backrestHeight - 0.1) / 2, -seatDepth / 2);
  backLegL.rotation.z = 0.1;
  backLegL.rotation.x = 0.1; // Angled back
  root.add(backLegL);

  const backLegR = new THREE.Mesh(backLegGeom, woodMat);
  backLegR.position.set(seatWidth / 2, (legHeight + backrestHeight - 0.1) / 2, -seatDepth / 2);
  backLegR.rotation.z = -0.1;
  backLegR.rotation.x = 0.1;
  root.add(backLegR);

  // --- Frame: Rails ---
  const railGeom = new THREE.BoxGeometry(0.06, 0.06, seatDepth - 0.1);
  
  const sideRailL = new THREE.Mesh(railGeom, woodMat);
  sideRailL.position.set(-seatWidth / 2, seatHeight - 0.03, 0);
  root.add(sideRailL);

  const sideRailR = new THREE.Mesh(railGeom, woodMat);
  sideRailR.position.set(seatWidth / 2, seatHeight - 0.03, 0);
  root.add(sideRailR);

  const frontRailGeom = new THREE.BoxGeometry(seatWidth - 0.1, 0.06, 0.06);
  const frontRail = new THREE.Mesh(frontRailGeom, woodMat);
  frontRail.position.set(0, seatHeight - 0.03, seatDepth / 2 - 0.03);
  root.add(frontRail);

  const backRailGeom = new THREE.BoxGeometry(seatWidth - 0.1, 0.06, 0.06);
  const backRail = new THREE.Mesh(backRailGeom, woodMat);
  backRail.position.set(0, seatHeight - 0.03, -seatDepth / 2 + 0.03);
  root.add(backRail);
  
  // Lower front stretcher
  const stretcherGeom = new THREE.BoxGeometry(seatWidth - 0.15, 0.05, 0.05);
  const stretcher = new THREE.Mesh(stretcherGeom, woodMat);
  stretcher.position.set(0, 0.15, seatDepth / 2 - 0.05);
  stretcher.rotation.z = 0.08; // Match leg angle roughly
  root.add(stretcher);

  // --- Armrests ---
  const armGeom = new THREE.BoxGeometry(0.07, 0.04, 0.55);
  // Round the top slightly by scaling or just using a thin box. 
  // Let's use a capsule-like shape via scaling a cylinder or just a rounded box approximation.
  // Simple box with smoothed look is fine for this resolution.
  
  const armL = new THREE.Mesh(armGeom, woodMat);
  armL.position.set(-seatWidth / 2 - 0.02, armrestHeight, 0.05);
  armL.rotation.x = 0.1; // Slight slope down towards front
  armL.rotation.z = 0.08;
  root.add(armL);

  const armR = new THREE.Mesh(armGeom, woodMat);
  armR.position.set(seatWidth / 2 + 0.02, armrestHeight, 0.05);
  armR.rotation.x = 0.1;
  armR.rotation.z = -0.08;
  root.add(armR);
  
  // Arm supports (vertical bits connecting arm to front leg)
  const armSupportGeom = new THREE.BoxGeometry(0.06, 0.15, 0.06);
  const armSupportL = new THREE.Mesh(armSupportGeom, woodMat);
  armSupportL.position.set(-seatWidth / 2, armrestHeight - 0.08, 0.05);
  armSupportL.rotation.z = 0.08;
  root.add(armSupportL);
  
  const armSupportR = new THREE.Mesh(armSupportGeom, woodMat);
  armSupportR.position.set(seatWidth / 2, armrestHeight - 0.08, 0.05);
  armSupportR.rotation.z = -0.08;
  root.add(armSupportR);

  // --- Cushions ---
  // Seat Cushion
  const seatCushionGeom = new THREE.BoxGeometry(seatWidth - 0.08, cushionThick, seatDepth - 0.08);
  const seatCushion = new THREE.Mesh(seatCushionGeom, fabricMat);
  seatCushion.position.set(0, seatHeight + cushionThick / 2, 0);
  root.add(seatCushion);

  // Back Cushion
  const backCushionGeom = new THREE.BoxGeometry(seatWidth - 0.1, backrestHeight, cushionThick + 0.04);
  const backCushion = new THREE.Mesh(backCushionGeom, fabricMat);
  // Position: centered between back legs, angled back
  const backPivotY = seatHeight + cushionThick;
  const backPivotZ = -seatDepth / 2 + 0.05;
  backCushion.position.set(0, backPivotY + backrestHeight / 2, backPivotZ);
  backCushion.rotation.x = 0.15; // Recline angle
  root.add(backCushion);

  fitToUnitCube(THREE, root);
  return root;
}

function createPatchworkTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const palette = [
    [217, 56, 56],   // Red
    [56, 110, 217],  // Blue
    [217, 201, 56],  // Yellow
    [56, 217, 138],  // Green
    [217, 56, 160],  // Pink
    [56, 217, 200],  // Teal
    [217, 120, 56],  // Orange
  ];

  const gridSize = 5;
  const cellSize = size / gridSize;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      
      // Deterministic color selection based on grid position
      const colorIndex = (gx + gy * 3) % palette.length;
      const baseColor = palette[colorIndex];

      // Add some noise/texture within the cell to simulate fabric weave
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 20;
      
      // Stitching lines between cells
      const isStitchX = (x % cellSize < 3 || x % cellSize > cellSize - 3);
      const isStitchY = (y % cellSize < 3 || y % cellSize > cellSize - 3);
      
      let r = baseColor[0] + noise;
      let g = baseColor[1] + noise;
      let b = baseColor[2] + noise;

      if (isStitchX || isStitchY) {
        // Darker stitching thread
        r *= 0.6; g *= 0.6; b *= 0.6;
      }

      // Clamp
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      const index = (x + y * size) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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