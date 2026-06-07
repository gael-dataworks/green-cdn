export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Rough Terracotta with Procedural Texture ---
  // Terracotta base color
  const baseColor = new THREE.Color(0xc16e52);
  
  // Generate a 256x256 DataTexture for surface detail (noise + throwing rings)
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Deterministic pseudo-noise using trig functions
      const nx = x / texSize;
      const ny = y / texSize;
      
      // High frequency noise for grain
      const noise = (Math.sin(nx * 123.4) * Math.cos(ny * 87.2) + Math.sin(nx * 45.6 + ny * 12.3)) * 0.08;
      
      // Horizontal bands for throwing rings (subtle variation in Y)
      const rings = Math.sin(ny * 60.0) * 0.03;
      
      // Combine
      let val = 1.0 + noise + rings;
      
      // Clamp and apply to RGB
      const r = Math.min(255, Math.max(0, Math.floor(baseColor.r * 255 * val)));
      const g = Math.min(255, Math.max(0, Math.floor(baseColor.g * 255 * val)));
      const b = Math.min(255, Math.max(0, Math.floor(baseColor.b * 255 * val)));
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  
  const clayTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  clayTexture.colorSpace = THREE.SRGBColorSpace;
  clayTexture.wrapS = THREE.RepeatWrapping;
  clayTexture.wrapT = THREE.RepeatWrapping;
  clayTexture.needsUpdate = true;

  const clayMat = new THREE.MeshStandardMaterial({
    map: clayTexture,
    color: 0xffffff, // Multiply with texture
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- Body: Lathe Geometry ---
  // Profile points [radius, height] from bottom center up
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.14, 0.00),   // Bottom edge
    new THREE.Vector2(0.15, 0.02),   // Slight base flare
    new THREE.Vector2(0.26, 0.22),   // Widest part (belly)
    new THREE.Vector2(0.24, 0.42),   // Shoulder start
    new THREE.Vector2(0.25, 0.46),   // Neck base
    new THREE.Vector2(0.28, 0.49),   // Rim outer edge
    new THREE.Vector2(0.28, 0.51),   // Rim top outer
    new THREE.Vector2(0.23, 0.51),   // Rim top inner
    new THREE.Vector2(0.23, 0.49),   // Inside rim start
    new THREE.Vector2(0.00, 0.49),   // Top center (close the top)
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, clayMat);
  root.add(body);

  // --- Handles: Tube Geometry ---
  // Define a curve for one handle in local space (relative to attachment points)
  // We will position/rotate the mesh to place it on the pot
  
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.25, 0.48, 0.00), // Top attach (near rim)
    new THREE.Vector3(0.38, 0.45, 0.00), // Arch out
    new THREE.Vector3(0.40, 0.35, 0.00), // Arch mid
    new THREE.Vector3(0.38, 0.25, 0.00), // Arch lower
    new THREE.Vector3(0.26, 0.22, 0.00), // Bottom attach (on shoulder)
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.035, 8, false);
  
  // Left Handle
  const leftHandle = new THREE.Mesh(handleGeom, clayMat);
  leftHandle.rotation.y = Math.PI / 2; // Face X axis
  leftHandle.position.x = -0.0; // Centered, rotation handles placement
  // Actually, the curve is defined in positive X. 
  // To put it on the left (-X), we rotate 180 deg around Y.
  leftHandle.rotation.y = Math.PI / 2 + Math.PI; 
  root.add(leftHandle);

  // Right Handle
  const rightHandle = new THREE.Mesh(handleGeom, clayMat);
  rightHandle.rotation.y = Math.PI / 2; // Face X axis (positive side)
  root.add(rightHandle);

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