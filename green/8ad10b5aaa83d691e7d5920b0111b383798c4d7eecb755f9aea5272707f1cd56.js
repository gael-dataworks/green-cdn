export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ivory/Bone band: smooth, satin finish, non-metallic.
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xf0ebd9,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Silver setting: polished metal.
  // Using emissive to ensure brightness in this render environment.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3,
  });

  // Violet gemstone: physical material for refraction/glass-like look.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a7cff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // --- Dimensions ---
  const bandRadius = 0.35;
  const bandTube = 0.055;
  const stoneSize = 0.065;
  const stoneDepth = 0.04;

  // --- Band ---
  // TorusGeometry lies in XY plane by default.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 32, 64);
  const band = new THREE.Mesh(bandGeom, bandMat);
  // Rotate to stand upright in YZ plane (like a wheel)
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // --- Stone Setting Group ---
  const settingGroup = new THREE.Group();

  // Position the setting on the outer edge of the band.
  // In the band's local space (before band rotation), +X is the outer rim at 0 degrees.
  // Since we rotated the band 90 deg around X, the local +X of the band is still +X in world space?
  // Wait. Band rotation.x = 90.
  // Original Torus: Circle in XY. Outer edge at +X is (R+r, 0, 0).
  // After Rot X 90: That point moves to (R+r, 0, 0). It stays on X axis.
  // So placing the stone at x = bandRadius + bandTube works perfectly for the "3 o'clock" position.
  settingGroup.position.set(bandRadius + bandTube, 0, 0);

  // --- Gemstone ---
  // Cushion cut approximation: BoxGeometry with slightly rounded look or just a box.
  // Using BoxGeometry for simplicity and robustness.
  const stoneGeom = new THREE.BoxGeometry(stoneSize, stoneSize, stoneDepth);
  const stone = new THREE.Mesh(stoneGeom, gemMat);
  // Orient stone to face outward (along +X)
  // Box default faces +Z. We want it to face +X.
  stone.rotation.y = -Math.PI / 2;
  // Push it slightly forward so it sits on top of the setting, not inside.
  stone.position.z = stoneDepth / 2 + 0.005;
  settingGroup.add(stone);

  // --- Prongs / Bezel ---
  // Four small silver blocks at the corners of the stone.
  const prongSize = 0.012;
  const prongThick = 0.015;
  const prongOffset = stoneSize / 2 - prongSize / 2 + 0.002;

  const prongGeom = new THREE.BoxGeometry(prongSize, prongSize, prongThick);

  const prongPositions = [
    [ prongOffset,  prongOffset, 0],
    [ prongOffset, -prongOffset, 0],
    [-prongOffset,  prongOffset, 0],
    [-prongOffset, -prongOffset, 0],
  ];

  for (const [x, y, z] of prongPositions) {
    const prong = new THREE.Mesh(prongGeom, silverMat);
    prong.position.set(x, y, z);
    // Prongs need to face inward slightly or just sit flat on the face.
    // Let's keep them flat on the face plane (XY for the group, which is YZ in world due to stone rot? No.)
    // The settingGroup is at +X. The stone faces +X.
    // The prongGeom is a box. We place them at the corners.
    // They should face +X to hold the stone.
    // Default Box faces +Z. Rotate Y -90 to face +X.
    prong.rotation.y = -Math.PI / 2;
    // Move them forward to clip the stone edge.
    prong.position.z = stoneDepth / 2 + prongThick / 2 + 0.002;
    settingGroup.add(prong);
  }

  // Add setting group to root (which contains the band)
  root.add(settingGroup);

  // --- Global Orientation ---
  // The image shows the ring tilted slightly towards the camera and rotated.
  // Currently: Band is in YZ plane. Stone is at +X.
  // To match the view (stone on right, ring receding to left):
  // Rotate around Y axis to bring the stone to the right side view?
  // Actually, the current setup (Stone at +X) puts the stone on the right if camera is at +Z looking at origin?
  // No, if camera is at +Z, +X is Right. So Stone is on Right.
  // The ring plane is YZ (vertical, perpendicular to camera). This matches the "profile" view.
  // The image shows the ring angled. The left side is further back.
  // Let's rotate the whole group around Y axis slightly to give perspective.
  root.rotation.y = -Math.PI / 6; // Tilt left side back
  root.rotation.x = Math.PI / 12; // Tilt top back slightly

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