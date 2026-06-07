export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: High metalness capped at 0.6, low roughness, emissive for brightness.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Gem materials (glass-like)
  const gemMatPink = new THREE.MeshPhysicalMaterial({
    color: 0xffb7c5,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });
  const gemMatBlue = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });
  const gemMatGreen = new THREE.MeshPhysicalMaterial({
    color: 0x98fb98,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });
  const gemMatAmber = new THREE.MeshPhysicalMaterial({
    color: 0xffd700,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });
  const gemMats = [gemMatPink, gemMatBlue, gemMatGreen, gemMatAmber];

  // --- 1. Main Body (Lathe) ---
  // Profile points [radius, height]
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.14, 0.00), // Base outer edge
    new THREE.Vector2(0.12, 0.04), // Base flare start
    new THREE.Vector2(0.06, 0.12), // Stem narrow
    new THREE.Vector2(0.08, 0.18), // Stem bulb
    new THREE.Vector2(0.05, 0.24), // Stem top narrow
    new THREE.Vector2(0.06, 0.26), // Bowl bottom transition
    new THREE.Vector2(0.13, 0.45), // Bowl side (tapered out)
    new THREE.Vector2(0.14, 0.48), // Rim lip outer
    new THREE.Vector2(0.13, 0.49), // Rim top inner
    new THREE.Vector2(0.00, 0.49), // Top center
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- 2. Relief Panels (Approximation) ---
  // Create a rounded rectangle shape for the relief plaques
  const panelShape = new THREE.Shape();
  const pw = 0.06;
  const ph = 0.12;
  const r = 0.008;
  panelShape.moveTo(-pw / 2 + r, -ph / 2);
  panelShape.lineTo(pw / 2 - r, -ph / 2);
  panelShape.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + r);
  panelShape.lineTo(pw / 2, ph / 2 - r);
  panelShape.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - r, ph / 2);
  panelShape.lineTo(-pw / 2 + r, ph / 2);
  panelShape.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - r);
  panelShape.lineTo(-pw / 2, -ph / 2 + r);
  panelShape.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + r, -ph / 2);

  const panelGeom = new THREE.ExtrudeGeometry(panelShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  // Center the geometry so pivot is at center of panel
  panelGeom.translate(0, 0, 0); 

  const panelCount = 6;
  const panelRadius = 0.135; // Slightly larger than bowl radius at that height
  const panelY = 0.36; // Height on the bowl

  for (let i = 0; i < panelCount; i++) {
    const angle = (i / panelCount) * Math.PI * 2;
    const panel = new THREE.Mesh(panelGeom, silverMat);
    
    // Position on the circle
    panel.position.set(
      Math.cos(angle) * panelRadius,
      panelY,
      Math.sin(angle) * panelRadius
    );
    
    // Rotate to face outward
    panel.rotation.y = -angle;
    // Tilt slightly to match bowl taper if needed, but vertical is fine for approximation
    
    root.add(panel);

    // Add a small decorative border ring around the panel area (simulating the engraved frame)
    // Using a thin torus segment or just relying on the panel extrusion. 
    // Let's add a thin band above and below the panels to frame them.
  }

  // --- 3. Decorative Bands (Top and Bottom of relief area) ---
  // Top band
  const topBandGeom = new THREE.TorusGeometry(panelRadius + 0.002, 0.003, 8, 32);
  const topBand = new THREE.Mesh(topBandGeom, silverMat);
  topBand.rotation.x = Math.PI / 2;
  topBand.position.y = panelY + ph / 2 + 0.01;
  root.add(topBand);

  // Bottom band
  const botBandGeom = new THREE.TorusGeometry(panelRadius + 0.002, 0.003, 8, 32);
  const botBand = new THREE.Mesh(botBandGeom, silverMat);
  botBand.rotation.x = Math.PI / 2;
  botBand.position.y = panelY - ph / 2 - 0.01;
  root.add(botBand);

  // --- 4. Gems ---
  const gemGeom = new THREE.SphereGeometry(0.012, 16, 16);
  
  // Top ring of gems (on the rim/lip area)
  const topGemCount = 12;
  const topGemRadius = 0.145;
  const topGemY = 0.47;
  
  for (let i = 0; i < topGemCount; i++) {
    const angle = (i / topGemCount) * Math.PI * 2 + (Math.PI / topGemCount); // Offset slightly
    const mat = gemMats[i % gemMats.length];
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(
      Math.cos(angle) * topGemRadius,
      topGemY,
      Math.sin(angle) * topGemRadius
    );
    root.add(gem);
  }

  // Bottom ring of gems (on the base flare)
  const botGemCount = 8;
  const botGemRadius = 0.13;
  const botGemY = 0.05;

  for (let i = 0; i < botGemCount; i++) {
    const angle = (i / botGemCount) * Math.PI * 2;
    const mat = gemMats[(i + 2) % gemMats.length]; // Offset color sequence
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(
      Math.cos(angle) * botGemRadius,
      botGemY,
      Math.sin(angle) * botGemRadius
    );
    root.add(gem);
  }

  // --- 5. Rim Detail ---
  // A thin ring at the very top edge
  const rimGeom = new THREE.TorusGeometry(0.142, 0.002, 8, 32);
  const rim = new THREE.Mesh(rimGeom, silverMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.485;
  root.add(rim);

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