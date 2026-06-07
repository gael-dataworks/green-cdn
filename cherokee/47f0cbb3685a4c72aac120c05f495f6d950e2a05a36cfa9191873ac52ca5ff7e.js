export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const BALL_RADIUS = 0.5;
  const LINE_RADIUS = 0.485; // Slightly smaller to be recessed
  const LINE_THICKNESS = 0.018;
  const BLUE_COLOR = 0x1E90FF; // Dodger Blue
  const LINE_COLOR = 0x111111; // Near Black

  // --- Materials ---
  // Generate pebble texture for the ball surface
  const pebbleTexture = createPebbleTexture(THREE, BLUE_COLOR);
  
  const ballMat = new THREE.MeshStandardMaterial({
    color: BLUE_COLOR,
    map: pebbleTexture,
    bumpMap: pebbleTexture,
    bumpScale: 0.004,
    roughness: 0.75,
    metalness: 0.0,
  });

  const lineMat = new THREE.MeshStandardMaterial({
    color: LINE_COLOR,
    roughness: 0.6,
    metalness: 0.1,
  });

  // --- Geometry ---
  // Base Sphere
  const ballGeom = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
  const ball = new THREE.Mesh(ballGeom, ballMat);
  root.add(ball);

  // Lines (3 Orthogonal Rings to simulate basketball seams)
  // TorusGeometry is in XY plane by default.
  const lineGeom = new THREE.TorusGeometry(LINE_RADIUS, LINE_THICKNESS, 16, 64);

  // 1. Equator (XZ Plane) -> Rotate X by 90 deg
  const equatorLine = new THREE.Mesh(lineGeom, lineMat);
  equatorLine.rotation.x = Math.PI / 2;
  root.add(equatorLine);

  // 2. Meridian 1 (YZ Plane) -> Rotate Y by 90 deg
  const meridian1 = new THREE.Mesh(lineGeom, lineMat);
  meridian1.rotation.y = Math.PI / 2;
  root.add(meridian1);

  // 3. Meridian 2 (XY Plane) -> Default orientation
  const meridian2 = new THREE.Mesh(lineGeom, lineMat);
  root.add(meridian2);

  fitToUnitCube(THREE, root);
  return root;
}

// --- Helper: Procedural Pebble Texture ---
function createPebbleTexture(THREE, baseColorHex) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  // Parse base color
  const rBase = (baseColorHex >> 16) & 0xff;
  const gBase = (baseColorHex >> 8) & 0xff;
  const bBase = baseColorHex & 0xff;

  // Grid settings for pebbles
  const gridCount = 24; // 24x24 pebbles
  const cellSize = size / gridCount;
  const pebbleRadius = cellSize * 0.35;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Normalize coordinates
      const u = x / size;
      const v = y / size;

      // Determine grid cell
      const gx = Math.floor(u * gridCount);
      const gy = Math.floor(v * gridCount);

      // Deterministic jitter for cell center using sin/cos
      // This avoids Math.random while creating organic variation
      const jitterX = Math.sin(gx * 12.9898 + gy * 78.233) * 0.4 * cellSize;
      const jitterY = Math.cos(gx * 56.123 + gy * 23.456) * 0.4 * cellSize;
      
      const centerX = (gx + 0.5) * cellSize + jitterX;
      const centerY = (gy + 0.5) * cellSize + jitterY;

      // Distance from pixel to pebble center
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = rBase;
      let g = gBase;
      let b = bBase;

      // Create highlight/shadow based on distance to simulate bump
      if (dist < pebbleRadius) {
        // Inside pebble: Lighter center, darker edge
        const t = dist / pebbleRadius; // 0 at center, 1 at edge
        // Simple lighting simulation: light from top-left
        const highlight = Math.max(0, 1 - t * 1.5); 
        const shadow = Math.max(0, t - 0.8) * 5; 
        
        // Apply lighting to base color
        r = Math.min(255, rBase + highlight * 60 - shadow * 40);
        g = Math.min(255, gBase + highlight * 60 - shadow * 40);
        b = Math.min(255, bBase + highlight * 60 - shadow * 40);
      } else {
        // Background (grooves between pebbles): Slightly darker
        r = Math.max(0, rBase - 20);
        g = Math.max(0, gBase - 20);
        b = Math.max(0, bBase - 20);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// --- Helper: Fit to Unit Cube ---
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