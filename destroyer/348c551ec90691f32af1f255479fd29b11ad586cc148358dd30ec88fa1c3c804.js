export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Aged bronze/copper look. Metalness capped at 0.6 per rules.
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Material for the lattice panels.
  // We will generate a texture for the diamond grid.
  const latticeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // --- Procedural Lattice Texture ---
  // Creates a diamond grid pattern (white lines on transparent bg)
  const texSize = 128;
  const texData = new Uint8Array(texSize * texSize * 4);
  const lineThickness = 4; // pixels
  const spacing = 16; // pixels between lines
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Normalize coordinates
      const nx = x / texSize;
      const ny = y / texSize;
      
      // Diamond grid logic: distance to nearest diagonal line
      // Line 1: y = x + k  -> y - x = k
      // Line 2: y = -x + k -> y + x = k
      // We want lines where (y-x) % spacing is near 0 or (y+x) % spacing is near 0
      
      const val1 = (x - y) % spacing;
      const val2 = (x + y) % spacing;
      
      const dist1 = Math.min(Math.abs(val1), Math.abs(val1 - spacing));
      const dist2 = Math.min(Math.abs(val2), Math.abs(val2 - spacing));
      
      const isLine = (dist1 < lineThickness) || (dist2 < lineThickness);
      
      if (isLine) {
        // Bronze color (normalized 0-1) approx 0.72, 0.45, 0.20
        texData[idx] = 184;     // R
        texData[idx + 1] = 115; // G
        texData[idx + 2] = 51;  // B
        texData[idx + 3] = 255; // A
      } else {
        texData[idx] = 0;
        texData[idx + 1] = 0;
        texData[idx + 2] = 0;
        texData[idx + 3] = 0; // Transparent
      }
    }
  }
  
  const latticeTex = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  latticeTex.colorSpace = THREE.SRGBColorSpace;
  latticeTex.wrapS = THREE.RepeatWrapping;
  latticeTex.wrapT = THREE.RepeatWrapping;
  latticeTex.needsUpdate = true;
  latticeMat.map = latticeTex;

  // --- Dimensions ---
  const baseHeight = 0.18;
  const bodyHeight = 0.45;
  const topHeight = 0.15;
  const handleHeight = 0.18;
  const radius = 0.22; // Hexagon radius
  const hexagonSides = 6;

  // --- 1. Base ---
  // Lathe profile: flat bottom, curves out to max radius, then straight up slightly
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius * 1.4, 0),
    new THREE.Vector2(radius * 1.5, 0.04),
    new THREE.Vector2(radius * 1.3, 0.08),
    new THREE.Vector2(radius * 1.1, 0.14),
    new THREE.Vector2(radius * 0.95, baseHeight),
    new THREE.Vector2(0, baseHeight),
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, bronzeMat);
  root.add(base);

  // --- 2. Body Frame (Hexagonal Cage) ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = baseHeight;

  // Vertical Posts
  const postWidth = 0.025;
  const postDepth = 0.04;
  const postGeom = new THREE.BoxGeometry(postWidth, bodyHeight, postDepth);
  
  // Horizontal Rings (Top and Bottom of cage)
  const ringHeight = 0.03;
  const ringGeom = new THREE.BoxGeometry(postWidth * 1.5, ringHeight, postDepth * 1.5);

  // Panels (Lattice)
  // Calculate panel dimensions to fit between posts
  // Distance between post centers on a hexagon of radius R is R.
  // We need the panel to sit slightly inside.
  const panelWidth = radius * 0.95; 
  const panelHeight = bodyHeight - ringHeight * 2;
  const panelGeom = new THREE.PlaneGeometry(panelWidth, panelHeight);
  // Repeat texture to get nice grid density
  latticeTex.repeat.set(4, 8); 

  for (let i = 0; i < hexagonSides; i++) {
    const angle = (i / hexagonSides) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Vertical Post
    const post = new THREE.Mesh(postGeom, bronzeMat);
    post.position.set(x, bodyHeight / 2, z);
    post.rotation.y = -angle;
    bodyGroup.add(post);

    // Top Ring Segment
    const topRing = new THREE.Mesh(ringGeom, bronzeMat);
    topRing.position.set(x, bodyHeight - ringHeight / 2, z);
    topRing.rotation.y = -angle;
    bodyGroup.add(topRing);

    // Bottom Ring Segment
    const botRing = new THREE.Mesh(ringGeom, bronzeMat);
    botRing.position.set(x, ringHeight / 2, z);
    botRing.rotation.y = -angle;
    bodyGroup.add(botRing);

    // Lattice Panel
    // Position it slightly inward from the post center
    const panelDist = radius * Math.cos(Math.PI / 6) - 0.01; // Apothem approx
    const px = Math.cos(angle) * panelDist;
    const pz = Math.sin(angle) * panelDist;
    
    const panel = new THREE.Mesh(panelGeom, latticeMat);
    panel.position.set(px, bodyHeight / 2, pz);
    panel.rotation.y = -angle;
    bodyGroup.add(panel);
  }
  root.add(bodyGroup);

  // --- 3. Top Cap ---
  // Lathe profile: starts at body radius, domes up to a point/knob base
  const topProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(radius * 1.05, 0), // Overhang slightly
    new THREE.Vector2(radius * 0.9, 0.05),
    new THREE.Vector2(radius * 0.6, 0.10),
    new THREE.Vector2(radius * 0.3, 0.14),
    new THREE.Vector2(0.04, 0.15), // Neck for finial
    new THREE.Vector2(0, 0.15),
  ];
  const topGeom = new THREE.LatheGeometry(topProfile, 32);
  const topCap = new THREE.Mesh(topGeom, bronzeMat);
  topCap.position.y = baseHeight + bodyHeight;
  root.add(topCap);

  // --- 4. Handle ---
  // Arching tube
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-radius * 0.6, baseHeight + bodyHeight + topHeight, 0),
    new THREE.Vector3(-radius * 0.8, baseHeight + bodyHeight + topHeight + handleHeight * 0.8, 0),
    new THREE.Vector3(0, baseHeight + bodyHeight + topHeight + handleHeight, 0),
    new THREE.Vector3(radius * 0.8, baseHeight + bodyHeight + topHeight + handleHeight * 0.8, 0),
    new THREE.Vector3(radius * 0.6, baseHeight + bodyHeight + topHeight, 0),
  ]);
  
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.015, 8, false);
  const handle = new THREE.Mesh(handleGeom, bronzeMat);
  root.add(handle);

  // Handle attachment points (small spheres where handle meets top)
  const attachGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const attachLeft = new THREE.Mesh(attachGeom, bronzeMat);
  attachLeft.position.set(-radius * 0.6, baseHeight + bodyHeight + topHeight, 0);
  root.add(attachLeft);
  
  const attachRight = new THREE.Mesh(attachGeom, bronzeMat);
  attachRight.position.set(radius * 0.6, baseHeight + bodyHeight + topHeight, 0);
  root.add(attachRight);

  // --- 5. Finial (Top Knob) ---
  const finialBaseGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.03, 16);
  const finialBase = new THREE.Mesh(finialBaseGeom, bronzeMat);
  finialBase.position.y = baseHeight + bodyHeight + topHeight + 0.015;
  root.add(finialBase);

  const finialBallGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const finialBall = new THREE.Mesh(finialBallGeom, bronzeMat);
  finialBall.position.y = baseHeight + bodyHeight + topHeight + 0.045;
  root.add(finialBall);

  // --- Normalization ---
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