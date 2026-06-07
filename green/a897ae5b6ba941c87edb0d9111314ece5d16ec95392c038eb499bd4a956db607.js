export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.45,
    metalness: 0.0,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0x4da6ff,
    roughness: 0.7,
    metalness: 0.0,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: 0x2255aa,
    roughness: 0.7,
    metalness: 0.0,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.3,
    metalness: 0.0,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.0,
  });

  const eyeBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2266cc,
    roughness: 0.2,
    metalness: 0.0,
  });

  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.0,
  });

  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0xcc4444,
    roughness: 0.3,
    metalness: 0.0,
  });

  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.3,
    metalness: 0.0,
  });

  const wheelHubMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.0,
  });

  const wheelAxleMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Rainbow palette for hair and wheel
  const rainbowColors = [
    0xff0000, // Red
    0xff8800, // Orange
    0xffdd00, // Yellow
    0x44cc44, // Green
    0x0088ff, // Blue
    0x6600cc, // Indigo
    0xcc00cc, // Violet
  ];

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.14, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.55;
  root.add(head);

  // --- Face ---
  // Eyes
  const eyeGroup = new THREE.Group();
  const eyeWhiteGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const eyeBlueGeom = new THREE.SphereGeometry(0.018, 16, 16);
  const pupilGeom = new THREE.SphereGeometry(0.008, 8, 8);

  const eyeOffsetX = 0.045;
  const eyeOffsetY = 0.01;
  const eyeOffsetZ = 0.125;

  for (const side of [-1, 1]) {
    const white = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
    white.position.set(side * eyeOffsetX, eyeOffsetY, eyeOffsetZ);
    white.scale.set(1, 1, 0.6); // Flatten slightly
    eyeGroup.add(white);

    const iris = new THREE.Mesh(eyeBlueGeom, eyeBlueMat);
    iris.position.set(side * eyeOffsetX, eyeOffsetY, eyeOffsetZ + 0.015);
    eyeGroup.add(iris);

    const pupil = new THREE.Mesh(pupilGeom, pupilMat);
    pupil.position.set(side * eyeOffsetX, eyeOffsetY, eyeOffsetZ + 0.022);
    eyeGroup.add(pupil);

    // Eyelash / highlight
    const lashGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.025, 8);
    const lash = new THREE.Mesh(lashGeom, pupilMat);
    lash.rotation.z = Math.PI / 2;
    lash.rotation.y = side * 0.2;
    lash.position.set(side * (eyeOffsetX + 0.025), eyeOffsetY + 0.025, eyeOffsetZ + 0.01);
    eyeGroup.add(lash);
  }
  root.add(eyeGroup);

  // Mouth
  const mouthGeom = new THREE.TorusGeometry(0.035, 0.006, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.position.set(0, -0.04, 0.13);
  mouth.rotation.x = Math.PI; // Smile curve up
  root.add(mouth);

  // Cheeks (subtle spheres)
  const cheekGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.5, transparent: true, opacity: 0.6 });
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(cheekGeom, cheekMat);
    cheek.position.set(side * 0.06, -0.02, 0.11);
    cheek.scale.set(1.2, 0.6, 0.5);
    root.add(cheek);
  }

  // --- Hair (Procedural Spikes) ---
  const hairGroup = new THREE.Group();
  const hairGeom = new THREE.ConeGeometry(0.012, 0.09, 8);
  // Deterministic distribution on upper hemisphere
  const hairCount = 60;
  for (let i = 0; i < hairCount; i++) {
    // Fibonacci sphere distribution for even coverage
    const phi = Math.acos(1 - 2 * (i + 0.5) / hairCount);
    const theta = Math.sqrt(hairCount * Math.PI) * phi;
    
    // Only keep top hemisphere (phi < PI/2)
    if (phi > Math.PI / 1.8) continue;

    const r = 0.145; // Slightly outside head
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) + 0.55; // Offset by head Y
    const z = r * Math.sin(phi) * Math.sin(theta);

    const colorIdx = i % rainbowColors.length;
    const hairMat = new THREE.MeshStandardMaterial({
      color: rainbowColors[colorIdx],
      roughness: 0.8,
      metalness: 0.0,
    });

    const spike = new THREE.Mesh(hairGeom, hairMat);
    spike.position.set(x, y, z);
    spike.lookAt(new THREE.Vector3(x * 1.5, y + 0.05, z * 1.5)); // Point outward/up
    // Add some random-ish rotation around local Y for variety (deterministic based on i)
    spike.rotateZ((i % 5) * 0.3); 
    hairGroup.add(spike);
  }
  root.add(hairGroup);

  // --- Body ---
  // Torso (Tank top)
  const torsoGeom = new THREE.CylinderGeometry(0.09, 0.11, 0.22, 16);
  const torso = new THREE.Mesh(torsoGeom, shirtMat);
  torso.position.y = 0.30;
  root.add(torso);

  // Shorts
  const shortsGeom = new THREE.BoxGeometry(0.18, 0.12, 0.14);
  const shorts = new THREE.Mesh(shortsGeom, shortsMat);
  shorts.position.y = 0.16;
  // Round the shorts slightly by scaling or just keep boxy for toy look
  root.add(shorts);

  // --- Limbs ---
  const limbMat = skinMat;
  const armGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
  const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.22, 12);
  const handGeom = new THREE.SphereGeometry(0.028, 12, 12);

  // Arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeom, limbMat);
    arm.position.set(side * 0.13, 0.32, 0.02);
    arm.rotation.z = side * 0.3;
    arm.rotation.x = -0.2;
    root.add(arm);

    const hand = new THREE.Mesh(handGeom, limbMat);
    hand.position.set(side * 0.14, 0.22, 0.08);
    root.add(hand);
  }

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeom, limbMat);
    leg.position.set(side * 0.05, 0.05, 0.02);
    root.add(leg);

    // Shoes
    const shoeGeom = new THREE.BoxGeometry(0.06, 0.04, 0.10);
    const shoe = new THREE.Mesh(shoeGeom, shoeMat);
    // Round the shoe top
    shoe.position.set(side * 0.05, -0.02, 0.04);
    root.add(shoe);
  }

  // --- Wheel Assembly ---
  const wheelGroup = new THREE.Group();
  const wheelRadius = 0.22;
  const wheelThickness = 0.04;
  const rimThickness = 0.025;

  // Wheel Rim (Torus)
  const rimGeom = new THREE.TorusGeometry(wheelRadius - rimThickness, rimThickness, 16, 32);
  const rim = new THREE.Mesh(rimGeom, wheelRimMat);
  wheelGroup.add(rim);

  // Wheel Segments (Wedges)
  const segmentCount = 8;
  const innerR = 0.04;
  const outerR = wheelRadius - rimThickness * 1.5;
  const segmentAngle = (Math.PI * 2) / segmentCount;

  for (let i = 0; i < segmentCount; i++) {
    const color = rainbowColors[i % rainbowColors.length];
    const segMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.0,
    });

    // Create a wedge using CylinderGeometry with thetaLength
    // We need enough radial segments to look round, but we are cutting a slice
    const segGeom = new THREE.CylinderGeometry(
      innerR, outerR, wheelThickness, 
      3, 1, // 3 segments is enough for a wedge if we use thetaLength? No, need more for curve.
      false, 
      i * segmentAngle, segmentAngle
    );
    
    // Actually, CylinderGeometry theta args work best with higher radialSegments for the curve
    // Let's use a simpler approach: BoxGeometry rotated, or ShapeGeometry.
    // ShapeGeometry is cleaner for flat 2D shapes extruded.
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, 0, outerR, i * segmentAngle, (i + 1) * segmentAngle, false);
    shape.lineTo(0, 0);
    
    const wedgeGeom = new THREE.ExtrudeGeometry(shape, {
      depth: wheelThickness,
      bevelEnabled: false,
    });
    // Center the geometry
    wedgeGeom.center();

    const wedge = new THREE.Mesh(wedgeGeom, segMat);
    wedge.rotation.y = Math.PI / 2; // Face outward
    wheelGroup.add(wedge);
  }

  // Wheel Hub
  const hubGeom = new THREE.CylinderGeometry(0.03, 0.03, wheelThickness + 0.01, 16);
  const hub = new THREE.Mesh(hubGeom, wheelHubMat);
  hub.rotation.y = Math.PI / 2;
  wheelGroup.add(hub);

  // Axle / Handle connector (simplified as a small cylinder sticking out)
  const axleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
  const axle = new THREE.Mesh(axleGeom, wheelAxleMat);
  axle.rotation.y = Math.PI / 2;
  axle.position.z = wheelThickness / 2 + 0.04;
  wheelGroup.add(axle);

  // Position Wheel
  // The wheel is held to the side/back.
  wheelGroup.position.set(0.18, 0.25, -0.05);
  wheelGroup.rotation.z = -0.2; // Tilted slightly
  root.add(wheelGroup);

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