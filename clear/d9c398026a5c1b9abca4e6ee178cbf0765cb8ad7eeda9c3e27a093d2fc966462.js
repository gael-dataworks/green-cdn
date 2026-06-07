export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue matte plastic. Metalness 0, roughness ~0.6 for molded plastic.
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2b6cdb,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Dark material for the hole interior to simulate depth/shadow.
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Main Body ---
  // Defined by a 2D profile in the YZ plane, extruded along X.
  const bodyShape = new THREE.Shape();
  
  // Profile points (y, z) - starting from front bottom, going clockwise
  // Front tip
  bodyShape.moveTo(0.05, 0.35); 
  // Front face slope up
  bodyShape.lineTo(0.15, 0.35);
  // Top convex curve (peak near z=0)
  // Control point high up to create the hump
  bodyShape.quadraticCurveTo(0.40, 0.05, 0.25, -0.25);
  // Back vertical drop to foot level
  bodyShape.lineTo(0.10, -0.25);
  // Foot top (recessed slightly from back face)
  bodyShape.lineTo(0.10, -0.10);
  // Foot back vertical drop
  bodyShape.lineTo(0.00, -0.10);
  // Foot bottom
  bodyShape.lineTo(0.00, -0.35); // Extended back slightly
  // Main bottom flat run to front
  bodyShape.lineTo(0.00, 0.35);
  // Close loop (implicit)
  bodyShape.lineTo(0.05, 0.35);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.30,          // Width along X
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });

  // Center the geometry locally so extrusion is symmetric around X=0
  bodyGeom.center();
  const mainBody = new THREE.Mesh(bodyGeom, bluePlasticMat);
  root.add(mainBody);

  // --- Hole ---
  // A cylinder mesh placed inside the top hump to simulate a through-hole.
  // Positioned near the peak of the curve.
  const holeRadius = 0.045;
  const holeHeight = 0.35; // Slightly wider than the body width to ensure coverage
  const holeGeom = new THREE.CylinderGeometry(holeRadius, holeRadius, holeHeight, 24);
  const holeCylinder = new THREE.Mesh(holeGeom, holeMat);
  
  // Position: Top of the hump (local Y approx 0.35 before centering, need to estimate)
  // Since we centered the geom, we need to guess the offset or calculate bounds.
  // Approximate peak is at local Y ~ 0.25 after centering.
  holeCylinder.position.set(0, 0.22, 0.0);
  holeCylinder.rotation.x = Math.PI / 2; // Cylinder default is Y-up, we want Z-axis hole? 
  // Wait, looking at image, hole axis is roughly perpendicular to the top surface slope.
  // The top surface slopes down from back to front.
  // Let's keep it vertical (Y-axis) relative to the object's base for simplicity, 
  // or tilt it slightly to match the slope. Vertical is standard for molded parts.
  // Default Cylinder is Y-up. So no rotation needed for vertical hole.
  holeCylinder.rotation.x = 0; 
  holeCylinder.rotation.z = 0;
  
  // Adjust position to sit on top surface
  // The extrusion center is at 0,0,0. The shape height is ~0.4. So top is ~0.2.
  holeCylinder.position.y = 0.18; 
  holeCylinder.position.z = 0.0;
  
  root.add(holeCylinder);

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