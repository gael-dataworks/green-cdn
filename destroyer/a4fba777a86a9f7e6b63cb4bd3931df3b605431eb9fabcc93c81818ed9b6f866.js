export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.7,
  });

  // --- Handle ---
  // Long wooden cylinder
  const handleGeom = new THREE.CylinderGeometry(0.035, 0.038, 0.55, 16);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = -0.15;
  root.add(handle);

  // --- Base Cap ---
  // Small black cap at the bottom
  const baseCapGeom = new THREE.SphereGeometry(0.038, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const baseCap = new THREE.Mesh(baseCapGeom, blackMat);
  baseCap.position.y = -0.425;
  baseCap.rotation.x = Math.PI;
  root.add(baseCap);

  // --- Grip ---
  // 5 thin black rings near the bottom of the handle
  const gripGeom = new THREE.TorusGeometry(0.039, 0.004, 8, 16);
  const gripPositions = [-0.35, -0.33, -0.31, -0.29, -0.27];
  for (const y of gripPositions) {
    const grip = new THREE.Mesh(gripGeom, blackMat);
    grip.position.y = y;
    grip.rotation.x = Math.PI / 2;
    root.add(grip);
  }

  // --- Neck ---
  // Curved black tube connecting handle to head
  // Path: Starts top of handle (0, 0.125, 0), curves up and back (-X)
  const neckPoints = [
    new THREE.Vector3(0, 0.125, 0),
    new THREE.Vector3(0, 0.25, 0),
    new THREE.Vector3(-0.05, 0.35, 0),
    new THREE.Vector3(-0.10, 0.42, 0),
  ];
  const neckCurve = new THREE.CatmullRomCurve3(neckPoints);
  const neckGeom = new THREE.TubeGeometry(neckCurve, 20, 0.022, 12, false);
  const neck = new THREE.Mesh(neckGeom, blackMat);
  root.add(neck);

  // --- Head ---
  // Teardrop shaped wooden paddle with ridges
  const headGroup = new THREE.Group();

  // 1. Head Base Shape (Teardrop)
  const headShape = new THREE.Shape();
  headShape.moveTo(0, 0);
  headShape.bezierCurveTo(0.06, 0.05, 0.07, 0.10, 0.06, 0.14);
  headShape.bezierCurveTo(0.03, 0.18, 0.00, 0.19, 0.00, 0.19); // Tip
  headShape.bezierCurveTo(-0.03, 0.18, -0.07, 0.14, -0.06, 0.10);
  headShape.bezierCurveTo(-0.06, 0.05, 0, 0, 0, 0);

  const headExtrudeSettings = {
    steps: 1,
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  };
  const headBaseGeom = new THREE.ExtrudeGeometry(headShape, headExtrudeSettings);
  // Center the geometry
  headBaseGeom.center();
  const headBase = new THREE.Mesh(headBaseGeom, woodMat);
  headGroup.add(headBase);

  // 2. Ridges (Dark lines on the wood)
  // 4 thin cylinders placed along the length of the paddle
  const ridgeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8);
  ridgeGeom.rotateZ(Math.PI / 2); // Orient along Y axis of head
  const ridgeOffsets = [-0.025, -0.008, 0.008, 0.025];
  
  for (const xOffset of ridgeOffsets) {
    const ridge = new THREE.Mesh(ridgeGeom, blackMat);
    ridge.position.set(xOffset, 0, 0.008); // Slightly above surface
    headGroup.add(ridge);
  }

  // Position and Rotate Head Group
  // Attach to end of neck. Neck ends around (-0.10, 0.42, 0).
  // The head needs to angle back.
  headGroup.position.set(-0.10, 0.42, 0);
  headGroup.rotation.z = -0.5; // Tilt back
  headGroup.rotation.y = 0.2;  // Slight twist to face somewhat forward
  root.add(headGroup);

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