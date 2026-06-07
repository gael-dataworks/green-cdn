export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Iridescent/Holo Body: High reflectivity, low roughness. 
  // Using Physical material with slight transmission to simulate glass-like coating.
  // Color is light grey/white to catch light, as per metal brightness rules.
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.05,
    transmission: 0.1,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  // Silver Cap & Loop: Polished metal look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
  });

  // --- Geometry & Meshes ---

  // 1. Main Sphere Body
  const bodyRadius = 0.42;
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 48, 48);
  const ornament_body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(ornament_body);

  // 2. Faceted Cap
  // The reference shows a cap with vertical facets/panels.
  // Cylinder with low radial segments creates a prism shape.
  const capHeight = 0.12;
  const capRadius = 0.13;
  const capSegments = 8; // Octagonal prism look
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, capSegments);
  const cap = new THREE.Mesh(capGeom, silverMat);
  cap.position.y = bodyRadius + (capHeight * 0.5);
  root.add(cap);

  // Cap Base Ring (where cap meets sphere)
  const ringGeom = new THREE.TorusGeometry(capRadius + 0.01, 0.015, 8, 24);
  const cap_ring = new THREE.Mesh(ringGeom, silverMat);
  cap_ring.rotation.x = Math.PI / 2;
  cap_ring.position.y = bodyRadius + 0.01;
  root.add(cap_ring);

  // 3. Hanging Loop
  // Thin wire loop. Torus geometry rotated to stand vertical.
  const loopRadius = 0.06;
  const loopTube = 0.008;
  const loopGeom = new THREE.TorusGeometry(loopRadius, loopTube, 8, 24);
  const hanging_loop = new THREE.Mesh(loopGeom, silverMat);
  // Position above the cap
  hanging_loop.position.y = bodyRadius + capHeight + loopRadius;
  // Rotate so the loop stands up (default torus is flat in XY)
  hanging_loop.rotation.y = Math.PI / 2; 
  root.add(hanging_loop);

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