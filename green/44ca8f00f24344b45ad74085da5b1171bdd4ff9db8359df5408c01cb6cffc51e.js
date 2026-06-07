export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Bright, reflective, warm yellow
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // Glass: Transparent, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Dial: Matte white/cream
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Hands/Markers: Dark metal
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.4,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const caseRadius = 0.45;
  const bezelThickness = 0.04;
  const caseDepth = 0.12;
  const dialRadius = 0.40;
  const crystalRadius = 0.43;
  const crystalHeight = 0.03;

  // --- Case (Bezel) ---
  // Torus for the round gold rim
  const bezelGeom = new THREE.TorusGeometry(caseRadius, bezelThickness, 16, 64);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.y = Math.PI / 2; // Stand it up in XY plane? No, Torus is XY by default.
  // Torus lies in XY. We want it facing Z (like a clock on a wall) or lying flat?
  // Image shows watch face parallel to camera (XY plane). Torus default is XY. Perfect.
  // But we need thickness in Z.
  // Actually, let's use a Cylinder for the main body and a Torus for the front rim.
  
  // Main body cylinder (gold)
  const bodyGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseDepth, 64);
  const body = new THREE.Mesh(bodyGeom, goldMat);
  body.rotation.x = Math.PI / 2; // Cylinder is Y-up, we want Z-depth.
  // Wait, standard cylinder is Y-up. To make it face Z, rotate X by 90.
  // But Torus is XY plane.
  // Let's align everything to face +Z.
  // Cylinder: rotate X by Math.PI/2 -> faces Z.
  // Torus: lies in XY. To face Z, rotate X by Math.PI/2? No, Torus normal is Z.
  // Default Torus is in XY plane, normal Z. Perfect for a clock face.
  
  // Re-evaluating orientation:
  // Camera looks down -Z or +Z? Standard is looking at origin.
  // Let's make the watch face lie in the XY plane, facing +Z.
  // TorusGeometry(radius, tube) -> lies in XY. Normal is Z. Good.
  // CylinderGeometry -> lies along Y. Rotate X by 90 deg to lie along Z.
  
  const caseBody = new THREE.Mesh(
    new THREE.CylinderGeometry(caseRadius, caseRadius, caseDepth, 64),
    goldMat
  );
  caseBody.rotation.x = Math.PI / 2;
  root.add(caseBody);

  const caseBezel = new THREE.Mesh(
    new THREE.TorusGeometry(caseRadius, bezelThickness, 16, 64),
    goldMat
  );
  caseBezel.position.z = caseDepth / 2; // Front of the case
  root.add(caseBezel);

  // Back cap
  const caseBack = new THREE.Mesh(
    new THREE.CylinderGeometry(caseRadius - bezelThickness, caseRadius - bezelThickness, 0.02, 64),
    goldMat
  );
  caseBack.rotation.x = Math.PI / 2;
  caseBack.position.z = -caseDepth / 2 - 0.01;
  root.add(caseBack);

  // --- Dial ---
  const dialGeom = new THREE.CylinderGeometry(dialRadius, dialRadius, 0.02, 64);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.z = caseDepth / 2 + 0.01; // Slightly inside bezel
  root.add(dial);

  // --- Crystal (Glass) ---
  const crystalGeom = new THREE.CylinderGeometry(crystalRadius, crystalRadius, crystalHeight, 64);
  const crystal = new THREE.Mesh(crystalGeom, glassMat);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = caseDepth / 2 + crystalHeight / 2;
  root.add(crystal);

  // --- Markers & Numerals ---
  const markerGroup = new THREE.Group();
  const numMarkers = 60;
  const markerRadius = dialRadius * 0.92;
  
  for (let i = 0; i < numMarkers; i++) {
    const angle = (i / numMarkers) * Math.PI * 2;
    const isHour = i % 5 === 0;
    const length = isHour ? 0.04 : 0.02;
    const width = isHour ? 0.008 : 0.003;
    
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(width, length, 0.005),
      blackMat
    );
    // Position in XY plane
    const x = Math.cos(angle) * markerRadius;
    const y = Math.sin(angle) * markerRadius;
    marker.position.set(x, y, caseDepth / 2 + 0.015);
    marker.rotation.z = -angle; // Rotate to point to center
    markerGroup.add(marker);
  }
  root.add(markerGroup);

  // Roman Numerals (Simplified Blocks)
  // Positions: 12 (PI/2), 3 (0), 6 (-PI/2), 9 (PI)
  // Helper to place a small bar
  function addNumeralBar(angle, dist, isVertical) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.035, 0.005),
      blackMat
    );
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    bar.position.set(x, y, caseDepth / 2 + 0.016);
    bar.rotation.z = -angle + (isVertical ? 0 : Math.PI/2); 
    // Actually numerals should be upright relative to the viewer, not radial?
    // In the image, XII is upright. VI is upright. III is upright.
    // So rotation.z should be 0 for all? No, they are arranged radially.
    // Usually numerals are upright (vertical Y).
    bar.rotation.z = 0; 
    markerGroup.add(bar);
  }
  
  // Let's just place simple thick lines for numerals to save code complexity and ensure visibility
  // 12:00
  addNumeralBar(Math.PI/2, dialRadius * 0.82, true); 
  // 3:00
  addNumeralBar(0, dialRadius * 0.82, true);
  // 6:00
  addNumeralBar(-Math.PI/2, dialRadius * 0.82, true);
  // 9:00
  addNumeralBar(Math.PI, dialRadius * 0.82, true);
  
  // Add secondary numerals (I, II, IV, V, etc) as smaller dots or lines
  const numeralPositions = [
    Math.PI/2 - Math.PI/6, // 1
    Math.PI/2 - 2*Math.PI/6, // 2
    // 3 done
    -Math.PI/2 + 2*Math.PI/6, // 4
    -Math.PI/2 + Math.PI/6, // 5
    // 6 done
    -Math.PI/2 - Math.PI/6, // 7
    -Math.PI/2 - 2*Math.PI/6, // 8
    // 9 done
    Math.PI/2 + 2*Math.PI/6, // 10
    Math.PI/2 + Math.PI/6, // 11
  ];
  
  for(const ang of numeralPositions) {
     const dot = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.025, 0.005),
      blackMat
    );
    const x = Math.cos(ang) * (dialRadius * 0.82);
    const y = Math.sin(ang) * (dialRadius * 0.82);
    dot.position.set(x, y, caseDepth / 2 + 0.016);
    dot.rotation.z = 0;
    markerGroup.add(dot);
  }

  // --- Hands ---
  const handGroup = new THREE.Group();
  handGroup.position.z = caseDepth / 2 + 0.025; // Above dial, below crystal ideally, but crystal is thick.
  // Actually hands are usually under crystal. Crystal z is caseDepth/2 + 0.015 (bottom) to +0.045 (top).
  // Hands at caseDepth/2 + 0.02.
  
  // Minute Hand (Long)
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.28, 0.005),
    blackMat
  );
  minuteHand.position.y = 0.14; // Pivot at 0, tip at 0.28
  // Ornate tip: add a small circle at the end
  const minuteTip = new THREE.Mesh(
    new THREE.CircleGeometry(0.015, 16),
    blackMat
  );
  minuteTip.position.y = 0.28;
  minuteTip.rotation.x = Math.PI; // Face forward
  minuteHand.add(minuteTip);
  
  // Rotate minute hand to ~10:50 position (10 minutes to 11)
  // 10 mins = 60 degrees = PI/3. 11 is 330 deg. 
  // Image: Minute hand points to X (10). Hour hand points to XI (11).
  // X is 300 degrees (-60 deg). XI is 330 degrees (-30 deg).
  // Wait, standard clock: 12 is 90 deg. 10 is 300 deg (-60).
  minuteHand.rotation.z = -Math.PI / 3; // -60 degrees
  handGroup.add(minuteHand);

  // Hour Hand (Short, wider)
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.18, 0.006),
    blackMat
  );
  hourHand.position.y = 0.09;
  // Ornate tip
  const hourTip = new THREE.Mesh(
    new THREE.CircleGeometry(0.02, 16),
    blackMat
  );
  hourTip.position.y = 0.18;
  hourTip.rotation.x = Math.PI;
  hourHand.add(hourTip);
  
  // Rotate hour hand to ~11
  // 11 is 330 degrees = -30 deg = -Math.PI/6
  hourHand.rotation.z = -Math.PI / 6;
  handGroup.add(hourHand);

  // Center Pin
  const pin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16),
    goldMat
  );
  pin.rotation.x = Math.PI / 2;
  pin.position.z = 0.005;
  handGroup.add(pin);

  root.add(handGroup);

  // --- Crown (Left Side, 9 o'clock) ---
  // Stem
  const crownStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.15, 16),
    goldMat
  );
  crownStem.rotation.z = Math.PI / 2;
  crownStem.position.set(-caseRadius - 0.075, 0, caseDepth / 2);
  root.add(crownStem);
  
  // Knob (Knurled)
  const crownKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16),
    goldMat
  );
  crownKnob.rotation.z = Math.PI / 2;
  crownKnob.position.set(-caseRadius - 0.15, 0, caseDepth / 2);
  
  // Add ridges to knob
  for(let i=0; i<6; i++) {
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.004, 8, 16),
      goldMat
    );
    ridge.rotation.y = Math.PI / 2;
    ridge.position.z = -0.03 + (i * 0.012);
    crownKnob.add(ridge);
  }
  root.add(crownKnob);

  // --- Button (Right Side, 3 o'clock) ---
  const buttonStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.10, 16),
    goldMat
  );
  buttonStem.rotation.z = Math.PI / 2;
  buttonStem.position.set(caseRadius + 0.05, 0, caseDepth / 2);
  root.add(buttonStem);
  
  const buttonTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 16, 16),
    goldMat
  );
  buttonTip.position.set(caseRadius + 0.10, 0, caseDepth / 2);
  root.add(buttonTip);

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