export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3020,
    metalness: 0.0,
    roughness: 0.7,
  });

  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x8c7b50,
    metalness: 0.4,
    roughness: 0.5,
  });

  // --- Blade ---
  // Shape for the paddle blade: wider at the front, tapering to the handle
  const bladeShape = new THREE.Shape();
  const w = 0.32; // half width at front
  const h = 0.75; // length of blade part
  const neckW = 0.12; // half width at handle connection

  bladeShape.moveTo(-neckW, 0);
  bladeShape.lineTo(-w, h * 0.3);
  bladeShape.quadraticCurveTo(-w - 0.05, h, 0, h);
  bladeShape.quadraticCurveTo(w + 0.05, h, w, h * 0.3);
  bladeShape.lineTo(neckW, 0);
  bladeShape.quadraticCurveTo(0, -0.05, -neckW, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the geometry roughly
  bladeGeom.translate(0, 0, -0.0075); // Shift so top surface is at z=0 (if lying flat)
  // Actually, let's orient it: Blade lies in XY plane? No, let's say XZ plane, Y is up.
  // But the object is flat. Let's model it flat on the XZ plane, handle along +Z.
  // Extrude is along Z by default. So Shape is in XY.
  // Let's rotate the mesh 90 deg around X to lie flat on XZ.
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.rotation.x = Math.PI / 2;
  blade.position.y = 0.01; // Slight thickness above ground
  root.add(blade);

  // --- Handle ---
  // Cylindrical handle, slightly tapered
  const handleLen = 0.35;
  const handleRadiusStart = 0.025;
  const handleRadiusEnd = 0.020;
  const handleGeom = new THREE.CylinderGeometry(
    handleRadiusEnd,
    handleRadiusStart,
    handleLen,
    16
  );
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Cylinder is Y-up by default. Rotate to lie along Z.
  handle.rotation.x = Math.PI / 2;
  // Position at the back of the blade
  // Blade extends from z=0 to z=h (roughly). Handle starts at z=0.
  handle.position.z = -handleLen / 2;
  handle.position.y = 0.01; // Align with blade top surface roughly
  root.add(handle);

  // --- Bracket / Ferrule ---
  // Metal piece connecting handle to blade
  const bracketW = 0.14;
  const bracketL = 0.12;
  const bracketH = 0.008;
  const bracketGeom = new THREE.BoxGeometry(bracketW, bracketH, bracketL);
  const bracket = new THREE.Mesh(bracketGeom, bracketMat);
  // Round the corners visually by scaling or just use a box for simplicity given the distance
  // Let's use a slightly rounded box via scaling or just accept the box for low poly
  bracket.position.z = -0.05; // Overlap blade and handle
  bracket.position.y = 0.015 + bracketH / 2; // Sit on top of blade
  root.add(bracket);

  // --- Rivets ---
  const rivetGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.025, 12);
  const rivetPositions = [
    [-0.05, 0, -0.05],
    [0.05, 0, -0.05],
  ];
  
  for (const [x, y, z] of rivetPositions) {
    const rivet = new THREE.Mesh(rivetGeom, bracketMat);
    rivet.rotation.x = Math.PI / 2; // Lie flat
    rivet.position.set(x, 0.015 + 0.0125, z); // On top of bracket
    root.add(rivet);
  }

  // --- Hole in Handle ---
  // Small dark cylinder to simulate the hanging hole
  const holeGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.04, 12);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.rotation.x = Math.PI / 2;
  hole.position.z = -handleLen / 2 + 0.03;
  hole.position.y = 0.01;
  root.add(hole);

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