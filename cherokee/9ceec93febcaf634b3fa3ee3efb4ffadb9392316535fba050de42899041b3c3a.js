export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xD92B2B,
    metalness: 0.2,
    roughness: 0.3,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.2,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.1,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFE0,
    emissive: 0xFFFFE0,
    emissiveIntensity: 0.5,
    metalness: 0.0,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xFF4500,
    emissive: 0xFF4500,
    emissiveIntensity: 0.5,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Dimensions ---
  const L = 1.0;
  const W = 0.45;
  const H = 0.45;
  const wheelR = 0.11;
  const wheelW = 0.08;
  const axleY = -0.15;
  const frontZ = 0.35;
  const rearZ = -0.35;

  // --- Body Construction ---
  
  // 1. Lower Chassis / Running Board area
  const chassisGeom = new THREE.BoxGeometry(W * 0.9, 0.12, L * 0.9);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = axleY + wheelR - 0.06; 
  chassis.position.z = 0;
  root.add(chassis);

  // 2. Main Body Tub (Mid section)
  const tubGeom = new THREE.BoxGeometry(W * 0.85, 0.22, L * 0.7);
  const tub = new THREE.Mesh(tubGeom, bodyMat);
  tub.position.y = axleY + wheelR + 0.11;
  tub.position.z = 0;
  root.add(tub);

  // 3. Cabin / Roof
  const cabinGeom = new THREE.BoxGeometry(W * 0.75, 0.18, L * 0.45);
  const cabin = new THREE.Mesh(cabinGeom, bodyMat);
  cabin.position.y = axleY + wheelR + 0.22 + 0.09;
  cabin.position.z = -0.05; 
  root.add(cabin);

  // 4. Front Hood Hump (Slope)
  const hoodGeom = new THREE.BoxGeometry(W * 0.8, 0.15, 0.25);
  const hood = new THREE.Mesh(hoodGeom, bodyMat);
  hood.position.y = axleY + wheelR + 0.11 + 0.075;
  hood.position.z = 0.35;
  hood.rotation.x = -0.15; 
  root.add(hood);

  // 5. Rear Deck Hump (Slope)
  const deckGeom = new THREE.BoxGeometry(W * 0.8, 0.15, 0.25);
  const deck = new THREE.Mesh(deckGeom, bodyMat);
  deck.position.y = axleY + wheelR + 0.11 + 0.075;
  deck.position.z = -0.35;
  deck.rotation.x = 0.15; 
  root.add(deck);

  // 6. Fenders (The iconic bulges)
  const fenderGeom = new THREE.SphereGeometry(0.13, 16, 16);
  const fenderPositions = [
    { x: -W/2 - 0.02, z: frontZ, y: axleY + wheelR }, 
    { x: W/2 + 0.02, z: frontZ, y: axleY + wheelR },  
    { x: -W/2 - 0.02, z: rearZ, y: axleY + wheelR },  
    { x: W/2 + 0.02, z: rearZ, y: axleY + wheelR },   
  ];
  
  fenderPositions.forEach(pos => {
    const fender = new THREE.Mesh(fenderGeom, bodyMat);
    fender.position.set(pos.x, pos.y, pos.z);
    fender.scale.set(1, 1, 1.2); 
    root.add(fender);
  });

  // --- Windows ---
  // Windshield
  const wsGeom = new THREE.PlaneGeometry(W * 0.6, 0.14);
  const windshield = new THREE.Mesh(wsGeom, glassMat);
  windshield.position.set(0, axleY + wheelR + 0.22 + 0.09, 0.18);
  windshield.rotation.x = -0.4; 
  root.add(windshield);

  // Rear Window
  const rwGeom = new THREE.PlaneGeometry(W * 0.6, 0.14);
  const rearWindow = new THREE.Mesh(rwGeom, glassMat);
  rearWindow.position.set(0, axleY + wheelR + 0.22 + 0.09, -0.28);
  rearWindow.rotation.x = 0.4; 
  root.add(rearWindow);

  // Side Windows
  const sideWinGeom = new THREE.PlaneGeometry(0.18, 0.12);
  for (const side of [-1, 1]) {
    const fsw = new THREE.Mesh(sideWinGeom, glassMat);
    fsw.position.set(side * (W/2 + 0.005), axleY + wheelR + 0.22 + 0.09, 0.05);
    fsw.rotation.y = side * Math.PI / 2;
    root.add(fsw);

    const rsw = new THREE.Mesh(sideWinGeom, glassMat);
    rsw.position.set(side * (W/2 + 0.005), axleY + wheelR + 0.22 + 0.09, -0.15);
    rsw.rotation.y = side * Math.PI / 2;
    root.add(rsw);
  }

  // --- Wheels ---
  const tireGeom = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 24);
  const hubGeom = new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, wheelW + 0.01, 16);
  
  const wheelPositions = [
    { x: -W/2 - 0.05, z: frontZ },
    { x: W/2 + 0.05, z: frontZ },
    { x: -W/2 - 0.05, z: rearZ },
    { x: W/2 + 0.05, z: rearZ },
  ];

  wheelPositions.forEach(pos => {
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(pos.x, axleY, pos.z);
    root.add(tire);

    const hub = new THREE.Mesh(hubGeom, chromeMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(pos.x, axleY, pos.z);
    root.add(hub);
  });

  // --- Bumpers ---
  // Front Bumper (Torus segment wrapping front)
  const bumperRadius = W * 0.45;
  const bumperTube = 0.02;
  const frontBumperTorus = new THREE.TorusGeometry(bumperRadius, bumperTube, 8, 16, Math.PI);
  const frontBumperCurved = new THREE.Mesh(frontBumperTorus, chromeMat);
  frontBumperCurved.position.set(0, axleY + wheelR - 0.05, frontZ);
  frontBumperCurved.rotation.x = Math.PI / 2; 
  root.add(frontBumperCurved);

  // Rear Bumper (Torus segment wrapping rear)
  const rearBumperCurved = new THREE.Mesh(frontBumperTorus, chromeMat);
  rearBumperCurved.position.set(0, axleY + wheelR - 0.05, rearZ);
  rearBumperCurved.rotation.x = Math.PI / 2;
  rearBumperCurved.rotation.y = Math.PI; 
  root.add(rearBumperCurved);

  // --- Lights ---
  const hlGeom = new THREE.SphereGeometry(0.035, 16, 16);
  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(hlGeom, headlightMat);
    hl.position.set(side * (W/2 + 0.05), axleY + wheelR + 0.05, frontZ + 0.05);
    root.add(hl);
  }

  const tlGeom = new THREE.SphereGeometry(0.03, 16, 16);
  for (const side of [-1, 1]) {
    const tl = new THREE.Mesh(tlGeom, taillightMat);
    tl.position.set(side * (W/2 - 0.05), axleY + wheelR + 0.1, rearZ - 0.05);
    root.add(tl);
  }

  // --- Details ---
  // Door Handles
  const handleGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.04, 8);
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(handleGeom, chromeMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(side * (W/2 + 0.01), axleY + wheelR + 0.15, 0.0);
    root.add(handle);
  }

  // Mirrors
  const mirrorGeom = new THREE.SphereGeometry(0.025, 16, 16);
  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(mirrorGeom, chromeMat);
    mirror.position.set(side * (W/2 + 0.06), axleY + wheelR + 0.25, 0.15);
    root.add(mirror);
  }

  // Running Boards
  const rbGeom = new THREE.BoxGeometry(0.04, 0.02, 0.5);
  for (const side of [-1, 1]) {
    const rb = new THREE.Mesh(rbGeom, bodyMat);
    rb.position.set(side * (W/2 + 0.02), axleY + wheelR - 0.05, 0.0);
    root.add(rb);
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