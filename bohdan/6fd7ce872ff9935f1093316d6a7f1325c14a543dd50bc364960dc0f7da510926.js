export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue anodized aluminum body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x007bff,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Silver USB connector shield
  const connectorMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Dark plastic inside connector holes
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.8,
  });

  // White end cap
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.3,
    roughness: 0.5,
  });

  // Dimensions
  const bodyRadius = 0.16;
  const bodyLength = 0.70;
  const connWidth = 0.24;
  const connHeight = 0.09;
  const connLength = 0.22;

  // 1. Main Body (Blue Cylinder)
  // CylinderGeometry is Y-up by default. We want it along Z axis.
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.rotation.x = Math.PI / 2; // Lie down along Z
  root.add(body);

  // 2. USB Connector (Silver Box)
  // Positioned at the front (+Z) of the body
  const connGeom = new THREE.BoxGeometry(connWidth, connHeight, connLength);
  const connector = new THREE.Mesh(connGeom, connectorMat);
  connector.position.z = bodyLength / 2 + connLength / 2;
  // Align vertically centered with body
  root.add(connector);

  // 3. Connector Holes (Two dark rectangles on the face)
  // USB-A has two rectangular holes.
  const holeW = 0.06;
  const holeH = 0.035;
  const holeD = 0.01;
  const holeGeom = new THREE.BoxGeometry(holeW, holeH, holeD);
  
  const hole1 = new THREE.Mesh(holeGeom, holeMat);
  // Left hole (from viewer perspective facing +Z)
  hole1.position.set(-0.06, 0, connLength / 2 + 0.005); 
  root.add(hole1);

  const hole2 = new THREE.Mesh(holeGeom, holeMat);
  // Right hole
  hole2.position.set(0.06, 0, connLength / 2 + 0.005);
  root.add(hole2);

  // 4. End Cap (White circle at the back)
  const capGeom = new THREE.CircleGeometry(bodyRadius * 0.95, 32);
  const endCap = new THREE.Mesh(capGeom, capMat);
  endCap.position.z = -bodyLength / 2 - 0.005; // Slightly in front of back face to avoid z-fighting
  endCap.rotation.y = Math.PI / 2; // Face +Z
  root.add(endCap);

  // Normalization helper
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