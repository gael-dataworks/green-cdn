export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Speckled Gray Stone ---
  // Generate a procedural noise texture for the stone surface speckles.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Deterministic pseudo-random hash function (integer hash)
  function hash(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Base noise value
      const n = hash(x, y);
      
      // Base color: Light Gray (#a8a8a8)
      let r = 168, g = 168, b = 168;

      // Add speckles based on noise thresholds
      if (n > 0.96) {
        // White speckles (quartz/feldspar)
        r = 240; g = 240; b = 240;
      } else if (n < 0.04) {
        // Dark speckles (biotite/hornblende)
        r = 40; g = 40; b = 40;
      } else if (n > 0.85 && n < 0.88) {
        // Medium dark grains
        r = 100; g = 100; b = 100;
      } else if (n > 0.60 && n < 0.62) {
         // Slight variation
         r = 180; g = 175; b = 170;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const stoneTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.needsUpdate = true;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff, // Multiply with texture, keep white to let texture dominate
    metalness: 0.0,
    roughness: 0.85, // Matte stone surface
  });

  // --- Geometry: Elongated Capsule (River Stone Shape) ---
  // Radius 0.35, Cylinder Length 0.9, 16 cap segments, 32 radial segments
  const stoneGeom = new THREE.CapsuleGeometry(0.35, 0.9, 16, 32);
  const stone = new THREE.Mesh(stoneGeom, stoneMat);

  // Orient the stone to match reference:
  // Lying on its side (rotate X 90deg), angled slightly towards camera (rotate Y ~30deg)
  stone.rotation.x = Math.PI / 2;
  stone.rotation.y = Math.PI / 6;
  
  root.add(stone);

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