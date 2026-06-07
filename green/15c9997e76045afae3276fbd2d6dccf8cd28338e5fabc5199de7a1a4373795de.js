export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const houseWidth = 0.70;
  const houseDepth = 0.35;
  const wallHeight = 0.45;
  const roofHeight = 0.40;
  const roofOverhang = 0.12;
  
  const roofBaseWidth = houseWidth + (roofOverhang * 2);

  // --- Materials ---
  // Walls: Matte off-white/beige plaster or stucco
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe8e6e1,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Roof: Smooth gray painted metal or slate
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.3,
    roughness: 0.4,
  });

  // --- Walls ---
  // Simple box for the main body
  const wallsGeom = new THREE.BoxGeometry(houseWidth, wallHeight, houseDepth);
  const walls = new THREE.Mesh(wallsGeom, wallMat);
  // Position so bottom is at y=0
  walls.position.y = wallHeight / 2;
  root.add(walls);

  // --- Roof ---
  // Triangular prism using ExtrudeGeometry
  const roofShape = new THREE.Shape();
  const halfBase = roofBaseWidth / 2;
  
  // Draw triangle profile in XY plane
  roofShape.moveTo(-halfBase, 0);
  roofShape.lineTo(0, roofHeight);
  roofShape.lineTo(halfBase, 0);
  roofShape.lineTo(-halfBase, 0); // Close loop

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: houseDepth,
    bevelEnabled: false,
  });

  const roof = new THREE.Mesh(roofGeom, roofMat);
  // Center the extrusion
  roof.position.x = 0;
  roof.position.y = wallHeight; // Sit on top of walls
  roof.position.z = 0;
  
  // The extrusion happens along +Z from 0 to depth. Center it.
  roof.position.z = -houseDepth / 2;

  root.add(roof);

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