export default function generate(THREE) {
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x909090,
    metalness: 0.6,
    roughness: 0.5,
  });

  const root = new THREE.Group();

  // Dimensions
  const plateThickness = 0.012;
  
  // === BASE FLANGE PLATE ===
  // 4-lobed irregular outline with 4 mounting holes
  const flangeShape = new THREE.Shape();
  
  // Draw the 4-lobed outline (CCW from bottom)
  flangeShape.moveTo(-0.12, -0.23);
  flangeShape.quadraticCurveTo(0, -0.25, 0.12, -0.23);
  flangeShape.quadraticCurveTo(0.27, -0.16, 0.29, 0);
  flangeShape.quadraticCurveTo(0.27, 0.16, 0.15, 0.23);
  flangeShape.quadraticCurveTo(0, 0.25, -0.12, 0.23);
  flangeShape.quadraticCurveTo(-0.27, 0.16, -0.29, 0.08);
  flangeShape.lineTo(-0.29, -0.08);
  flangeShape.quadraticCurveTo(-0.27, -0.16, -0.12, -0.23);
  
  // Add 4 mounting holes as cutouts
  const holeR = 0.035;
  const holePositions = [
    [-0.19, -0.16],
    [0.19, -0.16],
    [0.19, 0.16],
    [-0.19, 0.16],
  ];
  for (const [hx, hy] of holePositions) {
    const hole = new THREE.Path();
    hole.absarc(hx, hy, holeR, 0, Math.PI * 2, false);
    flangeShape.holes.push(hole);
  }

  const flangeGeom = new THREE.ExtrudeGeometry(flangeShape, {
    depth: plateThickness,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  const flangePlate = new THREE.Mesh(flangeGeom, metalMat);
  root.add(flangePlate);

  // === CENTRAL COLLAR using LatheGeometry ===
  // Profile defines cross-section from inner radius outward, Y goes upward from plate
  const collarProfile = [
    new THREE.Vector2(0.125, 0),
    new THREE.Vector2(0.125, 0.055),
    new THREE.Vector2(0.135, 0.055),
    new THREE.Vector2(0.135, 0.040),
    new THREE.Vector2(0.155, 0.040),
    new THREE.Vector2(0.155, 0.020),
    new THREE.Vector2(0.180, 0.020),
    new THREE.Vector2(0.180, 0),
    new THREE.Vector2(0.125, 0),
  ];
  
  const collarGeom = new THREE.LatheGeometry(collarProfile, 48);
  const collar = new THREE.Mesh(collarGeom, metalMat);
  collar.position.y = plateThickness;
  root.add(collar);

  // === EMBOSSED MARKING on right lobe ===
  const markShape = new THREE.Shape();
  markShape.moveTo(0, 0);
  markShape.lineTo(0.02, 0);
  markShape.lineTo(0.02, 0.008);
  markShape.lineTo(0, 0.008);
  markShape.lineTo(0, 0);
  
  const markGeom = new THREE.ExtrudeGeometry(markShape, {
    depth: 0.002,
    bevelEnabled: false,
    steps: 1,
  });
  const mark = new THREE.Mesh(markGeom, metalMat);
  mark.rotation.x = Math.PI / 2;
  mark.position.set(0.21, plateThickness + 0.002, 0.10);
  root.add(mark);

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