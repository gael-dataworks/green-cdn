export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed steel / metal scribe
  // Metalness capped at 0.6 to avoid black reflection in no-env map.
  // Roughness 0.35 for a used tool look, not mirror polish.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Dimensions (local units, will be normalized later)
  const handleLength = 0.50;
  const tipLength = 0.35;
  const toolWidth = 0.09;
  const toolThickness = 0.055;
  const radius = toolWidth / 2;

  // --- Handle ---
  // Capsule geometry provides the rounded end on the left and flat shaft.
  // We create it upright (Y-axis) then rotate to Z-axis.
  // Cylindrical part length = total length - 2 * radius (caps).
  const handleCylLength = Math.max(0.01, handleLength - 2 * radius);
  const handleGeom = new THREE.CapsuleGeometry(radius, handleCylLength, 4, 12);
  
  // Scale Y to make it a flat bar instead of a round rod.
  // Capsule is symmetric X/Z, so scaling Y flattens it.
  handleGeom.scale(1, toolThickness / toolWidth, 1);

  const handle = new THREE.Mesh(handleGeom, metalMat);
  // Position handle so its right end is at z=0 (meeting the tip)
  // Center of handle is at - (handleLength / 2)
  handle.position.set(0, 0, -handleLength / 2);
  // Rotate capsule (originally Y-up) to lie along Z-axis
  handle.rotation.x = Math.PI / 2;
  root.add(handle);

  // --- Tip ---
  // Cone geometry with 4 radial segments creates a square pyramid (diamond point).
  // Scaling Y flattens it to match the handle profile.
  const tipGeom = new THREE.ConeGeometry(radius, tipLength, 4);
  tipGeom.scale(1, toolThickness / toolWidth, 1);

  const tip = new THREE.Mesh(tipGeom, metalMat);
  // Cone default: base at y=-height/2, tip at y=+height/2.
  // Rotate -90 deg around X: base at z=-height/2, tip at z=+height/2.
  // We want base to meet handle end at z=0.
  // So center of cone should be at z = tipLength / 2.
  tip.position.set(0, 0, tipLength / 2);
  tip.rotation.x = -Math.PI / 2;
  root.add(tip);

  // Normalize to fit unit cube (95% fill)
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