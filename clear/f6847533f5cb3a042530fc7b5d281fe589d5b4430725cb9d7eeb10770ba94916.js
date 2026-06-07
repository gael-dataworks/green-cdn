export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x3b55c8,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Dimensions
  const length = 2.0;
  const outerRadius = 0.5;
  const innerRadius = 0.35;
  const filletSize = 0.05;

  // Profile for LatheGeometry (Y-axis rotation)
  // We define the cross-section from bottom-center, out, up, in, down, close.
  // Adding points to simulate rounded edges (fillets) at the ends.
  const profile = [
    new THREE.Vector2(0, -length / 2),                  // Center bottom
    new THREE.Vector2(outerRadius, -length / 2),        // Outer bottom corner
    new THREE.Vector2(outerRadius, -length / 2 + filletSize), // Start bottom fillet
    new THREE.Vector2(outerRadius - filletSize, -length / 2 + filletSize * 2), // Approx curve point
    new THREE.Vector2(outerRadius - filletSize, length / 2 - filletSize * 2),  // Straight section start
    new THREE.Vector2(outerRadius, length / 2 - filletSize), // End top fillet
    new THREE.Vector2(outerRadius, length / 2),         // Outer top corner
    new THREE.Vector2(innerRadius, length / 2),         // Inner top corner
    new THREE.Vector2(innerRadius, -length / 2),        // Inner bottom corner
    new THREE.Vector2(0, -length / 2)                   // Close loop at center
  ];

  const bushingGeom = new THREE.LatheGeometry(profile, 32);
  const bushing = new THREE.Mesh(bushingGeom, plasticMat);
  
  // Rotate to match reference orientation (lying on side) if desired, 
  // but standard cylinder is Y-up. We'll leave it Y-up for clean topology,
  // fitToUnitCube handles the rest.
  
  root.add(bushing);

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