export default function generate(THREE) {
  // Materials
  const uniformGreenMat = new THREE.MeshStandardMaterial({ color: 0x4a6b4a, roughness: 0.6, metalness: 0.1 });
  const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x2f452f, roughness: 0.6, metalness: 0.1 });
  const fleshMat = new THREE.MeshStandardMaterial({ color: 0xe0ac88, roughness: 0.5, metalness: 0.0 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.2 });
  const brownMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.5, metalness: 0.1 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.3, metalness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.6 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xaa3333, roughness: 0.6, metalness: 0.1 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });

  const root = new THREE.Group();

  // --- Head Group ---
  const headGroup = new THREE.Group();
  
  // Helmet Dome
  const helmetDomeGeom = new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const helmetDome = new THREE.Mesh(helmetDomeGeom, uniformGreenMat);
  helmetDome.position.y = 0.13;
  headGroup.add(helmetDome);

  // Helmet Brim
  const helmetBrimGeom = new THREE.TorusGeometry(0.135, 0.025, 16, 32);
  const helmetBrim = new THREE.Mesh(helmetBrimGeom, uniformGreenMat);
  helmetBrim.rotation.x = Math.PI / 2;
  helmetBrim.position.y = 0.02;
  headGroup.add(helmetBrim);

  // Helmet Insignia (Gold emblem on front)
  const insigniaGeom = new THREE.CircleGeometry(0.03, 16);
  const insignia = new THREE.Mesh(insigniaGeom, goldMat);
  insignia.position.set(0, 0.14, 0.125);
  insignia.rotation.y = -0.2; // Slight curve follow
  headGroup.add(insignia);

  // Face
  const faceGeom = new THREE.SphereGeometry(0.11, 32, 32);
  const face = new THREE.Mesh(faceGeom, fleshMat);
  face.position.set(0, 0.08, 0.06);
  headGroup.add(face);

  // Nose (Simple cone)
  const noseGeom = new THREE.ConeGeometry(0.015, 0.025, 8);
  const nose = new THREE.Mesh(noseGeom, fleshMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.08, 0.165);
  headGroup.add(nose);

  // Eyes (Small black spheres)
  const eyeGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(-0.035, 0.10, 0.15);
  headGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(0.035, 0.10, 0.15);
  headGroup.add(rightEye);

  // Chin Strap (Black band under chin)
  const chinStrapGeom = new THREE.TorusGeometry(0.07, 0.008, 16, 32, Math.PI);
  const chinStrap = new THREE.Mesh(chinStrapGeom, blackMat);
  chinStrap.rotation.x = Math.PI / 2;
  chinStrap.rotation.z = Math.PI / 2;
  chinStrap.position.set(0, 0.01, 0.06);
  headGroup.add(chinStrap);

  // Position Head on Body
  headGroup.position.y = 0.48;
  root.add(headGroup);

  // --- Torso ---
  // Main Tunic (Box with slight taper via scale if needed, but box is fine for stylized)
  const tunicGeom = new THREE.BoxGeometry(0.24, 0.26, 0.16);
  const tunic = new THREE.Mesh(tunicGeom, uniformGreenMat);
  tunic.position.y = 0.26;
  root.add(tunic);

  // Collar (Dark green triangles/boxes at neck)
  const collarLeftGeom = new THREE.BoxGeometry(0.06, 0.04, 0.02);
  const collarLeft = new THREE.Mesh(collarLeftGeom, darkGreenMat);
  collarLeft.position.set(-0.04, 0.39, 0.08);
  collarLeft.rotation.z = 0.3;
  root.add(collarLeft);
  
  const collarRightGeom = new THREE.BoxGeometry(0.06, 0.04, 0.02);
  const collarRight = new THREE.Mesh(collarRightGeom, darkGreenMat);
  collarRight.position.set(0.04, 0.39, 0.08);
  collarRight.rotation.z = -0.3;
  root.add(collarRight);

  // Belt (Brown band)
  const beltGeom = new THREE.BoxGeometry(0.25, 0.05, 0.17);
  const belt = new THREE.Mesh(beltGeom, brownMat);
  belt.position.y = 0.14;
  root.add(belt);

  // Belt Buckle (Silver rectangle)
  const buckleGeom = new THREE.BoxGeometry(0.06, 0.04, 0.01);
  const buckle = new THREE.Mesh(buckleGeom, silverMat);
  buckle.position.set(0, 0.14, 0.085);
  root.add(buckle);

  // Shoulder Strap (Bandolier - Brown diagonal)
  const strapGeom = new THREE.BoxGeometry(0.025, 0.35, 0.01);
  const strap = new THREE.Mesh(strapGeom, brownMat);
  strap.position.set(0.06, 0.38, 0.08);
  strap.rotation.z = -0.6;
  strap.rotation.y = -0.2;
  root.add(strap);

  // Sleeve Patches
  // Left Arm Patch (Red Shield shape - simplified as circle/box)
  const patchLeftGeom = new THREE.CircleGeometry(0.025, 16);
  const patchLeft = new THREE.Mesh(patchLeftGeom, redMat);
  patchLeft.position.set(-0.13, 0.32, 0.08);
  patchLeft.rotation.y = -0.2;
  root.add(patchLeft);

  // Right Chest Ribbons (Small colored boxes)
  const ribbonGeom = new THREE.BoxGeometry(0.04, 0.015, 0.01);
  const ribbon1 = new THREE.Mesh(ribbonGeom, redMat);
  ribbon1.position.set(0.05, 0.33, 0.08);
  root.add(ribbon1);
  const ribbon2 = new THREE.Mesh(ribbonGeom, whiteMat);
  ribbon2.position.set(0.05, 0.315, 0.08);
  root.add(ribbon2);

  // --- Arms ---
  // Right Arm (Holding Sword)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.14, 0.38, 0);
  
  const upperArmRGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16);
  const upperArmR = new THREE.Mesh(upperArmRGeom, fleshMat);
  upperArmR.position.y = -0.06;
  upperArmR.rotation.z = -0.4;
  rightArmGroup.add(upperArmR);

  const forearmRGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16);
  const forearmR = new THREE.Mesh(forearmRGeom, fleshMat);
  forearmR.position.set(0.06, -0.16, 0);
  forearmR.rotation.z = -1.2; // Bent up to hold sword
  rightArmGroup.add(forearmR);

  const handRGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const handR = new THREE.Mesh(handRGeom, fleshMat);
  handR.position.set(0.13, -0.24, 0);
  rightArmGroup.add(handR);

  root.add(rightArmGroup);

  // Left Arm (Down at side)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.14, 0.38, 0);

  const upperArmLGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16);
  const upperArmL = new THREE.Mesh(upperArmLGeom, fleshMat);
  upperArmL.position.y = -0.06;
  upperArmL.rotation.z = 0.1;
  leftArmGroup.add(upperArmL);

  const forearmLGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16);
  const forearmL = new THREE.Mesh(forearmLGeom, fleshMat);
  forearmL.position.set(-0.02, -0.16, 0.02);
  forearmL.rotation.z = 0.2;
  leftArmGroup.add(forearmL);

  const handLGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const handL = new THREE.Mesh(handLGeom, fleshMat);
  handL.position.set(-0.03, -0.24, 0.03);
  leftArmGroup.add(handL);

  root.add(leftArmGroup);

  // --- Legs ---
  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.07, 0.13, 0);

  const thighLGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16);
  const thighL = new THREE.Mesh(thighLGeom, darkGreenMat);
  thighL.position.y = -0.07;
  leftLegGroup.add(thighL);

  const bootLGeom = new THREE.BoxGeometry(0.09, 0.13, 0.13);
  const bootL = new THREE.Mesh(bootLGeom, blackMat);
  bootL.position.set(0, -0.19, 0.02);
  leftLegGroup.add(bootL);

  root.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.07, 0.13, 0);

  const thighRGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16);
  const thighR = new THREE.Mesh(thighRGeom, darkGreenMat);
  thighR.position.y = -0.07;
  rightLegGroup.add(thighR);

  const bootRGeom = new THREE.BoxGeometry(0.09, 0.13, 0.13);
  const bootR = new THREE.Mesh(bootRGeom, blackMat);
  bootR.position.set(0, -0.19, 0.02);
  rightLegGroup.add(bootR);

  root.add(rightLegGroup);

  // --- Sword ---
  const swordGroup = new THREE.Group();
  // Attach sword to right hand group so it moves with the arm pose
  // Hand is at local (0.13, -0.24, 0) in rightArmGroup
  swordGroup.position.set(0.13, -0.24, 0);
  swordGroup.rotation.z = -0.9; // Angled up
  swordGroup.rotation.y = 0.5;
  rightArmGroup.add(swordGroup);

  const bladeGeom = new THREE.BoxGeometry(0.04, 0.28, 0.005);
  const blade = new THREE.Mesh(bladeGeom, silverMat);
  blade.position.y = 0.16;
  swordGroup.add(blade);

  const guardGeom = new THREE.BoxGeometry(0.08, 0.015, 0.025);
  const guard = new THREE.Mesh(guardGeom, silverMat);
  guard.position.y = 0.03;
  swordGroup.add(guard);

  const hiltGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 16);
  const hilt = new THREE.Mesh(hiltGeom, brownMat);
  hilt.position.y = -0.04;
  hilt.rotation.x = Math.PI / 2;
  swordGroup.add(hilt);

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