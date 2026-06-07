export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Matte blue plastic
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x2b55c4,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Create the side profile shape (in local X-Y plane, mapped to World Z-Y)
  const shape = new THREE.Shape();
  
  // Profile points (z, y) - tracing the whistle silhouette
  // Start at front bottom
  shape.moveTo(0.22, 0.0);
  // Front face vertical lip
  shape.lineTo(0.22, 0.04);
  // Slope up to mouthpiece top
  shape.lineTo(0.16, 0.11);
  // Top surface hump (raised to accommodate hole)
  shape.lineTo(-0.05, 0.17);
  shape.lineTo(-0.12, 0.17);
  // Rear block vertical drop
  shape.lineTo(-0.12, 0.06);
  // Rear block top horizontal
  shape.lineTo(-0.20, 0.06);
  // Rear block back vertical
  shape.lineTo(-0.20, 0.0);
  // Rear block bottom (inner)
  shape.lineTo(-0.14, 0.0);
  // Arch start (chamber floor)
  shape.lineTo(-0.14, 0.03);
  // Chamber floor horizontal
  shape.lineTo(0.14, 0.03);
  // Connect back to front bottom
  shape.lineTo(0.22, 0.0);

  // Add the lanyard hole (circle in the profile)
  // Positioned on the top hump towards the rear
  const holePath = new THREE.Path();
  holePath.absarc(-0.08, 0.15, 0.025, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Extrude settings
  const extrudeSettings = {
    depth: 0.36,          // Width of the whistle
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    steps: 1,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const whistle = new THREE.Mesh(geometry, blueMat);

  // Orientation correction:
  // ExtrudeGeometry creates shape in XY plane, extruded along Z.
  // We defined shape in (z, y) mapped to (x, y). So local X=World Z, local Y=World Y.
  // Extrusion is along local Z, which we want to be World X (width).
  // Rotation: -90 deg around Y axis swaps local Z to local X.
  whistle.rotation.y = -Math.PI / 2;
  
  // Center the geometry manually to help fitToUnitCube, though it handles it.
  // Extrusion goes from 0 to 0.36 in local Z. Center is 0.18.
  // After rotation, this offset is on X axis.
  whistle.position.x = 0.18;

  root.add(whistle);

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