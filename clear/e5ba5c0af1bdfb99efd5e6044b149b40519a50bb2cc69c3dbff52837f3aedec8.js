export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Speaker cone / inner parts (dark matte)
  const speakerMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Grille mesh (dark gray with texture)
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Blue LED / Glow material
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x0044ff,
    emissiveIntensity: 2.5,
  });

  // Button material (dark with slight glow)
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0x002266,
    emissiveIntensity: 0.5,
  });

  // USB Port (dark slot)
  const portMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Rubber feet
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Grille Texture ---
  // Create a simple dot grid pattern for the speaker mesh
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Create a grid of dots
      const isDot = (x % 8 < 4) && (y % 8 < 4);
      const val = isDot ? 60 : 20; // Dark gray dots on blacker background
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  const grilleTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.wrapS = THREE.RepeatWrapping;
  grilleTexture.wrapT = THREE.RepeatWrapping;
  grilleTexture.repeat.set(10, 10);
  grilleTexture.needsUpdate = true;
  grilleMat.map = grilleTexture;
  grilleMat.bumpMap = grilleTexture;
  grilleMat.bumpScale = 0.005;

  // --- Main Body ---
  // Use a scaled sphere to approximate a rounded cube (pillowy shape)
  const bodyGeom = new THREE.SphereGeometry(0.5, 48, 48);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.scale.set(1.0, 1.0, 0.9); // Flatten slightly on Z
  root.add(body);

  // --- Front Speaker Assembly ---
  const frontGroup = new THREE.Group();
  frontGroup.position.set(0, 0, 0.45); // Push to front face
  root.add(frontGroup);

  // Speaker Grille (Base circle)
  const grilleGeom = new THREE.CircleGeometry(0.38, 64);
  const grille = new THREE.Mesh(grilleGeom, grilleMat);
  grille.position.z = 0.01; // Slightly in front of body
  frontGroup.add(grille);

  // Speaker Cone (Inner part)
  const coneGeom = new THREE.CylinderGeometry(0.18, 0.28, 0.04, 32);
  const cone = new THREE.Mesh(coneGeom, speakerMat);
  cone.rotation.x = Math.PI / 2; // Face forward
  cone.position.z = 0.02;
  frontGroup.add(cone);

  // Dust Cap (Center)
  const capGeom = new THREE.SphereGeometry(0.12, 32, 32);
  const cap = new THREE.Mesh(capGeom, speakerMat);
  cap.scale.set(1, 1, 0.3); // Flatten
  cap.position.z = 0.04;
  frontGroup.add(cap);

  // Front LED Ring (Individual LEDs)
  const ledCount = 24;
  const ledRadius = 0.34;
  const ledGeom = new THREE.SphereGeometry(0.015, 8, 8);
  for (let i = 0; i < ledCount; i++) {
    const angle = (i / ledCount) * Math.PI * 2;
    const lx = Math.cos(angle) * ledRadius;
    const ly = Math.sin(angle) * ledRadius;
    const led = new THREE.Mesh(ledGeom, ledMat);
    led.position.set(lx, ly, 0.015);
    frontGroup.add(led);
  }

  // --- Side Panel (Passive Radiator style) ---
  const sideGroup = new THREE.Group();
  sideGroup.position.set(0.45, 0, 0);
  sideGroup.rotation.y = Math.PI / 2;
  root.add(sideGroup);

  // Side Panel Shape (Rounded Triangle / Squircle hybrid)
  const sideShape = new THREE.Shape();
  const r = 0.35;
  // Draw a soft triangle
  sideShape.moveTo(0, r);
  sideShape.quadraticCurveTo(r * 0.8, r * 0.8, r * 0.9, 0);
  sideShape.quadraticCurveTo(r * 0.8, -r * 0.8, 0, -r);
  sideShape.quadraticCurveTo(-r * 0.5, -r * 0.5, -r * 0.5, 0);
  sideShape.quadraticCurveTo(-r * 0.5, r * 0.5, 0, r);

  const sideExtrudeSettings = { depth: 0.02, bevelEnabled: false };
  const sideGeom = new THREE.ExtrudeGeometry(sideShape, sideExtrudeSettings);
  // Center the geometry
  sideGeom.center();
  const sidePanel = new THREE.Mesh(sideGeom, bodyMat);
  sidePanel.position.z = 0.01;
  sideGroup.add(sidePanel);

  // Side LED Ring (Follows the panel perimeter roughly)
  // Using a Torus for simplicity, scaled to match the panel vibe
  const sideLedGeom = new THREE.TorusGeometry(0.32, 0.015, 8, 32);
  const sideLed = new THREE.Mesh(sideLedGeom, ledMat);
  sideLed.position.z = 0.02;
  sideGroup.add(sideLed);

  // --- Top Controls ---
  const topGroup = new THREE.Group();
  topGroup.position.set(0, 0.45, 0);
  topGroup.rotation.x = -Math.PI / 2;
  root.add(topGroup);

  // Button layout: A row of small circular buttons
  const buttonGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  const buttonPositions = [
    [-0.25, 0], [-0.15, 0], [-0.05, 0], [0.05, 0], [0.15, 0], [0.25, 0]
  ];

  for (const [bx, by] of buttonPositions) {
    const btn = new THREE.Mesh(buttonGeom, buttonMat);
    btn.position.set(bx, by, 0.005);
    topGroup.add(btn);
  }

  // USB Port (Small rectangular slot near edge)
  const portGeom = new THREE.BoxGeometry(0.06, 0.02, 0.01);
  const port = new THREE.Mesh(portGeom, portMat);
  port.position.set(0.35, 0, 0.005);
  topGroup.add(port);

  // --- Feet ---
  const footGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const footPositions = [
    [-0.35, -0.35, 0.35], [0.35, -0.35, 0.35],
    [-0.35, -0.35, -0.35], [0.35, -0.35, -0.35]
  ];

  for (const [fx, fy, fz] of footPositions) {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(fx, fy, fz);
    // Flatten the cylinder to look like a pad
    foot.scale.set(1, 0.5, 1);
    root.add(foot);
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