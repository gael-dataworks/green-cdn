export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x3366cc,
    metalness: 0.0,
    roughness: 0.55,
  });

  // Define the side profile (YZ plane) to be extruded along X
  const shape = new THREE.Shape();
  
  // Coordinates (z, y) - Z is forward, Y is up
  // Starting at back bottom
  const zBack = -0.30;
  const zFront = 0.35;
  const yBase = 0.0;
  const yTopBack = 0.38;
  const yTopFront = 0.12;
  const zSlopeStart = -0.10;
  const zSlopeEnd = 0.20;
  const yStep = 0.08;

  shape.moveTo(zBack, yBase);          // Back Bottom
  shape.lineTo(zBack, yTopBack);       // Back Top
  shape.lineTo(zSlopeStart, yTopBack); // Top Flat
  shape.lineTo(zSlopeEnd, yTopFront);  // Slope Down
  shape.lineTo(zSlopeEnd, yStep);      // Front Vertical Drop
  shape.lineTo(zFront, yStep);         // Front Top (lower block)
  shape.lineTo(zFront, yBase);         // Front Bottom
  shape.lineTo(zBack, yBase);          // Close Bottom

  // Add the hole in the top flat section
  const holePath = new THREE.Path();
  holePath.absarc(-0.15, 0.28, 0.055, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Extrude settings
  const extrudeSettings = {
    steps: 1,
    depth: 0.28, // Width along X
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center the geometry manually since ExtrudeGeometry centers based on shape bounds
  geometry.center();

  const handle = new THREE.Mesh(geometry, bluePlasticMat);
  
  // Rotate so the extrusion (X axis of geometry) aligns with world X, 
  // and the profile (YZ plane) aligns with world YZ.
  // ExtrudeGeometry extrudes along Z by default. We want width along X.
  // So rotate -90 deg around Y.
  handle.rotation.y = -Math.PI / 2;

  root.add(handle);

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