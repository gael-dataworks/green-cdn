export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold case: Polished but aged. Cap metalness at 0.6.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4b46c,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Dark metal for hands
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Leather strap: Matte, high roughness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Glass: Physical material for transparency/refraction.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
  });

  // --- Procedural Map Texture for Dial ---
  function createMapTexture(THREE) {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const bgR = 240, bgG = 230, bgB = 210; // Aged paper cream
    const inkR = 60, inkG = 50, inkB = 40; // Sepia ink

    // Fill background
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = bgR;
      data[i * 4 + 1] = bgG;
      data[i * 4 + 2] = bgB;
      data[i * 4 + 3] = 255;
    }

    // Helper to draw a line/curve on the buffer
    function drawLine(x0, y0, x1, y1, width) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(dist);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.floor(x0 + dx * t);
        const y = Math.floor(y0 + dy * t);
        if (x >= 0 && x < size && y >= 0 && y < size) {
          const idx = (y * size + x) * 4;
          data[idx] = inkR;
          data[idx + 1] = inkG;
          data[idx + 2] = inkB;
        }
      }
    }

    // Draw Grid Lines (Latitude/Longitude)
    const cx = size / 2, cy = size / 2;
    const maxR = size * 0.45;
    
    // Concentric circles
    for (let r = 40; r < maxR; r += 30) {
      for (let a = 0; a < Math.PI * 2; a += 0.05) {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const nx = cx + Math.cos(a + 0.05) * r;
        const ny = cy + Math.sin(a + 0.05) * r;
        drawLine(x, y, nx, ny, 1);
      }
    }
    // Radial lines
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      drawLine(cx, cy, cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR, 1);
    }

    // Draw "Continents" (Random-ish blobs using sine waves)
    function drawBlob(bx, by, scale) {
      for (let a = 0; a < Math.PI * 2; a += 0.1) {
        const r = scale * (0.5 + 0.3 * Math.sin(a * 5) + 0.2 * Math.cos(a * 11));
        const x = bx + Math.cos(a) * r * size;
        const y = by + Math.sin(a) * r * size;
        const nx = bx + Math.cos(a + 0.1) * r * size;
        const ny = by + Math.sin(a + 0.1) * r * size;
        // Fill interior roughly by drawing lines across
        drawLine(cx, cy, x, y, 1); 
      }
    }
    // A few landmasses
    drawBlob(0.3, 0.4, 0.15);
    drawBlob(0.6, 0.5, 0.12);
    drawBlob(0.4, 0.7, 0.10);
    drawBlob(0.7, 0.3, 0.08);

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const dialMap = createMapTexture(THREE);
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: dialMap,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry Construction ---

  const caseRadius = 0.24;
  const caseThickness = 0.05;
  const bezelRadius = 0.255;
  const bezelThickness = 0.015;

  // 1. Main Case Body
  const caseGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 32);
  const caseBody = new THREE.Mesh(caseGeom, brassMat);
  root.add(caseBody);

  // 2. Bezel (Top Ring)
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, bezelThickness * 0.6, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, brassMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = caseThickness / 2 + bezelThickness * 0.3;
  root.add(bezel);

  // 3. Dial (Face)
  const dialGeom = new THREE.CircleGeometry(caseRadius * 0.92, 32);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.y = caseThickness / 2 + 0.001; // Slightly above case
  root.add(dial);

  // 4. Glass Cover (Domed)
  const glassGeom = new THREE.SphereGeometry(caseRadius * 0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.y = caseThickness / 2 + 0.002;
  glass.scale.y = 0.3; // Flatten sphere to make a dome
  root.add(glass);

  // 5. Crown (Side Knob at 3 o'clock)
  const crownGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
  const crown = new THREE.Mesh(crownGeom, brassMat);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(caseRadius + 0.02, 0, 0);
  root.add(crown);

  // 6. Lugs (4 connectors for strap)
  const lugGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16);
  const lugPositions = [
    { x: -0.15, y: 0, z: 0.18, rotZ: 0 },       // Top Left
    { x: 0.15, y: 0, z: 0.18, rotZ: 0 },        // Top Right
    { x: -0.15, y: 0, z: -0.18, rotZ: 0 },      // Bottom Left
    { x: 0.15, y: 0, z: -0.18, rotZ: 0 },       // Bottom Right
  ];
  
  lugPositions.forEach(pos => {
    const lug = new THREE.Mesh(lugGeom, brassMat);
    lug.rotation.x = Math.PI / 2; // Cylinder lies flat along X
    lug.position.set(pos.x, caseThickness/2, pos.z);
    root.add(lug);
  });

  // 7. Hands
  function createHand(width, length, thickness, yOffset) {
    const geom = new THREE.BoxGeometry(width, thickness, length);
    const mesh = new THREE.Mesh(geom, handMat);
    // Pivot at one end: shift geometry or position. 
    // Box is centered. Move mesh so bottom is at 0,0,0 relative to parent.
    mesh.position.y = length / 2; 
    return mesh;
  }

  const handGroup = new THREE.Group();
  handGroup.position.y = caseThickness / 2 + 0.005;
  root.add(handGroup);

  // Hour Hand (Short, points to ~10)
  const hourHand = createHand(0.015, 0.12, 0.005, 0);
  hourHand.rotation.z = -Math.PI / 3.5; // ~10 o'clock
  handGroup.add(hourHand);

  // Minute Hand (Long, points to ~2)
  const minuteHand = createHand(0.012, 0.18, 0.005, 0);
  minuteHand.rotation.z = Math.PI / 6; // ~2 o'clock
  handGroup.add(minuteHand);

  // Second Hand (Thin, points to ~8)
  const secondHand = createHand(0.004, 0.20, 0.002, 0);
  secondHand.rotation.z = -Math.PI / 2.5;
  secondHand.position.y = 0.002; // Slightly above others
  handGroup.add(secondHand);

  // Center Cap
  const capGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const cap = new THREE.Mesh(capGeom, brassMat);
  cap.position.y = 0.005;
  handGroup.add(cap);

  // 8. Leather Strap
  // Use TubeGeometry with CatmullRomCurve3 for organic curve
  function createStrap(startZ, directionY) {
    const points = [];
    // Start at lug
    points.push(new THREE.Vector3(0, caseThickness/2, startZ));
    // Curve out and away
    points.push(new THREE.Vector3(0, caseThickness/2 + 0.05, startZ + directionY * 0.1));
    points.push(new THREE.Vector3(0, caseThickness/2 + 0.15, startZ + directionY * 0.3));
    points.push(new THREE.Vector3(0, caseThickness/2 + 0.25, startZ + directionY * 0.5));
    points.push(new THREE.Vector3(0, caseThickness/2 + 0.35, startZ + directionY * 0.7));
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.045, 12, false);
    const strap = new THREE.Mesh(tubeGeom, leatherMat);
    root.add(strap);
    return strap;
  }

  // Top Strap (curves up/back, +Z direction in local space relative to watch face orientation)
  // Watch face is XY plane? No, standard is Y up, Z forward. 
  // My case is cylinder along Y. So face is XZ plane.
  // Lugs are at Z +/- 0.18.
  // Top strap is at +Z. Curves towards +Z and +Y (up).
  createStrap(0.18, 1);

  // Bottom Strap (curves down/forward, -Z direction)
  // Curves towards -Z and -Y (down).
  createStrap(-0.18, -1);

  // 9. Stitching on Strap (Simple dashed lines using small boxes)
  function addStitching(zStart, dir) {
    for(let i=0; i<5; i++) {
      const z = zStart + dir * (0.1 + i * 0.12);
      const y = caseThickness/2 + 0.05 + dir * i * 0.08;
      // Left stitch
      const sL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.01), leatherMat);
      sL.position.set(-0.03, y, z);
      sL.material = new THREE.MeshStandardMaterial({color: 0x3a2212, roughness: 0.8});
      root.add(sL);
      // Right stitch
      const sR = sL.clone();
      sR.position.set(0.03, y, z);
      root.add(sR);
    }
  }
  addStitching(0.18, 1);
  addStitching(-0.18, -1);

  // Normalize
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