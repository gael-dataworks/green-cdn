export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Using MeshStandardMaterial for most parts.
  // Metalness capped at 0.0 for non-metals (painted wood/plastic look).
  // Roughness varies for painted vs matte surfaces.

  const hatMat = new THREE.MeshStandardMaterial({
    color: 0xd92525, // Bright red
    metalness: 0.0,
    roughness: 0.5,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdbac, // Peach skin
    metalness: 0.0,
    roughness: 0.7,
  });

  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0x2e8b57, // Sea green
    metalness: 0.0,
    roughness: 0.6,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x1e3f8b, // Dark blue
    metalness: 0.0,
    roughness: 0.6,
  });

  const beardMat = new THREE.MeshStandardMaterial({
    color: 0x6a5acd, // Slate blue / Purple base
    metalness: 0.0,
    roughness: 0.8,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xff8c42, // Orange
    metalness: 0.0,
    roughness: 0.6,
  });

  const sackMat = new THREE.MeshStandardMaterial({
    color: 0x228b22, // Forest green (darker than tunic)
    metalness: 0.0,
    roughness: 0.7,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x111111, // Black
    metalness: 0.0,
    roughness: 0.8,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.0,
    roughness: 0.3,
  });

  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x8b0000, // Dark red
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  // Relative units, will be normalized at the end.
  const bodyRadius = 0.22;
  const bodyHeight = 0.35;
  const headRadius = 0.11;
  const hatHeight = 0.28;
  const hatBrimRadius = 0.16;
  const sackRadius = 0.24;

  // --- Body (Tunic) ---
  // Pear-shaped body. Sphere scaled on Y and Z.
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 32, 32);
  const body = new THREE.Mesh(bodyGeom, tunicMat);
  body.scale.set(1.1, 1.3, 1.0); // Wider and taller
  body.position.y = bodyHeight / 2;
  root.add(body);

  // Belt (Blue band at bottom)
  const beltGeom = new THREE.TorusGeometry(bodyRadius * 1.05, 0.03, 16, 32);
  const belt = new THREE.Mesh(beltGeom, beltMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.08; // Near bottom of body
  root.add(belt);

  // --- Legs / Boots ---
  // Short black shapes at the bottom
  const bootGeom = new THREE.CapsuleGeometry(0.04, 0.06, 4, 8);
  const leftBoot = new THREE.Mesh(bootGeom, bootMat);
  leftBoot.rotation.z = Math.PI / 2;
  leftBoot.position.set(-0.06, 0.03, 0.08);
  root.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeom, bootMat);
  rightBoot.rotation.z = Math.PI / 2;
  rightBoot.position.set(0.06, 0.03, 0.08);
  root.add(rightBoot);

  // --- Arms ---
  // Green cylinders attached to sides
  const armGeom = new THREE.CylinderGeometry(0.035, 0.03, 0.18, 16);
  
  const leftArm = new THREE.Mesh(armGeom, tunicMat);
  leftArm.rotation.z = Math.PI / 2;
  leftArm.rotation.y = -0.2;
  leftArm.position.set(-0.22, 0.25, 0.05);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, tunicMat);
  rightArm.rotation.z = Math.PI / 2;
  rightArm.rotation.y = 0.2;
  rightArm.position.set(0.22, 0.25, 0.05);
  root.add(rightArm);

  // Hands (Peach spheres at ends of arms)
  const handGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const leftHand = new THREE.Mesh(handGeom, skinMat);
  leftHand.position.set(-0.30, 0.25, 0.05);
  root.add(leftHand);

  const rightHand = new THREE.Mesh(handGeom, skinMat);
  rightHand.position.set(0.30, 0.25, 0.05);
  root.add(rightHand);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(headRadius, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = bodyHeight + headRadius * 0.8;
  root.add(head);

  // --- Face Features ---
  
  // Nose (Large orange bulb)
  const noseGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, head.position.y - 0.02, headRadius * 0.95);
  root.add(nose);

  // Eyes (White spheres + black pupils)
  const eyeOffsetX = 0.04;
  const eyeOffsetY = 0.03;
  const eyeZ = headRadius * 0.85;
  
  const eyeWhiteGeom = new THREE.SphereGeometry(0.012, 8, 8);
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
  leftEyeWhite.position.set(-eyeOffsetX, head.position.y + eyeOffsetY, eyeZ);
  root.add(leftEyeWhite);
  
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
  rightEyeWhite.position.set(eyeOffsetX, head.position.y + eyeOffsetY, eyeZ);
  root.add(rightEyeWhite);

  const pupilGeom = new THREE.SphereGeometry(0.005, 8, 8);
  
  const leftPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  leftPupil.position.set(-eyeOffsetX - 0.002, head.position.y + eyeOffsetY, eyeZ + 0.01);
  root.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  rightPupil.position.set(eyeOffsetX - 0.002, head.position.y + eyeOffsetY, eyeZ + 0.01);
  root.add(rightPupil);

  // Eyebrows (Blue/Green painted - using thin flattened spheres)
  const browGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const browMat = new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.8 });
  
  const leftBrow = new THREE.Mesh(browGeom, browMat);
  leftBrow.scale.set(1.5, 0.5, 0.5);
  leftBrow.rotation.z = -0.3;
  leftBrow.position.set(-eyeOffsetX, head.position.y + eyeOffsetY + 0.025, eyeZ);
  root.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, browMat);
  rightBrow.scale.set(1.5, 0.5, 0.5);
  rightBrow.rotation.z = 0.3;
  rightBrow.position.set(eyeOffsetX, head.position.y + eyeOffsetY + 0.025, eyeZ);
  root.add(rightBrow);

  // Mouth (Smile - Torus segment or flattened sphere)
  const mouthGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.rotation.x = Math.PI / 2;
  mouth.rotation.y = -Math.PI / 2; // Face forward
  mouth.position.set(0, head.position.y - 0.06, headRadius * 0.9);
  root.add(mouth);

  // Ears (Peach flattened spheres on sides)
  const earGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.scale.set(0.5, 1.2, 0.8);
  leftEar.rotation.y = Math.PI / 2;
  leftEar.position.set(-headRadius * 0.9, head.position.y, 0);
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.scale.set(0.5, 1.2, 0.8);
  rightEar.rotation.y = -Math.PI / 2;
  rightEar.position.set(headRadius * 0.9, head.position.y, 0);
  root.add(rightEar);

  // --- Beard ---
  // Large purple/blue mass hanging from chin
  // Using a modified sphere/cone shape
  const beardGeom = new THREE.SphereGeometry(0.09, 32, 32);
  const beard = new THREE.Mesh(beardGeom, beardMat);
  beard.scale.set(1.0, 1.4, 0.8);
  beard.position.set(0, head.position.y - 0.12, headRadius * 0.6);
  root.add(beard);

  // --- Hat ---
  // Cone for the main part
  const hatConeGeom = new THREE.ConeGeometry(hatBrimRadius * 0.6, hatHeight, 32);
  const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
  // Tilt the hat slightly
  hatCone.rotation.z = -0.1;
  hatCone.rotation.x = 0.1;
  hatCone.position.set(0, head.position.y + headRadius + hatHeight / 2 - 0.02, 0);
  root.add(hatCone);

  // Brim (Flattened cylinder/torus)
  const hatBrimGeom = new THREE.CylinderGeometry(hatBrimRadius, hatBrimRadius * 1.1, 0.02, 32);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.rotation.z = -0.1;
  hatBrim.rotation.x = 0.1;
  hatBrim.position.set(0, head.position.y + headRadius * 0.8, 0);
  root.add(hatBrim);

  // --- Sack ---
  // Large green sphere on the back
  const sackGeom = new THREE.SphereGeometry(sackRadius, 32, 32);
  const sack = new THREE.Mesh(sackGeom, sackMat);
  // Position behind and slightly above shoulder
  sack.position.set(0.15, bodyHeight + 0.1, -0.15);
  sack.rotation.z = 0.2;
  root.add(sack);

  // Sack Tie (Torus at top of sack)
  const sackTieGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16);
  const sackTie = new THREE.Mesh(sackTieGeom, sackMat);
  sackTie.rotation.x = Math.PI / 2;
  sackTie.position.set(0.15, bodyHeight + 0.1 + sackRadius, -0.15);
  root.add(sackTie);

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