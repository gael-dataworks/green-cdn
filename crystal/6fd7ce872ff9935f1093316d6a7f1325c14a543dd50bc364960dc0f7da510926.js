export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue anodized aluminum body
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e88e5,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Silver metal cap (back)
  const silverCapMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // USB connector shield (steel)
  const usbShieldMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // USB internal plastic (black)
  const usbPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const bodyRadius = 0.18;
  const bodyLength = 0.70;
  const capThickness = 0.05;
  
  const usbWidth = 0.24;
  const usbHeight = 0.10;
  const usbLength = 0.25;

  // --- Main Body (Blue Cylinder) ---
  // CylinderGeometry is Y-up by default. We want it along Z.
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  const body = new THREE.Mesh(bodyGeom, blueBodyMat);
  body.rotation.x = Math.PI / 2; // Align to Z axis
  // Position so the back is at -bodyLength/2 and front at +bodyLength/2 relative to center
  // We will center the whole object later, but let's build relative to origin for now.
  // Let's place the body center at (0,0,0) initially.
  root.add(body);

  // --- Back Cap (Silver Disc) ---
  const capGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, capThickness, 32);
  const cap = new THREE.Mesh(capGeom, silverCapMat);
  cap.rotation.x = Math.PI / 2;
  // Place at the back of the body
  cap.position.z = -bodyLength / 2 - capThickness / 2;
  root.add(cap);

  // --- USB Connector Shield ---
  const shieldGeom = new THREE.BoxGeometry(usbWidth, usbHeight, usbLength);
  const shield = new THREE.Mesh(shieldGeom, usbShieldMat);
  // Position at the front of the body
  shield.position.z = bodyLength / 2 + usbLength / 2;
  root.add(shield);

  // --- USB Internal Plastic Tongue ---
  // Slightly smaller than the shield, inset
  const plasticWidth = usbWidth * 0.85;
  const plasticHeight = usbHeight * 0.6;
  const plasticDepth = usbLength * 0.8;
  const plasticGeom = new THREE.BoxGeometry(plasticWidth, plasticHeight, plasticDepth);
  const plastic = new THREE.Mesh(plasticGeom, usbPlasticMat);
  plastic.position.z = bodyLength / 2 + usbLength * 0.6; // Inset from front
  root.add(plastic);

  // --- USB Shield Holes (Indentations) ---
  // Two rectangular dark spots on the top/bottom faces of the shield
  const holeWidth = usbWidth * 0.25;
  const holeLength = usbWidth * 0.15; // Actually holes are along the width usually? 
  // Standard USB-A holes are rectangular slots on the top and bottom metal casing.
  // In the image, we see the top face. There are two rectangular holes.
  // Let's model them as thin dark boxes slightly inset into the top face.
  
  const holeDepth = 0.01;
  const holeGeom = new THREE.BoxGeometry(holeWidth, holeDepth, usbWidth * 0.12);
  
  // Hole 1 (Left)
  const hole1 = new THREE.Mesh(holeGeom, usbPlasticMat);
  hole1.position.set(-usbWidth * 0.25, usbHeight / 2 - holeDepth/2, shield.position.z);
  root.add(hole1);

  // Hole 2 (Right)
  const hole2 = new THREE.Mesh(holeGeom, usbPlasticMat);
  hole2.position.set(usbWidth * 0.25, usbHeight / 2 - holeDepth/2, shield.position.z);
  root.add(hole2);

  // --- Normalization ---
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