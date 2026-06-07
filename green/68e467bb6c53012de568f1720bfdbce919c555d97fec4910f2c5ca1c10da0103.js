export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Velvet: High roughness, zero metalness, deep purple color.
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6A2C91,
    roughness: 0.95,
    metalness: 0.0,
  });

  // --- Dimensions ---
  const bagWidth = 1.0;
  const bagHeight = 0.65;
  const bagDepth = 0.22;
  const flapHeight = 0.28;
  const bowWidth = 0.45;

  // --- Body ---
  // Main rectangular body of the clutch.
  const bodyGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth);
  const body = new THREE.Mesh(bodyGeom, velvetMat);
  // Shift body down so top is at y=0 for easier flap placement
  body.position.y = -bagHeight / 2;
  root.add(body);

  // --- Flap Assembly ---
  const flapGroup = new THREE.Group();
  
  // 1. Flap Top (the part that sits on top/back)
  const flapTopDepth = 0.12;
  const flapTopGeom = new THREE.BoxGeometry(bagWidth, 0.04, flapTopDepth);
  const flapTop = new THREE.Mesh(flapTopGeom, velvetMat);
  flapTop.position.set(0, 0, -flapTopDepth / 2 + bagDepth / 2);
  flapGroup.add(flapTop);

  // 2. Flap Fold (rounded edge)
  // Using a cylinder segment to simulate the fabric fold
  const foldRadius = 0.035;
  const foldGeom = new THREE.CylinderGeometry(
    foldRadius, 
    foldRadius, 
    bagWidth, 
    16, 
    1, 
    false, 
    0, 
    Math.PI / 2
  );
  const flapFold = new THREE.Mesh(foldGeom, velvetMat);
  // Rotate to align the curve
  flapFold.rotation.z = Math.PI / 2; 
  flapFold.rotation.x = Math.PI / 2; // Align cylinder axis with X
  // Position at the front edge of the top
  flapFold.position.set(0, -foldRadius, bagDepth / 2);
  flapGroup.add(flapFold);

  // 3. Flap Front (the main visible panel)
  const flapFrontGeom = new THREE.BoxGeometry(bagWidth, flapHeight, 0.04);
  const flapFront = new THREE.Mesh(flapFrontGeom, velvetMat);
  // Position below the fold
  flapFront.position.set(0, -foldRadius - flapHeight / 2, bagDepth / 2 + 0.02);
  // Slight rotation to suggest it drapes over the contents
  flapFront.rotation.x = 0.05; 
  flapGroup.add(flapFront);

  root.add(flapGroup);

  // --- Bow Assembly ---
  const bowGroup = new THREE.Group();

  // Bow Knot (Center)
  const knotGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16);
  const knot = new THREE.Mesh(knotGeom, velvetMat);
  knot.rotation.z = Math.PI / 2;
  knot.rotation.y = Math.PI / 2; // Face forward
  bowGroup.add(knot);

  // Bow Loops (Left and Right)
  // Using TorusGeometry for the loops
  const loopRadius = 0.11;
  const loopTube = 0.055;
  const loopGeom = new THREE.TorusGeometry(loopRadius, loopTube, 16, 24, Math.PI * 1.8);
  
  // Left Loop
  const loopLeft = new THREE.Mesh(loopGeom, velvetMat);
  loopLeft.position.set(-loopRadius * 0.6, 0, 0.02);
  loopLeft.rotation.y = Math.PI / 2;
  loopLeft.rotation.z = Math.PI / 6; // Flare out
  loopLeft.rotation.x = Math.PI / 6; // Tilt forward slightly
  bowGroup.add(loopLeft);

  // Right Loop
  const loopRight = new THREE.Mesh(loopGeom, velvetMat);
  loopRight.position.set(loopRadius * 0.6, 0, 0.02);
  loopRight.rotation.y = Math.PI / 2;
  loopRight.rotation.z = -Math.PI / 6; // Flare out
  loopRight.rotation.x = Math.PI / 6;
  bowGroup.add(loopRight);

  // Bow Tails (Hanging down)
  const tailGeom = new THREE.BoxGeometry(0.08, 0.15, 0.03);
  
  const tailLeft = new THREE.Mesh(tailGeom, velvetMat);
  tailLeft.position.set(-0.06, -0.12, 0.02);
  tailLeft.rotation.z = 0.3;
  bowGroup.add(tailLeft);

  const tailRight = new THREE.Mesh(tailGeom, velvetMat);
  tailRight.position.set(0.06, -0.12, 0.02);
  tailRight.rotation.z = -0.3;
  bowGroup.add(tailRight);

  // Position Bow on Flap
  bowGroup.position.set(0, -foldRadius - flapHeight * 0.4, bagDepth / 2 + 0.04);
  root.add(bowGroup);

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