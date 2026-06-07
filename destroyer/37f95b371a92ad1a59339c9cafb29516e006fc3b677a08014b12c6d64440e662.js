export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep Sapphire Blue, High Refraction, Polished
  // Using MeshPhysicalMaterial for transmission/glass effect.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e55b8,          // Deep royal blue
    metalness: 0.0,           // Dielectric (glass/gem)
    roughness: 0.0,           // Perfectly polished
    transmission: 0.98,       // Almost fully transparent
    ior: 2.42,                // Diamond/Sapphire high refraction index
    transparent: true,
    side: THREE.DoubleSide,   // Render both sides of facets
    thickness: 0.8,           // Volume for refraction
    clearcoat: 1.0,           // Extra shine
    clearcoatRoughness: 0.0,
  });

  // --- Geometry Definitions ---

  // 1. Pavilion (Bottom): Inverted 4-sided pyramid
  // ConeGeometry with 4 radial segments creates a square pyramid.
  const pavilionGeom = new THREE.ConeGeometry(0.5, 0.6, 4);
  const pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  pavilion.rotation.x = Math.PI; // Point down
  pavilion.position.y = -0.3;    // Shift down so base is at y=0
  root.add(pavilion);

  // 2. Girdle (Middle): Thin square plate defining the outline
  const girdleGeom = new THREE.BoxGeometry(1.0, 0.05, 1.0);
  const girdle = new THREE.Mesh(girdleGeom, gemMat);
  girdle.position.y = 0;
  root.add(girdle);

  // 3. Crown (Top Main): Tapered square frustum
  // CylinderGeometry with 4 segments.
  // Default orientation has vertices at axes (Diamond shape).
  // We rotate 45 deg (Math.PI/4) so flat faces align with X/Z axes (Square shape).
  const crownGeom = new THREE.CylinderGeometry(0.25, 0.5, 0.25, 4);
  const crown = new THREE.Mesh(crownGeom, gemMat);
  crown.rotation.y = Math.PI / 4;
  crown.position.y = 0.125; // Half height
  root.add(crown);

  // 4. Table (Top Flat): The large flat top facet
  const tableGeom = new THREE.BoxGeometry(0.35, 0.01, 0.35);
  const table = new THREE.Mesh(tableGeom, gemMat);
  table.position.y = 0.255; // On top of crown (0.125 + 0.125 + half table thickness)
  root.add(table);

  // 5. Corner Bezels (Top Corners): 4 Triangular facets filling the corners
  // The crown frustum leaves gaps at the 4 corners of the square girdle.
  // We use Tetrahedrons scaled and positioned to fill these gaps.
  const cornerGeom = new THREE.TetrahedronGeometry(0.15);
  const cornerPositions = [
    { x: 0.5, z: 0.5, rot: 0 },
    { x: -0.5, z: 0.5, rot: Math.PI / 2 },
    { x: -0.5, z: -0.5, rot: Math.PI },
    { x: 0.5, z: -0.5, rot: -Math.PI / 2 },
  ];

  for (const pos of cornerPositions) {
    const corner = new THREE.Mesh(cornerGeom, gemMat);
    corner.position.set(pos.x, 0.15, pos.z);
    corner.rotation.y = pos.rot;
    // Scale to stretch from girdle edge up to table corner
    corner.scale.set(1.2, 1.5, 1.2);
    root.add(corner);
  }

  // --- Final Orientation ---
  // The reference image shows the gem standing on a corner (Diamond orientation).
  // Our model is built axis-aligned (Square orientation).
  // Rotate the entire group 45 degrees around Y to match the pose.
  root.rotation.y = Math.PI / 4;

  // Normalize size to fit unit cube (0.95 scale)
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