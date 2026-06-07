export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal / anodized aluminum for the body
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x909090,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Darker metal for the connector ring
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x505050,
    metalness: 0.7,
    roughness: 0.4,
  });

  // Emissive blue for the active tip
  const emitterMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x0088ff,
    emissiveIntensity: 2.0,
  });

  // --- Base Plate ---
  // Angular flat plate with a notch
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-0.30, -0.20);
  baseShape.lineTo(0.30, -0.20);
  baseShape.lineTo(0.30, 0.10);
  baseShape.lineTo(0.05, 0.10); // Notch start
  baseShape.lineTo(0.05, 0.35); // Notch end / inner corner
  baseShape.lineTo(-0.30, 0.35);
  baseShape.lineTo(-0.30, -0.20);

  const baseExtrudeSettings = {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  };

  const baseGeom = new THREE.ExtrudeGeometry(baseShape, baseExtrudeSettings);
  // Center the geometry vertically so it sits on y=0 if positioned at y=0.02
  baseGeom.translate(0, 0.02, 0); 
  
  const base_plate = new THREE.Mesh(baseGeom, metalMat);
  // Rotate to lie flat on XZ plane (Extrude defaults to Z-up relative to shape plane)
  // Actually ExtrudeGeometry extrudes along Z. So the shape is in XY.
  // We want the plate flat on XZ. So rotate X by -90 deg.
  base_plate.rotation.x = -Math.PI / 2;
  root.add(base_plate);

  // --- Nozzle Body ---
  // Tapered cylinder
  const nozzleGeom = new THREE.CylinderGeometry(0.08, 0.11, 0.35, 32);
  const nozzle_body = new THREE.Mesh(nozzleGeom, metalMat);
  // Position on the plate. 
  // The plate is now in XZ plane. Y is up.
  // Place it near the notch area.
  nozzle_body.position.set(0.10, 0.20, 0.10);
  root.add(nozzle_body);

  // --- Connector Ring ---
  // Thin ring at the base of the nozzle
  const ringGeom = new THREE.TorusGeometry(0.11, 0.02, 16, 32);
  const connector_ring = new THREE.Mesh(ringGeom, ringMat);
  connector_ring.rotation.x = Math.PI / 2;
  connector_ring.position.set(0.10, 0.035, 0.10); // Base of nozzle
  root.add(connector_ring);

  // --- Emitter Tip ---
  // Small glowing cylinder at the top
  const tipGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.06, 32);
  const emitter_tip = new THREE.Mesh(tipGeom, emitterMat);
  emitter_tip.position.set(0.10, 0.40, 0.10); // Top of nozzle
  root.add(emitter_tip);

  // --- Side Detail / Heat Sink Fins (Optional but adds realism) ---
  // Small ridges on the nozzle
  const finGeom = new THREE.BoxGeometry(0.24, 0.015, 0.04);
  const fin1 = new THREE.Mesh(finGeom, metalMat);
  fin1.position.set(0.10, 0.10, 0.10);
  root.add(fin1);

  const fin2 = new THREE.Mesh(finGeom, metalMat);
  fin2.position.set(0.10, 0.14, 0.10);
  root.add(fin2);

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