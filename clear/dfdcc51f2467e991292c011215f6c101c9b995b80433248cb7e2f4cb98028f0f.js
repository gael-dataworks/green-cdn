export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7, metalness: 0.0 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6, metalness: 0.0 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.6, metalness: 0.0 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0044aa, roughness: 0.7, metalness: 0.0 });
  const beardMat = new THREE.MeshStandardMaterial({ color: 0x6644aa, roughness: 0.8, metalness: 0.0 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.6, metalness: 0.0 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.0 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff8844, roughness: 0.6, metalness: 0.0 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.0 });
  const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.0 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.4, metalness: 0.0 });

  // --- Body ---
  // Torso: Large green sphere-like shape
  const torsoGeom = new THREE.SphereGeometry(0.28, 32, 32);
  const torso = new THREE.Mesh(torsoGeom, jacketMat);
  torso.scale.set(1.1, 0.9, 0.9); // Slightly wider
  torso.position.y = -0.05;
  root.add(torso);

  // Pants: Blue bottom section
  const pantsGeom = new THREE.CylinderGeometry(0.26, 0.28, 0.12, 32);
  const pants = new THREE.Mesh(pantsGeom, pantsMat);
  pants.position.y = -0.28;
  root.add(pants);

  // Sack: Large green sphere on the back
  const sackGeom = new THREE.SphereGeometry(0.24, 32, 32);
  const sack = new THREE.Mesh(sackGeom, sackMat);
  sack.position.set(0, 0.05, -0.22);
  sack.scale.set(1.0, 1.1, 0.9);
  root.add(sack);

  // --- Head Group ---
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.18;
  root.add(headGroup);

  // Head: Skin tone sphere
  const headGeom = new THREE.SphereGeometry(0.14, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  headGroup.add(head);

  // Nose: Large orange bulb
  const noseGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, -0.02, 0.13);
  nose.scale.set(1.0, 0.8, 1.2);
  headGroup.add(nose);

  // Ears: Small capsules on sides
  const earGeom = new THREE.CapsuleGeometry(0.025, 0.04, 4, 8);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.rotation.z = Math.PI / 2;
  leftEar.position.set(-0.13, -0.02, 0);
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.rotation.z = Math.PI / 2;
  rightEar.position.set(0.13, -0.02, 0);
  headGroup.add(rightEar);

  // Beard: Purple flowing shape
  // Using a scaled sphere/cone hybrid approach
  const beardGeom = new THREE.SphereGeometry(0.13, 32, 32);
  const beard = new THREE.Mesh(beardGeom, beardMat);
  beard.position.set(0, -0.08, 0.05);
  beard.scale.set(0.9, 1.4, 0.8);
  // Rotate to point down
  beard.rotation.x = 0.2;
  headGroup.add(beard);

  // Eyes: White spheres + black pupils
  const eyeWhiteGeom = new THREE.SphereGeometry(0.018, 16, 16);
  const eyePupilGeom = new THREE.SphereGeometry(0.008, 16, 16);

  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
  leftEyeWhite.position.set(-0.05, 0.02, 0.12);
  headGroup.add(leftEyeWhite);
  const leftPupil = new THREE.Mesh(eyePupilGeom, eyePupilMat);
  leftPupil.position.set(-0.05, 0.02, 0.135);
  headGroup.add(leftPupil);

  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
  rightEyeWhite.position.set(0.05, 0.02, 0.12);
  headGroup.add(rightEyeWhite);
  const rightPupil = new THREE.Mesh(eyePupilGeom, eyePupilMat);
  rightPupil.position.set(0.05, 0.02, 0.135);
  headGroup.add(rightPupil);

  // Mouth: Red crescent/sphere slice under nose
  const mouthGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.position.set(0, -0.06, 0.125);
  mouth.scale.set(1.4, 0.6, 0.6);
  headGroup.add(mouth);

  // Hat: Red cone + brim
  const hatTopGeom = new THREE.ConeGeometry(0.12, 0.25, 32);
  const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
  hatTop.position.y = 0.18;
  headGroup.add(hatTop);

  const hatBrimGeom = new THREE.TorusGeometry(0.14, 0.015, 16, 32);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 0.06;
  headGroup.add(hatBrim);

  // --- Arms ---
  // Left Arm (visible on side)
  const armGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.18, 16);
  const leftArm = new THREE.Mesh(armGeom, jacketMat);
  leftArm.rotation.z = Math.PI / 4;
  leftArm.rotation.x = -Math.PI / 6;
  leftArm.position.set(-0.22, -0.05, 0.1);
  root.add(leftArm);

  const leftHandGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const leftHand = new THREE.Mesh(leftHandGeom, skinMat);
  leftHand.position.set(-0.22, -0.18, 0.15);
  root.add(leftHand);

  // Right Arm (mostly hidden, but let's add a hint or keep it simple)
  // The image shows the right arm hidden by the sack/body mostly, but a hint is good.
  const rightArm = new THREE.Mesh(armGeom, jacketMat);
  rightArm.rotation.z = -Math.PI / 4;
  rightArm.rotation.x = -Math.PI / 6;
  rightArm.position.set(0.22, -0.05, 0.1);
  root.add(rightArm);

  const rightHand = new THREE.Mesh(leftHandGeom, skinMat);
  rightHand.position.set(0.22, -0.18, 0.15);
  root.add(rightHand);

  // --- Legs/Feet ---
  // Feet are black shoes sticking out from under the pants
  const footGeom = new THREE.BoxGeometry(0.08, 0.04, 0.14);
  const leftFoot = new THREE.Mesh(footGeom, shoeMat);
  leftFoot.position.set(-0.12, -0.36, 0.08);
  root.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeom, shoeMat);
  rightFoot.position.set(0.12, -0.36, 0.08);
  root.add(rightFoot);

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