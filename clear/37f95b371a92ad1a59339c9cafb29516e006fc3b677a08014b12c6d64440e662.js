export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material ---
  // Deep blue sapphire-like material. High transmission and IOR for gem look.
  // Metalness 0 because it's a dielectric (crystal/glass).
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x001155,
    metalness: 0.0,
    roughness: 0.0,
    transmission: 0.95,
    ior: 2.2,
    transparent: true,
    side: THREE.DoubleSide,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  });

  // --- Dimensions ---
  // Normalized units before fitToUnitCube.
  const girdleRadius = 0.5;
  const pavilionHeight = 0.6;
  const crownHeight = 0.25;
  const tableSize = 0.35;

  // --- Pavilion (Bottom) ---
  // Square pyramid pointing down. Cylinder with 4 segments, top radius = girdle, bottom = 0.
  const pavilionGeom = new THREE.CylinderGeometry(0, girdleRadius, pavilionHeight, 4);
  const pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  pavilion.position.y = -pavilionHeight / 2;
  // Rotate so flat faces are diagonal to camera for better sparkle, or align with axes.
  // Princess cut usually aligns corners to axes or faces to axes. Let's align faces to axes.
  // CylinderGeometry with 4 segments creates a square prism aligned with axes by default?
  // Actually, 4 segments creates a square where vertices are at 0, 90, 180, 270 degrees.
  // So the flat faces are at 45, 135... Let's rotate 45 deg to make faces align with X/Z axes.
  pavilion.rotation.y = Math.PI / 4;
  root.add(pavilion);

  // --- Crown (Top Sloped Part) ---
  // Truncated square pyramid. Top radius = tableSize/2 (approx), Bottom = girdleRadius.
  // Table is flat top.
  const crownTopRadius = tableSize * 0.7; // Slightly smaller than table box to allow bevel
  const crownGeom = new THREE.CylinderGeometry(crownTopRadius, girdleRadius, crownHeight, 4);
  const crown = new THREE.Mesh(crownGeom, gemMat);
  crown.position.y = crownHeight / 2;
  crown.rotation.y = Math.PI / 4;
  root.add(crown);

  // --- Table (Flat Top) ---
  const tableGeom = new THREE.BoxGeometry(tableSize, 0.02, tableSize);
  const table = new THREE.Mesh(tableGeom, gemMat);
  table.position.y = crownHeight + 0.01;
  root.add(table);

  // --- Internal Facet Detail (The "Star") ---
  // To simulate the internal refraction pattern seen in the reference (the star shape),
  // we add 4 thin inverted pyramids inside the crown, meeting at the center.
  // This breaks up the internal volume and catches light.
  const starHeight = crownHeight * 0.8;
  const starBase = tableSize * 0.4;
  
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const starGeom = new THREE.ConeGeometry(starBase, starHeight, 3); // Triangular pyramid
    const star = new THREE.Mesh(starGeom, gemMat);
    
    // Position at table level, pointing down
    star.position.set(0, crownHeight - starHeight * 0.5, 0);
    
    // Rotate to face outward from center
    star.rotation.y = -angle;
    // Tilt slightly inward to meet at a point below the table
    star.rotation.x = Math.PI; // Point down
    
    // We need to arrange them in a square pattern. 
    // Actually, a simpler way to get the star pattern is 4 long thin boxes meeting at center.
    // Let's use 4 thin boxes radiating from center on the table surface, going down.
    star.rotation.x = 0;
    star.rotation.y = angle + Math.PI / 4;
    star.position.set(0, crownHeight - 0.1, 0);
    
    // Re-thinking internal detail: 
    // Just adding 4 thin pyramids pointing down from the table corners to the center of the stone.
    const internalFacetGeom = new THREE.ConeGeometry(0.15, crownHeight, 3);
    const internalFacet = new THREE.Mesh(internalFacetGeom, gemMat);
    internalFacet.position.set(0, crownHeight - crownHeight/2, 0);
    internalFacet.rotation.y = angle;
    internalFacet.rotation.x = Math.PI; // Point down
    // Scale to make them wedge-shaped
    internalFacet.scale.set(1, 1, 0.5);
    root.add(internalFacet);
  }

  // --- Girdle Highlight (Optional thin ring for definition) ---
  // Sometimes helps define the separation between crown and pavilion
  const girdleGeom = new THREE.TorusGeometry(girdleRadius, 0.01, 8, 4);
  const girdle = new THREE.Mesh(girdleGeom, gemMat);
  girdle.rotation.x = Math.PI / 2;
  girdle.position.y = 0;
  root.add(girdle);

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