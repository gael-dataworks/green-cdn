export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Polished dark wood (Walnut/Rosewood)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Geometry Construction ---

  // 1. Body (Barrel)
  // Tapered from tip to cap junction.
  // Profile points (radius, y)
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00),  // Tip center
    new THREE.Vector2(0.04, 0.00),  // Tip edge (rounded start)
    new THREE.Vector2(0.04, 0.05),  // Short straight section at tip
    new THREE.Vector2(0.055, 0.40), // Taper begins
    new THREE.Vector2(0.065, 0.70), // Main barrel
    new THREE.Vector2(0.070, 0.85), // Near cap
    new THREE.Vector2(0.070, 1.00), // Top of body (junction)
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, woodMat);
  // Shift body so junction is at y=0 for easier cap placement? 
  // No, let's keep body at y=0..1 and place cap on top.
  root.add(body);

  // 2. Cap
  // Sits on top of body (y=1.0). Slightly wider.
  // Profile points (radius, y_local) where y_local 0 is body top.
  const capProfile = [
    new THREE.Vector2(0.070, 0.00), // Inner bottom (matches body)
    new THREE.Vector2(0.085, 0.00), // Outer bottom (step)
    new THREE.Vector2(0.085, 0.15), // Outer top edge
    new THREE.Vector2(0.000, 0.15), // Top center (flat cap)
  ];
  const capGeom = new THREE.LatheGeometry(capProfile, 32);
  const cap = new THREE.Mesh(capGeom, woodMat);
  cap.position.y = 1.00; // Place on top of body
  root.add(cap);

  // --- Orientation ---
  // The object is built upright along Y. 
  // Rotate to lie flat along Z axis (standard "face +Z" for long objects).
  root.rotation.x = Math.PI / 2;
  
  // Optional: Slight diagonal tilt to match reference photo aesthetic
  root.rotation.z = -Math.PI / 8;

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