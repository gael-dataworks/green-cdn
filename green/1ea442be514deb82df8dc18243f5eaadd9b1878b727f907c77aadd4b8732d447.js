export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Red Glass
  // Using MeshPhysicalMaterial for transmission (transparency) and gloss.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaa0000,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.96,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  // Profile Control Points (Radius, Height)
  // We use a CatmullRomCurve3 in the XY plane (Z=0) to generate smooth Vector2 points.
  const controlPoints = [
    new THREE.Vector3(0.00, 0.00, 0), // 0: Center Base
    new THREE.Vector3(0.35, 0.00, 0), // 1: Base Edge
    new THREE.Vector3(0.35, 0.025, 0), // 2: Base Top Edge
    new THREE.Vector3(0.12, 0.025, 0), // 3: Stem Base
    new THREE.Vector3(0.06, 0.25, 0), // 4: Stem Mid (narrow)
    new THREE.Vector3(0.08, 0.42, 0), // 5: Stem Top / Bowl Joint
    new THREE.Vector3(0.12, 0.45, 0), // 6: Bowl Bottom Outer
    new THREE.Vector3(0.38, 0.75, 0), // 7: Bowl Widest
    new THREE.Vector3(0.37, 0.92, 0), // 8: Rim Outer
    new THREE.Vector3(0.34, 0.92, 0), // 9: Rim Inner
    new THREE.Vector3(0.34, 0.75, 0), // 10: Bowl Inner Widest
    new THREE.Vector3(0.15, 0.45, 0), // 11: Bowl Inner Bottom
    new THREE.Vector3(0.05, 0.45, 0), // 12: Punt Outer
    new THREE.Vector3(0.05, 0.42, 0), // 13: Punt Inner
    new THREE.Vector3(0.00, 0.42, 0), // 14: Punt Center
    new THREE.Vector3(0.00, 0.00, 0), // 15: Close Loop
  ];

  const curve = new THREE.CatmullRomCurve3(controlPoints);
  // Get spaced points to ensure smooth distribution along the curve
  const points3D = curve.getSpacedPoints(64);
  
  // Map Vector3 to Vector2 for LatheGeometry
  const profile = points3D.map((p) => new THREE.Vector2(p.x, p.y));

  // Create Geometry
  // 32 radial segments for a smooth circular look
  const glassGeom = new THREE.LatheGeometry(profile, 32);

  // Create Mesh
  const wineGlass = new THREE.Mesh(glassGeom, glassMat);
  
  // Center the geometry vertically if needed, though Lathe centers based on points.
  // Our points start at y=0, so the base is at y=0.
  
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