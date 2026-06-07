export default function generate(THREE) {
  // Materials
  // Blade: Dark painted metal or wood, matte finish
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Handle: Dark wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Ferrule: Bronze/Copper metal
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Rivets: Dull steel
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.4,
    roughness: 0.5,
  });

  // Hole in handle: Dark interior
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  const root = new THREE.Group();

  // --- Blade ---
  // Define the 2D shape of the paddle blade in the XY plane.
  // Y axis will correspond to the length of the paddle.
  // X axis will correspond to the width.
  const bladeShape = new THREE.Shape();
  
  // Start at the top left corner (where handle attaches)
  const topWidth = 0.14;
  const bottomWidth = 0.35;
  const bladeLength = 1.0;
  
  bladeShape.moveTo(-topWidth, 0);
  bladeShape.lineTo(topWidth, 0);
  
  // Taper out to the main body
  bladeShape.lineTo(bottomWidth, -bladeLength * 0.6);
  
  // Rounded bottom tip
  // Quadratic curve to round the bottom
  bladeShape.quadraticCurveTo(bottomWidth, -bladeLength, 0, -bladeLength);
  bladeShape.quadraticCurveTo(-bottomWidth, -bladeLength, -bottomWidth, -bladeLength * 0.6);
  
  // Taper back to top left
  bladeShape.lineTo(-topWidth, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.025,          // Thickness of the blade
    bevelEnabled: true,
    bevelThickness: 0.015, // Rounding on the edges
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1
  });

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate 90 deg around X to lie flat in the XZ plane.
  // Local Y (length) becomes World -Z.
  // Local X (width) stays World X.
  // Local Z (thickness) becomes World Y.
  blade.rotation.x = Math.PI / 2;
  
  // Position adjustment:
  // The shape goes from Y=0 to Y=-1.0.
  // After rotation, it goes from Z=0 to Z=1.0.
  // We want the handle to attach at Z=0.
  // So we leave it at origin for Z, but need to lift it slightly so the center is reasonable.
  // Actually, let's just keep the connection point at Z=0.
  root.add(blade);

  // --- Handle ---
  // Tapered cylinder
  const handleRadiusTop = 0.05;
  const handleRadiusBottom = 0.07;
  const handleLength = 0.35;
  
  const handleGeom = new THREE.CylinderGeometry(
    handleRadiusTop, 
    handleRadiusBottom, 
    handleLength, 
    16
  );
  
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Rotate to align with Z axis (default is Y)
  handle.rotation.x = Math.PI / 2;
  // Position: Attach to the start of the blade (Z=0)
  // Extend backwards to negative Z.
  handle.position.z = -handleLength / 2;
  root.add(handle);

  // --- Handle Hole ---
  // Small cylinder at the end of the handle
  const holeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 12);
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.rotation.x = Math.PI / 2;
  hole.position.z = -handleLength / 2 - 0.02; // Slightly inset from the very end
  root.add(hole);

  // --- Ferrule (Metal Plate) ---
  // Connects handle to blade
  const ferruleWidth = 0.22;
  const ferruleLength = 0.12;
  const ferruleThick = 0.015;
  
  const ferruleGeom = new THREE.BoxGeometry(ferruleWidth, ferruleThick, ferruleLength);
  const ferrule = new THREE.Mesh(ferruleGeom, metalMat);
  // Position on top of the blade connection point
  // Blade top surface is at Y = thickness/2 + bevel approx 0.025
  // Let's place it slightly above the blade surface.
  ferrule.position.set(0, 0.025 + 0.005, -ferruleLength / 2 + 0.02); 
  // Wait, blade connection is at Z=0. Ferrule should overlap the handle start and blade start.
  // Handle starts at Z=0 (center -0.175). Blade starts at Z=0.
  // Ferrule center should be around Z = -0.05 (half on handle, half on blade).
  ferrule.position.z = -0.05;
  root.add(ferrule);

  // --- Rivets ---
  // Two rivets on the ferrule
  const rivetGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
  rivetGeom.rotateX(Math.PI / 2); // Flatten to sit on ferrule
  
  const rivetOffsetX = 0.07;
  const rivetZ = -0.05; // Same Z as ferrule center
  const rivetY = 0.025 + 0.005 + 0.0075; // Ferrule top + half rivet height
  
  const rivetLeft = new THREE.Mesh(rivetGeom, rivetMat);
  rivetLeft.position.set(-rivetOffsetX, rivetY, rivetZ);
  root.add(rivetLeft);

  const rivetRight = new THREE.Mesh(rivetGeom, rivetMat);
  rivetRight.position.set(rivetOffsetX, rivetY, rivetZ);
  root.add(rivetRight);

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