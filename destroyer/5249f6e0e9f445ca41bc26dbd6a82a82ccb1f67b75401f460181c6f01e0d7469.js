export default function generate(THREE) {
  // --- Constants & Dimensions ---
  const TABLE_SIZE = 1.0;
  const TOP_THICKNESS = 0.05;
  const LEG_HEIGHT = 0.45;
  const LEG_WIDTH = 0.09;
  const APRON_HEIGHT = 0.10;
  const APRON_THICKNESS = 0.04;
  const OVERHANG = 0.04;

  // --- Material: Rustic Wood ---
  // Generate a procedural wood texture with grain and knots
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Base wood color components
  const baseR = 110, baseG = 85, baseB = 60; 
  const grainR = 80, grainG = 60, grainB = 40;
  const knotR = 40, knotG = 30, knotB = 20;

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Simple deterministic noise based on coordinates
      const noise = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 20 + 
                    Math.sin(x * 0.2 + y * 0.1) * 10;
      
      // Grain lines (vertical streaks)
      const grain = (Math.sin(x * 0.1) > 0.8) ? -30 : 0;
      
      // Occasional knots (dark circles)
      let knot = 0;
      const cx1 = 64, cy1 = 64, cr1 = 15;
      const cx2 = 190, cy2 = 180, cr2 = 10;
      const dist1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2);
      const dist2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);
      
      if (dist1 < cr1) knot = -50 * (1 - dist1/cr1);
      if (dist2 < cr2) knot = -50 * (1 - dist2/cr2);

      const r = Math.max(0, Math.min(255, baseR + noise + grain + knot));
      const g = Math.max(0, Math.min(255, baseG + noise * 0.8 + grain * 0.8 + knot));
      const b = Math.max(0, Math.min(255, baseB + noise * 0.6 + grain * 0.6 + knot));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const woodTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(2, 2);
  woodTexture.needsUpdate = true;

  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTexture,
    color: 0xffffff, // Tint white to let texture dominate
    metalness: 0.0,
    roughness: 0.85,
  });

  const root = new THREE.Group();

  // --- 1. Table Top (4 Planks) ---
  const plankWidth = (TABLE_SIZE - 0.02) / 4; // Small gaps between planks
  const plankLength = TABLE_SIZE;
  
  const topGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(plankWidth, TOP_THICKNESS, plankLength),
      woodMat
    );
    // Position planks side by side along X axis
    const xPos = -TABLE_SIZE / 2 + (plankWidth / 2) + (i * plankWidth) + 0.01;
    plank.position.set(xPos, LEG_HEIGHT + APRON_HEIGHT / 2, 0);
    // Slight random rotation for rustic look (deterministic based on index)
    plank.rotation.z = (i % 2 === 0 ? 0.01 : -0.01);
    plank.rotation.x = (i % 3 === 0 ? 0.01 : 0);
    topGroup.add(plank);
  }
  root.add(topGroup);

  // --- 2. Apron (Frame under top) ---
  const apronGroup = new THREE.Group();
  const frameInnerSize = TABLE_SIZE - (LEG_WIDTH * 2) - (OVERHANG * 2) + 0.02;
  const frameCenterOffset = (TABLE_SIZE - LEG_WIDTH - OVERHANG) / 2 - LEG_WIDTH/2;

  // Front & Back Apron
  const apronLong = new THREE.Mesh(
    new THREE.BoxGeometry(TABLE_SIZE - LEG_WIDTH * 2 - OVERHANG * 2 + 0.02, APRON_HEIGHT, APRON_THICKNESS),
    woodMat
  );
  // Front
  const apronFront = apronLong.clone();
  apronFront.position.set(0, LEG_HEIGHT, TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG + APRON_THICKNESS/2);
  apronGroup.add(apronFront);
  // Back
  const apronBack = apronLong.clone();
  apronBack.position.set(0, LEG_HEIGHT, -(TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG + APRON_THICKNESS/2));
  apronGroup.add(apronBack);

  // Left & Right Apron
  const apronShort = new THREE.Mesh(
    new THREE.BoxGeometry(APRON_THICKNESS, APRON_HEIGHT, TABLE_SIZE - LEG_WIDTH * 2 - OVERHANG * 2 + 0.02),
    woodMat
  );
  // Left
  const apronLeft = apronShort.clone();
  apronLeft.position.set(-(TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG + APRON_THICKNESS/2), LEG_HEIGHT, 0);
  apronGroup.add(apronLeft);
  // Right
  const apronRight = apronShort.clone();
  apronRight.position.set((TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG + APRON_THICKNESS/2), LEG_HEIGHT, 0);
  apronGroup.add(apronRight);

  root.add(apronGroup);

  // --- 3. Legs ---
  const legGroup = new THREE.Group();
  const legGeom = new THREE.BoxGeometry(LEG_WIDTH, LEG_HEIGHT, LEG_WIDTH);
  
  const legPositions = [
    { x: 1, z: 1 },
    { x: -1, z: 1 },
    { x: 1, z: -1 },
    { x: -1, z: -1 }
  ];

  legPositions.forEach((pos, idx) => {
    const leg = new THREE.Mesh(legGeom, woodMat);
    const x = pos.x * (TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG / 2);
    const z = pos.z * (TABLE_SIZE / 2 - LEG_WIDTH / 2 - OVERHANG / 2);
    leg.position.set(x, LEG_HEIGHT / 2, z);
    
    // Slight taper or irregularity for rustic feel
    leg.scale.set(1 + idx * 0.01, 1, 1 - idx * 0.01);
    
    legGroup.add(leg);
  });

  root.add(legGroup);

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