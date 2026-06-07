export default function generate(THREE) {
  // Materials - anodized metal body with emissive boost for brightness
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc85a3a,
    metalness: 0.45,
    roughness: 0.32,
    emissive: 0xc85a3a,
    emissiveIntensity: 0.28,
  });

  const frontFaceMat = new THREE.MeshStandardMaterial({
    color: 0xb85030,
    metalness: 0.45,
    roughness: 0.32,
  });

  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.22,
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffeeaa,
    emissive: 0xffaa33,
    emissiveIntensity: 2.0,
  });

  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
  });

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x9a4535,
    metalness: 0.35,
    roughness: 0.45,
  });

  const root = new THREE.Group();

  // Main spherical body
  const sphereRadius = 0.44;
  const bodyGeom = new THREE.SphereGeometry(sphereRadius, 48, 48);
  const main_body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(main_body);

  // Front face circular recessed panel
  const frontRadius = 0.26;
  const frontDepth = 0.055;
  const frontFaceGeom = new THREE.CylinderGeometry(frontRadius, frontRadius, frontDepth, 48);
  const front_face = new THREE.Mesh(frontFaceGeom, frontFaceMat);
  front_face.rotation.x = Math.PI / 2;
  front_face.position.z = sphereRadius - frontDepth * 0.4;
  root.add(front_face);

  // Circular groove/seam around front face perimeter
  const grooveRadius = frontRadius + 0.01;
  const grooveGeom = new THREE.TorusGeometry(grooveRadius, 0.0035, 16, 64);
  const seam = new THREE.Mesh(grooveGeom, buttonMat);
  seam.rotation.y = Math.PI / 2;
  seam.position.z = sphereRadius - frontDepth * 0.4;
  root.add(seam);

  // Reflector cone inside the front recess
  const reflectorBaseRadius = 0.14;
  const reflectorTopRadius = 0.035;
  const reflectorHeight = 0.09;
  const reflectorGeom = new THREE.CylinderGeometry(reflectorTopRadius, reflectorBaseRadius, reflectorHeight, 32);
  const reflector = new THREE.Mesh(reflectorGeom, reflectorMat);
  reflector.rotation.x = Math.PI / 2;
  reflector.position.z = sphereRadius - frontDepth - reflectorHeight * 0.5;
  root.add(reflector);

  // LED emitter (glowing sphere at focal point of reflector)
  const ledRadius = 0.038;
  const ledGeom = new THREE.SphereGeometry(ledRadius, 24, 24);
  const led_emitter = new THREE.Mesh(ledGeom, ledMat);
  led_emitter.position.z = sphereRadius - frontDepth - reflectorHeight + 0.012;
  root.add(led_emitter);

  // Clear protective lens over LED
  const lensRadius = 0.13;
  const lensThickness = 0.01;
  const lensGeom = new THREE.CylinderGeometry(lensRadius, lensRadius, lensThickness, 32);
  const lens = new THREE.Mesh(lensGeom, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = sphereRadius - frontDepth - 0.006;
  root.add(lens);

  // Top button (small circular button above the light)
  const buttonRadius = 0.026;
  const buttonHeight = 0.009;
  const buttonGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, buttonHeight, 20);

  const top_button = new THREE.Mesh(buttonGeom, buttonMat);
  top_button.rotation.x = Math.PI / 2;
  top_button.position.set(0, 0.105, sphereRadius - frontDepth * 0.4);
  root.add(top_button);

  // Bottom button (small circular button below the light)
  const bottom_button = new THREE.Mesh(buttonGeom, buttonMat);
  bottom_button.rotation.x = Math.PI / 2;
  bottom_button.position.set(0, -0.105, sphereRadius - frontDepth * 0.4);
  root.add(bottom_button);

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