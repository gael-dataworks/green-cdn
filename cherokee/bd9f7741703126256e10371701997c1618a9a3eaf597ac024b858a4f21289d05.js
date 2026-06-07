export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Gold band material: Bright, polished metal.
  // Using emissive to ensure brightness in the dim renderer.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xFFD700,
    emissiveIntensity: 0.3
  });

  // Polished gem top/bottom material: Teal, glass-like.
  const gemPolishedMat = new THREE.MeshPhysicalMaterial({
    color: 0x40E0D0,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    opacity: 0.9
  });

  // Rough gem side material: White/Grey crust with teal inclusions.
  // We will generate a procedural texture for this to simulate the drusy/cross-section look.
  const gemSideMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.85
  });

  // --- Procedural Textures ---

  // 1. Side Texture: Simulates the rough white crust with teal veins.
  const sideSize = 256;
  const sideData = new Uint8Array(sideSize * sideSize * 4);
  for (let y = 0; y < sideSize; y++) {
    for (let x = 0; x < sideSize; x++) {
      const i = (y * sideSize + x) * 4;
      // Noise function (deterministic)
      const nx = x / sideSize;
      const ny = y / sideSize;
      const noise = Math.sin(nx * 20) * Math.cos(ny * 20) * 0.5 + 0.5;
      
      // Base crust color (white/grey)
      let r = 220, g = 220, b = 220;
      
      // Add teal veins randomly based on noise
      if (noise > 0.6) {
        r = 100; g = 200; b = 200; // Teal inclusion
      }
      
      // Add some white sparkles (drusy effect)
      if (noise > 0.9) {
        r = 255; g = 255; b = 255;
      }

      sideData[i] = r;
      sideData[i + 1] = g;
      sideData[i + 2] = b;
      sideData[i + 3] = 255;
    }
  }
  const sideTexture = new THREE.DataTexture(sideData, sideSize, sideSize, THREE.RGBAFormat);
  sideTexture.colorSpace = THREE.SRGBColorSpace;
  sideTexture.needsUpdate = true;
  gemSideMat.map = sideTexture;

  // 2. Roughness Map for sides: High roughness generally, lower in teal veins.
  const roughData = new Uint8Array(sideSize * sideSize);
  for (let i = 0; i < sideSize * sideSize; i++) {
    // Invert the logic: white crust is rough (255), teal veins are smoother (100)
    // Re-use the noise logic roughly
    const x = i % sideSize;
    const y = Math.floor(i / sideSize);
    const nx = x / sideSize;
    const ny = y / sideSize;
    const noise = Math.sin(nx * 20) * Math.cos(ny * 20) * 0.5 + 0.5;
    
    roughData[i] = noise > 0.6 ? 100 : 220; 
  }
  const roughTexture = new THREE.DataTexture(roughData, sideSize, sideSize, THREE.RedFormat);
  roughTexture.needsUpdate = true;
  gemSideMat.roughnessMap = roughTexture;

  // --- Geometries & Meshes ---

  // Stone Dimensions
  const stoneW = 0.65;
  const stoneH = 0.18;
  const stoneD = 0.45;

  // Stone Geometry: Box
  // We use an array of materials to differentiate Top/Bottom (Polished) from Sides (Rough)
  // Order: Right, Left, Top, Bottom, Front, Back
  const stoneGeom = new THREE.BoxGeometry(stoneW, stoneH, stoneD);
  const stoneMats = [
    gemSideMat, // Right (x+)
    gemSideMat, // Left (x-)
    gemPolishedMat, // Top (y+)
    gemPolishedMat, // Bottom (y-)
    gemSideMat, // Front (z+)
    gemSideMat  // Back (z-)
  ];
  const stone = new THREE.Mesh(stoneGeom, stoneMats);
  stone.position.y = stoneH / 2 + 0.02; // Sit slightly above band center
  root.add(stone);

  // Band Geometry: Torus
  // Standard ring shape
  const bandRadius = 0.14;
  const bandTube = 0.045;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 32);
  const band = new THREE.Mesh(bandGeom, goldMat);
  // Rotate to lie flat in XZ plane (default Torus is in XY)
  band.rotation.x = Math.PI / 2;
  band.position.y = 0; 
  root.add(band);

  // Add a small connector/setting detail under the stone to hide the intersection
  const settingGeom = new THREE.BoxGeometry(stoneW * 0.6, 0.05, stoneD * 0.6);
  const setting = new THREE.Mesh(settingGeom, goldMat);
  setting.position.y = 0.02;
  root.add(setting);

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