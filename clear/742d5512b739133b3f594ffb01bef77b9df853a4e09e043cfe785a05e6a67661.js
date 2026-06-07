export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black body (ceramic or coated metal)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.7,
  });

  // Polished metal spout and handle (stainless steel)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Emissive flame
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff5500,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Body (Hollow Vessel) ---
  // Profile defines the cross-section. We trace outer wall, rim thickness, inner wall, inner bottom.
  // Coordinates are (radius, height).
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.24, 0.00), // Outer base edge
    new THREE.Vector2(0.25, 0.08), // Slight belly
    new THREE.Vector2(0.21, 0.38), // Shoulder
    new THREE.Vector2(0.19, 0.42), // Outer rim edge
    new THREE.Vector2(0.16, 0.42), // Inner rim edge (rim thickness ~0.03)
    new THREE.Vector2(0.16, 0.05), // Inner wall down
    new THREE.Vector2(0.05, 0.05), // Inner bottom curve start
    new THREE.Vector2(0.00, 0.05), // Inner bottom center
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Spout ---
  // Tube geometry following a curve from body side outwards and slightly up.
  // Spout is on the left in the reference image (-X direction).
  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.30, 0.00), // Start at body wall
    new THREE.Vector3(-0.28, 0.32, 0.00), // Curve out
    new THREE.Vector3(-0.42, 0.36, 0.00), // Tip
  ]);

  const spoutGeom = new THREE.TubeGeometry(spoutCurve, 16, 0.035, 12, false);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  root.add(spout);

  // --- Handle ---
  // Tube geometry forming an arch on the right side (+X direction).
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 0.15, 0.00), // Lower attachment (back-ish relative to spout, but here side)
    new THREE.Vector3(-0.32, 0.25, 0.00), // Arch out
    new THREE.Vector3(-0.32, 0.35, 0.00), // Arch top
    new THREE.Vector3(-0.18, 0.40, 0.00), // Upper attachment
  ]);
  
  // Wait, looking at reference: Spout is Left, Handle is Right.
  // Let's re-orient handle to be on the +X side to match "opposite spout".
  // Actually, in the image, Spout is pointing Left (-X), Handle is on the Right (+X).
  // My spout curve above was -X. So handle should be +X.
  
  const handleCurveCorrected = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.15, 0.00),  // Lower attach
    new THREE.Vector3(0.35, 0.20, 0.00),  // Arch out
    new THREE.Vector3(0.35, 0.35, 0.00),  // Arch top
    new THREE.Vector3(0.18, 0.40, 0.00),  // Upper attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurveCorrected, 20, 0.04, 12, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // --- Flame ---
  // Elongated sphere/capsule shape at the top center.
  const flameGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  flame.position.set(0, 0.42, 0);
  flame.scale.set(1, 2.5, 1); // Stretch vertically
  // Taper the top slightly by modifying vertices or just use a cone/capsule?
  // Sphere scaled is fine for low poly flame. Let's use a cone for better taper.
  
  const flameConeGeom = new THREE.ConeGeometry(0.05, 0.18, 16);
  const flameCone = new THREE.Mesh(flameConeGeom, flameMat);
  flameCone.position.set(0, 0.42, 0); // Base at rim level roughly
  // Cone apex is +Y by default. Base is at -height/2.
  // We want base near rim (0.42) and tip higher.
  // ConeGeometry: height 0.18. Center at 0.42. Base at 0.42 - 0.09 = 0.33. Tip at 0.42 + 0.09 = 0.51.
  // This puts the base slightly inside the pot, which is good.
  root.add(flameCone);

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