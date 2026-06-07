export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const CASE_RADIUS = 0.35;
  const CASE_THICKNESS = 0.06;
  const BEZEL_TUBE = 0.022;
  const DIAL_RADIUS = 0.31;
  const CRYSTAL_RADIUS = 0.33;
  const CRYSTAL_HEIGHT = 0.015;

  // --- Materials ---
  // Gold: Brightened with emissive to avoid looking dark gray in this renderer
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.35,
  });

  // Glass: Physical material for transmission/reflection
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Dial: Matte white/cream
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc, // Beige/Cream
    metalness: 0.0,
    roughness: 0.6,
  });

  // Hands: Dark metal
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Case Body ---
  // Main cylindrical body
  const caseBodyGeom = new THREE.CylinderGeometry(CASE_RADIUS, CASE_RADIUS, CASE_THICKNESS, 64);
  // Rotate to lie flat in XZ plane (cylinder is Y-up by default)
  const caseBody = new THREE.Mesh(caseBodyGeom, goldMat);
  caseBody.rotation.x = Math.PI / 2;
  root.add(caseBody);

  // Front Bezel (Torus)
  const bezelGeom = new THREE.TorusGeometry(CASE_RADIUS - BEZEL_TUBE / 2, BEZEL_TUBE, 32, 64);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  // Torus is XY plane, rotate to XZ
  bezel.rotation.x = Math.PI / 2;
  bezel.position.z = CASE_THICKNESS / 2 + BEZEL_TUBE / 2; // Slightly forward
  root.add(bezel);

  // Back Cap (optional, ensures solid look)
  const backCapGeom = new THREE.CircleGeometry(CASE_RADIUS - 0.01, 64);
  const backCap = new THREE.Mesh(backCapGeom, goldMat);
  backCap.rotation.x = Math.PI / 2;
  backCap.position.z = -CASE_THICKNESS / 2 - 0.001;
  root.add(backCap);

  // --- Crystal (Glass) ---
  const crystalGeom = new THREE.CylinderGeometry(CRYSTAL_RADIUS, CRYSTAL_RADIUS, CRYSTAL_HEIGHT, 64);
  const crystal = new THREE.Mesh(crystalGeom, glassMat);
  crystal.rotation.x = Math.PI / 2;
  crystal.position.z = CASE_THICKNESS / 2 + CRYSTAL_HEIGHT / 2;
  root.add(crystal);

  // --- Dial Face ---
  const dialGeom = new THREE.CircleGeometry(DIAL_RADIUS, 64);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.z = CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.001;
  root.add(dial);

  // --- Numerals (Procedural Meshes) ---
  // Helper to create a small bar for numerals
  function createBar(w, h, d) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), handMat);
  }

  function addNumeral(type, angle, radius) {
    const group = new THREE.Group();
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    // Common bar dimensions
    const bw = 0.012; 
    const bh = 0.045;
    const bd = 0.005;

    if (type === 'I') {
      const bar = createBar(bw, bh, bd);
      group.add(bar);
    } else if (type === 'V') {
      const left = createBar(bw, bh, bd);
      left.rotation.z = Math.PI / 6; // 30 deg
      left.position.y = bh / 2 * Math.cos(Math.PI/6);
      const right = createBar(bw, bh, bd);
      right.rotation.z = -Math.PI / 6;
      right.position.y = bh / 2 * Math.cos(Math.PI/6);
      // Shift down so V sits on baseline
      group.position.y = -bh * 0.3;
      group.add(left);
      group.add(right);
    } else if (type === 'X') {
      const left = createBar(bw, bh, bd);
      left.rotation.z = Math.PI / 6;
      const right = createBar(bw, bh, bd);
      right.rotation.z = -Math.PI / 6;
      group.add(left);
      group.add(right);
    } else if (type === 'II') {
      const l = createBar(bw, bh, bd);
      l.position.x = -bw * 1.5;
      const r = createBar(bw, bh, bd);
      r.position.x = bw * 1.5;
      group.add(l);
      group.add(r);
    } else if (type === 'III') {
      const l = createBar(bw, bh, bd);
      l.position.x = -bw * 2.0;
      const m = createBar(bw, bh, bd);
      const r = createBar(bw, bh, bd);
      r.position.x = bw * 2.0;
      group.add(l);
      group.add(m);
      group.add(r);
    } else if (type === 'IV') {
       // Simplified IV: I and V next to each other
       const i = createBar(bw, bh, bd);
       i.position.x = -bw * 2.5;
       const vL = createBar(bw, bh * 0.8, bd);
       vL.rotation.z = Math.PI / 6;
       vL.position.set(-bw * 0.5, bh * 0.2, 0);
       const vR = createBar(bw, bh * 0.8, bd);
       vR.rotation.z = -Math.PI / 6;
       vR.position.set(bw * 0.5, bh * 0.2, 0);
       group.add(i);
       group.add(vL);
       group.add(vR);
    }

    // Position the group on the dial
    group.position.set(x, y, CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.002);
    // Rotate to face center (Z is up in local dial space, but we are in world space XZ)
    // The numeral group is in XY plane. We need to rotate it around Z axis to align with radius
    // Angle in math is from X axis. 
    group.rotation.z = -angle; 
    // Also need to tilt it to lie flat on the dial (which is in XZ plane)
    // Actually, the dial is in XZ. The numerals are built in XY.
    // We need to rotate the group 90 deg around X to lie flat?
    // No, the dial mesh is rotated X=90. The numerals should be children of root, positioned in 3D.
    // Easier: Build numerals in XY, then rotate the whole group X=90.
    group.rotation.x = Math.PI / 2;
    
    // Correction: If I rotate X=90, the Y axis of the group becomes Z (up/down relative to watch face? No).
    // Watch face is XZ plane. Up on watch face is Y? No, Y is vertical in world.
    // Watch lies in XZ plane. "Up" on the dial is +Y world? No, +Y is world up.
    // The watch face is perpendicular to Z. So "Up" on the dial is +Y world.
    // So numerals should stand up along Y.
    // My createBar creates geometry along Y.
    // So I just need to position (x, y, z) and rotate around Z axis to point radially.
    // Wait, the watch is in XZ plane. The "face" is the XY plane of the watch local coords?
    // No, I rotated the case X=90. So the case lies in XZ plane. The "face" is the XZ plane.
    // So "Up" on the dial is +Y world? No.
    // If the watch is lying flat on a table (XZ plane), the face points +Y?
    // No, the case is CylinderGeometry rotated X=90. Cylinder axis is now Z.
    // So the face is in the XY plane?
    // CylinderGeometry(radius, radius, height). Axis is Y.
    // Rotate X=90 -> Axis is Z.
    // So the circular face is in the XY plane.
    // So "Up" on the dial is +Y. "Right" is +X.
    // So my numerals (built in XY) are correct orientation!
    // I just need to position them at z = face_z.
    // And rotate them around Z axis? No, around the axis perpendicular to the face (Z).
    // Yes.
    
    // Re-evaluating position:
    // x = cos(angle) * r
    // y = sin(angle) * r
    // This places them in XY plane. Correct.
    // Rotation: The numeral "I" is vertical (along Y). At angle 0 (3 o'clock), it should be vertical.
    // At angle 90 (12 o'clock), it should be horizontal? No, numerals are always upright relative to center?
    // Usually numerals are radial or upright. Let's make them radial (top points away from center).
    // "I" is a vertical bar. To be radial at 3 o'clock (angle 0), it should be horizontal?
    // No, standard watch numerals are upright relative to the viewer looking at the face?
    // Or radial? Roman numerals are often radial.
    // Let's make them radial. "I" is a bar. If radial, at 12 o'clock (Y+), it points Y+.
    // At 3 o'clock (X+), it points X+.
    // My "I" is along Y. So at 12 o'clock, no rotation needed.
    // At 3 o'clock, rotate -90 deg (Z axis).
    // So rotation.z = -angle + Math.PI/2?
    // Let's just align them upright relative to the "12" position for readability, or radial.
    // Image shows radial alignment (top of XII points out).
    // So "I" (vertical bar) needs to rotate to match the angle.
    // Angle 0 is +X. Angle PI/2 is +Y.
    // At +Y (12 o'clock), bar is vertical (along Y). Rotation 0.
    // At +X (3 o'clock), bar should be horizontal (along X). Rotation -PI/2.
    // So rotation.z = -angle.
    
    group.rotation.z = -angle;
    root.add(group);
  }

  // Add Numerals (12, 1, 2... 11)
  // 12 is at PI/2. 3 is at 0. 6 is at -PI/2. 9 is at PI.
  const numerals = [
    { type: 'XII', angle: Math.PI / 2 },
    { type: 'I', angle: Math.PI / 2 - Math.PI / 6 },
    { type: 'II', angle: Math.PI / 2 - 2 * Math.PI / 6 },
    { type: 'III', angle: Math.PI / 2 - 3 * Math.PI / 6 }, // 3 o'clock
    { type: 'IV', angle: Math.PI / 2 - 4 * Math.PI / 6 },
    { type: 'V', angle: Math.PI / 2 - 5 * Math.PI / 6 },
    { type: 'VI', angle: Math.PI / 2 - 6 * Math.PI / 6 }, // 6 o'clock
    { type: 'VII', angle: Math.PI / 2 - 7 * Math.PI / 6 },
    { type: 'VIII', angle: Math.PI / 2 - 8 * Math.PI / 6 },
    { type: 'IX', angle: Math.PI / 2 - 9 * Math.PI / 6 }, // 9 o'clock
    { type: 'X', angle: Math.PI / 2 - 10 * Math.PI / 6 },
    { type: 'XI', angle: Math.PI / 2 - 11 * Math.PI / 6 },
  ];

  for (const num of numerals) {
    addNumeral(num.type, num.angle, DIAL_RADIUS * 0.85);
  }

  // Minute ticks (simple lines)
  const tickGeom = new THREE.BoxGeometry(0.004, 0.02, 0.002);
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue; // Skip where numerals are
    const angle = Math.PI / 2 - (i / 60) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeom, handMat);
    const r = DIAL_RADIUS * 0.92;
    tick.position.set(Math.cos(angle) * r, Math.sin(angle) * r, CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.002);
    tick.rotation.z = -angle;
    root.add(tick);
  }

  // --- Hands ---
  // Pivot
  const pivotGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const pivot = new THREE.Mesh(pivotGeom, goldMat);
  pivot.rotation.x = Math.PI / 2;
  pivot.position.z = CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.005;
  root.add(pivot);

  // Hour Hand (Short, ornate)
  // Approximate with a tapered box or combination
  const hourHandGeom = new THREE.BoxGeometry(0.02, 0.12, 0.005);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.y = 0.04; // Offset so pivot is at base
  hourHand.position.z = CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.004;
  // Time: ~10:55 (Hour hand near 11)
  // 11 is at angle: PI/2 - 11/12 * 2PI = PI/2 - 11PI/6 = 3PI/6 - 11PI/6 = -8PI/6 = -4PI/3 = 2PI/3 (120 deg)
  // Wait, 12 is 90 deg. 11 is 90 + 30 = 120 deg.
  hourHand.rotation.z = -Math.PI * (10.9 / 12) + Math.PI / 2; 
  root.add(hourHand);

  // Minute Hand (Long, thin)
  const minHandGeom = new THREE.BoxGeometry(0.012, 0.22, 0.004);
  const minHand = new THREE.Mesh(minHandGeom, handMat);
  minHand.position.y = 0.08;
  minHand.position.z = CASE_THICKNESS / 2 + CRYSTAL_HEIGHT + 0.006;
  // Time: ~25 min (Pointing at 5)
  // 5 is at angle: 90 - 5/12 * 360 = 90 - 150 = -60 deg.
  minHand.rotation.z = -Math.PI * (25 / 60) + Math.PI / 2;
  root.add(minHand);

  // --- Crown (Left Side, -X) ---
  // Stem
  const crownStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16);
  const crownStem = new THREE.Mesh(crownStemGeom, goldMat);
  crownStem.rotation.z = Math.PI / 2;
  crownStem.position.set(-CASE_RADIUS - 0.02, 0, 0);
  root.add(crownStem);
  // Knob
  const crownKnobGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16);
  const crownKnob = new THREE.Mesh(crownKnobGeom, goldMat);
  crownKnob.rotation.z = Math.PI / 2;
  crownKnob.position.set(-CASE_RADIUS - 0.055, 0, 0);
  root.add(crownKnob);

  // --- Bow/Stem Attachment (Right Side, +X) ---
  // Simple stem with ball
  const bowStemGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.05, 16);
  const bowStem = new THREE.Mesh(bowStemGeom, goldMat);
  bowStem.rotation.z = Math.PI / 2;
  bowStem.position.set(CASE_RADIUS + 0.025, 0, 0);
  root.add(bowStem);
  
  const bowBallGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const bowBall = new THREE.Mesh(bowBallGeom, goldMat);
  bowBall.position.set(CASE_RADIUS + 0.055, 0, 0);
  root.add(bowBall);

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