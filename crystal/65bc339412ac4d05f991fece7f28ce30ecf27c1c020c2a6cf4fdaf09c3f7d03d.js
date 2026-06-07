export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Dark glossy green, resembling glazed ceramic or polished stone.
  const budMat = new THREE.MeshStandardMaterial({
    color: 0x0a2922,
    metalness: 0.2,
    roughness: 0.1,
  });

  // Profile for LatheGeometry (radius, y)
  // Tracing from bottom center up to the tip.
  const profile = [
    new THREE.Vector2(0.00, 0.00),  // Center bottom
    new THREE.Vector2(0.12, 0.04),  // Base flare edge
    new THREE.Vector2(0.035, 0.10), // Stem start (narrow)
    new THREE.Vector2(0.035, 0.55), // Stem top (uniform)
    new THREE.Vector2(0.06, 0.62),  // Transition to bud (widening)
    new THREE.Vector2(0.18, 0.75),  // Bud belly (widest part)
    new THREE.Vector2(0.14, 0.90),  // Bud taper start
    new THREE.Vector2(0.08, 1.05),  // Bud taper mid
    new THREE.Vector2(0.00, 1.15),  // Tip point
  ];

  // Create the geometry using LatheGeometry for rotational symmetry.
  // 32 segments ensures smooth curvature without excessive vertices.
  const budGeom = new THREE.LatheGeometry(profile, 32);
  
  const vase = new THREE.Mesh(budGeom, budMat);
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