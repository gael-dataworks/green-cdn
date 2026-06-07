export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue rubber material with pebble texture
  const pebbleMap = createPebbleTexture(THREE);
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x1e90ff,
    metalness: 0.0,
    roughness: 0.7,
    map: pebbleMap,
    bumpMap: pebbleMap,
    bumpScale: 0.002,
  });

  // Black channel material (recessed lines)
  const channelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Geometry Constants ---
  const radius = 0.5;
  const channelRadius = radius + 0.002; // Slightly larger to sit on surface
  const channelTube = 0.018;
  const channelSegments = 64;
  const tubeSegments = 16;

  // --- Main Sphere ---
  const sphereGeom = new THREE.SphereGeometry(radius, 48, 48);
  const ball = new THREE.Mesh(sphereGeom, blueMat);
  root.add(ball);

  // --- Channels (3 perpendicular rings) ---
  // Standard basketball pattern: 1 equator, 2 meridians perpendicular to each other.
  const channelGeom = new THREE.TorusGeometry(channelRadius, channelTube, tubeSegments, channelSegments);

  // Ring 1: Equator (XZ plane) -> Torus is XY by default, rotate X by 90 deg
  const ring1 = new THREE.Mesh(channelGeom, channelMat);
  ring1.rotation.x = Math.PI / 2;
  root.add(ring1);

  // Ring 2: Meridian 1 (XY plane) -> Default Torus orientation
  const ring2 = new THREE.Mesh(channelGeom, channelMat);
  root.add(ring2);

  // Ring 3: Meridian 2 (YZ plane) -> Rotate Y by 90 deg
  const ring3 = new THREE.Mesh(channelGeom, channelMat);
  ring3.rotation.y = Math.PI / 2;
  root.add(ring3);

  fitToUnitCube(THREE, root);
  return root;
}

function createPebbleTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  // Base color components for #1e90ff (DodgerBlue)
  const rBase = 30;
  const gBase = 144;
  const bBase = 255;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Deterministic pseudo-noise using sin/cos
      // Create a grid of "pebbles"
      const frequency = 0.15; 
      const val = Math.sin(x * frequency) * Math.cos(y * frequency) + 
                  Math.sin(x * frequency * 2.3) * Math.cos(y * frequency * 1.7);
      
      // Threshold to create distinct pebble shapes
      const threshold = 0.4;
      const isPebble = val > threshold;
      
      // Vary the brightness slightly for texture
      const noise = (Math.sin(x * 13.0 + y * 7.0) + 1.0) * 0.5; 
      
      let r = rBase;
      let g = gBase;
      let b = bBase;

      if (isPebble) {
        // Pebble highlight
        const highlight = noise * 40;
        r = Math.min(255, r + highlight);
        g = Math.min(255, g + highlight);
        b = Math.min(255, b + highlight);
      } else {
        // Valley shadow
        const shadow = noise * 20;
        r = Math.max(0, r - shadow);
        g = Math.max(0, g - shadow);
        b = Math.max(0, b - shadow);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
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