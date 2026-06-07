export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xd90404, // Bright hot sauce red
    metalness: 0.1,
    roughness: 0.3,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.4,
  });

  // --- Label Texture Generation ---
  function createLabelTexture() {
    const width = 512;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Colors
    const yellow = [249, 217, 73, 255];
    const white = [255, 255, 255, 255];
    const black = [20, 20, 20, 255];
    const red = [220, 20, 20, 255];
    const green = [50, 150, 50, 255];
    const orange = [255, 140, 0, 255];

    // Simple 5x7 Font Map (very basic block letters)
    const font = {
      'C': [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 0,1,1,1,0, 1,0,0,0,0, 0,1,1,1,0],
      'I': [0,1,1,1,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
      'A': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
      'R': [1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,0, 1,0,1,0,0, 1,0,0,1,0, 1,0,0,0,1],
      'L': [1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
      'M': [1,0,0,0,1, 1,1,0,1,1, 1,0,1,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
      "'": [0,1,1,0,0, 0,1,1,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
      'S': [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 0,1,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      'H': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
      'K': [1,0,0,0,1, 1,0,0,1,0, 1,0,1,0,0, 1,1,0,0,0, 1,0,1,0,0, 1,0,0,1,0, 1,0,0,0,1],
      'E': [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
      'B': [1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,0],
      'F': [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0],
      'O': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      'U': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      'N': [1,0,0,0,1, 1,1,0,0,1, 1,0,1,0,1, 1,0,0,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
      'G': [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      'V': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,0,1,0, 0,1,0,1,0, 0,0,1,0,0],
      ' ': [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0]
    };

    function drawChar(char, startX, startY, colorArr) {
      const map = font[char] || font[' '];
      if (!map) return;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (map[r * 5 + c]) {
            for (let dy = 0; dy < 4; dy++) {
              for (let dx = 0; dx < 4; dx++) {
                const px = startX + c * 4 + dx;
                const py = startY + r * 4 + dy;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const idx = (py * width + px) * 4;
                  data[idx] = colorArr[0];
                  data[idx+1] = colorArr[1];
                  data[idx+2] = colorArr[2];
                  data[idx+3] = 255;
                }
              }
            }
          }
        }
      }
    }

    // Fill background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = yellow[0];
      data[i+1] = yellow[1];
      data[i+2] = yellow[2];
      data[i+3] = 255;
    }

    // Draw Jagged White Burst (Top and Bottom)
    for (let x = 0; x < width; x++) {
      // Top spikes
      const spikeH = 40 + Math.sin(x * 0.1) * 15 + Math.sin(x * 0.3) * 10;
      for (let y = 0; y < spikeH; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = white[0]; data[idx+1] = white[1]; data[idx+2] = white[2]; data[idx+3] = 255;
      }
      // Bottom spikes
      const botSpikeH = 30 + Math.sin(x * 0.15 + 1) * 10;
      for (let y = height - botSpikeH; y < height; y++) {
        const idx = (y * width + x) * 4;
        data[idx] = white[0]; data[idx+1] = white[1]; data[idx+2] = white[2]; data[idx+3] = 255;
      }
    }

    // Draw Text "CIARLA'LIM'S"
    const title = "CIARLA'LIM'S";
    const titleStartX = 60;
    const titleY = 50;
    for (let i = 0; i < title.length; i++) {
      drawChar(title[i], titleStartX + i * 24, titleY, black);
    }

    // Draw Text "SHAKE BEFORE SERVING"
    const subtitle = "SHAKE BEFORE SERVING";
    const subStartX = 140;
    const subY = 210;
    for (let i = 0; i < subtitle.length; i++) {
      drawChar(subtitle[i], subStartX + i * 10, subY, black);
    }

    // Draw Peppers (Simplified shapes)
    function drawPepper(px, py, colorArr, rotation) {
      // Simple blob approximation
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 30; x++) {
          // Ellipse check
          const dx = x - 15;
          const dy = y - 20;
          if ((dx*dx)/225 + (dy*dy)/400 < 1) {
             const tx = Math.round(px + dx * Math.cos(rotation) - dy * Math.sin(rotation));
             const ty = Math.round(py + dx * Math.sin(rotation) + dy * Math.cos(rotation));
             if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
               const idx = (ty * width + tx) * 4;
               // Gradient
               data[idx] = colorArr[0] - 20; data[idx+1] = colorArr[1]; data[idx+2] = colorArr[2]; data[idx+3] = 255;
             }
          }
        }
      }
      // Stem
      for(let s=0; s<10; s++) {
         const sx = Math.round(px + 15 + Math.sin(s*0.5)*5);
         const sy = Math.round(py - 20 - s);
         if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            data[idx] = green[0]; data[idx+1] = green[1]; data[idx+2] = green[2]; data[idx+3] = 255;
         }
      }
    }

    drawPepper(180, 130, red, 0.2);
    drawPepper(260, 140, orange, -0.3);
    drawPepper(140, 150, red, -0.5);
    // Leaves
    for(let i=0; i<5; i++) {
       const lx = 200 + i*15;
       const ly = 110 + Math.sin(i)*10;
       if(lx < width && ly < height) {
          const idx = (Math.floor(ly) * width + Math.floor(lx)) * 4;
          data[idx] = green[0]; data[idx+1] = green[1]; data[idx+2] = green[2]; data[idx+3] = 255;
       }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const labelTexture = createLabelTexture();
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide
  });

  // --- Geometries ---

  // Bottle Profile (Glass)
  // Radius, Height
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.32, 0.00), // Base
    new THREE.Vector2(0.32, 0.15), // Base wall
    new THREE.Vector2(0.36, 0.45), // Belly
    new THREE.Vector2(0.34, 0.85), // Shoulder start
    new THREE.Vector2(0.22, 1.15), // Neck start
    new THREE.Vector2(0.22, 1.35), // Neck
    new THREE.Vector2(0.24, 1.38), // Lip
    new THREE.Vector2(0.00, 1.38)  // Top center
  ];
  
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // Liquid Profile (Slightly smaller)
  const liquidProfile = [
    new THREE.Vector2(0.00, 0.02),
    new THREE.Vector2(0.29, 0.02),
    new THREE.Vector2(0.29, 0.15),
    new THREE.Vector2(0.33, 0.45),
    new THREE.Vector2(0.31, 0.85),
    new THREE.Vector2(0.19, 1.10), // Liquid stops before neck
    new THREE.Vector2(0.00, 1.10)
  ];
  const liquidGeom = new THREE.LatheGeometry(liquidProfile, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  root.add(liquid);

  // Label (Cylinder)
  // Radius ~0.37, Height ~0.7, centered vertically around y=0.5
  const labelGeom = new THREE.CylinderGeometry(0.375, 0.375, 0.70, 32, 1, true);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.y = 0.50;
  root.add(label);

  // Cap
  const capGeom = new THREE.CylinderGeometry(0.23, 0.23, 0.12, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.38 + 0.06;
  root.add(cap);

  // Cap Ridges (Knurling)
  const ridgeGeom = new THREE.BoxGeometry(0.015, 0.04, 0.02);
  const ridgeCount = 24;
  for (let i = 0; i < ridgeCount; i++) {
    const angle = (i / ridgeCount) * Math.PI * 2;
    const x = Math.cos(angle) * 0.23;
    const z = Math.sin(angle) * 0.23;
    const ridge = new THREE.Mesh(ridgeGeom, capMat);
    ridge.position.set(x, 1.38 + 0.06, z);
    ridge.rotation.y = -angle;
    // Orient ridge to face outward
    ridge.lookAt(0, 1.38 + 0.06, 0); 
    root.add(ridge);
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