export default function generate(THREE) {
  const root = new THREE.Group();

  // Deep red glass material with transmission for realism.
  // Using attenuation to simulate color density in thicker parts (base, rim, push-up).
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdd4444,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    attenuationColor: 0xaa0000,
    attenuationDistance: 0.4,
    side: THREE.DoubleSide,
  });

  // Define the profile of the glass using a SplineCurve for smooth organic shapes.
  // Coordinates are (radius, height). We trace the cross-section clockwise starting from bottom center.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // 0: Center bottom of foot
    new THREE.Vector2(0.38, 0.00),  // 1: Outer edge of foot
    new THREE.Vector2(0.38, 0.025), // 2: Top edge of foot
    new THREE.Vector2(0.14, 0.05),  // 3: Stem base flare
    new THREE.Vector2(0.05, 0.35),  // 4: Stem narrowest point
    new THREE.Vector2(0.08, 0.48),  // 5: Stem top flare (knop)
    new THREE.Vector2(0.12, 0.52),  // 6: Bowl bottom outer start
    new THREE.Vector2(0.35, 1.00),  // 7: Bowl max width
    new THREE.Vector2(0.33, 1.15),  // 8: Rim outer edge
    new THREE.Vector2(0.31, 1.14),  // 9: Rim inner edge (thickness)
    new THREE.Vector2(0.32, 1.00),  // 10: Bowl inner max width
    new THREE.Vector2(0.22, 0.65),  // 11: Bowl inner curve down
    new THREE.Vector2(0.15, 0.55),  // 12: Bowl push-up (thick bottom)
    new THREE.Vector2(0.08, 0.50),  // 13: Push-up center / stem junction inner
    new THREE.Vector2(0.06, 0.48),  // 14: Stem top inner
    new THREE.Vector2(0.05, 0.35),  // 15: Stem inner narrow
    new THREE.Vector2(0.05, 0.05),  // 16: Stem bottom inner
    new THREE.Vector2(0.30, 0.025), // 17: Foot inner edge
    new THREE.Vector2(0.00, 0.025), // 18: Foot top center
  ];

  // Use a SplineCurve to smooth the profile points, then sample densely for LatheGeometry.
  const curve = new THREE.SplineCurve(profilePoints);
  const lathePoints = curve.getPoints(64);

  // Create the glass mesh using LatheGeometry.
  // 32 radial segments for a smooth circular look.
  const glassGeom = new THREE.LatheGeometry(lathePoints, 32);
  const wineGlass = new THREE.Mesh(glassGeom, glassMat);

  // Center the geometry vertically if needed, but profile starts at 0 so it sits on ground.
  // The fitToUnitCube helper will handle final scaling and centering.
  root.add(wineGlass);

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