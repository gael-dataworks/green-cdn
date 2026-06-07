export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive Drab Uniform
  const uniformMat = new THREE.MeshStandardMaterial({
    color: 0x556b45,
    roughness: 0.7,
    metalness: 0.0,
  });
  // Slightly darker green for helmet (painted metal look)
  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0x4a5f3d,
    roughness: 0.4,
    metalness: 0.1,
  });
  // Skin
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf0c8a0,
    roughness: 0.6,
    metalness: 0.0,
  });
  // Black Boots / Chinstrap
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.1,
  });
  // Brown Belt / Straps / Sword Hilt
  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.6,
    metalness: 0.0,
  });
  // Steel Sword Blade / Buckle
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    roughness: 0.3,
    metalness: 0.5,
  });
  // Gold Badge
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.6,
  });
  // Red Patch
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xaa3333,
    roughness: 0.6,
    metalness: 0.0,
  });

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32);
  const base = new THREE.Mesh(baseGeom, blackMat);
  base.position.y = 0.025;
  root.add(base);

  // --- Legs & Boots ---
  // Breeches (baggy trousers)
  const legGeom = new THREE.CylinderGeometry(0.11, 0.09, 0.35, 16);
  
  const left_leg = new THREE.Mesh(legGeom, uniformMat);
  left_leg.position.set(-0.12, 0.35, 0.0);
  left_leg.rotation.z = 0.05;
  root.add(left_leg);

  const right_leg = new THREE.Mesh(legGeom, uniformMat);
  right_leg.position.set(0.12, 0.35, 0.0);
  right_leg.rotation.z = -0.05;
  root.add(right_leg);

  // Boots (tall black)
  const bootGeom = new THREE.CylinderGeometry(0.09, 0.11, 0.25, 16);
  
  const left_boot = new THREE.Mesh(bootGeom, blackMat);
  left_boot.position.set(-0.12, 0.125, 0.02);
  left_boot.rotation.z = 0.05;
  root.add(left_boot);

  const right_boot = new THREE.Mesh(bootGeom, blackMat);
  right_boot.position.set(0.12, 0.125, 0.02);
  right_boot.rotation.z = -0.05;
  root.add(right_boot);

  // --- Torso ---
  // Main tunic body (tapered box)
  const torsoGeom = new THREE.BoxGeometry(0.45, 0.55, 0.30);
  const torso = new THREE.Mesh(torsoGeom, uniformMat);
  torso.position.set(0, 0.75, 0);
  // Taper the torso slightly
  torso.scale.set(1, 1, 0.9); 
  root.add(torso);

  // Belt
  const beltGeom = new THREE.TorusGeometry(0.23, 0.025, 8, 24);
  const belt = new THREE.Mesh(beltGeom, brownMat);
  belt.rotation.x = Math.PI / 2;
  belt.position.set(0, 0.55, 0);
  belt.scale.set(1.1, 1, 1); // Ovalize slightly
  root.add(belt);

  // Buckle
  const buckleGeom = new THREE.BoxGeometry(0.08, 0.06, 0.02);
  const buckle = new THREE.Mesh(buckleGeom, steelMat);
  buckle.position.set(0, 0.55, 0.16);
  root.add(buckle);

  // Shoulder Strap (Sam Browne style - diagonal)
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0.95, -0.10), // Left shoulder
    new THREE.Vector3(0.15, 0.55, 0.15),   // Right hip
  ]);
  const strapGeom = new THREE.TubeGeometry(strapCurve, 10, 0.025, 8, false);
  const strap = new THREE.Mesh(strapGeom, brownMat);
  root.add(strap);

  // Chest Ribbons (small rectangles)
  const ribbonGeom = new THREE.BoxGeometry(0.12, 0.03, 0.01);
  const ribbons = new THREE.Mesh(ribbonGeom, redMat);
  ribbons.position.set(-0.08, 0.85, 0.16);
  root.add(ribbons);

  // Sleeve Patch (Left arm)
  const patchGeom = new THREE.BoxGeometry(0.04, 0.06, 0.01);
  const patch = new THREE.Mesh(patchGeom, redMat);
  patch.position.set(-0.24, 0.75, 0.05);
  patch.rotation.z = 0.2;
  root.add(patch);

  // --- Arms ---
  const armGeom = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 12);
  
  // Left Arm (down by side)
  const left_arm = new THREE.Mesh(armGeom, skinMat);
  left_arm.position.set(-0.26, 0.75, 0.0);
  left_arm.rotation.z = 0.15;
  root.add(left_arm);
  
  const left_hand_geom = new THREE.SphereGeometry(0.06, 12, 12);
  const left_hand = new THREE.Mesh(left_hand_geom, skinMat);
  left_hand.position.set(-0.27, 0.58, 0.02);
  left_hand.scale.set(1, 1.2, 1);
  root.add(left_hand);

  // Right Arm (raised holding sword)
  const right_arm = new THREE.Mesh(armGeom, skinMat);
  right_arm.position.set(0.26, 0.75, 0.0);
  right_arm.rotation.z = -0.4; // Angled up
  right_arm.rotation.x = -0.2; // Slightly forward
  root.add(right_arm);

  const right_hand_geom = new THREE.BoxGeometry(0.08, 0.08, 0.10);
  const right_hand = new THREE.Mesh(right_hand_geom, skinMat);
  right_hand.position.set(0.32, 0.95, 0.05);
  right_hand.rotation.x = 0.3;
  right_hand.rotation.z = -0.4;
  root.add(right_hand);

  // --- Head ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, 0);
  root.add(headGroup);

  // Neck
  const neckGeom = new THREE.CylinderGeometry(0.08, 0.09, 0.08, 12);
  const neck = new THREE.Mesh(neckGeom, skinMat);
  neck.position.y = -0.04;
  headGroup.add(neck);

  // Face/Cranium (Sphere)
  const headGeom = new THREE.SphereGeometry(0.22, 24, 24);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.scale.set(1, 1.05, 1.1); // Slightly elongated
  headGroup.add(head);

  // Nose
  const noseGeom = new THREE.ConeGeometry(0.025, 0.05, 8);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.02, 0.23);
  headGroup.add(nose);

  // Eyes (simple dots)
  const eyeGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const left_eye = new THREE.Mesh(eyeGeom, blackMat);
  left_eye.position.set(-0.08, 0.05, 0.21);
  headGroup.add(left_eye);
  
  const right_eye = new THREE.Mesh(eyeGeom, blackMat);
  right_eye.position.set(0.08, 0.05, 0.21);
  headGroup.add(right_eye);

  // Cheeks (rosy)
  const cheekGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const left_cheek = new THREE.Mesh(cheekGeom, new THREE.MeshStandardMaterial({color: 0xffaaaa, roughness: 0.8}));
  left_cheek.position.set(-0.12, -0.02, 0.20);
  left_cheek.scale.set(1, 0.6, 0.5);
  headGroup.add(left_cheek);

  const right_cheek = new THREE.Mesh(cheekGeom, new THREE.MeshStandardMaterial({color: 0xffaaaa, roughness: 0.8}));
  right_cheek.position.set(0.12, -0.02, 0.20);
  right_cheek.scale.set(1, 0.6, 0.5);
  headGroup.add(right_cheek);

  // Mouth
  const mouthGeom = new THREE.TorusGeometry(0.02, 0.005, 8, 16, Math.PI);
  const mouth = new THREE.Mesh(mouthGeom, new THREE.MeshStandardMaterial({color: 0x884444}));
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.set(0, -0.08, 0.22);
  headGroup.add(mouth);

  // Ear
  const earGeom = new THREE.SphereGeometry(0.025, 8, 8);
  const ear = new THREE.Mesh(earGeom, skinMat);
  ear.position.set(-0.22, 0.0, 0.0);
  ear.scale.set(0.5, 1.2, 1);
  headGroup.add(ear);

  // Helmet (Dome)
  const helmetDomeGeom = new THREE.SphereGeometry(0.24, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const helmet_dome = new THREE.Mesh(helmetDomeGeom, helmetMat);
  helmet_dome.position.y = 0.02;
  helmet_dome.scale.set(1.05, 0.9, 1.15);
  headGroup.add(helmet_dome);

  // Helmet Brim
  const brimGeom = new THREE.TorusGeometry(0.25, 0.025, 8, 32);
  const helmet_brim = new THREE.Mesh(brimGeom, helmetMat);
  helmet_brim.rotation.x = Math.PI / 2;
  helmet_brim.position.y = -0.05;
  helmet_brim.scale.set(1.1, 1, 1.2);
  headGroup.add(helmet_brim);

  // Helmet Badge
  const badgeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
  const badge = new THREE.Mesh(badgeGeom, goldMat);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 0.12, 0.24);
  headGroup.add(badge);

  // Chinstrap
  const strapPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, -0.10, 0.10),
    new THREE.Vector3(-0.18, -0.18, 0.0),
    new THREE.Vector3(0, -0.20, -0.10),
    new THREE.Vector3(0.18, -0.18, 0.0),
    new THREE.Vector3(0.15, -0.10, 0.10),
  ]);
  const chinstrapGeom = new THREE.TubeGeometry(strapPath, 20, 0.015, 8, false);
  const chinstrap = new THREE.Mesh(chinstrapGeom, blackMat);
  headGroup.add(chinstrap);

  // --- Sword ---
  const swordGroup = new THREE.Group();
  // Position sword relative to right hand
  swordGroup.position.set(0.32, 0.95, 0.05);
  swordGroup.rotation.x = 0.3;
  swordGroup.rotation.z = -0.4;
  swordGroup.rotation.y = -0.2;
  root.add(swordGroup);

  // Blade (Tapered Box)
  const bladeGeom = new THREE.BoxGeometry(0.06, 0.60, 0.01);
  const sword_blade = new THREE.Mesh(bladeGeom, steelMat);
  sword_blade.position.y = 0.35;
  sword_blade.scale.set(1, 1, 0.6); // Taper tip
  swordGroup.add(sword_blade);

  // Guard (Crosspiece)
  const guardGeom = new THREE.BoxGeometry(0.15, 0.03, 0.04);
  const sword_guard = new THREE.Mesh(guardGeom, steelMat);
  sword_guard.position.y = 0.05;
  swordGroup.add(sword_guard);

  // Hilt (Handle)
  const hiltGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12);
  const sword_hilt = new THREE.Mesh(hiltGeom, brownMat);
  sword_hilt.rotation.x = Math.PI / 2;
  sword_hilt.position.y = -0.03;
  swordGroup.add(sword_hilt);

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