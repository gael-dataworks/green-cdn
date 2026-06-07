export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Body: Anodized aluminum / painted metal (Copper/Red-Orange)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc05030,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Bezel: Slightly darker/recessed metal ring
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xa04020,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Reflector: Brass/Gold interior, slightly glowing from the light
  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3,
  });

  // Bulb: Bright light source
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0xffaa00,
    emissiveIntensity: 2.5,
  });

  // Screws: Dark grey metal
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.7,
    roughness: 0.5,
  });

  // --- Main Body ---
  // A perfect sphere
  const bodyGeom = new THREE.SphereGeometry(0.45, 48, 48);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Lens Assembly Group ---
  // Positioned at the front of the sphere (facing +Z)
  const lensGroup = new THREE.Group();
  lensGroup.position.set(0, 0, 0.45);
  root.add(lensGroup);

  // --- Reflector Cup ---
  // Frustum cylinder: wider at front, narrower at back
  // RadiusTop (front) = 0.24, RadiusBottom (back) = 0.08, Height = 0.10
  const reflectorGeom = new THREE.CylinderGeometry(0.24, 0.08, 0.10, 32);
  const reflector = new THREE.Mesh(reflectorGeom, reflectorMat);
  // Rotate to face +Z (default cylinder is Y-up)
  reflector.rotation.x = -Math.PI / 2;
  // Push back slightly so the front rim is flush with sphere surface
  reflector.position.z = -0.05;
  lensGroup.add(reflector);

  // --- Bezel Ring ---
  // The flat ring surrounding the lens
  const bezelGeom = new THREE.RingGeometry(0.24, 0.26, 32);
  const bezel = new THREE.Mesh(bezelGeom, bezelMat);
  // Rotate to face +Z
  bezel.rotation.x = -Math.PI / 2;
  // Position at the very front of the cup
  bezel.position.z = 0.05;
  lensGroup.add(bezel);

  // --- Light Bulb ---
  // Small sphere at the center of the reflector
  const bulbGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const bulb = new THREE.Mesh(bulbGeom, bulbMat);
  // Position at the back of the reflector cup
  bulb.position.z = -0.05;
  lensGroup.add(bulb);

  // --- Screws ---
  // Two small screw heads on the bezel (top and bottom)
  const screwGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  
  const screwTop = new THREE.Mesh(screwGeom, screwMat);
  screwTop.rotation.x = -Math.PI / 2;
  screwTop.position.set(0, 0.21, 0.05);
  lensGroup.add(screwTop);

  const screwBottom = new THREE.Mesh(screwGeom, screwMat);
  screwBottom.rotation.x = -Math.PI / 2;
  screwBottom.position.set(0, -0.21, 0.05);
  lensGroup.add(screwBottom);

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