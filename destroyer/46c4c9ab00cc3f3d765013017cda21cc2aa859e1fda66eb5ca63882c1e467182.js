export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed steel / metal tool
  // Rule: Metalness <= 0.6 (hard cap), use emissive to brighten in no-env-map render.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0x404040,
    emissiveIntensity: 0.3,
  });

  // Dimensions (approximate relative units before normalization)
  const handleLen = 0.65;
  const bladeLen = 0.45;
  const radius = 0.09; // Distance from center to vertex

  // 1. Handle: Hexagonal prism
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  // Rotated 90 deg around X to lie along Z axis.
  const handleGeom = new THREE.CylinderGeometry(radius, radius, handleLen, 6);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  handle.rotation.x = Math.PI / 2;
  // Position: Center of handle is at - (bladeLen / 2) + (handleLen / 2) offset from origin?
  // Let's place the join at z=0.
  // Handle extends from -handleLen to 0. Center at -handleLen/2.
  handle.position.z = -handleLen / 2;
  root.add(handle);

  // 2. Blade: Tapered square pyramid (4 segments)
  // ConeGeometry(radius, height, radialSegments)
  // Base radius matches handle radius for seamless join.
  const bladeGeom = new THREE.ConeGeometry(radius, bladeLen, 4);
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  blade.rotation.x = Math.PI / 2;
  // Position: Base at z=0, tip at z=bladeLen. Center at bladeLen/2.
  blade.position.z = bladeLen / 2;
  
  // Rotate blade slightly so facets align nicely or look natural relative to handle
  // A square taper usually has flats or edges aligned. 
  // Default cone has a vertex at +Y (which becomes +Z after rot X).
  // Let's rotate around Z (local Y after X rot? No, local Z is the axis of the cone).
  // Actually, after rotation.x = PI/2, the cone points +Z.
  // The default cone has a vertex at top (0, height/2, 0).
  // Rotated, vertex is at (0, 0, height/2).
  // We want to orient the square cross section.
  blade.rotation.z = Math.PI / 4; // 45 degrees to align flats/edges aesthetically
  
  root.add(blade);

  // 3. End Cap (Optional but adds realism to the handle end)
  // The handle end looks slightly rounded. A small sphere or just the cylinder cap is fine.
  // The image shows a flat end. We'll leave it as the cylinder cap.

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