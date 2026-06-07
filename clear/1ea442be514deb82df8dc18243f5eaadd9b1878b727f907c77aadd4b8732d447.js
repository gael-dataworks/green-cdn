export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Red glass.
  // Using MeshPhysicalMaterial for transmission (glass effect).
  // Color is deep red. Roughness is low for polish. Metalness is 0.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc40000,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
    thickness: 0.5,
  });

  // Profile for LatheGeometry (radius, y).
  // Defines the silhouette of the glass from bottom center to top center.
  const profile = [
    new THREE.Vector2(0.00, 0.00),  // Center of foot bottom
    new THREE.Vector2(0.38, 0.00),  // Edge of foot
    new THREE.Vector2(0.38, 0.05),  // Top of foot thickness
    new THREE.Vector2(0.12, 0.05),  // Base of stem (flare)
    new THREE.Vector2(0.06, 0.35),  // Narrowest part of stem
    new THREE.Vector2(0.12, 0.55),  // Top of stem (flare into bowl)
    new THREE.Vector2(0.18, 0.55),  // Bottom of bowl curve
    new THREE.Vector2(0.44, 0.90),  // Widest part of bowl
    new THREE.Vector2(0.42, 1.10),  // Rim taper
    new THREE.Vector2(0.44, 1.13),  // Rim lip
    new THREE.Vector2(0.00, 1.13),  // Top center (close the mesh)
  ];

  // Create the glass body using LatheGeometry.
  // 32 segments for smooth rotation.
  const glassGeom = new THREE.LatheGeometry(profile, 32);
  const wineGlass = new THREE.Mesh(glassGeom, glassMat);

  // Center the geometry locally if needed, though Lathe centers on axis.
  // The profile starts at y=0, so the object sits on the ground plane.
  
  root.add(wineGlass);

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