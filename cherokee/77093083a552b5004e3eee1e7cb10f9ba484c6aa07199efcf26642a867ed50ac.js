export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green frame: matte plastic/painted wood
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Clear glass: physical material for transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Dark green sand: matte, granular look
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x0f3d2e,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometries & Meshes ---

  // 1. Glass Body (Hourglass shape)
  // We create a closed 2D profile to lathe, giving the glass thickness.
  // Profile goes: Top Outer -> Top Inner -> Neck Inner -> Bottom Inner -> Bottom Outer -> Close
  const glassProfile = [
    new THREE.Vector2(0.23, 0.40), // Top Outer Rim
    new THREE.Vector2(0.21, 0.40), // Top Inner Rim (thickness ~0.02)
    new THREE.Vector2(0.05, 0.00), // Neck Inner (narrowest point)
    new THREE.Vector2(0.21, -0.40), // Bottom Inner Rim
    new THREE.Vector2(0.23, -0.40), // Bottom Outer Rim
    new THREE.Vector2(0.23, 0.40), // Close loop
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glassBody = new THREE.Mesh(glassGeom, glassMat);
  root.add(glassBody);

  // 2. Top Frame Cap
  // Profile: Flat bottom, rounded top edge, hollow center
  const capProfile = [
    new THREE.Vector2(0.26, -0.04), // Bottom Outer
    new THREE.Vector2(0.26, 0.04),  // Top Outer
    new THREE.Vector2(0.24, 0.06),  // Top Edge Rounded
    new THREE.Vector2(0.22, 0.04),  // Top Inner
    new THREE.Vector2(0.22, -0.04), // Bottom Inner
    new THREE.Vector2(0.26, -0.04), // Close
  ];
  const capGeom = new THREE.LatheGeometry(capProfile, 32);
  
  const topCap = new THREE.Mesh(capGeom, frameMat);
  topCap.position.y = 0.44; // Sit on top of glass (glass top is at 0.40)
  root.add(topCap);

  const bottomCap = new THREE.Mesh(capGeom, frameMat);
  bottomCap.position.y = -0.44; // Sit below glass (glass bottom is at -0.40)
  bottomCap.rotation.x = Math.PI; // Flip to match bottom orientation if needed, but lathe is symmetric Y-wise usually. 
  // Actually, the cap profile defined above has a rounded top. For the bottom cap, we want the rounded part facing down/out.
  // The profile defined has rounded top (y=0.06). If we place it at y=-0.44, the rounded part is at -0.38 (inside).
  // We need to flip the profile or the mesh. Let's flip the mesh rotation X by PI.
  root.add(bottomCap);

  // 3. Sand Piles
  // Top Sand: Cone shape, flat top, tapering to neck
  // Using a cone geometry but scaled to fit inside the glass neck
  const topSandGeom = new THREE.CylinderGeometry(0.04, 0.18, 0.25, 32);
  const topSand = new THREE.Mesh(topSandGeom, sandMat);
  // Position: The sand fills the top bulb. Glass neck is at 0.0. Glass top inner is ~0.40.
  // Sand cone base is at top, tip at neck.
  topSand.position.y = 0.20; 
  // CylinderGeometry is centered. Height 0.25. Top at 0.20 + 0.125 = 0.325. Bottom at 0.075.
  // We want tip at neck (0.0). So shift down.
  topSand.position.y = 0.125; 
  root.add(topSand);

  // Bottom Sand: Pile at the bottom, cone shape
  const bottomSandGeom = new THREE.CylinderGeometry(0.01, 0.19, 0.15, 32);
  const bottomSand = new THREE.Mesh(bottomSandGeom, sandMat);
  // Position: Base at bottom of glass (-0.40). Tip pointing up.
  bottomSand.position.y = -0.325; // -0.40 (bottom) + 0.075 (half height)
  root.add(bottomSand);

  // 4. Falling Sand Stream
  // Thin cylinder connecting top sand tip to bottom sand pile
  const streamGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8);
  const sandStream = new THREE.Mesh(streamGeom, sandMat);
  sandStream.position.y = 0.0; // Centered at neck
  root.add(sandStream);

  // 5. Falling Particles (Optional detail for realism)
  // A few small spheres falling
  const particleGeom = new THREE.SphereGeometry(0.006, 8, 8);
  const particles = [
    { y: 0.05, s: 0.8 },
    { y: 0.02, s: 1.0 },
    { y: -0.02, s: 0.9 },
    { y: -0.06, s: 1.1 },
  ];
  particles.forEach(p => {
    const mesh = new THREE.Mesh(particleGeom, sandMat);
    mesh.position.set(0, p.y, 0);
    mesh.scale.setScalar(p.s);
    root.add(mesh);
  });

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