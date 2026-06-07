export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Cap metalness at 0.6 to avoid black reflection in no-env.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Emerald: Green gemstone. High transmission, low roughness, dielectric.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x006644,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.57,
    thickness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // --- Dimensions ---
  // Base units before normalization
  const bandRadius = 0.28;
  const bandTube = 0.045;
  const bezelRadius = 0.21;
  const bezelTube = 0.028;
  const stoneScaleX = 0.75;
  const stoneScaleY = 0.9;
  const stoneScaleZ = 0.45;

  // --- Band ---
  // TorusGeometry(radius, tube, radialSegments, tubularSegments)
  // Default orientation is in XY plane. We want it in XZ plane (flat on ground).
  // So we rotate X by 90 deg (Math.PI/2).
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 64);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // --- Bezel Setting ---
  // An oval ring sitting on top of the band.
  // We use a Torus and scale it on X to make it oval.
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, bezelTube, 16, 64);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.x = Math.PI / 2;
  // Scale X to make it an oval (matching stone aspect ratio)
  bezel.scale.set(stoneScaleX, 1, 1);
  // Position on top of the band
  // Band top is at bandTube. Bezel center should be slightly above that.
  bezel.position.y = bandTube + bezelTube * 0.5;
  root.add(bezel);

  // --- Gemstone ---
  // Faceted oval stone. Icosahedron with detail=1 gives 20 faces, good for faceted look.
  // Scale it to fit the oval bezel.
  const stoneGeom = new THREE.IcosahedronGeometry(bezelRadius * 0.9, 1);
  const stone = new THREE.Mesh(stoneGeom, emeraldMat);
  // Scale to oval shape: narrower in X, flatter in Z (thickness), tall in Y (depth)
  // Note: Icosahedron is roughly spherical.
  // We want it to sit inside the bezel.
  stone.scale.set(stoneScaleX, 1.0, stoneScaleZ);
  // Position matches bezel
  stone.position.y = bezel.position.y;
  // Slight rotation to catch light differently on facets
  stone.rotation.y = Math.PI / 6;
  stone.rotation.z = Math.PI / 12;
  root.add(stone);

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