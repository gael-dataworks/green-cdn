export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Rusty Metal
  // Dark brownish-grey base, very high roughness, low metalness to simulate heavy oxidation
  const rustyMetalMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.9,
    metalness: 0.1,
  });

  // --- Head ---
  // Using ExtrudeGeometry to create a rounded rectangular block shape for the hammer head
  const headShape = new THREE.Shape();
  const hw = 0.065; // half width
  const hh = 0.065; // half height
  const radius = 0.015; // corner radius
  
  // Draw rounded rectangle profile
  headShape.moveTo(-hw, -hh + radius);
  headShape.lineTo(-hw, hh - radius);
  headShape.quadraticCurveTo(-hw, hh, -hw + radius, hh);
  headShape.lineTo(hw - radius, hh);
  headShape.quadraticCurveTo(hw, hh, hw, hh - radius);
  headShape.lineTo(hw, -hh + radius);
  headShape.quadraticCurveTo(hw, -hh, hw - radius, -hh);
  headShape.lineTo(-hw + radius, -hh);
  headShape.quadraticCurveTo(-hw, -hh, -hw, -hh + radius);

  const headGeom = new THREE.ExtrudeGeometry(headShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 8,
  });
  
  // Center the geometry so the pivot is in the middle of the head
  headGeom.center();
  
  const head = new THREE.Mesh(headGeom, rustyMetalMat);
  // Rotate to align the extrusion depth (local Z) with the hammer's long axis (X)
  head.rotation.y = Math.PI / 2;
  root.add(head);

  // --- Handle ---
  // Constructed from a cylinder shaft and two sphere caps for compatibility
  const handleRadius = 0.024;
  const handleLength = 0.55;
  
  const handleGroup = new THREE.Group();
  
  // Shaft
  const shaftGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 16);
  const shaft = new THREE.Mesh(shaftGeom, rustyMetalMat);
  // Cylinder is Y-up, rotate to lie along X
  shaft.rotation.z = Math.PI / 2;
  handleGroup.add(shaft);
  
  // End Caps
  const capGeom = new THREE.SphereGeometry(handleRadius, 16, 16);
  
  const capLeft = new THREE.Mesh(capGeom, rustyMetalMat);
  capLeft.position.x = -handleLength / 2;
  handleGroup.add(capLeft);
  
  const capRight = new THREE.Mesh(capGeom, rustyMetalMat);
  capRight.position.x = handleLength / 2;
  handleGroup.add(capRight);
  
  // Position handle relative to head
  // Head spans approx -0.12 to 0.12 on X.
  // We shift the handle left (-X) so the grip is long and the front protrusion is short.
  handleGroup.position.x = -0.08;
  root.add(handleGroup);

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