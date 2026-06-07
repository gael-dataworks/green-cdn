export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black body (ceramic or coated metal)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Polished silver metal (spout and handle)
  // Cap metalness at 0.6 to avoid black reflection issues without env map
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Emissive flame material
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff4400,
    emissiveIntensity: 2.5,
    roughness: 0.4,
    metalness: 0.0,
  });

  // Dark interior/wick holder
  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Body ---
  // Main conical body. Using Lathe for smooth taper and potential subtle curvature.
  // Profile: bottom-center -> bottom-rim -> top-rim -> top-inner-rim -> top-center
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00),      // Bottom center
    new THREE.Vector2(0.24, 0.00),      // Bottom outer rim
    new THREE.Vector2(0.17, 0.42),      // Top outer rim (tapered)
    new THREE.Vector2(0.15, 0.42),      // Top thickness start
    new THREE.Vector2(0.14, 0.38),      // Inner slope
    new THREE.Vector2(0.00, 0.38),      // Top inner center (open)
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Spout ---
  // Tapered cylinder for the spout.
  // Dimensions: length ~0.22, start radius ~0.06 (at body), end radius ~0.025 (tip)
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.06, 0.22, 16);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  
  // Position and rotate spout
  // It attaches on the left side (-X) and angles slightly up
  spout.position.set(-0.16, 0.28, 0.0);
  spout.rotation.z = Math.PI / 2;      // Point along -X
  spout.rotation.y = -Math.PI / 6;     // Angle forward slightly
  spout.rotation.x = -0.15;            // Angle up slightly
  root.add(spout);

  // --- Handle ---
  // Torus arc for the D-shaped handle.
  // Radius ~0.11, Tube ~0.022
  const handleGeom = new THREE.TorusGeometry(0.11, 0.022, 16, 32, Math.PI + 0.4);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  
  // Position handle on the right side (+X), rotated to stand vertically
  handle.position.set(0.16, 0.22, 0.0);
  handle.rotation.y = Math.PI / 2;     // Face the side
  handle.rotation.z = Math.PI / 2;     // Stand up
  // The torus default start angle might need adjustment to look like a handle
  // Default torus starts at 0 (3 o'clock). We want the gap at the bottom or top?
  // Image shows handle attached at top and bottom of the body side.
  // A standard torus arc from 0 to PI+0.4 creates a C-shape.
  // Let's adjust rotation to align attachment points.
  handle.rotation.x = Math.PI;         // Flip to align attachments
  
  // Fine-tune handle position to match attachment points on the body
  // Attachments seem to be near the top rim and mid-lower body.
  handle.position.set(0.15, 0.20, 0.05); 
  handle.rotation.set(Math.PI / 2, Math.PI / 2, 0); // Re-orient
  
  // Actually, simpler approach for handle:
  // Create a tube path or just rotate the torus correctly.
  // Let's use a Torus with specific rotation.
  const handleMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.10, 0.024, 16, 40, Math.PI + 0.6),
    metalMat
  );
  // Place on right side
  handleMesh.position.set(0.14, 0.24, 0.0);
  // Rotate to face X axis, then tilt to match the curve
  handleMesh.rotation.y = Math.PI / 2; 
  handleMesh.rotation.z = Math.PI / 2;
  // The gap in the torus needs to be at the bottom or oriented correctly.
  // Default Torus gap is at the end of the arc.
  // Let's just position it and rely on the visual.
  root.add(handleMesh);


  // --- Interior / Wick Holder ---
  // A dark cylinder inside the top opening to represent the fuel reservoir
  const wickGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32);
  const wick = new THREE.Mesh(wickGeom, wickMat);
  wick.position.set(0, 0.38, 0); // Sit at the top opening level
  root.add(wick);

  // --- Flame ---
  // Procedural flame shape using Lathe for a teardrop/flicker profile
  const flameProfile = [
    new THREE.Vector2(0.00, 0.00),      // Base center
    new THREE.Vector2(0.04, 0.08),      // Base width
    new THREE.Vector2(0.025, 0.18),     // Mid taper
    new THREE.Vector2(0.00, 0.28),      // Tip
  ];
  const flameGeom = new THREE.LatheGeometry(flameProfile, 16);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  
  // Position flame rising from the center
  flame.position.set(0, 0.40, 0);
  // Add a slight random-looking tilt via deterministic rotation for variety
  flame.rotation.z = 0.1;
  flame.rotation.x = -0.05;
  root.add(flame);

  // --- Inner Flame Core (Optional for depth) ---
  const coreGeom = new THREE.ConeGeometry(0.015, 0.15, 8);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.position.set(0, 0.45, 0);
  root.add(core);

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