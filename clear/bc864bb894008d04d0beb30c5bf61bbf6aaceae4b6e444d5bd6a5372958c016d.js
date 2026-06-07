export default function generate(THREE) {
  const root = new THREE.Group();

  // --- 1. Procedural Clay Texture ---
  // Terracotta is rarely a flat color; it has speckles and mineral variations.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 192, g: 96, b: 64 }; // Terracotta base
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (x + y * texSize) * 4;
      
      // Deterministic pseudo-noise using sine waves
      const nx = x / texSize;
      const ny = y / texSize;
      const noise = (Math.sin(nx * 123.4) + Math.cos(ny * 567.8)) * 0.5 
                  + (Math.sin(nx * 45.6 + ny * 78.9) * 0.25);
      
      // Vary brightness slightly for texture
      const variation = 20 + noise * 30; 
      
      data[i] = Math.min(255, Math.max(0, baseColor.r + variation));
      data[i + 1] = Math.min(255, Math.max(0, baseColor.g + variation));
      data[i + 2] = Math.min(255, Math.max(0, baseColor.b + variation));
      data[i + 3] = 255; // Alpha
    }
  }
  
  const clayTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  clayTexture.colorSpace = THREE.SRGBColorSpace;
  clayTexture.wrapS = THREE.RepeatWrapping;
  clayTexture.wrapT = THREE.RepeatWrapping;
  clayTexture.needsUpdate = true;

  // --- 2. Material ---
  // Unglazed clay: high roughness, no metalness.
  const clayMat = new THREE.MeshStandardMaterial({
    map: clayTexture,
    color: 0xffffff, // Tint handled by texture mostly, keep white to preserve texture colors
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- 3. Pot Body (Lathe) ---
  // Profile defines the silhouette from bottom center up to top rim.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.28, 0.00), // Bottom edge
    new THREE.Vector2(0.38, 0.35), // Widest part (belly)
    new THREE.Vector2(0.34, 0.55), // Shoulder taper
    new THREE.Vector2(0.36, 0.60), // Rim outer edge
    new THREE.Vector2(0.33, 0.60), // Rim top inner edge (shows thickness)
    new THREE.Vector2(0.33, 0.56), // Inside neck
    new THREE.Vector2(0.30, 0.35), // Inside belly
    new THREE.Vector2(0.25, 0.05), // Inside bottom curve
    new THREE.Vector2(0.00, 0.05)  // Close inside bottom
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Smooth shading helps the roundness
  bodyGeom.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeom, clayMat);
  root.add(body);

  // --- 4. Handles ---
  // Two handles on opposite sides. Using TubeGeometry for organic curve.
  const handleRadius = 0.045;
  const tubeSegments = 16;
  const radialSegments = 12;

  function createHandle(side) {
    const dir = side === 'left' ? -1 : 1;
    
    // Curve points defining the handle arc
    // Start at rim, curve out, end at shoulder
    const points = [
      new THREE.Vector3(dir * 0.36, 0.58, 0.00), // Top attach (rim)
      new THREE.Vector3(dir * 0.52, 0.48, 0.00), // Outer arc
      new THREE.Vector3(dir * 0.48, 0.38, 0.00), // Mid arc
      new THREE.Vector3(dir * 0.40, 0.32, 0.00)  // Bottom attach (shoulder)
    ];
    
    const curve = new THREE.CatmullRomCurve3(points);
    const handleGeom = new THREE.TubeGeometry(curve, 20, handleRadius, radialSegments, false);
    const handle = new THREE.Mesh(handleGeom, clayMat);
    
    // Slight rotation to match the pot's curvature if needed, 
    // but since points are in X-Y plane and pot is Y-up, it aligns well.
    // We might need to rotate slightly around Z to hug the pot better if it was 3D,
    // but for side handles on a round pot, X-Y plane is correct.
    
    root.add(handle);
  }

  createHandle('left');
  createHandle('right');

  // --- 5. Normalization ---
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