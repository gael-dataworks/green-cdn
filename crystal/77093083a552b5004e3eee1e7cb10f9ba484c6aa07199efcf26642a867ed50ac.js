export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Frame: Dark green plastic/wood, satin finish
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a4738,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Glass: Clear with slight green tint, high transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
  });

  // Sand: Dark green granular, matte
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x2e5a45,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const rimRadius = 0.26;
  const rimTube = 0.055;
  const glassTopY = 0.46;
  const glassBottomY = -0.46;
  const neckY = 0.0;

  // --- Top Base (Rim) ---
  // Torus rotated to lie flat in XZ plane
  const topBaseGeom = new THREE.TorusGeometry(rimRadius, rimTube, 24, 48);
  const topBase = new THREE.Mesh(topBaseGeom, frameMat);
  topBase.rotation.x = Math.PI / 2;
  topBase.position.y = glassTopY + rimTube * 0.5;
  root.add(topBase);

  // --- Bottom Base (Rim) ---
  const bottomBaseGeom = new THREE.TorusGeometry(rimRadius, rimTube, 24, 48);
  const bottomBase = new THREE.Mesh(bottomBaseGeom, frameMat);
  bottomBase.rotation.x = Math.PI / 2;
  bottomBase.position.y = glassBottomY - rimTube * 0.5;
  root.add(bottomBase);

  // --- Glass Body (Lathe) ---
  // Profile points (radius, y) from bottom to top
  // We define the right half of the cross-section
  const profilePoints = [
    new THREE.Vector2(0.03, 0.0),    // Neck center
    new THREE.Vector2(0.24, 0.35),   // Bottom bulb max
    new THREE.Vector2(0.21, 0.46),   // Bottom rim connection
    new THREE.Vector2(0.21, 0.46),   // Top rim connection (same radius)
    new THREE.Vector2(0.24, -0.35),  // Top bulb max (mirrored Y for profile logic? No, Lathe rotates around Y)
  ];
  
  // Correct Lathe profile: define from bottom Y to top Y, radius >= 0
  const glassProfile = [
    new THREE.Vector2(0.03, 0.0),    // Neck
    new THREE.Vector2(0.25, 0.30),   // Lower bulb curve out
    new THREE.Vector2(0.22, 0.45),   // Lower rim inner edge
    // Gap for neck logic? No, continuous profile for one mesh
    // Let's do bottom half then top half
    new THREE.Vector2(0.03, 0.0),    // Neck
    new THREE.Vector2(0.25, -0.30),  // Upper bulb curve out
    new THREE.Vector2(0.22, -0.45),  // Upper rim inner edge
  ];
  
  // Wait, Lathe takes points from bottom to top.
  // Let's construct the full profile: Bottom Rim -> Bottom Bulb -> Neck -> Top Bulb -> Top Rim
  const fullProfile = [
    new THREE.Vector2(0.22, -0.45),  // Bottom rim inner
    new THREE.Vector2(0.26, -0.30),  // Bottom bulb max
    new THREE.Vector2(0.03, 0.0),    // Neck
    new THREE.Vector2(0.26, 0.30),   // Top bulb max
    new THREE.Vector2(0.22, 0.45),   // Top rim inner
  ];

  const glassGeom = new THREE.LatheGeometry(fullProfile, 32);
  const glassBody = new THREE.Mesh(glassGeom, glassMat);
  root.add(glassBody);

  // --- Sand ---
  
  // Top Sand: Inverted cone/frustum funneling into neck
  // Cylinder with radiusTop > radiusBottom to simulate the funnel shape
  const sandTopH = 0.35;
  const sandTopGeom = new THREE.CylinderGeometry(0.20, 0.02, sandTopH, 32);
  const sandTop = new THREE.Mesh(sandTopGeom, sandMat);
  // Position so bottom of cone is at neck
  sandTop.position.y = 0.0 + sandTopH / 2 + 0.02; 
  root.add(sandTop);

  // Bottom Sand: Conical pile
  const sandBottomH = 0.35;
  const sandBottomGeom = new THREE.ConeGeometry(0.22, sandBottomH, 32);
  const sandBottom = new THREE.Mesh(sandBottomGeom, sandMat);
  sandBottom.position.y = -0.45 + sandBottomH / 2 + 0.02;
  root.add(sandBottom);

  // Sand Stream: Thin cylinder falling from neck
  const streamGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.30, 8);
  const stream = new THREE.Mesh(streamGeom, sandMat);
  stream.position.y = 0.0;
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