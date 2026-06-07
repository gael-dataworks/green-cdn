export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Shiny yellow latex/rubber
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xFFE600,
    metalness: 0.0,
    roughness: 0.25,
  });

  // 1. Main Balloon Body
  // A sphere stretched slightly vertically to mimic the teardrop shape of an inflated balloon
  const bodyGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const balloon_body = new THREE.Mesh(bodyGeom, balloonMat);
  balloon_body.scale.set(1.0, 1.15, 1.0); // Elongate slightly on Y
  root.add(balloon_body);

  // 2. Knot/Neck
  // A small protrusion at the bottom where the balloon is tied
  const knotGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const balloon_knot = new THREE.Mesh(knotGeom, balloonMat);
  // Position at the bottom of the scaled body. 
  // Body height is roughly 0.5 * 1.15 = 0.575. Bottom is at -0.575.
  balloon_knot.position.set(0, -0.56, 0);
  balloon_knot.scale.set(1.0, 1.2, 1.0); // Slightly elongated knot
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