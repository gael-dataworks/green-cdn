export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material & Texture ---
  // Procedural speckled stone texture
  const width = 256;
  const height = 256;
  const data = new Uint8Array(width * height * 4);
  
  // Base grey color
  const baseR = 160;
  const baseG = 160;
  const baseB = 160;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * 4;
      
      // Deterministic pseudo-random noise based on coordinates
      // Using a simple hash-like function to avoid Math.random
      const n = Math.sin(x * 12.9898 + y * 78.233 + x * y * 0.05) * 43758.5453;
      const noise = n - Math.floor(n);

      let r = baseR;
      let g = baseG;
      let b = baseB;

      // Add dark speckles (approx 5% chance)
      if (noise > 0.95) {
        const shade = 50 + Math.floor(noise * 50);
        r = shade; g = shade; b = shade;
      } 
      // Add light speckles (approx 3% chance)
      else if (noise < 0.03) {
        const shade = 220 + Math.floor(noise * 35);
        r = shade; g = shade; b = shade;
      }
      // Subtle variation in base
      else {
        const variation = (noise - 0.5) * 20;
        r += variation; g += variation; b += variation;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const stoneTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.needsUpdate = true;
  // Wrap to avoid seams if we rotate, though sphere mapping usually handles it
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff, // Multiply with texture
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- Geometry ---
  // Use a high-segment sphere and scale it to resemble a river stone
  // The image shows an elongated, slightly flattened oval shape
  const stoneGeom = new THREE.SphereGeometry(1, 64, 64);
  const stone = new THREE.Mesh(stoneGeom, stoneMat);
  
  // Scale to match the pill/pebble shape
  // X: Width (widest), Y: Height (flattest), Z: Depth (medium)
  stone.scale.set(1.6, 0.85, 1.1);
  
  // Rotate slightly to match the resting pose in the image
  // It's tilted slightly towards the camera and to the right
  stone.rotation.x = 0.2;
  stone.rotation.z = -0.1;
  stone.rotation.y = 0.3;

  root.add(stone);

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