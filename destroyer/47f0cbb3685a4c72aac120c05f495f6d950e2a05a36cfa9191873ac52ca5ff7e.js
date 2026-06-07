export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const RADIUS = 0.5;
  const LINE_THICKNESS = 0.012;
  const LINE_DEPTH = 0.002; // How much the line sinks or stands out
  const COLOR_BLUE = 0x007bff;
  const COLOR_LINE = 0x0044aa; // Slightly darker blue for the channels

  // --- Materials ---
  // Generate a procedural pebble texture for the bump map
  const pebbleSize = 256;
  const pebbleData = new Uint8Array(pebbleSize * pebbleSize * 4);
  for (let y = 0; y < pebbleSize; y++) {
    for (let x = 0; x < pebbleSize; x++) {
      const i = (y * pebbleSize + x) * 4;
      // Simple deterministic noise for pebbles
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05 + y * 0.05)) * 0.5 + 0.5;
      const val = Math.floor(noise * 255);
      pebbleData[i] = val;
      pebbleData[i + 1] = val;
      pebbleData[i + 2] = val;
      pebbleData[i + 3] = 255;
    }
  }
  const pebbleTexture = new THREE.DataTexture(pebbleData, pebbleSize, pebbleSize, THREE.RGBAFormat);
  pebbleTexture.wrapS = THREE.RepeatWrapping;
  pebbleTexture.wrapT = THREE.RepeatWrapping;
  pebbleTexture.repeat.set(4, 4);
  pebbleTexture.needsUpdate = true;

  const ballMat = new THREE.MeshStandardMaterial({
    color: COLOR_BLUE,
    roughness: 0.6,
    metalness: 0.0,
    bumpMap: pebbleTexture,
    bumpScale: 0.015,
  });

  const lineMat = new THREE.MeshStandardMaterial({
    color: COLOR_LINE,
    roughness: 0.4,
    metalness: 0.0,
  });

  // --- Base Sphere ---
  const sphereGeom = new THREE.SphereGeometry(RADIUS, 64, 64);
  const ball = new THREE.Mesh(sphereGeom, ballMat);
  root.add(ball);

  // --- Channels (Lines) ---
  // We use TubeGeometry with circular paths to create the recessed lines.
  // To make them look "cut in", we can scale them slightly smaller than RADIUS 
  // or just place them at RADIUS. Placing at RADIUS - LINE_DEPTH/2 makes them sit flush.
  
  const lineRadius = RADIUS - LINE_DEPTH; 
  const tubeRadius = LINE_THICKNESS;
  const tubularSegments = 64;
  const radialSegments = 16;

  // Helper to create a circular tube
  function createCircularLine(axis, rotationOffset = 0) {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      let x, y, z;
      
      if (axis === 'z') { // Circle in XY plane
        x = Math.cos(theta) * lineRadius;
        y = Math.sin(theta) * lineRadius;
        z = 0;
      } else if (axis === 'y') { // Circle in XZ plane (Equator)
        x = Math.cos(theta) * lineRadius;
        y = 0;
        z = Math.sin(theta) * lineRadius;
      } else if (axis === 'x') { // Circle in YZ plane
        x = 0;
        y = Math.cos(theta) * lineRadius;
        z = Math.sin(theta) * lineRadius;
      }
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;
    const geom = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, true);
    return new THREE.Mesh(geom, lineMat);
  }

  // 1. Equator Line (Horizontal)
  const equatorLine = createCircularLine('y');
  root.add(equatorLine);

  // 2. Meridian Line 1 (Vertical, Front/Back)
  const meridian1 = createCircularLine('z');
  root.add(meridian1);

  // 3. Meridian Line 2 (Vertical, Side/Side) - Optional depending on strict basketball pattern
  // Standard basketball has 4 lines meeting at poles. 
  // The image shows one horizontal and curved verticals.
  // Let's add the second vertical to complete the symmetry usually seen.
  const meridian2 = createCircularLine('x');
  root.add(meridian2);

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