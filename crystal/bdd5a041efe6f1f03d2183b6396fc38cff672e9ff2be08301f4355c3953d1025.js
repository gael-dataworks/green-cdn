export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Iridescent purple/pink metal.
  // Using metalness 0.6 (max allowed for visibility without env map) and low roughness.
  // Emissive adds depth and simulates the bright reflections seen in the reference.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd040a0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x401030,
    emissiveIntensity: 0.3,
  });

  // --- 1. Main Body (Lathe) ---
  // Profile defines the teardrop shape with a segmented tip.
  // Coordinates: (radius, y). Y is up.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Tip
    new THREE.Vector2(0.06, 0.08), // First ring
    new THREE.Vector2(0.04, 0.12), // Neck
    new THREE.Vector2(0.08, 0.16), // Second ring
    new THREE.Vector2(0.12, 0.30), // Start taper
    new THREE.Vector2(0.35, 0.70), // Belly
    new THREE.Vector2(0.50, 1.00), // Base rim
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, metalMat);
  // Lathe is centered at origin. We want the base at y=1.0 to align with face.
  // But LatheGeometry centers the geometry? No, it uses the points as is.
  // So the base is at y=1.0, tip at y=0.
  // We need to shift it so the group center is roughly in the middle for normalization.
  // Let's keep it local for now and rotate the group later.
  root.add(body);

  // --- 2. Base Face (Disk) ---
  // A flat disk at the base of the body (y=1.0).
  const faceRadius = 0.50;
  const faceGeom = new THREE.CircleGeometry(faceRadius, 32);
  const face = new THREE.Mesh(faceGeom, metalMat);
  face.position.set(0, 1.0, 0);
  face.rotation.x = Math.PI / 2; // Face the +Z direction (initially)
  // Wait, if we rotate the whole group later, this orientation matters.
  // Let's orient the face to be in the XZ plane at y=1.0.
  // CircleGeometry is in XY plane. Rotate X by 90 deg -> XZ plane. Normal points +Z.
  // But we want the spiral to be visible from the side.
  // Let's assume the object lies along X axis eventually.
  // For now, let's keep body vertical (Y up). Face is on top (XZ plane).
  root.add(face);

  // --- 3. Spiral Ridge (Tube) ---
  // Create a spiral path on the face (XZ plane at y=1.0).
  const spiralPoints = [];
  const turns = 2.5;
  const segments = 64;
  const startR = 0.42;
  const endR = 0.08;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    const r = startR - (startR - endR) * t;
    // Spiral in XZ plane
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = 1.0 + 0.02; // Slightly raised above face
    spiralPoints.push(new THREE.Vector3(x, y, z));
  }

  const spiralPath = new THREE.CatmullRomCurve3(spiralPoints);
  const spiralGeom = new THREE.TubeGeometry(spiralPath, 64, 0.035, 8, false);
  const spiral = new THREE.Mesh(spiralGeom, metalMat);
  root.add(spiral);

  // --- 4. Center Cap ---
  // Small circle at the center of the spiral.
  const capGeom = new THREE.CircleGeometry(0.06, 16);
  const cap = new THREE.Mesh(capGeom, metalMat);
  cap.position.set(0, 1.02, 0);
  cap.rotation.x = Math.PI / 2;
  root.add(cap);

  // --- Orientation ---
  // The object in the reference lies horizontally, tip pointing left.
  // Currently: Body is vertical (Y up), Face is on top (+Y).
  // We want: Body along X axis, Tip at -X, Face at +X.
  // Rotate -90 deg around Z: Y becomes X.
  // Tip (was y=0) -> x=0. Base (was y=1) -> x=1.
  // This puts the tip at origin and base at +X.
  // We want the tip to point left (-X).
  // So rotate 90 deg around Z? Y becomes -X.
  // Tip (y=0) -> x=0. Base (y=1) -> x=-1.
  // So Base is at -X, Tip at origin.
  // Let's just rotate the group to match the visual: Tip Left, Face Right.
  // Current: Tip at (0,0,0), Base at (0,1,0).
  // Target: Tip at (-0.5, 0, 0), Base at (0.5, 0, 0).
  // Rotate -90 deg around Z: (0,1,0) -> (1,0,0). Tip at (0,0,0).
  // So Base is at +X. Tip at origin.
  // This matches "Tip Left, Face Right" if we shift the position.
  // But fitToUnitCube will center it.
  // So: Rotate -90 deg around Z.
  root.rotation.z = -Math.PI / 2;

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