export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold: High metalness but capped at 0.6, with emissive to brighten.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.25,
  });

  // Blue Filter Body: Semi-transparent glossy plastic/glass.
  const blueBodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0055ff,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.7,
    transparent: true,
    ior: 1.5,
    thickness: 0.5,
  });

  // Black Plastic: Matte/Rough.
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- 1. Blue Filter Body (Lathe) ---
  // Profile from bottom (y=0) to top (y=1)
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.13, 0.00), // Bottom rim
    new THREE.Vector2(0.13, 0.35), // Main cylinder side
    new THREE.Vector2(0.11, 0.45), // Shoulder taper
    new THREE.Vector2(0.06, 0.55), // Neck
    new THREE.Vector2(0.06, 0.60), // Top of neck
    new THREE.Vector2(0.00, 0.60), // Top center
  ];
  const blueBodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const blueBody = new THREE.Mesh(blueBodyGeom, blueBodyMat);
  // Position so bottom sits on the black base
  blueBody.position.y = 0.05; 
  root.add(blueBody);

  // --- 2. Black Base / Filter Head ---
  // Cylindrical base with a flange
  const baseGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.10, 32);
  const blackBase = new THREE.Mesh(baseGeom, blackPlasticMat);
  blackBase.position.y = -0.05; // Sit below the blue body
  root.add(blackBase);

  // Rib detail on black base (two thin rings)
  const ribGeom = new THREE.TorusGeometry(0.145, 0.008, 8, 32);
  const rib1 = new THREE.Mesh(ribGeom, blackPlasticMat);
  rib1.rotation.x = Math.PI / 2;
  rib1.position.y = -0.08;
  root.add(rib1);

  const rib2 = new THREE.Mesh(ribGeom, blackPlasticMat);
  rib2.rotation.x = Math.PI / 2;
  rib2.position.y = -0.02;
  root.add(rib2);

  // --- 3. Top Brass Connector ---
  const topConnGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 16);
  const topConnector = new THREE.Mesh(topConnGeom, brassMat);
  // Sit on top of the blue body neck
  topConnector.position.y = 0.60 + 0.075; 
  root.add(topConnector);

  // --- 4. Pickup Tube (Curved) ---
  // Path starts from bottom of black base, goes down, curves, and hooks
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.10, 0), // Start below base
    new THREE.Vector3(0, -0.35, 0), // Straight down
    new THREE.Vector3(0.12, -0.45, 0), // Curve out
    new THREE.Vector3(0.12, -0.50, 0), // End of straight section
    new THREE.Vector3(0.08, -0.50, 0), // Hook back slightly
  ]);
  
  const tubeGeom = new THREE.TubeGeometry(tubePath, 20, 0.012, 8, false);
  const pickupTube = new THREE.Mesh(tubeGeom, blackPlasticMat);
  root.add(pickupTube);

  // --- 5. Brass Strainer / Screen at bottom ---
  // Cylinder at the end of the tube
  const strainerGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 16);
  const strainer = new THREE.Mesh(strainerGeom, brassMat);
  // Position at the end of the tube path roughly
  strainer.position.set(0.10, -0.56, 0);
  strainer.rotation.z = Math.PI / 2; // Orient along the tube end direction roughly
  // Actually the tube ends pointing -X roughly, so rotate Z 90 deg makes it point -Y? 
  // Let's align it visually. The tube curves to +X. The strainer hangs down.
  // The tube end is at (0.08, -0.50). The strainer should continue that line.
  // Let's just place it at the tip and rotate to match the curve tangent.
  // Simplified: Place it at the bottom tip, rotated to align with the final segment.
  strainer.position.set(0.10, -0.56, 0);
  strainer.rotation.z = Math.PI / 2; // Horizontal
  strainer.rotation.y = -Math.PI / 4; // Angle it slightly
  
  // Better approach for strainer: Just a cylinder at the bottom of the curve
  const strainerPos = tubePath.getPoint(1); // End of tube
  const strainerTan = tubePath.getTangent(1);
  
  const strainerMesh = new THREE.Mesh(strainerGeom, brassMat);
  strainerMesh.position.copy(strainerPos);
  // Align cylinder Y-axis to the tangent vector
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), strainerTan);
  strainerMesh.quaternion.copy(quaternion);
  root.add(strainerMesh);

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