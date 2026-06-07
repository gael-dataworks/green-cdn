export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black body (ceramic/plastic)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Polished metal spout and handle (silver/chrome)
  // Using emissive to brighten the metal since there is no env map
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3,
  });

  // Flame material (emissive orange/yellow)
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff6600,
    emissiveIntensity: 2.0,
    roughness: 0.4,
    metalness: 0.0,
  });

  // Interior/Wick base (dark)
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Body ---
  // Lathe profile for the main vessel
  // Points: [radius, y]
  const bodyProfile = [
    new THREE.Vector2(0.0, 0.0),      // Center bottom
    new THREE.Vector2(0.46, 0.0),     // Bottom edge
    new THREE.Vector2(0.48, 0.25),    // Widest point (belly)
    new THREE.Vector2(0.42, 0.6),     // Tapering up
    new THREE.Vector2(0.35, 0.9),     // Neck
    new THREE.Vector2(0.32, 0.98),    // Rim inner
    new THREE.Vector2(0.34, 1.0),     // Rim lip
    new THREE.Vector2(0.0, 1.0),      // Close top
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Spout ---
  // Tapered cylinder (cone-like)
  // Base radius 0.12, Top radius 0.05, Height 0.35
  const spoutGeom = new THREE.CylinderGeometry(0.12, 0.05, 0.35, 16);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  // Position on the left side (-X), angled up
  spout.position.set(-0.38, 0.65, 0);
  // Rotate to point out (-X) and up (+Y)
  // Default cylinder is Y-up. We want it to point along -X axis primarily, but angled up.
  // Rotate around Z axis to tilt up.
  spout.rotation.z = Math.PI / 6; // 30 degrees up
  // Rotate around Y to face -X (default is +X for cylinder side? No, cylinder is Y-up).
  // To make a Y-up cylinder point along X, rotate Z by 90 deg.
  // So: Rotate Z by 90 + 30 = 120 deg (2PI/3) to point -X and up.
  spout.rotation.z = Math.PI / 2 + Math.PI / 6;
  root.add(spout);

  // --- Handle ---
  // Curved tube
  const handlePoints = [
    new THREE.Vector3(0.34, 0.25, 0),  // Bottom attach
    new THREE.Vector3(0.55, 0.35, 0),  // Outward curve
    new THREE.Vector3(0.55, 0.75, 0),  // Top outward
    new THREE.Vector3(0.34, 0.85, 0),  // Top attach
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.035, 12, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // --- Interior / Wick Base ---
  // Dark disc at the top opening
  const interiorGeom = new THREE.CircleGeometry(0.30, 32);
  const interior = new THREE.Mesh(interiorGeom, interiorMat);
  interior.rotation.x = -Math.PI / 2;
  interior.position.set(0, 0.99, 0);
  root.add(interior);

  // --- Flame ---
  // Elongated cone/teardrop shape
  // Using a cone with scaled top radius to make it pointy
  const flameGeom = new THREE.ConeGeometry(0.08, 0.35, 16);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  flame.position.set(0, 1.15, 0);
  // Slight scale to make it look more organic (taller, thinner base)
  flame.scale.set(1, 1.2, 1);
  root.add(flame);

  // Inner flame core (brighter yellow)
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xffffaa,
  });
  const innerFlameGeom = new THREE.ConeGeometry(0.03, 0.2, 16);
  const innerFlame = new THREE.Mesh(innerFlameGeom, innerFlameMat);
  innerFlame.position.set(0, 1.15, 0);
  innerFlame.scale.set(1, 1.2, 1);
  root.add(innerFlame);

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