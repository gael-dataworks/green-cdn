export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.05,
  });

  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  });

  const lightBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.2,
  });

  const lightRedMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 1.5,
    metalness: 0.0,
    roughness: 0.3,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.3,
    roughness: 0.4,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Procedural Control Panel Texture ---
  function createControlPanelTexture() {
    const w = 256, h = 256;
    const data = new Uint8Array(w * h * 4);
    
    // Background (Dark Grey)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 30; data[i+1] = 30; data[i+2] = 35; data[i+3] = 255;
    }

    // Helper to draw filled circle
    function drawCircle(cx, cy, r, color) {
      const r2 = r * r;
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x*x + y*y <= r2) {
            const px = Math.floor(cx + x);
            const py = Math.floor(cy + y);
            if (px >= 0 && px < w && py >= 0 && py < h) {
              const idx = (py * w + px) * 4;
              data[idx] = color[0];
              data[idx+1] = color[1];
              data[idx+2] = color[2];
              data[idx+3] = 255;
            }
          }
        }
      }
    }

    // Helper to draw text "Frappé" roughly
    function drawText() {
      // Simplified blocky text representation for "Frappé"
      // Just drawing white blocks where letters would be roughly
      const ctx = { w, h, data }; // mock context
      
      // F - top
      for(let y=60; y<70; y++) for(let x=40; x<90; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      // F - mid
      for(let y=70; y<80; y++) for(let x=40; x<70; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      // F - bot
      for(let y=80; y<110; y++) for(let x=40; x<50; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }

      // r
      for(let y=60; y<110; y++) for(let x=60; x<70; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=85; y<95; y++) for(let x=70; x<85; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=95; y<110; y++) for(let x=85; x<90; y>100?x++:x++) { const i=(y*w+x)*4; if(x<w) { data[i]=data[i+1]=data[i+2]=255; } } // rough leg

      // a
      for(let y=70; y<110; y++) for(let x=100; x<110; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=90; y<100; y++) for(let x=110; x<130; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=100; y<110; y++) for(let x=130; x<135; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }

      // p
      for(let y=60; y<110; y++) for(let x=145; x<155; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=60; y<90; y++) for(let x=155; x<175; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=90; y<100; y++) for(let x=155; x<175; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }

      // p
      for(let y=60; y<110; y++) for(let x=185; x<195; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=60; y<90; y++) for(let x=195; x<215; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=90; y<100; y++) for(let x=195; x<215; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }

      // e (acute accent approx)
      for(let y=70; y<100; y++) for(let x=225; x<245; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
      for(let y=60; y<70; y++) for(let x=235; x<245; x++) { const i=(y*w+x)*4; data[i]=data[i+1]=data[i+2]=255; }
    }

    drawText();

    // Red Button (Top Right)
    drawCircle(210, 60, 15, [220, 20, 20]);

    // Black Knob (Bottom Left)
    drawCircle(60, 180, 15, [20, 20, 20]);
    // Knob indicator line
    for(let i=0; i<15; i++) {
        const idx = ((180-15+i) * w + 60) * 4;
        data[idx] = 100; data[idx+1] = 100; data[idx+2] = 100;
    }

    // Blue LED (Bottom Right)
    drawCircle(210, 180, 8, [50, 150, 255]);

    // Blue Border Glow
    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            const border = 5;
            if (x < border || x > w - border || y < border || y > h - border) {
                const idx = (y * w + x) * 4;
                // Mix with blue
                data[idx] = data[idx] * 0.5 + 50;
                data[idx+1] = data[idx+1] * 0.5 + 100;
                data[idx+2] = data[idx+2] * 0.5 + 255;
            }
        }
    }

    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  const panelTex = createControlPanelTexture();
  const panelMat = new THREE.MeshStandardMaterial({
    map: panelTex,
    metalness: 0.2,
    roughness: 0.4,
  });

  // --- Geometry Construction ---

  // 1. Base Platform
  const baseGeom = new THREE.BoxGeometry(0.55, 0.08, 0.45);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = 0.04;
  root.add(base);

  // Base Feet
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
  const footPositions = [
    [-0.24, 0.01, 0.19], [0.24, 0.01, 0.19],
    [-0.24, 0.01, -0.19], [0.24, 0.01, -0.19]
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, baseMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // Drip Tray Slats
  const slatGeom = new THREE.BoxGeometry(0.015, 0.005, 0.35);
  for (let i = -0.2; i <= 0.2; i += 0.05) {
    const slat = new THREE.Mesh(slatGeom, baseMat);
    slat.position.set(i, 0.082, 0);
    root.add(slat);
  }

  // Base Logo "rappé" (Simple white box representation for now, or texture)
  // Using a small white box for simplicity as text texture is complex for side
  const logoGeom = new THREE.BoxGeometry(0.08, 0.015, 0.005);
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const logo = new THREE.Mesh(logoGeom, logoMat);
  logo.position.set(-0.15, 0.045, 0.226);
  root.add(logo);

  // 2. Lower Body
  const lowerBodyGeom = new THREE.BoxGeometry(0.35, 0.25, 0.35);
  const lowerBody = new THREE.Mesh(lowerBodyGeom, bodyMat);
  lowerBody.position.y = 0.205;
  lowerBody.position.z = -0.02;
  root.add(lowerBody);

  // Water Window (Blue Light)
  const windowGeom = new THREE.BoxGeometry(0.12, 0.12, 0.02);
  const waterWindow = new THREE.Mesh(windowGeom, lightBlueMat);
  waterWindow.position.set(0, 0.20, 0.176);
  root.add(waterWindow);

  // 3. Upper Body
  const upperBodyGeom = new THREE.BoxGeometry(0.38, 0.22, 0.36);
  const upperBody = new THREE.Mesh(upperBodyGeom, bodyMat);
  upperBody.position.y = 0.44;
  upperBody.position.z = -0.02;
  root.add(upperBody);

  // Spout Nozzle
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
  const spout = new THREE.Mesh(spoutGeom, bodyMat);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(-0.12, 0.38, 0.15);
  root.add(spout);

  // Spout Drip Ring (Metal)
  const ringGeom = new THREE.TorusGeometry(0.035, 0.005, 8, 24);
  const spoutRing = new THREE.Mesh(ringGeom, metalMat);
  spoutRing.rotation.x = Math.PI / 2;
  spoutRing.position.set(-0.12, 0.34, 0.15);
  root.add(spoutRing);

  // Control Panel Face
  const panelGeom = new THREE.BoxGeometry(0.14, 0.16, 0.02);
  const controlPanel = new THREE.Mesh(panelGeom, panelMat);
  controlPanel.position.set(0.10, 0.46, 0.181);
  root.add(controlPanel);

  // 4. Cup & Liquid
  const cupGroup = new THREE.Group();
  
  // Cup Glass (Lathe)
  const cupProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.08, 0),
    new THREE.Vector2(0.085, 0.02),
    new THREE.Vector2(0.075, 0.16),
    new THREE.Vector2(0.085, 0.17), // Rim
    new THREE.Vector2(0.065, 0.17), // Inner Rim
    new THREE.Vector2(0.07, 0.02),  // Inner Wall
    new THREE.Vector2(0.02, 0.02),  // Inner Base
    new THREE.Vector2(0.02, 0),     // Close inner
  ];
  const cupGeom = new THREE.LatheGeometry(cupProfile, 32);
  // Fix normals for glass
  cupGeom.computeVertexNormals();
  const cupGlass = new THREE.Mesh(cupGeom, glassMat);
  cupGlass.position.y = 0.085;
  cupGroup.add(cupGlass);

  // Cup Handle (Torus)
  const handleGeom = new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI);
  const cupHandle = new THREE.Mesh(handleGeom, glassMat);
  cupHandle.rotation.y = Math.PI / 2;
  cupHandle.position.set(-0.085, 0.10, 0);
  cupGroup.add(cupHandle);

  // Liquid (Cylinder inside)
  const liquidGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.14, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = 0.075;
  cupGroup.add(liquid);

  // Position Cup under spout
  cupGroup.position.set(-0.12, 0.085, 0.12);
  root.add(cupGroup);

  // 5. Top Lid Detail (Slight rounding)
  const topLidGeom = new THREE.BoxGeometry(0.40, 0.06, 0.38);
  const topLid = new THREE.Mesh(topLidGeom, bodyMat);
  topLid.position.y = 0.56;
  topLid.position.z = -0.02;
  root.add(topLid);

  // Normalize
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