export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Velvet: High roughness, no metalness, rich purple color.
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x6A2C91,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Dimensions ---
  // Aspect ratio approx 1.6 : 1 : 0.25
  const bagWidth = 1.0;
  const bagHeight = 0.60;
  const bagDepth = 0.16;
  const flapHeight = 0.28; // Flap covers roughly top 45%

  // --- 1. Main Body (Base) ---
  // The main compartment of the clutch.
  const bodyGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth);
  const body = new THREE.Mesh(bodyGeom, velvetMat);
  // Position body so its top is at y=0 for easier flap attachment logic, 
  // but we will center everything at the end.
  body.position.y = -bagHeight / 2;
  root.add(body);

  // --- 2. Flap ---
  // The flap is attached at the back top edge and folds over the front.
  // We create a group to act as the hinge.
  const flapGroup = new THREE.Group();
  // Hinge position: Top of body, back of body.
  flapGroup.position.set(0, bagHeight / 2, -bagDepth / 2);
  
  // Flap mesh geometry. 
  // It needs to be long enough to go over the top and down the front.
  // Length = depth (top) + flapHeight (front).
  const flapLength = bagDepth + flapHeight;
  const flapGeom = new THREE.BoxGeometry(bagWidth, 0.04, flapLength); // Thin box
  const flapMesh = new THREE.Mesh(flapGeom, velvetMat);
  
  // Position the flap mesh relative to the hinge.
  // The hinge is at the back. The flap extends forward (positive Z) and down (negative Y).
  // We rotate the flap group around X to drape it.
  // If we rotate the group, the mesh needs to be offset so it pivots correctly.
  // Let's simplify: Place the flap mesh directly.
  // Flap starts at back-top, goes over, ends at front-mid.
  // Angle: roughly 45-60 degrees from vertical.
  flapGroup.rotation.x = Math.PI / 3.5; // ~51 degrees
  
  // Adjust mesh position within group to align with hinge
  // The pivot is at (0,0,0) of the group. 
  // The flap box center should be halfway along its length, shifted back.
  flapMesh.position.set(0, -flapLength / 2 * Math.cos(flapGroup.rotation.x), flapLength / 2 * Math.sin(flapGroup.rotation.x));
  // Actually, simpler approach for static mesh:
  // Just place a box on the front face, angled.
  flapGroup.clear(); // Clear the group logic, just use a mesh positioned on the body
  
  const flap = new THREE.Mesh(new THREE.BoxGeometry(bagWidth, flapHeight, 0.05), velvetMat);
  // Position: Top of body, slightly forward to overlap.
  flap.position.set(0, bagHeight / 2 - flapHeight / 2 + 0.02, bagDepth / 2 + 0.02);
  // Rotate to drape slightly
  flap.rotation.x = -0.15; 
  root.add(flap);

  // --- 3. Bow ---
  const bowGroup = new THREE.Group();
  
  // Bow Loops
  // Using TorusGeometry flattened to look like ribbon loops.
  const loopRadius = 0.14;
  const tubeRadius = 0.045;
  const loopGeom = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 32);
  
  // Left Loop
  const leftLoop = new THREE.Mesh(loopGeom, velvetMat);
  leftLoop.position.set(-0.16, 0, 0);
  leftLoop.rotation.z = Math.PI / 10; // Tilt outward slightly
  leftLoop.rotation.y = -Math.PI / 8; // Angle towards center
  leftLoop.scale.set(1, 0.6, 1); // Flatten vertically
  bowGroup.add(leftLoop);

  // Right Loop
  const rightLoop = new THREE.Mesh(loopGeom, velvetMat);
  rightLoop.position.set(0.16, 0, 0);
  rightLoop.rotation.z = -Math.PI / 10;
  rightLoop.rotation.y = Math.PI / 8;
  rightLoop.scale.set(1, 0.6, 1);
  bowGroup.add(rightLoop);

  // Bow Knot (Center)
  // A short cylinder wrapped horizontally.
  const knotGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20);
  const knot = new THREE.Mesh(knotGeom, velvetMat);
  knot.rotation.x = Math.PI / 2;
  knot.rotation.z = Math.PI / 2; // Align with bow center
  bowGroup.add(knot);

  // Position Bow on the Flap
  // Flap center is roughly at (0, bagHeight/2 - flapHeight/2, bagDepth/2)
  bowGroup.position.set(0, bagHeight / 2 - flapHeight / 2 + 0.02, bagDepth / 2 + 0.06);
  // Tilt bow to match flap drape
  bowGroup.rotation.x = -0.15;
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