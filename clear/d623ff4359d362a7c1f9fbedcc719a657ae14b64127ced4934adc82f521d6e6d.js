export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass material for the tumbler
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.98,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  // Pale yellow liquid (lemonade/water)
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xfdfdd0,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });

  // Frosty ice material
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
    transmission: 0.9,
    ior: 1.31,
    transparent: true,
    opacity: 0.8,
  });

  // --- Geometry Construction ---

  // 1. Glass Tumbler (LatheGeometry)
  // Profile defines the cross-section of the glass wall.
  // Coordinates are (radius, height).
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.32, 0.00), // Outer bottom edge
    new THREE.Vector2(0.32, 0.06), // Outer base height
    new THREE.Vector2(0.30, 0.06), // Inner base start (wall thickness)
    new THREE.Vector2(0.33, 0.90), // Inner top (tapered out slightly)
    new THREE.Vector2(0.35, 0.95), // Outer rim lip
    new THREE.Vector2(0.34, 0.95), // Inner rim edge
    new THREE.Vector2(0.34, 0.06), // Inner wall down
    new THREE.Vector2(0.30, 0.06), // Inner base end
    new THREE.Vector2(0.30, 0.00), // Inner bottom center approach
    new THREE.Vector2(0.00, 0.00), // Close loop at center
  ];

  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass);

  // 2. Liquid Volume
  // Fits inside the glass, slightly smaller radius to avoid z-fighting.
  // Tapered cylinder matching the inner profile.
  const liquidHeight = 0.82;
  const liquidBottomR = 0.28;
  const liquidTopR = 0.315;
  
  const liquidGeom = new THREE.CylinderGeometry(liquidBottomR, liquidTopR, liquidHeight, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  // Position liquid so its bottom sits on the inner base of the glass (y=0.06)
  liquid.position.y = 0.06 + liquidHeight / 2;
  root.add(liquid);

  // 3. Ice Cubes
  // Deterministic positions floating in the liquid.
  const iceSize = 0.12;
  const iceGeom = new THREE.BoxGeometry(iceSize, iceSize, iceSize);

  function createIce(x, y, z, rotX, rotY, rotZ) {
    const ice = new THREE.Mesh(iceGeom, iceMat);
    ice.position.set(x, y, z);
    ice.rotation.set(rotX, rotY, rotZ);
    root.add(ice);
  }

  // Ice cube 1
  createIce(0.10, 0.75, 0.05, 0.4, 0.2, 0.1);
  // Ice cube 2
  createIce(-0.08, 0.70, 0.12, -0.3, 0.5, -0.2);
  // Ice cube 3
  createIce(0.02, 0.65, -0.15, 0.6, -0.4, 0.3);
  // Ice cube 4 (partially submerged)
  createIce(-0.12, 0.55, -0.05, 0.1, 0.8, 0.1);

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