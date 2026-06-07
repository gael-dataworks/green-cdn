export default function generate(THREE) {
  // Materials
  // Copper body: polished metal look, capped metalness per rules.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb85c3a,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Gold reflector: slightly rougher to diffuse light, high metalness.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Glowing bulb: emissive for the light source.
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffaa00,
    emissiveIntensity: 2.5,
  });

  // Button material: dark, matte plastic/rubber.
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a20,
    metalness: 0.1,
    roughness: 0.8,
  });

  const root = new THREE.Group();

  // --- Main Body ---
  // A large sphere forming the main housing.
  const bodyRadius = 0.45;
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 32, 32);
  const body = new THREE.Mesh(bodyGeom, copperMat);
  body.name = "body";
  root.add(body);

  // --- Front Face Cap ---
  // A circular disc embedded in the front of the sphere.
  const capRadius = 0.34;
  const capThickness = 0.05;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capThickness, 32);
  const faceCap = new THREE.Mesh(capGeom, copperMat);
  faceCap.name = "face_cap";
  // Rotate cylinder to face +Z (default is Y-up)
  faceCap.rotation.x = Math.PI / 2;
  // Position slightly forward to sit on the sphere surface
  faceCap.position.z = bodyRadius - (capThickness * 0.2);
  root.add(faceCap);

  // --- Reflector ---
  // A conical frustum inside the cap, opening towards +Z.
  // CylinderGeometry: radiusTop (at +Y local), radiusBottom (at -Y local).
  // Rotated X=90deg: +Y local -> +Z world (Front). -Y local -> -Z world (Back).
  // We want opening at Front (+Z), so radiusTop = Large, radiusBottom = Small.
  const reflectorDepth = 0.12;
  const reflectorFrontR = 0.20;
  const reflectorBackR = 0.05;
  const reflectorGeom = new THREE.CylinderGeometry(reflectorFrontR, reflectorBackR, reflectorDepth, 32);
  const reflector = new THREE.Mesh(reflectorGeom, goldMat);
  reflector.name = "reflector";
  reflector.rotation.x = Math.PI / 2;
  // Position: Start at cap surface, go back half depth
  reflector.position.z = faceCap.position.z + (capThickness / 2) + (reflectorDepth / 2);
  root.add(reflector);

  // --- Bulb / LED ---
  // Small glowing sphere at the focal point of the reflector.
  const bulbRadius = 0.06;
  const bulbGeom = new THREE.SphereGeometry(bulbRadius, 16, 16);
  const bulb = new THREE.Mesh(bulbGeom, bulbMat);
  bulb.name = "bulb";
  // Position near the narrow end of the reflector
  bulb.position.z = reflector.position.z + (reflectorDepth / 2) - (bulbRadius * 0.5);
  root.add(bulb);

  // --- Buttons ---
  // Two small circular buttons on the face cap (top and bottom).
  const btnRadius = 0.035;
  const btnHeight = 0.015;
  const btnGeom = new THREE.CylinderGeometry(btnRadius, btnRadius, btnHeight, 16);
  
  // Top Button
  const btnTop = new THREE.Mesh(btnGeom, buttonMat);
  btnTop.name = "button_top";
  btnTop.rotation.x = Math.PI / 2;
  // Position on the cap face, slightly offset from center
  btnTop.position.set(0, 0.22, faceCap.position.z + (capThickness / 2) + (btnHeight / 2));
  root.add(btnTop);

  // Bottom Button
  const btnBottom = new THREE.Mesh(btnGeom, buttonMat);
  btnBottom.name = "button_bottom";
  btnBottom.rotation.x = Math.PI / 2;
  btnBottom.position.set(0, -0.22, faceCap.position.z + (capThickness / 2) + (btnHeight / 2));
  root.add(btnBottom);

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