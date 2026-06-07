export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light blue glass for the main body
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  // Darker blue for the thick base/liquid accumulation
  const baseGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x4488cc,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // Silver metallic cap
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Plastic nozzle and tube
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
    transparent: true,
    opacity: 0.8,
  });

  // --- 1. Bottle Body (Lathe) ---
  // Profile points [radius, height]
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.35, 0.00), // Bottom edge
    new THREE.Vector2(0.35, 0.12), // Base thickness
    new THREE.Vector2(0.33, 1.10), // Main cylinder wall
    new THREE.Vector2(0.36, 1.25), // Shoulder flare
    new THREE.Vector2(0.28, 1.40), // Neck taper
    new THREE.Vector2(0.25, 1.50), // Neck top
    new THREE.Vector2(0.00, 1.50), // Top center
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const bottleBody = new THREE.Mesh(bodyGeom, glassMat);
  root.add(bottleBody);

  // --- 2. Thick Base Insert (Darker glass at bottom) ---
  // Simulates the thick glass bottom visible in the reference
  const baseGeom = new THREE.CylinderGeometry(0.30, 0.30, 0.15, 32);
  const baseInsert = new THREE.Mesh(baseGeom, baseGlassMat);
  baseInsert.position.y = 0.075;
  root.add(baseInsert);

  // --- 3. Cap (Silver Cylinder) ---
  const capGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.50, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.50 + 0.25; // Sit on top of neck
  root.add(cap);

  // --- 4. Cap Decoration (Engraved Swirls) ---
  // Modeled as thin tubes wrapped around the cap surface
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.5,
    roughness: 0.5,
  });

  function addCapSwirl(angleOffset, heightOffset, scale) {
    const points = [];
    const r = 0.362; // Slightly larger than cap radius to sit on surface
    const hStart = heightOffset;
    const hEnd = heightOffset + 0.35;
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = angleOffset + t * Math.PI * 1.5; // Spiral up
      const y = hStart + t * (hEnd - hStart);
      // Add some wave to the spiral
      const wave = Math.sin(t * Math.PI * 4) * 0.05; 
      const x = Math.cos(angle + wave) * r;
      const z = Math.sin(angle + wave) * r;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.015, 8, false), swirlMat);
    root.add(tube);
  }

  // Add a few swirl segments to mimic the reference pattern
  addCapSwirl(0, 0.1, 1);
  addCapSwirl(Math.PI, 0.15, 1);
  addCapSwirl(Math.PI / 2, 0.05, 1);

  // --- 5. Nozzle and Dip Tube ---
  // Nozzle collar
  const collarGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.10, 16);
  const collar = new THREE.Mesh(collarGeom, plasticMat);
  collar.position.y = 1.45;
  root.add(collar);

  // Spray head (under cap)
  const headGeom = new THREE.CylinderGeometry(0.20, 0.20, 0.08, 16);
  const head = new THREE.Mesh(headGeom, plasticMat);
  head.position.y = 1.52;
  root.add(head);

  // Dip Tube (Straw)
  // Straight part
  const tubeStraightGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.30, 8);
  const tubeStraight = new THREE.Mesh(tubeStraightGeom, plasticMat);
  tubeStraight.position.y = 1.52 - 1.30 / 2;
  root.add(tubeStraight);

  // Curved bottom part of tube
  const tubeCurvePoints = [
    new THREE.Vector3(0, 0.22, 0),
    new THREE.Vector3(0.10, 0.15, 0),
    new THREE.Vector3(0.20, 0.10, 0),
  ];
  const tubeCurve = new THREE.CatmullRomCurve3(tubeCurvePoints);
  const tubeCurveMesh = new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 16, 0.02, 8, false), plasticMat);
  // Position needs to align with bottom of straight tube
  tubeCurveMesh.position.y = 0.22; 
  // Rotate to match the curve direction if needed, but points are local
  // Actually, the curve points are local to the mesh. 
  // Let's just use a bent cylinder approach or simple tube.
  // The points above define a curve starting at 0,0,0 relative to mesh.
  // We need to place this mesh at the bottom of the straight tube.
  tubeCurveMesh.position.set(0, 0.22, 0);
  root.add(tubeCurveMesh);


  // --- 6. "XANADU" Text Texture on Body ---
  // Procedural DataTexture to simulate embossed text
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  // Fill with transparent base
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 200;     // R
    data[i + 1] = 230; // G
    data[i + 2] = 255; // B
    data[i + 3] = 0;   // Alpha (transparent)
  }

  // Helper to draw a rectangle (simulating a letter stroke)
  function drawRect(x, y, w, h) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
          const idx = (iy * W + ix) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 100; // Semi-transparent white for emboss highlight
        }
      }
    }
  }

  // Approximate "XANADU" with blocks
  // Position: Lower third of the bottle body texture
  const textY = 40;
  const textH = 30;
  const gap = 5;
  let textX = 60;

  // X
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY + textH/2 - 2, 16, 4);
  textX += 20 + gap;

  // A
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY + textH/2 + 5, 16, 4);
  textX += 20 + gap;

  // N
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY, 16, 4); // Top bar
  textX += 20 + gap;

  // A (again)
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY + textH/2 + 5, 16, 4);
  textX += 20 + gap;

  // D
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY, 16, 4); // Top
  drawRect(textX, textY + textH - 4, 16, 4); // Bottom
  textX += 20 + gap;

  // U
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY + textH - 4, 16, 4); // Bottom
  textX += 20 + gap;

  const textTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.needsUpdate = true;
  // Wrap so it goes around the bottle
  textTexture.wrapS = THREE.RepeatWrapping;
  textTexture.wrapT = THREE.ClampToEdgeWrapping;
  textTexture.repeat.set(1, 1);
  
  // Apply texture to glass material as map/emissiveMap for visibility
  // Since glass is transparent, we use emissiveMap to make the text glow slightly
  glassMat.map = textTexture;
  glassMat.emissiveMap = textTexture;
  glassMat.emissive = new THREE.Color(0xffffff);
  glassMat.emissiveIntensity = 0.2;


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