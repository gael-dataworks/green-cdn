export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Body: Matte black plastic/rubber
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Grill: Dark mesh fabric
  const grillMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Speaker Cone: Blue illuminated
  const speakerMat = new THREE.MeshStandardMaterial({
    color: 0x0044aa,
    metalness: 0.2,
    roughness: 0.4,
    emissive: 0x002266,
    emissiveIntensity: 0.8,
  });

  // LED Light: Bright Blue
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x0088ff,
    emissiveIntensity: 1.5,
  });

  // Button/Control surface
  const controlMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Feet: Rubber
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const width = 1.0;
  const height = 0.85;
  const depth = 0.85;
  const cornerRadius = 0.12;

  // --- 1. Main Body (Rounded Box via Extrude) ---
  // Create a 2D shape for the front face profile (rounded rectangle)
  const bodyShape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = cornerRadius;

  bodyShape.moveTo(x, y + r);
  bodyShape.lineTo(x, y + h - r);
  bodyShape.quadraticCurveTo(x, y + h, x + r, y + h);
  bodyShape.lineTo(x + w - r, y + h);
  bodyShape.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  bodyShape.lineTo(x + w, y + r);
  bodyShape.quadraticCurveTo(x + w, y, x + w - r, y);
  bodyShape.lineTo(x + r, y);
  bodyShape.quadraticCurveTo(x, y, x, y + r);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the geometry
  bodyGeom.translate(0, 0, -depth / 2);
  
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- 2. Front Grill & Speaker ---
  const grillW = width * 0.75;
  const grillH = height * 0.75;
  const grillD = 0.02;
  
  // Grill Mesh with procedural texture
  const grillGeom = new THREE.BoxGeometry(grillW, grillH, grillD);
  const grill = new THREE.Mesh(grillGeom, grillMat);
  grill.position.set(0, 0, depth / 2 + grillD / 2 + 0.005); // Slightly in front of body
  root.add(grill);

  // Speaker Cone (behind grill)
  const speakerR = grillW * 0.35;
  const speakerGeom = new THREE.CylinderGeometry(speakerR, speakerR, 0.05, 32);
  speakerGeom.rotateX(Math.PI / 2);
  const speaker = new THREE.Mesh(speakerGeom, speakerMat);
  speaker.position.set(0, 0, depth / 2 - 0.05);
  root.add(speaker);

  // Front LED Ring (around speaker)
  const ledRingR = speakerR * 1.4;
  const ledRingTorus = new THREE.TorusGeometry(ledRingR, 0.015, 16, 64);
  const ledRing = new THREE.Mesh(ledRingTorus, ledMat);
  ledRing.position.set(0, 0, depth / 2 - 0.02);
  root.add(ledRing);

  // --- 3. Side Panel (Rounded Triangle) ---
  // Positioned on the right side (positive X)
  const sidePanelShape = new THREE.Shape();
  const panelW = width * 0.6;
  const panelH = height * 0.6;
  const px = width / 2 + 0.01; // Slightly offset from surface
  const py = 0;
  const pz = 0; // Center depth

  // Draw a rounded triangle pointing right
  const triR = 0.08;
  sidePanelShape.moveTo(-panelW / 2, -panelH / 2 + triR);
  sidePanelShape.lineTo(-panelW / 2, panelH / 2 - triR);
  sidePanelShape.quadraticCurveTo(-panelW / 2, panelH / 2, -panelW / 2 + triR, panelH / 2);
  sidePanelShape.lineTo(panelW / 2 - triR, panelH / 2);
  sidePanelShape.quadraticCurveTo(panelW / 2, panelH / 2, panelW / 2, panelH / 2 - triR);
  sidePanelShape.lineTo(panelW / 2, -panelH / 2 + triR);
  sidePanelShape.quadraticCurveTo(panelW / 2, -panelH / 2, panelW / 2 - triR, -panelH / 2);
  sidePanelShape.lineTo(-panelW / 2 + triR, -panelH / 2);
  sidePanelShape.quadraticCurveTo(-panelW / 2, -panelH / 2, -panelW / 2, -panelH / 2 + triR);

  const sidePanelGeom = new THREE.ShapeGeometry(sidePanelShape);
  const sidePanel = new THREE.Mesh(sidePanelGeom, bodyMat);
  sidePanel.position.set(px, py, 0);
  sidePanel.rotation.y = Math.PI / 2;
  root.add(sidePanel);

  // Side LED Rim (Tube following the shape)
  const sideLedPoints = sidePanelShape.getPoints(50);
  // Convert 2D points to 3D points in the side plane
  const sideLedCurvePoints = sideLedPoints.map(p => new THREE.Vector3(px, p.y, p.x));
  // Close the loop
  sideLedCurvePoints.push(sideLedCurvePoints[0]);
  
  const sideLedCurve = new THREE.CatmullRomCurve3(sideLedCurvePoints);
  const sideLedTube = new THREE.TubeGeometry(sideLedCurve, 64, 0.012, 8, true);
  const sideLed = new THREE.Mesh(sideLedTube, ledMat);
  root.add(sideLed);

  // --- 4. Top Controls ---
  const topY = height / 2 + 0.02;
  const buttonRowZ = -0.1;
  
  // Button group
  const btnGroup = new THREE.Group();
  btnGroup.position.set(0, topY, buttonRowZ);
  root.add(btnGroup);

  // Create buttons
  const btnGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  const btnPositions = [-0.2, -0.1, 0.0, 0.1, 0.2];
  
  for (let i = 0; i < btnPositions.length; i++) {
    const btn = new THREE.Mesh(btnGeom, controlMat);
    btn.position.set(btnPositions[i], 0, 0);
    btnGroup.add(btn);

    // Indicator light for some buttons
    if (i === 0 || i === 4) {
      const indGeom = new THREE.CircleGeometry(0.01, 16);
      const ind = new THREE.Mesh(indGeom, ledMat);
      ind.rotation.x = -Math.PI / 2;
      ind.position.set(0, 0.006, 0);
      btn.add(ind);
    }
  }

  // --- 5. Bottom Feet ---
  const footGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const footPositions = [
    [width/2 - 0.1, -height/2, depth/2 - 0.1],
    [-width/2 + 0.1, -height/2, depth/2 - 0.1],
    [width/2 - 0.1, -height/2, -depth/2 + 0.1],
    [-width/2 + 0.1, -height/2, -depth/2 + 0.1],
  ];

  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // --- Grill Texture (Procedural Mesh) ---
  // Create a simple grid texture for the grill to make it look like fabric/mesh
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let i = 0; i < texSize * texSize; i++) {
    const x = i % texSize;
    const y = Math.floor(i / texSize);
    // Create a grid pattern
    const isLine = (x % 4 < 2) || (y % 4 < 2);
    const val = isLine ? 40 : 20; // Dark gray lines, darker holes
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  const grillTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  grillTexture.colorSpace = THREE.SRGBColorSpace;
  grillTexture.needsUpdate = true;
  grillTexture.wrapS = THREE.RepeatWrapping;
  grillTexture.wrapT = THREE.RepeatWrapping;
  grillTexture.repeat.set(10, 10);
  grillMat.map = grillTexture;
  grillMat.bumpMap = grillTexture;
  grillMat.bumpScale = 0.002;

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