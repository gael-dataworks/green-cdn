export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x2b60d1,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Material for the deep hole interior (dark shadow)
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Main Body Geometry ---
  // Constructed via ExtrudeGeometry with a custom side profile (YZ plane)
  // and a rectangular hole for the air channel (fipple) at the bottom.
  const sideShape = new THREE.Shape();

  // Outer Silhouette (Y is up, Z is length/forward)
  // Start at Rear Bottom
  sideShape.moveTo(0.0, 0.0);
  // Rear Top (high block)
  sideShape.lineTo(0.0, 0.48);
  // Top Flat section
  sideShape.lineTo(0.25, 0.48);
  // Slope down to Mouthpiece
  sideShape.lineTo(0.85, 0.18);
  // Mouthpiece Tip Bottom
  sideShape.lineTo(0.85, 0.08);
  // Bottom line forward (ceiling of air channel)
  sideShape.lineTo(0.0, 0.08);
  // Close to start
  sideShape.lineTo(0.0, 0.0);

  // Air Channel Hole (Rectangular gap at the bottom)
  const channelPath = new THREE.Path();
  channelPath.moveTo(0.05, 0.0);
  channelPath.lineTo(0.75, 0.0);
  channelPath.lineTo(0.75, 0.06);
  channelPath.lineTo(0.05, 0.06);
  sideShape.holes.push(channelPath);

  const extrudeSettings = {
    steps: 1,
    depth: 0.28, // Width of the whistle (X axis)
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(sideShape, extrudeSettings);
  // Center the geometry roughly
  bodyGeom.center();
  const body = new THREE.Mesh(bodyGeom, blueMat);
  root.add(body);

  // --- Top Hole Detail ---
  // A dark cylinder to simulate the depth of the hole on the top surface.
  // Positioned on the rear "hump".
  const holeGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
  const holeMesh = new THREE.Mesh(holeGeom, darkMat);
  // Position based on the profile: Z is roughly 0.15 from rear, Y is top surface
  // Since we centered the geom, we need to estimate offsets or just place relatively.
  // Approximate offsets after centering:
  holeMesh.position.set(0, 0.25, -0.15);
  holeMesh.rotation.x = Math.PI; // Point downwards
  root.add(holeMesh);

  // --- Orientation ---
  // The profile was built facing +Z. The extrusion is along X.
  // The object is naturally oriented correctly for "face +Z".
  // Add a slight rotation to match the dynamic angle in the reference if desired,
  // but standard procedure is neutral pose. We will keep it neutral.

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