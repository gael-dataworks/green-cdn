export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Purple Velvet
  // Velvet is high roughness, low metalness. The sheen comes from the lighting interaction.
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7b2c9e,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Dimensions
  const width = 0.60;
  const height = 0.35;
  const depth = 0.12;
  const flapHeight = 0.14;

  // 1. Body
  // Main rectangular pouch. Slightly rounded corners would be nice but Box is fine for velvet.
  const bodyGeom = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeom, velvetMat);
  body.position.y = height / 2;
  root.add(body);

  // 2. Flap
  // The top part that folds over.
  // We model it as a box that is positioned at the top and rotated to drape down.
  const flapGeom = new THREE.BoxGeometry(width, flapHeight, depth * 0.95);
  const flap = new THREE.Mesh(flapGeom, velvetMat);
  // Position at the back top edge, then rotate forward
  flap.position.set(0, height, -depth / 4);
  flap.rotation.x = -Math.PI / 3.5; // Fold angle
  // Pivot adjustment: The flap rotates around its top-back edge effectively.
  // Since we rotated the mesh, we need to ensure it sits right.
  // Simplified: Just place it visually correct relative to body.
  flap.position.y = height - (flapHeight * 0.4); 
  flap.position.z = -depth / 3;
  root.add(flap);

  // 3. Bow
  const bowGroup = new THREE.Group();
  
  // Bow Loops
  // Using TorusGeometry segments for the loops.
  const loopRadius = 0.11;
  const tubeRadius = 0.045;
  const loopGeom = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 32, Math.PI * 1.4);
  
  // Left Loop
  const bowLeft = new THREE.Mesh(loopGeom, velvetMat);
  bowLeft.position.set(-0.08, 0.05, 0.02);
  bowLeft.rotation.set(0.2, 0.4, 0.1);
  bowGroup.add(bowLeft);

  // Right Loop
  const bowRight = new THREE.Mesh(loopGeom, velvetMat);
  bowRight.position.set(0.08, 0.05, 0.02);
  bowRight.rotation.set(0.2, -0.4, -0.1);
  bowGroup.add(bowRight);

  // Bow Knot
  // Central sphere/capsule
  const knotGeom = new THREE.CapsuleGeometry(tubeRadius * 0.9, 0.06, 8, 16);
  const knot = new THREE.Mesh(knotGeom, velvetMat);
  knot.rotation.z = Math.PI / 2;
  knot.position.set(0, 0.02, 0.04);
  bowGroup.add(knot);

  // Bow Tails (hanging down)
  const tailGeom = new THREE.BoxGeometry(0.06, 0.12, 0.04);
  const tailLeft = new THREE.Mesh(tailGeom, velvetMat);
  tailLeft.position.set(-0.04, -0.08, 0.02);
  tailLeft.rotation.z = 0.2;
  bowGroup.add(tailLeft);

  const tailRight = new THREE.Mesh(tailGeom, velvetMat);
  tailRight.position.set(0.04, -0.08, 0.02);
  tailRight.rotation.z = -0.2;
  bowGroup.add(tailRight);

  // Position the whole bow on the flap
  // The flap is rotated, so we need to place the bow in world space or parent it carefully.
  // Parenting to root is safer for positioning, then we align it to the flap surface.
  bowGroup.position.set(0, height - 0.08, depth * 0.45);
  // Tilt the bow to match the flap angle roughly
  bowGroup.rotation.x = -0.4; 
  root.add(bowGroup);

  // 4. Stitching Detail (Optional but adds realism)
  // Thin lines along the flap edge
  const stitchGeom = new THREE.TorusGeometry(width * 0.45, 0.005, 8, 32, Math.PI);
  const stitch = new THREE.Mesh(stitchGeom, velvetMat);
  stitch.rotation.x = -Math.PI / 2;
  stitch.position.set(0, height - 0.02, depth * 0.48);
  stitch.rotation.x = -0.4; // Match flap
  // Actually, let's just rely on the geometry edges for stitching implication to save draw calls.

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