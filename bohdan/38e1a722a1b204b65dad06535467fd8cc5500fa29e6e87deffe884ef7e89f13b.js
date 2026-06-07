export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Glossy yellow latex/rubber
  // Using MeshPhysicalMaterial for better specular highlights and slight subsurface feel
  const balloonMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.05,
    ior: 1.4,
    side: THREE.DoubleSide,
  });

  // 1. Balloon Body (Lathe Geometry for pear-like inflation shape)
  // Profile points defined as (radius, height) from top to bottom
  const profilePoints = [
    new THREE.Vector2(0.00, 0.58),  // Top center
    new THREE.Vector2(0.25, 0.50),  // Top curve start
    new THREE.Vector2(0.48, 0.25),  // Upper shoulder
    new THREE.Vector2(0.52, 0.00),  // Widest point (equator)
    new THREE.Vector2(0.48, -0.25), // Lower shoulder
    new THREE.Vector2(0.35, -0.45), // Tapering down
    new THREE.Vector2(0.18, -0.55), // Neck start
    new THREE.Vector2(0.08, -0.60), // Neck end
    new THREE.Vector2(0.00, -0.62), // Bottom tip of body
  ];

  const balloonBodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const balloon_body = new THREE.Mesh(balloonBodyGeom, balloonMat);
  root.add(balloon_body);

  // 2. Balloon Knot (Small twisted nub at the bottom)
  // Using a scaled sphere to simulate the tied rubber knot
  const knotGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const balloon_knot = new THREE.Mesh(knotGeom, balloonMat);
  balloon_knot.position.set(0, -0.62, 0);
  balloon_knot.scale.set(1.0, 1.2, 0.8); // Slight squash and stretch
  root.add(balloon_knot);

  // Helper to fit object to unit cube
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