export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass Body: Light blue, highly transmissive
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  // Glass Base: Darker blue thick bottom
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // Cap: Silver metal (capped metalness per rules)
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Dip Tube: Semi-transparent plastic
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.6,
  });

  // --- 1. Bottle Body (Lathe) ---
  // Profile points (radius, height)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.32, 0.00), // Bottom edge
    new THREE.Vector2(0.32, 0.90), // Main body side
    new THREE.Vector2(0.34, 1.00), // Shoulder start
    new THREE.Vector2(0.28, 1.10), // Neck start
    new THREE.Vector2(0.16, 1.25), // Neck top
    new THREE.Vector2(0.18, 1.30), // Lip flare
    new THREE.Vector2(0.00, 1.30), // Top center
  ];
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, glassMat);
  root.add(body);

  // --- 2. Thick Base Detail ---
  // A slightly smaller cylinder inside the bottom to simulate thick glass base
  const baseGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 32);
  const baseDetail = new THREE.Mesh(baseGeom, baseMat);
  baseDetail.position.y = 0.075;
  root.add(baseDetail);

  // --- 3. Cap ---
  const capRadius = 0.17;
  const capHeight = 0.35;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.25 + capHeight / 2;
  root.add(cap);

  // --- 4. Cap Decorative Swirls (Relief) ---
  // Approximating the engraved "X" and scrolls with thin tubes on the cap surface
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0, // Slightly darker than cap for contrast
    metalness: 0.6,
    roughness: 0.4,
  });

  function addCapSwirl(angleOffset, heightOffset, curvePoints) {
    const pts = curvePoints.map(p => {
      const r = capRadius + 0.005; // Slightly above surface
      const a = angleOffset + p.a;
      const y = cap.position.y - capHeight/2 + heightOffset + p.y;
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.008, 8, false), swirlMat);
    root.add(tube);
  }

  // Simplified swirl pattern: 4 curves radiating from center-ish
  // Curve 1: Top-Left to Bottom-Right diagonal part
  addCapSwirl(Math.PI * 0.25, 0.05, [
    {a: 0, y: 0.25}, {a: 0.5, y: 0.15}, {a: 1.0, y: 0.05}
  ]);
  // Curve 2: Top-Right to Bottom-Left
  addCapSwirl(Math.PI * 0.75, 0.05, [
    {a: 0, y: 0.25}, {a: -0.5, y: 0.15}, {a: -1.0, y: 0.05}
  ]);
  // Decorative loops
  addCapSwirl(0, 0.15, [
    {a: 0, y: 0}, {a: 1.5, y: 0.1}, {a: 3.0, y: 0}
  ]);
  addCapSwirl(Math.PI, 0.15, [
    {a: 0, y: 0}, {a: -1.5, y: 0.1}, {a: -3.0, y: 0}
  ]);


  // --- 5. Dip Tube (Internal) ---
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.20, 0),      // Top (below cap)
    new THREE.Vector3(0, 0.50, 0),      // Straight down
    new THREE.Vector3(0.15, 0.10, 0),   // Curve towards side
    new THREE.Vector3(0.25, 0.05, 0)    // End near bottom edge
  ]);
  const dipTube = new THREE.Mesh(new THREE.TubeGeometry(tubePath, 20, 0.015, 8, false), tubeMat);
  root.add(dipTube);

  // --- 6. "XANADU" Text Texture ---
  // Procedural DataTexture for the label
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  // Helper to draw a filled rect on the texture buffer
  function fillRect(x, y, w, h, r, g, b, a) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < W && iy >= 0 && iy < H) {
          const idx = (iy * W + ix) * 4;
          // Simple alpha blending with existing (which is 0)
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  // Draw "XANADU" roughly
  // We map text to the lower part of the texture (y: 20 to 100)
  const textY = 40;
  const charW = 20;
  const charH = 40;
  const gap = 5;
  let cursor = 40;

  // X
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor, textY, charW, 4, 255, 255, 255, 200); // crossbar approx
  fillRect(cursor, textY + charH - 4, charW, 4, 255, 255, 255, 200);
  cursor += charW + gap;

  // A
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor, textY, 20, 4, 255, 255, 255, 200); // top
  fillRect(cursor, textY + 20, 20, 4, 255, 255, 255, 200); // mid
  cursor += charW + gap;

  // N
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY, 4, charH, 255, 255, 255, 200);
  // Diagonal approx
  for(let i=0; i<charH; i+=4) fillRect(cursor + 4 + i/2, textY + i, 4, 4, 255, 255, 255, 200);
  cursor += charW + gap;

  // A
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor, textY, 20, 4, 255, 255, 255, 200);
  fillRect(cursor, textY + 20, 20, 4, 255, 255, 255, 200);
  cursor += charW + gap;

  // D
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY + 5, 4, 30, 255, 255, 255, 200);
  fillRect(cursor, textY, 20, 4, 255, 255, 255, 200);
  fillRect(cursor, textY + charH - 4, 20, 4, 255, 255, 255, 200);
  cursor += charW + gap;

  // U
  fillRect(cursor, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor + 16, textY, 4, charH, 255, 255, 255, 200);
  fillRect(cursor, textY + charH - 4, 20, 4, 255, 255, 255, 200);
  cursor += charW + gap;

  const textTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.needsUpdate = true;
  
  // Apply texture to the glass material as a map with transparency
  // To make it look etched, we rely on the alpha. 
  // Since MeshPhysicalMaterial handles transmission, we need to be careful.
  // A simpler approach for etched text on glass is to use a second mesh slightly larger
  // or rely on roughnessMap. But the prompt asks for DataTexture on material map.
  // We will assign it to the glassMat.
  glassMat.map = textTexture;
  glassMat.transparent = true;
  // The texture has alpha, so the text will appear. 
  // To make it look like etching (white lines), we keep the color white in the texture.
  // The glass color will show through the transparent parts.

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