export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  // Normalized dimensions before fitToUnitCube scaling
  const bodyWidth = 0.8;
  const bodyDepth = 0.5;
  const eavesHeight = 0.6;
  const roofHeight = 0.5;
  const roofOverhangX = 0.15; // Horizontal overhang on sides
  const roofOverhangZ = 0.1;  // Horizontal overhang on front/back
  const roofThickness = 0.05;

  const totalHeight = eavesHeight + roofHeight;
  const roofRun = bodyWidth / 2 + roofOverhangX;
  const roofSlantLength = Math.sqrt(roofRun * roofRun + roofHeight * roofHeight);
  const roofSlabDepth = bodyDepth + 2 * roofOverhangZ;

  // --- Materials ---
  // Body: Light warm grey/white, matte
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xeaeaea,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Roof: Slate grey/blue, slightly smoother but still matte
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Geometry: Main House Body (Pentagon Prism) ---
  // Creates the walls and the gable end in one solid piece
  const houseShape = new THREE.Shape();
  houseShape.moveTo(-bodyWidth / 2, 0);
  houseShape.lineTo(-bodyWidth / 2, eavesHeight);
  houseShape.lineTo(0, eavesHeight + roofHeight);
  houseShape.lineTo(bodyWidth / 2, eavesHeight);
  houseShape.lineTo(bodyWidth / 2, 0);
  houseShape.lineTo(-bodyWidth / 2, 0);

  const houseGeom = new THREE.ExtrudeGeometry(houseShape, {
    depth: bodyDepth,
    bevelEnabled: false,
  });
  // Center the extrusion in Z (it extrudes from 0 to depth by default)
  houseGeom.translate(0, 0, -bodyDepth / 2);

  const houseMesh = new THREE.Mesh(houseGeom, bodyMat);
  root.add(houseMesh);

  // --- Geometry: Roof Slabs ---
  // Two slanted boxes forming the roof
  const roofSlabGeom = new THREE.BoxGeometry(roofSlantLength, roofThickness, roofSlabDepth);

  // Calculate rotation angle for the roof slope
  const roofAngle = Math.atan2(roofHeight, roofRun);

  // Helper to create a roof slab
  function createRoofSlab(side) {
    const mesh = new THREE.Mesh(roofSlabGeom, roofMat);
    
    // Position the center of the slab at the midpoint of the slant line
    // X: Halfway between center (0) and edge of overhang (side * roofRun)
    const posX = side * (roofRun / 2);
    // Y: Halfway between eaves height and peak height
    const posY = eavesHeight + (roofHeight / 2);
    // Z: Centered
    const posZ = 0;

    mesh.position.set(posX, posY, posZ);
    
    // Rotate around Z axis. 
    // Right side (side=1): Negative angle (slopes down to right)
    // Left side (side=-1): Positive angle (slopes down to left)
    mesh.rotation.z = -side * roofAngle;

    return mesh;
  }

  const roofLeft = createRoofSlab(-1);
  const roofRight = createRoofSlab(1);

  root.add(roofLeft);
  root.add(roofRight);

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