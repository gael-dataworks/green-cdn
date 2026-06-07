export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep emerald green, high gloss glaze/ceramic look.
  // Using low roughness to capture the sharp specular highlights seen in the reference.
  // Metalness kept low to avoid blackness without env map, relying on roughness for shine.
  const glazeMat = new THREE.MeshStandardMaterial({
    color: 0x052b1d,
    metalness: 0.1,
    roughness: 0.15,
  });

  // Profile for LatheGeometry (radius, height)
  // Constructing a teardrop bud on a long slender stem with a flared base.
  const profile = [
    new THREE.Vector2(0.00, 0.00),  // Center of base
    new THREE.Vector2(0.14, 0.00),  // Outer edge of base
    new THREE.Vector2(0.05, 0.08),  // Transition to stem
    new THREE.Vector2(0.035, 1.15), // Top of stem (long slender section)
    new THREE.Vector2(0.06, 1.25),  // Start of bulb flare
    new THREE.Vector2(0.22, 1.55),  // Widest part of the bulb
    new THREE.Vector2(0.15, 1.75),  // Tapering towards tip
    new THREE.Vector2(0.00, 1.90),  // Sharp tip
  ];

  // Create the main body using LatheGeometry
  // 32 segments for smooth curvature
  const bodyGeom = new THREE.LatheGeometry(profile, 32);
  const body = new THREE.Mesh(bodyGeom, glazeMat);
  
  // Center the geometry vertically so the base sits at y=0 roughly before normalization
  // LatheGeometry centers based on the profile points provided. 
  // Our profile starts at y=0, so the bottom is at 0.
  
  root.add(body);

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