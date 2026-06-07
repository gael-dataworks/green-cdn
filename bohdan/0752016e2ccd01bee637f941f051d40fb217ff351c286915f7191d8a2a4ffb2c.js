export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass for the outer sphere
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Material for the internal swirl ribbon
  // We will apply a procedural texture to simulate the multi-colored glass strands
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // --- Procedural Texture for Swirl ---
  // Create a gradient texture that varies along the length of the tube (U coordinate)
  // to simulate the rainbow candy swirl effect.
  const texWidth = 512;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Define a color palette for the swirl (approximate from reference)
  // Deep Blue, Cyan, Pink, Yellow, White
  const colors = [
    new THREE.Color(0x001133), // Dark Blue
    new THREE.Color(0x0066ff), // Bright Blue
    new THREE.Color(0xff0066), // Pink/Red
    new THREE.Color(0xffaa00), // Orange/Yellow
    new THREE.Color(0xffffff), // White highlight
  ];

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const u = x / texWidth;
      
      // Create a smooth gradient that cycles through the palette
      // We use sine waves to blend between colors for a fluid look
      let r = 0, g = 0, b = 0;
      
      // Simple gradient logic: map u to a color index
      // To make it look like strands, we can add some high-frequency noise or bands
      // But a smooth gradient along the spiral path is the primary feature.
      
      const t = u * colors.length;
      const index = Math.floor(t) % colors.length;
      const nextIndex = (index + 1) % colors.length;
      const mix = t - Math.floor(t);
      
      const c1 = colors[index];
      const c2 = colors[nextIndex];
      
      r = c1.r + (c2.r - c1.r) * mix;
      g = c1.g + (c2.g - c1.g) * mix;
      b = c1.b + (c2.b - c1.b) * mix;
      
      // Add some variation across the width (v) to simulate strands
      const v = y / texHeight;
      const strandNoise = Math.sin(v * Math.PI * 4) * 0.1;
      r = Math.max(0, Math.min(1, r + strandNoise));
      g = Math.max(0, Math.min(1, g + strandNoise));
      b = Math.max(0, Math.min(1, b + strandNoise));

      const i = (y * texWidth + x) * 4;
      data[i] = Math.floor(r * 255);
      data[i + 1] = Math.floor(g * 255);
      data[i + 2] = Math.floor(b * 255);
      data[i + 3] = 255; // Alpha
    }
  }

  const swirlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  swirlTexture.colorSpace = THREE.SRGBColorSpace;
  swirlTexture.needsUpdate = true;
  // Map the texture along the length of the tube (repeat if necessary, but clamp is better for gradient)
  swirlTexture.wrapS = THREE.ClampToEdgeWrapping;
  swirlTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  swirlMat.map = swirlTexture;

  // --- Geometry ---

  // 1. Outer Glass Sphere
  const sphereGeom = new THREE.SphereGeometry(0.5, 48, 48);
  const glassSphere = new THREE.Mesh(sphereGeom, glassMat);
  root.add(glassSphere);

  // 2. Internal Swirl Ribbon
  // Create a spiral path that starts wide and goes inward
  const points = [];
  const turns = 2.5;
  const segments = 128;
  const maxRadius = 0.42;
  const minRadius = 0.02;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1
    const angle = t * Math.PI * 2 * turns;
    // Linear interpolation for radius, but maybe exponential looks more natural for spirals
    // Let's try linear first: r = max - (max - min) * t
    const radius = maxRadius - (maxRadius - minRadius) * t;
    
    // Spiral in XZ plane
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Add slight Y variation to give it 3D volume, not perfectly flat
    const y = Math.sin(angle * 2) * 0.03 * (1 - t); 
    
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.035, 8, false);
  
  const swirlMesh = new THREE.Mesh(tubeGeom, swirlMat);
  
  // Flatten the tube to make it look like a ribbon
  // Scale Y to 0.3 makes it a flat strip
  swirlMesh.scale.set(1, 0.4, 1);
  
  root.add(swirlMesh);

  // --- Orientation ---
  // The reference shows the sphere sitting on a surface, with the swirl tilted.
  // We rotate the group slightly to match the perspective.
  root.rotation.x = 0.2;
  root.rotation.y = -0.3;

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