export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Dark mesh grille material
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Bright blue LED material
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0044ff,
    emissiveIntensity: 1.5,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Slightly lighter plastic for buttons
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Darker plastic for side passive radiator center
  const radiatorMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const size = 1.0;
  const depth = 1.0;
  const cornerRadius = 0.12;
  const wallThickness = 0.04;

  // --- Main Body (Rounded Cube via Extrude) ---
  // Create a rounded rectangle shape for the front/back profile
  const bodyShape = new THREE.Shape();
  const w = size / 2;
  const h = size / 2;
  const r = cornerRadius;
  
  // Draw rounded rect clockwise
  bodyShape.moveTo(-w + r, -h);
  bodyShape.lineTo(w - r, -h);
  bodyShape.quadraticCurveTo(w, -h, w, -h + r);
  bodyShape.lineTo(w, h - r);
  bodyShape.quadraticCurveTo(w, h, w - r, h);
  bodyShape.lineTo(-w + r, h);
  bodyShape.quadraticCurveTo(-w, h, -w, h - r);
  bodyShape.lineTo(-w, -h + r);
  bodyShape.quadraticCurveTo(-w, -h, -w + r, -h);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: depth,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  });
  // Center the extrusion
  bodyGeom.translate(0, 0, -depth / 2);
  
  const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(mainBody);

  // --- Front Face Assembly ---
  const frontGroup = new THREE.Group();
  frontGroup.position.z = depth / 2 + 0.005; // Slightly in front of body face
  root.add(frontGroup);

  // 1. Grille Background (The mesh texture)
  // We use a cylinder to simulate the curved grille surface slightly recessed
  const grilleRadius = size * 0.42;
  const grilleGeom = new THREE.CylinderGeometry(grilleRadius, grilleRadius, 0.02, 32);
  grilleGeom.rotateX(Math.PI / 2); // Face Z
  const grille = new THREE.Mesh(grilleGeom, grilleMat);
  grille.position.z = -0.02; // Recessed
  frontGroup.add(grille);

  // 2. Central Cone/Driver
  const coneBaseRadius = grilleRadius * 0.35;
  const coneTipRadius = grilleRadius * 0.15;
  const coneHeight = 0.08;
  const coneGeom = new THREE.CylinderGeometry(coneTipRadius, coneBaseRadius, coneHeight, 32);
  coneGeom.rotateX(Math.PI / 2);
  const cone = new THREE.Mesh(coneGeom, grilleMat);
  cone.position.z = 0.02; // Protruding slightly from grille
  frontGroup.add(cone);

  // 3. Front LED Ring
  // A torus around the grille
  const frontLedRadius = grilleRadius * 0.85;
  const frontLedTube = 0.015;
  const frontLedGeom = new THREE.TorusGeometry(frontLedRadius, frontLedTube, 16, 48);
  frontLedGeom.rotateY(Math.PI / 2); // Orient to face Z
  const frontLed = new THREE.Mesh(frontLedGeom, ledMat);
  frontLed.position.z = -0.01;
  frontGroup.add(frontLed);

  // --- Side Face Assembly (Right Side, +X) ---
  const sideGroup = new THREE.Group();
  sideGroup.position.set(size / 2 + 0.005, 0, 0);
  sideGroup.rotation.y = Math.PI / 2; // Face X
  root.add(sideGroup);

  // 1. Passive Radiator Shape (Rounded Triangle/Shield)
  const radShape = new THREE.Shape();
  const radSize = size * 0.75;
  // Draw a rounded triangle pointing left (towards back) or just a rounded rect variant
  // Let's do a rounded rectangle with one side more curved
  radShape.moveTo(-radSize/2, -radSize/2);
  radShape.lineTo(radSize/2, -radSize/2);
  radShape.quadraticCurveTo(radSize/2 + 0.1, 0, radSize/2, radSize/2);
  radShape.lineTo(-radSize/2, radSize/2);
  radShape.quadraticCurveTo(-radSize/2 - 0.1, 0, -radSize/2, -radSize/2);
  
  const radGeom = new THREE.ShapeGeometry(radShape);
  const radiator = new THREE.Mesh(radGeom, radiatorMat);
  radiator.position.z = -0.02; // Recessed
  sideGroup.add(radiator);

  // 2. Side LED Ring (Outline of the radiator)
  // We can approximate the outline with a Torus or a Tube following the shape
  // For simplicity and robustness, a Torus scaled to fit the area works well visually
  const sideLedRadius = radSize * 0.45;
  const sideLedGeom = new THREE.TorusGeometry(sideLedRadius, frontLedTube, 16, 48);
  sideLedGeom.rotateY(Math.PI / 2);
  // Scale to match the non-circular shape roughly
  sideLedGeom.scale(1.2, 1.0, 1.0); 
  const sideLed = new THREE.Mesh(sideLedGeom, ledMat);
  sideLed.position.z = -0.01;
  sideGroup.add(sideLed);

  // --- Top Face Assembly ---
  const topGroup = new THREE.Group();
  topGroup.position.set(0, size / 2 + 0.005, 0);
  topGroup.rotation.x = -Math.PI / 2; // Face Y
  root.add(topGroup);

  // 1. USB Port (Small slot)
  const usbGeom = new THREE.BoxGeometry(0.08, 0.02, 0.01);
  const usb = new THREE.Mesh(usbGeom, new THREE.MeshStandardMaterial({ color: 0x000000 }));
  usb.position.set(-0.2, 0.2, 0); // Top leftish
  topGroup.add(usb);

  // 2. Control Buttons (Grid of small circles)
  const btnRadius = 0.025;
  const btnGeom = new THREE.CylinderGeometry(btnRadius, btnRadius, 0.01, 16);
  
  // Button layout positions (approximate based on image)
  const btnPositions = [
    [-0.05, 0.15], [0.05, 0.15], // Top row
    [-0.15, 0.05], [0.0, 0.05], [0.15, 0.05], // Middle row
    [-0.05, -0.05], [0.05, -0.05] // Bottom row
  ];

  for (const [bx, by] of btnPositions) {
    const btn = new THREE.Mesh(btnGeom, buttonMat);
    btn.position.set(bx, by, 0.005);
    topGroup.add(btn);
  }

  // --- Feet ---
  const footGeom = new THREE.BoxGeometry(0.1, 0.02, 0.1);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
  const footPositions = [
    [-size/2 + 0.15, -size/2, depth/2 - 0.15],
    [size/2 - 0.15, -size/2, depth/2 - 0.15],
    [-size/2 + 0.15, -size/2, -depth/2 + 0.15],
    [size/2 - 0.15, -size/2, -depth/2 + 0.15],
  ];
  
  for (const [fx, fy, fz] of footPositions) {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(fx, fy, fz);
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