export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const L = 1.8; // Length
  const W = 0.75; // Width
  const H = 0.55; // Height
  const wheelR = 0.16; // Wheel radius
  const wheelW = 0.06; // Wheel width
  const axleH = 0.16; // Axle height from ground
  const groundY = -0.16; // Ground level relative to center

  // --- Materials ---
  // Glossy Black Paint
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.7,
    roughness: 0.2,
  });

  // Dark Tinted Glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.2,
    transparent: true,
    opacity: 0.9,
  });

  // Chrome / Silver Trim
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
  });

  // Tire Rubber
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Rim Silver
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Red Taillight
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    metalness: 0.3,
    roughness: 0.3,
    emissive: 0x550000,
    emissiveIntensity: 0.5,
  });

  // Headlight / DRL
  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.2,
    emissive: 0xffffff,
    emissiveIntensity: 0.8,
  });

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  function addCylinder(rTop, rBot, h, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- Body Construction ---
  
  // Lower Body / Chassis
  const lowerBody = addBox(L * 0.9, H * 0.45, W * 0.95, bodyMat, 0, groundY + H * 0.25, 0);
  
  // Upper Body / Cabin (Sloped)
  const cabinL = L * 0.55;
  const cabinH = H * 0.35;
  const cabinW = W * 0.85;
  const cabin = addBox(cabinL, cabinH, cabinW, bodyMat, -L * 0.1, groundY + H * 0.65, 0);
  
  // Roof (slightly separate to allow glass insertion)
  const roof = addBox(cabinL * 0.9, 0.02, cabinW * 0.95, bodyMat, -L * 0.1, groundY + H * 0.82, 0);

  // Hood (Front)
  const hoodL = L * 0.35;
  const hood = addBox(hoodL, H * 0.42, W * 0.92, bodyMat, L * 0.55, groundY + H * 0.45, 0);
  // Hood slope
  hood.rotation.x = -0.1;
  hood.position.y -= 0.02;

  // Trunk (Rear)
  const trunkL = L * 0.25;
  const trunk = addBox(trunkL, H * 0.35, W * 0.9, bodyMat, -L * 0.65, groundY + H * 0.55, 0);
  trunk.rotation.x = 0.15;

  // Rear Deck / Spoiler hint
  const deck = addBox(L * 0.15, 0.04, W * 0.92, bodyMat, -L * 0.82, groundY + H * 0.75, 0);

  // --- Windows ---
  // Side Window Area (Glass)
  const windowH = cabinH * 0.7;
  const windowL = cabinL * 0.85;
  const windowY = groundY + H * 0.65;
  
  // Front Side Window
  addBox(windowL * 0.45, windowH * 0.9, 0.02, glassMat, -L * 0.05, windowY, W * 0.43);
  addBox(windowL * 0.45, windowH * 0.9, 0.02, glassMat, -L * 0.05, windowY, -W * 0.43);
  
  // Rear Side Window (Quarter glass)
  addBox(windowL * 0.35, windowH * 0.8, 0.02, glassMat, -L * 0.55, windowY, W * 0.43);
  addBox(windowL * 0.35, windowH * 0.8, 0.02, glassMat, -L * 0.55, windowY, -W * 0.43);

  // Windshield (Front Glass)
  const windH = H * 0.4;
  const windW = W * 0.85;
  const wind = addBox(0.02, windH, windW, glassMat, L * 0.28, groundY + H * 0.65, 0);
  wind.rotation.y = Math.PI / 2;
  wind.rotation.z = -0.4; // Slope

  // Rear Window
  const rearWindH = H * 0.35;
  const rearWindW = W * 0.8;
  const rearWind = addBox(0.02, rearWindH, rearWindW, glassMat, -L * 0.75, groundY + H * 0.75, 0);
  rearWind.rotation.y = Math.PI / 2;
  rearWind.rotation.z = 0.5;

  // --- Chrome Trim ---
  // Window Line Trim (Top of glass)
  const trimY = windowY + windowH * 0.5;
  addBox(cabinL * 0.9, 0.015, 0.01, chromeMat, -L * 0.1, trimY, W * 0.435);
  addBox(cabinL * 0.9, 0.015, 0.01, chromeMat, -L * 0.1, trimY, -W * 0.435);
  
  // Lower Side Skirt Trim
  addBox(L * 0.85, 0.015, 0.01, chromeMat, 0, groundY + H * 0.15, W * 0.48);
  addBox(L * 0.85, 0.015, 0.01, chromeMat, 0, groundY + H * 0.15, -W * 0.48);

  // --- Wheels ---
  function createWheel(x, z) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, groundY + wheelR, z);
    root.add(wheelGroup);

    // Tire
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 24),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Rim Base
    const rimBase = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR * 0.85, wheelR * 0.85, wheelW + 0.005, 16),
      rimMat
    );
    rimBase.rotation.z = Math.PI / 2;
    wheelGroup.add(rimBase);

    // Multi-spoke design (Simple crossed cylinders)
    const spokeGroup = new THREE.Group();
    const spokeGeom = new THREE.BoxGeometry(wheelR * 1.6, 0.015, 0.02);
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      spoke.rotation.z = (i / 5) * Math.PI * 2;
      spokeGroup.add(spoke);
    }
    // Rotate the whole spoke assembly slightly for style
    spokeGroup.rotation.z = Math.PI / 10;
    wheelGroup.add(spokeGroup);

    // Center Cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR * 0.2, wheelR * 0.2, 0.02, 16),
      chromeMat
    );
    cap.rotation.z = Math.PI / 2;
    wheelGroup.add(cap);
  }

  createWheel(L * 0.55, W * 0.5);  // Front Right
  createWheel(L * 0.55, -W * 0.5); // Front Left
  createWheel(-L * 0.55, W * 0.5); // Rear Right
  createWheel(-L * 0.55, -W * 0.5);// Rear Left

  // --- Details ---

  // Headlights
  const hlW = 0.12;
  const hlH = 0.06;
  const hlD = 0.04;
  // Main headlight
  addBox(hlW, hlH, hlD, headLightMat, L * 0.88, groundY + H * 0.45, W * 0.35);
  addBox(hlW, hlH, hlD, headLightMat, L * 0.88, groundY + H * 0.45, -W * 0.35);
  
  // DRL Strip (Thin line)
  addBox(hlW * 0.8, 0.01, 0.01, headLightMat, L * 0.88, groundY + H * 0.42, W * 0.42);
  addBox(hlW * 0.8, 0.01, 0.01, headLightMat, L * 0.88, groundY + H * 0.42, -W * 0.42);

  // Taillights
  const tlW = 0.15;
  const tlH = 0.08;
  const tlD = 0.03;
  addBox(tlW, tlH, tlD, tailLightMat, -L * 0.88, groundY + H * 0.55, W * 0.38);
  addBox(tlW, tlH, tlD, tailLightMat, -L * 0.88, groundY + H * 0.55, -W * 0.38);

  // Side Mirrors
  const mirrorY = groundY + H * 0.6;
  const mirrorX = L * 0.35;
  const mirrorGeom = new THREE.BoxGeometry(0.08, 0.05, 0.12);
  const mirrorL = new THREE.Mesh(mirrorGeom, bodyMat);
  mirrorL.position.set(mirrorX, mirrorY, W * 0.52);
  root.add(mirrorL);
  const mirrorR = new THREE.Mesh(mirrorGeom, bodyMat);
  mirrorR.position.set(mirrorX, mirrorY, -W * 0.52);
  root.add(mirrorR);

  // Door Handles
  const handleW = 0.08;
  const handleH = 0.02;
  const handleD = 0.015;
  const handleY = groundY + H * 0.45;
  // Front Door
  addBox(handleW, handleH, handleD, chromeMat, L * 0.35, handleY, W * 0.485);
  addBox(handleW, handleH, handleD, chromeMat, L * 0.35, handleY, -W * 0.485);
  // Rear Door
  addBox(handleW, handleH, handleD, chromeMat, -L * 0.25, handleY, W * 0.485);
  addBox(handleW, handleH, handleD, chromeMat, -L * 0.25, handleY, -W * 0.485);

  // Side Vent (Fender badge area)
  const ventW = 0.1;
  const ventH = 0.03;
  const ventD = 0.01;
  addBox(ventW, ventH, ventD, chromeMat, L * 0.65, groundY + H * 0.48, W * 0.485);
  addBox(ventW, ventH, ventD, chromeMat, L * 0.65, groundY + H * 0.48, -W * 0.485);

  // Shark Fin Antenna
  const antBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.08), bodyMat);
  antBase.position.set(-L * 0.3, groundY + H * 0.83, 0);
  root.add(antBase);
  const antFin = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), bodyMat);
  antFin.position.set(-L * 0.3, groundY + H * 0.86, 0);
  antFin.rotation.z = Math.PI / 4; // Tilt back
  root.add(antFin);

  // Grille (Front)
  const grilleW = W * 0.6;
  const grilleH = 0.15;
  const grilleD = 0.02;
  const grille = addBox(grilleW, grilleH, grilleD, chromeMat, L * 0.91, groundY + H * 0.35, 0);
  grille.rotation.y = Math.PI / 2;
  
  // Grille Slats
  for(let i=-2; i<=2; i++) {
     addBox(0.01, grilleH * 0.8, 0.01, bodyMat, L * 0.915, groundY + H * 0.35 + i*0.03, 0);
  }

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