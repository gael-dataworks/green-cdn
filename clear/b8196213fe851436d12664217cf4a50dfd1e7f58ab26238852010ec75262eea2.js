export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Copper material: reddish-brown metal, slightly worn.
  // Metalness capped at 0.6 per rules to avoid black reflection without envMap.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Wood material: Light tan, matte.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a472,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Dark material for holes/slots.
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Wood Texture ---
  // Generate a grain texture for the handle to make it look like real wood.
  const texSize = 256;
  const woodData = new Uint8Array(texSize * texSize * 4);
  const baseR = 196, baseG = 164, baseB = 114; // #c4a472

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      
      // Base noise
      let noise = (Math.sin(x * 0.1) + Math.cos(y * 0.05)) * 10;
      
      // Grain lines (vertical in UV space, which maps to length of cylinder)
      // We want grain running along the Y axis of the cylinder (which is V in UV usually for cylindrical mapping)
      // But for a cylinder standing up, UVs wrap around. Let's just make streaky noise.
      const grain = Math.sin(x * 0.2 + y * 0.02) * 15;
      
      let r = baseR + noise + grain;
      let g = baseG + noise + grain;
      let b = baseB + noise + grain;

      // Clamp
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      woodData[idx] = r;
      woodData[idx + 1] = g;
      woodData[idx + 2] = b;
      woodData[idx + 3] = 255;
    }
  }

  const woodTexture = new THREE.DataTexture(woodData, texSize, texSize, THREE.RGBAFormat);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1, 4); // Repeat grain along the length
  woodTexture.needsUpdate = true;
  woodMat.map = woodTexture;

  // --- Dimensions ---
  const handleRadius = 0.045;
  const handleLength = 0.45;
  const headLength = 0.18;
  const socketRadius = 0.055;
  const neckRadius = 0.038;
  const spikeBaseRadius = 0.035;

  // --- Handle ---
  // Wooden cylinder.
  const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 24);
  // Rotate to align with Y axis (default is Y-up, so no rotation needed if we build upright)
  // But let's position it so the top is at y=0 for the head to sit on.
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = -handleLength / 2;
  root.add(handle);

  // --- Copper Head Group ---
  const headGroup = new THREE.Group();
  root.add(headGroup);

  // 1. Main Body (Neck + Socket) via Lathe
  // Profile from bottom (socket end) to top (neck end)
  // We build it upwards from the handle connection.
  const bodyProfile = [
    new THREE.Vector2(socketRadius, 0.0),          // Socket bottom rim outer
    new THREE.Vector2(socketRadius, 0.06),         // Socket cylinder
    new THREE.Vector2(neckRadius, 0.06),           // Step down to neck
    new THREE.Vector2(neckRadius, 0.12),           // Neck top
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  // Shift geometry so bottom is at y=0
  bodyGeom.translate(0, 0, 0); 
  const body = new THREE.Mesh(bodyGeom, copperMat);
  headGroup.add(body);

  // 2. Socket Interior (Dark hole)
  // A cylinder inside the socket to show depth.
  const socketDepthGeom = new THREE.CylinderGeometry(socketRadius - 0.004, socketRadius - 0.004, 0.05, 24);
  const socketDepth = new THREE.Mesh(socketDepthGeom, darkMat);
  socketDepth.position.y = 0.025; // Halfway into the socket
  headGroup.add(socketDepth);

  // 3. Socket Rim Thickness
  // A ring at the very bottom to show the metal has thickness.
  const rimGeom = new THREE.TorusGeometry(socketRadius - 0.002, 0.002, 8, 32);
  const rim = new THREE.Mesh(rimGeom, copperMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.0;
  headGroup.add(rim);

  // 4. Spike (Cone)
  // Tapered cone sitting on top of the neck.
  const spikeHeight = 0.08;
  const spikeGeom = new THREE.ConeGeometry(spikeBaseRadius, spikeHeight, 32);
  const spike = new THREE.Mesh(spikeGeom, copperMat);
  spike.position.y = 0.12 + spikeHeight / 2;
  headGroup.add(spike);

  // 5. Ridges on Spike
  // 3 Torus rings scaled to fit the cone taper.
  const ridgePositions = [0.16, 0.18, 0.20]; // Approximate Y positions on the spike
  ridgePositions.forEach((ry, i) => {
    // Calculate radius at this height on the cone
    // Cone base is at 0.12, tip at 0.20.
    // t = (ry - 0.12) / 0.08
    const t = (ry - 0.12) / spikeHeight;
    const r = spikeBaseRadius * (1 - t);
    
    const ridgeGeom = new THREE.TorusGeometry(r, 0.003, 8, 24);
    const ridge = new THREE.Mesh(ridgeGeom, copperMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = ry;
    headGroup.add(ridge);
  });

  // 6. Side Hole on Neck
  // Small dark cylinder drilled into the side of the neck.
  const holeGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.015, 8);
  const sideHole = new THREE.Mesh(holeGeom, darkMat);
  sideHole.rotation.z = Math.PI / 2;
  sideHole.position.set(neckRadius - 0.002, 0.09, 0); // On the side
  headGroup.add(sideHole);

  // 7. Socket Slot (The split in the copper ferrule)
  // A thin dark box cutting through the socket wall.
  const slotGeom = new THREE.BoxGeometry(0.003, 0.05, socketRadius * 1.5);
  const slot = new THREE.Mesh(slotGeom, darkMat);
  slot.position.set(0, 0.025, 0); // Center of socket
  // Rotate to align with Z axis (cutting through X)
  slot.rotation.y = Math.PI / 2; 
  // Push it slightly forward so it's visible on the "front" face
  slot.position.z = socketRadius * 0.8;
  headGroup.add(slot);
  
  // Add a second slot part on the back to complete the cut-through look
  const slotBack = slot.clone();
  slotBack.position.z = -socketRadius * 0.8;
  headGroup.add(slotBack);


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