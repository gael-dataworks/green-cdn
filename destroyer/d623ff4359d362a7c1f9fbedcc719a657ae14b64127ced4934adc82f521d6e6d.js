export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const GLASS_HEIGHT = 1.0;
  const BASE_HEIGHT = 0.08;
  const TOP_RADIUS_OUT = 0.34;
  const TOP_RADIUS_IN = 0.30;
  const BOT_RADIUS_OUT = 0.30;
  const BOT_RADIUS_IN = 0.26;
  const RIM_HEIGHT = 0.90;
  const LIQUID_FILL = 0.85; // 85% full

  // --- Materials ---
  // Glass: Clear, slightly frosted, high transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Liquid: Milky pale yellow, semi-transparent
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffe0,
    metalness: 0.0,
    roughness: 0.3,
    transmission: 0.4,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });

  // Ice: Clear white/blueish chunks
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.31,
    transparent: true,
  });

  // --- Glass Body (Lathe) ---
  // Profile traces the cross-section of the glass material
  const profilePoints = [
    new THREE.Vector2(BOT_RADIUS_OUT, 0.00), // 1. Bottom Outer
    new THREE.Vector2(TOP_RADIUS_OUT, RIM_HEIGHT), // 2. Top Outer (tapered)
    new THREE.Vector2(TOP_RADIUS_IN, RIM_HEIGHT), // 3. Top Inner
    new THREE.Vector2(BOT_RADIUS_IN, BASE_HEIGHT), // 4. Base Inner
    new THREE.Vector2(BOT_RADIUS_IN, 0.00), // 5. Bottom Inner
    new THREE.Vector2(BOT_RADIUS_OUT, 0.00), // 6. Close loop at Bottom Outer
  ];

  const glassGeom = new THREE.LatheGeometry(profilePoints, 32);
  const glassMesh = new THREE.Mesh(glassGeom, glassMat);
  root.add(glassMesh);

  // --- Liquid (Cylinder) ---
  // Tapered cylinder to match inner glass walls
  const liquidHeight = (RIM_HEIGHT - BASE_HEIGHT) * LIQUID_FILL;
  const liquidTopY = BASE_HEIGHT + liquidHeight;
  
  // Interpolate radii for liquid surface
  const taperRatio = (liquidTopY - BASE_HEIGHT) / (RIM_HEIGHT - BASE_HEIGHT);
  const liquidTopR = BOT_RADIUS_IN + (TOP_RADIUS_IN - BOT_RADIUS_IN) * taperRatio;
  const liquidBotR = BOT_RADIUS_IN;

  const liquidGeom = new THREE.CylinderGeometry(liquidTopR, liquidBotR, liquidHeight, 32);
  const liquidMesh = new THREE.Mesh(liquidGeom, liquidMat);
  liquidMesh.position.y = BASE_HEIGHT + liquidHeight / 2;
  root.add(liquidMesh);

  // --- Ice Cubes (Boxes) ---
  // Deterministic positions based on indices to avoid randomness
  const icePositions = [
    { x: 0.10, y: 0.15, z: 0.10, rx: 0.5, ry: 0.2, rz: 0.1, s: 0.08 },
    { x: -0.12, y: 0.25, z: -0.05, rx: 1.2, ry: 0.8, rz: 2.1, s: 0.07 },
    { x: 0.05, y: 0.35, z: -0.15, rx: 0.3, ry: 1.5, rz: 0.9, s: 0.09 },
  ];

  const iceGeom = new THREE.BoxGeometry(1, 1, 1);
  
  for (let i = 0; i < icePositions.length; i++) {
    const p = icePositions[i];
    const ice = new THREE.Mesh(iceGeom, iceMat);
    ice.position.set(p.x, p.y, p.z);
    ice.rotation.set(p.rx, p.ry, p.rz);
    ice.scale.setScalar(p.s);
    root.add(ice);
  }

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