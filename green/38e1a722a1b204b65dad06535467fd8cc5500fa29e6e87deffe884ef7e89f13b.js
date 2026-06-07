export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Yellow latex/rubber. Smooth but not metallic.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.25,
  });

  // --- Balloon Body ---
  // A sphere slightly stretched vertically to mimic an inflated balloon shape.
  const balloonBodyGeom = new THREE.SphereGeometry(0.45, 32, 32);
  const balloonBody = new THREE.Mesh(balloonBodyGeom, balloonMat);
  // Scale Y to make it slightly taller than wide (teardrop-ish)
  balloonBody.scale.set(1.0, 1.15, 1.0);
  // Position slightly up so the knot hangs below the center
  balloonBody.position.y = 0.05;
  root.add(balloonBody);

  // --- Balloon Knot/Neck ---
  // The tied end at the bottom.
  // Neck: small cylinder
  const knotNeckGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
  const knotNeck = new THREE.Mesh(knotNeckGeom, balloonMat);
  knotNeck.position.y = -0.48; // Just below the body
  root.add(knotNeck);

  // Knot Bulb: small sphere at the very end
  const knotBulbGeom = new THREE.SphereGeometry(0.05, 16, 16);
  const knotBulb = new THREE.Mesh(knotBulbGeom, balloonMat);
  knotBulb.position.y = -0.54;
  knotBulb.scale.set(1.2, 0.8, 1.2); // Slightly flattened
  root.add(knotBulb);

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