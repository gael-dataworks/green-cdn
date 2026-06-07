export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Balloon material: Shiny latex-like appearance.
  // Using a light green base. Slight metalness helps catch highlights, low roughness for gloss.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xb8f0b8,       // Light minty green
    metalness: 0.15,
    roughness: 0.25,
  });

  // Knot material: Slightly darker/tighter rubber at the tie point.
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0x88dd88,       // Slightly darker green
    metalness: 0.15,
    roughness: 0.3,
  });

  // Stick material: Matte white plastic or wood.
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Balloon Body ---
  // Profile for LatheGeometry (radius, y)
  // Defines the teardrop shape from top tip down to the neck.
  const profilePoints = [
    new THREE.Vector2(0.00, 1.10), // Top tip
    new THREE.Vector2(0.35, 0.90), // Upper curve
    new THREE.Vector2(0.65, 0.60), // Shoulder
    new THREE.Vector2(0.85, 0.20), // Widest point
    new THREE.Vector2(0.75, -0.10),// Lower curve start
    new THREE.Vector2(0.55, -0.35),// Tapering in
    new THREE.Vector2(0.35, -0.50),// Neck start
    new THREE.Vector2(0.15, -0.60),// Neck narrow
    new THREE.Vector2(0.05, -0.65),// Bottom of neck
    new THREE.Vector2(0.00, -0.65) // Center axis closure
  ];

  const balloonGeom = new THREE.LatheGeometry(profilePoints, 32);
  const balloonBody = new THREE.Mesh(balloonGeom, balloonMat);
  root.add(balloonBody);

  // --- Balloon Knot ---
  // The tied end at the bottom. Modeled as a small distorted sphere/capsule.
  const knotGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const knot = new THREE.Mesh(knotGeom, knotMat);
  knot.scale.set(0.9, 0.7, 0.9); // Squash it slightly
  knot.rotation.z = Math.PI / 8; // Tilt slightly for organic look
  knot.position.set(0, -0.62, 0); // Attach to bottom of balloon neck
  root.add(knot);

  // --- Stick ---
  // Thin cylinder extending downwards from the knot.
  const stickGeom = new THREE.CylinderGeometry(0.025, 0.025, 1.8, 12);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  stick.position.set(0, -1.55, 0); // Position below knot
  root.add(stick);

  // --- Normalization ---
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