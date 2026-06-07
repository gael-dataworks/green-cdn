export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed steel / matte metal
  // Metalness capped at 0.6 to avoid blackness without env map.
  // Roughness 0.5 for a used tool look.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x9aa0a6,
    metalness: 0.6,
    roughness: 0.5,
  });

  // --- Handle ---
  // Hexagonal prism. Slightly thicker than the shaft base.
  // Length ~0.55 units. Radius ~0.07.
  const handleGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6);
  const handle = new THREE.Mesh(handleGeom, steelMat);
  // Rotate to lie along Z axis (default is Y up)
  handle.rotation.x = Math.PI / 2;
  // Position so it occupies the left side (negative Z)
  handle.position.z = -0.275;
  root.add(handle);

  // --- Shaft / Taper ---
  // Hexagonal cone. Tapers from handle neck to point.
  // Length ~0.45 units. Base radius ~0.055 (slightly smaller than handle).
  const shaftGeom = new THREE.CylinderGeometry(0.055, 0.0, 0.45, 6);
  const shaft = new THREE.Mesh(shaftGeom, steelMat);
  shaft.rotation.x = Math.PI / 2;
  // Position to connect seamlessly to handle.
  // Handle ends at z = -0.275 + 0.275 = 0.0.
  // Shaft starts at 0.0. Center is at 0.0 + 0.225 = 0.225.
  shaft.position.z = 0.225;
  root.add(shaft);

  // --- Collar / Transition Ring ---
  // A subtle ring where the handle meets the shaft to define the shoulder.
  const collarGeom = new THREE.CylinderGeometry(0.072, 0.072, 0.04, 6);
  const collar = new THREE.Mesh(collarGeom, steelMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.z = 0.0; // Right at the junction
  root.add(collar);

  // Normalize to fit unit cube
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