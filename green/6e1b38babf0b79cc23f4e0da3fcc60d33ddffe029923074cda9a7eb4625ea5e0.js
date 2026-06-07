export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xE8D5B5,
    metalness: 0.0,
    roughness: 0.6,
  });

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dimensions
  const seatHeight = 0.45;
  const seatWidth = 0.52;
  const seatDepth = 0.48;
  const legHeight = 0.45;
  const backrestHeight = 0.88;
  const backrestWidth = 0.56;
  const backrestThickness = 0.025;

  // --- Seat ---
  // Rounded rectangle shape for the seat
  const seatShape = new THREE.Shape();
  const seatW = seatWidth / 2;
  const seatD = seatDepth / 2;
  const seatR = 0.04; // Corner radius
  seatShape.moveTo(-seatW + seatR, -seatD);
  seatShape.lineTo(seatW - seatR, -seatD);
  seatShape.quadraticCurveTo(seatW, -seatD, seatW, -seatD + seatR);
  seatShape.lineTo(seatW, seatD - seatR);
  seatShape.quadraticCurveTo(seatW, seatD, seatW - seatR, seatD);
  seatShape.lineTo(-seatW + seatR, seatD);
  seatShape.quadraticCurveTo(-seatW, seatD, -seatW, seatD - seatR);
  seatShape.lineTo(-seatW, -seatD + seatR);
  seatShape.quadraticCurveTo(-seatW, -seatD, -seatW + seatR, -seatD);

  const seatGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the extrusion
  seatGeom.translate(0, 0, -0.0125);
  // Rotate to lie flat in XZ plane (Extrude is along Z by default, we want Y up, so rotate X -90)
  // Actually, standard ExtrudeGeometry extrudes along Z. To make it a horizontal seat:
  // We need the shape in XY plane, extruded along Z? No, shape in XZ plane, extruded along Y.
  // Let's just rotate the mesh.
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.rotation.x = Math.PI / 2;
  seat.position.y = seatHeight;
  root.add(seat);

  // --- Backrest ---
  // Wide curved plank
  const backShape = new THREE.Shape();
  const bw = backrestWidth / 2;
  const bh = 0.14;
  const br = 0.03;
  backShape.moveTo(-bw + br, -bh / 2);
  backShape.lineTo(bw - br, -bh / 2);
  // Top edge is curved (arched)
  backShape.quadraticCurveTo(bw, -bh / 2, bw, 0);
  backShape.quadraticCurveTo(bw, bh / 2, bw - br, bh / 2);
  backShape.lineTo(-bw + br, bh / 2);
  backShape.quadraticCurveTo(-bw, bh / 2, -bw, 0);
  backShape.quadraticCurveTo(-bw, -bh / 2, -bw + br, -bh / 2);

  const backGeom = new THREE.ExtrudeGeometry(backShape, {
    depth: backrestThickness,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
  });
  // Center geometry
  backGeom.translate(0, 0, -backrestThickness / 2);
  
  const backrest = new THREE.Mesh(backGeom, woodMat);
  // Position: Behind seat, higher up
  backrest.position.set(0, backrestHeight, -0.18);
  // Slight tilt back
  backrest.rotation.x = -0.1;
  root.add(backrest);

  // --- Center Support Dowel ---
  const supportGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 12);
  const centerSupport = new THREE.Mesh(supportGeom, woodMat);
  centerSupport.position.set(0, seatHeight + 0.175, -0.15);
  centerSupport.rotation.x = -0.1; // Match backrest tilt
  root.add(centerSupport);

  // --- Front Legs ---
  // Tapered cylinders
  const frontLegGeom = new THREE.CylinderGeometry(0.022, 0.028, legHeight, 16);
  const frontLeftLeg = new THREE.Mesh(frontLegGeom, woodMat);
  frontLeftLeg.position.set(-seatW + 0.08, seatHeight / 2, seatD - 0.08);
  root.add(frontLeftLeg);

  const frontRightLeg = new THREE.Mesh(frontLegGeom, woodMat);
  frontRightLeg.position.set(seatW - 0.08, seatHeight / 2, seatD - 0.08);
  root.add(frontRightLeg);

  // --- Rear Legs ---
  // Curved tubes using CatmullRomCurve3
  // Path: Floor -> Under Seat -> Up to Backrest
  function createRearLegCurve(xSide) {
    const p1 = new THREE.Vector3(xSide * 0.24, 0, 0.22); // Floor, flared out
    const p2 = new THREE.Vector3(xSide * 0.22, seatHeight * 0.5, 0.10); // Mid, straightening
    const p3 = new THREE.Vector3(xSide * 0.22, seatHeight, 0.0); // Seat level
    const p4 = new THREE.Vector3(xSide * 0.22, backrestHeight - 0.05, -0.18); // Top, holding backrest
    
    return new THREE.CatmullRomCurve3([p1, p2, p3, p4], false, 'centripetal', 0.5);
  }

  const rearLegTubeGeom = new THREE.TubeGeometry(createRearLegCurve(-1), 20, 0.024, 12, false);
  const rearLeftLeg = new THREE.Mesh(rearLegTubeGeom, woodMat);
  root.add(rearLeftLeg);

  const rearRightLegTubeGeom = new THREE.TubeGeometry(createRearLegCurve(1), 20, 0.024, 12, false);
  const rearRightLeg = new THREE.Mesh(rearRightLegTubeGeom, woodMat);
  root.add(rearRightLeg);

  // --- Foot Pads ---
  const padGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12);
  
  const padFL = new THREE.Mesh(padGeom, padMat);
  padFL.position.set(-seatW + 0.08, 0.004, seatD - 0.08);
  root.add(padFL);

  const padFR = new THREE.Mesh(padGeom, padMat);
  padFR.position.set(seatW - 0.08, 0.004, seatD - 0.08);
  root.add(padFR);

  // Rear pads need to follow the leg bottom position
  const padRL = new THREE.Mesh(padGeom, padMat);
  padRL.position.set(-0.24, 0.004, 0.22);
  root.add(padRL);

  const padRR = new THREE.Mesh(padGeom, padMat);
  padRR.position.set(0.24, 0.004, 0.22);
  root.add(padRR);

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