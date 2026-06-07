export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black body (ceramic/painted metal)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Polished silver/chrome for spout and handle
  // Rule: metalness <= 0.6 for metals without env map to avoid blackness
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Emissive flame
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff4400,
    emissiveIntensity: 2.5,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Dark interior
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Body (Hollow Vessel) ---
  // Lathe profile for a conical frustum with wall thickness
  // Points defined as (radius, y)
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.24, 0.00), // Outer bottom edge
    new THREE.Vector2(0.24, 0.35), // Outer top edge
    new THREE.Vector2(0.15, 0.35), // Inner top edge (rim)
    new THREE.Vector2(0.15, 0.04), // Inner wall bottom
    new THREE.Vector2(0.04, 0.04), // Inner bottom transition
    new THREE.Vector2(0.04, 0.00), // Inner bottom flat
    new THREE.Vector2(0.00, 0.00), // Close center
  ];
  
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Spout ---
  // Conical tube attached to the left side (-X)
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  const spoutHeight = 0.22;
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.055, spoutHeight, 24);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  
  // Position: attach to upper left side of body
  // Body radius at attachment height (~0.25) is approx 0.22
  spout.position.set(-0.22, 0.26, 0);
  
  // Rotate to point outwards and slightly up
  // Default cylinder is Y-up. We want it along -X axis, tilted up ~15 deg.
  spout.rotation.z = Math.PI / 2; // Lie flat along X
  spout.rotation.y = Math.PI;     // Point towards -X
  spout.rotation.x = -0.25;       // Tilt up slightly
  root.add(spout);

  // --- Handle ---
  // Curved tube on the right side (+X)
  // Define a curve for the handle shape
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 0.30, 0), // Attach top near rim
    new THREE.Vector3(0.42, 0.25, 0), // Arch out
    new THREE.Vector3(0.45, 0.15, 0), // Mid arch
    new THREE.Vector3(0.42, 0.05, 0), // Lower arch
    new THREE.Vector3(0.22, 0.08, 0), // Attach bottom
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.018, 12, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // --- Interior / Wick Holder ---
  // A small dark cylinder inside to represent the fuel reservoir/wick base
  const wickBaseGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
  const wickBase = new THREE.Mesh(wickBaseGeom, interiorMat);
  wickBase.position.set(0, 0.34, 0); // Just below rim
  root.add(wickBase);

  // --- Flame ---
  // Stylized flame shape using a cone
  const flameHeight = 0.14;
  const flameGeom = new THREE.ConeGeometry(0.04, flameHeight, 16);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  
  // Position above the opening
  flame.position.set(0, 0.35 + flameHeight * 0.4, 0);
  
  // Slight taper/scale to look more like a flame (wider at bottom)
  // Cone geometry is already tapered, but we can squash it a bit
  flame.scale.set(1, 1.2, 1);
  
  root.add(flame);

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