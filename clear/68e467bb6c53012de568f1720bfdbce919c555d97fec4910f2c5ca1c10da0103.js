export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Velvet needs high roughness and zero metalness to look soft and light-absorbing.
  const purpleVelvetMat = new THREE.MeshStandardMaterial({
    color: 0x6A2C91,
    metalness: 0.0,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const bagWidth = 0.50;
  const bagHeight = 0.32;
  const bagDepth = 0.10;
  const flapHeight = 0.16;
  
  // --- Helpers ---
  // Function to make a geometry look "puffy" like soft fabric
  function makePuffy(geometry, intensity = 0.02) {
    const posAttr = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      // Push vertices slightly outward from center based on their position
      // This simulates the stuffing of a clutch
      const dist = vertex.length();
      // Only puff the front and top faces mostly
      if (vertex.z > 0 || vertex.y > 0) {
        vertex.normalize().multiplyScalar(dist + intensity);
      }
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
  }

  // --- 1. Main Body ---
  // Box with segments to allow for soft deformation
  const bodyGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth, 6, 6, 4);
  makePuffy(bodyGeom, 0.015);
  const body = new THREE.Mesh(bodyGeom, purpleVelvetMat);
  body.position.y = bagHeight / 2; // Sit on ground
  root.add(body);

  // --- 2. Flap ---
  // The flap starts at the back top and folds over
  const flapGeom = new THREE.BoxGeometry(bagWidth, flapHeight, bagDepth * 0.8, 6, 6, 2);
  makePuffy(flapGeom, 0.01);
  
  // Create a group for the flap to handle the hinge rotation cleanly
  const flapGroup = new THREE.Group();
  const flap = new THREE.Mesh(flapGeom, purpleVelvetMat);
  
  // Position flap geometry so its top-back edge is the pivot point (0,0,0 of group)
  // Flap geometry is centered, so we offset it.
  // Pivot is at top (y = flapHeight/2) and back (z = -depth/2)
  flap.position.set(0, -flapHeight / 2, -bagDepth / 2);
  
  flapGroup.add(flap);
  
  // Position the group at the top-back of the body
  flapGroup.position.set(0, bagHeight, 0);
  // Rotate the flap forward to drape over the front
  // Angle needs to cover the front face. 
  // Front face is at z = bagDepth/2. Flap length is flapHeight.
  // It needs to rotate roughly 90 degrees + a bit to hang down.
  flapGroup.rotation.x = Math.PI / 2 + 0.2; 
  
  root.add(flapGroup);

  // --- 3. Bow ---
  const bowGroup = new THREE.Group();
  
  // Bow dimensions
  const bowWidth = 0.22;
  const bowLoopRadius = bowWidth / 2.5;
  const bowTubeRadius = 0.035;
  
  // Material for bow is same velvet
  const bowMat = purpleVelvetMat;

  // Left Loop
  // Use TorusGeometry, flatten it, and rotate it to look like a loop
  const loopGeom = new THREE.TorusGeometry(bowLoopRadius, bowTubeRadius, 16, 32);
  // Flatten the torus to look like a ribbon loop
  loopGeom.scale(1, 0.6, 0.4); 
  
  const leftLoop = new THREE.Mesh(loopGeom, bowMat);
  // Position left
  leftLoop.position.x = -bowLoopRadius * 0.6;
  // Rotate to form the bow shape
  leftLoop.rotation.z = Math.PI / 6; // Tilt up
  leftLoop.rotation.y = -Math.PI / 8; // Angle slightly inward
  bowGroup.add(leftLoop);

  // Right Loop
  const rightLoop = new THREE.Mesh(loopGeom, bowMat);
  rightLoop.position.x = bowLoopRadius * 0.6;
  rightLoop.rotation.z = -Math.PI / 6;
  rightLoop.rotation.y = Math.PI / 8;
  bowGroup.add(rightLoop);

  // Knot
  // A small sphere or cylinder in the center
  const knotGeom = new THREE.SphereGeometry(bowTubeRadius * 1.8, 16, 16);
  const knot = new THREE.Mesh(knotGeom, bowMat);
  // Scale to look like a wrapped knot
  knot.scale.set(1.2, 0.8, 0.8);
  bowGroup.add(knot);

  // Tails (hanging ends of the ribbon)
  const tailGeom = new THREE.BoxGeometry(0.04, 0.08, 0.02);
  // Taper the tails slightly by scaling vertices? Or just use small boxes.
  // Let's use small boxes angled down.
  const leftTail = new THREE.Mesh(tailGeom, bowMat);
  leftTail.position.set(-0.03, -0.06, 0.02);
  leftTail.rotation.z = 0.3;
  bowGroup.add(leftTail);

  const rightTail = new THREE.Mesh(tailGeom, bowMat);
  rightTail.position.set(0.03, -0.06, 0.02);
  rightTail.rotation.z = -0.3;
  bowGroup.add(rightTail);

  // Position the entire bow on the flap
  // The flap is rotated, so we need to place the bow in the flap's local space 
  // OR place it in world space relative to the flap's visual position.
  // Easier: Add bowGroup to flapGroup so it moves with the flap.
  // In flapGroup local space:
  // Flap pivot is top-back. Flap hangs down.
  // Center of flap is roughly at y = -flapHeight/2, z = -bagDepth/2 (before rotation)
  // After rotation (90 deg forward), the center is on the front face of the bag.
  bowGroup.position.set(0, -flapHeight * 0.4, -bagDepth * 0.4); // Adjusted for pivot
  // We need to counter-rotate the bow slightly so it sits flat against the draped flap
  // Actually, since bowGroup is child of flapGroup, it rotates with the flap.
  // We just need to position it on the surface.
  // The flap surface normal points roughly +Z (forward) after rotation.
  // So we push the bow out in +Z of the flap group.
  bowGroup.position.z = bagDepth * 0.5; 
  
  flapGroup.add(bowGroup);

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