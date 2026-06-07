export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Iridescent Bauble Material
  // Since there is no environment map, we must use a texture to simulate the
  // rainbow reflections. We use high metalness (capped at 0.6) and low roughness
  // for the shiny glass/plastic feel.
  const iridescentMap = createIridescentTexture(THREE);
  const baubleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.1,
    map: iridescentMap,
  });

  // Silver Cap Material
  // Polished silver/chrome look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry & Meshes ---

  // 1. The Bauble Sphere
  const sphereRadius = 0.4;
  const sphereGeom = new THREE.SphereGeometry(sphereRadius, 32, 32);
  const baubleSphere = new THREE.Mesh(sphereGeom, baubleMat);
  root.add(baubleSphere);

  // 2. The Cap
  // The cap consists of a faceted base and a narrower neck.
  const capGroup = new THREE.Group();
  
  // Base of the cap (faceted crown)
  const capBaseRadius = 0.13;
  const capBaseHeight = 0.08;
  const capBaseGeom = new THREE.CylinderGeometry(capBaseRadius, capBaseRadius * 0.9, capBaseHeight, 8);
  const capBase = new THREE.Mesh(capBaseGeom, silverMat);
  capBase.position.y = capBaseHeight / 2;
  capGroup.add(capBase);

  // Neck of the cap
  const capNeckRadius = 0.08;
  const capNeckHeight = 0.05;
  const capNeckGeom = new THREE.CylinderGeometry(capNeckRadius, capNeckRadius, capNeckHeight, 8);
  const capNeck = new THREE.Mesh(capNeckGeom, silverMat);
  capNeck.position.y = capBaseHeight + capNeckHeight / 2;
  capGroup.add(capNeck);

  // Decorative band/join between base and neck (optional detail)
  const bandGeom = new THREE.TorusGeometry(capBaseRadius * 0.95, 0.008, 8, 16);
  const band = new THREE.Mesh(bandGeom, silverMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = capBaseHeight;
  capGroup.add(band);

  // Position the whole cap on top of the sphere
  capGroup.position.y = sphereRadius;
  root.add(capGroup);

  // 3. The Hanging Loop
  // Thin silver wire loop.
  const loopRadius = 0.05;
  const loopTube = 0.006;
  const loopGeom = new THREE.TorusGeometry(loopRadius, loopTube, 8, 24);
  const loopMesh = new THREE.Mesh(loopGeom, silverMat);
  // Orient the torus to stand vertically
  loopMesh.rotation.x = Math.PI / 2;
  // Position on top of the neck
  loopMesh.position.y = capBaseHeight + capNeckHeight + loopRadius;
  capGroup.add(loopMesh);

  // --- Normalization ---
  fitToUnitCube(THREE, root);
  return root;
}

// Helper: Generate a procedural iridescent/rainbow texture
function createIridescentTexture(THREE) {
  const width = 256;
  const height = 256;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Normalize coordinates to -1..1
      const u = (x / width) * 2 - 1;
      const v = (y / height) * 2 - 1;

      // Convert to polar coordinates for radial swirl effect
      const r = Math.sqrt(u * u + v * v);
      const theta = Math.atan2(v, u);

      // Create interference pattern using sine waves
      // Frequency controls the tightness of the bands
      const freq = 15.0;
      const swirl = 2.0;
      
      const val = r * freq + theta * swirl;

      // Generate RGB channels with phase shifts for rainbow effect
      // Using pastel-ish tones by scaling amplitude and adding offset
      const rVal = (Math.sin(val) + 1) * 0.5;
      const gVal = (Math.sin(val + 2.0) + 1) * 0.5;
      const bVal = (Math.sin(val + 4.0) + 1) * 0.5;

      data[i] = Math.floor(rVal * 255);
      data[i + 1] = Math.floor(gVal * 255);
      data[i + 2] = Math.floor(bVal * 255);
      data[i + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  // Wrap the texture so the pattern flows continuously if mapped differently
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
}

// Helper: Scale and center the object to fit within [-0.5, 0.5] cube
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