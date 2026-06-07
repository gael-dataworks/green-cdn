export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    metalness: 0.0,
    roughness: 0.6,
  });

  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const endCapMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Handle - main wooden shaft
  const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.85, 16);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = -0.05;
  root.add(handle);

  // Metal collar at blade junction
  const collarGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.035, 16);
  const collar = new THREE.Mesh(collarGeom, blackMetalMat);
  collar.position.y = 0.38;
  root.add(collar);

  // Grip wrapping - multiple thin rings around lower handle
  const gripStartY = -0.28;
  const gripRingCount = 7;
  const gripSpacing = 0.012;
  for (let i = 0; i < gripRingCount; i++) {
    const gripRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.027, 0.006, 16),
      gripMat
    );
    gripRing.position.y = gripStartY + i * gripSpacing;
    root.add(gripRing);
  }

  // End cap at bottom of handle
  const endCapGeom = new THREE.SphereGeometry(0.026, 16, 8);
  const endCap = new THREE.Mesh(endCapGeom, endCapMat);
  endCap.scale.set(1, 0.6, 1);
  endCap.position.y = -0.48;
  root.add(endCap);

  // Blade stem - the curved black metal neck connecting to blade
  const stemPoints = [
    new THREE.Vector3(0, 0.4, 0),
    new THREE.Vector3(0, 0.55, -0.02),
    new THREE.Vector3(0, 0.7, -0.03),
  ];
  const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 16, 0.012, 12, false);
  const stem = new THREE.Mesh(stemGeom, blackMetalMat);
  root.add(stem);

  // Blade - leaf-shaped flat blade with slight curve
  // Using extruded shape for the leaf profile
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.quadraticCurveTo(0.12, 0.08, 0.14, 0.18);
  bladeShape.quadraticCurveTo(0.12, 0.28, 0.0, 0.32);
  bladeShape.quadraticCurveTo(-0.12, 0.28, -0.14, 0.18);
  bladeShape.quadraticCurveTo(-0.12, 0.08, 0, 0);

  const bladeExtrudeSettings = {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.001,
    bevelSegments: 2,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  const blade = new THREE.Mesh(bladeGeom, blackMetalMat);
  blade.position.set(0, 0.68, -0.04);
  blade.rotation.x = Math.PI / 2.5;
  blade.rotation.z = Math.PI / 12;
  root.add(blade);

  // Blade spine ridge - subtle raised line down center
  const spineGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.28, 8);
  const spine = new THREE.Mesh(spineGeom, blackMetalMat);
  spine.rotation.x = Math.PI / 2.5;
  spine.rotation.z = Math.PI / 12;
  spine.position.set(0, 0.68, -0.035);
  root.add(spine);

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