export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: High transmission, low roughness, slight blue tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Base Glass: Darker blue thick bottom
  const baseGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // Cap: Brushed silver metal
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Cap Engraving: Darker groove
  const engravingMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Dip Tube: White plastic
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Liquid: Light blue internal volume
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.4,
    ior: 1.33,
    transparent: true,
  });

  // --- Dimensions ---
  const bottleHeight = 1.0;
  const bottleRadius = 0.28;
  const neckRadius = 0.12;
  const neckHeight = 0.15;
  const capHeight = 0.25;
  const capRadius = 0.14;

  // --- 1. Bottle Body (Lathe) ---
  // Profile from bottom center up to top rim
  const profilePoints = [
    new THREE.Vector2(0, 0),                     // Bottom center
    new THREE.Vector2(bottleRadius, 0),          // Bottom edge
    new THREE.Vector2(bottleRadius, 0.65),       // Straight side
    new THREE.Vector2(bottleRadius * 0.9, 0.75), // Shoulder start
    new THREE.Vector2(neckRadius, 0.85),         // Neck start
    new THREE.Vector2(neckRadius, 1.0),          // Top rim
  ];
  
  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Shift geometry so bottom is at y=0
  bottleGeom.translate(0, 0, 0); 
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  bottle.position.y = 0;
  root.add(bottle);

  // --- 2. Thick Base Detail ---
  // A torus or thick ring at the bottom to simulate the heavy glass base
  const baseGeom = new THREE.TorusGeometry(bottleRadius - 0.04, 0.04, 16, 32);
  const baseRing = new THREE.Mesh(baseGeom, baseGlassMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.04;
  root.add(baseRing);
  
  // Solid bottom plug
  const bottomPlug = new THREE.Mesh(new THREE.CylinderGeometry(bottleRadius - 0.08, bottleRadius - 0.08, 0.05, 32), baseGlassMat);
  bottomPlug.position.y = 0.025;
  root.add(bottomPlug);

  // --- 3. Liquid Inside ---
  const liquidGeom = new THREE.CylinderGeometry(bottleRadius - 0.03, bottleRadius - 0.03, 0.85, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = 0.45;
  root.add(liquid);

  // --- 4. Dip Tube ---
  // Thin tube going down, curving at the bottom
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.95, 0),       // Top (under cap)
    new THREE.Vector3(0, 0.3, 0),        // Straight down
    new THREE.Vector3(bottleRadius * 0.6, 0.1, 0), // Curve out
    new THREE.Vector3(bottleRadius * 0.6, 0.05, 0) // Bottom tip
  ]);
  const dipTube = new THREE.Mesh(new THREE.TubeGeometry(tubePath, 20, 0.015, 8, false), tubeMat);
  root.add(dipTube);

  // --- 5. Cap ---
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.0 + capHeight / 2;
  root.add(cap);

  // Cap Collar (small ring under cap)
  const collarGeom = new THREE.CylinderGeometry(neckRadius + 0.01, neckRadius + 0.01, 0.05, 32);
  const collar = new THREE.Mesh(collarGeom, capMat);
  collar.position.y = 1.0 + 0.025;
  root.add(collar);

  // --- 6. Cap Engraving (Swirls) ---
  // Procedural swirls on the cap surface
  function addCapSwirl(angleOffset, heightOffset, scale) {
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = angleOffset + t * Math.PI * 1.5;
      const y = 1.0 + capHeight * (0.2 + t * 0.6) + heightOffset;
      const r = capRadius + 0.002; // Slightly offset from surface
      points.push(new THREE.Vector3(
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const swirl = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 8, false), engravingMat);
    root.add(swirl);
  }

  // Add a few swirls to mimic the filigree
  addCapSwirl(0, 0, 1);
  addCapSwirl(Math.PI, 0, 1);
  addCapSwirl(Math.PI / 2, -0.02, 0.8);
  addCapSwirl(-Math.PI / 2, -0.02, 0.8);

  // --- 7. "XANADU" Text Texture ---
  // Create a DataTexture for the embossed text effect
  const texWidth = 512;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Helper to draw a blocky letter segment
  function drawLine(x1, y1, x2, y2, color) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.floor(x1 + (x2 - x1) * t);
      const y = Math.floor(y1 + (y2 - y1) * t);
      if (x >= 0 && x < texWidth && y >= 0 && y < texHeight) {
        const idx = (y * texWidth + x) * 4;
        data[idx] = color.r;
        data[idx + 1] = color.g;
        data[idx + 2] = color.b;
        data[idx + 3] = 255; // Alpha
      }
    }
  }

  // Clear to transparent black
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0;
  }

  // Draw "XANADU" roughly in block segments
  // Coordinates are normalized 0-100 for x, 0-100 for y within a 100x50 box
  const letters = [
    // X
    [[10, 10, 20, 40], [20, 10, 10, 40]],
    // A
    [[25, 40, 30, 10], [30, 10, 35, 40], [27, 25, 33, 25]],
    // N
    [[40, 40, 40, 10], [40, 10, 50, 40], [50, 40, 50, 10]],
    // A
    [[55, 40, 60, 10], [60, 10, 65, 40], [57, 25, 63, 25]],
    // D
    [[70, 40, 70, 10], [70, 10, 75, 15, 80, 25, 75, 35, 70, 40]], // Curve approx
    // U
    [[85, 10, 85, 35, 90, 40, 95, 35, 95, 10]]
  ];

  // Simple rasterizer for the defined points
  // Mapping 0-100 to texture coords
  const startX = 50; 
  const startY = 180; // Near bottom of texture
  const scaleX = 3;
  const scaleY = 3;
  const color = { r: 200, g: 220, b: 255 }; // Light blue/white

  // Re-defining letters as simple line segments for the rasterizer
  const segments = [
    // X
    [10, 10, 20, 40], [20, 10, 10, 40],
    // A
    [25, 40, 30, 10], [30, 10, 35, 40], [27, 25, 33, 25],
    // N
    [40, 40, 40, 10], [40, 10, 50, 40], [50, 40, 50, 10],
    // A
    [55, 40, 60, 10], [60, 10, 65, 40], [57, 25, 63, 25],
    // D
    [70, 40, 70, 10], [70, 10, 75, 12], [75, 12, 80, 25], [80, 25, 75, 38], [75, 38, 70, 40],
    // U
    [85, 10, 85, 35], [85, 35, 90, 40], [90, 40, 95, 35], [95, 35, 95, 10]
  ];

  segments.forEach(seg => {
    const x1 = startX + seg[0] * scaleX;
    const y1 = startY + seg[1] * scaleY;
    const x2 = startX + seg[2] * scaleX;
    const y2 = startY + seg[3] * scaleY;
    drawLine(x1, y1, x2, y2, color);
  });

  const textTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.needsUpdate = true;
  // Wrap for cylindrical mapping
  textTexture.wrapS = THREE.ClampToEdgeWrapping; 
  textTexture.wrapT = THREE.ClampToEdgeWrapping;

  // Apply texture to a slightly larger glass shell or use displacement/roughness
  // Since we can't easily modify the existing glass material's roughness map without affecting the whole bottle,
  // and the text is specific, we create a thin "label" mesh that sits on the surface.
  // However, for embossed glass, a thin transparent mesh with the text texture as alpha/opacity works well.
  
  const textGeom = new THREE.CylinderGeometry(bottleRadius + 0.002, bottleRadius + 0.002, 0.15, 32, 1, true, 0, Math.PI * 1.5);
  const textMat = new THREE.MeshStandardMaterial({
    map: textTexture,
    transparent: true,
    opacity: 0.8,
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const textMesh = new THREE.Mesh(textGeom, textMat);
  // Position text on the front lower part of the bottle
  textMesh.position.y = 0.25; 
  textMesh.rotation.y = -Math.PI * 0.375; // Center the open cylinder segment
  root.add(textMesh);

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