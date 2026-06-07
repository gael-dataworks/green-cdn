export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Sapphire/Blue Gem material.
  // Using MeshPhysicalMaterial for transmission (glass-like behavior).
  // Metalness is 0 because gemstones are dielectrics (non-metals).
  // High IOR (1.8) simulates sapphire/corundum refraction.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a4dbf,          // Deep sapphire blue
    metalness: 0.0,           // Dielectric
    roughness: 0.0,           // Perfectly polished
    transmission: 0.95,       // Highly transparent
    ior: 1.8,                 // Index of Refraction for gemstone
    transparent: true,
    flatShading: true,        // Crucial for faceted look
    thickness: 2.0,           // Volume thickness for refraction
    side: THREE.DoubleSide
  });

  // --- Geometry Construction ---
  // Start with an Octahedron (square bipyramid) which is the base topology 
  // for many square gem cuts (Princess, Radiant).
  // Detail=2 provides enough vertices for faceting without being too heavy.
  const baseGeom = new THREE.OctahedronGeometry(1, 2);
  const positions = baseGeom.attributes.position;
  const count = positions.count;

  // Procedurally modify vertices to create a "Cut Gem" profile:
  // 1. Flatten the top to create the "Table" facet.
  // 2. Elongate the bottom to create a deeper "Pavilion".
  // 3. Ensure the girdle (widest part) remains sharp.
  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // 1. Create Table: Flatten vertices near the top pole.
    // Original top is y=1.0. First subdivision ring is around y=0.66.
    // We flatten anything above 0.6 to create a flat square table.
    if (y > 0.6) {
      positions.setY(i, 0.6);
    }

    // 2. Deepen Pavilion: Stretch the bottom half.
    // This makes the gem look voluminous rather than like a flat diamond.
    if (y < 0) {
      positions.setY(i, y * 1.4);
    }
    
    // 3. Sharpen Girdle: Slightly pinch the middle to emphasize the waist.
    // Vertices near y=0 are the girdle.
    if (Math.abs(y) < 0.2) {
      // Slight bulge at girdle for realism
      const scale = 1.05;
      positions.setX(i, x * scale);
      positions.setZ(i, z * scale);
    }
  }

  baseGeom.computeVertexNormals();

  // --- Mesh ---
  const gem = new THREE.Mesh(baseGeom, gemMat);
  
  // Orientation:
  // The image shows the gem resting on a corner/point, tilted slightly.
  // Octahedron default has a point at +Y. We want it to look dynamic.
  gem.rotation.x = -0.3;  // Tilt forward
  gem.rotation.y = Math.PI / 4; // Rotate 45deg so a corner faces front (Diamond orientation)
  gem.rotation.z = 0.1;   // Slight roll

  root.add(gem);

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