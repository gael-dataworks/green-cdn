export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.1,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0044ff,
    emissive: 0x0044ff,
    emissiveIntensity: 2.5,
    roughness: 0.2,
    metalness: 0.0,
  });

  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });

  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.7,
    metalness: 0.2,
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.3,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Dimensions ---
  const size = 0.45; // Main cube size
  const cornerRadius = 0.06;
  const speakerRadius = 0.16;
  const ledThickness = 0.012;
  const ledRadius = speakerRadius + 0.025;

  // --- Main Body ---
  // Using a box for the core structure. The "rounded" look is emphasized by the trim rings.
  const bodyGeom = new THREE.BoxGeometry(size, size, size);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Front Speaker Assembly ---
  const frontGroup = new THREE.Group();
  frontGroup.position.z = size / 2 + 0.005; // Slightly in front of body

  // Front LED Ring
  const frontLedGeom = new THREE.TorusGeometry(ledRadius, ledThickness, 16, 32);
  const frontLed = new THREE.Mesh(frontLedGeom, ledMat);
  // Torus is XY plane, we want it facing Z, so rotate X 90 deg
  frontLed.rotation.x = Math.PI / 2;
  frontGroup.add(frontLed);

  // Speaker Grille (Circle behind the cone)
  const grilleGeom = new THREE.CircleGeometry(speakerRadius, 32);
  const grille = new THREE.Mesh(grilleGeom, grilleMat);
  grille.rotation.x = Math.PI / 2;
  grille.position.z = -0.01; // Behind the LED ring
  frontGroup.add(grille);

  // Speaker Cone (Cylinder tapered)
  const coneGeom = new THREE.CylinderGeometry(speakerRadius * 0.85, speakerRadius * 0.4, 0.04, 32);
  const cone = new THREE.Mesh(coneGeom, coneMat);
  cone.rotation.x = Math.PI / 2;
  cone.position.z = 0.02;
  frontGroup.add(cone);

  // Dust Cap (Center)
  const capGeom = new THREE.CylinderGeometry(speakerRadius * 0.3, speakerRadius * 0.3, 0.05, 32);
  const cap = new THREE.Mesh(capGeom, bodyMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.04;
  frontGroup.add(cap);

  root.add(frontGroup);

  // --- Side Passive Radiator Assembly ---
  const sideGroup = new THREE.Group();
  sideGroup.position.x = size / 2 + 0.005;
  sideGroup.rotation.y = Math.PI / 2; // Face outward

  // Side LED Ring
  const sideLed = new THREE.Mesh(frontLedGeom, ledMat);
  sideLed.rotation.x = Math.PI / 2;
  sideGroup.add(sideLed);

  // Passive Radiator (Oval-ish shape, using scaled sphere or cylinder)
  // Using a flattened sphere for a soft dome look
  const radGeom = new THREE.SphereGeometry(speakerRadius, 32, 32);
  const radiator = new THREE.Mesh(radGeom, bodyMat);
  radiator.scale.set(1, 1.2, 0.3); // Flatten Z, stretch Y slightly
  radiator.rotation.x = Math.PI / 2;
  radiator.position.z = -0.02;
  sideGroup.add(radiator);

  root.add(sideGroup);

  // --- Top Controls ---
  const topGroup = new THREE.Group();
  topGroup.position.y = size / 2 + 0.005;
  topGroup.rotation.x = -Math.PI / 2; // Face up

  // USB Port (Small black rectangle)
  const usbGeom = new THREE.BoxGeometry(0.04, 0.015, 0.01);
  const usb = new THREE.Mesh(usbGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
  usb.position.set(-0.12, 0, 0);
  topGroup.add(usb);

  // Buttons (Small circles)
  const btnGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  
  // Power button
  const btnPower = new THREE.Mesh(btnGeom, buttonMat);
  btnPower.position.set(0.05, 0.005, 0);
  topGroup.add(btnPower);

  // Volume/Track buttons (smaller dots)
  const dotGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 16);
  const dotMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x0044ff, emissiveIntensity: 0.5 });
  
  const positions = [
    [0.05, 0.04], [0.08, 0.04], [0.11, 0.04], // Row 1
    [0.05, 0.08], [0.08, 0.08], [0.11, 0.08]  // Row 2
  ];

  positions.forEach(([x, y]) => {
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.set(x, 0.002, y);
    topGroup.add(dot);
  });

  root.add(topGroup);

  // --- Feet ---
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
  const footOffset = size / 2 - 0.05;
  const footPositions = [
    [-footOffset, -size/2, -footOffset],
    [footOffset, -size/2, -footOffset],
    [-footOffset, -size/2, footOffset],
    [footOffset, -size/2, footOffset],
  ];

  footPositions.forEach(([x, y, z]) => {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(x, y, z);
    root.add(foot);
  });

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