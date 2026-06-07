export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green frame/sand color
  const greenColor = 0x1a4d2e;
  
  const frameMat = new THREE.MeshStandardMaterial({
    color: greenColor,
    metalness: 0.1,
    roughness: 0.4,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    opacity: 0.3,
    thickness: 0.5,
  });

  const sandMat = new THREE.MeshStandardMaterial({
    color: greenColor,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry: Bases (Top and Bottom) ---
  // Profile for the rounded rim base
  // Starts at center bottom, goes out, up rounded edge, in to top center
  const baseProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.42, 0.00),
    new THREE.Vector2(0.45, 0.03),
    new THREE.Vector2(0.45, 0.12),
    new THREE.Vector2(0.42, 0.15),
    new THREE.Vector2(0.00, 0.15),
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  
  const bottomBase = new THREE.Mesh(baseGeom, frameMat);
  bottomBase.position.y = 0.0;
  root.add(bottomBase);

  const topBase = new THREE.Mesh(baseGeom, frameMat);
  topBase.position.y = 1.05; // Positioned above the glass
  root.add(topBase);

  // --- Geometry: Glass Body ---
  // Hourglass profile: bottom center -> bulb out -> neck -> bulb out -> top center
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center (inside base)
    new THREE.Vector2(0.34, 0.05),   // Bottom bulb start
    new THREE.Vector2(0.38, 0.25),   // Max bottom width
    new THREE.Vector2(0.11, 0.50),   // Neck (narrowest point)
    new THREE.Vector2(0.38, 0.75),   // Max top width
    new THREE.Vector2(0.34, 0.95),   // Top bulb end
    new THREE.Vector2(0.00, 1.00),   // Top center
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  
  const glassBody = new THREE.Mesh(glassGeom, glassMat);
  glassBody.position.y = 0.15; // Sit on top of bottom base
  root.add(glassBody);

  // --- Geometry: Sand ---
  
  // 1. Bottom Pile (Cone)
  // Matches the curve of the bottom bulb roughly
  const bottomSandGeom = new THREE.ConeGeometry(0.36, 0.45, 32);
  const bottomSand = new THREE.Mesh(bottomSandGeom, sandMat);
  bottomSand.position.y = 0.15 + 0.225; // Base at bottom of glass + half height
  root.add(bottomSand);

  // 2. Top Bulk (Inverted Cone / Frustum)
  // Fills the top bulb down to the neck
  const topSandGeom = new THREE.CylinderGeometry(0.36, 0.10, 0.45, 32);
  const topSand = new THREE.Mesh(topSandGeom, sandMat);
  // Position so bottom of cylinder is at neck
  topSand.position.y = 0.15 + 0.50 + 0.225; 
  root.add(topSand);

  // 3. Falling Stream
  const streamGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
  const stream = new THREE.Mesh(streamGeom, sandMat);
  stream.position.y = 0.15 + 0.50 + 0.225; // Centered at neck height roughly
  root.add(stream);

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