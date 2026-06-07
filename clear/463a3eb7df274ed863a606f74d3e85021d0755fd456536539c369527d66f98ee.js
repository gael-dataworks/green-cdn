export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rustic weathered wood
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Plaid fabric texture generation
  function createPlaidTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    // Base dark blue-green
    const baseR = 30, baseG = 60, baseB = 50;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let r = baseR, g = baseG, b = baseB;
        
        // Vertical stripes
        if (x % 32 < 4) { r = 180; g = 50; b = 50; } // Red stripe
        else if (x % 32 < 8) { r = 255; g = 255; b = 255; } // White stripe
        else if (x % 64 < 12) { r = 50; g = 150; b = 50; } // Green stripe
        
        // Horizontal stripes (blend)
        if (y % 32 < 4) { 
            r = Math.max(r, 180); g = Math.max(g, 50); b = Math.max(b, 50); 
        } else if (y % 32 < 8) {
            r = 255; g = 255; b = 255;
        } else if (y % 64 < 12) {
            r = Math.max(r, 50); g = Math.max(g, 150); b = Math.max(b, 50);
        }

        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  const plaidTexture = createPlaidTexture();
  const fabricMat = new THREE.MeshStandardMaterial({
    map: plaidTexture,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Dimensions ---
  const postHeight = 1.6;
  const seatHeight = 0.45;
  const width = 1.4;
  const depth = 0.9;
  const postThickness = 0.12;
  const beamThickness = 0.1;
  
  const halfW = width / 2;
  const halfD = depth / 2;

  // --- Helper: Add Box ---
  function addBox(w, h, d, mat, x, y, z, rx=0, ry=0, rz=0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Posts (4 corners) ---
  const postGeom = new THREE.CylinderGeometry(postThickness/2, postThickness/2, postHeight, 8);
  // Taper slightly for rustic look by scaling, or just use cylinder
  const positions = [
    [-halfW, postHeight/2, -halfD], // Back Left
    [ halfW, postHeight/2, -halfD], // Back Right
    [-halfW, postHeight/2,  halfD], // Front Left
    [ halfW, postHeight/2,  halfD], // Front Right
  ];
  
  positions.forEach((pos, i) => {
    const post = new THREE.Mesh(postGeom, woodMat);
    post.position.set(...pos);
    // Slight random-ish rotation for rustic feel (deterministic based on index)
    post.rotation.y = (i % 2 === 0 ? 0.05 : -0.05); 
    post.rotation.z = (i < 2 ? 0.02 : -0.02);
    root.add(post);
  });

  // --- Base Frame ---
  // Side rails
  addBox(beamThickness, beamThickness, depth, woodMat, -halfW, seatHeight - 0.1, 0);
  addBox(beamThickness, beamThickness, depth, woodMat,  halfW, seatHeight - 0.1, 0);
  // Front/Back rails
  addBox(width, beamThickness, beamThickness, woodMat, 0, seatHeight - 0.1, -halfD);
  addBox(width, beamThickness, beamThickness, woodMat, 0, seatHeight - 0.1,  halfD);
  
  // Cross supports under seat
  addBox(beamThickness/2, beamThickness/2, depth - 0.1, woodMat, -width/4, seatHeight - 0.15, 0);
  addBox(beamThickness/2, beamThickness/2, depth - 0.1, woodMat,  width/4, seatHeight - 0.15, 0);

  // --- Top Canopy Frame ---
  const topY = postHeight - beamThickness/2;
  // Long beams
  addBox(width + postThickness, beamThickness, beamThickness, woodMat, 0, topY, -halfD);
  addBox(width + postThickness, beamThickness, beamThickness, woodMat, 0, topY,  halfD);
  // Short beams
  addBox(beamThickness, beamThickness, depth, woodMat, -halfW, topY - beamThickness/2, 0);
  addBox(beamThickness, beamThickness, depth, woodMat,  halfW, topY - beamThickness/2, 0);

  // --- Armrests ---
  const armY = seatHeight + 0.25;
  const armW = 0.08;
  const armH = 0.04;
  const armD = depth - 0.1;
  addBox(armW, armH, armD, woodMat, -halfW - armW/2, armY, 0);
  addBox(armW, armH, armD, woodMat,  halfW + armW/2, armY, 0);

  // --- Backrest Slats ---
  const slatCount = 11;
  const slatW = 0.025;
  const slatH = seatHeight + 0.3;
  const slatD = 0.025;
  const backZ = -halfD + 0.05;
  const slatStartY = seatHeight;
  const slatEndY = seatHeight + slatH;
  
  for (let i = 0; i < slatCount; i++) {
    const x = -halfW + 0.15 + (i * (width - 0.3) / (slatCount - 1));
    // Slight variation in height for rustic look
    const hVar = (i % 2 === 0) ? 0.02 : 0.0;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(slatW, slatH + hVar, slatD), woodMat);
    slat.position.set(x, slatStartY + (slatH + hVar)/2, backZ);
    root.add(slat);
  }

  // --- Cushions ---
  const cushionThickness = 0.12;
  const seatY = seatHeight + cushionThickness/2;
  const backY = seatHeight + slatH/2 + 0.05;
  
  // Seat Cushions (2)
  const seatCushW = (width / 2) - 0.05;
  const seatCushD = depth - 0.15;
  
  const seatL = addBox(seatCushW, cushionThickness, seatCushD, fabricMat, -width/4, seatY, 0.05);
  const seatR = addBox(seatCushW, cushionThickness, seatCushD, fabricMat,  width/4, seatY, 0.05);
  
  // Back Cushions (2) - slightly tilted back
  const backCushW = (width / 2) - 0.08;
  const backCushH = 0.35;
  const backCushD = 0.12;
  
  const backL = addBox(backCushW, backCushH, backCushD, fabricMat, -width/4, backY, -halfD + 0.15, -0.1, 0, 0);
  const backR = addBox(backCushW, backCushH, backCushD, fabricMat,  width/4, backY, -halfD + 0.15, -0.1, 0, 0);

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