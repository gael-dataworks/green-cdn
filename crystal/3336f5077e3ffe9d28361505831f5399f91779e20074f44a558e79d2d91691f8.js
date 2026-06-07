export default function generate(THREE) {
  const root = new THREE.Group();

  // Silver Material - Polished Metal
  // Using emissive to ensure brightness in absence of environment map
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.25,
    emissive: 0xd0d0d0,
    emissiveIntensity: 0.35,
  });

  const chainGroup = new THREE.Group();
  root.add(chainGroup);

  // Chain Configuration
  const numLinks = 50;
  const chainWidth = 2.4;
  const chainDrop = 1.4;
  const halfW = chainWidth / 2;

  // Link Geometry: Torus stretched into ovals
  // Radius 0.025, Tube 0.0035
  const linkGeom = new THREE.TorusGeometry(0.025, 0.0035, 16, 32);

  // Calculate parabola coefficient for drape: y = a * x^2
  // We want y=0 at x=0 (bottom), and y=chainDrop/2 at x=+/-halfW
  const a = (chainDrop / 2) / (halfW * halfW);

  for (let i = 0; i < numLinks; i++) {
    // Distribute links along X from -halfW to +halfW
    const t = i / (numLinks - 1); 
    const x = -halfW + t * chainWidth;
    const y = a * x * x;

    const link = new THREE.Mesh(linkGeom, silverMat);
    link.position.set(x, y, 0);

    // Alternate orientation to simulate interlocking paperclip chain
    if (i % 2 === 0) {
      // Vertical link (lies in XY plane)
      // Stretch Y to make it an oval
      link.scale.set(0.6, 2.2, 1);
      link.rotation.set(0, 0, 0);
    } else {
      // Horizontal link (lies in XZ plane)
      // Rotate 90 deg around X to lie flat in XZ
      link.rotation.set(Math.PI / 2, 0, 0);
      // Stretch X to make it an oval along the chain path
      link.scale.set(2.2, 0.6, 1);
    }

    chainGroup.add(link);
  }

  // Clasp Assembly at the left end (i=0)
  const claspX = -halfW;
  const claspY = a * claspX * claspX;
  const claspGroup = new THREE.Group();
  claspGroup.position.set(claspX, claspY, 0);
  root.add(claspGroup);

  // Clasp Ring (Jump ring)
  const ringGeom = new THREE.TorusGeometry(0.008, 0.003, 16, 32);
  const claspRing = new THREE.Mesh(ringGeom, silverMat);
  claspRing.rotation.y = Math.PI / 2; // Orient to connect to chain
  claspGroup.add(claspRing);

  // Clasp Hook (Lobster claw approximation)
  // Half torus for the curve
  const hookGeom = new THREE.TorusGeometry(0.012, 0.003, 16, 32, Math.PI);
  const claspHook = new THREE.Mesh(hookGeom, silverMat);
  claspHook.position.set(-0.015, 0, 0);
  claspHook.rotation.z = Math.PI / 2; 
  claspHook.rotation.x = Math.PI / 4; // Tilt for hook shape
  claspGroup.add(claspHook);

  // Hook Lever (small bar)
  const leverGeom = new THREE.CylinderGeometry(0.001, 0.001, 0.012, 8);
  const claspLever = new THREE.Mesh(leverGeom, silverMat);
  claspLever.position.set(-0.015, 0.01, 0);
  claspLever.rotation.z = Math.PI / 2;
  claspGroup.add(claspLever);

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