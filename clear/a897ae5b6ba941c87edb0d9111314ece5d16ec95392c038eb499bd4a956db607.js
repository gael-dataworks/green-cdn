export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.4,
    metalness: 0.1,
  });

  const blueShirtMat = new THREE.MeshStandardMaterial({
    color: 0x4da6ff,
    roughness: 0.6,
    metalness: 0.0,
  });

  const blueShortsMat = new THREE.MeshStandardMaterial({
    color: 0x3366cc,
    roughness: 0.6,
    metalness: 0.0,
  });

  const redShoeMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    roughness: 0.3,
    metalness: 0.1,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.0,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.0,
  });

  const blueEyeMat = new THREE.MeshStandardMaterial({
    color: 0x2266ff,
    roughness: 0.2,
    metalness: 0.0,
  });

  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xff88aa,
    roughness: 0.4,
    metalness: 0.0,
  });

  // Hair colors for cycling
  const hairColors = [
    0xff0055, // Pink
    0xffaa00, // Orange
    0xffff00, // Yellow
    0x00ff55, // Green
    0x00aaff, // Blue
    0xaa00ff, // Purple
  ];

  // Wheel segment colors
  const wheelColors = [
    0xff0000, 0xffaa00, 0xffff00, 0x00ff00,
    0x00aaff, 0xaa00ff, 0xff00aa, 0xff5500
  ];

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.12, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.55;
  root.add(head);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const pupilGeom = new THREE.SphereGeometry(0.012, 16, 16);

  function addEye(x, z) {
    const eyeGroup = new THREE.Group();
    const white = new THREE.Mesh(eyeGeom, whiteMat);
    // Flatten eye slightly
    white.scale.set(1, 1, 0.6);
    eyeGroup.add(white);

    const pupil = new THREE.Mesh(pupilGeom, blackMat);
    pupil.position.z = 0.02;
    eyeGroup.add(pupil);

    // Iris highlight (simple white spot)
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), whiteMat);
    highlight.position.set(0.005, 0.005, 0.025);
    eyeGroup.add(highlight);

    eyeGroup.position.set(x, 0.57, 0.105);
    // Rotate eyes to face forward/slightly inward
    eyeGroup.rotation.y = -x * 0.5;
    root.add(eyeGroup);
  }
  addEye(-0.04, 0.1);
  addEye(0.04, 0.1);

  // Mouth
  const mouthGeom = new THREE.TorusGeometry(0.025, 0.004, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, pinkMat);
  mouth.position.set(0, 0.51, 0.11);
  mouth.rotation.x = Math.PI; // Flip to smile
  root.add(mouth);

  // Cheeks
  const cheekGeom = new THREE.SphereGeometry(0.015, 16, 16);
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.5 });
  const cheekL = new THREE.Mesh(cheekGeom, cheekMat);
  cheekL.position.set(-0.06, 0.54, 0.09);
  cheekL.scale.set(1.5, 0.8, 0.5);
  root.add(cheekL);
  const cheekR = new THREE.Mesh(cheekGeom, cheekMat);
  cheekR.position.set(0.06, 0.54, 0.09);
  cheekR.scale.set(1.5, 0.8, 0.5);
  root.add(cheekR);

  // --- Hair (Yarn Strands) ---
  const hairGroup = new THREE.Group();
  const strandCurveSegments = 3;
  const strandRadius = 0.008;
  
  // Deterministic distribution of hair strands on upper hemisphere
  const strandCount = 50;
  for (let i = 0; i < strandCount; i++) {
    // Golden angle distribution for even spread
    const phi = Math.acos(1 - 2 * (i + 0.5) / strandCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    // Only place on top half (phi < PI/2)
    if (phi > Math.PI / 1.8) continue;

    const r = 0.125; // Slightly larger than head
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);

    // Curve for the strand (starts at scalp, curves up/out)
    const p1 = new THREE.Vector3(x, y, z);
    const p2 = new THREE.Vector3(x * 1.2, y + 0.08, z * 1.2);
    const p3 = new THREE.Vector3(x * 1.1, y + 0.15, z * 1.1);
    
    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3);
    const tubeGeom = new THREE.TubeGeometry(curve, 8, strandRadius, 8, false);
    
    const color = hairColors[i % hairColors.length];
    const strandMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.0,
    });
    
    const strand = new THREE.Mesh(tubeGeom, strandMat);
    hairGroup.add(strand);
  }
  root.add(hairGroup);

  // --- Body ---
  // Torso
  const torsoGeom = new THREE.CylinderGeometry(0.09, 0.11, 0.22, 16);
  const torso = new THREE.Mesh(torsoGeom, blueShirtMat);
  torso.position.y = 0.32;
  root.add(torso);

  // Neck
  const neckGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.06, 12);
  const neck = new THREE.Mesh(neckGeom, skinMat);
  neck.position.y = 0.44;
  root.add(neck);

  // Shorts
  const shortsGeom = new THREE.CylinderGeometry(0.11, 0.12, 0.12, 16);
  const shorts = new THREE.Mesh(shortsGeom, blueShortsMat);
  shorts.position.y = 0.20;
  root.add(shorts);

  // Arms
  const armGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
  
  const armL = new THREE.Mesh(armGeom, skinMat);
  armL.position.set(-0.13, 0.32, 0);
  armL.rotation.z = Math.PI / 8;
  root.add(armL);

  const armR = new THREE.Mesh(armGeom, skinMat);
  armR.position.set(0.13, 0.32, 0);
  armR.rotation.z = -Math.PI / 8;
  root.add(armR);

  // Hands
  const handGeom = new THREE.SphereGeometry(0.028, 16, 16);
  const handL = new THREE.Mesh(handGeom, skinMat);
  handL.position.set(-0.14, 0.23, 0);
  root.add(handL);

  const handR = new THREE.Mesh(handGeom, skinMat);
  handR.position.set(0.14, 0.23, 0);
  root.add(handR);

  // Legs
  const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.20, 12);
  
  const legL = new THREE.Mesh(legGeom, skinMat);
  legL.position.set(-0.05, 0.10, 0);
  root.add(legL);

  const legR = new THREE.Mesh(legGeom, skinMat);
  legR.position.set(0.05, 0.10, 0);
  root.add(legR);

  // Feet / Shoes
  const shoeGeom = new THREE.BoxGeometry(0.06, 0.04, 0.10);
  // Round the front of the shoe slightly using scale or just box is fine for toy style
  const shoeL = new THREE.Mesh(shoeGeom, redShoeMat);
  shoeL.position.set(-0.05, 0.00, 0.03);
  root.add(shoeL);

  const shoeR = new THREE.Mesh(shoeGeom, redShoeMat);
  shoeR.position.set(0.05, 0.00, 0.03);
  root.add(shoeR);

  // --- Rainbow Wheel Backpack ---
  const wheelGroup = new THREE.Group();
  // Position behind the back
  wheelGroup.position.set(0, 0.30, -0.12);
  // Rotate to face backwards/sideways slightly? 
  // In image, wheel is on back, facing somewhat right-back.
  // Let's orient it perpendicular to the back (facing -Z)
  wheelGroup.rotation.y = Math.PI; 
  
  const wheelRadius = 0.18;
  const wheelDepth = 0.04;

  // Rim
  const rimGeom = new THREE.TorusGeometry(wheelRadius, 0.015, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  wheelGroup.add(rim);

  // Segments (Wedges)
  const segmentCount = 8;
  const wedgeAngle = (Math.PI * 2) / segmentCount;
  
  // Create a shape for the wedge
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, 0);
  wedgeShape.lineTo(wheelRadius - 0.02, 0); // Inner radius gap for hub
  wedgeShape.absarc(0, 0, wheelRadius - 0.02, 0, wedgeAngle, false);
  wedgeShape.lineTo(0, 0);

  const wedgeGeom = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: wheelDepth,
    bevelEnabled: false,
  });
  // Center the geometry
  wedgeGeom.translate(0, 0, -wheelDepth / 2);

  for (let i = 0; i < segmentCount; i++) {
    const color = wheelColors[i % wheelColors.length];
    const segMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.1,
    });
    const segment = new THREE.Mesh(wedgeGeom, segMat);
    segment.rotation.z = i * wedgeAngle;
    wheelGroup.add(segment);
  }

  // Hub
  const hubGeom = new THREE.CylinderGeometry(0.03, 0.03, wheelDepth + 0.01, 16);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
  const hub = new THREE.Mesh(hubGeom, hubMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.005; // Slightly forward
  wheelGroup.add(hub);

  // Hub Cap (Green center)
  const capGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, roughness: 0.3 });
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.01;
  wheelGroup.add(cap);

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