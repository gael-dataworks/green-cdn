export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blade: Dark, matte metal (cast iron or painted steel)
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    metalness: 0.3,
    roughness: 0.7,
  });

  // Handle: Dark wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Ferrule/Rivets: Tarnished metal/bronze
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x6b5d50,
    metalness: 0.5,
    roughness: 0.6,
  });

  // 1. Blade
  // Define outline in XY plane. Tip at bottom (-Y), Handle connection at top (+Y).
  const bladeShape = new THREE.Shape();
  const tipY = -0.45;
  const maxW = 0.26;
  const shoulderY = -0.20;
  const neckStartY = 0.20;
  const neckW = 0.08;
  const neckEndY = 0.40;

  bladeShape.moveTo(0, tipY);
  bladeShape.quadraticCurveTo(maxW, tipY, maxW, shoulderY);
  bladeShape.lineTo(neckW, neckStartY);
  bladeShape.lineTo(neckW, neckEndY);
  bladeShape.quadraticCurveTo(neckW, neckEndY + 0.05, 0, neckEndY + 0.05);
  bladeShape.quadraticCurveTo(-neckW, neckEndY + 0.05, -neckW, neckEndY);
  bladeShape.lineTo(-neckW, neckStartY);
  bladeShape.lineTo(-maxW, shoulderY);
  bladeShape.quadraticCurveTo(-maxW, tipY, 0, tipY);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
    steps: 1,
  });

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat in XZ plane. 
  // Shape was in XY. Rotate -90 deg around X -> Shape in XZ.
  blade.rotation.x = -Math.PI / 2;
  // Position Y so top surface is at y=0.025 (thickness)
  blade.position.y = 0.0125;
  root.add(blade);

  // 2. Ferrule (Connector Plate)
  // Sits on top of the blade neck, under the handle.
  const ferruleShape = new THREE.Shape();
  ferruleShape.moveTo(-0.09, -0.05);
  ferruleShape.lineTo(0.09, -0.05);
  ferruleShape.lineTo(0.09, 0.12);
  ferruleShape.quadraticCurveTo(0.09, 0.16, 0.05, 0.16);
  ferruleShape.lineTo(-0.05, 0.16);
  ferruleShape.quadraticCurveTo(-0.09, 0.16, -0.09, 0.12);
  ferruleShape.lineTo(-0.09, -0.05);

  const ferruleGeom = new THREE.ExtrudeGeometry(ferruleShape, {
    depth: 0.012,
    bevelEnabled: false,
  });

  const ferrule = new THREE.Mesh(ferruleGeom, metalMat);
  ferrule.rotation.x = -Math.PI / 2;
  // Position: Start of handle area on blade.
  // Blade neck ends at local Y = 0.45 (neckEndY + 0.05).
  // In world Z (after rotation), this is Z = 0.45.
  // Ferrule sits on top.
  ferrule.position.z = 0.40; 
  ferrule.position.y = 0.025 + 0.006; // Blade thickness + ferrule half-thickness
  root.add(ferrule);

  // 3. Rivets
  const rivetGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.035, 12);
  
  const rivet1 = new THREE.Mesh(rivetGeom, metalMat);
  rivet1.rotation.x = Math.PI / 2;
  rivet1.position.set(0.055, 0.025 + 0.006 + 0.0175, 0.40 + 0.05);
  root.add(rivet1);

  const rivet2 = new THREE.Mesh(rivetGeom, metalMat);
  rivet2.rotation.x = Math.PI / 2;
  rivet2.position.set(-0.055, 0.025 + 0.006 + 0.0175, 0.40 + 0.05);
  root.add(rivet2);

  // 4. Handle
  // Tapered cylinder.
  const handleGeom = new THREE.CylinderGeometry(0.035, 0.050, 0.35, 16);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position: Starts after ferrule.
  // Ferrule center Z = 0.40. Ferrule length ~0.2. Ends ~0.50.
  // Handle starts ~0.50.
  handle.position.z = 0.50 + 0.175;
  handle.position.y = 0.025 + 0.012 + 0.035; // Blade + Ferrule + Handle Radius
  handle.rotation.x = Math.PI / 2;
  root.add(handle);

  // Handle Hole Detail (Rim)
  const holeRimGeom = new THREE.TorusGeometry(0.015, 0.005, 8, 16);
  const holeRim = new THREE.Mesh(holeRimGeom, woodMat);
  holeRim.position.z = 0.50 + 0.35;
  holeRim.position.y = 0.025 + 0.012 + 0.035;
  holeRim.rotation.y = Math.PI / 2;
  root.add(holeRim);

  // Handle Hole Detail (Void)
  const holeGeom = new THREE.CircleGeometry(0.010, 16);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.position.z = 0.50 + 0.35 + 0.001;
  hole.position.y = 0.025 + 0.012 + 0.035;
  hole.rotation.y = Math.PI / 2;
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