export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  const speakerConeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.8,
  });

  const dustCapMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.5,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0044ff,
    emissive: 0x0044ff,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.2,
    toneMapped: false,
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.4,
  });

  const portMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Grille Texture ---
  const gridSize = 128;
  const gridData = new Uint8Array(gridSize * gridSize * 4);
  for (let i = 0; i < gridSize * gridSize; i++) {
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    // Create a fine mesh pattern
    const isHole = (x % 4 < 2) && (y % 4 < 2);
    const val = isHole ? 20 : 60; // Dark mesh, slightly lighter holes
    gridData[i * 4 + 0] = val;
    gridData[i * 4 + 1] = val;
    gridData[i * 4 + 2] = val;
    gridData[i * 4 + 3] = 255;
  }
  const grilleTexture = new THREE.DataTexture(gridData, gridSize, gridSize, THREE.RGBAFormat);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.wrapS = THREE.RepeatWrapping;
  grilleTexture.wrapT = THREE.RepeatWrapping;
  grilleTexture.repeat.set(10, 10);
  grilleTexture.needsUpdate = true;

  const grilleMat = new THREE.MeshStandardMaterial({
    map: grilleTexture,
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const size = 1.0;
  const cornerRadius = 0.12;
  const depth = 0.9;
  const halfSize = size / 2;
  const inset = 0.06; // Margin from edge for panels

  // --- 1. Main Body (Rounded Box via Extrude) ---
  const bodyShape = new THREE.Shape();
  const w = halfSize - 0.02; // Slight shrink to fit inside bounds after normalization
  const h = halfSize - 0.02;
  const r = cornerRadius;

  bodyShape.moveTo(-w + r, -h);
  bodyShape.lineTo(w - r, -h);
  bodyShape.absarc(w - r, -h + r, r, Math.PI * 1.5, 0, false);
  bodyShape.lineTo(w, h - r);
  bodyShape.absarc(w - r, h - r, r, 0, Math.PI * 0.5, false);
  bodyShape.lineTo(-w + r, h);
  bodyShape.absarc(-w + r, h - r, r, Math.PI * 0.5, Math.PI, false);
  bodyShape.lineTo(-w, -h + r);
  bodyShape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: depth,
    bevelEnabled: false,
  });
  // Center the extrusion
  bodyGeom.translate(0, 0, -depth / 2);
  
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- 2. Front Speaker Assembly ---
  const frontGroup = new THREE.Group();
  frontGroup.position.z = depth / 2 + 0.01; // Slightly in front
  root.add(frontGroup);

  // Grille Background
  const grilleRadius = w - inset;
  const grilleGeom = new THREE.CylinderGeometry(grilleRadius, grilleRadius, 0.02, 64);
  grilleGeom.rotateX(Math.PI / 2);
  const grille = new THREE.Mesh(grilleGeom, grilleMat);
  frontGroup.add(grille);

  // LED Ring
  const ledRadius = grilleRadius - 0.04;
  const ledTube = 0.015;
  const ledGeom = new THREE.TorusGeometry(ledRadius, ledTube, 16, 64);
  const ledRing = new THREE.Mesh(ledGeom, ledMat);
  ledRing.rotation.y = Math.PI / 2; // Face forward (Z) - Torus is XY by default, rotate Y to face Z? 
  // Torus is in XY plane. To face Z, we need to rotate X by 90 deg? No.
  // Default Torus: Donut lies flat on XY. Normal is Z.
  // We want the donut to lie on YZ plane? No, we want it flat against the front face (XY plane relative to speaker, which is facing Z).
  // Wait, speaker front is facing +Z. The grille is in XY plane at z=depth/2.
  // So Torus default orientation (XY plane) is correct.
  frontGroup.add(ledRing);

  // Speaker Cone
  const coneRadius = ledRadius - 0.15;
  const coneGeom = new THREE.CylinderGeometry(coneRadius * 0.9, coneRadius, 0.05, 64);
  coneGeom.rotateX(Math.PI / 2);
  const cone = new THREE.Mesh(coneGeom, speakerConeMat);
  cone.position.z = 0.02; // Push out slightly
  frontGroup.add(cone);

  // Dust Cap
  const capRadius = coneRadius * 0.35;
  const capGeom = new THREE.SphereGeometry(capRadius, 32, 32);
  capGeom.scale(1, 1, 0.4); // Flatten
  const cap = new THREE.Mesh(capGeom, dustCapMat);
  cap.position.z = 0.05;
  frontGroup.add(cap);

  // --- 3. Side Passive Radiator / Panel ---
  const sideGroup = new THREE.Group();
  sideGroup.position.x = w + 0.01;
  sideGroup.rotation.y = -Math.PI / 2; // Face +X
  root.add(sideGroup);

  // Panel Shape (Rounded Triangle / Guitar Pick)
  const panelShape = new THREE.Shape();
  const pw = h - inset * 2; // Height matches front width roughly
  const ph = w - inset * 2; // Depth matches front depth roughly
  
  // Draw a shape that fills the side but has a specific contour
  // Top point
  panelShape.moveTo(0, ph / 2 - 0.1);
  // Right curve
  panelShape.bezierCurveTo(pw / 2, ph / 2, pw / 2, -ph / 2, 0, -ph / 2 + 0.1);
  // Left curve (inner)
  panelShape.bezierCurveTo(-pw / 4, -ph / 4, -pw / 4, ph / 4, 0, ph / 2 - 0.1);

  const panelGeom = new THREE.ExtrudeGeometry(panelShape, {
    depth: 0.02,
    bevelEnabled: false,
  });
  // Center the shape roughly
  panelGeom.translate(0, 0, -0.01);
  
  const panel = new THREE.Mesh(panelGeom, bodyMat);
  sideGroup.add(panel);

  // Side LED Strip (Tube along shape contour)
  const points = panelShape.getPoints(50);
  // Convert 2D points to 3D for the curve
  const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y, 0.01)); // Slightly in front of panel
  const curve = new THREE.CatmullRomCurve3(curvePoints, true); // Closed loop
  const sideLedGeom = new THREE.TubeGeometry(curve, 64, 0.012, 8, true);
  const sideLed = new THREE.Mesh(sideLedGeom, ledMat);
  sideGroup.add(sideLed);

  // --- 4. Top Controls ---
  const topGroup = new THREE.Group();
  topGroup.position.y = h + 0.01;
  topGroup.rotation.x = Math.PI / 2; // Face +Y
  root.add(topGroup);

  // Button layout: Row of small circles
  const buttonY = 0;
  const buttonZStart = -0.2;
  const buttonSpacing = 0.06;
  const buttonRadius = 0.025;

  for (let i = 0; i < 6; i++) {
    const btnGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.01, 16);
    btnGeom.rotateX(Math.PI / 2); // Flat
    const btn = new THREE.Mesh(btnGeom, buttonMat);
    btn.position.set(0, 0, buttonZStart + i * buttonSpacing);
    topGroup.add(btn);
    
    // Add a tiny inner dot for detail
    if (i < 4) {
        const dotGeom = new THREE.CircleGeometry(buttonRadius * 0.4, 16);
        dotGeom.rotateX(Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0x0044ff });
        const dot = new THREE.Mesh(dotGeom, dotMat);
        dot.position.set(0, 0.006, buttonZStart + i * buttonSpacing);
        topGroup.add(dot);
    }
  }

  // USB Port
  const portGeom = new THREE.BoxGeometry(0.04, 0.015, 0.02);
  portGeom.rotateX(Math.PI / 2);
  const port = new THREE.Mesh(portGeom, portMat);
  port.position.set(0.15, 0.006, 0.25);
  topGroup.add(port);

  // --- 5. Bottom Feet ---
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
  const footPositions = [
    [-w + 0.1, -h, -depth/2 + 0.1],
    [w - 0.1, -h, -depth/2 + 0.1],
    [-w + 0.1, -h, depth/2 - 0.1],
    [w - 0.1, -h, depth/2 - 0.1],
  ];

  for (const pos of footPositions) {
    const foot = new THREE.Mesh(footGeom, bodyMat);
    foot.position.set(...pos);
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