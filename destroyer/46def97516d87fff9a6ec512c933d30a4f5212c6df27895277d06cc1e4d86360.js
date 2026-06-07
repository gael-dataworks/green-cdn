export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Balloon body: Soft, slightly translucent latex look.
  const balloonMat = new THREE.MeshPhysicalMaterial({
    color: 0xb4f086,       // Pale lime green
    metalness: 0.0,
    roughness: 0.25,       // Shiny but soft
    transmission: 0.4,     // Slight translucency for that latex glow
    thickness: 0.5,
    ior: 1.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
  });

  // Knot: Darker, more opaque rubber
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0x2e8b57,       // Sea green / darker green
    metalness: 0.0,
    roughness: 0.4,
  });

  // Stick: Matte white plastic or paper
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Balloon Body (Lathe) ---
  // Profile defines the silhouette from top center down to the neck.
  // Coordinates: (radius, y)
  const profilePoints = [
    new THREE.Vector2(0.00, 1.10),  // Top tip
    new THREE.Vector2(0.45, 0.90),  // Upper curve start
    new THREE.Vector2(0.85, 0.40),  // Shoulder
    new THREE.Vector2(0.98, -0.10), // Widest point
    new THREE.Vector2(0.90, -0.60), // Lower body
    new THREE.Vector2(0.60, -0.90), // Taper start
    new THREE.Vector2(0.25, -1.05), // Neck taper
    new THREE.Vector2(0.12, -1.15), // Neck base
  ];

  // Use a CatmullRomCurve3 for smooth interpolation of the profile
  const curve = new THREE.CatmullRomCurve3(
    profilePoints.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  // Sample points for LatheGeometry
  const lathePoints = curve.getSpacedPoints(32);
  // Ensure the top starts at 0 radius to close smoothly if needed, 
  // but here we want the open neck at the bottom. 
  // The curve starts at 0 radius (top tip) effectively.
  
  const balloonGeom = new THREE.LatheGeometry(lathePoints, 32);
  const balloon = new THREE.Mesh(balloonGeom, balloonMat);
  root.add(balloon);

  // --- Knot ---
  // A small, crumpled shape at the base of the neck.
  // Using a distorted sphere to mimic the tied rubber.
  const knotGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const knot = new THREE.Mesh(knotGeom, knotMat);
  knot.position.set(0, -1.18, 0);
  knot.scale.set(1.2, 0.8, 1.0); // Flatten slightly
  knot.rotation.set(0.2, 0.5, 0); // Randomize orientation for organic look
  root.add(knot);

  // Add a small tie detail (tiny cylinder)
  const tieGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
  const tie = new THREE.Mesh(tieGeom, knotMat);
  tie.position.set(0, -1.22, 0);
  tie.rotation.x = Math.PI / 2;
  root.add(tie);

  // --- Stick ---
  // Thin cylinder extending downwards
  const stickHeight = 1.8;
  const stickGeom = new THREE.CylinderGeometry(0.025, 0.025, stickHeight, 12);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  // Position stick so top is just below the knot
  stick.position.set(0, -1.25 - stickHeight / 2, 0);
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