export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper: Warm orange-brown, polished metal.
  // Cap metalness at 0.6 per rules. Use emissive to lift brightness in dim env.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xb87333,
    emissiveIntensity: 0.3,
  });

  // Silver: Cool gray-white, polished metal.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.3,
  });

  // --- Cup Body (Lathe) ---
  // Profile defines the silhouette from bottom-center (0,0) to top-center.
  // Coordinates are approximate local units before normalization.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.28, 0.00), // Base outer edge
    new THREE.Vector2(0.28, 0.04), // Base rim
    new THREE.Vector2(0.16, 0.18), // Stem narrow
    new THREE.Vector2(0.19, 0.26), // Stem knop (bulb)
    new THREE.Vector2(0.14, 0.34), // Stem neck
    new THREE.Vector2(0.16, 0.38), // Bowl bottom connection
    new THREE.Vector2(0.36, 0.85), // Bowl widest point
    new THREE.Vector2(0.39, 0.96), // Bowl top before rim
    new THREE.Vector2(0.44, 0.99), // Rim outer lip
    new THREE.Vector2(0.40, 1.02), // Rim top inner
    new THREE.Vector2(0.00, 1.02), // Top center (close the volume)
  ];

  const cupBodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const cupBody = new THREE.Mesh(cupBodyGeom, copperMat);
  cupBody.name = "cup_body";
  root.add(cupBody);

  // --- Handles (Tube) ---
  // Ornate scrolled handles. We model one in the XY plane, flatten it, then place it.
  // Path points for the RIGHT handle (positive X side).
  const handlePathPoints = [
    new THREE.Vector3(0.39, 0.95, 0), // Top attach (near rim)
    new THREE.Vector3(0.58, 0.88, 0), // Scroll out
    new THREE.Vector3(0.54, 0.70, 0), // Mid curve
    new THREE.Vector3(0.48, 0.55, 0), // Lower curve
    new THREE.Vector3(0.38, 0.45, 0), // Bottom attach (mid bowl)
  ];

  const handleCurve = new THREE.CatmullRomCurve3(handlePathPoints);
  // Tube args: path, tubularSegments, radius, radialSegments, closed
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.035, 8, false);

  // Right Handle
  const handleRight = new THREE.Mesh(handleGeom, silverMat);
  handleRight.name = "handle_right";
  // Flatten the tube along Z to make it look like a flat metal strap
  handleRight.scale.set(1, 1, 0.25);
  root.add(handleRight);

  // Left Handle (Mirror of Right)
  const handleLeft = handleRight.clone();
  handleLeft.name = "handle_left";
  handleLeft.scale.set(-1, 1, 0.25); // Mirror X
  root.add(handleLeft);

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