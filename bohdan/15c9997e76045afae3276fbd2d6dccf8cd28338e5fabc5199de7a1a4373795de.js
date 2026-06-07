export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe6e4df,
    metalness: 0.0,
    roughness: 0.8,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7a7d85,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Main Body ---
  // Proportions: Width 1.0, Height 0.8, Depth 0.8
  const bodyGeom = new THREE.BoxGeometry(1.0, 0.8, 0.8);
  const houseBody = new THREE.Mesh(bodyGeom, bodyMat);
  houseBody.position.y = 0; 
  root.add(houseBody);

  // --- Roof ---
  // Use a 3-segment cylinder to create a triangular prism.
  // Default Cylinder: Axis Y, Radius 0.5, Height 1.0 (Depth).
  // Base width (flat side) = radius * sqrt(3) ≈ 0.866.
  // Height (apex to flat side) = radius * 1.5 = 0.75.
  const roofGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 3);
  const roof = new THREE.Mesh(roofGeom, roofMat);

  // Orientation:
  // 1. Rotate X 90° to make the cylinder axis point along Z (depth).
  // 2. Rotate Z 90° to make the flat face of the triangle point downwards (horizontal).
  roof.rotation.set(Math.PI / 2, 0, Math.PI / 2);

  // Scaling to match desired proportions:
  // Desired Width: 1.2 (overhangs body width 1.0 by 0.1 on each side).
  // Desired Height: 0.5 (pitch).
  // Desired Depth: 1.0 (overhangs body depth 0.8 by 0.1 on each side).
  const targetWidth = 1.2;
  const targetHeight = 0.5;
  const targetDepth = 1.0;

  const baseWidth = 0.5 * Math.sqrt(3);
  const baseHeight = 0.5 * 1.5;

  const scaleX = targetWidth / baseWidth;
  const scaleY = targetHeight / baseHeight;
  const scaleZ = targetDepth / 1.0;

  roof.scale.set(scaleX, scaleY, scaleZ);

  // Positioning:
  // Body top is at y = 0.4 (half of 0.8 height).
  // Roof local center is at 0,0,0.
  // Roof local flat face (bottom) is at y = -0.5 * radius = -0.25.
  // After scaling Y, the bottom is at -0.25 * scaleY.
  const roofBottomLocalY = -0.25 * scaleY;
  roof.position.y = 0.4 - roofBottomLocalY;

  root.add(roof);

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