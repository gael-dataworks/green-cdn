export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed metal for body and base
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x909090,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Black matte/satin plastic for lid
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Glossy blue plastic for handle
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Emissive blue for the LED strip
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    emissive: 0x00aaff,
    emissiveIntensity: 1.5,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Dark etched logo material
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const bodyRadius = 0.25;
  const bodyHeight = 0.55;
  const baseRadius = 0.28;
  const baseHeight = 0.08;
  const lidHeight = 0.06;

  // --- Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Small feet for the base
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(Math.cos(angle) * (baseRadius * 0.8), 0, Math.sin(angle) * (baseRadius * 0.8));
    root.add(foot);
  }

  // --- Lid ---
  const lidGeom = new THREE.CylinderGeometry(bodyRadius + 0.01, bodyRadius + 0.01, lidHeight, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = baseHeight + bodyHeight + lidHeight / 2;
  root.add(lid);

  // Lid knob
  const knobGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.04, 16);
  const knob = new THREE.Mesh(knobGeom, lidMat);
  knob.position.y = baseHeight + bodyHeight + lidHeight + 0.02;
  root.add(knob);

  // --- Spout ---
  // Tapered cylinder rotated to point out (-X) and up slightly
  const spoutGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.12, 16);
  const spout = new THREE.Mesh(spoutGeom, bodyMat);
  spout.rotation.z = Math.PI / 2;
  spout.rotation.y = -Math.PI / 6; // Angle slightly forward
  spout.position.set(-bodyRadius - 0.06, baseHeight + bodyHeight * 0.85, 0);
  root.add(spout);

  // --- Handle ---
  // Use TubeGeometry for a custom C-shape
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + bodyHeight * 0.85, 0), // Top attach
    new THREE.Vector3(bodyRadius + 0.15, baseHeight + bodyHeight * 0.85, 0), // Top out
    new THREE.Vector3(bodyRadius + 0.18, baseHeight + bodyHeight * 0.5, 0),  // Mid out
    new THREE.Vector3(bodyRadius + 0.15, baseHeight + bodyHeight * 0.15, 0), // Bottom out
    new THREE.Vector3(bodyRadius + 0.02, baseHeight + bodyHeight * 0.15, 0), // Bottom attach
  ]);

  const handleTubeGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleTubeGeom, handleMat);
  root.add(handle);

  // --- Glow Strip ---
  // Inner curve for the LED
  const glowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bodyRadius + 0.06, baseHeight + bodyHeight * 0.75, 0),
    new THREE.Vector3(bodyRadius + 0.12, baseHeight + bodyHeight * 0.75, 0),
    new THREE.Vector3(bodyRadius + 0.14, baseHeight + bodyHeight * 0.5, 0),
    new THREE.Vector3(bodyRadius + 0.12, baseHeight + bodyHeight * 0.25, 0),
    new THREE.Vector3(bodyRadius + 0.06, baseHeight + bodyHeight * 0.25, 0),
  ]);

  const glowTubeGeom = new THREE.TubeGeometry(glowCurve, 20, 0.015, 8, false);
  const glowStrip = new THREE.Mesh(glowTubeGeom, glowMat);
  root.add(glowStrip);

  // --- Logo ---
  // Procedural texture for "NURCAL"
  const logoWidth = 256;
  const logoHeight = 128;
  const data = new Uint8Array(logoWidth * logoHeight * 4);
  
  // Fill transparent
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;     // R
    data[i + 1] = 0; // G
    data[i + 2] = 0; // B
    data[i + 3] = 0; // Alpha
  }

  // Draw simple blocky text shapes (NURCAL)
  // Helper to draw a filled rect in the buffer
  function drawRect(x, y, w, h, alpha = 255) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);
        if (px >= 0 && px < logoWidth && py >= 0 && py < logoHeight) {
          const idx = (py * logoWidth + px) * 4;
          data[idx] = 50;
          data[idx + 1] = 50;
          data[idx + 2] = 50;
          data[idx + 3] = alpha;
        }
      }
    }
  }

  // Simplified "NURCAL" representation
  const startX = 60;
  const startY = 40;
  const charW = 12;
  const charH = 24;
  const gap = 6;

  // N
  drawRect(startX, startY, 4, charH);
  drawRect(startX + charW - 4, startY, 4, charH);
  drawRect(startX, startY, charW, 4); // Top bar
  drawRect(startX, startY + charH - 4, charW, 4); // Bottom bar
  // Diagonal for N simulated by steps
  drawRect(startX + 4, startY + 4, 4, 4);
  drawRect(startX + 8, startY + 8, 4, 4);
  drawRect(startX + 12, startY + 12, 4, 4);

  // U
  const uX = startX + charW + gap;
  drawRect(uX, startY, 4, charH);
  drawRect(uX + charW - 4, startY, 4, charH);
  drawRect(uX, startY + charH - 4, charW, 4);

  // R
  const rX = uX + charW + gap;
  drawRect(rX, startY, 4, charH);
  drawRect(rX, startY, charW, 4);
  drawRect(rX, startY + charH/2, charW - 2, 4);
  drawRect(rX + charW - 4, startY + charH/2, 4, charH/2);

  // C
  const cX = rX + charW + gap;
  drawRect(cX, startY, charW, 4);
  drawRect(cX, startY + charH - 4, charW, 4);
  drawRect(cX, startY, 4, charH);

  // A
  const aX = cX + charW + gap;
  drawRect(aX, startY, 4, charH);
  drawRect(aX + charW - 4, startY, 4, charH);
  drawRect(aX, startY, charW, 4);
  drawRect(aX + 2, startY + charH/2, charW - 4, 4);

  // L
  const lX = aX + charW + gap;
  drawRect(lX, startY, 4, charH);
  drawRect(lX, startY + charH - 4, charW, 4);

  const logoTexture = new THREE.DataTexture(data, logoWidth, logoHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  logoMat.map = logoTexture;
  logoMat.transparent = true;

  const logoGeom = new THREE.PlaneGeometry(0.12, 0.06);
  const logo = new THREE.Mesh(logoGeom, logoMat);
  // Position on front of body
  logo.position.set(bodyRadius + 0.002, baseHeight + bodyHeight * 0.6, 0);
  // Rotate to face outward (normal is +Z for plane, we want -X? No, body is cylinder)
  // Plane default normal is +Z. We want it on the side facing +X? No, handle is +X.
  // Spout is -X. Logo is usually front or side. Let's put it front (+Z).
  // Actually, looking at image, logo is on the front face relative to handle being on right.
  // Handle is +X. Spout is -X. Logo is +Z.
  logo.rotation.y = 0; 
  root.add(logo);

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