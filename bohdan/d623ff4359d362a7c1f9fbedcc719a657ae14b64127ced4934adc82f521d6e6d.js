export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear Glass: High transmission, low roughness, standard glass IOR
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5, // Helps with refraction realism
  });

  // Lemonade Liquid: Milky, pale yellow, semi-transparent
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdfcd0, // Pale creamy yellow
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6, // Less transparent than glass
    ior: 1.33, // Water-like
    transparent: true,
    opacity: 0.9,
  });

  // Ice: Slightly blue-tinted, very clear, high transmission
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.31,
    transparent: true,
  });

  // --- Geometry: Glass ---
  // We use LatheGeometry to create a hollow glass with a thick base.
  // Profile points define the cross-section of the glass wall (outer then inner).
  // Coordinates: (radius, height)
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00),  // Center bottom
    new THREE.Vector2(0.28, 0.00),  // Outer bottom edge
    new THREE.Vector2(0.35, 0.90),  // Outer top rim
    new THREE.Vector2(0.32, 0.90),  // Inner top rim (wall thickness ~0.03)
    new THREE.Vector2(0.25, 0.12),  // Inner bottom corner (base thickness ~0.12)
    new THREE.Vector2(0.00, 0.12),  // Center of inner base
  ];

  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // --- Geometry: Liquid ---
  // The liquid fills the glass up to about 80% height.
  // We need a cylinder that tapers to match the glass interior.
  // Glass interior radii: Bottom (at y=0.12) is 0.25. Top (at y=0.90) is 0.32.
  // Liquid height: from y=0.12 to y=0.75 (approx).
  // Liquid bottom radius: 0.25
  // Liquid top radius: Interpolate. Height span = 0.78. Liquid span = 0.63.
  // Ratio = 0.63 / 0.78 = 0.807.
  // Radius diff = 0.32 - 0.25 = 0.07.
  // Liquid top radius = 0.25 + (0.07 * 0.807) ≈ 0.306.
  
  const liquidHeight = 0.63;
  const liquidBottomRadius = 0.25;
  const liquidTopRadius = 0.306;
  const liquidY = 0.12 + (liquidHeight / 2);

  const liquidGeom = new THREE.CylinderGeometry(
    liquidBottomRadius, 
    liquidTopRadius, 
    liquidHeight, 
    32
  );
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = liquidY;
  root.add(liquid);

  // --- Geometry: Ice Cubes ---
  // 3 distinct ice cubes floating in the liquid.
  // Using BoxGeometry with deterministic rotations and positions.
  const iceSize = 0.09;
  const iceGeom = new THREE.BoxGeometry(iceSize, iceSize, iceSize);

  // Ice 1: Center-ish, floating high
  const ice1 = new THREE.Mesh(iceGeom, iceMat);
  ice1.position.set(0.02, 0.65, -0.05);
  ice1.rotation.set(0.4, 0.2, 0.1);
  root.add(ice1);

  // Ice 2: Left side, tilted
  const ice2 = new THREE.Mesh(iceGeom, iceMat);
  ice2.position.set(-0.12, 0.55, 0.08);
  ice2.rotation.set(-0.3, 0.5, -0.2);
  root.add(ice2);

  // Ice 3: Right side, lower
  const ice3 = new THREE.Mesh(iceGeom, iceMat);
  ice3.position.set(0.10, 0.45, -0.10);
  ice3.rotation.set(0.2, -0.4, 0.3);
  root.add(ice3);

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