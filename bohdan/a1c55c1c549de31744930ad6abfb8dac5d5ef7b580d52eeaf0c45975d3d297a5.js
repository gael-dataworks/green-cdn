export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red anodized/painted metal. Moderate metalness for shine, but not chrome.
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    metalness: 0.45,
    roughness: 0.35,
  });

  // Black polymer/plastic for grips, sights, trigger.
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.8,
  });

  // Dark metal for muzzle interior and small details.
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const slideLen = 0.65;
  const slideHeight = 0.14;
  const slideWidth = 0.11;
  const barrelLen = 0.25;
  const barrelRadius = 0.055;
  
  const gripHeight = 0.32;
  const gripWidth = 0.09;
  const gripDepth = 0.12;
  const gripAngle = -Math.PI / 9; // ~20 degrees back

  // --- Slide Assembly ---
  const slideGroup = new THREE.Group();

  // Main slide body (blocky upper receiver)
  const slideBodyGeom = new THREE.BoxGeometry(slideLen, slideHeight, slideWidth);
  const slideBody = new THREE.Mesh(slideBodyGeom, redMat);
  slideBody.position.set(-slideLen / 2 + 0.02, 0.07, 0); // Shifted slightly back
  slideGroup.add(slideBody);

  // Front barrel section (cylindrical part integrated into slide)
  const barrelGeom = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLen, 24);
  const barrel = new THREE.Mesh(barrelGeom, redMat);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(slideLen / 2 - barrelLen / 2 + 0.02, 0.07, 0);
  slideGroup.add(barrel);

  // Muzzle hole (black cylinder at front)
  const muzzleGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
  const muzzle = new THREE.Mesh(muzzleGeom, darkMetalMat);
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.set(slideLen / 2 + 0.01, 0.07, 0);
  slideGroup.add(muzzle);

  // Front sight (black block on top front)
  const frontSightGeom = new THREE.BoxGeometry(0.015, 0.025, 0.04);
  const frontSight = new THREE.Mesh(frontSightGeom, blackMat);
  frontSight.position.set(slideLen / 2 - 0.04, slideHeight + 0.012, 0);
  slideGroup.add(frontSight);

  // Rear sight (black notch on top rear)
  const rearSightGeom = new THREE.BoxGeometry(0.03, 0.025, 0.05);
  const rearSight = new THREE.Mesh(rearSightGeom, blackMat);
  rearSight.position.set(-slideLen / 2 + 0.04, slideHeight + 0.012, 0);
  slideGroup.add(rearSight);

  // Side rails (thin strips along the slide)
  const railGeom = new THREE.BoxGeometry(slideLen * 0.6, 0.015, 0.005);
  const railTop = new THREE.Mesh(railGeom, redMat);
  railTop.position.set(-slideLen * 0.15, 0.04, slideWidth / 2 + 0.002);
  slideGroup.add(railTop);
  
  const railBot = new THREE.Mesh(railGeom, redMat);
  railBot.position.set(-slideLen * 0.15, -0.04, slideWidth / 2 + 0.002);
  slideGroup.add(railBot);

  // Rear serrations (grooves on the back of the slide)
  const serrationGeom = new THREE.BoxGeometry(0.01, 0.06, 0.004);
  for (let i = 0; i < 5; i++) {
    const serration = new THREE.Mesh(serrationGeom, darkMetalMat);
    serration.position.set(-slideLen / 2 + 0.02 + i * 0.012, 0.07, slideWidth / 2 + 0.002);
    slideGroup.add(serration);
  }

  // Safety switch (small black lever on side)
  const safetyGeom = new THREE.BoxGeometry(0.025, 0.015, 0.008);
  const safety = new THREE.Mesh(safetyGeom, blackMat);
  safety.position.set(-slideLen / 2 + 0.15, 0.08, slideWidth / 2 + 0.004);
  slideGroup.add(safety);

  root.add(slideGroup);

  // --- Frame / Lower Receiver ---
  const frameGroup = new THREE.Group();

  // Trigger guard (curved loop)
  // Using a Torus segment for the guard
  const guardGeom = new THREE.TorusGeometry(0.06, 0.008, 8, 20, Math.PI);
  const triggerGuard = new THREE.Mesh(guardGeom, blackMat);
  triggerGuard.rotation.x = Math.PI / 2; // Flat in XZ
  triggerGuard.rotation.z = -Math.PI / 2; // Vertical loop
  triggerGuard.position.set(-0.05, -0.08, 0);
  frameGroup.add(triggerGuard);

  // Main frame body (under the slide, connects to grip)
  const frameBodyGeom = new THREE.BoxGeometry(0.35, 0.08, slideWidth * 0.9);
  const frameBody = new THREE.Mesh(frameBodyGeom, redMat);
  frameBody.position.set(-0.05, -0.04, 0);
  frameGroup.add(frameBody);

  // Grip (handle)
  // Angled box
  const gripGeom = new THREE.BoxGeometry(gripHeight, gripWidth, gripDepth);
  const grip = new THREE.Mesh(gripGeom, redMat);
  grip.rotation.z = gripAngle;
  // Position pivot roughly at top of grip
  grip.position.set(0.12, -0.15, 0); 
  frameGroup.add(grip);

  // Grip Panels (textured black inserts on sides)
  const panelGeom = new THREE.BoxGeometry(gripHeight * 0.7, 0.005, gripDepth * 0.8);
  const gripPanelLeft = new THREE.Mesh(panelGeom, blackMat);
  gripPanelLeft.rotation.z = gripAngle;
  gripPanelLeft.position.set(0.12, -0.15, -gripWidth / 2 - 0.002);
  frameGroup.add(gripPanelLeft);

  const gripPanelRight = new THREE.Mesh(panelGeom, blackMat);
  gripPanelRight.rotation.z = gripAngle;
  gripPanelRight.position.set(0.12, -0.15, gripWidth / 2 + 0.002);
  frameGroup.add(gripPanelRight);

  // Magazine base (bottom of grip)
  const magBaseGeom = new THREE.BoxGeometry(0.06, 0.02, gripDepth * 0.9);
  const magBase = new THREE.Mesh(magBaseGeom, blackMat);
  magBase.rotation.z = gripAngle;
  magBase.position.set(0.12 + Math.sin(-gripAngle) * (gripHeight/2 + 0.04), -0.15 + Math.cos(-gripAngle) * (gripHeight/2 + 0.04), 0);
  frameGroup.add(magBase);

  // Trigger (curved piece inside guard)
  const triggerGeom = new THREE.TorusGeometry(0.035, 0.006, 8, 10, Math.PI * 0.6);
  const trigger = new THREE.Mesh(triggerGeom, blackMat);
  trigger.rotation.x = Math.PI / 2;
  trigger.rotation.z = -Math.PI / 2 + 0.2; // Slight angle
  trigger.position.set(-0.02, -0.06, 0);
  frameGroup.add(trigger);

  // Beavertail / Rear frame extension
  const beavertailGeom = new THREE.BoxGeometry(0.08, 0.06, slideWidth * 0.8);
  const beavertail = new THREE.Mesh(beavertailGeom, redMat);
  beavertail.position.set(-slideLen / 2 + 0.05, -0.04, 0);
  beavertail.rotation.z = 0.2;
  frameGroup.add(beavertail);

  root.add(frameGroup);

  // --- Hammer (Rear black part) ---
  const hammerGeom = new THREE.BoxGeometry(0.04, 0.05, 0.02);
  const hammer = new THREE.Mesh(hammerGeom, blackMat);
  hammer.position.set(-slideLen / 2 - 0.02, 0.05, 0);
  hammer.rotation.z = -0.3;
  root.add(hammer);

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