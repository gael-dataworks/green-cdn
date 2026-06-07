export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.1,
  });

  const glossyBlackMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.2,
    metalness: 0.3,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    roughness: 0.2,
    metalness: 0.6,
  });

  const clearGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  const frothMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    roughness: 0.8,
    metalness: 0.0,
  });

  const emissiveBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2.0,
    roughness: 0.4,
    metalness: 0.0,
  });

  const redButtonMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    roughness: 0.4,
    metalness: 0.1,
  });

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.2,
  });

  // --- Helper: DataTexture for Control Panel ---
  function createControlPanelTexture() {
    const w = 256, h = 256;
    const data = new Uint8Array(w * h * 4);
    
    // Background: Dark Grey
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 40; data[i+1] = 40; data[i+2] = 45; data[i+3] = 255;
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

    // Helper to draw rounded rect border
    function drawBorder() {
      const padding = 15;
      const thickness = 4;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const insideX = x > padding && x < w - padding;
          const insideY = y > padding && y < h - padding;
          const borderX = (x >= padding && x <= padding + thickness) || (x >= w - padding - thickness && x <= w - padding);
          const borderY = (y >= padding && y <= padding + thickness) || (y >= h - padding - thickness && y <= h - padding);
          
          if ((insideX || insideY) && (borderX || borderY)) {
             // Light blue glow border
             const idx = (y * w + x) * 4;
             data[idx] = 150; data[idx+1] = 200; data[idx+2] = 255; data[idx+3] = 255;
          }
        }
      }
    }

    // Draw Elements
    drawBorder();
    
    // Red Button (Top Right)
    drawCircle(200, 60, 18, [200, 20, 20]);
    
    // Knob (Bottom Left)
    drawCircle(80, 180, 20, [30, 30, 30]);
    // Knob indicator line
    for(let i=0; i<15; i++) {
        const kx = 80 + Math.cos(-Math.PI/2) * (20 + i);
        const ky = 180 + Math.sin(-Math.PI/2) * (20 + i);
        const idx = (Math.floor(ky) * w + Math.floor(kx)) * 4;
        if(idx < data.length) { data[idx]=255; data[idx+1]=255; data[idx+2]=255; }
    }

    // Blue Light (Bottom Right) - Glowing
    for (let y = 150; y < 220; y++) {
        for (let x = 180; x < 240; x++) {
            const dist = Math.sqrt((x-210)**2 + (y-185)**2);
            if (dist < 25) {
                const idx = (y * w + x) * 4;
                const intensity = 1 - (dist / 25);
                data[idx] = 100; data[idx+1] = 200; data[idx+2] = 255; data[idx+3] = 255;
                // Add glow
                if(dist > 20) {
                     data[idx] *= 0.5; data[idx+1] *= 0.5; data[idx+2] *= 0.5;
                }
            }
        }
    }

    // Text "Frappé" (Simplified blocky representation near top left)
    // F
    for(let y=50; y<90; y++) {
        for(let x=40; x<70; x++) {
            if (y===50 || y===90 || y===70 || x===40) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
            }
        }
    }
    // r
    for(let y=50; y<90; y++) {
        for(let x=75; x<95; x++) {
             if (x===75 || (y===50 && x<90) || (y===65 && x<90) || (x===90 && y>65)) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
             }
        }
    }
    // a
    for(let y=50; y<90; y++) {
        for(let x=100; x<125; x++) {
             if (x===100 || x===125 || y===90 || (y===70 && x>100 && x<125)) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
             }
        }
    }
    // p
    for(let y=50; y<100; y++) {
        for(let x=130; x<155; x++) {
             if (x===130 || (y===50 && x<150) || (y===70 && x<150) || (x===150 && y>50 && y<70)) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
             }
        }
    }
    // p
    for(let y=50; y<100; y++) {
        for(let x=160; x<185; x++) {
             if (x===160 || (y===50 && x<180) || (y===70 && x<180) || (x===180 && y>50 && y<70)) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
             }
        }
    }
    // é (simplified e with accent)
    for(let y=50; y<90; y++) {
        for(let x=190; x<215; x++) {
             if (x===190 || (y===50 && x<210 && x>195) || (y===70 && x<210) || (y===90 && x<210)) {
                const idx = (y * w + x) * 4;
                data[idx]=255; data[idx+1]=255; data[idx+2]=255;
             }
        }
    }
    // Accent dot
    drawCircle(202, 40, 3, [255, 255, 255]);

    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  // --- Helper: DataTexture for Base Logo "rappé" ---
  function createBaseLogoTexture() {
      const w = 256, h = 64;
      const data = new Uint8Array(w * h * 4);
      // Transparent background
      for (let i = 0; i < data.length; i += 4) {
          data[i+3] = 0; 
      }
      // Simple white text "rappé" centered
      // Just drawing a white bar for simplicity as text rasterization is heavy
      // Actually, let's draw simple block letters
      const drawChar = (startX, pattern) => {
          for(let r=0; r<5; r++) {
              for(let c=0; c<3; c++) {
                  if(pattern[r][c] === 1) {
                      for(let dy=0; dy<8; dy++) {
                          for(let dx=0; dx<4; dx++) {
                              const px = startX + c*4 + dx;
                              const py = 10 + r*8 + dy;
                              const idx = (py * w + px) * 4;
                              data[idx] = 255; data[idx+1]=255; data[idx+2]=255; data[idx+3]=255;
                          }
                      }
                  }
              }
          }
      };
      // r: [1,0,0], [1,0,0], [1,1,0], [1,0,1], [1,0,1]
      drawChar(40, [[1,0,0],[1,0,0],[1,1,0],[1,0,0],[1,0,0]]);
      // a
      drawChar(80, [[0,0,0],[0,1,0],[1,0,1],[1,1,1],[1,0,1]]);
      // p
      drawChar(120, [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]]);
      // p
      drawChar(160, [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]]);
      // e
      drawChar(200, [[0,0,0],[0,1,0],[1,0,1],[1,1,0],[0,1,0]]);
      
      const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      return tex;
  }

  const panelTex = createControlPanelTexture();
  const panelMat = new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.4, metalness: 0.1 });
  const logoTex = createBaseLogoTexture();
  const logoMat = new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, opacity: 1.0, roughness: 0.5 });


  // --- Base Unit ---
  const baseW = 1.2, baseD = 0.7, baseH = 0.15;
  const baseGeom = new THREE.BoxGeometry(baseW, baseH, baseD);
  const baseMesh = new THREE.Mesh(baseGeom, blackPlasticMat);
  baseMesh.position.y = baseH / 2;
  root.add(baseMesh);

  // Feet
  const footGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const footPositions = [
      [-baseW/2 + 0.05, 0.015, -baseD/2 + 0.05],
      [baseW/2 - 0.05, 0.015, -baseD/2 + 0.05],
      [-baseW/2 + 0.05, 0.015, baseD/2 - 0.05],
      [baseW/2 - 0.05, 0.015, baseD/2 - 0.05],
  ];
  for(const pos of footPositions) {
      const foot = new THREE.Mesh(footGeom, blackPlasticMat);
      foot.position.set(...pos);
      root.add(foot);
  }

  // Drip Tray Grille (Series of thin cylinders)
  const trayW = baseW * 0.6;
  const trayD = baseD * 0.8;
  const trayY = baseH + 0.01;
  const slatGeom = new THREE.CylinderGeometry(0.005, 0.005, trayD, 8);
  slatGeom.rotateX(Math.PI / 2);
  const slatCount = 12;
  for(let i=0; i<slatCount; i++) {
      const x = -trayW/2 + (trayW / (slatCount-1)) * i;
      const slat = new THREE.Mesh(slatGeom, chromeMat);
      slat.position.set(x, trayY, 0);
      root.add(slat);
  }
  
  // Base Logo Plane
  const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.08), logoMat);
  logoPlane.position.set(0, baseH/2 + 0.001, baseD/2 + 0.001);
  root.add(logoPlane);


  // --- Tower Body ---
  const towerW = 0.65, towerH = 0.9, towerD = 0.55;
  const towerGeom = new THREE.BoxGeometry(towerW, towerH, towerD);
  const towerMesh = new THREE.Mesh(towerGeom, blackPlasticMat);
  towerMesh.position.set(0, baseH + towerH/2, -towerD/2 + baseD/2);
  root.add(towerMesh);

  // Water Tank (Top Left Block)
  const tankW = 0.35, tankH = 0.35, tankD = 0.45;
  const tankGeom = new THREE.BoxGeometry(tankW, tankH, tankD);
  const tankMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaccff,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.8
  });
  const tankMesh = new THREE.Mesh(tankGeom, tankMat);
  tankMesh.position.set(-towerW/2 + tankW/2, baseH + towerH - tankH/2, -towerD/2 + tankD/2);
  root.add(tankMesh);

  // Spout (Under tank)
  const spoutGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 16);
  const spoutMesh = new THREE.Mesh(spoutGeom, blackPlasticMat);
  spoutMesh.position.set(-towerW/2 + 0.1, baseH + towerH - tankH - 0.1, -towerD/2 + 0.1);
  root.add(spoutMesh);
  
  // Spout Tip (Chrome)
  const tipGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
  const tipMesh = new THREE.Mesh(tipGeom, chromeMat);
  tipMesh.position.set(-towerW/2 + 0.1, baseH + towerH - tankH - 0.18, -towerD/2 + 0.1);
  root.add(tipMesh);


  // --- Control Panel ---
  // Recessed area on front right
  const panelW = 0.25, panelH = 0.35, panelD = 0.02;
  const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, panelD), panelMat);
  // Position on front face of tower
  panelMesh.position.set(
      towerW/2 - panelW/2 - 0.05, 
      baseH + towerH * 0.75, 
      -towerD/2 + panelD/2 + 0.001
  );
  root.add(panelMesh);

  // Blue LED Window (Lower Front)
  const ledW = 0.12, ledH = 0.12;
  const ledMesh = new THREE.Mesh(new THREE.BoxGeometry(ledW, ledH, 0.02), emissiveBlueMat);
  ledMesh.position.set(
      towerW/2 - ledW/2 - 0.05,
      baseH + towerH * 0.35,
      -towerD/2 + 0.001
  );
  root.add(ledMesh);


  // --- Mug Assembly ---
  const mugGroup = new THREE.Group();
  
  // Mug Body (Lathe)
  const mugProfile = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.12, 0),
      new THREE.Vector2(0.13, 0.05),
      new THREE.Vector2(0.13, 0.35),
      new THREE.Vector2(0.14, 0.38), // Rim
      new THREE.Vector2(0, 0.38)
  ];
  const mugGeom = new THREE.LatheGeometry(mugProfile, 32);
  const mugMesh = new THREE.Mesh(mugGeom, clearGlassMat);
  mugMesh.position.y = 0.19; // Half height
  mugGroup.add(mugMesh);

  // Mug Handle (Torus)
  const handleGeom = new THREE.TorusGeometry(0.06, 0.012, 16, 32, Math.PI * 1.8);
  const handleMesh = new THREE.Mesh(handleGeom, clearGlassMat);
  handleMesh.position.set(-0.14, 0.20, 0);
  handleMesh.rotation.z = Math.PI * 0.1;
  handleMesh.rotation.y = Math.PI / 2;
  mugGroup.add(handleMesh);

  // Liquid (Froth)
  const liquidGeom = new THREE.CylinderGeometry(0.125, 0.12, 0.25, 32);
  const liquidMesh = new THREE.Mesh(liquidGeom, frothMat);
  liquidMesh.position.y = 0.15;
  mugGroup.add(liquidMesh);

  // Position Mug under spout
  // Spout is at x: -towerW/2 + 0.1. Tower center is 0.
  // Mug should be centered under spout.
  const mugX = -towerW/2 + 0.1;
  const mugZ = -towerD/2 + 0.15; // Forward on tray
  mugGroup.position.set(mugX, trayY, mugZ);
  
  // Rotate mug so handle faces left (away from center)
  // Default handle is at -X. We want it at -X relative to mug center.
  // Spout is on the left of the machine. Mug is on the left.
  // Handle should face Left (-X). Default Torus is in XY plane.
  // My handle logic: position -0.14 (left). So it faces left. Correct.
  
  root.add(mugGroup);

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