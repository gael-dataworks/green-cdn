export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Leather: Deep burgundy, satin finish.
  // We add a procedural noise texture for leather grain to avoid plastic look.
  const leatherColor = 0x800020;
  const leatherMat = new THREE.MeshStandardMaterial({
    color: leatherColor,
    metalness: 0.0,
    roughness: 0.55,
  });

  // Stitching: Darker, matte thread.
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x4a0012,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Leather Grain Texture ---
  // Required to simulate organic leather surface rather than flat plastic.
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // Deterministic pseudo-noise using sin/cos
      const nx = x / texSize;
      const ny = y / texSize;
      const noise = (Math.sin(nx * 50.0) + Math.cos(ny * 50.0) + Math.sin((nx + ny) * 30.0)) * 0.1;
      const base = 0.5 + noise; 
      const idx = (y * texSize + x) * 4;
      // Slight variation in the burgundy color
      texData[idx] = 128 + base * 20;     // R
      texData[idx + 1] = 0 + base * 5;    // G
      texData[idx + 2] = 32 + base * 10;  // B
      texData[idx + 3] = 255;             // A
    }
  }
  const grainTex = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  grainTex.colorSpace = THREE.SRGBColorSpace;
  grainTex.wrapS = THREE.RepeatWrapping;
  grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.repeat.set(4, 4);
  grainTex.needsUpdate = true;
  leatherMat.bumpMap = grainTex;
  leatherMat.bumpScale = 0.002;

  // --- Dimensions ---
  const bagW = 0.60;
  const bagH = 0.35;
  const bagD = 0.12;
  const flapThickness = 0.04;
  const puffRadius = 0.035;
  const puffFlatness = 0.015;

  // --- Body Structure ---
  
  // Back Panel
  const backGeom = new THREE.BoxGeometry(bagW, bagH, flapThickness);
  const bodyBack = new THREE.Mesh(backGeom, leatherMat);
  bodyBack.position.z = -bagD / 2 + flapThickness / 2;
  root.add(bodyBack);

  // Bottom Panel
  const bottomGeom = new THREE.BoxGeometry(bagW, flapThickness, bagD);
  const bodyBottom = new THREE.Mesh(bottomGeom, leatherMat);
  bodyBottom.position.y = -bagH / 2 + flapThickness / 2;
  bodyBottom.position.z = 0;
  root.add(bodyBottom);

  // Side Gussets (Left/Right)
  const sideGeom = new THREE.BoxGeometry(flapThickness, bagH, bagD);
  const sideLeft = new THREE.Mesh(sideGeom, leatherMat);
  sideLeft.position.x = -bagW / 2 + flapThickness / 2;
  sideLeft.position.z = 0;
  root.add(sideLeft);

  const sideRight = new THREE.Mesh(sideGeom, leatherMat);
  sideRight.position.x = bagW / 2 - flapThickness / 2;
  sideRight.position.z = 0;
  root.add(sideRight);

  // --- Front Flap ---
  // The flap is the main visual element with quilting.
  // Base geometry for the flap (slightly larger to wrap over)
  const flapGeom = new THREE.BoxGeometry(bagW + 0.02, bagH * 0.65, flapThickness);
  const flap = new THREE.Mesh(flapGeom, leatherMat);
  // Position flap to cover the top front portion
  flap.position.set(0, bagH / 2 - (bagH * 0.65) / 2, bagD / 2);
  // Slight rotation to simulate the fold over the top
  flap.rotation.x = -0.15; 
  root.add(flap);

  // --- Quilting (Instanced Meshes) ---
  // We use InstancedMesh for the puffy diamonds to keep draw calls low.
  
  // 1. Puffs (Flattened Spheres)
  const puffGeom = new THREE.SphereGeometry(puffRadius, 16, 16);
  // Scale geometry to be flat before instancing
  puffGeom.scale(1, 1, puffFlatness / puffRadius); 
  
  const puffCountX = 9;
  const puffCountY = 5;
  const totalPuffs = puffCountX * puffCountY;
  
  const puffMesh = new THREE.InstancedMesh(puffGeom, leatherMat, totalPuffs);
  const dummy = new THREE.Object3D();
  let idx = 0;

  // Grid parameters
  const spacingX = (bagW - 0.04) / puffCountX;
  const spacingY = (bagH * 0.60) / puffCountY;
  const offsetX = - (bagW / 2) + spacingX / 2;
  const offsetY = (bagH / 2) - (bagH * 0.65) / 2 + spacingY / 2; // Relative to flap center

  for (let y = 0; y < puffCountY; y++) {
    for (let x = 0; x < puffCountX; x++) {
      // Diamond pattern offset
      const rowOffset = (y % 2 === 0) ? 0 : spacingX / 2;
      
      const px = offsetX + x * spacingX + rowOffset;
      const py = offsetY - y * spacingY;
      const pz = flapThickness / 2 + puffFlatness / 2; // Sit on surface

      dummy.position.set(px, py, pz);
      // Rotate 45 degrees for diamond orientation
      dummy.rotation.set(0, 0, Math.PI / 4); 
      // Scale slightly to ensure they touch/overlap slightly for puffy look
      dummy.scale.set(1.1, 1.1, 1); 
      
      dummy.updateMatrix();
      puffMesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  // Attach puffMesh to the flap so it moves/rotates with it
  flap.add(puffMesh);

  // 2. Stitches (Thin Cylinders between puffs)
  // We'll place stitches in a grid pattern matching the puffs.
  const stitchRadius = 0.003;
  const stitchLen = spacingX * 1.4; // Diagonal length approx
  const stitchGeom = new THREE.CylinderGeometry(stitchRadius, stitchRadius, stitchLen, 8);
  // Cylinder is Y-up, we need it flat on Z plane, rotated 45 deg
  stitchGeom.rotateX(Math.PI / 2); 
  stitchGeom.rotateZ(Math.PI / 4);

  const totalStitches = (puffCountX - 1) * puffCountY + puffCountX * (puffCountY - 1);
  const stitchMesh = new THREE.InstancedMesh(stitchGeom, stitchMat, totalStitches);
  let sIdx = 0;

  // Horizontal-ish stitches (connecting left-right puffs)
  for (let y = 0; y < puffCountY; y++) {
    for (let x = 0; x < puffCountX - 1; x++) {
       const rowOffset = (y % 2 === 0) ? 0 : spacingX / 2;
       // Position between two puffs
       const px = offsetX + x * spacingX + spacingX / 2 + rowOffset;
       const py = offsetY - y * spacingY;
       const pz = flapThickness / 2 + 0.001; // Slightly above surface

       dummy.position.set(px, py, pz);
       dummy.rotation.set(0, 0, Math.PI / 4); // Match diamond angle
       dummy.scale.set(1, 1, 1);
       dummy.updateMatrix();
       stitchMesh.setMatrixAt(sIdx++, dummy.matrix);
    }
  }
  
  // Vertical-ish stitches (connecting top-bottom puffs)
  // Actually, in a diamond grid, the "vertical" connections are also diagonal relative to the bag axes
  // But visually they form the other half of the diamond grid.
  // Let's just draw the grid lines that form the diamonds.
  // The previous loop drew one set of diagonals. We need the other set.
  
  // Reset loop for the other diagonal direction
  // To simplify: Just draw lines connecting the centers in the grid pattern.
  // A diamond grid is just a square grid rotated 45 deg.
  // So we need lines at +45 deg and -45 deg.
  // The previous loop did +45 deg (Math.PI/4). Now we do -45 deg ( -Math.PI/4).
  
  // Re-calculate count for second set
  const stitchGeom2 = new THREE.CylinderGeometry(stitchRadius, stitchRadius, stitchLen, 8);
  stitchGeom2.rotateX(Math.PI / 2); 
  stitchGeom2.rotateZ(-Math.PI / 4);
  
  // We need to update the mesh geometry or create a new one. 
  // To save draw calls, let's just assume the first set of stitches is enough to define the pattern 
  // OR we merge geometries. Merging is complex procedurally.
  // Let's just add a second InstancedMesh for the other diagonal. It's only 1 extra draw call.
  
  const stitchMesh2 = new THREE.InstancedMesh(stitchGeom2, stitchMat, totalStitches);
  let sIdx2 = 0;

  for (let y = 0; y < puffCountY; y++) {
    for (let x = 0; x < puffCountX - 1; x++) {
       const rowOffset = (y % 2 === 0) ? 0 : spacingX / 2;
       const px = offsetX + x * spacingX + spacingX / 2 + rowOffset;
       const py = offsetY - y * spacingY;
       const pz = flapThickness / 2 + 0.001;

       dummy.position.set(px, py, pz);
       dummy.rotation.set(0, 0, -Math.PI / 4); 
       dummy.updateMatrix();
       stitchMesh2.setMatrixAt(sIdx2++, dummy.matrix);
    }
  }
  
  flap.add(stitchMesh);
  flap.add(stitchMesh2);

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