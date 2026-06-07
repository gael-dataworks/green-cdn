export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Deep Blue Sapphire/Tanzanite ---
  // Using MeshPhysicalMaterial for transmission/refraction.
  // Metalness capped at 0.0 (dielectric). Roughness 0.0 for polish.
  const gemMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0d3b99,           // Deep royal blue base
    metalness: 0.0,
    roughness: 0.0,
    transmission: 0.95,        // Highly transparent
    ior: 1.77,                 // Sapphire/Tanzanite IOR
    transparent: true,
    thickness: 1.5,            // Volume thickness for absorption
    attenuationColor: 0x001144,// Dark blue absorption
    attenuationDistance: 0.4,  // Distance over which color absorbs
    side: THREE.DoubleSide,
    reflectivity: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  });

  // --- Geometry: Procedural Princess/Cushion Cut ---
  // Constructed manually to ensure sharp facets and correct topology for light refraction.
  const gemGeometry = createPrincessCutGem(THREE);

  const gem = new THREE.Mesh(gemGeometry, gemMaterial);
  
  // --- Orientation ---
  // Resting on a girdle corner, tilted to show the table and pavilion facets.
  gem.rotation.x = Math.PI / 3.5;
  gem.rotation.z = Math.PI / 4.0;
  gem.rotation.y = Math.PI / 8.0;

  root.add(gem);

  fitToUnitCube(THREE, root);
  return root;
}

function createPrincessCutGem(THREE) {
  const positions = [];
  const indices = [];

  // Dimensions (local units, will be normalized later)
  const girdleSize = 0.5;
  const pavilionDepth = 0.6;
  const crownHeight = 0.35;
  const tableSize = 0.22;
  const starPointHeight = 0.15; // Height of the star facets on the crown

  // --- Vertices ---
  
  // 0: Culet (Bottom Point)
  positions.push(0, -pavilionDepth, 0);

  // 1-4: Girdle Corners (Square)
  // Order: Front-Right, Front-Left, Back-Left, Back-Right (CCW looking from top)
  const girdleY = 0;
  positions.push( girdleSize, girdleY,  girdleSize); // 1
  positions.push(-girdleSize, girdleY,  girdleSize); // 2
  positions.push(-girdleSize, girdleY, -girdleSize); // 3
  positions.push( girdleSize, girdleY, -girdleSize); // 4

  // 5-8: Star Points (Mid-Crown, on axes)
  // These create the triangular star facets
  positions.push( 0, starPointHeight,  girdleSize); // 5 (Front)
  positions.push(-girdleSize, starPointHeight,  0); // 6 (Left)
  positions.push( 0, starPointHeight, -girdleSize); // 7 (Back)
  positions.push( girdleSize, starPointHeight,  0); // 8 (Right)

  // 9-12: Table Corners
  const tableY = crownHeight;
  positions.push( tableSize, tableY,  tableSize); // 9
  positions.push(-tableSize, tableY,  tableSize); // 10
  positions.push(-tableSize, tableY, -tableSize); // 11
  positions.push( tableSize, tableY, -tableSize); // 12

  // 13: Table Center
  positions.push(0, tableY, 0); // 13

  // --- Indices (Triangles) ---

  // Pavilion (Bottom Pyramid) - 4 triangles meeting at Culet (0)
  // Connect Culet to adjacent Girdle corners
  indices.push(0, 1, 2);
  indices.push(0, 2, 3);
  indices.push(0, 3, 4);
  indices.push(0, 4, 1);

  // Crown Lower Bezels (Girdle to Star Points) - 8 triangles
  // Each girdle edge connects to the nearest star point
  // Front-Right quadrant: Girdle(1) -> Star(5) -> Star(8)
  indices.push(1, 5, 8); 
  // But we need to connect to the girdle corners properly.
  // Let's form triangles between Girdle Corners and Star Points.
  // Triangle: GirdleCorner -> StarPoint -> NextGirdleCorner? No.
  // Standard Princess Cut: Girdle Corner connects to two Star Points and Table Corner.
  
  // Lower Crown Facets (Girdle to Star Points)
  // Front Face: Girdle(1) & Girdle(2) connect to Star(5)
  indices.push(1, 2, 5); 
  // Left Face: Girdle(2) & Girdle(3) connect to Star(6)
  indices.push(2, 3, 6);
  // Back Face: Girdle(3) & Girdle(4) connect to Star(7)
  indices.push(3, 4, 7);
  // Right Face: Girdle(4) & Girdle(1) connect to Star(8)
  indices.push(4, 1, 8);

  // Crown Upper Bezels / Star Facets (Star Points to Table Corners)
  // This creates the "kite" or "star" pattern radiating from the table.
  // Front-Right: Star(5), Star(8), Table(9)
  indices.push(5, 8, 9);
  // Front-Left: Star(5), Table(10), Star(6) -> Wait, order matters for normals.
  // Let's do Star -> TableCorner -> Star
  indices.push(5, 9, 8); // Front-Right kite (split into 2 tris usually, but 1 tri here for low poly)
  // Actually, to make it flat, we need to split the quads.
  // Quad: Star(5), Table(9), Star(8), Girdle(1). 
  // Split: (5, 9, 1) and (1, 9, 8).
  
  // Refined Crown Topology for flat facets:
  // Each "Bezel" is a quad: GirdleCorner -> StarPoint -> TableCorner -> NextStarPoint
  // We split each quad into 2 triangles.
  
  // Front-Right Sector (Girdle 1)
  indices.push(1, 5, 9); // Triangle 1
  indices.push(1, 9, 8); // Triangle 2

  // Front-Left Sector (Girdle 2)
  indices.push(2, 6, 10);
  indices.push(2, 10, 5);

  // Back-Left Sector (Girdle 3)
  indices.push(3, 7, 11);
  indices.push(3, 11, 6);

  // Back-Right Sector (Girdle 4)
  indices.push(4, 8, 12);
  indices.push(4, 12, 7);

  // Table (Top Flat Surface) - 4 triangles meeting at Center (13)
  indices.push(13, 9, 10);
  indices.push(13, 10, 11);
  indices.push(13, 11, 12);
  indices.push(13, 12, 9);

  // Build Geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
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