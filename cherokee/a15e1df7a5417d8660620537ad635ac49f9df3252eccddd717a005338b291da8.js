export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0044ee,
    metalness: 0.0,
    roughness: 0.45,
  });

  const blackBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry Construction ---

  // 1. Bottle Body (Main Blue Part)
  // Using LatheGeometry for the ergonomic curved profile.
  // Profile points defined as (radius, height) from bottom of blue section upwards.
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.48, 0.00), // Bottom edge
    new THREE.Vector2(0.54, 1.20), // Lower bulge
    new THREE.Vector2(0.44, 2.80), // Waist (grip area)
    new THREE.Vector2(0.52, 4.20), // Upper bulge
    new THREE.Vector2(0.46, 5.40), // Neck start
    new THREE.Vector2(0.49, 5.90), // Shoulder (cap seat)
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const bottle_body = new THREE.Mesh(bodyGeom, bluePlasticMat);
  // Shift body up so base sits at y=0 later
  bottle_body.position.y = 0.30; 
  root.add(bottle_body);

  // 2. Bottle Cap
  // Tapered cylinder, angled slightly forward as seen in reference.
  const capHeight = 1.40;
  const capBottomRadius = 0.49;
  const capTopRadius = 0.42;
  const capGeom = new THREE.CylinderGeometry(capTopRadius, capBottomRadius, capHeight, 32);
  const bottle_cap = new THREE.Mesh(capGeom, bluePlasticMat);
  
  // Position cap on top of the body shoulder
  // The body shoulder is at y=5.90 (local) + 0.30 (offset) = 6.20
  // Cap center needs to be at 6.20 + capHeight/2
  bottle_cap.position.y = 5.90 + 0.30 + capHeight / 2;
  
  // Tilt the cap forward slightly to match the ergonomic design
  bottle_cap.rotation.x = -0.15; 
  root.add(bottle_cap);

  // 3. Bottle Base
  // Black foot at the bottom.
  const baseHeight = 0.30;
  const baseRadius = 0.50;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const bottle_base = new THREE.Mesh(baseGeom, blackBaseMat);
  // Position at bottom (y=0 is ground)
  bottle_base.position.y = baseHeight / 2;
  root.add(bottle_base);

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