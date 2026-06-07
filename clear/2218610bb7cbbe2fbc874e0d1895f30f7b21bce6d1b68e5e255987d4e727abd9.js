export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Copper: Warm orange-brown, high metalness (capped at 0.6), low roughness for polish.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Silver: White metal, slightly lower metalness to avoid blackness, low roughness.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.25,
  });

  // --- Cup Body (Lathe) ---
  // Profile points (radius, y) defining the outer and inner surface for thickness.
  // Order: Bottom center -> Base -> Stem -> Bowl Outer -> Rim -> Bowl Inner -> Stem Inner -> Base Inner -> Center
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.35, 0.00), // Base outer edge
    new THREE.Vector2(0.28, 0.10), // Base step
    new THREE.Vector2(0.14, 0.25), // Stem neck
    new THREE.Vector2(0.18, 0.35), // Stem top
    new THREE.Vector2(0.22, 0.40), // Bowl start
    new THREE.Vector2(0.38, 0.85), // Bowl max width
    new THREE.Vector2(0.40, 0.90), // Rim outer top
    new THREE.Vector2(0.36, 0.90), // Rim inner top (thickness)
    new THREE.Vector2(0.36, 0.85), // Rim inner drop
    new THREE.Vector2(0.22, 0.42), // Bowl inner bottom
    new THREE.Vector2(0.22, 0.40), // Connect to stem inner
    new THREE.Vector2(0.18, 0.35), // Stem inner top
    new THREE.Vector2(0.14, 0.25), // Stem inner neck
    new THREE.Vector2(0.28, 0.10), // Base inner step
    new THREE.Vector2(0.00, 0.10), // Base inner center (closed)
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  const cup = new THREE.Mesh(cupGeom, copperMat);
  root.add(cup);

  // --- Handles ---
  // Define the path for the right handle (+X side)
  // Starts at rim, arches out, attaches to bowl.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.88, 0.00), // Top attachment (near rim)
    new THREE.Vector3(0.52, 0.90, 0.00), // Top scroll outward
    new THREE.Vector3(0.58, 0.75, 0.00), // Max arch
    new THREE.Vector3(0.50, 0.55, 0.00), // Lower curve
    new THREE.Vector3(0.32, 0.50, 0.00), // Bottom attachment
  ]);

  // Main handle tube
  const handleGeom = new THREE.TubeGeometry(handlePath, 24, 0.025, 12, false);
  const handleRight = new THREE.Mesh(handleGeom, silverMat);
  root.add(handleRight);

  // Decorative ridge on the handle (thinner tube, same path)
  const ridgeGeom = new THREE.TubeGeometry(handlePath, 24, 0.010, 8, false);
  const ridgeRight = new THREE.Mesh(ridgeGeom, silverMat);
  // Offset ridge slightly to sit on top of the main tube visually if needed, 
  // but since they share the path, we can just scale or rely on z-fighting prevention by slight offset.
  // Actually, let's just make the main handle slightly flattened or keep it simple.
  // To avoid z-fighting, let's skip the ridge tube and rely on the main tube's shape, 
  // or offset the ridge slightly outward.
  ridgeRight.scale.set(1.05, 1.05, 1.05); 
  root.add(ridgeRight);

  // Left handle (-X side) - Clone and rotate 180 degrees around Y
  const handleLeft = handleRight.clone();
  handleLeft.rotation.y = Math.PI;
  root.add(handleLeft);

  const ridgeLeft = ridgeRight.clone();
  ridgeLeft.rotation.y = Math.PI;
  root.add(ridgeLeft);

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