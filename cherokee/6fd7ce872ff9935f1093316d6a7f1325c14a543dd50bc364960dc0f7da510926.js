export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue anodized aluminum body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0066cc,
    metalness: 0.4,
    roughness: 0.3,
  });

  // Silver metal connector and cap
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Black for connector holes
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bodyRadius = 0.16;
  const bodyLength = 0.65;
  const capThickness = 0.06;
  const capRadius = 0.15;
  
  const connWidth = 0.27;
  const connHeight = 0.09;
  const connLength = 0.28;

  // --- Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  bodyGeom.rotateX(Math.PI / 2); // Align cylinder axis to Z
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Cap (Rear) ---
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capThickness, 32);
  capGeom.rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeom, metalMat);
  cap.position.z = -bodyLength / 2 - capThickness / 2;
  root.add(cap);

  // --- Connector (Front) ---
  const connGeom = new THREE.BoxGeometry(connWidth, connHeight, connLength);
  const connector = new THREE.Mesh(connGeom, metalMat);
  // Position connector so it touches the body front
  connector.position.z = bodyLength / 2 + connLength / 2;
  root.add(connector);

  // --- Connector Holes ---
  // Two rectangular holes on the top face (+Y)
  const holeW = 0.07;
  const holeH = 0.04;
  const holeD = 0.01;
  const holeGeom = new THREE.BoxGeometry(holeW, holeH, holeD);
  
  const holeY = connHeight / 2 + 0.001; // Slightly above top face to avoid z-fighting
  const holeZOffset = connLength * 0.35; // Offset from connector center towards tip
  
  const hole1 = new THREE.Mesh(holeGeom, holeMat);
  hole1.position.set(-0.08, holeY, connector.position.z + holeZOffset);
  root.add(hole1);

  const hole2 = new THREE.Mesh(holeGeom, holeMat);
  hole2.position.set(0.08, holeY, connector.position.z + holeZOffset);
  root.add(hole2);

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