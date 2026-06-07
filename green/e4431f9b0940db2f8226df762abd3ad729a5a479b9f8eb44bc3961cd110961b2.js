export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver metal (blade, guard, pommel)
  // Using emissive to ensure brightness in the dim render environment
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4,
  });

  // Faceted blue handle (glass/gem-like)
  const handleMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a8a,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Dimensions (Local Units) ---
  const bladeLength = 0.60;
  const bladeBaseWidth = 0.14;
  const guardZ = 0;
  const handleLength = 0.22;
  const handleRadius = 0.035;
  const pommelRadius = 0.05;

  // --- Blade ---
  // Shape for extrusion: leaf/dagger profile
  const bladeShape = new THREE.Shape();
  // Start at base center
  bladeShape.moveTo(0, 0);
  // Base corner
  bladeShape.lineTo(0, bladeBaseWidth / 2);
  // Taper to tip
  bladeShape.lineTo(bladeLength, 0);
  // Base other corner
  bladeShape.lineTo(0, -bladeBaseWidth / 2);
  // Close
  bladeShape.lineTo(0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  
  // Center the geometry locally so pivot is at the guard
  bladeGeom.translate(-bladeLength / 2, 0, 0);

  const blade = new THREE.Mesh(bladeGeom, metalMat);
  // Position blade so base is at guardZ
  blade.position.set(0, 0, bladeLength / 2);
  root.add(blade);

  // Blade Central Ridge/Fuller Detail
  // A thin box running down the center to catch light
  const ridgeGeom = new THREE.BoxGeometry(bladeLength * 0.8, 0.002, 0.018);
  const ridge = new THREE.Mesh(ridgeGeom, metalMat);
  ridge.position.set(0, 0.008, bladeLength / 2 + 0.05);
  root.add(ridge);

  // Small Emblem on Blade (Ricasso)
  const emblemGeom = new THREE.BoxGeometry(0.04, 0.002, 0.04);
  const emblem = new THREE.Mesh(emblemGeom, metalMat);
  // Place near the guard on the blade
  emblem.position.set(0, 0.008, 0.08);
  root.add(emblem);

  // --- Guard (Crossguard) ---
  // Oval ring. Torus is in XY plane. We need it in XY but flattened in Z? 
  // No, sword guard is usually perpendicular to blade. 
  // Blade is along Z. Guard should be in XY plane.
  // Torus default is in XY. Perfect.
  // To make it oval (wider in X than Y? or wider in Z? Image shows elliptical guard).
  // The guard wraps around the handle. Handle is along Z. So guard is in XY plane.
  // It looks like an ellipse elongated along the X axis (width of sword).
  const guardRadius = 0.06;
  const guardTube = 0.012;
  const guardGeom = new THREE.TorusGeometry(guardRadius, guardTube, 16, 32);
  // Scale Z to make it an oval (elongated along the blade width axis? No, usually perpendicular)
  // Looking at image, the guard is an oval ring. Let's scale X to make it wider.
  guardGeom.scale(1.6, 1.0, 1.0); 

  const guard = new THREE.Mesh(guardGeom, metalMat);
  guard.position.set(0, 0, 0);
  root.add(guard);

  // --- Handle (Grip) ---
  // Faceted cylinder. Low radialSegments for facets.
  const handleGeom = new THREE.CylinderGeometry(
    handleRadius, 
    handleRadius, 
    handleLength, 
    8 // Octagonal facets
  );
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Cylinder is Y-up. We need it along Z. Rotate X by 90 deg.
  handle.rotation.x = Math.PI / 2;
  // Position: starts at guard (0) and goes negative Z
  handle.position.set(0, 0, -handleLength / 2);
  root.add(handle);

  // --- Pommel ---
  // Spherical end cap
  const pommelGeom = new THREE.SphereGeometry(pommelRadius, 32, 32);
  // Flatten slightly
  pommelGeom.scale(1.0, 1.0, 0.8);
  
  const pommel = new THREE.Mesh(pommelGeom, metalMat);
  pommel.position.set(0, 0, -handleLength - pommelRadius * 0.8);
  root.add(pommel);

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