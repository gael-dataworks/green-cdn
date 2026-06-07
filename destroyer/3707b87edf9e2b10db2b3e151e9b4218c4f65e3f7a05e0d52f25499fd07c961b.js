export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal body - silver/gray, moderate roughness, capped metalness
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Dark O-ring / seal
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Glowing blue LED / energy tip
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x0088ff,
    emissiveIntensity: 1.5,
  });

  // 1. Base Plate (Extruded Shape)
  // Wing-like shape, flat profile
  const baseShape = new THREE.Shape();
  baseShape.moveTo(-0.35, 0.0);       // Left tip
  baseShape.lineTo(0.25, -0.18);      // Bottom right corner
  baseShape.lineTo(0.25, 0.18);       // Top right corner
  baseShape.lineTo(0.05, 0.25);       // Top indent
  baseShape.lineTo(-0.25, 0.18);      // Top left shoulder
  baseShape.lineTo(-0.35, 0.0);       // Close at tip

  const baseGeom = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });

  const base = new THREE.Mesh(baseGeom, metalMat);
  // Center the extrusion so it sits nicely on Y=0
  base.position.y = -0.02; 
  // Rotate to match the "flat on ground" canonical orientation if needed, 
  // but ExtrudeGeometry extrudes along Z by default. 
  // We want the plate flat on XZ plane, so rotate X by -90 deg.
  base.rotation.x = -Math.PI / 2;
  root.add(base);

  // 2. Nozzle / Cylinder Body
  // Tapered cylinder sitting on the base
  const nozzleGeom = new THREE.CylinderGeometry(0.06, 0.09, 0.28, 32);
  const nozzle = new THREE.Mesh(nozzleGeom, metalMat);
  // Position on the base plate. 
  // Base is at y=0 (thickness 0.04). Nozzle sits on top.
  // Offset slightly towards the wider end of the base (positive Z in local space before rotation)
  // Since base is rotated X -90, local Z of base is now -Y of world? 
  // No, let's just position in world space relative to the group center.
  // Base center is 0,0,0. Nozzle should be at x=0.1, y=0.14, z=0.
  nozzle.position.set(0.1, 0.14, 0);
  root.add(nozzle);

  // 3. O-Ring / Seal at base of nozzle
  const ringGeom = new THREE.TorusGeometry(0.09, 0.006, 8, 24);
  const ring = new THREE.Mesh(ringGeom, rubberMat);
  ring.rotation.x = Math.PI / 2; // Flat in XZ plane
  ring.position.set(0.1, 0.02, 0); // At the bottom of the nozzle
  root.add(ring);

  // 4. Glowing Tip
  // Small square box on top of the nozzle
  const tipGeom = new THREE.BoxGeometry(0.04, 0.015, 0.04);
  const tip = new THREE.Mesh(tipGeom, lightMat);
  // Position at top of nozzle (height 0.28, center at 0.14 + offset 0.1 = 0.24)
  tip.position.set(0.1, 0.28, 0);
  root.add(tip);

  // 5. Secondary Detail - Side vent or groove on nozzle
  // A thin torus segment or box to break up the cylinder
  const grooveGeom = new THREE.TorusGeometry(0.075, 0.004, 8, 24, Math.PI);
  const groove = new THREE.Mesh(grooveGeom, metalMat);
  groove.rotation.x = Math.PI / 2;
  groove.rotation.z = Math.PI; // Face down
  groove.position.set(0.1, 0.10, 0);
  root.add(groove);

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