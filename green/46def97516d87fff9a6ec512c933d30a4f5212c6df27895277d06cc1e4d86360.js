export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Latex balloon: shiny, low roughness, dielectric (metalness 0).
  // Color is a bright mint green to match the reference's luminous quality.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0x98fb98,
    metalness: 0.0,
    roughness: 0.25,
  });

  // Stick: simple white plastic or paper.
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Balloon Body (Lathe) ---
  // Profile defines the silhouette from bottom (knot) to top.
  // Coordinates: (radius, height)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Bottom tip of knot
    new THREE.Vector2(0.06, 0.05),  // Knot bulk
    new THREE.Vector2(0.03, 0.12),  // Neck start (narrow)
    new THREE.Vector2(0.15, 0.35),  // Shoulder flare
    new THREE.Vector2(0.42, 0.90),  // Max width (equator)
    new THREE.Vector2(0.38, 1.25),  // Upper curve
    new THREE.Vector2(0.00, 1.40),  // Top center
  ];

  const balloonGeom = new THREE.LatheGeometry(profilePoints, 32);
  const balloon = new THREE.Mesh(balloonGeom, balloonMat);
  // Center the balloon vertically roughly around y=0.7 so the knot is near y=0
  balloon.position.y = -0.7; 
  root.add(balloon);

  // --- Knot Detail ---
  // The lathe creates a smooth neck, but real balloons have a twisted knot.
  // We add a small torus-like shape at the bottom to simulate the tied rubber.
  const knotGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI * 1.5);
  const knot = new THREE.Mesh(knotGeom, balloonMat);
  knot.position.set(0, -0.68, 0); // Position near the neck base
  knot.rotation.x = Math.PI / 2; // Lay flat-ish
  knot.rotation.y = Math.PI / 4; // Twist it slightly
  root.add(knot);

  // --- Stick ---
  // Thin white cylinder extending downwards from the knot.
  const stickHeight = 1.2;
  const stickRadius = 0.015;
  const stickGeom = new THREE.CylinderGeometry(stickRadius, stickRadius, stickHeight, 8);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  // Position stick so top touches the knot bottom
  stick.position.set(0, -0.7 - (stickHeight / 2), 0);
  root.add(stick);

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