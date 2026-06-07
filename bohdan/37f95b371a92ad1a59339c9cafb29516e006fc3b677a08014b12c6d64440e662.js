export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep blue sapphire-like physical material.
  // High transmission for glass/gem look, low roughness for polish.
  // IOR 1.77 approximates Sapphire/Tanzanite.
  // Emissive added slightly to ensure visibility and internal glow without an env map.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x0044ff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.77,
    transparent: true,
    side: THREE.DoubleSide,
    thickness: 0.8,
    emissive: 0x001144,
    emissiveIntensity: 0.3
  });

  // Dimensions for a Princess/Square Cut gem
  const girdleRadius = 0.5;
  const tableRadius = 0.22;
  const crownHeight = 0.35;
  const pavilionHeight = 0.65;

  // Crown: Top part (Frustum)
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  // 4 segments creates the square profile.
  const crownGeom = new THREE.CylinderGeometry(tableRadius, girdleRadius, crownHeight, 4);
  const crown = new THREE.Mesh(crownGeom, gemMat);
  crown.name = "crown";
  // Position crown so its bottom sits on top of the pavilion
  crown.position.y = pavilionHeight + crownHeight / 2;
  root.add(crown);

  // Pavilion: Bottom part (Inverted Pyramid)
  // CylinderGeometry(0, radius, height, 4) creates a pyramid with a square base.
  const pavilionGeom = new THREE.CylinderGeometry(0, girdleRadius, pavilionHeight, 4);
  const pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  pavilion.name = "pavilion";
  // Position pavilion so its top base meets the crown's bottom base at y = pavilionHeight
  pavilion.position.y = pavilionHeight / 2;
  root.add(pavilion);

  // Pose: The reference shows the gem balancing dynamically on a corner.
  // Rotate the group to achieve this isometric-like "floating" stance.
  root.rotation.x = 0.6;
  root.rotation.y = 0.8;
  root.rotation.z = 0.6;

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