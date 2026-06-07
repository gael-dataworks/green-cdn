export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy blue plastic for body and cap
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a55ff,
    metalness: 0.1,
    roughness: 0.25,
  });

  // Matte black plastic/rubber for the base
  const blackBaseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry Construction ---

  // 1. Main Body Profile (Lathe)
  // Points define the right-half silhouette from bottom (y=0) to top of neck.
  // Coordinates are in local units, will be normalized later.
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.28, 0.00), // Outer bottom edge
    new THREE.Vector2(0.28, 0.15), // Base straight section
    new THREE.Vector2(0.26, 0.60), // Taper in (lower body)
    new THREE.Vector2(0.24, 1.10), // Waist (narrowest)
    new THREE.Vector2(0.27, 1.60), // Bulge out (upper body)
    new THREE.Vector2(0.25, 1.90), // Shoulder start
    new THREE.Vector2(0.21, 2.10), // Neck
    new THREE.Vector2(0.21, 2.20), // Neck top (where cap starts)
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bluePlasticMat);
  root.add(body);

  // 2. Cap Profile (Lathe)
  // Sits on top of the neck (y=2.20, r=0.21)
  const capProfile = [
    new THREE.Vector2(0.21, 2.20), // Start at neck top
    new THREE.Vector2(0.23, 2.25), // Slight flare at base of cap
    new THREE.Vector2(0.23, 2.55), // Cap side
    new THREE.Vector2(0.20, 2.60), // Top edge chamfer
    new THREE.Vector2(0.00, 2.60), // Center top
  ];

  const capGeom = new THREE.LatheGeometry(capProfile, 32);
  const cap = new THREE.Mesh(capGeom, bluePlasticMat);
  root.add(cap);

  // 3. Black Base
  // A short cylinder at the bottom
  const baseHeight = 0.12;
  const baseRadius = 0.28;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, blackBaseMat);
  base.position.y = baseHeight / 2; // Sit on y=0
  root.add(base);

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