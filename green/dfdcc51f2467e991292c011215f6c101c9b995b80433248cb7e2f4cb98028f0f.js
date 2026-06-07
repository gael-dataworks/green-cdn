export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const redMat = new THREE.MeshStandardMaterial({ color: 0xd92525, roughness: 0.4, metalness: 0.1 });
  const greenCoatMat = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, roughness: 0.5, metalness: 0.1 });
  const greenSackMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.4, metalness: 0.1 });
  const bluePantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6, metalness: 0.0 });
  const blueBeardMat = new THREE.MeshStandardMaterial({ color: 0x6a7bb8, roughness: 0.7, metalness: 0.0 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5, metalness: 0.0 });
  const orangeNoseMat = new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.4, metalness: 0.0 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.2 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff6666, roughness: 0.6, metalness: 0.0 });
  const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x1a5c1a, roughness: 0.5, metalness: 0.0 });

  // --- Body ---
  // Main torso is a large rounded shape. Using a sphere scaled to be egg-like.
  const bodyGeom = new THREE.SphereGeometry(0.35, 32, 32);
  const body = new THREE.Mesh(bodyGeom, greenCoatMat);
  body.scale.set(1.1, 0.9, 0.9);
  body.position.y = 0.1;
  root.add(body);

  // Pants (bottom section of body)
  const pantsGeom = new THREE.SphereGeometry(0.36, 32, 32);
  const pants = new THREE.Mesh(pantsGeom, bluePantsMat);
  pants.scale.set(1.1, 0.4, 0.9);
  pants.position.y = -0.15;
  root.add(pants);

  // Feet
  const footGeom = new THREE.CapsuleGeometry(0.06, 0.12, 8, 8);
  const leftFoot = new THREE.Mesh(footGeom, blackMat);
  leftFoot.rotation.z = Math.PI / 2;
  leftFoot.position.set(-0.12, -0.32, 0.15);
  root.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeom, blackMat);
  rightFoot.rotation.z = Math.PI / 2;
  rightFoot.position.set(0.12, -0.32, 0.15);
  root.add(rightFoot);

  // Sack on back
  const sackGeom = new THREE.SphereGeometry(0.28, 32, 32);
  const sack = new THREE.Mesh(sackGeom, greenSackMat);
  sack.position.set(0, 0.15, -0.35);
  sack.scale.set(1.0, 1.1, 1.0);
  root.add(sack);

  // Arms (simple cylinders tucked in)
  const armGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.25, 16);
  const leftArm = new THREE.Mesh(armGeom, greenCoatMat);
  leftArm.rotation.z = Math.PI / 6;
  leftArm.position.set(-0.32, 0.05, 0.1);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, greenCoatMat);
  rightArm.rotation.z = -Math.PI / 6;
  rightArm.position.set(0.32, 0.05, 0.1);
  root.add(rightArm);

  // Hands (peeking out)
  const handGeom = new THREE.SphereGeometry(0.055, 16, 16);
  const leftHand = new THREE.Mesh(handGeom, skinMat);
  leftHand.position.set(-0.38, -0.08, 0.18);
  root.add(leftHand);

  const rightHand = new THREE.Mesh(handGeom, skinMat);
  rightHand.position.set(0.38, -0.08, 0.18);
  root.add(rightHand);

  // Button on coat
  const buttonGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  const button = new THREE.Mesh(buttonGeom, darkGreenMat);
  button.rotation.x = Math.PI / 2;
  button.position.set(-0.15, 0.0, 0.33);
  root.add(button);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.26, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.45;
  root.add(head);

  // Ears
  const earGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.scale.set(0.6, 1.2, 0.8);
  leftEar.position.set(-0.24, 0.45, 0.0);
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.scale.set(0.6, 1.2, 0.8);
  rightEar.position.set(0.24, 0.45, 0.0);
  root.add(rightEar);

  // Nose
  const noseGeom = new THREE.SphereGeometry(0.055, 32, 32);
  const nose = new THREE.Mesh(noseGeom, orangeNoseMat);
  nose.position.set(0, 0.42, 0.24);
  nose.scale.set(1.2, 1.0, 1.0);
  root.add(nose);

  // Eyes
  const eyeWhiteGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, whiteMat);
  leftEyeWhite.position.set(-0.08, 0.52, 0.22);
  root.add(leftEyeWhite);

  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, whiteMat);
  rightEyeWhite.position.set(0.08, 0.52, 0.22);
  root.add(rightEyeWhite);

  const pupilGeom = new THREE.SphereGeometry(0.012, 16, 16);
  const leftPupil = new THREE.Mesh(pupilGeom, blackMat);
  leftPupil.position.set(-0.07, 0.52, 0.245);
  root.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeom, blackMat);
  rightPupil.position.set(0.07, 0.52, 0.245);
  root.add(rightPupil);

  // Eyebrows (bushy blue)
  const browGeom = new THREE.CapsuleGeometry(0.015, 0.06, 8, 8);
  const leftBrow = new THREE.Mesh(browGeom, blueBeardMat);
  leftBrow.rotation.z = -0.2;
  leftBrow.position.set(-0.08, 0.56, 0.21);
  root.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, blueBeardMat);
  rightBrow.rotation.z = 0.2;
  rightBrow.position.set(0.08, 0.56, 0.21);
  root.add(rightBrow);

  // Cheeks
  const cheekGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const leftCheek = new THREE.Mesh(cheekGeom, pinkMat);
  leftCheek.position.set(-0.12, 0.45, 0.20);
  leftCheek.scale.set(1.0, 0.6, 0.4);
  root.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeom, pinkMat);
  rightCheek.position.set(0.12, 0.45, 0.20);
  rightCheek.scale.set(1.0, 0.6, 0.4);
  root.add(rightCheek);

  // Mouth (smile)
  const mouthGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, new THREE.MeshStandardMaterial({ color: 0x880000, roughness: 0.2 }));
  mouth.rotation.x = Math.PI / 2;
  mouth.rotation.y = Math.PI; // Face forward
  mouth.position.set(0, 0.38, 0.25);
  root.add(mouth);
  
  // Teeth (small white strip inside mouth)
  const teethGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
  const teeth = new THREE.Mesh(teethGeom, whiteMat);
  teeth.rotation.x = Math.PI / 2;
  teeth.position.set(0, 0.375, 0.255);
  teeth.scale.set(0.6, 0.4, 0.4);
  root.add(teeth);

  // Beard (Large flowing shape)
  // Using a lathe geometry for the profile of the beard
  const beardProfile = [
    new THREE.Vector2(0.0, 0.0), // Top center (under nose)
    new THREE.Vector2(0.08, -0.05), // Side near ear
    new THREE.Vector2(0.18, -0.15), // Widest part
    new THREE.Vector2(0.15, -0.35), // Tapering down
    new THREE.Vector2(0.0, -0.45), // Bottom center point
    new THREE.Vector2(-0.15, -0.35), // Other side taper
    new THREE.Vector2(-0.18, -0.15), // Other side wide
    new THREE.Vector2(-0.08, -0.05), // Other side near ear
    new THREE.Vector2(0.0, 0.0) // Close loop
  ];
  // Actually, for a beard that wraps around, a sphere scaled and clipped is easier, 
  // but let's try a custom shape or just a large scaled sphere for the main mass 
  // and some tubes for the locks.
  
  const beardBaseGeom = new THREE.SphereGeometry(0.18, 32, 32);
  const beardBase = new THREE.Mesh(beardBaseGeom, blueBeardMat);
  beardBase.position.set(0, 0.30, 0.15);
  beardBase.scale.set(1.3, 1.4, 1.0);
  root.add(beardBase);

  // Beard locks (tubes flowing down)
  const lockCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0.35, 0.15),
    new THREE.Vector3(-0.20, 0.15, 0.25),
    new THREE.Vector3(-0.15, -0.10, 0.30)
  ]);
  const leftLock = new THREE.Mesh(new THREE.TubeGeometry(lockCurve, 16, 0.04, 8, false), blueBeardMat);
  root.add(leftLock);

  const lockCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, 0.35, 0.15),
    new THREE.Vector3(0.20, 0.15, 0.25),
    new THREE.Vector3(0.15, -0.10, 0.30)
  ]);
  const rightLock = new THREE.Mesh(new THREE.TubeGeometry(lockCurve2, 16, 0.04, 8, false), blueBeardMat);
  root.add(rightLock);
  
  const centerLock = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), blueBeardMat);
  centerLock.position.set(0, 0.10, 0.32);
  centerLock.scale.set(1.0, 1.5, 1.0);
  root.add(centerLock);

  // Mustache (blue, above mouth)
  const mustacheGeom = new THREE.TorusGeometry(0.05, 0.018, 8, 16, Math.PI * 0.8);
  const mustache = new THREE.Mesh(mustacheGeom, blueBeardMat);
  mustache.rotation.x = Math.PI / 2;
  mustache.rotation.y = Math.PI;
  mustache.position.set(0, 0.40, 0.26);
  mustache.scale.set(1.2, 1.0, 1.0);
  root.add(mustache);

  // --- Hat ---
  // Brim
  const brimGeom = new THREE.TorusGeometry(0.28, 0.025, 16, 32);
  const brim = new THREE.Mesh(brimGeom, redMat);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.68;
  root.add(brim);

  // Cone
  const hatConeGeom = new THREE.ConeGeometry(0.18, 0.45, 32);
  const hatCone = new THREE.Mesh(hatConeGeom, redMat);
  hatCone.position.y = 0.85;
  root.add(hatCone);
  
  // Hat tip (slightly bent)
  const hatTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), redMat);
  hatTip.position.set(0.05, 1.05, 0.05);
  root.add(hatTip);

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