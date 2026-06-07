export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials - copper/reddish metallic body with emissive for brightness
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc05030,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xc05030,
    emissiveIntensity: 0.35
  });

  const frontMat = new THREE.MeshStandardMaterial({
    color: 0xb04828,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0xb04828,
    emissiveIntensity: 0.3
  });

  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.25
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xffcc66,
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.5
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x803020,
    metalness: 0.5,
    roughness: 0.6
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x903820,
    metalness: 0.5,
    roughness: 0.4
  });

  // Main sphere body
  const sphereRadius = 0.5;
  const mainSphere = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius, 48, 48),
    bodyMat
  );
  root.add(mainSphere);

  // Front face assembly position
  const frontZ = sphereRadius * 0.82;
  const frontRadius = sphereRadius * 0.52;

  // Front circular recessed panel
  const frontPanel = new THREE.Mesh(
    new THREE.CylinderGeometry(frontRadius, frontRadius, 0.06, 48),
    frontMat
  );
  frontPanel.rotation.x = Math.PI / 2;
  frontPanel.position.z = frontZ;
  root.add(frontPanel);

  // Reflector - use lathe for parabolic profile
  const reflectorProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.08, 0.00),
    new THREE.Vector2(0.18, 0.04),
    new THREE.Vector2(0.22, 0.08),
    new THREE.Vector2(0.24, 0.10),
    new THREE.Vector2(0.00, 0.10)
  ];
  const reflectorGeom = new THREE.LatheGeometry(reflectorProfile, 48);
  const reflector = new THREE.Mesh(reflectorGeom, reflectorMat);
  reflector.rotation.x = Math.PI / 2;
  reflector.position.z = frontZ + 0.05;
  root.add(reflector);

  // LED bulb at center of reflector
  const ledRadius = 0.06;
  const ledBulb = new THREE.Mesh(
    new THREE.SphereGeometry(ledRadius, 24, 24),
    ledMat
  );
  ledBulb.position.z = frontZ + 0.12;
  root.add(ledBulb);

  // LED lens cover (slightly larger transparent sphere)
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.85,
    ior: 1.5,
    transparent: true
  });
  const ledLens = new THREE.Mesh(
    new THREE.SphereGeometry(ledRadius * 1.15, 24, 24),
    lensMat
  );
  ledLens.position.z = frontZ + 0.12;
  root.add(ledLens);

  // Top button
  const buttonRadius = frontRadius * 0.11;
  const topButton = new THREE.Mesh(
    new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.012, 16),
    buttonMat
  );
  topButton.rotation.x = Math.PI / 2;
  topButton.position.set(0, frontRadius * 0.62, frontZ + 0.035);
  root.add(topButton);

  // Bottom button
  const bottomButton = new THREE.Mesh(
    new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.012, 16),
    buttonMat
  );
  bottomButton.rotation.x = Math.PI / 2;
  bottomButton.position.set(0, -frontRadius * 0.62, frontZ + 0.035);
  root.add(bottomButton);

  // Seam ring around front face (visible circular groove)
  const seamRing = new THREE.Mesh(
    new THREE.TorusGeometry(frontRadius + 0.015, 0.006, 16, 48),
    seamMat
  );
  seamRing.rotation.y = Math.PI / 2;
  seamRing.position.z = frontZ + 0.03;
  root.add(seamRing);

  // Inner reflector ring (decorative detail around LED)
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.008, 16, 48),
    reflectorMat
  );
  innerRing.rotation.y = Math.PI / 2;
  innerRing.position.z = frontZ + 0.11;
  root.add(innerRing);

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