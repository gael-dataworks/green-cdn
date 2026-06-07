export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac85, roughness: 0.4, metalness: 0.0 });
  const uniformMat = new THREE.MeshStandardMaterial({ color: 0x4a6b4a, roughness: 0.5, metalness: 0.1 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.2 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.6, metalness: 0.0 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.4, metalness: 0.5 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.0 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.6, metalness: 0.0 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 32);
  const base = new THREE.Mesh(baseGeom, blackMat);
  base.position.y = -0.26;
  root.add(base);

  // --- Legs & Boots ---
  // Left Leg
  const leftBootGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 16);
  const leftBoot = new THREE.Mesh(leftBootGeom, bootMat);
  leftBoot.position.set(-0.04, -0.18, 0.02);
  leftBoot.rotation.z = 0.1;
  root.add(leftBoot);

  const leftPantGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.14, 16);
  const leftPant = new THREE.Mesh(leftPantGeom, uniformMat);
  leftPant.position.set(-0.04, -0.06, 0.02);
  leftPant.rotation.z = 0.1;
  root.add(leftPant);

  // Right Leg
  const rightBootGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 16);
  const rightBoot = new THREE.Mesh(rightBootGeom, bootMat);
  rightBoot.position.set(0.04, -0.18, 0.02);
  rightBoot.rotation.z = -0.1;
  root.add(rightBoot);

  const rightPantGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.14, 16);
  const rightPant = new THREE.Mesh(rightPantGeom, uniformMat);
  rightPant.position.set(0.04, -0.06, 0.02);
  rightPant.rotation.z = -0.1;
  root.add(rightPant);

  // --- Torso ---
  const torsoGeom = new THREE.BoxGeometry(0.16, 0.22, 0.10);
  const torso = new THREE.Mesh(torsoGeom, uniformMat);
  torso.position.set(0, 0.08, 0.0);
  // Taper torso slightly
  torso.scale.set(1, 1, 0.9); 
  root.add(torso);

  // Belt
  const beltGeom = new THREE.TorusGeometry(0.09, 0.012, 8, 24);
  const belt = new THREE.Mesh(beltGeom, leatherMat);
  belt.position.set(0, -0.02, 0.0);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.1, 1, 0.9);
  root.add(belt);

  // Belt Buckle
  const buckleGeom = new THREE.BoxGeometry(0.025, 0.025, 0.005);
  const buckle = new THREE.Mesh(buckleGeom, goldMat);
  buckle.position.set(0, -0.02, 0.055);
  root.add(buckle);

  // Shoulder Strap (Diagonal)
  const strapGeom = new THREE.BoxGeometry(0.015, 0.28, 0.005);
  const strap = new THREE.Mesh(strapGeom, leatherMat);
  strap.position.set(0.02, 0.12, 0.04);
  strap.rotation.z = -0.6;
  strap.rotation.y = 0.2;
  root.add(strap);

  // Scabbard (at hip)
  const scabbardGeom = new THREE.CylinderGeometry(0.012, 0.015, 0.14, 12);
  const scabbard = new THREE.Mesh(scabbardGeom, leatherMat);
  scabbard.position.set(0.06, -0.05, 0.04);
  scabbard.rotation.x = 0.5;
  scabbard.rotation.z = -0.2;
  root.add(scabbard);

  // --- Arms ---
  // Left Arm (Down)
  const leftArmGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.14, 12);
  const leftArm = new THREE.Mesh(leftArmGeom, skinMat);
  leftArm.position.set(-0.11, 0.08, 0.0);
  leftArm.rotation.z = 0.15;
  root.add(leftArm);
  
  const leftHandGeom = new THREE.SphereGeometry(0.028, 16, 16);
  const leftHand = new THREE.Mesh(leftHandGeom, skinMat);
  leftHand.position.set(-0.11, -0.02, 0.0);
  root.add(leftHand);

  // Right Arm (Holding Sword)
  const rightUpperArmGeom = new THREE.CylinderGeometry(0.028, 0.025, 0.10, 12);
  const rightUpperArm = new THREE.Mesh(rightUpperArmGeom, skinMat);
  rightUpperArm.position.set(0.10, 0.10, 0.0);
  rightUpperArm.rotation.z = -0.4;
  rightUpperArm.rotation.x = -0.2;
  root.add(rightUpperArm);

  const rightLowerArmGeom = new THREE.CylinderGeometry(0.024, 0.022, 0.10, 12);
  const rightLowerArm = new THREE.Mesh(rightLowerArmGeom, skinMat);
  rightLowerArm.position.set(0.14, 0.03, 0.02);
  rightLowerArm.rotation.z = -1.2; // Bent up
  rightLowerArm.rotation.x = -0.2;
  root.add(rightLowerArm);

  const rightHandGeom = new THREE.SphereGeometry(0.026, 16, 16);
  const rightHand = new THREE.Mesh(rightHandGeom, skinMat);
  rightHand.position.set(0.16, -0.03, 0.04);
  root.add(rightHand);

  // --- Sword ---
  const swordGroup = new THREE.Group();
  
  // Blade
  const bladeGeom = new THREE.BoxGeometry(0.025, 0.22, 0.004);
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.position.set(0, 0.11, 0);
  swordGroup.add(blade);

  // Guard
  const guardGeom = new THREE.BoxGeometry(0.06, 0.015, 0.015);
  const guard = new THREE.Mesh(guardGeom, metalMat);
  guard.position.set(0, 0, 0);
  swordGroup.add(guard);

  // Handle
  const handleGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12);
  const handle = new THREE.Mesh(handleGeom, leatherMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, -0.04, 0);
  swordGroup.add(handle);

  // Position sword in hand
  swordGroup.position.set(0.16, -0.03, 0.04);
  swordGroup.rotation.z = -0.8;
  swordGroup.rotation.y = 0.5;
  root.add(swordGroup);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.09, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.set(0, 0.21, 0.0);
  head.scale.set(1, 1.1, 1); // Slightly oval
  root.add(head);

  // Nose
  const noseGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, 0.20, 0.085);
  nose.scale.set(1, 1, 1.5);
  root.add(nose);

  // Eyes (Simple dots)
  const eyeGeom = new THREE.SphereGeometry(0.006, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(-0.035, 0.215, 0.08);
  root.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(0.035, 0.215, 0.08);
  root.add(rightEye);

  // Cheeks (Rosy)
  const cheekGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const leftCheek = new THREE.Mesh(cheekGeom, new THREE.MeshStandardMaterial({color: 0xffaaaa, roughness: 0.8}));
  leftCheek.position.set(-0.06, 0.19, 0.06);
  leftCheek.scale.set(1, 0.6, 0.5);
  root.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeom, new THREE.MeshStandardMaterial({color: 0xffaaaa, roughness: 0.8}));
  rightCheek.position.set(0.06, 0.19, 0.06);
  rightCheek.scale.set(1, 0.6, 0.5);
  root.add(rightCheek);

  // Mouth
  const mouthGeom = new THREE.TorusGeometry(0.015, 0.003, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, new THREE.MeshStandardMaterial({color: 0xaa5555}));
  mouth.position.set(0, 0.185, 0.082);
  mouth.rotation.x = Math.PI;
  root.add(mouth);

  // Ears
  const earGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-0.09, 0.21, 0.0);
  leftEar.scale.set(0.6, 1.2, 0.6);
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(0.09, 0.21, 0.0);
  rightEar.scale.set(0.6, 1.2, 0.6);
  root.add(rightEar);

  // --- Helmet ---
  // Dome
  const helmetDomeGeom = new THREE.SphereGeometry(0.105, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const helmetDome = new THREE.Mesh(helmetDomeGeom, uniformMat);
  helmetDome.position.set(0, 0.215, 0.0);
  root.add(helmetDome);

  // Brim (Torus section or Lathe) - Using Torus for simplicity
  const brimGeom = new THREE.TorusGeometry(0.115, 0.015, 16, 32);
  const brim = new THREE.Mesh(brimGeom, uniformMat);
  brim.position.set(0, 0.195, 0.0);
  brim.rotation.x = Math.PI / 2;
  brim.scale.set(1.1, 1.1, 1.1); // Flare out
  root.add(brim);

  // Helmet Badge
  const badgeGeom = new THREE.CircleGeometry(0.018, 16);
  const badge = new THREE.Mesh(badgeGeom, goldMat);
  badge.position.set(0, 0.24, 0.095);
  badge.rotation.y = -0.2; // Slight tilt to follow head curve roughly
  root.add(badge);

  // Chin Strap
  const strapPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.18, 0.05),
    new THREE.Vector3(-0.07, 0.16, 0.0),
    new THREE.Vector3(-0.06, 0.15, -0.05),
    new THREE.Vector3(0.06, 0.15, -0.05),
    new THREE.Vector3(0.07, 0.16, 0.0),
    new THREE.Vector3(0.06, 0.18, 0.05)
  ]);
  const chinStrapGeom = new THREE.TubeGeometry(strapPath, 20, 0.004, 8, false);
  const chinStrap = new THREE.Mesh(chinStrapGeom, blackMat);
  root.add(chinStrap);

  // --- Sleeve Patches ---
  // Left Sleeve Patch (Red/White stripes)
  const patchGeom = new THREE.BoxGeometry(0.002, 0.025, 0.015);
  const patch1 = new THREE.Mesh(patchGeom, redMat);
  patch1.position.set(-0.11, 0.12, 0.05);
  patch1.rotation.z = 0.15;
  root.add(patch1);
  
  const patch2 = new THREE.Mesh(patchGeom, whiteMat);
  patch2.position.set(-0.11, 0.11, 0.052);
  patch2.rotation.z = 0.15;
  root.add(patch2);

  const patch3 = new THREE.Mesh(patchGeom, redMat);
  patch3.position.set(-0.11, 0.10, 0.054);
  patch3.rotation.z = 0.15;
  root.add(patch3);

  // Right Sleeve Patch
  const rPatch1 = new THREE.Mesh(patchGeom, redMat);
  rPatch1.position.set(0.11, 0.12, 0.05);
  rPatch1.rotation.z = -0.4;
  rPatch1.rotation.x = 0.2;
  root.add(rPatch1);

  const rPatch2 = new THREE.Mesh(patchGeom, whiteMat);
  rPatch2.position.set(0.11, 0.11, 0.052);
  rPatch2.rotation.z = -0.4;
  rPatch2.rotation.x = 0.2;
  root.add(rPatch2);

  const rPatch3 = new THREE.Mesh(patchGeom, redMat);
  rPatch3.position.set(0.11, 0.10, 0.054);
  rPatch3.rotation.z = -0.4;
  rPatch3.rotation.x = 0.2;
  root.add(rPatch3);

  // --- Buttons on Torso ---
  const buttonGeom = new THREE.SphereGeometry(0.004, 8, 8);
  const b1 = new THREE.Mesh(buttonGeom, goldMat);
  b1.position.set(-0.02, 0.12, 0.055);
  root.add(b1);
  const b2 = new THREE.Mesh(buttonGeom, goldMat);
  b2.position.set(0.02, 0.12, 0.055);
  root.add(b2);
  const b3 = new THREE.Mesh(buttonGeom, goldMat);
  b3.position.set(-0.02, 0.06, 0.055);
  root.add(b3);
  const b4 = new THREE.Mesh(buttonGeom, goldMat);
  b4.position.set(0.02, 0.06, 0.055);
  root.add(b4);

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