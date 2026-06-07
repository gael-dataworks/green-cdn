export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black body (ceramic/painted metal)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Polished silver/chrome (spout, handle)
  // Rule: metalness <= 0.6 for metals to avoid black render in no-env-map
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Emissive flame
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff4400,
    emissiveIntensity: 2.0,
    toneMapped: false,
  });

  // Dark interior (wick holder area)
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry & Meshes ---

  // 1. Body (Hollow Pot)
  // Using LatheGeometry for a smooth, hollow vessel profile
  const profilePoints = [
    new THREE.Vector2(0, 0),          // Center bottom
    new THREE.Vector2(0.28, 0),       // Outer bottom edge
    new THREE.Vector2(0.28, 0.04),    // Outer bottom corner up
    new THREE.Vector2(0.22, 0.46),    // Outer top rim edge
    new THREE.Vector2(0.20, 0.46),    // Inner top rim edge
    new THREE.Vector2(0.20, 0.43),    // Inner top down
    new THREE.Vector2(0.26, 0.04),    // Inner bottom corner
    new THREE.Vector2(0.26, 0.04),    // Duplicate for sharp inner corner
    new THREE.Vector2(0, 0.04)        // Center of inner well
  ];
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // 2. Spout (Metal Cone/Tube)
  // Tapered cylinder, rotated to point left (-X) and slightly up
  const spoutGeom = new THREE.CylinderGeometry(0.03, 0.06, 0.24, 16);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  // Position: attach to left side of body, slightly below rim
  spout.position.set(-0.22, 0.35, 0);
  // Rotate: Default is Y-up. Rotate Z 90deg to point X. Add slight upward tilt.
  spout.rotation.z = Math.PI / 2 + 0.15;
  root.add(spout);

  // 3. Handle (Metal Tube)
  // Curved path using CatmullRomCurve3 for a 'D' shape handle on the right
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 0.43, 0),  // Top attach point
    new THREE.Vector3(0.38, 0.43, 0),  // Top curve out
    new THREE.Vector3(0.38, 0.15, 0),  // Bottom curve out
    new THREE.Vector3(0.22, 0.15, 0)   // Bottom attach point
  ]);
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.025, 12, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // 4. Interior Detail (Dark circle inside)
  // Adds depth to the opening
  const interiorGeom = new THREE.CylinderGeometry(0.19, 0.25, 0.02, 32);
  const interior = new THREE.Mesh(interiorGeom, interiorMat);
  interior.position.y = 0.44;
  root.add(interior);

  // 5. Flame (Emissive Cone)
  // Stylized flame rising from center
  const flameGeom = new THREE.CylinderGeometry(0, 0.05, 0.18, 8);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  flame.position.set(0, 0.55, 0);
  // Slight rotation for organic look
  flame.rotation.z = 0.1;
  root.add(flame);

  // Secondary flame tip (brighter core)
  const flameCoreGeom = new THREE.CylinderGeometry(0, 0.02, 0.08, 8);
  const flameCore = new THREE.Mesh(flameCoreGeom, new THREE.MeshBasicMaterial({ color: 0xffffaa }));
  flameCore.position.set(0, 0.60, 0);
  flameCore.rotation.z = 0.1;
  root.add(flameCore);

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