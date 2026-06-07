export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Deep Emerald Green Glass
  // MeshPhysicalMaterial is required for transmission/refraction effects.
  // Metalness must be 0 for dielectric materials like glass.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x063525,           // Deep green base color
    metalness: 0.0,            // Non-metallic
    roughness: 0.05,           // Highly polished surface
    transmission: 0.95,        // High light transmission (glass-like)
    ior: 1.5,                  // Index of Refraction for glass
    transparent: true,
    thickness: 0.8,            // Volume thickness for absorption calculation
    attenuationColor: 0x063525,// Color absorbed through volume (darker in thick parts)
    attenuationDistance: 0.6,  // Distance over which color absorbs
    side: THREE.DoubleSide     // Render both sides for thin glass walls
  });

  // Profile points for LatheGeometry (radius, height)
  // Defines the silhouette from the center of the base to the tip.
  const points = [];
  
  // --- Base Foot ---
  points.push(new THREE.Vector2(0.00, 0.00)); // Center bottom
  points.push(new THREE.Vector2(0.07, 0.00)); // Outer edge of foot
  points.push(new THREE.Vector2(0.07, 0.02)); // Top of foot flare
  points.push(new THREE.Vector2(0.025, 0.05)); // Taper into stem
  
  // --- Long Slender Stem ---
  // The stem is the dominant vertical feature, very thin.
  points.push(new THREE.Vector2(0.022, 0.30));
  points.push(new THREE.Vector2(0.022, 0.55));
  points.push(new THREE.Vector2(0.025, 0.62)); // Slight flare before bulb
  
  // --- Tulip Bulb (Top) ---
  // Swells out significantly then pinches to a sharp point.
  points.push(new THREE.Vector2(0.05, 0.68));  // Start of bulb swell
  points.push(new THREE.Vector2(0.09, 0.78));  // Mid swell
  points.push(new THREE.Vector2(0.115, 0.86)); // Max width
  points.push(new THREE.Vector2(0.08, 0.93));  // Tapering in
  points.push(new THREE.Vector2(0.03, 0.98));  // Near tip
  points.push(new THREE.Vector2(0.00, 1.00));  // Sharp tip
  
  // Create Geometry
  // 32 radial segments ensures a smooth circular cross-section.
  const vaseGeom = new THREE.LatheGeometry(points, 32);
  
  // Create Mesh
  const vase = new THREE.Mesh(vaseGeom, glassMat);
  
  // The LatheGeometry is created around the local origin based on the points.
  // Our points range from y=0 to y=1. We shift the mesh down so the base 
  // sits near y=0 before the global normalization centers the group.
  vase.position.y = -0.5;
  
  root.add(vase);

  // Normalize the object to fit within the unit cube [-0.5, 0.5]
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