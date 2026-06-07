export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: Bright polished metal. High emissive to compensate for lack of env map.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x444444,
    emissiveIntensity: 0.4,
  });

  // Gem materials (Physical for transmission/refraction)
  const gemMatPink = new THREE.MeshPhysicalMaterial({
    color: 0xffaacc,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });
  const gemMatBlue = new THREE.MeshPhysicalMaterial({
    color: 0xaaccff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });
  const gemMatGreen = new THREE.MeshPhysicalMaterial({
    color: 0xccffaa,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });
  const gemMatAmber = new THREE.MeshPhysicalMaterial({
    color: 0xffddaa,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });

  const gemMaterials = [gemMatPink, gemMatBlue, gemMatGreen, gemMatAmber];

  // --- Dimensions ---
  const rimRadius = 0.35;
  const bowlHeight = 0.45;
  const stemHeight = 0.35;
  const footRadius = 0.38;
  const totalHeight = bowlHeight + stemHeight;

  // --- Main Body (Lathe) ---
  // Profile points [radius, y] from bottom to top
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),             // Center bottom
    new THREE.Vector2(0.38, 0.0),            // Foot outer edge
    new THREE.Vector2(0.35, 0.05),           // Foot flare start
    new THREE.Vector2(0.25, 0.12),           // Foot base curve
    new THREE.Vector2(0.12, 0.18),           // Stem narrow
    new THREE.Vector2(0.16, 0.25),           // Stem knob (bulge)
    new THREE.Vector2(0.10, 0.32),           // Stem neck
    new THREE.Vector2(0.28, 0.45),           // Bowl bottom start
    new THREE.Vector2(0.32, 0.70),           // Bowl mid (slight curve out)
    new THREE.Vector2(0.34, 0.85),           // Bowl top rim base
    new THREE.Vector2(0.36, 0.90),           // Rim lip
    new THREE.Vector2(0.0, 0.90),            // Close top
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Smooth shading
  bodyGeom.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeom, silverMat);
  // Shift y so bottom is at 0
  body.position.y = 0; 
  root.add(body);

  // --- Decorative Borders (Relief Simulation) ---
  // We add rings to simulate the engraved borders at top and bottom of the bowl section
  
  // Top Border Ring
  const topBorderY = 0.45 + 0.35; // Approx height on bowl
  const topBorderRadius = 0.33;
  const topBorderGeom = new THREE.TorusGeometry(topBorderRadius, 0.015, 16, 64);
  const topBorder = new THREE.Mesh(topBorderGeom, silverMat);
  topBorder.rotation.x = Math.PI / 2;
  topBorder.position.y = topBorderY;
  root.add(topBorder);

  // Bottom Border Ring (where bowl meets stem)
  const botBorderY = 0.45;
  const botBorderRadius = 0.29;
  const botBorderGeom = new THREE.TorusGeometry(botBorderRadius, 0.015, 16, 64);
  const botBorder = new THREE.Mesh(botBorderGeom, silverMat);
  botBorder.rotation.x = Math.PI / 2;
  botBorder.position.y = botBorderY;
  root.add(botBorder);

  // Foot Decorative Ring
  const footBorderY = 0.08;
  const footBorderRadius = 0.28;
  const footBorderGeom = new THREE.TorusGeometry(footBorderRadius, 0.012, 16, 64);
  const footBorder = new THREE.Mesh(footBorderGeom, silverMat);
  footBorder.rotation.x = Math.PI / 2;
  footBorder.position.y = footBorderY;
  root.add(footBorder);

  // --- Vertical Dividers (Simulating Relief Panels) ---
  // Thin vertical strips to suggest the separation between figures
  const panelCount = 8;
  const panelHeight = 0.30;
  const panelY = 0.45 + 0.15; // Mid-bowl
  const panelRadius = 0.325;
  const panelWidth = 0.04;
  const panelDepth = 0.005;

  for (let i = 0; i < panelCount; i++) {
    const angle = (i / panelCount) * Math.PI * 2;
    const x = Math.cos(angle) * panelRadius;
    const z = Math.sin(angle) * panelRadius;
    
    const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth), silverMat);
    panel.position.set(x, panelY, z);
    panel.rotation.y = -angle; // Face outward
    // Curve slightly to match bowl? Box is flat, but small enough to pass.
    root.add(panel);
  }

  // --- Gems ---
  const gemRadius = 0.025;
  const gemGeom = new THREE.SphereGeometry(gemRadius, 12, 12);

  function addGem(angle, y, radius, matIndex) {
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const gem = new THREE.Mesh(gemGeom, gemMaterials[matIndex % gemMaterials.length]);
    gem.position.set(x, y, z);
    
    // Orient gem normal to surface (roughly radial for a cylinder/cone approximation)
    gem.lookAt(0, y, 0);
    
    root.add(gem);
  }

  // Row 1: Top of bowl (near top border)
  const row1Y = 0.45 + 0.30;
  const row1R = 0.335;
  const row1Count = 12;
  for (let i = 0; i < row1Count; i++) {
    const angle = (i / row1Count) * Math.PI * 2 + 0.2; // Offset slightly
    addGem(angle, row1Y, row1R, i);
  }

  // Row 2: Bottom of bowl (near bottom border)
  const row2Y = 0.45 + 0.08;
  const row2R = 0.305;
  const row2Count = 12;
  for (let i = 0; i < row2Count; i++) {
    const angle = (i / row2Count) * Math.PI * 2;
    addGem(angle, row2Y, row2R, i + 3);
  }

  // Row 3: Foot (outer edge)
  const row3Y = 0.06;
  const row3R = 0.36;
  const row3Count = 10;
  for (let i = 0; i < row3Count; i++) {
    const angle = (i / row3Count) * Math.PI * 2 + 0.3;
    addGem(angle, row3Y, row3R, i + 1);
  }
  
  // Row 4: Foot Base (inner)
  const row4Y = 0.02;
  const row4R = 0.20;
  const row4Count = 8;
  for (let i = 0; i < row4Count; i++) {
    const angle = (i / row4Count) * Math.PI * 2;
    addGem(angle, row4Y, row4R, i + 2);
  }

  // --- Interior Polish (Optional thin shell to catch light inside) ---
  // A slightly smaller inverted cone/cylinder inside the bowl to simulate the polished interior
  const interiorProfile = [
    new THREE.Vector2(0.0, 0.45),
    new THREE.Vector2(0.27, 0.45),
    new THREE.Vector2(0.31, 0.85),
    new THREE.Vector2(0.0, 0.88)
  ];
  const interiorGeom = new THREE.LatheGeometry(interiorProfile, 32);
  const interior = new THREE.Mesh(interiorGeom, silverMat);
  interior.position.y = 0;
  root.add(interior);

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