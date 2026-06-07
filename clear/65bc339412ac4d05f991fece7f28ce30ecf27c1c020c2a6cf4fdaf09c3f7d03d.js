export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Dark glossy green glass/glaze
  // Using MeshPhysicalMaterial for that deep, wet, reflective look.
  const vaseMat = new THREE.MeshPhysicalMaterial({
    color: 0x052b1f,       // Deep forest green
    metalness: 0.1,        // Slight metallic feel for glaze
    roughness: 0.15,       // Very smooth, glossy surface
    transmission: 0.15,    // Slight translucency to avoid looking like flat plastic
    ior: 1.5,              // Glass-like refraction
    transparent: true,
    clearcoat: 1.0,        // Extra shiny top layer
    clearcoatRoughness: 0.1
  });

  // Profile definition for LatheGeometry
  // We define the right-half silhouette from bottom (y=0) to top.
  // Using a curve for smooth organic transitions.
  const points = [];
  
  // Bottom foot
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.12, 0.02)); // Flare out
  points.push(new THREE.Vector2(0.035, 0.06)); // Narrow to stem
  
  // Long thin stem
  points.push(new THREE.Vector2(0.035, 0.55));
  
  // Transition to bulb (smooth curve out)
  points.push(new THREE.Vector2(0.05, 0.65));
  points.push(new THREE.Vector2(0.15, 0.80));
  
  // Bulb max width
  points.push(new THREE.Vector2(0.24, 0.92));
  
  // Taper to tip
  points.push(new THREE.Vector2(0.18, 1.05));
  points.push(new THREE.Vector2(0.08, 1.18));
  points.push(new THREE.Vector2(0, 1.25)); // Sharp tip

  // Create geometry
  const segments = 64; // High segment count for smooth roundness
  const vaseGeom = new THREE.LatheGeometry(points, segments);

  // Create mesh
  const vase = new THREE.Mesh(vaseGeom, vaseMat);
  
  // Center the geometry vertically roughly so the base sits near y=0 before normalization
  // The profile goes from 0 to 1.25. The lathe centers it.
  // We want the base to be the bottom.
  vase.position.y = -0.625; 

  root.add(vase);

  // Normalize to fit unit cube
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