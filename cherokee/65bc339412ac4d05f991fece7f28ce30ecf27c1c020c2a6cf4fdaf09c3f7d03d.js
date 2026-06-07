export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep glossy green, ceramic or polished finish.
  // Low roughness for sharp highlights, low metalness for ceramic look.
  const vaseMat = new THREE.MeshStandardMaterial({
    color: 0x052b20,
    metalness: 0.1,
    roughness: 0.15,
  });

  // Profile for LatheGeometry (radius, height)
  // Constructing a tall stem with a flared base and a tulip-bud top.
  const profile = [
    new THREE.Vector2(0.00, 0.00),  // Center bottom
    new THREE.Vector2(0.12, 0.02),  // Base flare out
    new THREE.Vector2(0.035, 0.08), // Narrow down to stem
    new THREE.Vector2(0.035, 0.62), // Long straight stem
    new THREE.Vector2(0.045, 0.68), // Transition to bud neck
    new THREE.Vector2(0.16, 0.82),  // Widest part of the bud
    new THREE.Vector2(0.08, 0.94),  // Tapering up
    new THREE.Vector2(0.00, 1.00),  // Sharp tip
  ];

  // Use a SplineCurve for smoother interpolation between key points if needed,
  // but LatheGeometry interpolates linearly between points well enough for this shape.
  // To ensure smoothness, we can use getSpacedPoints on a curve, but direct Vector2 array
  // is sufficient for this specific silhouette.
  
  const segments = 32;
  const vaseGeom = new THREE.LatheGeometry(profile, segments);
  
  const vase = new THREE.Mesh(vaseGeom, vaseMat);
  
  // Center the geometry vertically if needed, though profile starts at 0.
  // The fitToUnitCube will handle overall scaling and centering.
  root.add(vase);

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