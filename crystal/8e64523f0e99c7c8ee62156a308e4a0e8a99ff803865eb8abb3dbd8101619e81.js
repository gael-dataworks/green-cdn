export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Amethyst: Deep purple, translucent, glossy.
  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a3a9e,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.7,
    ior: 1.55,
    transparent: true,
    thickness: 0.5,
  });

  // Silver: Bail and Chain. Capped metalness at 0.6 per rules.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Inclusion Base: Creamy/white mineral matrix.
  const inclusionBaseMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d5,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Inclusion Center: Darker mineral core.
  const inclusionCoreMat = new THREE.MeshStandardMaterial({
    color: 0x5a4a3a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- 1. The Amethyst Stone (Lathe) ---
  // Profile defines the teardrop shape. Y goes from bottom (-) to top (+).
  const profilePoints = [
    new THREE.Vector2(0.00, -0.60), // Bottom tip
    new THREE.Vector2(0.35, -0.25), // Max width (belly)
    new THREE.Vector2(0.32,  0.10), // Shoulder
    new THREE.Vector2(0.18,  0.40), // Neck start
    new THREE.Vector2(0.00,  0.50), // Top center
  ];
  // Smooth the profile using a curve
  const curve = new THREE.SplineCurve(profilePoints);
  const points = curve.getSpacedPoints(32);
  const stoneGeom = new THREE.LatheGeometry(points, 32);
  const stone = new THREE.Mesh(stoneGeom, stoneMat);
  root.add(stone);

  // --- 2. Inclusions (Surface Decoration) ---
  // Helper to approximate radius at a given Y for placement
  function getRadiusAtY(y) {
    // Simple linear interpolation between key profile points defined above
    if (y <= -0.60) return 0;
    if (y <= -0.25) {
      const t = (y - (-0.60)) / (-0.25 - (-0.60));
      return 0 + t * (0.35 - 0);
    }
    if (y <= 0.10) {
      const t = (y - (-0.25)) / (0.10 - (-0.25));
      return 0.35 + t * (0.32 - 0.35);
    }
    if (y <= 0.40) {
      const t = (y - 0.10) / (0.40 - 0.10);
      return 0.32 + t * (0.18 - 0.32);
    }
    if (y <= 0.50) {
      const t = (y - 0.40) / (0.50 - 0.40);
      return 0.18 + t * (0.00 - 0.18);
    }
    return 0;
  }

  function addInclusion(y, angle, scale, hasCore) {
    const r = getRadiusAtY(y);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    
    // Create a flattened sphere to sit on the surface
    const patchGeom = new THREE.SphereGeometry(scale, 16, 16);
    const patch = new THREE.Mesh(patchGeom, inclusionBaseMat);
    
    // Position
    patch.position.set(x, y, z);
    
    // Orient to face outward (radial normal)
    // The normal at this point on a lathe is roughly (x, slope, z). 
    // For simplicity on a rounded teardrop, pointing away from center axis works well visually.
    patch.lookAt(0, y, 0); 
    patch.rotateX(Math.PI / 2); // Sphere looks up by default, we want it flat against surface
    
    // Flatten it significantly to look like a surface deposit
    patch.scale.set(1, 1, 0.15);
    
    root.add(patch);

    if (hasCore) {
      const coreGeom = new THREE.SphereGeometry(scale * 0.5, 16, 16);
      const core = new THREE.Mesh(coreGeom, inclusionCoreMat);
      core.position.copy(patch.position);
      // Move core slightly outward so it doesn't z-fight
      core.position.add(patch.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.01));
      core.lookAt(0, y, 0);
      core.rotateX(Math.PI / 2);
      core.scale.set(1, 1, 0.2);
      root.add(core);
    }
  }

  // Place 5 distinct inclusions based on visual reference
  // Reference shows: one large top-left, one mid-right, one bottom-left, one bottom-mid, one small mid-left
  addInclusion(0.35, Math.PI * 1.2, 0.06, true); // Top neck area
  addInclusion(0.05, Math.PI * 0.8, 0.08, true);  // Mid right
  addInclusion(-0.15, Math.PI * 1.5, 0.09, true); // Lower left
  addInclusion(-0.35, Math.PI * 0.5, 0.07, false);// Bottom area
  addInclusion(-0.45, Math.PI * 1.8, 0.05, true); // Very bottom tip area

  // --- 3. The Bail (Silver Cap) ---
  // A torus segment or tube arching over the top neck
  const bailRadius = 0.08;
  const bailTube = 0.025;
  // Torus is in XY plane. We need it to arch over Z or X. 
  // Let's use a Tube for better control or a rotated Torus.
  // A Torus rotated 90 deg on X lies in YZ plane.
  const bailGeom = new THREE.TorusGeometry(bailRadius, bailTube, 16, 32, Math.PI);
  const bail = new THREE.Mesh(bailGeom, silverMat);
  bail.position.set(0, 0.48, 0);
  bail.rotation.x = Math.PI / 2; // Arch forward/back
  bail.rotation.z = Math.PI; // Flip to sit on top
  root.add(bail);

  // --- 4. The Chain ---
  // Simple link chain going upwards
  const linkRadius = 0.035;
  const linkTube = 0.008;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 8, 16);
  
  const chainGroup = new THREE.Group();
  let chainY = 0.55;
  const linkCount = 6;
  
  for (let i = 0; i < linkCount; i++) {
    const link = new THREE.Mesh(linkGeom, silverMat);
    // Alternate rotation for chain links
    if (i % 2 === 0) {
      link.rotation.y = Math.PI / 2;
    } else {
      link.rotation.x = Math.PI / 2;
    }
    link.position.set(0, chainY, 0);
    chainGroup.add(link);
    chainY += 0.05; // Spacing
  }
  root.add(chainGroup);

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