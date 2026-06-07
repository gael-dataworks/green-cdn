export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Red glass
  // Using MeshPhysicalMaterial for transmission (glass effect)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcc0000,
    metalness: 0.0,
    roughness: 0.02,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Profile definition using SplineCurve for smooth organic shapes
  // Coordinates are (radius, height) relative to the base center
  const profileCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.00, 0.00), // Center of base bottom
    new THREE.Vector2(0.38, 0.00), // Edge of base
    new THREE.Vector2(0.38, 0.04), // Top edge of base
    new THREE.Vector2(0.14, 0.05), // Start of stem (flare from base)
    new THREE.Vector2(0.09, 0.35), // Narrowest part of stem
    new THREE.Vector2(0.14, 0.58), // Top of stem (flare into bowl)
    new THREE.Vector2(0.28, 0.65), // Bottom curve of bowl
    new THREE.Vector2(0.44, 1.15), // Widest part of bowl
    new THREE.Vector2(0.41, 1.55), // Rim edge
  ]);

  // Sample points from the curve
  const points = profileCurve.getSpacedPoints(64);

  // Create the geometry by rotating the profile around the Y axis
  const glassGeom = new THREE.LatheGeometry(points, 32);

  // Create the mesh
  const wineGlass = new THREE.Mesh(glassGeom, glassMat);
  
  // Center the geometry vertically roughly so fitToUnitCube works nicely
  // The profile goes from y=0 to y=1.55. Let's shift it down slightly to center mass.
  wineGlass.position.y = -0.5; 

  root.add(wineGlass);

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