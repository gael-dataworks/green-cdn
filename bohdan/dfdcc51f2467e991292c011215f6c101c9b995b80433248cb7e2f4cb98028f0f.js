export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffaa77,
    metalness: 0.0,
    roughness: 0.6,
  });

  const hatMat = new THREE.MeshStandardMaterial({
    color: 0xdd2222,
    metalness: 0.0,
    roughness: 0.4,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0x228833,
    metalness: 0.0,
    roughness: 0.5,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x2244aa,
    metalness: 0.0,
    roughness: 0.6,
  });

  const beardMat = new THREE.MeshStandardMaterial({
    color: 0x6644aa,
    metalness: 0.0,
    roughness: 0.8,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  const bagMat = new THREE.MeshStandardMaterial({
    color: 0x119933,
    metalness: 0.0,
    roughness: 0.4,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
  });

  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.0,
    roughness: 0.2,
  });

  const eyebrowMat = new THREE.MeshStandardMaterial({
    color: 0x22aa88,
    metalness: 0.0,
    roughness: 0.6,
  });

  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x551111,
    metalness: 0.0,
    roughness: 0.3,
  });

  // --- Body ---
  // Torso is a rounded shape, slightly squashed sphere
  const torsoGeom = new THREE.SphereGeometry(0.28, 32, 32);
  const torso = new THREE.Mesh(torsoGeom, shirtMat);
  torso.scale.set(1.1, 0.9, 0.85);
  torso.position.y = 0.15;
  root.add(torso);

  // Pants (bottom section of body)
  const pantsGeom = new THREE.SphereGeometry(0.28, 32, 32);
  const pants = new THREE.Mesh(pantsGeom, pantsMat);
  pants.scale.set(1.1, 0.4, 0.85);
  pants.position.y = -0.05;
  root.add(pants);

  // --- Legs & Feet ---
  // Feet are black, slightly pointed
  const leftFootGeom = new THREE.BoxGeometry(0.08, 0.04, 0.14);
  const leftFoot = new THREE.Mesh(leftFootGeom, shoeMat);
  leftFoot.position.set(-0.12, -0.22, 0.05);
  leftFoot.rotation.y = -0.2;
  root.add(leftFoot);

  const rightFootGeom = new THREE.BoxGeometry(0.08, 0.04, 0.14);
  const rightFoot = new THREE.Mesh(rightFootGeom, shoeMat);
  rightFoot.position.set(0.12, -0.22, 0.05);
  rightFoot.rotation.y = 0.2;
  root.add(rightFoot);

  // --- Arms ---
  // Simple cylinders/capsules for arms, tucked in
  const armGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.18, 16);
  
  const leftArm = new THREE.Mesh(armGeom, shirtMat);
  leftArm.position.set(-0.28, 0.15, 0.0);
  leftArm.rotation.z = 0.3;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, shirtMat);
  rightArm.position.set(0.28, 0.15, 0.0);
  rightArm.rotation.z = -0.3;
  root.add(rightArm);

  // Hands (skin tone spheres at end of arms)
  const handGeom = new THREE.SphereGeometry(0.055, 16, 16);
  
  const leftHand = new THREE.Mesh(handGeom, skinMat);
  leftHand.position.set(-0.32, 0.05, 0.05);
  root.add(leftHand);

  const rightHand = new THREE.Mesh(handGeom, skinMat);
  rightHand.position.set(0.32, 0.05, 0.05);
  root.add(rightHand);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.18, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.42;
  root.add(head);

  // Nose (large bulbous orange sphere)
  const noseGeom = new THREE.SphereGeometry(0.05, 16, 16);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0.0, 0.40, 0.16);
  nose.scale.set(1.2, 1.0, 1.0);
  root.add(nose);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  const leftEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  leftEyeWhite.position.set(-0.06, 0.46, 0.15);
  root.add(leftEyeWhite);
  
  const rightEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  rightEyeWhite.position.set(0.06, 0.46, 0.15);
  root.add(rightEyeWhite);

  const pupilGeom = new THREE.SphereGeometry(0.012, 8, 8);
  
  const leftPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  leftPupil.position.set(-0.05, 0.46, 0.17);
  root.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeom, eyePupilMat);
  rightPupil.position.set(0.07, 0.46, 0.17);
  root.add(rightPupil);

  // Eyebrows (small cylinders)
  const browGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8);
  
  const leftBrow = new THREE.Mesh(browGeom, eyebrowMat);
  leftBrow.position.set(-0.06, 0.50, 0.14);
  leftBrow.rotation.z = 0.5;
  leftBrow.rotation.x = -0.2;
  root.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, eyebrowMat);
  rightBrow.position.set(0.06, 0.50, 0.14);
  rightBrow.rotation.z = -0.5;
  rightBrow.rotation.x = -0.2;
  root.add(rightBrow);

  // Mouth (dark slit)
  const mouthGeom = new THREE.BoxGeometry(0.06, 0.02, 0.01);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.position.set(0.0, 0.36, 0.165);
  root.add(mouth);

  // Ear (side of head)
  const earGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const ear = new THREE.Mesh(earGeom, skinMat);
  ear.position.set(0.17, 0.42, 0.0);
  ear.scale.set(0.6, 1.2, 1.0);
  root.add(ear);

  // --- Beard ---
  // Large bushy beard covering chin and chest. 
  // Using a cone-like shape with rounded tip, scaled and positioned.
  const beardGeom = new THREE.ConeGeometry(0.14, 0.25, 32);
  const beard = new THREE.Mesh(beardGeom, beardMat);
  beard.position.set(0.0, 0.30, 0.08);
  beard.rotation.x = 0.2;
  // Round the tip by scaling non-uniformly or just using the cone shape which is pointy. 
  // To make it bushy, let's scale Y less and add a sphere at the bottom.
  beard.scale.set(1.0, 0.8, 1.0);
  root.add(beard);
  
  // Beard bottom puff
  const beardPuffGeom = new THREE.SphereGeometry(0.08, 16, 16);
  const beardPuff = new THREE.Mesh(beardPuffGeom, beardMat);
  beardPuff.position.set(0.0, 0.20, 0.12);
  beardPuff.scale.set(1.4, 1.0, 1.0);
  root.add(beardPuff);

  // --- Hat ---
  // Brim
  const hatBrimGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 32);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.position.y = 0.58;
  root.add(hatBrim);

  // Cone top
  const hatConeGeom = new THREE.ConeGeometry(0.14, 0.35, 32);
  const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
  hatCone.position.y = 0.75;
  // Tilt the hat slightly
  hatCone.rotation.z = -0.1;
  hatCone.rotation.x = 0.1;
  root.add(hatCone);
  
  // Adjust brim to match tilt roughly or keep flat. Image shows brim is mostly flat but hat is tilted.
  // Let's tilt the whole hat group.
  const hatGroup = new THREE.Group();
  hatGroup.add(hatBrim);
  hatGroup.add(hatCone);
  hatGroup.position.y = 0.0; // Relative to root, but we already positioned children absolutely.
  // Actually, let's re-parent for easier tilting.
  root.remove(hatBrim);
  root.remove(hatCone);
  hatGroup.add(hatBrim);
  hatGroup.add(hatCone);
  hatGroup.rotation.z = -0.15;
  hatGroup.rotation.x = 0.1;
  root.add(hatGroup);


  // --- Bag ---
  // Large green sphere on the back
  const bagGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const bag = new THREE.Mesh(bagGeom, bagMat);
  bag.position.set(0.0, 0.25, -0.25);
  bag.scale.set(1.0, 1.1, 0.9);
  root.add(bag);

  // Bag strap (simple tube over shoulder)
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0.45, -0.15),
    new THREE.Vector3(0.0, 0.55, -0.20),
    new THREE.Vector3(0.15, 0.45, -0.15),
  ]);
  const strapGeom = new THREE.TubeGeometry(strapCurve, 16, 0.025, 8, false);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.7 });
  const strap = new THREE.Mesh(strapGeom, strapMat);
  root.add(strap);

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