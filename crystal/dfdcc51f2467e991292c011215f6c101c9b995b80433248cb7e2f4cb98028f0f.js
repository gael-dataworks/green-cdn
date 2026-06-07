export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Using standard materials with appropriate roughness for a painted figurine look.
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, metalness: 0.0, roughness: 0.4 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd92b2b, metalness: 0.0, roughness: 0.3 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x2e8b2e, metalness: 0.0, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b5a9e, metalness: 0.0, roughness: 0.5 });
  const beardMat = new THREE.MeshStandardMaterial({ color: 0x6a5acd, metalness: 0.0, roughness: 0.6 }); // SlateBlue/Purple
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.2 });
  const sackMat = new THREE.MeshStandardMaterial({ color: 0x3cb33c, metalness: 0.0, roughness: 0.6 });
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff8c42, metalness: 0.0, roughness: 0.3 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.1 });
  const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.0, roughness: 0.1 });
  const eyebrowMat = new THREE.MeshStandardMaterial({ color: 0x4682b4, metalness: 0.0, roughness: 0.5 });
  const mustacheMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.0, roughness: 0.5 });

  // --- Body ---
  // Torso: Green jacket, egg-shaped
  const bodyGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const body = new THREE.Mesh(bodyGeom, jacketMat);
  body.scale.set(1.1, 1.0, 0.9); // Slightly wider, flatter back for sack
  body.position.y = -0.15;
  root.add(body);

  // Pants: Blue lower section
  const pantsGeom = new THREE.SphereGeometry(0.22, 32, 32);
  const pants = new THREE.Mesh(pantsGeom, pantsMat);
  pants.scale.set(1.05, 0.6, 0.9);
  pants.position.y = -0.32;
  // Clip top half to merge with jacket visually or just overlap
  pantsGeom.translate(0, -0.1, 0); 
  root.add(pants);

  // Shoes: Black, pointed
  const shoeGeom = new THREE.CapsuleGeometry(0.06, 0.12, 4, 8);
  const shoeLeft = new THREE.Mesh(shoeGeom, shoeMat);
  shoeLeft.position.set(-0.08, -0.48, 0.05);
  shoeLeft.rotation.z = Math.PI / 2;
  shoeLeft.rotation.y = -0.2;
  root.add(shoeLeft);

  const shoeRight = new THREE.Mesh(shoeGeom, shoeMat);
  shoeRight.position.set(0.08, -0.48, 0.05);
  shoeRight.rotation.z = Math.PI / 2;
  shoeRight.rotation.y = 0.2;
  root.add(shoeRight);

  // --- Sack ---
  // Large green sphere on the back
  const sackGeom = new THREE.SphereGeometry(0.24, 32, 32);
  const sack = new THREE.Mesh(sackGeom, sackMat);
  sack.position.set(0, -0.1, -0.25);
  sack.scale.set(1.0, 0.9, 1.1);
  root.add(sack);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(0.16, 32, 32);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = 0.18;
  root.add(head);

  // Ears
  const earGeom = new THREE.SphereGeometry(0.04, 16, 16);
  const earLeft = new THREE.Mesh(earGeom, skinMat);
  earLeft.position.set(-0.15, 0.18, 0);
  earLeft.scale.set(0.6, 1.2, 0.8);
  root.add(earLeft);

  const earRight = new THREE.Mesh(earGeom, skinMat);
  earRight.position.set(0.15, 0.18, 0);
  earRight.scale.set(0.6, 1.2, 0.8);
  root.add(earRight);

  // Nose: Bulbous orange
  const noseGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, 0.16, 0.13);
  nose.scale.set(1.2, 1.0, 1.0);
  root.add(nose);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const pupilGeom = new THREE.SphereGeometry(0.012, 8, 8);

  const eyeLeft = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  eyeLeft.position.set(-0.05, 0.22, 0.135);
  root.add(eyeLeft);
  const pupilLeft = new THREE.Mesh(pupilGeom, eyePupilMat);
  pupilLeft.position.set(-0.04, 0.22, 0.155);
  root.add(pupilLeft);

  const eyeRight = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  eyeRight.position.set(0.05, 0.22, 0.135);
  root.add(eyeRight);
  const pupilRight = new THREE.Mesh(pupilGeom, eyePupilMat);
  pupilRight.position.set(0.06, 0.22, 0.155);
  root.add(pupilRight);

  // Eyebrows: Blueish, bushy
  const browGeom = new THREE.CapsuleGeometry(0.015, 0.06, 4, 8);
  const browLeft = new THREE.Mesh(browGeom, eyebrowMat);
  browLeft.position.set(-0.05, 0.26, 0.12);
  browLeft.rotation.z = -0.3;
  browLeft.rotation.y = 0.2;
  root.add(browLeft);

  const browRight = new THREE.Mesh(browGeom, eyebrowMat);
  browRight.position.set(0.05, 0.26, 0.12);
  browRight.rotation.z = 0.3;
  browRight.rotation.y = -0.2;
  root.add(browRight);

  // Mustache: Grey/White, connects to beard
  const mustacheGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI);
  const mustache = new THREE.Mesh(mustacheGeom, mustacheMat);
  mustache.position.set(0, 0.14, 0.145);
  mustache.rotation.x = Math.PI / 2;
  mustache.rotation.y = -Math.PI / 2;
  mustache.scale.set(1.2, 1.0, 0.8);
  root.add(mustache);

  // Beard: Large purple mass
  // Constructed from a main sphere and some side bulges for volume
  const beardMainGeom = new THREE.SphereGeometry(0.11, 32, 32);
  const beardMain = new THREE.Mesh(beardMainGeom, beardMat);
  beardMain.position.set(0, 0.05, 0.08);
  beardMain.scale.set(1.0, 1.3, 0.9);
  root.add(beardMain);

  const beardSideGeom = new THREE.SphereGeometry(0.08, 32, 32);
  const beardLeft = new THREE.Mesh(beardSideGeom, beardMat);
  beardLeft.position.set(-0.09, 0.08, 0.05);
  beardLeft.scale.set(0.8, 1.2, 0.8);
  beardLeft.rotation.z = 0.2;
  root.add(beardLeft);

  const beardRight = new THREE.Mesh(beardSideGeom, beardMat);
  beardRight.position.set(0.09, 0.08, 0.05);
  beardRight.scale.set(0.8, 1.2, 0.8);
  beardRight.rotation.z = -0.2;
  root.add(beardRight);
  
  // Beard tip
  const beardTipGeom = new THREE.SphereGeometry(0.07, 32, 32);
  const beardTip = new THREE.Mesh(beardTipGeom, beardMat);
  beardTip.position.set(0, -0.08, 0.1);
  beardTip.scale.set(0.9, 1.2, 0.8);
  root.add(beardTip);

  // --- Hat ---
  // Brim
  const hatBrimGeom = new THREE.TorusGeometry(0.18, 0.025, 16, 32);
  const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.y = 0.32;
  // Flatten the torus slightly to look like a brim
  hatBrim.scale.set(1.0, 1.0, 0.4); 
  root.add(hatBrim);

  // Cone top
  const hatConeGeom = new THREE.ConeGeometry(0.17, 0.25, 32);
  const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
  hatCone.position.y = 0.42;
  // Tilt the hat slightly back
  hatCone.rotation.z = -0.1;
  root.add(hatCone);

  // --- Arms ---
  // Short green sleeves
  const armGeom = new THREE.CapsuleGeometry(0.055, 0.12, 4, 8);
  
  const armLeft = new THREE.Mesh(armGeom, jacketMat);
  armLeft.position.set(-0.22, -0.05, 0.05);
  armLeft.rotation.z = 0.5;
  armLeft.rotation.y = 0.2;
  root.add(armLeft);

  const armRight = new THREE.Mesh(armGeom, jacketMat);
  armRight.position.set(0.22, -0.05, 0.05);
  armRight.rotation.z = -0.5;
  armRight.rotation.y = -0.2;
  root.add(armRight);

  // Hands (skin tone) peeking out
  const handGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const handLeft = new THREE.Mesh(handGeom, skinMat);
  handLeft.position.set(-0.26, -0.15, 0.08);
  handLeft.scale.set(1.0, 0.8, 1.0);
  root.add(handLeft);

  const handRight = new THREE.Mesh(handGeom, skinMat);
  handRight.position.set(0.26, -0.15, 0.08);
  handRight.scale.set(1.0, 0.8, 1.0);
  root.add(handRight);

  // --- Details ---
  // Button on jacket
  const buttonGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const button = new THREE.Mesh(buttonGeom, new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.5, roughness: 0.2}));
  button.position.set(-0.1, -0.1, 0.18);
  root.add(button);

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