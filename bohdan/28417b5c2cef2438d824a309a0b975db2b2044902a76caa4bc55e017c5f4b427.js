export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel body/base
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Matte black plastic lid
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Blue plastic handle
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2a55a5,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Glowing LED strip
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1.5,
    toneMapped: false,
  });

  // --- Dimensions ---
  const bodyRadius = 0.22;
  const bodyHeight = 0.55;
  const baseRadius = 0.26;
  const baseHeight = 0.08;
  const lidHeight = 0.04;

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, steelMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- Lid ---
  const lidGeom = new THREE.CylinderGeometry(bodyRadius + 0.01, bodyRadius + 0.01, lidHeight, 32);
  const lid = new THREE.Mesh(lidGeom, blackPlasticMat);
  lid.position.y = baseHeight + bodyHeight + lidHeight / 2;
  root.add(lid);

  const knobGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const knob = new THREE.Mesh(knobGeom, blackPlasticMat);
  knob.position.y = baseHeight + bodyHeight + lidHeight + 0.01;
  root.add(knob);

  // --- Spout ---
  // A small tapered cylinder rotated to point forward-left
  const spoutGeom = new THREE.CylinderGeometry(0.03, 0.05, 0.08, 16);
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  spout.rotation.x = Math.PI / 2; // Point along Z
  spout.rotation.z = -Math.PI / 6; // Angle down slightly
  spout.position.set(-bodyRadius, baseHeight + bodyHeight - 0.08, 0.05);
  root.add(spout);

  // --- Handle ---
  // Define a curve for the handle
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius - 0.02, baseHeight + bodyHeight - 0.05, 0), // Top attach
    new THREE.Vector3(bodyRadius + 0.08, baseHeight + bodyHeight - 0.05, 0), // Top curve out
    new THREE.Vector3(bodyRadius + 0.12, baseHeight + bodyHeight * 0.5, 0),  // Mid outer
    new THREE.Vector3(bodyRadius + 0.08, baseHeight + 0.05, 0),              // Bottom curve out
    new THREE.Vector3(bodyRadius - 0.02, baseHeight + 0.05, 0),              // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.035, 12, false);
  const handle = new THREE.Mesh(handleGeom, bluePlasticMat);
  root.add(handle);

  // --- LED Strip (Inner Handle) ---
  // Slightly smaller path inside the handle
  const ledPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + bodyHeight - 0.08, 0),
    new THREE.Vector3(bodyRadius + 0.06, baseHeight + bodyHeight - 0.08, 0),
    new THREE.Vector3(bodyRadius + 0.09, baseHeight + bodyHeight * 0.5, 0),
    new THREE.Vector3(bodyRadius + 0.06, baseHeight + 0.08, 0),
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + 0.08, 0),
  ]);

  const ledGeom = new THREE.TubeGeometry(ledPath, 20, 0.008, 8, false);
  const ledStrip = new THREE.Mesh(ledGeom, ledMat);
  root.add(ledStrip);

  // --- Logo Texture & Label ---
  // Procedural DataTexture for "NURCAL COFFEE"
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  
  // Fill background (transparent/silver-ish)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = 200;     // R
    data[i * 4 + 1] = 200; // G
    data[i * 4 + 2] = 200; // B
    data[i * 4 + 3] = 255; // A
  }

  // Draw simple block text "NURCAL"
  // Helper to draw a rect
  function drawRect(x, y, w, h, r, g, b) {
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) {
        if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
          const idx = (iy * width + ix) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Simple font rasterization (very basic block letters)
  const textColor = [20, 20, 20]; // Dark gray
  const startX = 60;
  const startY = 40;
  const charW = 12;
  const charH = 20;
  const gap = 4;

  // N
  drawRect(startX, startY, 4, charH, ...textColor);
  drawRect(startX + charW - 4, startY, 4, charH, ...textColor);
  drawRect(startX, startY, charW, 4, ...textColor); // Top bar
  // Diagonal approx
  for(let i=0; i<charH; i++) drawRect(startX + 4 + (i/charH)*4, startY + i, 2, 2, ...textColor);

  // U
  const uX = startX + charW + gap;
  drawRect(uX, startY, 4, charH, ...textColor);
  drawRect(uX + charW - 4, startY, 4, charH, ...textColor);
  drawRect(uX, startY + charH - 4, charW, 4, ...textColor);

  // R
  const rX = uX + charW + gap;
  drawRect(rX, startY, 4, charH, ...textColor);
  drawRect(rX, startY, charW, 4, ...textColor);
  drawRect(rX, startY + 8, charW - 2, 4, ...textColor);
  drawRect(rX + charW - 4, startY + 8, 4, 12, ...textColor);

  // C
  const cX = rX + charW + gap;
  drawRect(cX, startY, 4, charH, ...textColor);
  drawRect(cX, startY, charW, 4, ...textColor);
  drawRect(cX, startY + charH - 4, charW, 4, ...textColor);

  // A
  const aX = cX + charW + gap;
  drawRect(aX, startY, 4, charH, ...textColor);
  drawRect(aX + charW - 4, startY, 4, charH, ...textColor);
  drawRect(aX, startY, charW, 4, ...textColor);
  drawRect(aX, startY + 8, charW, 4, ...textColor);

  // L
  const lX = aX + charW + gap;
  drawRect(lX, startY, 4, charH, ...textColor);
  drawRect(lX, startY + charH - 4, charW, 4, ...textColor);

  // COFFEE (smaller below)
  const subY = startY + 30;
  const subH = 10;
  const subW = 6;
  const subGap = 2;
  let subX = startX + 10;
  
  // C
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + subH - 2, subW, 2, ...textColor);
  subX += subW + subGap;
  // O
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX + subW - 2, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + subH - 2, subW, 2, ...textColor);
  subX += subW + subGap;
  // F
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + 4, subW - 1, 2, ...textColor);
  subX += subW + subGap;
  // F
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + 4, subW - 1, 2, ...textColor);
  subX += subW + subGap;
  // E
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + 4, subW - 1, 2, ...textColor);
  drawRect(subX, subY + subH - 2, subW, 2, ...textColor);
  subX += subW + subGap;
  // E
  drawRect(subX, subY, 2, subH, ...textColor);
  drawRect(subX, subY, subW, 2, ...textColor);
  drawRect(subX, subY + 4, subW - 1, 2, ...textColor);
  drawRect(subX, subY + subH - 2, subW, 2, ...textColor);

  const logoTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;

  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTexture,
    transparent: true,
    opacity: 0.9,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide
  });

  // Logo Plane - curved slightly to match body or just flat in front
  // Using a small plane positioned just in front of the cylinder
  const logoWidth = 0.12;
  const logoHeight = 0.06;
  const logoGeom = new THREE.PlaneGeometry(logoWidth, logoHeight);
  const logoMesh = new THREE.Mesh(logoGeom, logoMat);
  // Position on the front of the body (Z+)
  logoMesh.position.set(0, baseHeight + bodyHeight * 0.6, bodyRadius + 0.005);
  root.add(logoMesh);

  // --- Feet (small black pads on bottom) ---
  const footGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const positions = [
    [baseRadius * 0.8, 0, baseRadius * 0.8],
    [-baseRadius * 0.8, 0, baseRadius * 0.8],
    [baseRadius * 0.8, 0, -baseRadius * 0.8],
    [-baseRadius * 0.8, 0, -baseRadius * 0.8],
  ];
  for (const [x, y, z] of positions) {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

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