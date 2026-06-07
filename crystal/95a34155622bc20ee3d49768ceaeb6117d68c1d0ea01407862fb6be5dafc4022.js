export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a040,
    metalness: 0.6,
    roughness: 0.35,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.85,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    metalness: 0.0,
    roughness: 0.4,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.4,
  });

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
  });

  // --- Procedural Map Texture for Dial ---
  function createMapTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const cream = [240, 230, 210, 255];
    const ink = [60, 50, 40, 255];
    const faint = [150, 140, 120, 255];

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 10;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Base cream with noise
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
        data[idx] = cream[0] + noise;
        data[idx + 1] = cream[1] + noise;
        data[idx + 2] = cream[2] + noise;
        data[idx + 3] = 255;

        // Concentric rings (compass)
        if (dist > 20 && dist < maxR) {
          if (Math.abs(dist % 40) < 2) {
            data[idx] = faint[0];
            data[idx + 1] = faint[1];
            data[idx + 2] = faint[2];
          }
        }

        // Radial lines
        const sectors = 16;
        const sectorAngle = (Math.PI * 2) / sectors;
        const normalizedAngle = (angle + Math.PI) % (Math.PI * 2);
        if (Math.abs(normalizedAngle % sectorAngle) < 0.05 || Math.abs(normalizedAngle % sectorAngle - sectorAngle) < 0.05) {
           if (dist > 40 && dist < maxR - 5) {
             data[idx] = faint[0];
             data[idx + 1] = faint[1];
             data[idx + 2] = faint[2];
           }
        }

        // Outer tick marks
        if (dist > maxR - 15 && dist < maxR) {
           const tickAngle = (Math.PI * 2) / 60;
           if (Math.abs(angle % tickAngle) < 0.02) {
             data[idx] = ink[0];
             data[idx + 1] = ink[1];
             data[idx + 2] = ink[2];
           }
        }

        // Simulated "Continent" blobs (noise threshold)
        const noiseVal = Math.sin(x * 0.05) * Math.cos(y * 0.05) + Math.sin(dist * 0.1);
        if (noiseVal > 0.8 && dist < maxR - 20 && dist > 30) {
          data[idx] = ink[0];
          data[idx + 1] = ink[1];
          data[idx + 2] = ink[2];
        }
        
        // Simulated Text Lines (rectangles)
        if (y > 80 && y < 90 && x > 100 && x < 180) {
           data[idx] = ink[0]; data[idx+1] = ink[1]; data[idx+2] = ink[2];
        }
        if (y > 160 && y < 170 && x > 60 && x < 140) {
           data[idx] = ink[0]; data[idx+1] = ink[1]; data[idx+2] = ink[2];
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  dialMat.map = createMapTexture();

  // --- Dimensions ---
  const caseRadius = 0.30;
  const caseHeight = 0.08;
  const bezelRadius = caseRadius + 0.02;
  const bezelThickness = 0.03;
  const dialRadius = caseRadius - 0.04;

  // --- Case Body ---
  const caseGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseHeight, 32);
  const caseMesh = new THREE.Mesh(caseGeom, brassMat);
  root.add(caseMesh);

  // --- Bezel ---
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, 0.015, 16, 32);
  const bezelMesh = new THREE.Mesh(bezelGeom, brassMat);
  bezelMesh.rotation.x = Math.PI / 2;
  bezelMesh.position.y = caseHeight / 2;
  root.add(bezelMesh);

  // --- Dial ---
  const dialGeom = new THREE.CircleGeometry(dialRadius, 32);
  const dialMesh = new THREE.Mesh(dialGeom, dialMat);
  dialMesh.rotation.x = Math.PI / 2;
  dialMesh.position.y = caseHeight / 2 + 0.001;
  root.add(dialMesh);

  // --- Crystal (Glass) ---
  const crystalGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, 0.01, 32);
  const crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
  crystalMesh.position.y = caseHeight / 2 + 0.015;
  root.add(crystalMesh);

  // --- Hands ---
  const handsGroup = new THREE.Group();
  handsGroup.position.y = caseHeight / 2 + 0.005;

  // Hour Hand
  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.002, 0.12);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.z = 0.04; // Offset pivot
  hourHand.rotation.z = -Math.PI / 4; // 10 o'clock approx
  handsGroup.add(hourHand);

  // Minute Hand
  const minuteHandGeom = new THREE.BoxGeometry(0.012, 0.002, 0.18);
  const minuteHand = new THREE.Mesh(minuteHandGeom, handMat);
  minuteHand.position.z = 0.06;
  minuteHand.rotation.z = Math.PI / 6; // 2 o'clock approx
  handsGroup.add(minuteHand);

  // Second Hand (thin red or black line)
  const secondHandGeom = new THREE.BoxGeometry(0.004, 0.001, 0.22);
  const secondHandMat = new THREE.MeshStandardMaterial({ color: 0x882222, metalness: 0.5, roughness: 0.4 });
  const secondHand = new THREE.Mesh(secondHandGeom, secondHandMat);
  secondHand.position.z = 0.08;
  secondHand.rotation.z = -Math.PI / 2; // 9 o'clock
  handsGroup.add(secondHand);

  // Center Pin
  const pinGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const pinMesh = new THREE.Mesh(pinGeom, brassMat);
  pinMesh.position.y = 0.005;
  handsGroup.add(pinMesh);

  root.add(handsGroup);

  // --- Crown (Side Knob) ---
  const crownGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
  const crownMesh = new THREE.Mesh(crownGeom, brassMat);
  crownMesh.rotation.z = Math.PI / 2;
  crownMesh.position.set(caseRadius + 0.02, 0, 0);
  root.add(crownMesh);

  // --- Lugs ---
  const lugGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 16);
  const lugPositions = [
    [0, caseHeight / 2, caseRadius - 0.05], // Top
    [0, caseHeight / 2, -(caseRadius - 0.05)], // Bottom
  ];
  
  lugPositions.forEach(pos => {
    const lug = new THREE.Mesh(lugGeom, brassMat);
    lug.rotation.x = Math.PI / 2;
    lug.position.set(...pos);
    root.add(lug);
  });

  // --- Straps (Leather) ---
  // Use TubeGeometry with CatmullRomCurve3 for organic curve
  
  function createStrapCurve(isTop) {
    const startZ = isTop ? (caseRadius - 0.05) : -(caseRadius - 0.05);
    const dir = isTop ? 1 : -1;
    
    // Curve starts at lug, goes out, then curves back/down
    const points = [
      new THREE.Vector3(0, caseHeight/2, startZ),
      new THREE.Vector3(0, caseHeight/2, startZ + dir * 0.15),
      new THREE.Vector3(0.1, caseHeight/2 + 0.05, startZ + dir * 0.3),
      new THREE.Vector3(0.2, caseHeight/2 + 0.1, startZ + dir * 0.45),
      new THREE.Vector3(0.15, caseHeight/2 + 0.15, startZ + dir * 0.6),
    ];
    return new THREE.CatmullRomCurve3(points);
  }

  const strapWidth = 0.22;
  const strapThickness = 0.04;

  // Top Strap
  const topCurve = createStrapCurve(true);
  const topStrapGeom = new THREE.TubeGeometry(topCurve, 20, strapWidth / 2, 8, false);
  // Flatten the tube to look like a strap
  topStrapGeom.scale(1, 0.6, 1); 
  const topStrap = new THREE.Mesh(topStrapGeom, leatherMat);
  root.add(topStrap);

  // Bottom Strap
  const bottomCurve = createStrapCurve(false);
  const bottomStrapGeom = new THREE.TubeGeometry(bottomCurve, 20, strapWidth / 2, 8, false);
  bottomStrapGeom.scale(1, 0.6, 1);
  const bottomStrap = new THREE.Mesh(bottomStrapGeom, leatherMat);
  root.add(bottomStrap);

  // Stitching on straps (small cylinders along the edges)
  function addStitching(curve, sideOffset) {
    const points = curve.getSpacedPoints(10);
    points.forEach((p, i) => {
      if (i === 0 || i === points.length - 1) return; // Skip ends
      const stitchGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8);
      const stitch = new THREE.Mesh(stitchGeom, new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
      stitch.rotation.x = Math.PI / 2;
      // Approximate position along curve edge
      const tangent = curve.getTangent(i / 10).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(sideOffset);
      stitch.position.copy(p).add(normal).add(new THREE.Vector3(0, 0.02, 0)); // Slightly raised
      root.add(stitch);
    });
  }

  addStitching(topCurve, strapWidth / 2.5);
  addStitching(topCurve, -strapWidth / 2.5);
  addStitching(bottomCurve, strapWidth / 2.5);
  addStitching(bottomCurve, -strapWidth / 2.5);

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