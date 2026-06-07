export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd92b2b,
    metalness: 0.1,
    roughness: 0.3,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x222233,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0xffffee,
    emissiveIntensity: 0.5,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    metalness: 0.2,
    roughness: 0.4,
    emissive: 0xff3300,
    emissiveIntensity: 0.4,
  });

  // --- Dimensions ---
  const bodyW = 0.42;
  const bodyH = 0.24;
  const bodyL = 0.90;
  const wheelR = 0.115;
  const wheelZ_F = 0.32;
  const wheelZ_R = -0.32;
  const wheelX = bodyW / 2 + 0.02;
  const wheelY = wheelR;

  // --- Body Construction ---

  // 1. Main Lower Chassis (The "tub")
  const chassisGeom = new THREE.BoxGeometry(bodyW, bodyH * 0.6, bodyL * 0.9);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = bodyH * 0.3;
  root.add(chassis);

  // 2. Upper Cabin (Roof) - Using a scaled sphere for the dome shape
  const roofGeom = new THREE.SphereGeometry(bodyW * 0.45, 32, 32);
  const roof = new THREE.Mesh(roofGeom, bodyMat);
  roof.scale.set(1, 0.6, 0.9);
  roof.position.set(0, bodyH * 0.9, -0.05);
  root.add(roof);

  // 3. Front Fenders (Left & Right)
  const fenderGeom = new THREE.SphereGeometry(wheelR * 1.4, 32, 32);
  
  const frontFenderL = new THREE.Mesh(fenderGeom, bodyMat);
  frontFenderL.position.set(-wheelX, wheelY * 0.8, wheelZ_F);
  frontFenderL.scale.set(0.9, 0.9, 0.8);
  root.add(frontFenderL);

  const frontFenderR = new THREE.Mesh(fenderGeom, bodyMat);
  frontFenderR.position.set(wheelX, wheelY * 0.8, wheelZ_F);
  frontFenderR.scale.set(0.9, 0.9, 0.8);
  root.add(frontFenderR);

  // 4. Rear Fenders (Left & Right)
  const rearFenderL = new THREE.Mesh(fenderGeom, bodyMat);
  rearFenderL.position.set(-wheelX, wheelY * 0.8, wheelZ_R);
  rearFenderL.scale.set(0.9, 0.9, 0.8);
  root.add(rearFenderL);

  const rearFenderR = new THREE.Mesh(fenderGeom, bodyMat);
  rearFenderR.position.set(wheelX, wheelY * 0.8, wheelZ_R);
  rearFenderR.scale.set(0.9, 0.9, 0.8);
  root.add(rearFenderR);

  // 5. Hood (Front Nose)
  const hoodGeom = new THREE.SphereGeometry(bodyW * 0.45, 32, 32);
  const hood = new THREE.Mesh(hoodGeom, bodyMat);
  hood.position.set(0, bodyH * 0.5, bodyL * 0.45);
  hood.scale.set(1.1, 0.6, 0.7);
  root.add(hood);

  // 6. Trunk (Rear Engine Deck)
  const trunkGeom = new THREE.SphereGeometry(bodyW * 0.45, 32, 32);
  const trunk = new THREE.Mesh(trunkGeom, bodyMat);
  trunk.position.set(0, bodyH * 0.5, -bodyL * 0.45);
  trunk.scale.set(1.1, 0.6, 0.7);
  root.add(trunk);

  // --- Running Boards (Side Steps) ---
  const stepGeom = new THREE.BoxGeometry(0.08, 0.04, bodyL * 0.6);
  const stepL = new THREE.Mesh(stepGeom, bodyMat);
  stepL.position.set(-bodyW / 2 - 0.02, bodyH * 0.15, 0);
  root.add(stepL);

  const stepR = new THREE.Mesh(stepGeom, bodyMat);
  stepR.position.set(bodyW / 2 + 0.02, bodyH * 0.15, 0);
  root.add(stepR);

  // --- Wheels ---
  function createWheel(x, z) {
    const wheelGroup = new THREE.Group();
    
    // Tire
    const tireGeom = new THREE.TorusGeometry(wheelR, 0.04, 16, 32);
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Hubcap
    const hubGeom = new THREE.CylinderGeometry(wheelR * 0.5, wheelR * 0.5, 0.02, 24);
    const hub = new THREE.Mesh(hubGeom, chromeMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    // Center Cap
    const capGeom = new THREE.SphereGeometry(wheelR * 0.2, 16, 16);
    const cap = new THREE.Mesh(capGeom, chromeMat);
    cap.scale.set(1, 1, 0.5);
    wheelGroup.add(cap);

    wheelGroup.position.set(x, wheelY, z);
    root.add(wheelGroup);
  }

  createWheel(-wheelX, wheelZ_F);
  createWheel(wheelX, wheelZ_F);
  createWheel(-wheelX, wheelZ_R);
  createWheel(wheelX, wheelZ_R);

  // --- Bumpers ---
  // Front Bumper
  const bumperCurveF = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-bodyW * 0.6, 0.05, bodyL * 0.48),
    new THREE.Vector3(0, 0.05, bodyL * 0.54),
    new THREE.Vector3(bodyW * 0.6, 0.05, bodyL * 0.48)
  );
  const bumperGeomF = new THREE.TubeGeometry(bumperCurveF, 20, 0.025, 8, false);
  const bumperF = new THREE.Mesh(bumperGeomF, chromeMat);
  root.add(bumperF);

  // Rear Bumper
  const bumperCurveR = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-bodyW * 0.6, 0.05, -bodyL * 0.48),
    new THREE.Vector3(0, 0.05, -bodyL * 0.54),
    new THREE.Vector3(bodyW * 0.6, 0.05, -bodyL * 0.48)
  );
  const bumperGeomR = new THREE.TubeGeometry(bumperCurveR, 20, 0.025, 8, false);
  const bumperR = new THREE.Mesh(bumperGeomR, chromeMat);
  root.add(bumperR);

  // --- Headlights ---
  const hlGeom = new THREE.SphereGeometry(0.05, 16, 16);
  const hlL = new THREE.Mesh(hlGeom, headlightMat);
  hlL.position.set(-bodyW * 0.4, bodyH * 0.5, bodyL * 0.48);
  root.add(hlL);

  const hlR = new THREE.Mesh(hlGeom, headlightMat);
  hlR.position.set(bodyW * 0.4, bodyH * 0.5, bodyL * 0.48);
  root.add(hlR);

  // --- Taillights ---
  const tlGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
  const tlL = new THREE.Mesh(tlGeom, taillightMat);
  tlL.rotation.x = Math.PI / 2;
  tlL.position.set(-bodyW * 0.35, bodyH * 0.5, -bodyL * 0.48);
  root.add(tlL);

  const tlR = new THREE.Mesh(tlGeom, taillightMat);
  tlR.rotation.x = Math.PI / 2;
  tlR.position.set(bodyW * 0.35, bodyH * 0.5, -bodyL * 0.48);
  root.add(tlR);

  // --- Windows ---
  // Windshield
  const wsGeom = new THREE.PlaneGeometry(bodyW * 0.7, 0.18);
  const ws = new THREE.Mesh(wsGeom, glassMat);
  ws.position.set(0, bodyH * 0.7, bodyL * 0.35);
  ws.rotation.x = -Math.PI / 3;
  root.add(ws);

  // Rear Window
  const rwGeom = new THREE.PlaneGeometry(bodyW * 0.7, 0.15);
  const rw = new THREE.Mesh(rwGeom, glassMat);
  rw.position.set(0, bodyH * 0.7, -bodyL * 0.38);
  rw.rotation.x = Math.PI / 3;
  root.add(rw);

  // Side Windows (Left)
  const swGeom = new THREE.PlaneGeometry(0.25, 0.14);
  const swL = new THREE.Mesh(swGeom, glassMat);
  swL.position.set(-bodyW / 2 - 0.01, bodyH * 0.75, -0.05);
  swL.rotation.y = Math.PI / 2;
  root.add(swL);

  // Side Windows (Right)
  const swR = new THREE.Mesh(swGeom, glassMat);
  swR.position.set(bodyW / 2 + 0.01, bodyH * 0.75, -0.05);
  swR.rotation.y = -Math.PI / 2;
  root.add(swR);

  // --- Door Handles ---
  const handleGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8);
  const handleL = new THREE.Mesh(handleGeom, chromeMat);
  handleL.rotation.z = Math.PI / 2;
  handleL.position.set(-bodyW / 2 - 0.01, bodyH * 0.55, 0.1);
  root.add(handleL);

  const handleR = new THREE.Mesh(handleGeom, chromeMat);
  handleR.rotation.z = Math.PI / 2;
  handleR.position.set(bodyW / 2 + 0.01, bodyH * 0.55, 0.1);
  root.add(handleR);

  // --- Normalize ---
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