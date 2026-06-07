export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.1,
    roughness: 0.4,
  });

  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.5,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.0,
    roughness: 0.3,
  });

  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.4,
    roughness: 0.4,
  });

  // --- Main Orange Body ---
  // Profile in XY plane, extruded along Z (width)
  const bodyShape = new THREE.Shape();
  // Rear bottom
  bodyShape.moveTo(0, 0);
  // Rear top
  bodyShape.lineTo(0, 0.13);
  // Top handle curve
  bodyShape.lineTo(0.35, 0.13);
  // Top body taper
  bodyShape.lineTo(0.7, 0.11);
  // Neck start
  bodyShape.lineTo(0.85, 0.09);
  // Front orange tip
  bodyShape.lineTo(0.95, 0.05);
  // Bottom front
  bodyShape.lineTo(0.85, -0.04);
  // Bottom body
  bodyShape.lineTo(0.35, -0.04);
  // Bottom rear curve
  bodyShape.lineTo(0, 0);

  const bodyExtrudeSettings = {
    steps: 1,
    depth: 0.14, // Width of the tool
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
  // Center the geometry roughly
  bodyGeom.translate(-0.45, -0.04, -0.07);
  const mainBody = new THREE.Mesh(bodyGeom, orangeMat);
  root.add(mainBody);

  // --- Black Head Housing ---
  // Angled box/cone hybrid
  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0);
  headShape.lineTo(0, 0.08);
  headShape.lineTo(0.25, 0.06);
  headShape.lineTo(0.25, -0.06);
  headShape.lineTo(0, -0.04);
  headShape.lineTo(0, 0);

  const headExtrudeSettings = {
    steps: 1,
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  };

  const headGeom = new THREE.ExtrudeGeometry(headShape, headExtrudeSettings);
  headGeom.translate(-0.12, -0.02, -0.075);
  const headHousing = new THREE.Mesh(headGeom, blackPlasticMat);
  // Position at front of body and angle down
  headHousing.position.set(0.92, 0.02, 0);
  headHousing.rotation.z = -Math.PI / 8; // ~22 degrees down
  root.add(headHousing);

  // --- Base Plate (Sanding/Cutting Pad) ---
  const plateShape = new THREE.Shape();
  // Rounded triangle-ish shape
  const r = 0.06;
  plateShape.moveTo(0.15, 0);
  plateShape.lineTo(0.05, 0.12);
  plateShape.quadraticCurveTo(0, 0.12, -0.05, 0.12);
  plateShape.lineTo(-0.15, 0);
  plateShape.quadraticCurveTo(-0.15, -0.05, -0.12, -0.08);
  plateShape.lineTo(0.12, -0.08);
  plateShape.quadraticCurveTo(0.15, -0.05, 0.15, 0);

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.015,
    bevelEnabled: false,
  });
  // Center and orient
  plateGeom.rotateX(Math.PI / 2); // Flat in XZ
  plateGeom.translate(0.18, -0.12, 0); // Attach to bottom of head

  const basePlate = new THREE.Mesh(plateGeom, metalMat);
  // Match head rotation
  basePlate.position.copy(headHousing.position);
  basePlate.rotation.copy(headHousing.rotation);
  // Adjust local position relative to head
  basePlate.position.x += 0.15;
  basePlate.position.y -= 0.08;
  root.add(basePlate);

  // --- Vents (Side Grilles) ---
  const ventGroup = new THREE.Group();
  const ventGeom = new THREE.BoxGeometry(0.04, 0.008, 0.005);
  // Position on the side of the orange body (positive Z side in local extrusion space)
  // Body width is 0.14, centered at 0, so side is at Z = 0.07
  const ventZ = 0.075;
  const ventStartX = 0.15;
  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(ventGeom, blackPlasticMat);
    vent.position.set(ventStartX + i * 0.05, 0.04, ventZ);
    ventGroup.add(vent);
  }
  root.add(ventGroup);

  // --- Switch ---
  const switchGeom = new THREE.BoxGeometry(0.06, 0.025, 0.008);
  const toolSwitch = new THREE.Mesh(switchGeom, blackPlasticMat);
  // Position on side, near rear
  toolSwitch.position.set(0.15, 0.02, ventZ + 0.005);
  root.add(toolSwitch);

  // --- Labels ---
  // Label 1: "SUPER POWER" area
  const label1Geom = new THREE.PlaneGeometry(0.12, 0.04);
  const label1 = new THREE.Mesh(label1Geom, labelMat);
  label1.position.set(0.45, 0.05, ventZ + 0.006);
  root.add(label1);

  // Label 2: "180W" area
  const label2Geom = new THREE.PlaneGeometry(0.08, 0.03);
  const label2 = new THREE.Mesh(label2Geom, labelMat);
  label2.position.set(0.65, 0.02, ventZ + 0.006);
  root.add(label2);

  // --- Screws ---
  const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
  screwGeom.rotateX(Math.PI / 2);
  
  const screwPositions = [
    [0.1, 0.08, ventZ],
    [0.8, 0.05, ventZ],
    [0.1, -0.02, ventZ],
    [0.8, -0.02, ventZ],
  ];

  for (const [x, y, z] of screwPositions) {
    const screw = new THREE.Mesh(screwGeom, screwMat);
    screw.position.set(x, y, z + 0.006);
    root.add(screw);
  }

  // --- Rear Cap Detail ---
  const capGeom = new THREE.SphereGeometry(0.07, 16, 16);
  const rearCap = new THREE.Mesh(capGeom, orangeMat);
  rearCap.position.set(-0.05, 0.045, 0);
  rearCap.scale.set(1, 1.2, 1);
  root.add(rearCap);

  // --- Orientation Correction ---
  // The model was built along X axis. Rotate to face +Z.
  root.rotation.y = -Math.PI / 2;

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