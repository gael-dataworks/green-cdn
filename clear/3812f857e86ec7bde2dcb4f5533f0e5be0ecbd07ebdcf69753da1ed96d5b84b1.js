export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Iridescent/Glassy Sphere Material
  // Using Physical material for high gloss and clearcoat to simulate the coated glass look.
  // Metalness is kept moderate to avoid blackness without env map, relying on clearcoat for shine.
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
  });

  // Silver Cap Material
  // Polished metal look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry Construction ---

  // 1. Main Sphere Body
  // Radius ~0.45 to leave room for cap and normalization.
  const sphereGeom = new THREE.SphereGeometry(0.45, 64, 64);
  const sphere_body = new THREE.Mesh(sphereGeom, sphereMat);
  root.add(sphere_body);

  // 2. Cap Assembly
  const capGroup = new THREE.Group();
  
  // Cap Base (Faceted Collar)
  // 8 radial segments to create the flat "jewel" facets seen in the reference.
  const capBaseGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 8);
  const cap_base = new THREE.Mesh(capBaseGeom, silverMat);
  cap_base.position.y = 0.45 + 0.04; // Sit on top of sphere
  capGroup.add(cap_base);

  // Cap Top (Smooth Holder)
  // Slightly narrower, smooth cylinder holding the loop.
  const capTopGeom = new THREE.CylinderGeometry(0.045, 0.065, 0.06, 16);
  const cap_top = new THREE.Mesh(capTopGeom, silverMat);
  cap_top.position.y = 0.45 + 0.08 + 0.03; // Stack on base
  capGroup.add(cap_top);

  // 3. Hanging Loop
  // Thin torus rotated to stand upright.
  const loopGeom = new THREE.TorusGeometry(0.05, 0.004, 8, 24, Math.PI);
  const cap_loop = new THREE.Mesh(loopGeom, silverMat);
  cap_loop.rotation.x = Math.PI / 2; // Lay flat in XZ, but Torus is XY by default, so rotate X 90 -> XZ plane? 
  // Wait, Torus is in XY plane. To make it a vertical loop (like a handle), we need it in YZ or XY.
  // Standard Torus is in XY. To make it vertical (standing up along Y), we rotate around X by 90 deg? 
  // No, if Torus is in XY, rotating X by 90 puts it in YZ. That works for a side view loop.
  // But usually loops face the "front". Let's assume the loop is in the YZ plane (facing X) or XY plane (facing Z).
  // Reference shows loop from side profile essentially. Let's put it in the YZ plane so it faces +X/-X.
  cap_loop.rotation.x = Math.PI / 2; 
  cap_loop.position.y = 0.45 + 0.08 + 0.06 + 0.05; // Top of cap + radius
  capGroup.add(cap_loop);

  root.add(capGroup);

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