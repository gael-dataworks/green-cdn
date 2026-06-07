export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Creamy ivory band (ceramic/resin/bone look)
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xfdfbd7,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Silver setting (metal)
  const settingMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Purple gem (tanzanite/sapphire)
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a5acd,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Dimensions ---
  const ringRadius = 0.35;
  const ringTube = 0.085;
  const gemSize = 0.055;

  // --- Band ---
  // TorusGeometry lies in XY plane by default.
  const bandGeom = new THREE.TorusGeometry(ringRadius, ringTube, 32, 64);
  const band = new THREE.Mesh(bandGeom, bandMat);
  root.add(band);

  // --- Setting & Gem Assembly ---
  const settingGroup = new THREE.Group();

  // Setting base (small box/bezel)
  const settingGeom = new THREE.BoxGeometry(gemSize * 1.2, gemSize * 0.6, gemSize * 0.6);
  const setting = new THREE.Mesh(settingGeom, settingMat);
  settingGroup.add(setting);

  // Gem (Octahedron stretched to look like a cushion/square cut)
  // Octahedron detail 0 gives 8 faces. We scale it to be squarish.
  const gemGeom = new THREE.OctahedronGeometry(gemSize * 0.6, 0);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  // Rotate gem so a flat face points outward if possible, or just let facets catch light
  gem.rotation.y = Math.PI / 4;
  gem.scale.set(1.2, 1.0, 1.2); // Make it squarish
  settingGroup.add(gem);

  // Position the setting on the band.
  // In default Torus (XY plane), the outer edge is at +X (angle 0).
  // We place the setting group at (radius + tube/2, 0, 0).
  settingGroup.position.set(ringRadius + ringTube * 0.5, 0, 0);
  
  // The setting needs to face outward (along +X). 
  // By default, the box faces +Z. We rotate it -90 deg around Y to face +X.
  settingGroup.rotation.y = -Math.PI / 2;

  root.add(settingGroup);

  // --- Orientation ---
  // The image shows the ring standing on its edge (like a wheel), 
  // angled slightly towards the camera.
  // 1. Rotate 90 deg around X to stand it up (now in YZ plane).
  // 2. Rotate slightly around Y to angle it.
  root.rotation.x = Math.PI / 2;
  root.rotation.y = Math.PI / 6; // 30 degrees

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