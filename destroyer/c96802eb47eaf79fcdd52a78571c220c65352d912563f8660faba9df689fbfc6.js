export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials - matching reference appearance
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    metalness: 0.0,
    roughness: 0.6,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x6b7a6a,
    metalness: 0.5,
    roughness: 0.5,
  });

  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x8b8b7a,
    metalness: 0.6,
    roughness: 0.4,
  });

  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Blade/paddle body - extruded custom shape with rounded corners
  const bladeShape = new THREE.Shape();
  const bladeW = 0.52;
  const bladeL = 0.88;
  const bladeT = 0.022;
  const cornerR = 0.06;

  // Draw paddle outline (pointing toward +Z, wide end at -Z)
  const hw = bladeW / 2;
  const hl = bladeL / 2;
  const taperStart = hl * 0.35;

  bladeShape.moveTo(-hw, -hl + cornerR);
  bladeShape.lineTo(-hw, hl - taperStart);
  bladeShape.quadraticCurveTo(-hw * 0.6, hl, -hw * 0.35, hl);
  bladeShape.lineTo(hw * 0.35, hl);
  bladeShape.quadraticCurveTo(hw * 0.6, hl, hw, hl - taperStart);
  bladeShape.lineTo(hw, -hl + cornerR);
  bladeShape.quadraticCurveTo(hw, -hl, hw - cornerR, -hl);
  bladeShape.lineTo(-hw + cornerR, -hl);
  bladeShape.quadraticCurveTo(-hw, -hl, -hw, -hl + cornerR);
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: bladeT,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
    steps: 1,
  });

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.rotation.x = Math.PI / 2;
  blade.position.y = 0;
  root.add(blade);

  // Handle - tapered wooden cylinder
  const handleL = 0.22;
  const handleBaseR = 0.042;
  const handleTipR = 0.032;
  const handleGeom = new THREE.CylinderGeometry(handleTipR, handleBaseR, handleL, 16);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.z = hl + handleL / 2 - 0.015;
  handle.position.y = 0.008;
  root.add(handle);

  // Metal ferrule plate - rounded rectangle connecting handle to blade
  const plateW = 0.11;
  const plateL = 0.075;
  const plateT = 0.005;
  const plateShape = new THREE.Shape();
  const pw2 = plateW / 2;
  const pl2 = plateL / 2;
  const pr = 0.015;

  plateShape.moveTo(-pw2 + pr, -pl2);
  plateShape.lineTo(pw2 - pr, -pl2);
  plateShape.quadraticCurveTo(pw2, -pl2, pw2, -pl2 + pr);
  plateShape.lineTo(pw2, pl2 - pr);
  plateShape.quadraticCurveTo(pw2, pl2, pw2 - pr, pl2);
  plateShape.lineTo(-pw2 + pr, pl2);
  plateShape.quadraticCurveTo(-pw2, pl2, -pw2, pl2 - pr);
  plateShape.lineTo(-pw2, -pl2 + pr);
  plateShape.quadraticCurveTo(-pw2, -pl2, -pw2 + pr, -pl2);
  plateShape.closePath();

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: plateT,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });

  const plate = new THREE.Mesh(plateGeom, metalMat);
  plate.position.z = hl - 0.015;
  plate.position.y = bladeT / 2 + plateT / 2 + 0.002;
  root.add(plate);

  // Rivets (2 visible on the metal plate)
  const rivetR = 0.007;
  const rivetH = 0.01;
  const rivetGeom = new THREE.CylinderGeometry(rivetR, rivetR, rivetH, 12);

  for (const rz of [-0.022, 0.022]) {
    const rivet = new THREE.Mesh(rivetGeom, rivetMat);
    rivet.position.set(0, bladeT / 2 + rivetH / 2 + 0.002, hl - 0.015 + rz);
    root.add(rivet);
  }

  // Handle hole at the end (for hanging)
  const holeR = 0.011;
  const holeD = 0.01;
  const holeGeom = new THREE.CylinderGeometry(holeR, holeR, holeD, 16);
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.rotation.x = Math.PI / 2;
  hole.position.z = hl + handleL - 0.025;
  hole.position.y = 0.012;
  root.add(hole);

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