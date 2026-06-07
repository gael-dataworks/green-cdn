export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue anodized aluminum body
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x007bff,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Silver metal connector shield
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Dark interior for connector holes
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bodyRadius = 0.12;
  const bodyLength = 0.55;
  const connWidth = 0.24;
  const connHeight = 0.07;
  const connLength = 0.22;
  const capThickness = 0.02;

  // --- Body ---
  // Cylinder aligned along Z axis
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  bodyGeom.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeom, blueBodyMat);
  root.add(body);

  // --- End Cap ---
  // Thin cylinder at the back
  const capGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, capThickness, 32);
  capGeom.rotateX(Math.PI / 2);
  const endCap = new THREE.Mesh(capGeom, silverMat);
  endCap.position.z = -bodyLength / 2 - capThickness / 2;
  root.add(endCap);

  // --- Connector Shield ---
  // Box aligned along Z axis
  const connGeom = new THREE.BoxGeometry(connWidth, connHeight, connLength);
  const connector = new THREE.Mesh(connGeom, silverMat);
  // Position so it starts exactly at the front face of the body
  connector.position.z = bodyLength / 2 + connLength / 2;
  root.add(connector);

  // --- Connector Holes ---
  // Two rectangular holes on the top face of the connector
  const holeWidth = 0.05;
  const holeLength = 0.08;
  const holeDepth = 0.015; // Slightly recessed or just on surface
  
  // Hole 1 (Left)
  const hole1Geom = new THREE.BoxGeometry(holeWidth, 0.005, holeLength);
  const hole1 = new THREE.Mesh(hole1Geom, darkMat);
  hole1.position.set(-connWidth * 0.25, connHeight / 2 + 0.001, bodyLength / 2 + connLength * 0.3);
  root.add(hole1);

  // Hole 2 (Right)
  const hole2Geom = new THREE.BoxGeometry(holeWidth, 0.005, holeLength);
  const hole2 = new THREE.Mesh(hole2Geom, darkMat);
  hole2.position.set(connWidth * 0.25, connHeight / 2 + 0.001, bodyLength / 2 + connLength * 0.3);
  root.add(hole2);

  // --- USB Logo ---
  // Small raised detail on the side of the connector
  // Simplified as a tiny box
  const logoGeom = new THREE.BoxGeometry(0.08, 0.03, 0.005);
  const logo = new THREE.Mesh(logoGeom, silverMat); // Same material, relies on lighting/normal
  // Position on the side face (X axis)
  logo.position.set(connWidth / 2 + 0.002, 0, bodyLength / 2 + connLength * 0.5);
  logo.rotation.y = Math.PI / 2;
  root.add(logo);

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