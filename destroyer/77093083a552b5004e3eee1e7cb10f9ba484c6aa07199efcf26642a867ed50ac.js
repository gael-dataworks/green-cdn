export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green base: matte plastic or painted wood
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e5640,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Glass: transparent, slight blue tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xeef5f5,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Sand: dark green, matte, granular
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x164230,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry Helpers ---

  // 1. Bases (Top and Bottom)
  // Profile: flat bottom, rounded outer edge, flat top with inner rim
  const baseProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.28, 0.00), // Outer edge bottom
    new THREE.Vector2(0.28, 0.04), // Outer edge side (rounded via segments)
    new THREE.Vector2(0.26, 0.08), // Outer edge top curve
    new THREE.Vector2(0.22, 0.10), // Inner rim top
    new THREE.Vector2(0.22, 0.08), // Inner rim drop
    new THREE.Vector2(0.00, 0.08), // Center top (to close the shape if needed, but lathe handles it)
  ];
  // Smoother profile for the rounded edge
  const baseSmoothProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.28, 0.00),
    new THREE.Vector2(0.29, 0.03),
    new THREE.Vector2(0.27, 0.08),
    new THREE.Vector2(0.22, 0.10),
    new THREE.Vector2(0.22, 0.09),
    new THREE.Vector2(0.00, 0.09),
  ];

  const baseGeom = new THREE.LatheGeometry(baseSmoothProfile, 32);
  
  const bottom_base = new THREE.Mesh(baseGeom, baseMat);
  bottom_base.position.y = -0.45; // Bottom of the hourglass
  root.add(bottom_base);

  const top_base = new THREE.Mesh(baseGeom, baseMat);
  top_base.position.y = 0.45; // Top of the hourglass
  top_base.rotation.x = Math.PI; // Flip upside down
  root.add(top_base);

  // 2. Glass Body
  // Figure-8 profile
  const glassProfile = [
    new THREE.Vector2(0.22, -0.35), // Bottom rim inner
    new THREE.Vector2(0.24, -0.30), // Bottom bulb max width
    new THREE.Vector2(0.04, 0.00),  // Neck
    new THREE.Vector2(0.24, 0.30),  // Top bulb max width
    new THREE.Vector2(0.22, 0.35),  // Top rim inner
  ];
  
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass_body = new THREE.Mesh(glassGeom, glassMat);
  root.add(glass_body);

  // 3. Sand - Top Chamber
  // Needs to fill the top bulb. Profile matches glass interior but capped flat at top.
  const topSandProfile = [
    new THREE.Vector2(0.04, 0.00),  // Neck start
    new THREE.Vector2(0.23, 0.25),  // Bulge out
    new THREE.Vector2(0.23, 0.32),  // Flat top of sand level
    new THREE.Vector2(0.00, 0.32),  // Center top
  ];
  const topSandGeom = new THREE.LatheGeometry(topSandProfile, 32);
  const sand_top = new THREE.Mesh(topSandGeom, sandMat);
  root.add(sand_top);

  // 4. Sand - Bottom Chamber
  // Conical pile
  const bottomSandGeom = new THREE.CylinderGeometry(0.23, 0.0, 0.25, 32);
  const sand_bottom = new THREE.Mesh(bottomSandGeom, sandMat);
  sand_bottom.position.y = -0.35 + 0.125; // Sit on bottom of bulb
  root.add(sand_bottom);

  // 5. Falling Stream
  // Thin cylinder from neck to pile
  const streamGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
  const sand_stream = new THREE.Mesh(streamGeom, sandMat);
  sand_stream.position.y = -0.15; // Halfway down
  root.add(sand_stream);

  // 6. Floating Particles (Optional detail for realism)
  // A few small spheres in the lower chamber
  const particleGeom = new THREE.SphereGeometry(0.01, 4, 4);
  const particlePositions = [
    [0.05, -0.1, 0.1],
    [-0.05, -0.2, -0.1],
    [0.0, -0.25, 0.15],
    [-0.08, -0.15, 0.05]
  ];
  
  for (const [x, y, z] of particlePositions) {
    const p = new THREE.Mesh(particleGeom, sandMat);
    p.position.set(x, y, z);
    root.add(p);
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