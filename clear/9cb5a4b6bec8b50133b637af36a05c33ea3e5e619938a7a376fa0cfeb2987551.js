export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Texture Generation for Felt + Seam ---
  // A tennis ball is defined by its fuzzy orange surface and the white curvy seam.
  // We generate this procedurally to avoid external assets and ensure the pattern
  // wraps correctly on the sphere.
  const texWidth = 512;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);

  // Orange base color (approx #FF6600)
  const baseR = 255;
  const baseG = 130;
  const baseB = 0;

  // Seam color (off-white/light gray)
  const seamR = 230;
  const seamG = 230;
  const seamB = 230;

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;

      // Normalized coordinates
      const u = x / texWidth;
      const v = y / texHeight;

      // --- Procedural Noise for Felt Texture ---
      // Deterministic pseudo-noise using sin/cos to simulate fuzz granularity
      const noiseScale = 40.0;
      const noise =
        (Math.sin(x * noiseScale + y * noiseScale * 0.5) +
          Math.cos(x * noiseScale * 0.7 - y * noiseScale * 0.3)) *
        0.5;

      // --- Seam Calculation ---
      // The seam on a tennis ball approximates a sine wave in equirectangular UV space.
      // It oscillates around the equator (v = 0.5).
      const seamFreq = 2.0; // Two bumps per wrap
      const seamAmp = 0.18; // Amplitude of the wave
      const seamCenter = 0.5 + seamAmp * Math.sin(u * Math.PI * seamFreq);
      const seamWidth = 0.025; // Thickness of the white line

      const distToSeam = Math.abs(v - seamCenter);

      let r = baseR;
      let g = baseG;
      let b = baseB;

      if (distToSeam < seamWidth) {
        // Draw the seam
        // Soften the edges of the seam slightly
        const alpha = 1.0 - Math.min(1.0, distToSeam / seamWidth);
        r = seamR * alpha + baseR * (1 - alpha);
        g = seamG * alpha + baseG * (1 - alpha);
        b = seamB * alpha + baseB * (1 - alpha);
      } else {
        // Apply noise to the orange felt
        // Darken/lighten slightly based on noise
        const noiseFactor = 1.0 + noise * 0.15;
        r = Math.min(255, Math.max(0, baseR * noiseFactor));
        g = Math.min(255, Math.max(0, baseG * noiseFactor));
        b = Math.min(255, Math.max(0, baseB * noiseFactor));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  // --- Material ---
  // Felt is very matte (high roughness) and non-metallic.
  const ballMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff, // White base to let texture colors show through accurately
    metalness: 0.0,
    roughness: 0.95, // Very rough to simulate fuzzy surface
  });

  // --- Geometry ---
  // High segment count for a smooth sphere.
  const ballGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const ball = new THREE.Mesh(ballGeom, ballMat);

  root.add(ball);

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