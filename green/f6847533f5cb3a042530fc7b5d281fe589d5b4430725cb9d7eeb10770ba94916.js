export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep blue anodized aluminum or hard plastic.
  // Moderate roughness to catch the soft highlights seen in the reference.
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x2a55c5,
    metalness: 0.15,
    roughness: 0.45,
  });

  // Profile for LatheGeometry (radius, y).
  // Defines a hollow tube with slight chamfers on the outer and inner rims
  // to catch light and avoid razor-sharp edges.
  // Y is the axis of the cylinder in local space.
  const profile = [
    new THREE.Vector2(0.00, -0.50), // Center bottom
    new THREE.Vector2(0.35, -0.50), // Outer bottom edge
    new THREE.Vector2(0.35, -0.48), // Start bottom chamfer
    new THREE.Vector2(0.34, -0.49), // Bottom chamfer point
    new THREE.Vector2(0.34, 0.49),  // Main outer wall
    new THREE.Vector2(0.35, 0.48),  // Start top chamfer
    new THREE.Vector2(0.35, 0.50),  // Outer top edge
    new THREE.Vector2(0.28, 0.50),  // Inner top edge
    new THREE.Vector2(0.28, -0.50), // Inner bottom edge (through hole)
    new THREE.Vector2(0.00, -0.50), // Close center
  ];

  // Create the hollow cylinder using LatheGeometry.
  // 32 segments for smooth curvature.
  const spacerGeom = new THREE.LatheGeometry(profile, 32);
  const spacer = new THREE.Mesh(spacerGeom, blueMat);

  // Orientation:
  // LatheGeometry creates a Y-up cylinder.
  // The reference shows the spacer lying on its side.
  // We rotate it 90 degrees around the Z-axis so its main axis aligns with X.
  // Then a slight rotation around Y to present the opening to the viewer.
  spacer.rotation.z = Math.PI / 2;
  spacer.rotation.y = -Math.PI / 6;

  root.add(spacer);

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