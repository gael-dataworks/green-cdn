export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcb8,
    metalness: 0.0,
    roughness: 0.65,
  });

  const footPadMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Seat - slightly curved wooden panel
  const seatShape = new THREE.Shape();
  const seatW = 0.42;
  const seatD = 0.38;
  seatShape.moveTo(-seatW / 2, -seatD / 2);
  seatShape.lineTo(seatW / 2, -seatD / 2);
  seatShape.quadraticCurveTo(seatW / 2 + 0.02, 0, seatW / 2, seatD / 2);
  seatShape.quadraticCurveTo(0, seatD / 2 + 0.02, -seatW / 2, seatD / 2);
  seatShape.quadraticCurveTo(-seatW / 2 - 0.02, 0, -seatW / 2, -seatD / 2);
  seatShape.closePath();

  const seatGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 3,
    steps: 1,
  });
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.rotation.x = Math.PI / 2;
  seat.position.y = 0.38;
  root.add(seat);

  // Backrest - curved horizontal panel
  const backrestShape = new THREE.Shape();
  const backrestW = 0.44;
  const backrestH = 0.14;
  backrestShape.moveTo(-backrestW / 2, -backrestH / 2);
  backrestShape.quadraticCurveTo(0, -backrestH / 2 - 0.015, backrestW / 2, -backrestH / 2);
  backrestShape.lineTo(backrestW / 2, backrestH / 2);
  backrestShape.quadraticCurveTo(0, backrestH / 2 + 0.02, -backrestW / 2, backrestH / 2);
  backrestShape.lineTo(-backrestW / 2, -backrestH / 2);
  backrestShape.closePath();

  const backrestGeom = new THREE.ExtrudeGeometry(backrestShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
  });
  const backrest = new THREE.Mesh(backrestGeom, woodMat);
  backrest.position.set(0, 0.68, -0.14);
  backrest.rotation.x = -0.08;
  root.add(backrest);

  // Front legs - cylindrical with slight outward angle
  const frontLegGeom = new THREE.CylinderGeometry(0.028, 0.032, 0.38, 16);
  const frontLeftLeg = new THREE.Mesh(frontLegGeom, woodMat);
  frontLeftLeg.position.set(-0.16, 0.19, 0.14);
  frontLeftLeg.rotation.z = 0.06;
  root.add(frontLeftLeg);

  const frontRightLeg = new THREE.Mesh(frontLegGeom, woodMat);
  frontRightLeg.position.set(0.16, 0.19, 0.14);
  frontRightLeg.rotation.z = -0.06;
  root.add(frontRightLeg);

  // Back legs - curved, extending up to support backrest
  // Use tube geometry for the curved shape
  const backLegCurveLeft = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.17, 0.0, 0.12),
    new THREE.Vector3(-0.18, 0.15, 0.08),
    new THREE.Vector3(-0.19, 0.35, -0.05),
    new THREE.Vector3(-0.20, 0.55, -0.12),
    new THREE.Vector3(-0.18, 0.72, -0.14),
  ]);
  const backLegGeom = new THREE.TubeGeometry(backLegCurveLeft, 24, 0.030, 12, false);
  const backLeftLeg = new THREE.Mesh(backLegGeom, woodMat);
  root.add(backLeftLeg);

  const backLegCurveRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.17, 0.0, 0.12),
    new THREE.Vector3(0.18, 0.15, 0.08),
    new THREE.Vector3(0.19, 0.35, -0.05),
    new THREE.Vector3(0.20, 0.55, -0.12),
    new THREE.Vector3(0.18, 0.72, -0.14),
  ]);
  const backRightLeg = new THREE.Mesh(new THREE.TubeGeometry(backLegCurveRight, 24, 0.030, 12, false), woodMat);
  root.add(backRightLeg);

  // Center support post under seat
  const centerSupportGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.28, 12);
  const centerSupport = new THREE.Mesh(centerSupportGeom, woodMat);
  centerSupport.position.set(0, 0.22, -0.08);
  root.add(centerSupport);

  // Foot pads - small black discs on each leg bottom
  const footPadGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.006, 12);
  
  const footPadFL = new THREE.Mesh(footPadGeom, footPadMat);
  footPadFL.position.set(-0.16, 0.003, 0.14);
  root.add(footPadFL);

  const footPadFR = new THREE.Mesh(footPadGeom, footPadMat);
  footPadFR.position.set(0.16, 0.003, 0.14);
  root.add(footPadFR);

  const footPadBL = new THREE.Mesh(footPadGeom, footPadMat);
  footPadBL.position.set(-0.17, 0.003, 0.12);
  root.add(footPadBL);

  const footPadBR = new THREE.Mesh(footPadGeom, footPadMat);
  footPadBR.position.set(0.17, 0.003, 0.12);
  root.add(footPadBR);

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