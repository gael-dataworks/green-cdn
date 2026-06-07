export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green matte/satin finish for the wooden/plastic caps
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1b4d3e,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Clear glass with transmission for realistic refraction
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Dark green sand, high roughness to simulate granular surface
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x144034,
    metalness: 0.0,
    roughness: 1.0,
  });

  // --- Geometries ---

  // 1. Glass Body (Hollow via Lathe profile of the wall cross-section)
  // Profile defines the outer and inner surface in one closed loop
  const glassProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom Center
    new THREE.Vector2(0.35, 0.00), // Bottom Outer Base
    new THREE.Vector2(0.40, 0.25), // Bottom Outer Bulge
    new THREE.Vector2(0.04, 0.48), // Neck Outer (pinch)
    new THREE.Vector2(0.40, 0.75), // Top Outer Bulge
    new THREE.Vector2(0.35, 1.00), // Top Outer Base
    new THREE.Vector2(0.33, 1.00), // Top Inner Base (wall thickness ~0.02)
    new THREE.Vector2(0.38, 0.75), // Top Inner Bulge
    new THREE.Vector2(0.05, 0.48), // Neck Inner
    new THREE.Vector2(0.38, 0.25), // Bottom Inner Bulge
    new THREE.Vector2(0.33, 0.00), // Bottom Inner Base
    new THREE.Vector2(0.00, 0.00), // Close loop
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass_body = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass_body);

  // 2. Caps (Top and Bottom)
  // Using TorusGeometry for the thick rounded ring shape
  // radius = distance from center, tube = thickness of the ring
  const capRadius = 0.39;
  const capTube = 0.06;
  const capGeom = new THREE.TorusGeometry(capRadius, capTube, 16, 32);
  
  // Top Cap
  const top_cap = new THREE.Mesh(capGeom, capMat);
  top_cap.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  top_cap.position.y = 0.98; // Sit on top of glass
  root.add(top_cap);

  // Bottom Cap
  const bottom_cap = new THREE.Mesh(capGeom, capMat);
  bottom_cap.rotation.x = Math.PI / 2;
  bottom_cap.position.y = 0.02; // Sit at bottom of glass
  root.add(bottom_cap);

  // 3. Sand Piles
  // Top Sand: Inverted cone draining from the top bulb
  // Bottom Sand: Upright cone accumulating at the bottom
  const sandTopRadius = 0.30;
  const sandTopHeight = 0.35;
  const sandTopGeom = new THREE.CylinderGeometry(0, sandTopRadius, sandTopHeight, 32);
  const top_sand = new THREE.Mesh(sandTopGeom, sandMat);
  // Position: Tip at the neck (0.48), base higher up
  top_sand.position.y = 0.48 + (sandTopHeight / 2); 
  root.add(top_sand);

  const sandBottomRadius = 0.32;
  const sandBottomHeight = 0.25;
  const sandBottomGeom = new THREE.CylinderGeometry(sandBottomRadius, 0, sandBottomHeight, 32);
  const bottom_sand = new THREE.Mesh(sandBottomGeom, sandMat);
  // Position: Base at bottom (0.0), peak lower down
  bottom_sand.position.y = sandBottomHeight / 2;
  root.add(bottom_sand);

  // 4. Sand Stream
  // Thin cylinder connecting the neck to the bottom pile
  const streamHeight = 0.35; // Distance from neck to bottom pile peak
  const streamGeom = new THREE.CylinderGeometry(0.005, 0.005, streamHeight, 8);
  const sand_stream = new THREE.Mesh(streamGeom, sandMat);
  // Position: Midpoint between neck (0.48) and bottom pile peak (~0.25)
  sand_stream.position.y = 0.48 - (streamHeight / 2);
  root.add(sand_stream);

  // 5. Falling Grains (Deterministic placement)
  // Small spheres along the stream to simulate individual grains
  const grainGeom = new THREE.SphereGeometry(0.008, 8, 8);
  
  const falling_grain_1 = new THREE.Mesh(grainGeom, sandMat);
  falling_grain_1.position.set(0.01, 0.40, 0); // Slight offset X
  root.add(falling_grain_1);

  const falling_grain_2 = new THREE.Mesh(grainGeom, sandMat);
  falling_grain_2.position.set(-0.01, 0.35, 0.01); // Slight offset X, Z
  root.add(falling_grain_2);

  const falling_grain_3 = new THREE.Mesh(grainGeom, sandMat);
  falling_grain_3.position.set(0.005, 0.30, -0.01);
  root.add(falling_grain_3);

  const falling_grain_4 = new THREE.Mesh(grainGeom, sandMat);
  falling_grain_4.position.set(-0.005, 0.25, 0);
  root.add(falling_grain_4);

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