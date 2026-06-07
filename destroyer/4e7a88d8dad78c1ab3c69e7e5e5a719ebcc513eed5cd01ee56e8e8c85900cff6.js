export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Leather: Dark brown, high roughness, low metalness.
  // We will generate a procedural texture for the leather grain/scratches.
  const leatherColorBase = new THREE.Color(0x3e2723);
  const leatherColorLight = new THREE.Color(0x5d4037);
  const textureSize = 256;
  const data = new Uint8Array(textureSize * textureSize * 4);
  
  // Deterministic noise for leather texture
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const i = (y * textureSize + x) * 4;
      // Simple deterministic noise using sin/cos
      const nx = x / textureSize;
      const ny = y / textureSize;
      const noise = 
        Math.sin(nx * 20) * Math.cos(ny * 20) * 0.5 + 
        Math.sin(nx * 50 + ny * 10) * 0.25 +
        Math.sin(nx * 100) * 0.1;
      
      // Mix base and light color based on noise
      const mixedColor = leatherColorBase.clone().lerp(leatherColorLight, (noise + 1) * 0.3);
      
      // Add some "scratch" lines deterministically
      let scratch = 0;
      if (Math.abs(Math.sin(nx * 30 + ny * 5)) > 0.98) scratch = 0.4;
      
      const r = Math.min(255, Math.floor((mixedColor.r + scratch) * 255));
      const g = Math.min(255, Math.floor((mixedColor.g + scratch) * 255));
      const b = Math.min(255, Math.floor((mixedColor.b + scratch) * 255));
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  
  const leatherTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
  leatherTexture.colorSpace = THREE.SRGBColorSpace;
  leatherTexture.wrapS = THREE.RepeatWrapping;
  leatherTexture.wrapT = THREE.RepeatWrapping;
  leatherTexture.needsUpdate = true;

  const leatherMat = new THREE.MeshStandardMaterial({
    map: leatherTexture,
    color: 0xffffff, // White to let texture dominate
    metalness: 0.0,
    roughness: 0.75,
  });

  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xd7ccc8, // Light tan for page edges
    metalness: 0.0,
    roughness: 0.9,
  });

  const threadMat = new THREE.MeshStandardMaterial({
    color: 0x8d6e63, // Lighter brown for frayed threads
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const width = 0.6;  // X (Spine to fore-edge)
  const height = 0.4; // Y (Top to bottom)
  const depth = 0.8;  // Z (Thickness)
  
  // --- Main Body (The Book Block) ---
  // We model the inner pages block first, then wrap it.
  const coreGeom = new THREE.BoxGeometry(width - 0.02, height - 0.02, depth - 0.02);
  const core = new THREE.Mesh(coreGeom, pageMat);
  root.add(core);

  // --- Leather Cover ---
  // Slightly larger box wrapping the core
  const coverGeom = new THREE.BoxGeometry(width, height, depth);
  // Round the corners slightly by scaling vertices? No, keep it simple box for now.
  // To simulate the leather wrapping, we just place this box.
  const cover = new THREE.Mesh(coverGeom, leatherMat);
  root.add(cover);

  // --- Spine Bands ---
  // 3 raised bands on the spine (Left side, -X)
  const spineBandGeom = new THREE.CylinderGeometry(0.03, 0.03, height * 0.6, 16, 1, false, 0, Math.PI);
  // Rotate to align with spine
  spineBandGeom.rotateY(-Math.PI / 2);
  spineBandGeom.translate(-width / 2 - 0.01, 0, 0); // Move to spine surface

  const bandPositionsY = [-0.15, 0, 0.15];
  for (const by of bandPositionsY) {
    const band = new THREE.Mesh(spineBandGeom, leatherMat);
    band.position.y = by;
    root.add(band);
  }

  // --- Frayed Edges / Binding ---
  // Simulate the rough, frayed leather at the corners and edges
  // We place small cylinders/tubes along the 12 edges of the box
  
  const edgePoints = [
    // Top face
    [-width/2, height/2, -depth/2], [width/2, height/2, -depth/2],
    [width/2, height/2, depth/2], [-width/2, height/2, depth/2],
    // Bottom face
    [-width/2, -height/2, -depth/2], [width/2, -height/2, -depth/2],
    [width/2, -height/2, depth/2], [-width/2, -height/2, depth/2],
  ];

  const edgeConnections = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Top loop
    [4, 5], [5, 6], [6, 7], [7, 4], // Bottom loop
    [0, 4], [1, 5], [2, 6], [3, 7]  // Verticals
  ];

  // Helper to add frayed threads along an edge
  function addFrayedEdge(p1, p2) {
    const dist = p1.distanceTo(p2);
    const count = Math.floor(dist * 15); // Density of threads
    const threadGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.04, 6);
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      const z = p1.z + (p2.z - p1.z) * t;
      
      const thread = new THREE.Mesh(threadGeom, threadMat);
      thread.position.set(x, y, z);
      
      // Deterministic rotation based on index to look messy
      const angle = (i * 137.5) * (Math.PI / 180);
      thread.rotation.set(angle, angle * 2, angle * 0.5);
      
      // Offset slightly outward from center
      const dir = new THREE.Vector3(x, y, z).normalize();
      thread.position.add(dir.multiplyScalar(0.01));
      
      root.add(thread);
    }
  }

  for (const [i1, i2] of edgeConnections) {
    const p1 = new THREE.Vector3(...edgePoints[i1]);
    const p2 = new THREE.Vector3(...edgePoints[i2]);
    addFrayedEdge(p1, p2);
  }

  // --- Surface Scratches (Geometry Decals) ---
  // Add a few shallow cylinders to represent deep scratches/gouges
  const scratchGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.15, 3);
  scratchGeom.rotateX(Math.PI / 2); // Lay flat

  const scratchData = [
    { x: 0.1, y: 0.1, z: 0.2, rot: 0.5 },
    { x: -0.1, y: -0.1, z: 0.3, rot: -0.2 },
    { x: 0.2, y: 0.0, z: -0.1, rot: 1.2 },
    { x: -0.2, y: 0.15, z: 0.0, rot: -0.8 },
  ];

  for (const s of scratchData) {
    const scratch = new THREE.Mesh(scratchGeom, threadMat); // Use thread color for light scratch
    scratch.position.set(s.x, s.y, s.z + depth/2 + 0.001); // On front face
    scratch.rotation.z = s.rot;
    // Push slightly above surface
    scratch.position.z += 0.002;
    root.add(scratch);
  }

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