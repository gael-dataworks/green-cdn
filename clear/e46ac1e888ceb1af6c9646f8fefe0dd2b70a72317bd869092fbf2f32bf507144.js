export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: High metalness (capped at 0.6), low roughness for polish.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Gem material: Glossy, non-metallic, slightly transparent look via opacity/roughness
  const gemMat = new THREE.MeshStandardMaterial({
    metalness: 0.0,
    roughness: 0.15,
  });

  // --- Geometry: Stem and Foot ---
  // Profile from bowl base (y=0) down to floor.
  const stemFootProfile = [
    new THREE.Vector2(0.00, 0.00),  // Center, under bowl
    new THREE.Vector2(0.10, 0.00),  // Base of bowl connection
    new THREE.Vector2(0.06, -0.15), // Narrowing stem
    new THREE.Vector2(0.09, -0.30), // Upper knop/bulb
    new THREE.Vector2(0.05, -0.45), // Narrow waist
    new THREE.Vector2(0.08, -0.55), // Lower knop
    new THREE.Vector2(0.05, -0.65), // Narrow before foot
    new THREE.Vector2(0.15, -0.75), // Foot flare start
    new THREE.Vector2(0.42, -0.90), // Max foot width
    new THREE.Vector2(0.42, -0.95), // Foot thickness
    new THREE.Vector2(0.00, -0.95), // Center bottom
  ];
  const stemFootGeom = new THREE.LatheGeometry(stemFootProfile, 32);
  const stemFoot = new THREE.Mesh(stemFootGeom, silverMat);
  root.add(stemFoot);

  // --- Geometry: Bowl ---
  // Profile from stem top (y=0) up to rim.
  // We model the wall thickness by defining outer and inner points.
  const bowlProfile = [
    // Outer wall
    new THREE.Vector2(0.10, 0.00),  // Base matches stem
    new THREE.Vector2(0.32, 0.40),  // Belly curve out
    new THREE.Vector2(0.30, 0.85),  // Taper in slightly
    new THREE.Vector2(0.33, 0.95),  // Below rim band
    new THREE.Vector2(0.36, 1.00),  // Outer rim edge
    new THREE.Vector2(0.34, 1.05),  // Top lip outer
    // Inner rim/wall
    new THREE.Vector2(0.30, 1.05),  // Top lip inner
    new THREE.Vector2(0.30, 0.95),  // Inner wall top
    new THREE.Vector2(0.28, 0.85),  // Inner wall taper
    new THREE.Vector2(0.22, 0.10),  // Inner wall base
    new THREE.Vector2(0.10, 0.00),  // Close at stem
  ];
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, silverMat);
  root.add(bowl);

  // --- Decorative Band (Geometric Frieze) ---
  // A thin cylinder near the top rim to represent the engraved band
  const bandGeom = new THREE.CylinderGeometry(0.335, 0.335, 0.06, 32);
  const band = new THREE.Mesh(bandGeom, silverMat);
  band.position.y = 0.96;
  root.add(band);

  // --- Gems ---
  // Cabochon shape: flattened sphere
  const gemBaseGeom = new THREE.SphereGeometry(0.025, 16, 16);
  // Scale Z to flatten it into a cabochon
  gemBaseGeom.scale(1, 1, 0.6);

  const gemColors = [0xffc0cb, 0xadd8e6, 0x90ee90, 0xfffdd0, 0xe6e6fa];

  function addGems(radius, y, count, yOffsetVariance = 0) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Slight random variance in Y for organic placement, deterministic based on index
      const yVar = Math.sin(i * 13.5) * 0.005 * yOffsetVariance; 

      const mat = new THREE.MeshStandardMaterial({
        color: gemColors[i % gemColors.length],
        metalness: 0.0,
        roughness: 0.1,
      });

      const gem = new THREE.Mesh(gemBaseGeom, mat);
      gem.position.set(x, y + yVar, z);
      
      // Orient gem to face outward from center
      gem.lookAt(0, y, 0);
      gem.rotateX(Math.PI / 2); // Correct orientation for flattened sphere
      
      root.add(gem);
    }
  }

  // Top rim gems
  addGems(0.345, 1.02, 14, 0);
  
  // Foot rim gems
  addGems(0.38, -0.88, 10, 1);

  // --- Decorative Relief on Foot (Simplified) ---
  // Add some scroll-like bumps on the foot flare using small scaled spheres/ellipsoids
  const scrollGeom = new THREE.SphereGeometry(0.03, 16, 16);
  scrollGeom.scale(1, 0.4, 2.5); // Elongated shape
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 0.35;
    const z = Math.sin(angle) * 0.35;
    
    const scroll = new THREE.Mesh(scrollGeom, silverMat);
    scroll.position.set(x, -0.85, z);
    scroll.lookAt(0, -0.85, 0);
    scroll.rotateX(Math.PI / 2);
    root.add(scroll);
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