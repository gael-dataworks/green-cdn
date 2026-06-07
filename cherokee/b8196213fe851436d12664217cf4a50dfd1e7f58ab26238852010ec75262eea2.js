export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc19a6b,
    metalness: 0.0,
    roughness: 0.7,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.3,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const handleLen = 0.55;
  const handleRad = 0.055;
  const metalLen = 0.45;
  
  // --- Handle ---
  // Cylindrical wooden handle
  const handleGeom = new THREE.CylinderGeometry(handleRad, handleRad, handleLen, 24);
  // Rotate to lie along Z axis (default cylinder is Y-up)
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = handleLen / 2;
  root.add(handle);

  // Handle Slot (the split in the wood)
  // Thin box intersecting the handle
  const slotGeom = new THREE.BoxGeometry(0.004, handleRad * 2.1, handleLen * 0.9);
  const handleSlot = new THREE.Mesh(slotGeom, darkMat);
  handleSlot.rotation.x = Math.PI / 2;
  handleSlot.position.z = handleLen / 2 + 0.02; // Slightly offset to be visible on top/side
  root.add(handleSlot);

  // --- Metal Body ---
  // We construct the metal body from segments to match the profile:
  // 1. Collar (ferrule) at the wood junction
  // 2. Main shaft (slight taper)
  // 3. Tip section (sharper taper)
  
  const metalStartZ = 0;
  
  // 1. Collar
  const collarLen = 0.06;
  const collarRad = 0.048;
  const collarGeom = new THREE.CylinderGeometry(collarRad, collarRad, collarLen, 24);
  const collar = new THREE.Mesh(collarGeom, copperMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.z = metalStartZ + collarLen / 2;
  root.add(collar);

  // 2. Main Shaft
  const shaftLen = 0.18;
  const shaftRadTop = 0.042;
  const shaftRadBot = 0.025;
  const shaftGeom = new THREE.CylinderGeometry(shaftRadTop, shaftRadBot, shaftLen, 24);
  const shaft = new THREE.Mesh(shaftGeom, copperMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = metalStartZ + collarLen + shaftLen / 2;
  root.add(shaft);

  // 3. Tip Section (before threads)
  const tipBaseLen = 0.12;
  const tipBaseRadTop = 0.025;
  const tipBaseRadBot = 0.012;
  const tipBaseGeom = new THREE.CylinderGeometry(tipBaseRadTop, tipBaseRadBot, tipBaseLen, 24);
  const tipBase = new THREE.Mesh(tipBaseGeom, copperMat);
  tipBase.rotation.x = Math.PI / 2;
  tipBase.position.z = metalStartZ + collarLen + shaftLen + tipBaseLen / 2;
  root.add(tipBase);

  // 4. Threads/Ridges near the point
  // Use TorusGeometry to create rings
  const threadCount = 4;
  const threadStartZ = metalStartZ + collarLen + shaftLen + tipBaseLen;
  const threadSpacing = 0.015;
  const threadRadBase = 0.012;
  const threadTubeRad = 0.0025;

  for (let i = 0; i < threadCount; i++) {
    const z = threadStartZ + i * threadSpacing;
    const r = threadRadBase - (i * 0.0015); // Taper the threads slightly
    const threadGeom = new THREE.TorusGeometry(r, threadTubeRad, 12, 24);
    const thread = new THREE.Mesh(threadGeom, copperMat);
    thread.rotation.y = Math.PI / 2; // Torus is in XY, rotate to XZ plane
    thread.position.z = z;
    root.add(thread);
  }

  // 5. Sharp Point
  const pointLen = 0.08;
  const pointRad = 0.010;
  const pointGeom = new THREE.ConeGeometry(pointRad, pointLen, 24);
  const point = new THREE.Mesh(pointGeom, copperMat);
  point.rotation.x = -Math.PI / 2; // Cone apex is +Y, we want -Z direction relative to its base
  // Cone base is at -height/2, apex at +height/2. 
  // We want apex pointing to -Z (away from handle).
  // If we rotate X by -PI/2, Y becomes Z. Apex points +Z.
  // We want apex pointing -Z (assuming handle is at +Z relative to tip? No, handle is at +Z, tip is at 0).
  // Wait, handle is at +Z (0 to 0.55). Tip is at 0.
  // So tip should point towards -Z.
  // Cone default: Apex +Y. Rotate X -90 -> Apex +Z. 
  // We need Apex -Z. So Rotate X +90.
  point.rotation.x = Math.PI / 2;
  point.position.z = -pointLen / 2;
  root.add(point);

  // --- Details ---
  // Small hole/slot in the metal shaft (visible in reference)
  const metalHoleGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.015, 12);
  const metalHole = new THREE.Mesh(metalHoleGeom, darkMat);
  metalHole.rotation.z = Math.PI / 2; // Align with shaft axis
  metalHole.position.set(0, 0.025, metalStartZ + collarLen + shaftLen * 0.5);
  root.add(metalHole);

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