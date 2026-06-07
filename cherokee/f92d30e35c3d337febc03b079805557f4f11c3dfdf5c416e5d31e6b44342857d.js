export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Dark Bronze/Wood for frame, base, and lid
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.4,
    roughness: 0.6,
  });

  // Frosted Glass with internal glow
  // We use MeshPhysicalMaterial for transmission (glass effect)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4, // Frosted look
    transmission: 0.6, // Translucent
    thickness: 0.5,
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
    emissive: 0xffaa55, // Warm internal light
    emissiveIntensity: 0.8,
  });

  // --- Procedural Texture for the Glass Illustration ---
  // Generating a colorful, painterly texture to represent the animal scene
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (x + y * texSize) * 4;
      
      // Base gradient (Sky to Grass)
      const t = y / texSize;
      let r = 100, g = 150, b = 200; // Default sky blue
      
      if (t < 0.3) { // Top sky
        r = 150 + Math.sin(x * 0.1) * 20;
        g = 200 + Math.cos(y * 0.1) * 20;
        b = 255;
      } else if (t < 0.7) { // Middle light/glow
        const glow = Math.exp(-Math.pow((x - texSize/2) / 60, 2) - Math.pow((y - texSize/2) / 60, 2));
        r = 255 * glow + 200 * (1-glow);
        g = 200 * glow + 220 * (1-glow);
        b = 150 * glow + 200 * (1-glow);
      } else { // Bottom grass
        r = 100 + Math.sin(x * 0.2) * 30;
        g = 180 + Math.cos(x * 0.1) * 30;
        b = 100;
      }

      // Add "painterly" noise for texture detail
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 20;
      r += noise; g += noise; b += noise;

      // Abstract shapes to suggest animals (blobs of color)
      // Center jumping figure
      const cx = texSize/2, cy = texSize/2;
      const distCenter = Math.sqrt((x-cx)**2 + (y-cy)**2);
      if (distCenter < 40) { r = 200; g = 150; b = 100; } // Brownish body

      // Bottom left figure
      const blx = texSize * 0.3, bly = texSize * 0.8;
      const distBL = Math.sqrt((x-blx)**2 + (y-bly)**2);
      if (distBL < 35) { r = 220; g = 100; b = 50; } // Orange fox

      // Bottom right figure
      const brx = texSize * 0.7, bry = texSize * 0.8;
      const distBR = Math.sqrt((x-brx)**2 + (y-bry)**2);
      if (distBR < 35) { r = 180; g = 120; b = 80; } // Brown animal

      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
      data[i+3] = 255;
    }
  }

  const illustrationTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  illustrationTex.colorSpace = THREE.SRGBColorSpace;
  illustrationTex.needsUpdate = true;
  illustrationTex.wrapS = THREE.RepeatWrapping;
  illustrationTex.wrapT = THREE.ClampToEdgeWrapping;
  
  glassMat.map = illustrationTex;
  // Blend the texture with the emissive glow
  glassMat.emissiveMap = illustrationTex;
  glassMat.emissiveIntensity = 1.5;


  // --- Geometry Construction ---

  const bodyRadius = 0.22;
  const bodyHeight = 0.55;

  // 1. Base (Tiered cylinders)
  const baseGroup = new THREE.Group();
  
  const baseBottomGeom = new THREE.CylinderGeometry(0.26, 0.28, 0.06, 32);
  const baseBottom = new THREE.Mesh(baseBottomGeom, frameMat);
  baseBottom.position.y = 0.03;
  baseGroup.add(baseBottom);

  const baseMidGeom = new THREE.CylinderGeometry(0.24, 0.26, 0.05, 32);
  const baseMid = new THREE.Mesh(baseMidGeom, frameMat);
  baseMid.position.y = 0.085;
  baseGroup.add(baseMid);

  const baseTopGeom = new THREE.CylinderGeometry(0.225, 0.24, 0.04, 32);
  const baseTop = new THREE.Mesh(baseTopGeom, frameMat);
  baseTop.position.y = 0.13;
  baseGroup.add(baseTop);

  root.add(baseGroup);

  // 2. Glass Body
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, glassMat);
  body.position.y = 0.13 + bodyHeight / 2;
  root.add(body);

  // 3. Top Lid (Lathe profile for curved shape)
  const lidProfile = [
    new THREE.Vector2(0.225, 0.0),
    new THREE.Vector2(0.24, 0.02),
    new THREE.Vector2(0.26, 0.05),
    new THREE.Vector2(0.28, 0.08),
    new THREE.Vector2(0.26, 0.12),
    new THREE.Vector2(0.22, 0.14),
    new THREE.Vector2(0.18, 0.16),
    new THREE.Vector2(0.12, 0.18),
    new THREE.Vector2(0.0, 0.19),
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, frameMat);
  lid.position.y = 0.13 + bodyHeight + 0.02; // Sit on top of glass
  root.add(lid);

  // 4. Knob on top
  const knobStemGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16);
  const knobStem = new THREE.Mesh(knobStemGeom, frameMat);
  knobStem.position.y = lid.position.y + 0.19 + 0.02;
  root.add(knobStem);

  const knobHeadGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const knobHead = new THREE.Mesh(knobHeadGeom, frameMat);
  knobHead.position.y = knobStem.position.y + 0.04;
  root.add(knobHead);

  // 5. Handle (Torus segment)
  // Create a torus, rotate it, and position it to arch over the top
  const handleRadius = 0.35;
  const handleTube = 0.025;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32, Math.PI);
  const handle = new THREE.Mesh(handleGeom, frameMat);
  // Torus is in XY plane by default. We want it in YZ plane arching over Z.
  handle.rotation.x = Math.PI / 2; 
  handle.rotation.z = Math.PI / 2;
  handle.position.y = lid.position.y + 0.15;
  handle.position.z = 0.05; // Slight offset to align with attachment points
  root.add(handle);

  // Handle attachment rings (small toruses on sides)
  const ringGeom = new THREE.TorusGeometry(0.035, 0.008, 8, 16);
  
  const ringLeft = new THREE.Mesh(ringGeom, frameMat);
  ringLeft.rotation.y = Math.PI / 2;
  ringLeft.position.set(-bodyRadius - 0.01, lid.position.y + 0.05, 0);
  root.add(ringLeft);

  const ringRight = new THREE.Mesh(ringGeom, frameMat);
  ringRight.rotation.y = Math.PI / 2;
  ringRight.position.set(bodyRadius + 0.01, lid.position.y + 0.05, 0);
  root.add(ringRight);

  // Decorative band under the lid (engraved look simulation via thin cylinder)
  const bandGeom = new THREE.CylinderGeometry(bodyRadius + 0.005, bodyRadius + 0.005, 0.02, 32);
  const band = new THREE.Mesh(bandGeom, frameMat);
  band.position.y = lid.position.y - 0.01;
  root.add(band);

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