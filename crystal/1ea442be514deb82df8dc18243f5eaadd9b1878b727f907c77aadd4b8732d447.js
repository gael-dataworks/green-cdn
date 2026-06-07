export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Red glass (cranberry/ruby).
  // High transmission, low roughness, slight color absorption.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaa0000,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
    thickness: 0.5,
  });

  // Profile points for LatheGeometry (radius, height).
  // Traces the solid cross-section: Base -> Stem (solid) -> Bowl (hollow) -> Rim -> Inner Bowl -> Inner Stem/Base.
  const profilePoints = [
    // Base Bottom
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.33, 0.00),
    new THREE.Vector2(0.33, 0.03),
    
    // Stem (Solid)
    new THREE.Vector2(0.05, 0.03),
    new THREE.Vector2(0.035, 0.35), // Narrowest part
    new THREE.Vector2(0.06, 0.55),  // Transition to bowl
    
    // Bowl Exterior
    new THREE.Vector2(0.15, 0.60),
    new THREE.Vector2(0.35, 0.90),  // Widest point
    new THREE.Vector2(0.33, 1.00),  // Rim Outer
    
    // Rim Thickness & Bowl Interior
    new THREE.Vector2(0.31, 1.00),  // Rim Inner
    new THREE.Vector2(0.30, 0.85),
    new THREE.Vector2(0.20, 0.60),
    new THREE.Vector2(0.08, 0.55),  // Inner bottom curve start
    new THREE.Vector2(0.05, 0.55),  // Connection to stem
    
    // Stem Interior (Solid stem means we go down the center axis effectively, 
    // but to close the volume we trace back to the base center)
    new THREE.Vector2(0.05, 0.03),
    new THREE.Vector2(0.00, 0.03),
    new THREE.Vector2(0.00, 0.00),
  ];

  // Use a curve to smooth the profile points for a more organic glass shape
  const curve = new THREE.CatmullRomCurve3(
    profilePoints.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  const smoothPoints = curve.getSpacedPoints(64);
  const profile2D = smoothPoints.map(p => new THREE.Vector2(p.x, p.y));

  const glassGeom = new THREE.LatheGeometry(profile2D, 48);
  const wineGlass = new THREE.Mesh(glassGeom, glassMat);
  
  // Center the geometry vertically roughly before grouping
  wineGlass.position.y = 0; 
  
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