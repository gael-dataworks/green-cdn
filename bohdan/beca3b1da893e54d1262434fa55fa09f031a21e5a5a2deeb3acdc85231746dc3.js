export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.55,
  });

  // Slightly lighter grey for accents/buttons
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Soft leather-like material for ear pads
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Mesh grille material
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Cable material
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Logo Texture (Procedural DataTexture) ---
  // "D WIRE" logo simulation
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const bgR = 34, bgG = 34, bgB = 34; // Dark grey background
  const fgR = 220, fgG = 220, fgB = 220; // White text

  for (let i = 0; i < texSize * texSize; i++) {
    // Default background
    data[i * 4] = bgR;
    data[i * 4 + 1] = bgG;
    data[i * 4 + 2] = bgB;
    data[i * 4 + 3] = 255;

    const x = i % texSize;
    const y = Math.floor(i / texSize);
    
    // Simple blocky logo drawing logic
    // Center area roughly 100x60
    const cx = texSize / 2;
    const cy = texSize / 2;
    
    // Draw "D"
    if (x > cx - 80 && x < cx - 50 && y > cy - 20 && y < cy + 20) {
       data[i*4] = fgR; data[i*4+1] = fgG; data[i*4+2] = fgB;
    }
    // Draw "D" curve
    if (x > cx - 50 && x < cx - 20 && y > cy - 20 && y < cy + 20) {
       const dist = Math.sqrt((x - (cx - 50))**2 + (y - cy)**2);
       if (dist < 20 && dist > 12) {
         data[i*4] = fgR; data[i*4+1] = fgG; data[i*4+2] = fgB;
       }
    }
    
    // Draw "W" (simplified zig zag)
    if (x > cx - 10 && x < cx + 40 && y > cy - 20 && y < cy + 20) {
       const localX = x - (cx - 10);
       // 4 segments
       const segW = 50 / 4;
       const seg = Math.floor(localX / segW);
       const t = (localX % segW) / segW;
       let h = 0;
       if (seg === 0) h = -20 + t * 40;
       if (seg === 1) h = 20 - t * 40;
       if (seg === 2) h = -20 + t * 40;
       if (seg === 3) h = 20 - t * 40;
       
       if (Math.abs(y - (cy + h)) < 4) {
         data[i*4] = fgR; data[i*4+1] = fgG; data[i*4+2] = fgB;
       }
    }

    // Draw "IRE" (simplified blocks)
    if (x > cx + 45 && x < cx + 95 && y > cy - 20 && y < cy + 20) {
       // Just fill a block for "IRE" abstraction to ensure visibility
       data[i*4] = fgR; data[i*4+1] = fgG; data[i*4+2] = fgB;
    }
  }

  const logoTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  
  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTexture,
    transparent: true,
    opacity: 0.9,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
    roughness: 0.4
  });

  // --- Dimensions ---
  const cupRadius = 0.35;
  const cupDepth = 0.12;
  const padThickness = 0.06;
  const headbandWidth = 1.4;
  const headbandHeight = 1.5;
  const headbandThickness = 0.05;

  // --- Helper: Create Ear Cup ---
  function createEarCup(side) { // side: -1 (left), 1 (right)
    const cupGroup = new THREE.Group();
    const dir = side === -1 ? -1 : 1;

    // 1. Main Housing (Outer Shell)
    // Using a cylinder rotated to face X, scaled to be slightly oval
    const housingGeom = new THREE.CylinderGeometry(cupRadius, cupRadius, cupDepth, 32);
    const housing = new THREE.Mesh(housingGeom, plasticMat);
    housing.rotation.z = Math.PI / 2; // Face X axis
    // Make it slightly oval (taller than wide)
    housing.scale.set(1, 1.1, 0.9); 
    cupGroup.add(housing);

    // 2. Back Cap (flat circle closing the cylinder)
    const capGeom = new THREE.CircleGeometry(cupRadius * 0.95, 32);
    const cap = new THREE.Mesh(capGeom, plasticMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = dir * (cupDepth / 2 + 0.001);
    cupGroup.add(cap);

    // 3. Grille (Front Face)
    const grilleGeom = new THREE.CircleGeometry(cupRadius * 0.85, 32);
    const grille = new THREE.Mesh(grilleGeom, grilleMat);
    grille.rotation.z = Math.PI / 2;
    grille.position.x = dir * (-cupDepth / 2 - 0.001);
    cupGroup.add(grille);

    // 4. Logo on Grille
    const logoGeom = new THREE.PlaneGeometry(cupRadius * 0.6, cupRadius * 0.25);
    const logo = new THREE.Mesh(logoGeom, logoMat);
    logo.rotation.z = Math.PI / 2;
    // Position logo on the grille face
    logo.position.x = dir * (-cupDepth / 2 - 0.002);
    logo.position.y = -0.05; // Slightly lower
    logo.position.z = 0.05; // Offset to right side of cup face
    cupGroup.add(logo);

    // 5. Ear Pad (Torus)
    const padGeom = new THREE.TorusGeometry(cupRadius * 0.7, padThickness, 16, 32);
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.rotation.z = Math.PI / 2;
    pad.position.x = dir * (-cupDepth / 2 - padThickness);
    cupGroup.add(pad);

    // 6. Buttons/Controls (on the bottom/side of housing)
    // Power button
    const btnGeom = new THREE.CapsuleGeometry(0.015, 0.04, 4, 8);
    const powerBtn = new THREE.Mesh(btnGeom, accentMat);
    powerBtn.rotation.x = Math.PI / 2;
    powerBtn.position.set(dir * (cupDepth * 0.2), -cupRadius * 0.6, 0);
    cupGroup.add(powerBtn);

    // Volume/Control slider area (small pill on side)
    const sliderGeom = new THREE.BoxGeometry(0.01, 0.08, 0.03);
    const slider = new THREE.Mesh(sliderGeom, accentMat);
    slider.position.set(dir * (cupDepth * 0.2), -cupRadius * 0.8, 0.15);
    cupGroup.add(slider);

    // 7. Hinge connector (cylinder connecting to headband)
    const hingeGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
    const hinge = new THREE.Mesh(hingeGeom, plasticMat);
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(dir * (cupDepth * 0.5), cupRadius * 0.9, 0);
    cupGroup.add(hinge);

    return cupGroup;
  }

  // --- Build Headphones ---

  // Left Ear Cup
  const leftCup = createEarCup(-1);
  leftCup.position.x = -headbandWidth / 2;
  root.add(leftCup);

  // Right Ear Cup
  const rightCup = createEarCup(1);
  rightCup.position.x = headbandWidth / 2;
  root.add(rightCup);

  // Headband Arch
  // Path: Start left hinge, go up, curve over, go down to right hinge
  const curvePoints = [
    new THREE.Vector3(-headbandWidth / 2, headbandHeight * 0.6, 0), // Left start
    new THREE.Vector3(-headbandWidth / 2, headbandHeight, 0),       // Left top corner
    new THREE.Vector3(0, headbandHeight + 0.2, 0),                  // Top center
    new THREE.Vector3(headbandWidth / 2, headbandHeight, 0),        // Right top corner
    new THREE.Vector3(headbandWidth / 2, headbandHeight * 0.6, 0)   // Right start
  ];
  
  const headbandCurve = new THREE.CatmullRomCurve3(curvePoints);
  const headbandGeom = new THREE.TubeGeometry(headbandCurve, 64, headbandThickness, 16, false);
  const headband = new THREE.Mesh(headbandGeom, plasticMat);
  root.add(headband);

  // Headband Inner Padding (Thinner tube inside the arch)
  const padCurvePoints = [
    new THREE.Vector3(-headbandWidth / 2 + 0.1, headbandHeight * 0.6, 0),
    new THREE.Vector3(-headbandWidth / 2 + 0.1, headbandHeight - 0.05, 0),
    new THREE.Vector3(0, headbandHeight + 0.15, 0),
    new THREE.Vector3(headbandWidth / 2 - 0.1, headbandHeight - 0.05, 0),
    new THREE.Vector3(headbandWidth / 2 - 0.1, headbandHeight * 0.6, 0)
  ];
  const padCurve = new THREE.CatmullRomCurve3(padCurvePoints);
  const headbandPadGeom = new THREE.TubeGeometry(padCurve, 64, headbandThickness * 0.6, 16, false);
  const headbandPad = new THREE.Mesh(headbandPadGeom, padMat);
  root.add(headbandPad);

  // Cable (Attached to bottom of Left Cup)
  const cableStart = new THREE.Vector3(-headbandWidth / 2, -headbandHeight * 0.6, 0);
  const cableCtrl1 = new THREE.Vector3(-headbandWidth / 2 - 0.2, -headbandHeight * 0.8, 0.2);
  const cableCtrl2 = new THREE.Vector3(-headbandWidth / 2 - 0.4, -headbandHeight * 0.9, 0.4);
  const cableEnd = new THREE.Vector3(-headbandWidth / 2 - 0.6, -headbandHeight * 0.8, 0.6);
  
  const cablePath = new THREE.CatmullRomCurve3([cableStart, cableCtrl1, cableCtrl2, cableEnd]);
  const cableGeom = new THREE.TubeGeometry(cablePath, 20, 0.015, 8, false);
  const cable = new THREE.Mesh(cableGeom, cableMat);
  root.add(cable);

  // Connector strain relief (cone at cable start)
  const reliefGeom = new THREE.CylinderGeometry(0.02, 0.015, 0.04, 16);
  const relief = new THREE.Mesh(reliefGeom, cableMat);
  relief.rotation.x = Math.PI / 4;
  relief.position.copy(cableStart);
  relief.position.y -= 0.02;
  root.add(relief);

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