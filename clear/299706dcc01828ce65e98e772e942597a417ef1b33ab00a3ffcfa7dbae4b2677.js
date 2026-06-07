export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.3,
  });

  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x008040,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.6,
    transparent: true,
  });

  // --- Band ---
  // Standard ring band, torus shape lying in XZ plane
  const bandRadius = 0.22;
  const bandTube = 0.04;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 48);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.0;
  root.add(band);

  // --- Stone Geometry ---
  // Constructed from two tapered cylinders to simulate an oval cut (crown + pavilion)
  const stoneWidthScale = 1.35; // Makes the circular cylinder into an oval
  const girdleRadius = 0.16;
  const tableRadius = 0.11;
  const crownHeight = 0.09;
  const pavilionHeight = 0.24;

  // Pavilion (bottom pointed part)
  const pavilionGeom = new THREE.CylinderGeometry(girdleRadius, 0.01, pavilionHeight, 16);
  pavilionGeom.scale(stoneWidthScale, 1, 1);
  const stone_pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  // Position so the wide top of the pavilion meets the bezel
  stone_pavilion.position.y = pavilionHeight / 2 + 0.02; 
  root.add(stone_pavilion);

  // Crown (top flat part)
  const crownGeom = new THREE.CylinderGeometry(tableRadius, girdleRadius, crownHeight, 16);
  crownGeom.scale(stoneWidthScale, 1, 1);
  const stone_crown = new THREE.Mesh(crownGeom, gemMat);
  // Stack on top of pavilion
  stone_crown.position.y = pavilionHeight + crownHeight / 2 + 0.02;
  root.add(stone_crown);

  // --- Bezel Setting ---
  // A thin gold rim holding the stone. Scaled torus to match oval shape.
  const bezelRadius = girdleRadius + 0.015; // Slightly larger than girdle to wrap over
  const bezelTube = 0.018;
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, bezelTube, 16, 32);
  bezelGeom.scale(stoneWidthScale, 1, 1);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.x = Math.PI / 2;
  // Position at the girdle (junction of crown and pavilion)
  bezel.position.y = pavilionHeight + 0.02;
  root.add(bezel);

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