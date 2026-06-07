export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Fine mesh screen: grey, wireframe
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.5,
    roughness: 0.4,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  // Polished metal for rim, hooks, connector
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Light wood for handle and middle band
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c099,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const bowlRadius = 0.22;
  const rimThickness = 0.018;
  const handleLength = 0.28;
  const handleWidth = 0.045;
  const handleThick = 0.025;

  // --- 1. Mesh Bowl ---
  // Sphere geometry, bottom hemisphere only.
  // thetaStart=0 is top pole, thetaLength=PI/2 covers top hemisphere.
  // We want bottom, so thetaStart=PI/2.
  const bowlGeom = new THREE.SphereGeometry(bowlRadius, 24, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bowl = new THREE.Mesh(bowlGeom, meshMat);
  root.add(bowl);

  // --- 2. Metal Rim ---
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie in XZ.
  const rimGeom = new THREE.TorusGeometry(bowlRadius, rimThickness, 16, 32);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2;
  root.add(rim);

  // --- 3. Middle Wooden Band ---
  // Positioned about halfway down the bowl.
  const bandRadius = bowlRadius * 0.75;
  const bandGeom = new THREE.TorusGeometry(bandRadius, 0.012, 16, 32);
  const band = new THREE.Mesh(bandGeom, woodMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = -bowlRadius * 0.6;
  root.add(band);

  // --- 4. Handle Assembly ---
  // Handle connector (metal bracket attaching wood to rim)
  const connectorGeom = new THREE.BoxGeometry(0.04, 0.03, 0.06);
  const connector = new THREE.Mesh(connectorGeom, metalMat);
  connector.position.set(bowlRadius + 0.02, 0.015, 0);
  root.add(connector);

  // Wooden Handle (Tapered cylinder)
  // Cylinder is Y-up. Rotate Z by 90 to point along +X.
  const handleGeom = new THREE.CylinderGeometry(handleWidth * 0.8, handleWidth, handleLength, 16);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.rotation.z = Math.PI / 2;
  // Position: start near connector, extend outwards
  handle.position.set(bowlRadius + 0.04 + handleLength / 2, 0.015, 0);
  root.add(handle);

  // Handle Hole (Visual only - dark torus at the end)
  const holeGeom = new THREE.TorusGeometry(0.012, 0.004, 8, 16);
  const hole = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.0, roughness: 0.5 }));
  hole.rotation.y = Math.PI / 2; // Face along X
  hole.position.set(bowlRadius + 0.04 + handleLength - 0.015, 0.015, 0);
  root.add(hole);

  // --- 5. Rest Hooks (Opposite side) ---
  // Two hooks curving down. Use TubeGeometry with CatmullRomCurve3.
  const hookOffsetZ = 0.08;
  const hookCurvePointsLeft = [
    new THREE.Vector3(-bowlRadius - 0.02, 0.02, -hookOffsetZ), // Start at rim
    new THREE.Vector3(-bowlRadius - 0.05, -0.05, -hookOffsetZ), // Curve out and down
    new THREE.Vector3(-bowlRadius - 0.05, -0.12, -hookOffsetZ), // Hook bottom
  ];
  const hookCurveLeft = new THREE.CatmullRomCurve3(hookCurvePointsLeft);
  const hookGeomLeft = new THREE.TubeGeometry(hookCurveLeft, 16, 0.006, 8, false);
  const hookLeft = new THREE.Mesh(hookGeomLeft, metalMat);
  root.add(hookLeft);

  const hookCurvePointsRight = [
    new THREE.Vector3(-bowlRadius - 0.02, 0.02, hookOffsetZ), // Start at rim
    new THREE.Vector3(-bowlRadius - 0.05, -0.05, hookOffsetZ), // Curve out and down
    new THREE.Vector3(-bowlRadius - 0.05, -0.12, hookOffsetZ), // Hook bottom
  ];
  const hookCurveRight = new THREE.CatmullRomCurve3(hookCurvePointsRight);
  const hookGeomRight = new THREE.TubeGeometry(hookCurveRight, 16, 0.006, 8, false);
  const hookRight = new THREE.Mesh(hookGeomRight, metalMat);
  root.add(hookRight);

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