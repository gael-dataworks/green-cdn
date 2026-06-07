export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Walls: Light beige/off-white, matte finish.
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Roof: Medium grey, slightly smoother than walls but still matte.
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x808088,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Dimensions
  const wallWidth = 0.50;
  const wallHeight = 0.45;
  const wallDepth = 0.45;
  
  const roofOverhang = 0.08;
  const roofBaseWidth = wallWidth + (roofOverhang * 2);
  const roofHeight = 0.38;
  const roofDepth = wallDepth + 0.02; // Slightly deeper than walls for realism

  // 1. Walls (Main Body)
  // Simple box geometry centered at origin.
  const wallsGeom = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
  const walls = new THREE.Mesh(wallsGeom, wallMat);
  // Position so the bottom is at y=0 (optional, but good for logic)
  // Actually, let's keep everything centered around 0,0,0 for fitToUnitCube to work best.
  // BoxGeometry is centered, so walls are at 0,0,0.
  root.add(walls);

  // 2. Roof
  // Use ExtrudeGeometry to create the gable shape with overhangs.
  const roofShape = new THREE.Shape();
  // Start at bottom left of the roof triangle (including overhang)
  // Relative to the roof's local origin (which we will position on top of walls)
  const halfBase = roofBaseWidth / 2;
  
  roofShape.moveTo(-halfBase, 0);
  roofShape.lineTo(halfBase, 0);
  roofShape.lineTo(0, roofHeight);
  roofShape.closePath();

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: roofDepth,
    bevelEnabled: false,
  });

  const roof = new THREE.Mesh(roofGeom, roofMat);
  
  // Position the roof on top of the walls.
  // Walls extend from -wallHeight/2 to +wallHeight/2.
  // Roof local Y=0 is the bottom of the triangle.
  // So we place roof at y = wallHeight / 2.
  roof.position.y = wallHeight / 2;
  
  // Center the roof in Z. Extrude goes from 0 to depth.
  // We want it centered, so shift by -depth/2.
  roof.position.z = -roofDepth / 2;

  root.add(roof);

  // Normalize to fit unit cube
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