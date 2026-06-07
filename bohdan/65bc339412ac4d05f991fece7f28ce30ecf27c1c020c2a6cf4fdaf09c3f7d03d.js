export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Dark glossy green ceramic/glaze.
  // High gloss (low roughness), very low metalness (it's ceramic/glass-like, not metal).
  // Using a deep forest green color.
  const glazeMat = new THREE.MeshStandardMaterial({
    color: 0x0b3d2e,
    metalness: 0.1,
    roughness: 0.15,
  });

  // Profile for the LatheGeometry.
  // Coordinates are [radius, height].
  // We construct a silhouette that goes from a flared base, up a thin stem,
  // into a bulbous, pointed bud.
  const points = [];
  
  // Base
  points.push(new THREE.Vector2(0, 0));        // Center bottom
  points.push(new THREE.Vector2(0.11, 0));     // Outer base edge
  points.push(new THREE.Vector2(0.11, 0.04));  // Top of base flare
  
  // Stem (tapers slightly then goes up)
  points.push(new THREE.Vector2(0.035, 0.25)); // Bottom of stem
  points.push(new THREE.Vector2(0.035, 1.15)); // Top of stem / start of bud
  
  // Bud (bulbous middle, sharp tip)
  points.push(new THREE.Vector2(0.24, 1.45));  // Widest part of bud
  points.push(new THREE.Vector2(0.12, 1.75));  // Tapering to tip
  points.push(new THREE.Vector2(0, 1.90));     // Sharp tip

  // Create the geometry.
  // Using 6 radial segments creates a faceted, fluted look that mimics
  // the folded petals of a closed bud, matching the reference's vertical ridges.
  const vaseGeom = new THREE.LatheGeometry(points, 6);
  
  const vase = new THREE.Mesh(vaseGeom, glazeMat);
  
  // Center the geometry vertically so the base sits on Y=0 roughly before normalization
  // LatheGeometry centers based on the points provided. Our points start at 0, so it sits on ground.
  root.add(vase);

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