export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Polished Gold ---
  // Using metalness 0.6 (hard cap) and a warm gold color.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE5C165,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry: Single "Paperclip" Link ---
  // Constructed using TubeGeometry along a CatmullRomCurve3 path.
  // This creates a closed loop with straight sides and rounded ends (stadium shape)
  // and a circular cross-section (round wire).
  const linkLength = 0.14; // Half-length of the straight section
  const linkWidth = 0.05;  // Half-width of the straight section
  const tubeRadius = 0.022; // Thickness of the wire

  // Define the path points for the stadium shape in the XZ plane (Y=0)
  // We use extra points to ensure the CatmullRomCurve3 creates straight sections
  // and tight corners.
  const points = [
    new THREE.Vector3(-linkLength, 0, -linkWidth),
    new THREE.Vector3(-linkLength, 0, -linkWidth * 0.5), // Control for straightness
    new THREE.Vector3(-linkLength, 0, linkWidth),
    new THREE.Vector3(-linkLength * 0.5, 0, linkWidth),  // Control for straightness
    new THREE.Vector3(linkLength, 0, linkWidth),
    new THREE.Vector3(linkLength, 0, linkWidth * 0.5),   // Control for straightness
    new THREE.Vector3(linkLength, 0, -linkWidth),
    new THREE.Vector3(linkLength * 0.5, 0, -linkWidth),  // Control for straightness
  ];

  // 'centripetal' prevents loops at sharp corners, 0.5 tension keeps it tight
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  const linkGeom = new THREE.TubeGeometry(curve, 64, tubeRadius, 12, true);

  // --- Assembly: Chain Bracelet ---
  const linkCount = 14;
  const braceletRadius = 0.28; // Radius of the circle formed by the links

  const instancedMesh = new THREE.InstancedMesh(linkGeom, goldMat, linkCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < linkCount; i++) {
    // Angle around the bracelet circle
    const angle = (i / linkCount) * Math.PI * 2;

    // Position on the circle (XZ plane)
    const x = Math.cos(angle) * braceletRadius;
    const z = Math.sin(angle) * braceletRadius;
    const y = 0;

    dummy.position.set(x, y, z);

    // Orientation:
    // 1. Face tangent to the circle (rotate around Y)
    dummy.rotation.y = -angle;

    // 2. Lay flat in the XZ plane initially (Torus/Tube default is vertical, so rotate X 90)
    // Wait, TubeGeometry follows the path. The path is in XZ plane.
    // So the link naturally lies flat in XZ.
    // However, we need to alternate orientation to interlock them.
    // Link 0: Flat (XZ plane).
    // Link 1: Vertical (Perpendicular to Link 0).
    
    if (i % 2 === 0) {
      // Flat link: Already in XZ plane due to path definition.
      // Just ensure it's oriented correctly relative to the tangent.
      // The path is in XZ. The mesh local Y is "up" from the path plane.
      // We want the link to lie flat.
      dummy.rotation.set(Math.PI / 2, -angle, 0); 
      // Correction: 
      // Path is in XZ. Tube normal is Y.
      // To lay flat in XZ, we need the Tube's "hole" axis to be Y.
      // Default Tube follows path in XY? No, path is 3D.
      // If path is in XZ (y=0), the tube lies in XZ.
      // So rotation.x = 0, rotation.z = 0 keeps it in XZ.
      // But we rotated Y to face tangent.
      // So: rotation.set(0, -angle, 0).
      dummy.rotation.set(0, -angle, 0);
    } else {
      // Vertical link: Rotate 90 degrees around local Z (which is now tangent?)
      // No, rotate around the local axis that makes it stand up.
      // If it's flat in XZ, rotating around X makes it stand in YZ.
      // Rotating around Z makes it stand in XY.
      // We want it perpendicular to the previous link.
      // Previous link is in XZ (rotated by angle).
      // This link should be in a plane perpendicular to XZ.
      // So rotate 90 deg around the local X axis (which points radially outward after Y rotation).
      dummy.rotation.set(Math.PI / 2, -angle, 0);
    }

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  root.add(instancedMesh);

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