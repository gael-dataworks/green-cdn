export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear Glass for the outer sphere
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.98,
    ior: 1.5,
    transparent: true,
    thickness: 1.0,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
  });

  // Rainbow texture for the inner swirl
  // TubeGeometry maps V along the length. We need a vertical gradient.
  function createRainbowTexture() {
    const width = 4;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      const t = y / height; // 0 to 1 along the length
      let r, g, b;

      // Approximate the color sequence in the image:
      // Dark Blue -> Cyan -> Pink/Magenta -> Yellow -> White/Light
      if (t < 0.2) { // Dark Blue to Cyan
        r = 0; g = Math.floor(100 + 155 * (t / 0.2)); b = 200;
      } else if (t < 0.4) { // Cyan to Pink
        const u = (t - 0.2) / 0.2;
        r = Math.floor(200 * u);
        g = Math.floor(255 - 155 * u);
        b = Math.floor(200 - 100 * u);
      } else if (t < 0.6) { // Pink to Yellow
        const u = (t - 0.4) / 0.2;
        r = 255;
        g = Math.floor(100 + 155 * u);
        b = Math.floor(100 - 100 * u);
      } else if (t < 0.8) { // Yellow to White/Light Blue
        const u = (t - 0.6) / 0.2;
        r = 255;
        g = 255;
        b = Math.floor(100 + 155 * u);
      } else { // Light Blue to Dark Blue (tail)
        const u = (t - 0.8) / 0.2;
        r = Math.floor(255 - 255 * u);
        g = Math.floor(255 - 255 * u);
        b = 255;
      }

      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping; // Allow repeating if tube is long
    return texture;
  }

  const swirlMat = new THREE.MeshStandardMaterial({
    map: createRainbowTexture(),
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
    emissive: 0x444444,
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Outer Sphere ---
  const sphereGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const glassSphere = new THREE.Mesh(sphereGeom, glassMat);
  root.add(glassSphere);

  // --- Inner Swirl ---
  // Generate a spiral curve points
  const points = [];
  const turns = 2.5;
  const segments = 200;
  const startRadius = 0.35;
  const endRadius = 0.02;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    // Ease the radius so it tightens slowly then fast
    const radius = startRadius * (1 - t) + endRadius * t;
    
    // Add some vertical variation to make it 3D, not flat
    // The swirl in the image is tilted.
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(angle * 0.5) * radius * 0.4; 

    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  // We make it thin and will scale it to look like a ribbon
  const swirlGeom = new THREE.TubeGeometry(curve, 200, 0.025, 8, false);
  const swirl = new THREE.Mesh(swirlGeom, swirlMat);

  // Flatten the tube to make it a ribbon
  swirl.scale.set(1, 0.15, 1);
  
  // Rotate to match the image orientation (tilted)
  swirl.rotation.x = Math.PI / 6;
  swirl.rotation.z = -Math.PI / 8;

  root.add(swirl);

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