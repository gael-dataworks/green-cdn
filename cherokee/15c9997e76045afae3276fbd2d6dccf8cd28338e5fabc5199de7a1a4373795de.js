export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const wallWidth = 0.60;
  const wallHeight = 0.50;
  const wallDepth = 0.50;
  
  const roofOverhang = 0.08;
  const roofTotalWidth = wallWidth + 2 * roofOverhang;
  const roofPeakHeight = 0.45; // Height of the triangle part
  const roofDepth = wallDepth + 2 * roofOverhang;

  // --- Materials ---
  // Walls: Light warm grey/beige, matte
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe3e1dc,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Roof: Cool medium grey, slightly smoother
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x8c929d,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Geometry: Walls ---
  // Simple box centered at origin
  const wallsGeom = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
  const walls = new THREE.Mesh(wallsGeom, wallMat);
  // Position so bottom is at y=0 (optional, but good for logic)
  // Actually, let's keep everything centered around 0 for fitToUnitCube to work best,
  // but logically stack them.
  // BoxGeometry is centered. So walls center is at (0,0,0).
  // Top of walls is at wallHeight/2.
  walls.position.y = 0; 
  root.add(walls);

  // --- Geometry: Roof ---
  // We need a triangular prism. ExtrudeGeometry is perfect.
  // Shape needs to be defined in XY plane.
  // To make positioning easy, let's define the triangle such that its centroid is at (0,0).
  // Triangle vertices: (-w/2, y_base), (0, y_peak), (w/2, y_base)
  // Centroid Y = (y_base + y_peak + y_base) / 3 = (2*y_base + y_peak) / 3 = 0
  // => 2*y_base = -y_peak => y_base = -y_peak / 2.
  // Let y_peak = roofPeakHeight * (2/3) * 2 ? No.
  // Let's just calculate offsets.
  // Height of triangle = roofPeakHeight.
  // Centroid is 1/3 from the base.
  // So if base is at y = -roofPeakHeight/3, peak is at y = 2*roofPeakHeight/3.
  
  const roofBaseY = -roofPeakHeight / 3;
  const roofPeakY = 2 * roofPeakHeight / 3;
  const halfRoofWidth = roofTotalWidth / 2;

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-halfRoofWidth, roofBaseY);
  roofShape.lineTo(0, roofPeakY);
  roofShape.lineTo(halfRoofWidth, roofBaseY);
  roofShape.lineTo(-halfRoofWidth, roofBaseY); // Close loop

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: roofDepth,
    bevelEnabled: false,
  });

  // ExtrudeGeometry extrudes along Z. The shape is in XY.
  // The geometry is centered in Z (from -depth/2 to depth/2).
  // The geometry is NOT centered in Y automatically based on shape bounds, 
  // but we constructed the shape to have centroid at 0,0.
  // So the mesh center is at the triangle centroid.
  
  const roof = new THREE.Mesh(roofGeom, roofMat);
  
  // Positioning:
  // Walls top is at wallHeight/2.
  // Roof base (in local space) is at roofBaseY.
  // We want Roof local base Y to align with Walls top Y.
  // roof.position.y + roofBaseY = wallHeight / 2
  // roof.position.y = wallHeight / 2 - roofBaseY
  // roof.position.y = wallHeight / 2 - (-roofPeakHeight / 3)
  // roof.position.y = wallHeight / 2 + roofPeakHeight / 3
  
  roof.position.y = (wallHeight / 2) + (roofPeakHeight / 3);
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