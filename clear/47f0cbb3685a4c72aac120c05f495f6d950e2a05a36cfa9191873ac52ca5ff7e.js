export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Configuration ---
  const radius = 0.5;
  const segments = 64;
  const baseColor = new THREE.Color(0x0066ff); // Vibrant Blue
  const lineColor = new THREE.Color(0x003388); // Darker Blue for grooves
  const pebbleSize = 0.02; // Frequency of noise
  const lineWidth = 0.015; // Thickness of lines in UV space

  // --- Procedural Texture Generation ---
  // We generate both a color map (with pebbles and lines) and a bump map
  // to give the surface tactile detail without external assets.
  const texSize = 512;
  const colorData = new Uint8Array(texSize * texSize * 4);
  const bumpData = new Uint8Array(texSize * texSize);

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const u = x / texSize;
      const v = y / texSize;

      // --- 1. Calculate Line Mask (Basketball Pattern) ---
      // We use spherical mapping logic to draw lines that wrap correctly.
      // Convert UV to Spherical Coords
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      
      // Cartesian coordinates on unit sphere for geometric line checks
      const sx = Math.sin(phi) * Math.cos(theta);
      const sy = Math.cos(phi);
      const sz = Math.sin(phi) * Math.sin(theta);

      let lineDist = 1.0;

      // Equator Line (Horizontal)
      // Distance from Y=0 plane
      const distEquator = Math.abs(sy);
      lineDist = Math.min(lineDist, distEquator);

      // Curved Meridian Lines
      // Approximated by sine waves in UV space for the classic basketball look
      // Line 1
      const wave1 = 0.5 + 0.25 * Math.sin(theta * 2);
      const dist1 = Math.abs(v - wave1);
      lineDist = Math.min(lineDist, dist1);

      // Line 2 (Perpendicular phase)
      const wave2 = 0.5 + 0.25 * Math.cos(theta * 2);
      const dist2 = Math.abs(v - wave2);
      lineDist = Math.min(lineDist, dist2);

      const isLine = lineDist < lineWidth;

      // --- 2. Generate Pebble Noise ---
      // Deterministic noise using sin/cos products
      const noiseFreq = 40.0;
      const n1 = Math.sin(x * noiseFreq) * Math.cos(y * noiseFreq);
      const n2 = Math.cos((x + 50) * noiseFreq * 0.8) * Math.sin((y + 50) * noiseFreq * 0.8);
      const pebble = (n1 + n2) * 0.5; // Range -1 to 1

      // --- 3. Write Pixels ---
      const idx = (y * texSize + x);
      const idx4 = idx * 4;

      if (isLine) {
        // Draw Groove
        // Color: Darker line color
        colorData[idx4] = Math.floor(lineColor.r * 255);
        colorData[idx4 + 1] = Math.floor(lineColor.g * 255);
        colorData[idx4 + 2] = Math.floor(lineColor.b * 255);
        colorData[idx4 + 3] = 255;

        // Bump: Recessed (darker in height map)
        bumpData[idx] = 40; 
      } else {
        // Draw Pebbled Surface
        // Color: Base blue modulated slightly by pebble noise for variation
        const shade = 0.95 + pebble * 0.05;
        colorData[idx4] = Math.floor(baseColor.r * 255 * shade);
        colorData[idx4 + 1] = Math.floor(baseColor.g * 255 * shade);
        colorData[idx4 + 2] = Math.floor(baseColor.b * 255 * shade);
        colorData[idx4 + 3] = 255;

        // Bump: Raised pebbles (lighter in height map)
        // Map pebble (-1..1) to (100..200)
        bumpData[idx] = 150 + Math.floor(pebble * 50);
      }
    }
  }

  const colorTexture = new THREE.DataTexture(colorData, texSize, texSize, THREE.RGBAFormat);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.needsUpdate = true;

  const bumpTexture = new THREE.DataTexture(bumpData, texSize, texSize, THREE.LuminanceFormat);
  bumpTexture.needsUpdate = true;

  // --- Material ---
  // Rubber/Plastic sports ball material
  const ballMat = new THREE.MeshStandardMaterial({
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.015,
    color: 0xffffff, // White multiplier to let texture drive color
    metalness: 0.0,
    roughness: 0.6, // Matte rubber feel
  });

  // --- Geometry & Mesh ---
  const ballGeom = new THREE.SphereGeometry(radius, segments, segments);
  const ball = new THREE.Mesh(ballGeom, ballMat);
  
  // Rotate slightly so the texture pattern sits nicely relative to camera
  ball.rotation.y = Math.PI / 4;
  ball.rotation.z = Math.PI / 8;

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