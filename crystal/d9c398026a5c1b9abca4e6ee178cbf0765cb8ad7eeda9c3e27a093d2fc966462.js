export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue matte plastic
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2a5fcc,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Define the side profile in the Y-Z plane (Y is up, Z is forward)
  // We will extrude this along the X axis to give it width.
  const shape = new THREE.Shape();

  // Coordinates relative to center (0,0)
  // Bottom edge
  shape.moveTo(-0.45, -0.30);
  shape.lineTo(0.50, -0.30);

  // Front face (angled up slightly)
  shape.lineTo(0.50, -0.10);

  // Top slope (curved transition to the flat top)
  // Using a bezier curve for the smooth transition from front tip to top block
  shape.bezierCurveTo(
    0.20, 0.10,  // Control point 1
    -0.10, 0.30, // Control point 2
    -0.10, 0.30  // End of slope / start of flat top
  );

  // Top flat section (where the hole is)
  shape.lineTo(-0.45, 0.30);

  // Back vertical face
  shape.lineTo(-0.45, -0.30);

  // Add the hole (circle) in the top rear section
  // The hole goes through the X axis, so in the Y-Z profile it's a circle.
  const holePath = new THREE.Path();
  // Center the hole in the thick part of the top block
  holePath.absarc(-0.25, 0.15, 0.08, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Extrude settings
  const extrudeSettings = {
    depth: 0.35,       // Width of the object
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 12,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center the geometry so the pivot is roughly in the middle
  bodyGeom.center();

  const body = new THREE.Mesh(bodyGeom, bluePlasticMat);
  
  // Rotate so the extrusion (X) aligns with width, and profile (Y-Z) aligns correctly.
  // ExtrudeGeometry extrudes along Z by default. 
  // Our shape was drawn in Y-Z (up-forward). 
  // Default extrusion is +Z. We want width along X.
  // So we rotate -90 deg around Y to put the extrusion axis along X?
  // No, let's just rotate the mesh.
  // Default: Shape in XY, extrude Z.
  // We drew shape in YZ (using moveTo x,y where x is Z, y is Y).
  // So our "X" in shape coords is actually World Z. Our "Y" in shape coords is World Y.
  // Extrusion is along World Z (default).
  // We want the object to face +Z.
  // Our shape "length" is along the shape's X axis (which is World Z if we don't rotate).
  // Our shape "height" is along the shape's Y axis (World Y).
  // The extrusion (width) is along World Z.
  // This means the object would be flat like a plate facing us.
  // We need the width to be along X.
  // So rotate 90 degrees around Y.
  
  body.rotation.y = Math.PI / 2;

  root.add(body);

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