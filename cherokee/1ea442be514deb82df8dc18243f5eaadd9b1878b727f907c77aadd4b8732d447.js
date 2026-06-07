export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Red Translucent Glass
  // Using MeshPhysicalMaterial for accurate transmission and refraction.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd00000,          // Deep ruby red
    metalness: 0.0,           // Dielectric
    roughness: 0.05,          // Very smooth, polished glass
    transmission: 0.95,       // Highly transparent
    ior: 1.5,                 // Index of Refraction for glass
    transparent: true,
    thickness: 0.5,           // Helps simulate volume absorption
    side: THREE.DoubleSide,   // Render both sides for thin walls
  });

  // Profile Construction for LatheGeometry
  // We define the cross-section of the glass wall in the XY plane (X=radius, Y=height).
  // The path must be closed to create a solid volume of glass.
  
  const profileCurve = new THREE.CurvePath();

  // 1. Base Bottom (Center to Edge)
  profileCurve.add(new THREE.LineCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.35, 0, 0)
  ));

  // 2. Base Side (Edge Up)
  profileCurve.add(new THREE.LineCurve3(
    new THREE.Vector3(0.35, 0, 0),
    new THREE.Vector3(0.35, 0.04, 0)
  ));

  // 3. Base Top to Stem Base (Inward)
  profileCurve.add(new THREE.LineCurve3(
    new THREE.Vector3(0.35, 0.04, 0),
    new THREE.Vector3(0.07, 0.04, 0)
  ));

  // 4. Stem (Curved Up)
  // Slight convex curve for elegance
  profileCurve.add(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.07, 0.04, 0),   // Start
    new THREE.Vector3(0.09, 0.25, 0),   // Control (bulge out slightly)
    new THREE.Vector3(0.06, 0.45, 0)    // End (Bowl Bottom)
  ));

  // 5. Bowl Outer Wall (Curved Out and Up)
  profileCurve.add(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.06, 0.45, 0),   // Start
    new THREE.Vector3(0.35, 0.65, 0),   // Control (widest point)
    new THREE.Vector3(0.33, 0.85, 0)    // End (Rim Outer)
  ));

  // 6. Rim Thickness (Inward)
  profileCurve.add(new THREE.LineCurve3(
    new THREE.Vector3(0.33, 0.85, 0),
    new THREE.Vector3(0.31, 0.85, 0)
  ));

  // 7. Bowl Inner Wall (Curved Down and In)
  // Defines the hollow part and the punt
  profileCurve.add(new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.31, 0.85, 0),   // Start (Rim Inner)
    new THREE.Vector3(0.25, 0.45, 0),   // Control (follows outer shape but smaller)
    new THREE.Vector3(0.0, 0.12, 0)     // End (Punt Center - indentation)
  ));

  // 8. Punt Bottom (Center Down to Start)
  // Closes the volume at the bottom axis
  profileCurve.add(new THREE.LineCurve3(
    new THREE.Vector3(0.0, 0.12, 0),
    new THREE.Vector3(0.0, 0.0, 0)
  ));

  // Sample points from the curve path for LatheGeometry
  // 64 points ensures smooth curves, 32 segments for radial rotation
  const points = profileCurve.getSpacedPoints(64);
  const vector2Points = points.map(p => new THREE.Vector2(p.x, p.y));

  const glassGeom = new THREE.LatheGeometry(vector2Points, 48);
  
  // Fix normals for correct refraction/transmission rendering
  glassGeom.computeVertexNormals();

  const wineGlass = new THREE.Mesh(glassGeom, glassMat);
  
  // Center the geometry vertically roughly before normalization
  // The profile goes from y=0 to y=0.85. 
  // We want the base at the bottom of the object group.
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