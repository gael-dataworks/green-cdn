export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Uniform Green (Matte Plastic/Paint)
  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x4a6b4a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Skin (Matte)
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5d0b0,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Boots (Dark Rubber/Leather)
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Leather Accessories (Belt, Strap, Scabbard)
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a3a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Metal (Buckle, Emblem) - Capped metalness to avoid blackness
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold
    metalness: 0.6,
    roughness: 0.3,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Sword Blade (Dark Steel)
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x5a5a5a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Sword Hilt (Wood/Brown)
  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0x5a3a2a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Helmet (Same as uniform but maybe slightly different shade or same)
  const helmetMat = uniformMat;

  // Patches (Red/White)
  const patchRedMat = new THREE.MeshStandardMaterial({
    color: 0xaa3333,
    metalness: 0.0,
    roughness: 0.7,
  });
  
  const patchWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  // Approximate chibi proportions
  const totalHeight = 2.0;
  const headRadius = 0.28;
  const torsoHeight = 0.55;
  const torsoRadiusTop = 0.22;
  const torsoRadiusBottom = 0.26;
  const legLength = 0.35;
  const legRadius = 0.12;
  const armLength = 0.35;
  const armRadius = 0.09;

  // --- Body Group ---
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Torso
  const torsoGeom = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, torsoHeight, 16);
  const torso = new THREE.Mesh(torsoGeom, uniformMat);
  torso.position.y = legLength + torsoHeight / 2;
  bodyGroup.add(torso);

  // Legs
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius * 0.9, legLength, 16);
  
  const leftLeg = new THREE.Mesh(legGeom, uniformMat);
  leftLeg.position.set(-0.12, legLength / 2, 0.05);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, uniformMat);
  rightLeg.position.set(0.12, legLength / 2, 0.05);
  bodyGroup.add(rightLeg);

  // Boots
  const bootGeom = new THREE.BoxGeometry(0.18, 0.12, 0.28);
  // Round the boots slightly using a capsule or modified box, but box is fine for stylized
  const leftBoot = new THREE.Mesh(bootGeom, bootMat);
  leftBoot.position.set(-0.12, 0.06, 0.08);
  bodyGroup.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeom, bootMat);
  rightBoot.position.set(0.12, 0.06, 0.08);
  bodyGroup.add(rightBoot);

  // Belt
  const beltGeom = new THREE.CylinderGeometry(torsoRadiusBottom + 0.01, torsoRadiusBottom + 0.01, 0.08, 16);
  const belt = new THREE.Mesh(beltGeom, leatherMat);
  belt.position.y = legLength + 0.04;
  bodyGroup.add(belt);

  // Buckle
  const buckleGeom = new THREE.BoxGeometry(0.12, 0.06, 0.04);
  const buckle = new THREE.Mesh(buckleGeom, silverMat);
  buckle.position.set(0, legLength + 0.04, torsoRadiusBottom + 0.03);
  bodyGroup.add(buckle);

  // Shoulder Strap (Right shoulder to Left hip)
  const strapPath = [
    new THREE.Vector3(0.15, torsoHeight + legLength - 0.1, -0.15),
    new THREE.Vector3(-0.15, legLength + 0.1, 0.15)
  ];
  const strapCurve = new THREE.LineCurve3(strapPath[0], strapPath[1]);
  const strapGeom = new THREE.TubeGeometry(strapCurve, 8, 0.025, 8, false);
  const strap = new THREE.Mesh(strapGeom, leatherMat);
  bodyGroup.add(strap);

  // Scabbard (Left hip, angled down)
  const scabbardGeom = new THREE.CylinderGeometry(0.04, 0.03, 0.45, 12);
  const scabbard = new THREE.Mesh(scabbardGeom, leatherMat);
  scabbard.position.set(-0.18, legLength + 0.1, 0.1);
  scabbard.rotation.z = Math.PI / 8; // Tilt out
  scabbard.rotation.x = -Math.PI / 6; // Tilt forward/down
  bodyGroup.add(scabbard);

  // Patches
  // Chest patch (rectangular)
  const chestPatchGeom = new THREE.BoxGeometry(0.12, 0.06, 0.01);
  const chestPatch = new THREE.Mesh(chestPatchGeom, patchRedMat);
  chestPatch.position.set(0.08, legLength + torsoHeight * 0.7, torsoRadiusTop * 0.8);
  bodyGroup.add(chestPatch);
  
  // Shoulder patch (triangle/circle)
  const shoulderPatchGeom = new THREE.CircleGeometry(0.05, 16);
  const shoulderPatch = new THREE.Mesh(shoulderPatchGeom, patchRedMat);
  shoulderPatch.position.set(0.22, legLength + torsoHeight - 0.15, 0);
  shoulderPatch.rotation.y = -Math.PI / 4;
  shoulderPatch.rotation.z = Math.PI / 4;
  bodyGroup.add(shoulderPatch);

  // --- Arms ---
  const armGroup = new THREE.Group();
  root.add(armGroup);

  // Right Arm (Holding Sword)
  // Upper Arm
  const rUpperArmGeom = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLength * 0.5, 12);
  const rUpperArm = new THREE.Mesh(rUpperArmGeom, skinMat);
  rUpperArm.position.set(0.25, legLength + torsoHeight - 0.15, 0);
  rUpperArm.rotation.z = -Math.PI / 3; // Raised
  rUpperArm.rotation.x = -Math.PI / 6; // Forward
  armGroup.add(rUpperArm);

  // Forearm
  const rForeArmGeom = new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.8, armLength * 0.5, 12);
  const rForeArm = new THREE.Mesh(rForeArmGeom, skinMat);
  // Position relative to upper arm end
  const rElbowPos = new THREE.Vector3(0.25, legLength + torsoHeight - 0.15, 0)
    .add(new THREE.Vector3(0, -armLength * 0.25, armLength * 0.4).applyAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/6).applyAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/3));
  
  // Simplified: Just place forearm manually relative to body
  rForeArm.position.set(0.35, legLength + torsoHeight - 0.35, 0.15);
  rForeArm.rotation.z = -Math.PI / 2; // Horizontal-ish
  rForeArm.rotation.x = -Math.PI / 4;
  armGroup.add(rForeArm);

  // Right Hand
  const rHandGeom = new THREE.SphereGeometry(armRadius * 0.9, 12, 12);
  const rHand = new THREE.Mesh(rHandGeom, skinMat);
  rHand.position.set(0.45, legLength + torsoHeight - 0.45, 0.25);
  rHand.scale.set(1, 1, 0.8);
  armGroup.add(rHand);

  // Left Arm (Hanging)
  const lUpperArmGeom = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLength * 0.5, 12);
  const lUpperArm = new THREE.Mesh(lUpperArmGeom, skinMat);
  lUpperArm.position.set(-0.25, legLength + torsoHeight - 0.15, 0);
  lUpperArm.rotation.z = Math.PI / 8;
  armGroup.add(lUpperArm);

  const lForeArmGeom = new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.8, armLength * 0.5, 12);
  const lForeArm = new THREE.Mesh(lForeArmGeom, skinMat);
  lForeArm.position.set(-0.28, legLength + torsoHeight - 0.4, 0.05);
  lForeArm.rotation.z = Math.PI / 6;
  armGroup.add(lForeArm);

  const lHandGeom = new THREE.SphereGeometry(armRadius * 0.9, 12, 12);
  const lHand = new THREE.Mesh(lHandGeom, skinMat);
  lHand.position.set(-0.28, legLength + torsoHeight - 0.55, 0.1);
  lHand.scale.set(1, 1, 0.8);
  armGroup.add(lHand);

  // --- Head ---
  const headGroup = new THREE.Group();
  headGroup.position.y = legLength + torsoHeight + 0.1; // Neck height
  root.add(headGroup);

  // Neck
  const neckGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.1, 12);
  const neck = new THREE.Mesh(neckGeom, skinMat);
  neck.position.y = -0.05;
  headGroup.add(neck);

  // Face (Sphere)
  const faceGeom = new THREE.SphereGeometry(headRadius, 24, 24);
  const face = new THREE.Mesh(faceGeom, skinMat);
  face.scale.set(1, 1.1, 1); // Slightly elongated
  face.position.y = 0.1;
  headGroup.add(face);

  // Helmet (Dome)
  const helmetDomeGeom = new THREE.SphereGeometry(headRadius + 0.02, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const helmetDome = new THREE.Mesh(helmetDomeGeom, helmetMat);
  helmetDome.position.y = 0.12;
  helmetDome.scale.set(1.05, 0.9, 1.05);
  headGroup.add(helmetDome);

  // Helmet Brim
  const brimGeom = new THREE.TorusGeometry(headRadius + 0.08, 0.03, 8, 32, Math.PI);
  const brim = new THREE.Mesh(brimGeom, helmetMat);
  brim.position.y = 0.05;
  brim.rotation.x = Math.PI / 2;
  brim.rotation.z = Math.PI; // Open at back
  headGroup.add(brim);

  // Helmet Emblem (Side)
  const emblemGeom = new THREE.CircleGeometry(0.04, 16);
  const emblem = new THREE.Mesh(emblemGeom, metalMat);
  emblem.position.set(headRadius + 0.025, 0.15, 0);
  emblem.rotation.y = Math.PI / 2;
  headGroup.add(emblem);

  // Chin Strap
  const strapCurveHead = new THREE.EllipseCurve(
    0, 0, // ax, aY
    0.15, 0.05, // xRadius, yRadius
    0, Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );
  const points = strapCurveHead.getPoints(20);
  const strapPoints3D = points.map(p => new THREE.Vector3(p.x, p.y - 0.1, 0)); // Shift down
  // Create a tube for the strap
  const chinStrapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, -0.1, 0.05),
    new THREE.Vector3(-0.18, -0.25, 0),
    new THREE.Vector3(0, -0.3, 0),
    new THREE.Vector3(0.18, -0.25, 0),
    new THREE.Vector3(0.15, -0.1, 0.05)
  ]);
  const chinStrapGeom = new THREE.TubeGeometry(chinStrapCurve, 20, 0.015, 8, false);
  const chinStrap = new THREE.Mesh(chinStrapGeom, leatherMat); // Using leather color for strap
  chinStrap.rotation.x = Math.PI; // Flip to match curve direction if needed
  headGroup.add(chinStrap);

  // Features
  // Nose
  const noseGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, 0.05, headRadius * 0.9);
  headGroup.add(nose);

  // Eyes (Small black spheres)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const eyeGeom = new THREE.SphereGeometry(0.02, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.08, 0.12, headRadius * 0.85);
  headGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.08, 0.12, headRadius * 0.85);
  headGroup.add(rightEye);

  // Blush (Pink circles)
  const blushMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, metalness: 0, roughness: 1 });
  const blushGeom = new THREE.CircleGeometry(0.03, 16);
  const leftBlush = new THREE.Mesh(blushGeom, blushMat);
  leftBlush.position.set(-0.12, 0.08, headRadius * 0.92);
  leftBlush.rotation.y = Math.PI / 4;
  headGroup.add(leftBlush);

  const rightBlush = new THREE.Mesh(blushGeom, blushMat);
  rightBlush.position.set(0.12, 0.08, headRadius * 0.92);
  rightBlush.rotation.y = -Math.PI / 4;
  headGroup.add(rightBlush);

  // --- Sword ---
  const swordGroup = new THREE.Group();
  // Position sword in right hand
  swordGroup.position.set(0.45, legLength + torsoHeight - 0.45, 0.25);
  swordGroup.rotation.z = -Math.PI / 4; // Angle up
  swordGroup.rotation.x = -Math.PI / 6;
  root.add(swordGroup);

  // Blade (Flattened Cone)
  const bladeGeom = new THREE.ConeGeometry(0.06, 0.6, 4); // 4 segments = diamond cross section
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.position.y = 0.3;
  blade.scale.set(1, 1, 0.15); // Flatten
  blade.rotation.y = Math.PI / 4; // Orient edge
  swordGroup.add(blade);

  // Guard (Crossbar)
  const guardGeom = new THREE.BoxGeometry(0.15, 0.02, 0.04);
  const guard = new THREE.Mesh(guardGeom, silverMat);
  guard.position.y = 0.05;
  swordGroup.add(guard);

  // Hilt (Handle)
  const hiltGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12);
  const hilt = new THREE.Mesh(hiltGeom, hiltMat);
  hilt.position.y = -0.05;
  swordGroup.add(hilt);

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