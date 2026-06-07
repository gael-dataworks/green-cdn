export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Dark polished wood (Rosewood/Ebony style)
  // Reference: wood (polished/satin) -> metalness 0.0, roughness 0.6
  // Color: Deep reddish-brown
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3b261f,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Dark groove material (shadow/recessed)
  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0x1a110e,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Geometry Construction ---

  // 1. Main Shaft & Tip (Lathe for smooth organic taper and rounded tip)
  // Profile points (radius, y) from tip (bottom) to cap junction (top)
  const shaftProfile = [
    new THREE.Vector2(0.00, 0.00),  // Tip apex
    new THREE.Vector2(0.03, 0.04),  // Rounded tip start
    new THREE.Vector2(0.04, 0.10),  // Tip curve out
    new THREE.Vector2(0.05, 0.30),  // Tapering shaft
    new THREE.Vector2(0.065, 0.50), // Upper shaft
    new THREE.Vector2(0.07, 0.60),  // Junction with cap
  ];
  
  const shaftGeom = new THREE.LatheGeometry(shaftProfile, 32);
  const shaft_body = new THREE.Mesh(shaftGeom, woodMat);
  // Shift up so tip is at 0,0,0 locally if needed, but Lathe centers based on points.
  // Our points start at y=0, so tip is at y=0.
  root.add(shaft_body);

  // 2. End Cap (Wider cylinder at the top)
  const capHeight = 0.12;
  const capRadius = 0.085;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap_piece = new THREE.Mesh(capGeom, woodMat);
  // Position on top of shaft (shaft ends at y=0.60)
  cap_piece.position.y = 0.60 + capHeight / 2;
  root.add(cap_piece);

  // 3. Separator Groove (Thin dark ring between shaft and cap)
  const grooveHeight = 0.015;
  const grooveRadius = 0.06; // Slightly smaller than shaft junction to look recessed
  const grooveGeom = new THREE.CylinderGeometry(grooveRadius, grooveRadius, grooveHeight, 32);
  const separator_ring = new THREE.Mesh(grooveGeom, grooveMat);
  // Position at the junction
  separator_ring.position.y = 0.60 + grooveHeight / 2;
  root.add(separator_ring);

  // Optional: Slight rim detail on the cap top/bottom for realism
  // (Skipping to keep it clean and focused on the main forms)

  // Orientation: The object is modeled vertically (Y-up). 
  // The reference shows it lying diagonally. 
  // We rely on fitToUnitCube to center and scale it into the view frustum.
  // To match the "lying down" feel slightly better without random rotation, 
  // we can rotate it 90 degrees to lie along Z, but Y-up is standard for "objects".
  // I will keep it Y-up as per standard primitive orientation, 
  // but the camera in the renderer will handle the view. 
  // However, to make it look like the reference (horizontal), let's rotate it.
  // Reference: Lying on surface.
  root.rotation.x = Math.PI / 2; // Lay it flat on XZ plane

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