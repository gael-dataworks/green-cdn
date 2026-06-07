export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blade: Matte black painted surface (hard rubber or painted metal)
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Handle: Dark wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Bracket: Aged brass/metal
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x8c7b50,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Screws: Dark steel
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Geometry Construction ---

  // 1. Paddle Blade
  // Create a custom shape for the paddle silhouette
  const bladeShape = new THREE.Shape();
  const w = 0.5; // half width at bottom
  const h = 1.0; // length
  const neckW = 0.25; // half width at neck
  
  // Start at bottom center, go counter-clockwise
  bladeShape.moveTo(0, -h / 2);
  // Bottom right corner (rounded)
  bladeShape.quadraticCurveTo(w, -h / 2, w, -h / 2 + 0.1);
  // Right side up to shoulder
  bladeShape.lineTo(neckW + 0.05, 0);
  // Shoulder curve to neck
  bladeShape.quadraticCurveTo(neckW, 0.15, neckW, h / 2 - 0.1);
  // Neck top right
  bladeShape.lineTo(neckW, h / 2);
  // Top center
  bladeShape.lineTo(0, h / 2);
  // Top center (mirror for left side)
  bladeShape.lineTo(-neckW, h / 2);
  // Neck top left
  bladeShape.lineTo(-neckW, 0.15);
  // Shoulder curve left
  bladeShape.quadraticCurveTo(-neckW - 0.05, 0, -w, -h / 2 + 0.1);
  // Bottom left corner
  bladeShape.quadraticCurveTo(-w, -h / 2, 0, -h / 2);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  
  // Center the geometry
  bladeGeom.computeBoundingBox();
  const bladeCenter = new THREE.Vector3();
  bladeGeom.boundingBox.getCenter(bladeCenter);
  bladeGeom.translate(-bladeCenter.x, -bladeCenter.y, -bladeCenter.z);

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Orient flat in XZ plane (lying down)
  blade.rotation.x = Math.PI / 2;
  root.add(blade);

  // 2. Handle
  // Short wooden handle extending from the neck
  const handleLen = 0.35;
  const handleRadiusTop = 0.06;
  const handleRadiusBot = 0.08;
  const handleGeom = new THREE.CylinderGeometry(handleRadiusTop, handleRadiusBot, handleLen, 16);
  
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position at the neck end of the blade
  // Blade is in XZ, neck is at +Z (after rotation.x = PI/2, local Y becomes Z)
  // Wait, rotation.x = PI/2 maps:
  // Local Y (height of extrusion) -> World Z
  // Local X (width) -> World X
  // Local Z (depth) -> World -Y (thickness)
  // So the "top" of the extruded shape (local +Y) is at World +Z.
  handle.position.set(0, 0, h / 2 + handleLen / 2 - 0.05); 
  // Tapered handle: wider at blade, narrower at end.
  // Cylinder default: Y axis. We need it along Z.
  handle.rotation.x = Math.PI / 2;
  root.add(handle);

  // 3. Metal Bracket
  // Rectangular plate with rounded corners holding the handle
  const bracketW = 0.18;
  const bracketH = 0.12;
  const bracketD = 0.015;
  const bracketShape = new THREE.Shape();
  const bw = bracketW / 2;
  const bh = bracketH / 2;
  const r = 0.03;
  bracketShape.moveTo(-bw + r, -bh);
  bracketShape.lineTo(bw - r, -bh);
  bracketShape.quadraticCurveTo(bw, -bh, bw, -bh + r);
  bracketShape.lineTo(bw, bh - r);
  bracketShape.quadraticCurveTo(bw, bh, bw - r, bh);
  bracketShape.lineTo(-bw + r, bh);
  bracketShape.quadraticCurveTo(-bw, bh, -bw, bh - r);
  bracketShape.lineTo(-bw, -bh + r);
  bracketShape.quadraticCurveTo(-bw, -bh, -bw + r, -bh);

  const bracketGeom = new THREE.ExtrudeGeometry(bracketShape, {
    depth: bracketD,
    bevelEnabled: false,
  });
  
  // Center bracket geom
  bracketGeom.computeBoundingBox();
  const bracketCenter = new THREE.Vector3();
  bracketGeom.boundingBox.getCenter(bracketCenter);
  bracketGeom.translate(-bracketCenter.x, -bracketCenter.y, -bracketCenter.z);

  const bracket = new THREE.Mesh(bracketGeom, bracketMat);
  // Place over the joint between handle and blade
  // Blade surface is at local Y=0 (before rotation) -> World Y=0 (after rotation? No)
  // Blade rotation.x = PI/2. Local Y is World Z. Local Z is World -Y.
  // Blade thickness is along Local Z. Center is 0.
  // So blade top surface is at Local Z = depth/2 = 0.02.
  // World Y = -0.02.
  // Bracket sits on top of blade.
  bracket.position.set(0, -0.02 - bracketD/2, h / 2 - 0.05);
  bracket.rotation.x = Math.PI / 2;
  root.add(bracket);

  // 4. Screws / Rivets
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 12);
  const screwPositions = [
    [-0.06, 0.04], [0.06, 0.04],
    [-0.06, -0.04], [0.06, -0.04]
  ];

  screwPositions.forEach(([sx, sy]) => {
    const screw = new THREE.Mesh(screwGeom, screwMat);
    // Align with bracket orientation
    screw.position.set(sx, -0.02 - 0.01, h / 2 - 0.05 + sy);
    screw.rotation.x = Math.PI / 2;
    root.add(screw);
  });

  // Fit to unit cube
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