export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x3050b0,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Dimensions (local units before normalization)
  const height = 1.0;
  const radiusOuter = 0.42;
  const radiusInner = 0.34;

  // Profile for LatheGeometry (defines the cross-section in XY plane)
  // Order: Inner Bottom -> Outer Bottom -> Outer Top -> Inner Top
  // This creates the bottom cap, outer wall, top cap, and inner wall.
  const profile = [
    new THREE.Vector2(radiusInner, 0),
    new THREE.Vector2(radiusOuter, 0),
    new THREE.Vector2(radiusOuter, height),
    new THREE.Vector2(radiusInner, height),
  ];

  // Geometry: Lathe rotates the profile around the Y axis
  const tubeGeom = new THREE.LatheGeometry(profile, 32);

  // Mesh
  const tube = new THREE.Mesh(tubeGeom, plasticMat);
  
  // Orientation: The image shows the tube lying on its side.
  // Standard Lathe is Y-up. Rotate 90deg around X to align long axis with Z.
  tube.rotation.x = Math.PI / 2;
  
  root.add(tube);

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