export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed Stainless Steel (Body/Base)
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Matte Black Plastic (Lid/Knob/Feet)
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Translucent Blue Plastic (Handle)
  const bluePlasticMat = new THREE.MeshPhysicalMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Emissive Glow (Handle Light)
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.0,
    toneMapped: false,
  });

  // --- Procedural Logo Texture ---
  function createLogoTexture() {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Fill transparent
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 0; // A
    }

    // Helper to draw a filled rect
    function drawRect(x, y, w, h, r, g, b, a) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const idx = (iy * width + ix) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }
      }
    }

    // Draw "NURCAL" (Blocky representation)
    // Simplified: Just draw a white label background and dark text bars
    // Label Background
    drawRect(60, 100, 136, 60, 255, 255, 255, 200);
    
    // Text "NURCAL" simulation (dark bars)
    drawRect(70, 115, 10, 30, 20, 20, 20, 255); // N
    drawRect(90, 115, 10, 30, 20, 20, 20, 255); // U
    drawRect(110, 115, 10, 30, 20, 20, 20, 255); // R
    drawRect(130, 115, 10, 30, 20, 20, 20, 255); // C
    drawRect(150, 115, 10, 30, 20, 20, 20, 255); // A
    drawRect(170, 115, 10, 30, 20, 20, 20, 255); // L

    // Text "COFFEE" simulation (smaller bars below)
    drawRect(80, 135, 8, 15, 20, 20, 20, 255);
    drawRect(95, 135, 8, 15, 20, 20, 20, 255);
    drawRect(110, 135, 8, 15, 20, 20, 20, 255);
    drawRect(125, 135, 8, 15, 20, 20, 20, 255);
    drawRect(140, 135, 8, 15, 20, 20, 20, 255);
    drawRect(155, 135, 8, 15, 20, 20, 20, 255);

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const logoTexture = createLogoTexture();
  const bodyMatWithLogo = steelMat.clone();
  bodyMatWithLogo.map = logoTexture;
  bodyMatWithLogo.needsUpdate = true;

  // --- Dimensions ---
  const bodyRadius = 0.22;
  const bodyHeight = 0.55;
  const baseRadius = 0.26;
  const baseHeight = 0.12;
  const lidHeight = 0.06;

  // --- Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMatWithLogo);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, steelMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- Feet ---
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
  const footPositions = [
    [0.15, 0.0, 0.15],
    [-0.15, 0.0, 0.15],
    [0.0, 0.0, -0.18]
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, blackPlasticMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // --- Lid ---
  const lidGeom = new THREE.CylinderGeometry(bodyRadius + 0.01, bodyRadius + 0.01, lidHeight, 32);
  const lid = new THREE.Mesh(lidGeom, blackPlasticMat);
  lid.position.y = baseHeight + bodyHeight + lidHeight / 2;
  root.add(lid);

  // --- Lid Knob ---
  const knobGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
  const knob = new THREE.Mesh(knobGeom, blackPlasticMat);
  knob.position.y = baseHeight + bodyHeight + lidHeight + 0.015;
  root.add(knob);

  // --- Spout ---
  // Triangular prism shape extruding from the left side (-X)
  const spoutShape = new THREE.Shape();
  spoutShape.moveTo(0, 0);
  spoutShape.lineTo(0.12, -0.04);
  spoutShape.lineTo(0.12, 0.04);
  spoutShape.lineTo(0, 0);
  
  const spoutExtrudeSettings = { depth: 0.08, bevelEnabled: false };
  const spoutGeom = new THREE.ExtrudeGeometry(spoutShape, spoutExtrudeSettings);
  // Center the geometry locally so we can position it easily
  spoutGeom.center(); 
  
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  // Position on the left side (-X), near the top of the body
  spout.position.set(-bodyRadius - 0.04, baseHeight + bodyHeight * 0.8, 0);
  spout.rotation.z = Math.PI / 2; // Point outward
  spout.rotation.y = -Math.PI / 4; // Angle slightly forward
  root.add(spout);

  // --- Handle ---
  // Curve from top-back-right to bottom-front-right
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius - 0.05, baseHeight + bodyHeight * 0.9, -0.1), // Top attachment
    new THREE.Vector3(bodyRadius + 0.15, baseHeight + bodyHeight * 0.5, -0.05), // Mid curve
    new THREE.Vector3(bodyRadius + 0.18, baseHeight + bodyHeight * 0.2, 0.1),   // Bottom curve
    new THREE.Vector3(bodyRadius - 0.05, baseHeight + bodyHeight * 0.15, 0.15)   // Bottom attachment
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, bluePlasticMat);
  root.add(handle);

  // --- Handle Glow ---
  // Inner tube following the same path but thinner
  const glowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + bodyHeight * 0.85, -0.08),
    new THREE.Vector3(bodyRadius + 0.14, baseHeight + bodyHeight * 0.5, -0.04),
    new THREE.Vector3(bodyRadius + 0.16, baseHeight + bodyHeight * 0.25, 0.08),
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + bodyHeight * 0.2, 0.12)
  ]);

  const glowGeom = new THREE.TubeGeometry(glowCurve, 20, 0.015, 8, false);
  const glow = new THREE.Mesh(glowGeom, glowMat);
  root.add(glow);

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