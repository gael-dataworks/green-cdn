export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: High metalness, low roughness. Cap metalness at 0.6 as per rules.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Gem material base (will clone for colors)
  const gemBaseMat = new THREE.MeshPhysicalMaterial({
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // --- Dimensions & Profile ---
  // Profile for LatheGeometry (radius, height)
  // Scale is arbitrary, will be normalized later.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Center bottom
    new THREE.Vector2(0.24, 0.00),  // Foot edge
    new THREE.Vector2(0.22, 0.04),  // Foot rim
    new THREE.Vector2(0.10, 0.15),  // Stem narrow
    new THREE.Vector2(0.13, 0.22),  // Stem knop (bulb)
    new THREE.Vector2(0.09, 0.32),  // Stem top
    new THREE.Vector2(0.14, 0.36),  // Bowl base start
    new THREE.Vector2(0.26, 0.65),  // Bowl widest
    new THREE.Vector2(0.25, 0.82),  // Bowl taper in
    new THREE.Vector2(0.28, 0.86),  // Rim flare
    new THREE.Vector2(0.29, 0.88),  // Rim top edge
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  const cup = new THREE.Mesh(cupGeom, silverMat);
  root.add(cup);

  // --- Decorative Bands (Rim & Base of Bowl) ---
  // Top Rim Band
  const rimBandGeom = new THREE.TorusGeometry(0.285, 0.015, 16, 32);
  const rimBand = new THREE.Mesh(rimBandGeom, silverMat);
  rimBand.rotation.x = Math.PI / 2;
  rimBand.position.y = 0.86;
  root.add(rimBand);

  // Pattern on rim band (small spheres)
  const dotGeom = new THREE.SphereGeometry(0.012, 8, 8);
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const dot = new THREE.Mesh(dotGeom, silverMat);
    dot.position.set(Math.cos(angle) * 0.285, 0.86, Math.sin(angle) * 0.285);
    root.add(dot);
  }

  // Base of Bowl Band (separating bowl from stem)
  const baseBandGeom = new THREE.TorusGeometry(0.145, 0.012, 16, 32);
  const baseBand = new THREE.Mesh(baseBandGeom, silverMat);
  baseBand.rotation.x = Math.PI / 2;
  baseBand.position.y = 0.36;
  root.add(baseBand);

  // --- Relief Medallions (Approximating the figures) ---
  // Create a shape for a generic medallion/arch
  const medallionShape = new THREE.Shape();
  medallionShape.moveTo(0, 0);
  medallionShape.lineTo(0, 0.08);
  medallionShape.quadraticCurveTo(0, 0.12, 0.04, 0.12);
  medallionShape.quadraticCurveTo(0.08, 0.12, 0.08, 0.08);
  medallionShape.lineTo(0.08, 0);
  medallionShape.lineTo(0, 0);
  
  // Inner detail
  const holePath = new THREE.Path();
  holePath.moveTo(0.02, 0.02);
  holePath.lineTo(0.02, 0.07);
  holePath.quadraticCurveTo(0.02, 0.10, 0.04, 0.10);
  holePath.quadraticCurveTo(0.06, 0.10, 0.06, 0.07);
  holePath.lineTo(0.06, 0.02);
  medallionShape.holes.push(holePath);

  const medallionGeom = new THREE.ExtrudeGeometry(medallionShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  // Center the geometry
  medallionGeom.translate(-0.04, 0, -0.0075);

  const medallionMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0, // Slightly darker to show depth
    metalness: 0.6,
    roughness: 0.3,
  });

  // Place medallions around the bowl
  const medallionCount = 8;
  const medallionRadius = 0.265; // Slightly larger than bowl surface
  const medallionY = 0.55;
  for (let i = 0; i < medallionCount; i++) {
    const angle = (i / medallionCount) * Math.PI * 2;
    const med = new THREE.Mesh(medallionGeom, medallionMat);
    med.position.set(Math.cos(angle) * medallionRadius, medallionY, Math.sin(angle) * medallionRadius);
    med.lookAt(0, medallionY, 0);
    med.rotateY(Math.PI); // Face outward
    root.add(med);
  }

  // Foot Decoration (Foliate pattern approximation)
  const footBandGeom = new THREE.TorusGeometry(0.20, 0.01, 16, 32);
  const footBand = new THREE.Mesh(footBandGeom, silverMat);
  footBand.rotation.x = Math.PI / 2;
  footBand.position.y = 0.04;
  root.add(footBand);

  // --- Gems ---
  const gemColors = [0xffb7c5, 0xadd8e6, 0x98fb98, 0xffd700]; // Pink, Blue, Green, Gold
  const gemGeom = new THREE.SphereGeometry(0.025, 12, 12);

  function addGem(colorHex, x, y, z) {
    const mat = gemBaseMat.clone();
    mat.color.setHex(colorHex);
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(x, y, z);
    root.add(gem);
  }

  // Bowl Gems (Scattered)
  const bowlGemPositions = [
    { a: 0.3, h: 0.70, r: 0.275, c: 0 },
    { a: 1.1, h: 0.65, r: 0.275, c: 1 },
    { a: 2.2, h: 0.72, r: 0.275, c: 2 },
    { a: 3.5, h: 0.60, r: 0.275, c: 3 },
    { a: 4.8, h: 0.68, r: 0.275, c: 0 },
    { a: 5.9, h: 0.55, r: 0.275, c: 1 },
  ];

  bowlGemPositions.forEach(p => {
    addGem(
      gemColors[p.c],
      Math.cos(p.a) * p.r,
      p.h,
      Math.sin(p.a) * p.r
    );
  });

  // Foot Gems (Scattered)
  const footGemPositions = [
    { a: 0.5, h: 0.04, r: 0.21, c: 2 },
    { a: 2.5, h: 0.04, r: 0.21, c: 3 },
    { a: 4.0, h: 0.04, r: 0.21, c: 0 },
    { a: 5.5, h: 0.04, r: 0.21, c: 1 },
  ];

  footGemPositions.forEach(p => {
    addGem(
      gemColors[p.c],
      Math.cos(p.a) * p.r,
      p.h,
      Math.sin(p.a) * p.r
    );
  });

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