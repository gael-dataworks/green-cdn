export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Toy plastic/rubber aesthetic: low metalness, moderate roughness.
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5d0b0,
    metalness: 0.0,
    roughness: 0.6,
  });

  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x3a5f3a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x2f4f2f,
    metalness: 0.0,
    roughness: 0.5,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.4,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.0,
    roughness: 0.6,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.5,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.4,
    roughness: 0.3,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Helper Functions ---
  function addMesh(geom, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -0.48;
  root.add(base);

  // --- Legs & Boots ---
  // Legs are green trousers, boots are black.
  const legGeom = new THREE.CylinderGeometry(0.055, 0.065, 0.18, 16);
  const leftLeg = new THREE.Mesh(legGeom, uniformMat);
  leftLeg.position.set(-0.06, -0.32, 0);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, uniformMat);
  rightLeg.position.set(0.06, -0.32, 0);
  root.add(rightLeg);

  const bootGeom = new THREE.BoxGeometry(0.08, 0.12, 0.14);
  // Round the boots slightly by scaling or just using boxes for toy look
  const leftBoot = new THREE.Mesh(bootGeom, bootMat);
  leftBoot.position.set(-0.06, -0.44, 0.02);
  root.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeom, bootMat);
  rightBoot.position.set(0.06, -0.44, 0.02);
  root.add(rightBoot);

  // --- Torso / Jacket ---
  // Tapered cylinder for jacket
  const jacketGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.28, 16);
  const jacket = new THREE.Mesh(jacketGeom, uniformMat);
  jacket.position.set(0, -0.12, 0);
  root.add(jacket);

  // Belt
  const beltGeom = new THREE.CylinderGeometry(0.125, 0.125, 0.04, 16);
  const belt = new THREE.Mesh(beltGeom, beltMat);
  belt.position.set(0, -0.24, 0);
  root.add(belt);

  // Belt Buckle
  const buckleGeom = new THREE.BoxGeometry(0.04, 0.03, 0.02);
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.5, roughness: 0.3 });
  const buckle = new THREE.Mesh(buckleGeom, buckleMat);
  buckle.position.set(0, -0.24, 0.13);
  root.add(buckle);

  // Shoulder Strap (Bandolier)
  // Diagonal across chest. Use a thin box or tube.
  const strapPath = new THREE.LineCurve3(
    new THREE.Vector3(-0.08, -0.05, 0.12),
    new THREE.Vector3(0.08, -0.20, -0.05)
  );
  const strapGeom = new THREE.TubeGeometry(strapPath, 4, 0.012, 8, false);
  const strap = new THREE.Mesh(strapGeom, leatherMat);
  root.add(strap);

  // Pouch on strap (small box at hip)
  const pouchGeom = new THREE.BoxGeometry(0.03, 0.04, 0.02);
  const pouch = new THREE.Mesh(pouchGeom, leatherMat);
  pouch.position.set(0.06, -0.22, -0.04);
  pouch.rotation.z = 0.5;
  root.add(pouch);

  // --- Arms ---
  const armGeom = new THREE.CylinderGeometry(0.045, 0.04, 0.14, 12);
  
  // Left Arm (hanging down)
  const leftArm = new THREE.Mesh(armGeom, skinMat);
  leftArm.position.set(-0.14, -0.10, 0);
  leftArm.rotation.z = 0.1;
  root.add(leftArm);
  
  const leftHandGeom = new THREE.SphereGeometry(0.045, 12, 12);
  const leftHand = new THREE.Mesh(leftHandGeom, skinMat);
  leftHand.position.set(-0.15, -0.23, 0);
  root.add(leftHand);

  // Right Arm (holding sword forward)
  // Needs to be bent. Use two segments or a rotated cylinder.
  const rightUpperArm = new THREE.Mesh(armGeom, skinMat);
  rightUpperArm.position.set(0.14, -0.10, 0.05);
  rightUpperArm.rotation.z = -0.3;
  rightUpperArm.rotation.x = -0.5; // Forward
  root.add(rightUpperArm);

  const rightForeArmGeom = new THREE.CylinderGeometry(0.04, 0.035, 0.12, 12);
  const rightForeArm = new THREE.Mesh(rightForeArmGeom, skinMat);
  rightForeArm.position.set(0.18, -0.18, 0.12);
  rightForeArm.rotation.x = -1.2; // Bent up to hold sword
  root.add(rightForeArm);

  const rightHandGeom = new THREE.BoxGeometry(0.05, 0.05, 0.06);
  const rightHand = new THREE.Mesh(rightHandGeom, skinMat);
  rightHand.position.set(0.18, -0.26, 0.18);
  rightHand.rotation.x = -0.5;
  root.add(rightHand);

  // --- Sword ---
  // Held in right hand, pointing forward-up.
  const swordGroup = new THREE.Group();
  
  // Blade
  const bladeGeom = new THREE.BoxGeometry(0.03, 0.25, 0.005);
  const blade = new THREE.Mesh(bladeGeom, steelMat);
  blade.position.set(0, 0.12, 0);
  swordGroup.add(blade);

  // Guard
  const guardGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
  const guard = new THREE.Mesh(guardGeom, steelMat);
  guard.rotation.x = Math.PI / 2;
  guard.position.set(0, 0, 0);
  swordGroup.add(guard);

  // Hilt
  const hiltGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8);
  const hilt = new THREE.Mesh(hiltGeom, leatherMat);
  hilt.rotation.x = Math.PI / 2;
  hilt.position.set(0, -0.04, 0);
  swordGroup.add(hilt);

  // Position sword in hand
  swordGroup.position.set(0.18, -0.26, 0.20);
  swordGroup.rotation.x = -0.8; // Angle up
  swordGroup.rotation.z = -0.2;
  root.add(swordGroup);

  // --- Scabbard ---
  // On left hip, angled back.
  const scabbardGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
  const scabbard = new THREE.Mesh(scabbardGeom, leatherMat);
  scabbard.position.set(-0.10, -0.20, -0.08);
  scabbard.rotation.x = 0.8;
  scabbard.rotation.z = 0.2;
  root.add(scabbard);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.11, 24, 24);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.set(0, 0.18, 0);
  root.add(head);

  // Nose
  const noseGeom = new THREE.ConeGeometry(0.015, 0.025, 8);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, 0.17, 0.105);
  nose.rotation.x = Math.PI / 2;
  root.add(nose);

  // Eyes (simple black dots/spheres)
  const eyeGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.03, 0.19, 0.095);
  root.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.03, 0.19, 0.095);
  root.add(rightEye);

  // Blush (small pink spheres)
  const blushGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const blushMat = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 1.0 });
  const leftBlush = new THREE.Mesh(blushGeom, blushMat);
  leftBlush.position.set(-0.05, 0.16, 0.08);
  root.add(leftBlush);
  
  const rightBlush = new THREE.Mesh(blushGeom, blushMat);
  rightBlush.position.set(0.05, 0.16, 0.08);
  root.add(rightBlush);

  // Ears
  const earGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-0.105, 0.18, 0);
  root.add(leftEar);
  
  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(0.105, 0.18, 0);
  root.add(rightEar);

  // --- Helmet ---
  // Dome
  const helmetDomeGeom = new THREE.SphereGeometry(0.125, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const helmetDome = new THREE.Mesh(helmetDomeGeom, helmetMat);
  helmetDome.position.set(0, 0.20, 0);
  root.add(helmetDome);

  // Brim (Torus or flattened sphere slice)
  const brimGeom = new THREE.TorusGeometry(0.135, 0.015, 8, 32);
  const brim = new THREE.Mesh(brimGeom, helmetMat);
  brim.rotation.x = Math.PI / 2;
  brim.position.set(0, 0.14, 0);
  // Flatten the torus slightly to look more like a brim
  brim.scale.set(1, 0.4, 1);
  root.add(brim);

  // Chin Strap
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.14, 0.05),
    new THREE.Vector3(-0.09, 0.10, 0),
    new THREE.Vector3(0, 0.09, -0.02),
    new THREE.Vector3(0.09, 0.10, 0),
    new THREE.Vector3(0.08, 0.14, 0.05),
  ]);
  const chinStrapGeom = new THREE.TubeGeometry(strapCurve, 16, 0.008, 8, false);
  const chinStrap = new THREE.Mesh(chinStrapGeom, new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }));
  root.add(chinStrap);

  // Helmet Emblem (Side decal)
  // Small gold circle on the side of the helmet
  const emblemGeom = new THREE.CircleGeometry(0.025, 16);
  const emblemMat = new THREE.MeshStandardMaterial({ color: 0xccaa00, metalness: 0.6, roughness: 0.3 });
  const emblem = new THREE.Mesh(emblemGeom, emblemMat);
  emblem.position.set(-0.126, 0.20, 0);
  emblem.rotation.y = Math.PI / 2;
  // Slightly offset to avoid z-fighting
  emblem.position.x -= 0.001; 
  root.add(emblem);

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