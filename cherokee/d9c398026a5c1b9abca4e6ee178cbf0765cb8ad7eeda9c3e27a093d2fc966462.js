export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x4a75d6,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Material: Dark interior for the hole (simulates depth/shadow)
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a2f5c,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Main Body ---
  // Constructed via ExtrudeGeometry from a side profile (X, Y plane)
  // Extruded along Z axis for width.
  const bodyShape = new THREE.Shape();
  
  // Trace perimeter counter-clockwise
  // 1. Front Bottom
  bodyShape.moveTo(0.45, -0.25);
  // 2. Front Top
  bodyShape.lineTo(0.45, 0.15);
  // 3. Back Top (highest point, sloped)
  bodyShape.lineTo(-0.35, 0.35);
  // 4. Back Vertical drop to lower block level
  bodyShape.lineTo(-0.35, 0.05);
  // 5. Lower Block Back Bottom
  bodyShape.lineTo(-0.35, -0.45);
  // 6. Lower Block Front Bottom
  bodyShape.lineTo(-0.15, -0.45);
  // 7. Lower Block Front Top (connects to main body bottom)
  bodyShape.lineTo(-0.15, -0.25);
  // Close is implicit to moveTo

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.7,          // Width along Z
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });

  // Center the geometry locally so transformations are easier
  bodyGeom.center();

  const body = new THREE.Mesh(bodyGeom, blueMat);
  root.add(body);

  // --- Hole ---
  // A dark cylinder placed on the top slope to simulate a hole.
  // The hole appears vertical (Y-axis), intersecting the slanted top.
  const holeGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 24);
  const hole = new THREE.Mesh(holeGeom, holeMat);
  
  // Position on the top slope, towards the rear
  // Approximate based on profile: X is slightly behind center, Y is high
  hole.position.set(-0.1, 0.25, 0);
  
  root.add(hole);

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