export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Using emissive to ensure brightness in the dim renderer as per handbook.
  // Metalness capped at 0.6 to avoid black rendering without env map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe8c84a,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xe8c84a,
    emissiveIntensity: 0.35,
  });

  // Emerald Gem: Physical material for transmission/refraction look.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x006633,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.85,
    ior: 1.57, // Emerald IOR
    transparent: true,
    thickness: 0.5,
  });

  // --- Dimensions ---
  const bandRadius = 0.14;
  const bandTube = 0.018;
  const gemWidth = 0.11;  // X scale
  const gemHeight = 0.14; // Y scale
  const gemDepth = 0.06;  // Z scale

  // --- 1. The Band (Shank) ---
  // Standard torus, rotated to lie flat in XZ plane.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 48);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.02; // Sit slightly lower so gem sits on top
  root.add(band);

  // --- 2. The Bezel Setting ---
  // An oval ring holding the stone. Using TubeGeometry + EllipseCurve for perfect oval.
  const curve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    gemWidth / 2,    // xRadius
    gemHeight / 2,   // yRadius
    0, 2 * Math.PI,  // startAngle, endAngle
    false,           // clockwise
    0                // rotation
  );

  const points = curve.getPoints(64);
  // Convert 2D points to 3D Vector3 for the curve (lying in XY plane)
  const path3D = new THREE.CatmullRomCurve3(
    points.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  path3D.closed = true;

  const bezelGeom = new THREE.TubeGeometry(path3D, 64, 0.006, 8, true);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  // The curve is in XY plane, facing +Z. This matches the camera view.
  // We need to push it forward slightly so it's in front of the band's back curve
  // and centered on the gem.
  bezel.position.z = 0.02; 
  root.add(bezel);

  // --- 3. The Gemstone ---
  // Icosahedron gives nice facets. Scaled to oval shape.
  const gemGeom = new THREE.IcosahedronGeometry(1, 1); // Detail 1 for facets
  const gem = new THREE.Mesh(gemGeom, gemMat);
  
  // Scale to fit the bezel oval
  gem.scale.set(gemWidth / 2, gemHeight / 2, gemDepth / 2);
  
  // Position inside the bezel
  gem.position.z = 0.02; 
  root.add(gem);

  // --- 4. Prongs / Details (Optional but adds realism) ---
  // Simple small boxes at cardinal points of the bezel to suggest holding the stone
  const prongGeom = new THREE.BoxGeometry(0.01, 0.015, 0.01);
  const prongPositions = [
    [0, gemHeight/2, 0.02],
    [0, -gemHeight/2, 0.02],
    [gemWidth/2, 0, 0.02],
    [-gemWidth/2, 0, 0.02]
  ];

  for (const [x, y, z] of prongPositions) {
    const prong = new THREE.Mesh(prongGeom, goldMat);
    prong.position.set(x, y, z);
    // Rotate prongs to angle slightly inward
    if (x === 0) prong.rotation.x = (y > 0 ? -0.2 : 0.2);
    if (y === 0) prong.rotation.y = (x > 0 ? -0.2 : 0.2);
    root.add(prong);
  }

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