export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
  });

  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x008f4c,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.7,
    ior: 1.6,
    transparent: true,
  });

  // 1. Band
  // Lying in XZ plane (rotation.x = PI/2). Center at origin.
  const bandGeom = new THREE.TorusGeometry(0.30, 0.04, 16, 48);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // 2. Bezel (Oval Rim)
  // Sits on the front of the band (Z = bandRadius).
  // Default Torus is in XY plane (facing Z), which is what we want for the stone face.
  const bezelGeom = new THREE.TorusGeometry(0.14, 0.025, 16, 48);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.scale.set(1.4, 1.2, 1); // Make oval
  bezel.position.set(0, 0.04, 0.30); // On top of band, at front
  root.add(bezel);

  // 3. Gemstone
  // Faceted oval inside the bezel.
  // Icosahedron detail 0 gives 20 triangular faces (good for low-poly facets).
  const gemGeom = new THREE.IcosahedronGeometry(0.12, 0);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  gem.scale.set(1.3, 1.6, 0.6); // Flatten and stretch to oval cut
  gem.position.set(0, 0.04, 0.30); // Same as bezel
  root.add(gem);

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