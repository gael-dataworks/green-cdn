export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Configuration ---
  const radius = 0.5;
  const widthSegments = 64;
  const heightSegments = 64;
  const ballColor = new THREE.Color(0x2b7fff); // Bright blue
  const seamColor = new THREE.Color(0x050515); // Very dark blue/black
  const pebbleIntensity = 0.15;

  // --- Procedural Texture Generation ---
  // We generate a 512x256 equirectangular texture for the sphere.
  const texWidth = 512;
  const texHeight = 256;
  const size = texWidth * texHeight;
  const data = new Uint8Array(size * 4); // RGBA
  const bumpData = new Uint8Array(size * 4); // RGBA (using R for height)

  const seamWidthUV = 0.025; // Thickness of the lines in UV space
  const curveAmplitude = 0.22; // How much the curved lines bow out

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const u = x / texWidth;
      const v = y / texHeight;

      // --- Determine if pixel is on a seam ---
      let onSeam = false;

      // 1. Equator line (Horizontal)
      if (Math.abs(v - 0.5) < seamWidthUV) {
        onSeam = true;
      }

      // 2. Curved Line 1 (Sine wave)
      const v1 = 0.5 + curveAmplitude * Math.sin(u * Math.PI * 2);
      if (Math.abs(v - v1) < seamWidthUV) {
        onSeam = true;
      }

      // 3. Curved Line 2 (Inverse Sine wave)
      const v2 = 0.5 + curveAmplitude * Math.sin(u * Math.PI * 2 + Math.PI);
      if (Math.abs(v - v2) < seamWidthUV) {
        onSeam = true;
      }

      // --- Determine Pebble Noise (Deterministic) ---
      // Use trigonometric functions to create a pseudo-random stipple pattern
      const noiseFreq = 0.15;
      const noiseVal = Math.sin(x * noiseFreq) * Math.cos(y * noiseFreq);
      // Normalize noise to 0..1 range roughly, then threshold for dots
      const isPebble = noiseVal > 0.6; 
      const pebbleHeight = isPebble ? 40 : -10; // Bump up or down

      const idx = (y * texWidth + x) * 4;

      if (onSeam) {
        // Seam color
        data[idx] = seamColor.r * 255;
        data[idx + 1] = seamColor.g * 255;
        data[idx + 2] = seamColor.b * 255;
        data[idx + 3] = 255;

        // Seam bump (recessed)
        bumpData[idx] = 80; 
        bumpData[idx + 1] = 80;
        bumpData[idx + 2] = 80;
        bumpData[idx + 3] = 255;
      } else {
        // Base ball color with pebble variation
        const variation = isPebble ? 20 : -10;
        const r = Math.min(255, Math.max(0, ballColor.r * 255 + variation));
        const g = Math.min(255, Math.max(0, ballColor.g * 255 + variation));
        const b = Math.min(255, Math.max(0, ballColor.b * 255 + variation));

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;

        // Pebble bump (raised)
        const bumpVal = 128 + pebbleHeight;
        bumpData[idx] = bumpVal;
        bumpData[idx + 1] = bumpVal;
        bumpData[idx + 2] = bumpVal;
        bumpData[idx + 3] = 255;
      }
    }
  }

  const texture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  // Wrap around the sphere seamlessly
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const bumpTexture = new THREE.DataTexture(bumpData, texWidth, texHeight, THREE.RGBAFormat);
  bumpTexture.needsUpdate = true;
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

  // --- Material ---
  // Rubber/Matte plastic feel. High roughness, no metalness.
  const ballMat = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: bumpTexture,
    bumpScale: 0.015,
    color: 0xffffff, // White to let the texture drive the color
    roughness: 0.85,
    metalness: 0.0,
  });

  // --- Geometry ---
  const ballGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const ball = new THREE.Mesh(ballGeom, ballMat);
  
  // --- Hierarchy ---
  root.add(ball);

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