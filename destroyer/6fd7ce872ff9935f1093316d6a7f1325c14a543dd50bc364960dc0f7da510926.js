export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x2d88ff,
    metalness: 0.6,
    roughness: 0.4,
  });

  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Dimensions
  const bodyRadius = 0.16;
  const bodyLength = 0.70;
  const capThickness = 0.04;
  
  const usbWidth = 0.26;
  const usbHeight = 0.12;
  const usbLength = 0.25;

  // 1. Main Body (Blue Cylinder)
  // CylinderGeometry is Y-up by default. Rotate X by 90deg to align with Z axis.
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  const body = new THREE.Mesh(bodyGeom, blueBodyMat);
  body.rotation.x = Math.PI / 2;
  root.add(body);

  // 2. End Cap (Silver Disc)
  // Positioned at the back of the body (-Z direction relative to body center)
  const capGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, capThickness, 32);
  const cap = new THREE.Mesh(capGeom, silverMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = -(bodyLength / 2) - (capThickness / 2);
  root.add(cap);

  // 3. USB Connector Shield (Silver Box)
  // Positioned at the front of the body (+Z direction)
  const usbShieldGeom = new THREE.BoxGeometry(usbWidth, usbHeight, usbLength);
  const usbShield = new THREE.Mesh(usbShieldGeom, silverMat);
  usbShield.position.z = (bodyLength / 2) + (usbLength / 2);
  root.add(usbShield);

  // 4. USB Insulator (Black Plastic Tongue)
  // Slightly smaller than shield, recessed slightly
  const insulatorWidth = usbWidth * 0.85;
  const insulatorHeight = usbHeight * 0.6;
  const insulatorDepth = usbLength * 0.9;
  const usbInsulatorGeom = new THREE.BoxGeometry(insulatorWidth, insulatorHeight, insulatorDepth);
  const usbInsulator = new THREE.Mesh(usbInsulatorGeom, blackPlasticMat);
  // Position inside the shield, slightly towards the front
  usbInsulator.position.z = (bodyLength / 2) + (usbLength * 0.1); 
  root.add(usbInsulator);

  // 5. USB Contact Holes (Small dark rectangles on the shield face)
  // These represent the stamped recesses on the metal shell
  const holeWidth = usbWidth * 0.25;
  const holeHeight = usbHeight * 0.25;
  const holeDepth = 0.01;
  const holeGeom = new THREE.BoxGeometry(holeWidth, holeHeight, holeDepth);
  
  const holeOffsetZ = (bodyLength / 2) + (usbLength * 0.05); // Near the face of the shield
  const holeYOffset = usbHeight * 0.35;

  const hole1 = new THREE.Mesh(holeGeom, blackPlasticMat);
  hole1.position.set(-usbWidth * 0.25, holeYOffset, holeOffsetZ);
  root.add(hole1);

  const hole2 = new THREE.Mesh(holeGeom, blackPlasticMat);
  hole2.position.set(usbWidth * 0.25, holeYOffset, holeOffsetZ);
  root.add(hole2);

  // Normalize to fit unit cube
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