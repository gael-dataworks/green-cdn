export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished copper: high metalness (capped), low roughness, slight emissive for brightness.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xb87333,
    emissiveIntensity: 0.35,
  });

  // Darker copper for the interior/engraved look if needed, but we'll use texture for engraving.
  // We will use the same copperMat for the body and handle to maintain material consistency.

  // --- Procedural Texture for Engraving ---
  // Simulates the etched floral and scroll patterns on the copper surface.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 184, g: 115, b: 51 }; // #b87333
  const engraveColor = { r: 60, g: 30, b: 20 }; // Dark brown/black for etched lines

  for (let y = 0; y < texSize; y++) {
    const v = y / texSize; // 0 to 1, bottom to top
    for (let x = 0; x < texSize; x++) {
      const u = x / texSize; // 0 to 1, around circumference
      const idx = (y * texSize + x) * 4;

      // Start with base copper
      let r = baseColor.r;
      let g = baseColor.g;
      let b = baseColor.b;

      // Helper to darken pixel (simulate engraving)
      const engrave = (strength) => {
        r = r * (1 - strength) + engraveColor.r * strength;
        g = g * (1 - strength) + engraveColor.g * strength;
        b = b * (1 - strength) + engraveColor.b * strength;
      };

      // --- Top Band (Scrolls) ---
      if (v > 0.82 && v < 0.95) {
        const bandV = (v - 0.82) / 0.13; // 0 to 1 within band
        // Wavy lines
        const wave = Math.sin(u * Math.PI * 12 + bandV * 10);
        if (Math.abs(wave) > 0.6) engrave(0.8);
        // Dots
        if (Math.sin(u * Math.PI * 24) > 0.9 && Math.cos(v * Math.PI * 10) > 0.8) engrave(0.9);
      }

      // --- Bottom Band (Scrolls) ---
      if (v > 0.05 && v < 0.18) {
        const bandV = (v - 0.05) / 0.13;
        const wave = Math.sin(u * Math.PI * 12 + bandV * 10);
        if (Math.abs(wave) > 0.6) engrave(0.8);
      }

      // --- Vertical Floral Motifs ---
      // Place 3 motifs around the cup
      const motifs = [0.15, 0.5, 0.85];
      for (const mu of motifs) {
        const du = Math.abs(u - mu);
        // Wrap around edge check
        const wrappedDu = Math.min(du, 1 - du);
        
        if (wrappedDu < 0.12 && v > 0.2 && v < 0.8) {
          // Central stem
          if (wrappedDu < 0.02) {
            engrave(0.9);
          } else {
            // Petals/Leaves logic
            const relV = v - 0.5; // -0.3 to 0.3
            // Leaf shape width varies with height
            const leafWidth = 0.08 * Math.cos(relV * 5); 
            if (wrappedDu < leafWidth + 0.02 && wrappedDu > leafWidth - 0.02) {
               engrave(0.7);
            }
            // Flower head at top of motif
            if (v > 0.65 && v < 0.75) {
               const flowerDist = Math.sqrt((wrappedDu * 10) ** 2 + ((v - 0.7) * 10) ** 2);
               if (flowerDist > 0.3 && flowerDist < 0.5) engrave(0.8);
            }
          }
        }
      }

      data[idx] = Math.floor(r);
      data[idx + 1] = Math.floor(g);
      data[idx + 2] = Math.floor(b);
      data[idx + 3] = 255;
    }
  }

  const decorationTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  decorationTexture.colorSpace = THREE.SRGBColorSpace;
  decorationTexture.wrapS = THREE.RepeatWrapping;
  decorationTexture.wrapT = THREE.ClampToEdgeWrapping;
  decorationTexture.needsUpdate = true;
  
  // Apply texture to a copy of the material for the body
  const bodyMat = copperMat.clone();
  bodyMat.map = decorationTexture;
  // Adjust roughness slightly for the textured area to catch light differently
  bodyMat.roughness = 0.3; 

  // --- Geometry: Body (Lathe) ---
  // Profile from bottom center, out to edge, up the side, in to rim, to top center.
  const profilePoints = [
    new THREE.Vector2(0, 0),          // Bottom center
    new THREE.Vector2(0.32, 0),       // Bottom edge
    new THREE.Vector2(0.32, 0.04),    // Bottom curve start
    new THREE.Vector2(0.34, 0.90),    // Top side (slight taper out)
    new THREE.Vector2(0.36, 0.94),    // Rim flare
    new THREE.Vector2(0.32, 0.96),    // Rim top inner
    new THREE.Vector2(0, 0.96)        // Top center
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  // Center the geometry vertically roughly
  body.position.y = -0.48; 
  root.add(body);

  // --- Geometry: Handle (Tube) ---
  // Handle attaches to the side. 
  // Path: Start at side, curve out and up, end at side higher up.
  const handleRadius = 0.35; // Distance from center
  const handleHeightStart = 0.25;
  const handleHeightEnd = 0.75;
  const handleDepth = 0.15; // How far it sticks out

  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(handleRadius, handleHeightStart, 0),
    new THREE.Vector3(handleRadius + handleDepth, handleHeightStart, 0),
    new THREE.Vector3(handleRadius + handleDepth + 0.05, (handleHeightStart + handleHeightEnd) / 2, 0),
    new THREE.Vector3(handleRadius + handleDepth, handleHeightEnd, 0),
    new THREE.Vector3(handleRadius, handleHeightEnd, 0),
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.025, 12, false);
  const handle = new THREE.Mesh(handleGeom, copperMat);
  // Shift handle to align with body center
  handle.position.y = -0.48;
  root.add(handle);

  // --- Interior (Optional but good for realism) ---
  // A slightly smaller cylinder inside to ensure the inside looks copper and not hollow black
  // Actually, LatheGeometry with closed profile handles this, but let's ensure the rim looks thick.
  // The profile already defines the thickness at the rim.

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