export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: 0.4, metalness: 0.0 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.6, metalness: 0.0 });
  const beardMat = new THREE.MeshStandardMaterial({ color: 0x6a5acd, roughness: 0.8, metalness: 0.0 }); // SlateBlue/Purple
  const tunicMat = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, roughness: 0.5, metalness: 0.0 }); // SeaGreen
  const sackMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.5, metalness: 0.0 }); // ForestGreen
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff6347, roughness: 0.5, metalness: 0.0 }); // Tomato
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.0 });
  const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.0 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.0 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x4682b4, roughness: 0.6, metalness: 0.0 }); // SteelBlue

  // --- Torso (Green Tunic Body) ---
  // Bulbous body, wider than tall
  const torsoGeom = new THREE.SphereGeometry(0.28, 32, 32);
  const torso = new THREE.Mesh(torsoGeom, tunicMat);
  torso.scale.set(1.1, 0.9, 0.9); // Slightly wider
  torso.position.y = -0.05;
  root.add(torso);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.13, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.set(0, 0.18, 0.05); // Slightly forward
  root.add(head);

  // --- Hat ---
  // Cone part
  const hatConeGeom = new THREE.CylinderGeometry(0.01, 0.14, 0.35, 32);
  const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
  hatCone.position.set(0, 0.38, 0.02);
  hatCone.rotation.z = -0.1; // Slight tilt
  root.add(hatCone);

  // Brim part (Torus or flattened cylinder)
  const hatBrimGeom = new THREE.TorusGeometry(0.15, 0.025, 16, 32);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.set(0, 0.22, 0.04);
  hatBrim.rotation.z = -0.1; // Match tilt
  root.add(hatBrim);

  // --- Nose ---
  const noseGeom = new THREE.SphereGeometry(0.045, 32, 32);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, 0.19, 0.24);
  nose.scale.set(1.0, 0.8, 1.2); // Bulbous
  root.add(nose);

  // --- Eyes ---
  const eyeGeom = new THREE.SphereGeometry(0.018, 16, 16);
  
  // Left Eye
  const eyeL = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  eyeL.position.set(-0.045, 0.21, 0.21);
  root.add(eyeL);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), eyeBlackMat);
  pupilL.position.set(-0.042, 0.21, 0.225);
  root.add(pupilL);

  // Right Eye
  const eyeR = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  eyeR.position.set(0.045, 0.21, 0.21);
  root.add(eyeR);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), eyeBlackMat);
  pupilR.position.set(0.042, 0.21, 0.225);
  root.add(pupilR);

  // --- Eyebrows ---
  // Curved tubes or small boxes
  const browGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8);
  const browL = new THREE.Mesh(browGeom, browMat);
  browL.position.set(-0.045, 0.24, 0.19);
  browL.rotation.z = 0.3;
  browL.rotation.x = -0.2;
  root.add(browL);

  const browR = new THREE.Mesh(browGeom, browMat);
  browR.position.set(0.045, 0.24, 0.19);
  browR.rotation.z = -0.3;
  browR.rotation.x = -0.2;
  root.add(browR);

  // --- Beard ---
  // Main mass: A cone-like shape hanging down, rotated
  const beardGeom = new THREE.CylinderGeometry(0.02, 0.12, 0.25, 32);
  const beard = new THREE.Mesh(beardGeom, beardMat);
  beard.position.set(0, 0.05, 0.18);
  beard.rotation.x = -0.4; // Angle down
  beard.scale.set(1.2, 1.0, 0.8);
  root.add(beard);

  // Beard detail (mustache area / sides) - Sphere to fill cheeks
  const beardSideGeom = new THREE.SphereGeometry(0.08, 32, 32);
  const beardSide = new THREE.Mesh(beardSideGeom, beardMat);
  beardSide.position.set(0, 0.15, 0.16);
  beardSide.scale.set(1.4, 0.8, 0.6);
  root.add(beardSide);

  // --- Arms / Hands ---
  // Short stubby arms
  const armGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16);
  
  // Left Arm
  const armL = new THREE.Mesh(armGeom, tunicMat);
  armL.position.set(-0.22, 0.0, 0.05);
  armL.rotation.z = 0.5;
  root.add(armL);
  
  // Left Hand
  const handGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const handL = new THREE.Mesh(handGeom, skinMat);
  handL.position.set(-0.28, -0.05, 0.08);
  root.add(handL);

  // Right Arm
  const armR = new THREE.Mesh(armGeom, tunicMat);
  armR.position.set(0.22, 0.0, 0.05);
  armR.rotation.z = -0.5;
  root.add(armR);

  // Right Hand
  const handR = new THREE.Mesh(handGeom, skinMat);
  handR.position.set(0.28, -0.05, 0.08);
  root.add(handR);

  // --- Sack (Backpack) ---
  const sackGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const sack = new THREE.Mesh(sackGeom, sackMat);
  sack.position.set(0, 0.0, -0.25);
  sack.scale.set(1.0, 1.1, 0.9);
  root.add(sack);

  // --- Feet ---
  const footGeom = new THREE.BoxGeometry(0.08, 0.04, 0.12);
  
  const footL = new THREE.Mesh(footGeom, shoeMat);
  footL.position.set(-0.12, -0.25, 0.05);
  footL.rotation.y = 0.2;
  root.add(footL);

  const footR = new THREE.Mesh(footGeom, shoeMat);
  footR.position.set(0.12, -0.25, 0.05);
  footR.rotation.y = -0.2;
  root.add(footR);

  // --- Ears ---
  const earGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const earL = new THREE.Mesh(earGeom, skinMat);
  earL.position.set(-0.13, 0.18, 0.0);
  earL.scale.set(0.6, 1.2, 0.8);
  root.add(earL);

  const earR = new THREE.Mesh(earGeom, skinMat);
  earR.position.set(0.13, 0.18, 0.0);
  earR.scale.set(0.6, 1.2, 0.8);
  root.add(earR);

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