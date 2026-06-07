export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bright glossy red toy paint
  const redPaintMat = new THREE.MeshStandardMaterial({
    color: 0xe63939,
    metalness: 0.1,
    roughness: 0.3,
  });

  // Chrome bumpers and handles
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Black rubber tires
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Silver hubcaps
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Dark tinted glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Headlights (slightly yellowish white)
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.4,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Dimensions ---
  const wheelR = 0.11;
  const wheelW = 0.05;
  const bodyW = 0.48; // Total width including fenders
  const bodyH = 0.45;
  const bodyL = 1.0;
  const cabinH = 0.22;
  const fenderR = 0.13;

  // --- Body Construction ---

  // 1. Main Cabin (The dome)
  // Using a sphere scaled to form the rounded roof
  const cabinGeom = new THREE.SphereGeometry(0.24, 32, 32);
  const cabin = new THREE.Mesh(cabinGeom, redPaintMat);
  cabin.scale.set(1.0, 0.85, 0.9);
  cabin.position.set(0, 0.28, -0.05);
  root.add(cabin);

  // 2. Hood (Front rounded section)
  const hoodGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const hood = new THREE.Mesh(hoodGeom, redPaintMat);
  hood.scale.set(0.95, 0.7, 0.6);
  hood.position.set(0, 0.18, 0.35);
  root.add(hood);

  // 3. Trunk (Rear rounded section)
  const trunkGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const trunk = new THREE.Mesh(trunkGeom, redPaintMat);
  trunk.scale.set(0.95, 0.75, 0.55);
  trunk.position.set(0, 0.20, -0.40);
  root.add(trunk);

  // 4. Fenders (4 rounded bulges over wheels)
  // Front Left
  const fenderFL = new THREE.Mesh(new THREE.SphereGeometry(fenderR, 32, 32), redPaintMat);
  fenderFL.scale.set(1.1, 1.0, 1.0);
  fenderFL.position.set(-bodyW / 2 + 0.05, 0.12, 0.32);
  root.add(fenderFL);

  // Front Right
  const fenderFR = new THREE.Mesh(new THREE.SphereGeometry(fenderR, 32, 32), redPaintMat);
  fenderFR.scale.set(1.1, 1.0, 1.0);
  fenderFR.position.set(bodyW / 2 - 0.05, 0.12, 0.32);
  root.add(fenderFR);

  // Rear Left
  const fenderRL = new THREE.Mesh(new THREE.SphereGeometry(fenderR, 32, 32), redPaintMat);
  fenderRL.scale.set(1.1, 1.0, 1.0);
  fenderRL.position.set(-bodyW / 2 + 0.05, 0.12, -0.32);
  root.add(fenderRL);

  // Rear Right
  const fenderRR = new THREE.Mesh(new THREE.SphereGeometry(fenderR, 32, 32), redPaintMat);
  fenderRR.scale.set(1.1, 1.0, 1.0);
  fenderRR.position.set(bodyW / 2 - 0.05, 0.12, -0.32);
  root.add(fenderRR);

  // 5. Running Boards (Step areas below doors)
  const boardGeom = new THREE.BoxGeometry(0.08, 0.04, 0.55);
  const boardL = new THREE.Mesh(boardGeom, redPaintMat);
  boardL.position.set(-bodyW / 2 - 0.02, 0.06, 0.0);
  root.add(boardL);

  const boardR = new THREE.Mesh(boardGeom, redPaintMat);
  boardR.position.set(bodyW / 2 + 0.02, 0.06, 0.0);
  root.add(boardR);

  // 6. Lower Body Chassis (Connecting the fenders and boards)
  const chassisGeom = new THREE.BoxGeometry(bodyW - 0.1, 0.12, 0.85);
  const chassis = new THREE.Mesh(chassisGeom, redPaintMat);
  chassis.position.set(0, 0.06, 0.0);
  // Round the chassis box slightly by scaling or just rely on fenders covering corners
  root.add(chassis);


  // --- Wheels ---
  const wheelGroup = new THREE.Group();
  
  // Tire
  const tireGeom = new THREE.TorusGeometry(wheelR, wheelW / 2, 16, 24);
  const tire = new THREE.Mesh(tireGeom, tireMat);
  tire.rotation.y = Math.PI / 2; // Face outward
  wheelGroup.add(tire);

  // Hubcap
  const hubGeom = new THREE.CylinderGeometry(wheelR * 0.6, wheelR * 0.6, 0.02, 24);
  const hub = new THREE.Mesh(hubGeom, hubMat);
  hub.rotation.x = Math.PI / 2; // Face outward (aligned with tire)
  hub.position.z = 0.005; // Slight offset from center
  wheelGroup.add(hub);

  // Center Cap detail
  const capGeom = new THREE.SphereGeometry(wheelR * 0.2, 16, 16);
  const cap = new THREE.Mesh(capGeom, chromeMat);
  cap.position.z = 0.015;
  wheelGroup.add(cap);

  // Position wheels
  const wheelPositions = [
    { x: -bodyW / 2, z: 0.32 },  // Front Left
    { x: bodyW / 2, z: 0.32 },   // Front Right
    { x: -bodyW / 2, z: -0.32 }, // Rear Left
    { x: bodyW / 2, z: -0.32 }   // Rear Right
  ];

  for (const pos of wheelPositions) {
    const w = wheelGroup.clone();
    w.position.set(pos.x, wheelR, pos.z);
    // Rotate right side wheels 180 deg around Y so hubs face out correctly if needed, 
    // but Torus rotation.y = PI/2 makes them face X axis.
    // Left wheels (x < 0) face -X. Right wheels (x > 0) face +X.
    // Default Torus faces Z. Rotation.y = PI/2 makes it face X.
    // For left side, we want it to face -X? No, tires are symmetric.
    // But hubcaps need to face out.
    if (pos.x > 0) {
      w.rotation.y = Math.PI; // Flip right side wheels
    }
    root.add(w);
  }

  // --- Bumpers ---
  // Front Bumper (Curved tube)
  const frontBumperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.05, 0.48),
    new THREE.Vector3(-0.15, 0.03, 0.54),
    new THREE.Vector3(0.0, 0.02, 0.56),
    new THREE.Vector3(0.15, 0.03, 0.54),
    new THREE.Vector3(0.22, 0.05, 0.48),
  ]);
  const frontBumperGeom = new THREE.TubeGeometry(frontBumperCurve, 20, 0.018, 12, false);
  const frontBumper = new THREE.Mesh(frontBumperGeom, chromeMat);
  root.add(frontBumper);

  // Rear Bumper
  const rearBumperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.05, -0.48),
    new THREE.Vector3(-0.15, 0.03, -0.54),
    new THREE.Vector3(0.0, 0.02, -0.56),
    new THREE.Vector3(0.15, 0.03, -0.54),
    new THREE.Vector3(0.22, 0.05, -0.48),
  ]);
  const rearBumperGeom = new THREE.TubeGeometry(rearBumperCurve, 20, 0.018, 12, false);
  const rearBumper = new THREE.Mesh(rearBumperGeom, chromeMat);
  root.add(rearBumper);

  // --- Windows ---
  // Side Windows (Trapezoidal-ish, simulated with rotated boxes)
  const windowSideGeom = new THREE.BoxGeometry(0.02, 0.14, 0.25);
  
  // Left Side Window
  const winL = new THREE.Mesh(windowSideGeom, glassMat);
  winL.position.set(-0.20, 0.32, -0.05);
  winL.rotation.z = 0.1; // Slight tilt
  root.add(winL);

  // Right Side Window
  const winR = new THREE.Mesh(windowSideGeom, glassMat);
  winR.position.set(0.20, 0.32, -0.05);
  winR.rotation.z = -0.1;
  root.add(winR);

  // Windshield (Front)
  const windshieldGeom = new THREE.BoxGeometry(0.35, 0.12, 0.02);
  const windshield = new THREE.Mesh(windshieldGeom, glassMat);
  windshield.position.set(0, 0.30, 0.18);
  windshield.rotation.x = 0.6; // Slope back
  root.add(windshield);

  // Rear Window
  const rearWindowGeom = new THREE.BoxGeometry(0.32, 0.10, 0.02);
  const rearWindow = new THREE.Mesh(rearWindowGeom, glassMat);
  rearWindow.position.set(0, 0.28, -0.28);
  rearWindow.rotation.x = -0.5; // Slope forward
  root.add(rearWindow);

  // --- Details ---

  // Headlights (Front Fenders)
  const headlightGeom = new THREE.SphereGeometry(0.045, 24, 24);
  
  const hlFL = new THREE.Mesh(headlightGeom, lightMat);
  hlFL.position.set(-0.18, 0.14, 0.46);
  hlFL.scale.set(1, 1, 0.6); // Flatten slightly
  root.add(hlFL);

  const hlFR = new THREE.Mesh(headlightGeom, lightMat);
  hlFR.position.set(0.18, 0.14, 0.46);
  hlFR.scale.set(1, 1, 0.6);
  root.add(hlFR);

  // Door Handles (Small chrome cylinders)
  const handleGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 12);
  
  const handleL = new THREE.Mesh(handleGeom, chromeMat);
  handleL.rotation.z = Math.PI / 2;
  handleL.position.set(-0.21, 0.22, 0.05);
  root.add(handleL);

  const handleR = new THREE.Mesh(handleGeom, chromeMat);
  handleR.rotation.z = Math.PI / 2;
  handleR.position.set(0.21, 0.22, 0.05);
  root.add(handleR);

  // Door Seams (Thin dark lines to separate doors)
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x880000 }); // Darker red line
  const seamGeom = new THREE.BoxGeometry(0.005, 0.18, 0.005);
  
  const seamFront = new THREE.Mesh(seamGeom, seamMat);
  seamFront.position.set(-0.10, 0.22, 0.15);
  root.add(seamFront);

  const seamRear = new THREE.Mesh(seamGeom, seamMat);
  seamRear.position.set(-0.10, 0.22, -0.15);
  root.add(seamRear);

  // Right side seams (mirrored)
  const seamFrontR = new THREE.Mesh(seamGeom, seamMat);
  seamFrontR.position.set(0.10, 0.22, 0.15);
  root.add(seamFrontR);

  const seamRearR = new THREE.Mesh(seamGeom, seamMat);
  seamRearR.position.set(0.10, 0.22, -0.15);
  root.add(seamRearR);


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