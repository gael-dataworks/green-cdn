export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Dark polished wood (walnut/rosewood tone)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x452b1d,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Dark groove/seam material
  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0x1a1008,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Handle Profile (X=radius, Y=height along local axis)
  // Designed to be rotated 90 deg around X to lie on Z axis
  // Starts at tip (Y=0) and ends at base (Y=0.8)
  const profilePoints = [
    new THREE.Vector2(0, 0),       // Tip center
    new THREE.Vector2(0.02, 0.02), // Tip roundness
    new THREE.Vector2(0.04, 0.05), // Tip shoulder
    new THREE.Vector2(0.07, 0.3),  // Taper mid
    new THREE.Vector2(0.10, 0.6),  // Taper lower
    new THREE.Vector2(0.12, 0.8),  // Base of handle
  ];

  const handleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Rotate to lie along Z axis (Y-up to Z-forward)
  // Y axis of mesh points to -Z after rotation
  handle.rotation.x = Math.PI / 2;
  // Position so tip is at +Z, base is at -Z
  // Local Y=0 (Tip) -> World Z = 0.4
  // Local Y=0.8 (Base) -> World Z = -0.4
  handle.position.z = 0.4;
  root.add(handle);

  // Cap
  const capHeight = 0.15;
  const capRadius = 0.125;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, woodMat);
  cap.rotation.x = Math.PI / 2;
  // Cap attaches to Base of handle with a small gap for the groove
  // Handle Base is at Z = -0.4
  // Cap Front should be at Z = -0.41
  // Cap Center = -0.41 - (0.15 / 2) = -0.485
  cap.position.z = -0.485;
  root.add(cap);

  // Groove
  const grooveRadius = 0.12;
  const grooveThickness = 0.005;
  const grooveGeom = new THREE.TorusGeometry(grooveRadius, grooveThickness, 16, 32);
  const groove = new THREE.Mesh(grooveGeom, grooveMat);
  groove.rotation.x = Math.PI / 2;
  // Groove sits in the gap
  groove.position.z = -0.405;
  root.add(groove);

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