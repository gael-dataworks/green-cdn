export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Balloon: Latex-like, slightly shiny but mostly diffuse, light green.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xbcee68,      // Green Yellow / Lime
    metalness: 0.0,
    roughness: 0.35,      // Slight sheen like latex
  });

  // Stick: White plastic or paper, matte.
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Balloon Body ---
  // Use a sphere scaled on Y to create the teardrop/oval shape.
  const balloonGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const balloon = new THREE.Mesh(balloonGeom, balloonMat);
  balloon.scale.set(1.0, 1.15, 1.0); // Elongate vertically
  balloon.position.y = 0.15;         // Lift up so knot is near origin
  root.add(balloon);

  // --- Balloon Knot ---
  // A small irregular shape at the bottom where it's tied.
  const knotGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const knot = new THREE.Mesh(knotGeom, balloonMat);
  knot.scale.set(1.2, 0.8, 1.2);     // Flatten slightly
  knot.position.y = -0.42;           // Bottom of the scaled balloon
  root.add(knot);

  // --- Stick ---
  // Thin cylinder extending downwards.
  const stickGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  stick.position.y = -1.05;          // Connect below the knot
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