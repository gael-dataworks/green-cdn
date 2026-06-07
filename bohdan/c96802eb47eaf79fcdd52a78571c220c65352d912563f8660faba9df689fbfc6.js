export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blade: Seasoned cast iron / dark metal look
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Handle: Dark wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Connector: Tarnished brass/bronze
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x8c7b50,
    metalness: 0.5,
    roughness: 0.5,
  });

  // --- Blade ---
  // Create the paddle shape using a 2D shape and extrusion
  const bladeShape = new THREE.Shape();
  const bladeLength = 0.65;
  const bladeWidth = 0.34;
  const handleJoinWidth = 0.12;

  // Start at handle connection (back center)
  bladeShape.moveTo(0, 0);
  // Side edge outwards
  bladeShape.lineTo(handleJoinWidth / 2, 0);
  // Flare out slightly
  bladeShape.lineTo(bladeWidth / 2, bladeLength * 0.4);
  // Round tip
  bladeShape.quadraticCurveTo(bladeWidth / 2, bladeLength, 0, bladeLength + 0.05);
  // Other side tip
  bladeShape.quadraticCurveTo(-bladeWidth / 2, bladeLength, -bladeWidth / 2, bladeLength * 0.4);
  // Side edge inwards
  bladeShape.lineTo(-handleJoinWidth / 2, 0);
  // Close at handle connection
  bladeShape.lineTo(0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    steps: 1,
  });

  // Center the geometry so pivot is at the handle join
  bladeGeom.translate(0, 0, -bladeLength / 2);
  
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat in XZ plane (extrude is along Z, we want flat on XZ usually, 
  // but here extrude Z is thickness. Default extrude is in XY plane facing Z.
  // We want the flat face up/down. So rotate X by -90 deg).
  blade.rotation.x = -Math.PI / 2;
  root.add(blade);

  // --- Handle ---
  // Tapered cylinder
  const handleLength = 0.22;
  const handleRadiusTop = 0.045;
  const handleRadiusBottom = 0.035;
  const handleGeom = new THREE.CylinderGeometry(
    handleRadiusBottom, 
    handleRadiusTop, 
    handleLength, 
    16
  );
  
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position handle so top is at the blade join
  // Blade is at y=0 (after rotation x -90, local Y is up). 
  // Handle needs to extend backwards (-Z in blade local, but we are in root group).
  // Let's align everything in root.
  // Blade is flat on XZ. Thickness is Y.
  // Handle should extend from the back of the blade along -Z.
  handle.position.set(0, 0.0125, -handleLength / 2);
  // Cylinder is Y-up by default. We need it to point along -Z? 
  // No, looking at image, handle is in the same plane as the blade, extending back.
  // So handle axis should be Z. Rotate X by 90.
  handle.rotation.x = Math.PI / 2;
  root.add(handle);

  // --- Connector Plate ---
  // Small metal plate holding handle to blade
  const plateWidth = 0.08;
  const plateLength = 0.10;
  const plateGeom = new THREE.BoxGeometry(plateWidth, 0.005, plateLength);
  const plate = new THREE.Mesh(plateGeom, metalMat);
  // Sit on top of handle/blade junction
  plate.position.set(0, 0.025, -plateLength / 2 + 0.02);
  root.add(plate);

  // --- Rivets ---
  const rivetGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 12);
  const rivet1 = new THREE.Mesh(rivetGeom, metalMat);
  rivet1.rotation.x = Math.PI / 2; // Flat on plate
  rivet1.position.set(-0.025, 0.03, -0.04);
  root.add(rivet1);

  const rivet2 = new THREE.Mesh(rivetGeom, metalMat);
  rivet2.rotation.x = Math.PI / 2;
  rivet2.position.set(0.025, 0.03, -0.04);
  root.add(rivet2);

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