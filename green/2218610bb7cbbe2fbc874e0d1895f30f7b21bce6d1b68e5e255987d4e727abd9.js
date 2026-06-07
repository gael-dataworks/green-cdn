export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper: Warm reddish-brown metal.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Silver: White metal for handles.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Main Body (Copper) ---
  // Profile points (radius, height) from bottom center to top center.
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.38, 0.00), // Base edge
    new THREE.Vector2(0.20, 0.15), // Stem curve in
    new THREE.Vector2(0.16, 0.25), // Stem narrow
    new THREE.Vector2(0.22, 0.35), // Stem to body transition
    new THREE.Vector2(0.28, 0.40), // Body bottom
    new THREE.Vector2(0.42, 0.85), // Body belly (widest)
    new THREE.Vector2(0.40, 1.05), // Body taper
    new THREE.Vector2(0.46, 1.15), // Rim flare
    new THREE.Vector2(0.48, 1.18), // Top lip edge
    new THREE.Vector2(0.00, 1.18), // Top center
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, copperMat);
  root.add(body);

  // --- Handles (Silver) ---
  // Define the path for the right handle (positive X side).
  // The handle attaches high on the body and lower on the stem.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.46, 1.05, 0.00), // Top attachment (near rim)
    new THREE.Vector3(0.58, 1.15, 0.00), // Top scroll outward
    new THREE.Vector3(0.62, 0.80, 0.00), // Outer curve
    new THREE.Vector3(0.55, 0.50, 0.00), // Mid curve
    new THREE.Vector3(0.40, 0.35, 0.00), // Bottom scroll inward
    new THREE.Vector3(0.28, 0.32, 0.00), // Bottom attachment (on stem)
  ]);

  // Tube geometry for the handle.
  // Radius 0.04 gives a substantial bar.
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.035, 8, false);
  
  // Create the right handle mesh.
  const handleRight = new THREE.Mesh(handleGeom, silverMat);
  root.add(handleRight);

  // Create the left handle by cloning and mirroring across the Y-axis (scale X by -1).
  const handleLeft = handleRight.clone();
  handleLeft.scale.x = -1;
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