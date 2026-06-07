export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue rubber/leather material with procedural pebble bump map
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0x1E90FF,
    metalness: 0.0,
    roughness: 0.65,
    bumpMap: createPebbleTexture(THREE),
    bumpScale: 0.002,
  });

  // Dark channel material for the lines
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x050510,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Geometry ---
  const radius = 0.4;
  const sphereGeom = new THREE.SphereGeometry(radius, 64, 64);
  
  // Line geometry: Torus with radius matching sphere, small tube thickness
  // Torus radius = sphere radius - (tubeRadius / 2) to center the tube on the surface
  const lineThickness = 0.012;
  const lineGeom = new THREE.TorusGeometry(radius - lineThickness / 2, lineThickness / 2, 16, 64);

  // --- Meshes ---
  
  // Main Ball Body
  const ball_body = new THREE.Mesh(sphereGeom, ballMat);
  root.add(ball_body);

  // Lines (Channels)
  // Standard basketball pattern: 1 Equator, 1 Meridian, 2 Curved Meridians
  
  // 1. Equator (Horizontal)
  const line_equator = new THREE.Mesh(lineGeom, lineMat);
  line_equator.rotation.x = Math.PI / 2;
  root.add(line_equator);

  // 2. Meridian (Vertical, Front-Back)
  const line_meridian = new THREE.Mesh(lineGeom, lineMat);
  line_meridian.rotation.z = Math.PI / 2; // Make vertical (YZ plane)
  root.add(line_meridian);

  // 3. Curved Line 1 (Tilted Vertical)
  const line_curve_1 = new THREE.Mesh(lineGeom, lineMat);
  line_curve_1.rotation.z = Math.PI / 2; // Make vertical
  line_curve_1.rotation.y = Math.PI / 4; // Tilt 45 degrees
  root.add(line_curve_1);

  // 4. Curved Line 2 (Tilted Vertical, Opposite)
  const line_curve_2 = new THREE.Mesh(lineGeom, lineMat);
  line_curve_2.rotation.z = Math.PI / 2; // Make vertical
  line_curve_2.rotation.y = -Math.PI / 4; // Tilt -45 degrees
  root.add(line_curve_2);

  fitToUnitCube(THREE, root);
  return root;
}

// Helper: Deterministic procedural pebble texture for bump map
function createPebbleTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Deterministic pseudo-noise using sin/cos
      // Create a grid of "pebbles"
      const nx = x / size;
      const ny = y / size;
      
      // Base noise
      let noise = Math.sin(nx * 40) * Math.sin(ny * 40);
      noise += Math.sin(nx * 80 + 1.5) * Math.sin(ny * 80 + 1.5) * 0.5;
      
      // Normalize to 0-255 range roughly
      const val = Math.floor((noise + 1.5) * 60); 
      
      // Clamp
      const clamped = Math.max(0, Math.min(255, val));
      
      data[i] = clamped;     // R
      data[i + 1] = clamped; // G
      data[i + 2] = clamped; // B
      data[i + 3] = 255;     // A
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
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