export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.5,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.8,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.2,
    roughness: 0.4,
  });

  // --- Procedural Grille Texture with Logo ---
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Base dark mesh pattern
      const isHole = (x % 4 < 2) && (y % 4 < 2);
      const val = isHole ? 10 : 30;
      texData[idx] = val;
      texData[idx + 1] = val;
      texData[idx + 2] = val;
      texData[idx + 3] = 255;

      // Logo "IWWIE" area (centered horizontally, slightly up)
      const logoYStart = texSize * 0.4;
      const logoYEnd = texSize * 0.6;
      const logoXStart = texSize * 0.25;
      const logoXEnd = texSize * 0.75;

      if (y > logoYStart && y < logoYEnd && x > logoXStart && x < logoXEnd) {
        // Simple blocky font logic
        const localX = x - logoXStart;
        const localY = y - logoYStart;
        const h = logoYEnd - logoYStart;
        const w = logoXEnd - logoXStart;
        const charW = w / 5;
        const charIdx = Math.floor(localX / charW);
        const cx = localX % charW;
        const cy = localY;

        let draw = 0;
        // I
        if (charIdx === 0) {
          if (cx > charW * 0.4 && cx < charW * 0.6) draw = 1;
        }
        // W
        else if (charIdx === 1) {
          if (cx < charW * 0.2 || cx > charW * 0.8 || 
             (cx > charW * 0.3 && cx < charW * 0.5 && cy > h * 0.5) ||
             (cx > charW * 0.5 && cx < charW * 0.7 && cy > h * 0.5)) draw = 1;
        }
        // W (second)
        else if (charIdx === 2) {
           if (cx < charW * 0.2 || cx > charW * 0.8 || 
             (cx > charW * 0.3 && cx < charW * 0.5 && cy > h * 0.5) ||
             (cx > charW * 0.5 && cx < charW * 0.7 && cy > h * 0.5)) draw = 1;
        }
        // I
        else if (charIdx === 3) {
          if (cx > charW * 0.4 && cx < charW * 0.6) draw = 1;
        }
        // E
        else if (charIdx === 4) {
          if (cx < charW * 0.2 || cy < h * 0.2 || cy > h * 0.8 || (cy > h * 0.45 && cy < h * 0.55 && cx < charW * 0.5)) draw = 1;
        }

        if (draw) {
          texData[idx] = 255;
          texData[idx + 1] = 255;
          texData[idx + 2] = 255;
        }
      }
    }
  }
  const grilleTexture = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.needsUpdate = true;
  const grilleMatWithLogo = grilleMat.clone();
  grilleMatWithLogo.map = grilleTexture;

  // --- Dimensions ---
  const headbandWidth = 0.55;
  const headbandHeight = 0.45;
  const cupRadius = 0.13;
  const cupDepth = 0.09;
  const padThickness = 0.04;
  const yokeWidth = 0.04;
  const yokeHeight = 0.12;

  // --- Headband ---
  // Curve for the headband: U-shape with flat top
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-headbandWidth / 2, -0.1, 0),
    new THREE.Vector3(-headbandWidth / 2, headbandHeight / 2, 0),
    new THREE.Vector3(0, headbandHeight / 2 + 0.05, 0),
    new THREE.Vector3(headbandWidth / 2, headbandHeight / 2, 0),
    new THREE.Vector3(headbandWidth / 2, -0.1, 0),
  ]);
  curve.tension = 0.5; // Smooth corners

  const headbandGeom = new THREE.TubeGeometry(curve, 64, 0.045, 16, false);
  const headband = new THREE.Mesh(headbandGeom, shellMat);
  root.add(headband);

  // Headband padding (inner side) - slightly smaller tube
  const padCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-headbandWidth / 2 + 0.02, -0.1, 0),
    new THREE.Vector3(-headbandWidth / 2 + 0.02, headbandHeight / 2 - 0.02, 0),
    new THREE.Vector3(0, headbandHeight / 2 - 0.02, 0),
    new THREE.Vector3(headbandWidth / 2 - 0.02, headbandHeight / 2 - 0.02, 0),
    new THREE.Vector3(headbandWidth / 2 - 0.02, -0.1, 0),
  ]);
  const headbandPadGeom = new THREE.TubeGeometry(padCurve, 64, 0.035, 16, false);
  const headbandPad = new THREE.Mesh(headbandPadGeom, padMat);
  root.add(headbandPad);

  // --- Ear Cup Builder Function ---
  function createEarCup(side) {
    const group = new THREE.Group();
    const dir = side === 'left' ? -1 : 1;

    // 1. Main Housing (Oval Cylinder)
    const housingGeom = new THREE.CylinderGeometry(cupRadius, cupRadius, cupDepth, 32);
    housingGeom.rotateZ(Math.PI / 2); // Face X axis
    // Scale Y to make it slightly oval
    housingGeom.scale(1, 1.1, 1); 
    
    const housing = new THREE.Mesh(housingGeom, shellMat);
    group.add(housing);

    // 2. Grille (Front Face)
    const grilleGeom = new THREE.CylinderGeometry(cupRadius * 0.85, cupRadius * 0.85, 0.01, 32);
    grilleGeom.rotateZ(Math.PI / 2);
    grilleGeom.scale(1, 1.1, 1);
    const grille = new THREE.Mesh(grilleGeom, grilleMatWithLogo);
    grille.position.set(dir * (cupDepth / 2 + 0.005), 0, 0);
    group.add(grille);

    // 3. Ear Pad (Torus)
    const padGeom = new THREE.TorusGeometry(cupRadius * 0.9, padThickness, 16, 32);
    padGeom.rotateY(Math.PI / 2); // Stand up
    padGeom.scale(1, 1.1, 1); // Match oval
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(dir * (cupDepth / 2 - 0.02), 0, 0);
    group.add(pad);

    // 4. Yoke/Slider (Connects to headband)
    const yokeGeom = new THREE.BoxGeometry(0.03, yokeHeight, 0.05);
    const yoke = new THREE.Mesh(yokeGeom, shellMat);
    // Position yoke at top of cup
    yoke.position.set(dir * (cupDepth * 0.2), cupRadius * 1.1 + yokeHeight / 2, 0);
    group.add(yoke);

    // Yoke connector into headband
    const connectorGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
    connectorGeom.rotateX(Math.PI / 2);
    const connector = new THREE.Mesh(connectorGeom, accentMat);
    connector.position.set(dir * (cupDepth * 0.2), cupRadius * 1.1 + yokeHeight, 0);
    group.add(connector);

    // 5. Buttons (on bottom edge)
    const btnGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 16);
    btnGeom.rotateX(Math.PI / 2);
    
    const btn1 = new THREE.Mesh(btnGeom, accentMat);
    btn1.position.set(dir * 0.05, -cupRadius * 0.8, 0);
    btn1.rotation.z = side === 'left' ? Math.PI / 4 : -Math.PI / 4;
    group.add(btn1);

    const btn2 = new THREE.Mesh(btnGeom, accentMat);
    btn2.position.set(dir * 0.08, -cupRadius * 0.9, 0);
    btn2.rotation.z = side === 'left' ? Math.PI / 4 : -Math.PI / 4;
    group.add(btn2);

    // 6. Cable Port (Left cup only)
    if (side === 'left') {
      const portGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8);
      portGeom.rotateX(Math.PI / 2);
      const port = new THREE.Mesh(portGeom, shellMat);
      port.position.set(-0.02, -cupRadius, 0.02);
      group.add(port);
    }

    return group;
  }

  // --- Assemble Cups ---
  const leftCup = createEarCup('left');
  leftCup.position.set(-headbandWidth / 2, 0, 0);
  root.add(leftCup);

  const rightCup = createEarCup('right');
  rightCup.position.set(headbandWidth / 2, 0, 0);
  root.add(rightCup);

  // --- Cable (Left Cup) ---
  const cablePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-headbandWidth / 2 - 0.02, -cupRadius, 0.02), // Start at port
    new THREE.Vector3(-headbandWidth / 2 - 0.1, -cupRadius - 0.1, 0.1),
    new THREE.Vector3(-headbandWidth / 2 - 0.2, -cupRadius - 0.3, 0.0),
  ]);
  const cableGeom = new THREE.TubeGeometry(cablePath, 20, 0.008, 8, false);
  const cable = new THREE.Mesh(cableGeom, cableMat);
  root.add(cable);

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