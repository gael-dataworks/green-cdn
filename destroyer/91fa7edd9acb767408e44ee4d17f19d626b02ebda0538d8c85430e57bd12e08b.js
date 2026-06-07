export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Polished gold/rose gold. Metalness capped at 0.6 to avoid blackness without env map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd799, // Soft gold/rose gold
    metalness: 0.6,
    roughness: 0.25,
  });

  // --- Pendant (The "J" shape) ---
  // Modeled as a tube following a curved path.
  const jPoints = [
    new THREE.Vector3(0, 0.45, 0),   // Top attachment
    new THREE.Vector3(0, 0.15, 0),   // Upper shaft
    new THREE.Vector3(0, -0.1, 0),   // Start of curve
    new THREE.Vector3(-0.18, -0.35, 0), // Bottom outer curve
    new THREE.Vector3(-0.12, -0.25, 0.05) // Tip hooking slightly up and forward
  ];
  
  const jCurve = new THREE.CatmullRomCurve3(jPoints);
  // Tube args: path, tubularSegments, radius, radialSegments, closed
  const pendantGeom = new THREE.TubeGeometry(jCurve, 64, 0.045, 16, false);
  const pendant = new THREE.Mesh(pendantGeom, goldMat);
  root.add(pendant);

  // Top cap/bail area - slightly flattened cylinder to simulate the connection point
  const bailGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
  const bail = new THREE.Mesh(bailGeom, goldMat);
  bail.position.set(0, 0.45, 0);
  bail.rotation.x = Math.PI / 2; // Lay flat on top
  // Scale Z to flatten it slightly
  bail.scale.set(1, 1, 0.6);
  root.add(bail);

  // --- Chain ---
  // Simple V-shape chain using a thin tube.
  // Starts from the bail top, goes up and out.
  const chainLeftPoints = [
    new THREE.Vector3(0, 0.49, 0),
    new THREE.Vector3(-0.3, 0.8, 0.2),
    new THREE.Vector3(-0.5, 1.0, 0.4)
  ];
  const chainRightPoints = [
    new THREE.Vector3(0, 0.49, 0),
    new THREE.Vector3(0.3, 0.8, 0.2),
    new THREE.Vector3(0.5, 1.0, 0.4)
  ];

  const chainLeftCurve = new THREE.CatmullRomCurve3(chainLeftPoints);
  const chainRightCurve = new THREE.CatmullRomCurve3(chainRightPoints);
  
  const chainGeom = new THREE.TubeGeometry(chainLeftCurve, 20, 0.012, 8, false);
  const chainLeft = new THREE.Mesh(chainGeom, goldMat);
  root.add(chainLeft);

  // Reuse geometry for right side
  const chainRightGeom = new THREE.TubeGeometry(chainRightCurve, 20, 0.012, 8, false);
  const chainRight = new THREE.Mesh(chainRightGeom, goldMat);
  root.add(chainRight);

  // Add a few visible links near the attachment for detail
  function addLink(x, y, z, rotZ) {
    const linkGeom = new THREE.TorusGeometry(0.015, 0.004, 8, 12);
    const link = new THREE.Mesh(linkGeom, goldMat);
    link.position.set(x, y, z);
    link.rotation.z = rotZ;
    link.rotation.y = Math.PI / 4;
    root.add(link);
  }
  
  addLink(-0.1, 0.6, 0.1, Math.PI / 3);
  addLink(0.1, 0.6, 0.1, -Math.PI / 3);

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