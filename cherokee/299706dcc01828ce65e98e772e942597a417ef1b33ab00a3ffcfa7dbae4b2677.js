export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal, capped metalness 0.6, with emissive to brighten in dim render
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE8C84A,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xE8C84A,
    emissiveIntensity: 0.25,
  });

  // Gem: Green emerald/tourmaline, physical material for transmission/glass look
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x006400,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.6,
    transparent: true,
    opacity: 1.0,
  });

  // --- Dimensions ---
  const bandRadius = 0.32;
  const bandTube = 0.045;
  const gemHalfWidth = 0.14;   // X axis
  const gemHalfDepth = 0.10;   // Z axis (oval is wider in X)
  const gemHeight = 0.16;
  const bezelThickness = 0.015;

  // --- 1. Band ---
  // TorusGeometry is in XY plane by default. To sit on XZ plane (hole along Y), rotate X by 90 deg.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 48);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0; // Sitting on "floor"
  root.add(band);

  // --- 2. Gemstone ---
  // Create an oval-cut profile for LatheGeometry.
  // Profile points (radius, y) from bottom tip to top table.
  const profilePoints = [
    new THREE.Vector2(0, -gemHeight / 2),          // Culet (bottom tip)
    new THREE.Vector2(gemHalfDepth * 0.6, -gemHeight * 0.15), // Pavilion facet
    new THREE.Vector2(gemHalfDepth, 0),            // Girdle (widest point)
    new THREE.Vector2(gemHalfDepth * 0.85, gemHeight * 0.15), // Crown facet
    new THREE.Vector2(gemHalfDepth * 0.4, gemHeight / 2),     // Table edge
    new THREE.Vector2(0, gemHeight / 2),           // Table center
  ];

  // Use 8 radial segments to create an octagonal/faceted look rather than smooth cylinder
  const gemGeom = new THREE.LatheGeometry(profilePoints, 8);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  
  // Scale X to make it oval (wider than deep). 
  // Lathe creates radial symmetry around Y. Scaling X stretches it.
  gem.scale.set(gemHalfWidth / gemHalfDepth, 1, 1);
  
  // Position gem above the band. 
  // Band center is at 0,0,0. Band top is at bandTube.
  // Gem sits in the setting.
  gem.position.y = bandTube + gemHeight * 0.2; 
  root.add(gem);

  // --- 3. Bezel Setting ---
  // A thin ring wrapping the girdle of the gem.
  // Use TorusGeometry scaled to match the oval gem.
  const bezelRadius = gemHalfDepth + bezelThickness / 2;
  const bezelTube = bezelThickness;
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, bezelTube, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  
  // Orient bezel to lie flat in XZ plane (same as band)
  bezel.rotation.x = Math.PI / 2;
  
  // Scale X to match the oval gem width
  bezel.scale.set(gemHalfWidth / gemHalfDepth, 1, 1);
  
  // Position at the girdle height (where gem is widest)
  bezel.position.y = bandTube + gemHeight * 0.2; 
  root.add(bezel);

  // --- 4. Setting Base / Basket ---
  // A small structural ring under the gem to connect bezel to band, 
  // preventing the gem from looking like it floats magically.
  const basketRadius = gemHalfDepth * 0.6;
  const basketGeom = new THREE.TorusGeometry(basketRadius, 0.01, 16, 32);
  const basket = new THREE.Mesh(basketGeom, goldMat);
  basket.rotation.x = Math.PI / 2;
  basket.scale.set(gemHalfWidth / gemHalfDepth, 1, 1);
  basket.position.y = bandTube + gemHeight * 0.1;
  root.add(basket);

  // Add small prongs/connectors (4 simple boxes) to suggest how gem is held
  const prongGeom = new THREE.BoxGeometry(0.02, 0.04, 0.02);
  const prongPositions = [
    [gemHalfWidth, 0, 0],
    [-gemHalfWidth, 0, 0],
    [0, 0, gemHalfDepth],
    [0, 0, -gemHalfDepth]
  ];
  
  for (const [x, y, z] of prongPositions) {
    const prong = new THREE.Mesh(prongGeom, goldMat);
    // Adjust position to local gem space then add to root (simplified)
    // Actually, let's just place them relative to the bezel center
    prong.position.set(
      x * 0.9, // Slightly inward
      bandTube + gemHeight * 0.2,
      z * 0.9
    );
    // Scale prongs on X axis to match oval stretch if needed, but small boxes are fine
    if (Math.abs(x) > 0.1) prong.scale.x = 1.4; 
    root.add(prong);
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