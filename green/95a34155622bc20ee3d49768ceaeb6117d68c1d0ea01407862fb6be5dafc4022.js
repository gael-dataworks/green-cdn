export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a028,
    metalness: 0.6,
    roughness: 0.3,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.85,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8,
    metalness: 0.0,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    transparent: true,
    ior: 1.5,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Procedural Dial Texture (Map/Compass) ---
  function createDialTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const baseColor = { r: 245, g: 230, c: 200 }; // Cream
    const lineColor = { r: 60, g: 50, b: 40 }; // Dark brown

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Base
        data[i] = baseColor.r;
        data[i + 1] = baseColor.g;
        data[i + 2] = baseColor.c;
        data[i + 3] = 255;

        const cx = size / 2;
        const cy = size / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Outer ring ticks
        if (dist > 110 && dist < 120) {
          const tick = Math.floor((angle + Math.PI) * 20 / Math.PI);
          if (tick % 2 === 0) {
            data[i] = lineColor.r;
            data[i + 1] = lineColor.g;
            data[i + 2] = lineColor.b;
          }
        }

        // Concentric grid lines (latitude)
        if (Math.abs(dist - 60) < 1 || Math.abs(dist - 90) < 1) {
          data[i] = lineColor.r;
          data[i + 1] = lineColor.g;
          data[i + 2] = lineColor.b;
        }

        // Radial grid lines (longitude) - sparse
        const normalizedAngle = (angle + Math.PI) % (Math.PI / 4);
        if (normalizedAngle < 0.02 && dist < 100 && dist > 20) {
          data[i] = lineColor.r;
          data[i + 1] = lineColor.g;
          data[i + 2] = lineColor.b;
        }

        // Pseudo-continents (noise blobs)
        const noise = Math.sin(dx * 0.05) * Math.cos(dy * 0.05) + Math.sin(dist * 0.1);
        if (noise > 1.2 && dist < 80) {
          data[i] = Math.max(0, baseColor.r - 40);
          data[i + 1] = Math.max(0, baseColor.g - 40);
          data[i + 2] = Math.max(0, baseColor.c - 40);
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  dialMat.map = createDialTexture();

  // --- Dimensions ---
  const caseRadius = 0.22;
  const caseThickness = 0.045;
  const bezelRadius = caseRadius + 0.015;
  const strapWidth = 0.16;
  const strapThickness = 0.025;

  // --- Case Body ---
  const caseGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 32);
  const caseBody = new THREE.Mesh(caseGeom, brassMat);
  root.add(caseBody);

  // --- Bezel ---
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, 0.012, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, brassMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = caseThickness / 2;
  root.add(bezel);

  // --- Dial Face ---
  const dialGeom = new THREE.CircleGeometry(caseRadius - 0.02, 32);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.position.y = caseThickness / 2 + 0.001;
  dial.rotation.x = Math.PI / 2;
  root.add(dial);

  // --- Glass ---
  const glassGeom = new THREE.CircleGeometry(caseRadius - 0.01, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.y = caseThickness / 2 + 0.002;
  glass.rotation.x = Math.PI / 2;
  root.add(glass);

  // --- Crown (Side knob) ---
  const crownGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const crown = new THREE.Mesh(crownGeom, brassMat);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(caseRadius + 0.01, 0, 0);
  root.add(crown);

  // --- Lugs (Strap attachments) ---
  const lugGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16);
  const lugPositions = [
    { x: 0.08, z: 0.08, rotZ: 0 },
    { x: -0.08, z: 0.08, rotZ: 0 },
    { x: 0.08, z: -0.08, rotZ: 0 },
    { x: -0.08, z: -0.08, rotZ: 0 },
  ];
  
  lugPositions.forEach((pos, idx) => {
    const lug = new THREE.Mesh(lugGeom, brassMat);
    lug.position.set(pos.x, 0, pos.z);
    // Rotate lugs to align with strap direction roughly
    if (idx < 2) lug.rotation.x = Math.PI / 2; // Top lugs
    else lug.rotation.x = Math.PI / 2; // Bottom lugs
    root.add(lug);
  });

  // --- Hands ---
  // Hour Hand
  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.002, 0.12);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.set(0, caseThickness / 2 + 0.005, 0);
  hourHand.rotation.y = -Math.PI / 4; // 10 o'clock approx
  root.add(hourHand);

  // Minute Hand
  const minuteHandGeom = new THREE.BoxGeometry(0.012, 0.002, 0.18);
  const minuteHand = new THREE.Mesh(minuteHandGeom, handMat);
  minuteHand.position.set(0, caseThickness / 2 + 0.006, 0);
  minuteHand.rotation.y = Math.PI / 6; // 2 o'clock approx
  root.add(minuteHand);

  // Second Hand
  const secondHandGeom = new THREE.BoxGeometry(0.004, 0.002, 0.20);
  const secondHand = new THREE.Mesh(secondHandGeom, handMat);
  secondHand.position.set(0, caseThickness / 2 + 0.007, 0);
  secondHand.rotation.y = -Math.PI / 2; // 9 o'clock
  root.add(secondHand);

  // Center Pin
  const pinGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16);
  const pin = new THREE.Mesh(pinGeom, brassMat);
  pin.position.y = caseThickness / 2 + 0.008;
  root.add(pin);

  // --- Strap (Curved Tube) ---
  // Top Strap
  const topStrapPoints = [
    new THREE.Vector3(0.08, 0, 0.08),
    new THREE.Vector3(0.15, 0.05, 0.15),
    new THREE.Vector3(0.25, 0.15, 0.20),
    new THREE.Vector3(0.35, 0.30, 0.22),
    new THREE.Vector3(0.45, 0.45, 0.20),
  ];
  const topStrapCurve = new THREE.CatmullRomCurve3(topStrapPoints);
  const topStrapGeom = new THREE.TubeGeometry(topStrapCurve, 20, strapWidth / 2, 8, false);
  const topStrap = new THREE.Mesh(topStrapGeom, leatherMat);
  // Flatten the tube to look like a strap
  topStrap.scale.y = 0.6; 
  root.add(topStrap);

  // Bottom Strap
  const bottomStrapPoints = [
    new THREE.Vector3(-0.08, 0, -0.08),
    new THREE.Vector3(-0.15, -0.05, -0.15),
    new THREE.Vector3(-0.25, -0.15, -0.20),
    new THREE.Vector3(-0.35, -0.30, -0.22),
    new THREE.Vector3(-0.45, -0.45, -0.20),
  ];
  const bottomStrapCurve = new THREE.CatmullRomCurve3(bottomStrapPoints);
  const bottomStrapGeom = new THREE.TubeGeometry(bottomStrapCurve, 20, strapWidth / 2, 8, false);
  const bottomStrap = new THREE.Mesh(bottomStrapGeom, leatherMat);
  bottomStrap.scale.y = 0.6;
  root.add(bottomStrap);

  // --- Buckle (on bottom strap end) ---
  const buckleGeom = new THREE.TorusGeometry(0.03, 0.005, 8, 16);
  const buckle = new THREE.Mesh(buckleGeom, brassMat);
  // Position at end of bottom strap curve
  const endPos = bottomStrapPoints[bottomStrapPoints.length - 1];
  buckle.position.copy(endPos);
  buckle.position.y -= 0.02; // Drop slightly
  buckle.rotation.x = Math.PI / 2;
  buckle.rotation.y = Math.PI / 4;
  root.add(buckle);

  // --- Stitching Detail on Strap (Simple lines) ---
  function addStitching(curve, offset) {
    const points = curve.getSpacedPoints(10);
    const stitchGeom = new THREE.BufferGeometry().setFromPoints(points);
    const stitchMat = new THREE.LineBasicMaterial({ color: 0x3a2a1f });
    const line = new THREE.Line(stitchGeom, stitchMat);
    line.position.y = offset;
    line.scale.y = 0.6;
    root.add(line);
  }
  
  // Add stitching lines roughly along the strap edges
  // This is a simplification; exact stitching on a tube is complex without UVs
  // We will skip complex stitching geometry to keep draw calls low and rely on leather texture roughness.

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