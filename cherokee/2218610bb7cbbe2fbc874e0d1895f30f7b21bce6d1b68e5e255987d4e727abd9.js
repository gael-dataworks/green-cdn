export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Using emissive to simulate brightness of polished metal in a dark environment
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xd08a5a,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd08a5a,
    emissiveIntensity: 0.4,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.4,
  });

  // --- Cup Body (Lathe) ---
  // Profile defines the right half of the cross-section (x >= 0)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.38, 0.00), // Base outer edge
    new THREE.Vector2(0.38, 0.06), // Base bottom thickness
    new THREE.Vector2(0.22, 0.06), // Base top inner (stem start)
    new THREE.Vector2(0.22, 0.12), // Stem lower
    new THREE.Vector2(0.28, 0.12), // Stem ring 1 outer
    new THREE.Vector2(0.28, 0.15), // Stem ring 1 top
    new THREE.Vector2(0.20, 0.15), // Stem narrow
    new THREE.Vector2(0.20, 0.22), // Stem mid
    new THREE.Vector2(0.28, 0.22), // Stem ring 2 outer
    new THREE.Vector2(0.28, 0.25), // Stem ring 2 top
    new THREE.Vector2(0.22, 0.25), // Stem upper narrow
    new THREE.Vector2(0.22, 0.32), // Bowl base start
    new THREE.Vector2(0.46, 0.85), // Bowl widest
    new THREE.Vector2(0.50, 0.96), // Rim flare
    new THREE.Vector2(0.48, 1.00), // Top edge
    new THREE.Vector2(0.00, 1.00), // Top center (close volume)
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  const cupBody = new THREE.Mesh(cupGeom, copperMat);
  cupBody.name = "cup_body";
  root.add(cupBody);

  // --- Handles (Tube) ---
  // Define curve for the left handle (negative X)
  // Points must align roughly with the body profile radii at corresponding heights
  const handlePoints = [
    new THREE.Vector3(-0.48, 0.94, 0.00), // Attach near rim
    new THREE.Vector3(-0.65, 0.85, 0.00), // Curve out
    new THREE.Vector3(-0.72, 0.70, 0.00), // Max outward
    new THREE.Vector3(-0.65, 0.50, 0.00), // Curve back in
    new THREE.Vector3(-0.50, 0.35, 0.00), // Lower curve
    new THREE.Vector3(-0.24, 0.30, 0.00), // Attach to stem
  ];

  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.035, 12, false);

  // Left Handle
  const leftHandle = new THREE.Mesh(handleGeom, silverMat);
  leftHandle.name = "left_handle";
  root.add(leftHandle);

  // Right Handle (Mirror X)
  const rightHandle = new THREE.Mesh(handleGeom, silverMat);
  rightHandle.name = "right_handle";
  rightHandle.scale.x = -1; // Mirror geometry
  root.add(rightHandle);

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