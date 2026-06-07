export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Crystal body: High transmission, low roughness, slight IOR for glass look.
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Clock face: Matte white background.
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Metal hands/hub: Silver with emissive to ensure visibility without env map.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x888888,
    emissiveIntensity: 0.3,
  });

  // --- 1. Crystal Body (Extruded Square with Bevels) ---
  const bodySize = 1.0;
  const bodyDepth = 0.25;
  const bevelSize = 0.06;
  const bevelThickness = 0.06;

  const shape = new THREE.Shape();
  const hs = bodySize / 2;
  shape.moveTo(-hs, -hs);
  shape.lineTo(hs, -hs);
  shape.lineTo(hs, hs);
  shape.lineTo(-hs, hs);
  shape.lineTo(-hs, -hs);

  const extrudeSettings = {
    depth: bodyDepth,
    bevelEnabled: true,
    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelSegments: 3,
    steps: 1,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry so the face is at z=0 and it extrudes backwards
  bodyGeom.translate(0, 0, -bodyDepth / 2 - bevelThickness);
  
  const body = new THREE.Mesh(bodyGeom, crystalMat);
  root.add(body);

  // --- 2. Procedural Clock Face Texture ---
  // We draw numbers 1-12 onto a DataTexture to avoid font loading issues.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Helper: Simple 5x7 bitmap font for digits 0-9
  // 1 = pixel on, 0 = pixel off
  const font = {
    '0': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    '1': [0,0,1,0,0, 0,1,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
    '2': [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 1,1,1,1,1],
    '3': [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    '4': [0,0,0,1,0, 0,0,1,1,0, 0,1,0,1,0, 1,0,0,1,0, 1,1,1,1,1, 0,0,0,1,0, 0,0,0,1,0],
    '5': [1,1,1,1,1, 1,0,0,0,0, 1,1,1,1,0, 0,0,0,0,1, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    '6': [0,0,1,1,0, 0,1,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    '7': [1,1,1,1,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 0,1,0,0,0, 0,1,0,0,0],
    '8': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    '9': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,1, 0,0,0,0,1, 0,0,0,0,1, 0,1,1,1,0],
    ':': [0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0]
  };

  function drawDigit(d, cx, cy, scale, color) {
    const map = font[d];
    if (!map) return;
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 5; x++) {
        if (map[y * 5 + x]) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const px = cx + x * scale + dx;
              const py = cy + y * scale + dy;
              if (px >= 0 && px < texSize && py >= 0 && py < texSize) {
                const idx = (py * texSize + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
              }
            }
          }
        }
      }
    }
  }

  // Fill background white
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255;
  }

  // Draw numbers in a circle
  const centerX = texSize / 2;
  const centerY = texSize / 2;
  const radius = texSize * 0.35;
  const digitScale = 4;
  const numColor = { r: 100, g: 100, b: 100 }; // Grey numbers

  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // Start at 12 (-90 deg)
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    const str = i.toString();
    let drawX = x;
    if (str.length > 1) drawX -= digitScale * 2.5; // Center 2-digit numbers
    
    drawDigit(str[0], drawX, y - 3.5 * digitScale / 2, digitScale, numColor);
    if (str.length > 1) {
      drawDigit(str[1], drawX + digitScale * 6, y - 3.5 * digitScale / 2, digitScale, numColor);
    }
  }

  const faceTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  faceTexture.needsUpdate = true;
  faceMat.map = faceTexture;

  // --- 3. Clock Face Plane ---
  // Slightly smaller than the inner bevel area
  const faceSize = bodySize - bevelSize * 2.5;
  const faceGeom = new THREE.PlaneGeometry(faceSize, faceSize);
  const faceMesh = new THREE.Mesh(faceGeom, faceMat);
  faceMesh.position.z = -bodyDepth / 2 - bevelThickness + 0.001; // Just inside front
  root.add(faceMesh);

  // --- 4. Hands ---
  // Pivot point is center (0,0). Hands extend in +Y direction initially, then rotated.
  // Actually, let's model them extending from center upwards (+Y) and rotate around Z.
  
  // Hour Hand (Short, Thick)
  const hourGeom = new THREE.BoxGeometry(0.04, 0.005, 0.22);
  const hourHand = new THREE.Mesh(hourGeom, metalMat);
  hourHand.position.z = 0.002; // Slightly above face
  hourHand.position.y = 0.11; // Offset so pivot is at bottom of hand
  hourHand.rotation.z = -Math.PI / 3; // 10 o'clock (-60 deg)
  root.add(hourHand);

  // Minute Hand (Long, Medium)
  const minuteGeom = new THREE.BoxGeometry(0.03, 0.005, 0.32);
  const minuteHand = new THREE.Mesh(minuteGeom, metalMat);
  minuteHand.position.z = 0.004;
  minuteHand.position.y = 0.16;
  minuteHand.rotation.z = Math.PI / 3; // 2 o'clock (60 deg)
  root.add(minuteHand);

  // Second Hand (Thin, Long)
  const secondGeom = new THREE.BoxGeometry(0.01, 0.002, 0.38);
  const secondHand = new THREE.Mesh(secondGeom, metalMat);
  secondHand.position.z = 0.006;
  secondHand.position.y = 0.19;
  secondHand.rotation.z = Math.PI * 1.2; // ~7 o'clock (216 deg)
  root.add(secondHand);

  // Center Hub
  const hubGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  const hub = new THREE.Mesh(hubGeom, metalMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.008;
  root.add(hub);

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