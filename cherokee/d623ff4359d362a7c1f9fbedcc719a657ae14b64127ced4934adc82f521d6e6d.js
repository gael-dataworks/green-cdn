export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear Glass: High transmission, low roughness, standard ior
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Lemonade: Milky, pale yellow, semi-opaque
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xfdfbd1, // Pale lemon yellow
    metalness: 0.0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.92,
  });

  // Ice: Slightly cloudy transmission
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.7,
    ior: 1.3,
    transparent: true,
  });

  // --- Geometry Construction ---

  // 1. Glass Body (Lathe)
  // Profile points [radius, height] from bottom center up and around
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00),   // Center bottom
    new THREE.Vector2(0.32, 0.00),   // Bottom outer edge
    new THREE.Vector2(0.32, 0.08),   // Thick base start
    new THREE.Vector2(0.30, 0.90),   // Side wall (tapered in slightly towards top? No, usually out)
                                     // Actually image shows slightly wider at top.
    new THREE.Vector2(0.34, 0.90),   // Top outer wall
    new THREE.Vector2(0.36, 0.95),   // Rim flare out
    new THREE.Vector2(0.34, 1.00),   // Top rim top
    new THREE.Vector2(0.32, 1.00),   // Top rim inner edge
    new THREE.Vector2(0.31, 0.90),   // Inner wall top
    new THREE.Vector2(0.29, 0.10),   // Inner wall bottom (above base)
    new THREE.Vector2(0.29, 0.08),   // Inner base top
    new THREE.Vector2(0.00, 0.08),   // Inner base center
  ];

  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // 2. Liquid (Cylinder matching inner volume)
  // The liquid fills up to about 85% height
  const liquidHeight = 0.82;
  const liquidTopRadius = 0.29 + (0.31 - 0.29) * (liquidHeight / 0.90); // Interpolate radius
  const liquidBotRadius = 0.29;
  
  const liquidGeom = new THREE.CylinderGeometry(liquidBotRadius, liquidTopRadius, liquidHeight, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  // Position liquid so it sits on the inner base (y=0.08) + half its height
  liquid.position.y = 0.08 + liquidHeight / 2;
  root.add(liquid);

  // 3. Ice Cubes (Irregular boxes/spheres floating near top)
  function addIceCube(x, y, z, rx, ry, rz, sx, sy, sz) {
    const geom = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geom, iceMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
  }

  // Ice 1: Floating high, left
  addIceCube(-0.15, 0.85, 0.10, 0.5, 0.2, 0.8, 0.12, 0.10, 0.12);
  // Ice 2: Floating high, right
  addIceCube(0.12, 0.88, -0.15, -0.3, 0.5, 0.2, 0.14, 0.11, 0.13);
  // Ice 3: Slightly submerged, center-ish
  addIceCube(0.05, 0.75, 0.15, 0.8, -0.4, 0.3, 0.10, 0.10, 0.10);

  // 4. Subtle Surface Ripples on Liquid (Optional detail for realism)
  // A slightly larger, very flat transparent disc on top
  const rippleGeom = new THREE.CylinderGeometry(liquidTopRadius * 0.95, liquidTopRadius * 0.95, 0.01, 32);
  const rippleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.4,
    roughness: 0.1,
    transparent: true,
    opacity: 0.5
  });
  const ripple = new THREE.Mesh(rippleGeom, rippleMat);
  ripple.position.y = 0.08 + liquidHeight + 0.005;
  root.add(ripple);

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