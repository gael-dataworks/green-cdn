export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Terracotta: matte, rough, reddish-brown.
  // We will apply a procedural speckle texture to break up the flat color.
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xc06040,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Generate a deterministic speckle texture for the clay surface
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseR = 192, baseG = 96, baseB = 64; // #c06040

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Deterministic pseudo-noise using sin/cos
      const n = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.03 + y * 0.05);
      const noiseVal = (n + 1) * 0.5; // 0..1
      
      // Add speckles (dark spots)
      const isSpeckle = (Math.sin(x * 13.0) * Math.cos(y * 17.0) > 0.85) ? 1 : 0;
      
      let r = baseR;
      let g = baseG;
      let b = baseB;

      // Variation
      const variation = noiseVal * 20;
      r += variation - 10;
      g += variation - 10;
      b += variation - 10;

      // Speckles (darker)
      if (isSpeckle) {
        r *= 0.6;
        g *= 0.6;
        b *= 0.6;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  terracottaMat.map = texture;

  // --- Geometry: Body (Lathe) ---
  // Profile defines the cross-section of the pot (outer and inner walls)
  // Coordinates: (radius, height)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.24, 0.00),   // Bottom outer edge
    new THREE.Vector2(0.44, 0.35),   // Belly max width
    new THREE.Vector2(0.38, 0.70),   // Neck start
    new THREE.Vector2(0.47, 0.82),   // Rim top outer
    new THREE.Vector2(0.39, 0.82),   // Rim top inner
    new THREE.Vector2(0.39, 0.74),   // Rim bottom inner (thickness)
    new THREE.Vector2(0.35, 0.70),   // Neck inner
    new THREE.Vector2(0.39, 0.35),   // Belly inner
    new THREE.Vector2(0.21, 0.04),   // Bottom inner
    new THREE.Vector2(0.00, 0.04),   // Bottom center (close volume)
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Smooth normals for the lathe
  bodyGeom.computeVertexNormals();
  
  const body = new THREE.Mesh(bodyGeom, terracottaMat);
  root.add(body);

  // --- Geometry: Handles (Tube) ---
  // We create a curve for the handle shape and sweep a tube along it.
  // Right Handle
  const rightHandlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.38, 0.72, 0.00), // Top attach (neck)
    new THREE.Vector3(0.52, 0.60, 0.12), // Arch out
    new THREE.Vector3(0.54, 0.45, 0.14), // Max arch
    new THREE.Vector3(0.52, 0.30, 0.12), // Arch in
    new THREE.Vector3(0.44, 0.25, 0.00), // Bottom attach (belly)
  ]);

  const handleGeom = new THREE.TubeGeometry(rightHandlePath, 20, 0.035, 12, false);
  
  const handleRight = new THREE.Mesh(handleGeom, terracottaMat);
  root.add(handleRight);

  // Left Handle (Mirrored)
  // We can reuse geometry by scaling X by -1, but TubeGeometry is not symmetric in UVs necessarily.
  // Easier to just create a new mesh with scaled transform.
  const handleLeft = new THREE.Mesh(handleGeom, terracottaMat);
  handleLeft.scale.set(-1, 1, 1); // Mirror across YZ plane
  root.add(handleLeft);

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