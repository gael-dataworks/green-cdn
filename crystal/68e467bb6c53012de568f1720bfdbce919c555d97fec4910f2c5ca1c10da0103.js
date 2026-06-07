export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Velvet: High roughness, zero metalness, rich purple color.
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6a2c91,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Dimensions ---
  const bagWidth = 0.60;
  const bagHeight = 0.32;
  const bagDepth = 0.12;
  const flapHeight = 0.18;
  
  // --- Body ---
  // Main rectangular body of the clutch.
  const bodyGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth);
  const body = new THREE.Mesh(bodyGeom, velvetMat);
  body.position.y = bagHeight / 2;
  root.add(body);

  // --- Flap ---
  // The flap folds over the top. We model it as a box positioned at the top-front.
  // Slightly wider than body to cover edges.
  const flapGeom = new THREE.BoxGeometry(bagWidth + 0.02, flapHeight, bagDepth + 0.02);
  const flap = new THREE.Mesh(flapGeom, velvetMat);
  // Position: Top of body, shifted forward slightly to account for fold thickness
  flap.position.set(0, bagHeight + (flapHeight / 2) - 0.02, 0);
  // Rotate slightly to simulate the fold over the top edge
  flap.rotation.x = -0.15; 
  root.add(flap);

  // --- Bow Group ---
  const bowGroup = new THREE.Group();
  
  // Bow Loop Geometry (Half Torus to simulate a loop)
  // Radius 0.09, Tube 0.035 gives a puffy ribbon look
  const loopGeom = new THREE.TorusGeometry(0.09, 0.035, 16, 32, Math.PI);
  
  // Left Loop
  const bow_left_loop = new THREE.Mesh(loopGeom, velvetMat);
  bow_left_loop.position.set(-0.10, 0, 0);
  // Rotate to face outward and slightly up
  bow_left_loop.rotation.y = Math.PI / 2; 
  bow_left_loop.rotation.z = Math.PI / 2;
  bow_left_loop.scale.set(1, 1, 0.6); // Flatten slightly
  bowGroup.add(bow_left_loop);

  // Right Loop
  const bow_right_loop = new THREE.Mesh(loopGeom, velvetMat);
  bow_right_loop.position.set(0.10, 0, 0);
  bow_right_loop.rotation.y = -Math.PI / 2;
  bow_right_loop.rotation.z = Math.PI / 2;
  bow_right_loop.scale.set(1, 1, 0.6);
  bowGroup.add(bow_right_loop);

  // Bow Knot (Center)
  // A short cylinder rotated to bridge the loops
  const knotGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16);
  const bow_knot = new THREE.Mesh(knotGeom, velvetMat);
  bow_knot.rotation.z = Math.PI / 2;
  bow_knot.position.set(0, 0, 0.02); // Slightly in front
  bowGroup.add(bow_knot);

  // Bow Tails (Hanging down)
  // Flattened boxes
  const tailGeom = new THREE.BoxGeometry(0.06, 0.12, 0.02);
  
  const bow_tail_left = new THREE.Mesh(tailGeom, velvetMat);
  bow_tail_left.position.set(-0.06, -0.08, 0);
  bow_tail_left.rotation.z = 0.2; // Angle out slightly
  bowGroup.add(bow_tail_left);

  const bow_tail_right = new THREE.Mesh(tailGeom, velvetMat);
  bow_tail_right.position.set(0.06, -0.08, 0);
  bow_tail_right.rotation.z = -0.2;
  bowGroup.add(bow_tail_right);

  // Position the entire bow on the flap
  // Flap center is roughly at y = bagHeight + flapHeight/2 - 0.02
  // We want the bow centered on the flap vertically and horizontally
  bowGroup.position.set(0, bagHeight + 0.05, 0);
  // Tilt bow slightly to match flap angle
  bowGroup.rotation.x = -0.15;
  
  root.add(bowGroup);

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