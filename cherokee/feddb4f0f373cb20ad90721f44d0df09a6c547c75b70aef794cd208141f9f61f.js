export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper material: metalness capped at 0.6 per safety guidelines.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
  });

  // --- Procedural Engraving Texture ---
  // Simulates the dark etched patterns on the copper surface.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseR = 184, baseG = 115, baseB = 51; // Copper #b87333
  const darkR = 90, darkG = 50, darkB = 30;   // Dark etched color

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const u = x / texSize;
      const v = y / texSize;
      let r = baseR, g = baseG, b = baseB;

      // Helper to darken pixel (blend towards dark color)
      const etch = (intensity) => {
        r = r * (1 - intensity) + darkR * intensity;
        g = g * (1 - intensity) + darkG * intensity;
        b = b * (1 - intensity) + darkB * intensity;
      };

      // Top and Bottom Bands (Scrollwork)
      const bandHeight = 0.12;
      if (v < bandHeight || v > 1.0 - bandHeight) {
        // Local v within the band (0 to 1)
        const localV = v < bandHeight ? v / bandHeight : (v - (1.0 - bandHeight)) / bandHeight;
        // Wavy line pattern
        const wave = Math.sin(u * Math.PI * 12) * 0.3 + 0.5;
        const dist = Math.abs(localV - wave);
        if (dist < 0.08) {
          etch(0.8);
        }
        // Border lines
        if (Math.abs(localV - 0.1) < 0.02 || Math.abs(localV - 0.9) < 0.02) {
          etch(0.9);
        }
      }

      // Middle Section (Floral Motifs)
      if (v >= bandHeight && v <= 1.0 - bandHeight) {
        // Normalize v for middle section
        const midV = (v - bandHeight) / (1.0 - 2 * bandHeight);
        
        // 4 motifs around the mug
        const motifWidth = 0.25;
        const motifIndex = Math.floor(u / motifWidth);
        const localU = (u % motifWidth) / motifWidth; // 0..1 within motif

        // Center of motif
        const cx = 0.5;
        const cy = 0.5;
        
        // Distance to center stem
        const distX = Math.abs(localU - cx);
        
        // Stem
        if (distX < 0.03) {
          etch(0.9);
        }

        // Leaves/Petals (Stylized)
        // Upper leaf
        const ly1 = 0.35;
        const leafWidth1 = 0.15 * (1.0 - Math.abs(midV - ly1) * 3);
        if (midV > 0.2 && midV < 0.5 && distX < leafWidth1 && distX > 0.03) {
           etch(0.8);
        }
        // Lower leaf
        const ly2 = 0.65;
        const leafWidth2 = 0.15 * (1.0 - Math.abs(midV - ly2) * 3);
        if (midV > 0.5 && midV < 0.8 && distX < leafWidth2 && distX > 0.03) {
           etch(0.8);
        }
        
        // Top flourish
        if (midV < 0.2 && distX < 0.08) {
             etch(0.7);
        }
        // Bottom flourish
        if (midV > 0.8 && distX < 0.08) {
             etch(0.7);
        }
      }

      const idx = (y * texSize + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const engravingMap = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  engravingMap.colorSpace = THREE.SRGBColorSpace;
  engravingMap.wrapS = THREE.RepeatWrapping;
  engravingMap.wrapT = THREE.ClampToEdgeWrapping;
  engravingMap.needsUpdate = true;

  copperMat.map = engravingMap;

  // --- Body (Lathe) ---
  // Profile points (radius, y)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.33, 0.00), // Bottom edge
    new THREE.Vector2(0.33, 0.46), // Top of main body
    new THREE.Vector2(0.36, 0.49), // Rim flare
    new THREE.Vector2(0.36, 0.50), // Top edge
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, copperMat);
  root.add(body);

  // --- Handle (Tube) ---
  // D-shaped curve attached to the side (+X)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.33, 0.15, 0.0), // Bottom attach
    new THREE.Vector3(0.58, 0.15, 0.0), // Bottom out
    new THREE.Vector3(0.58, 0.40, 0.0), // Top out
    new THREE.Vector3(0.33, 0.40, 0.0), // Top attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.025, 12, false);
  const handle = new THREE.Mesh(handleGeom, copperMat);
  root.add(handle);

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