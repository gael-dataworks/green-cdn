export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Glossy yellow latex/plastic
  // High specularity (low roughness) to match the shiny highlights in the reference.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xFFE033,
    metalness: 0.0,
    roughness: 0.15,
  });

  // Main Body: Slightly elongated sphere (prolate spheroid)
  // Balloons are typically taller than they are wide when inflated.
  const balloon_body_geom = new THREE.SphereGeometry(0.5, 32, 32);
  const balloon_body = new THREE.Mesh(balloon_body_geom, balloonMat);
  balloon_body.scale.set(1.0, 1.15, 1.0);
  root.add(balloon_body);

  // Knot: Small protrusion at the bottom where the balloon is tied.
  // Modeled as a small sphere scaled to look like a twisted nub.
  const balloon_knot_geom = new THREE.SphereGeometry(0.06, 16, 16);
  const balloon_knot = new THREE.Mesh(balloon_knot_geom, balloonMat);
  
  // Position just below the main body to hide the seam and simulate the neck.
  // Body bottom is at -0.5 * 1.15 = -0.575.
  // We place the knot center slightly lower to overlap.
  balloon_knot.position.y = -0.59;
  
  // Scale to create a small, distinct tied end.
  balloon_knot.scale.set(0.7, 0.8, 0.7);
  root.add(balloon_knot);

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