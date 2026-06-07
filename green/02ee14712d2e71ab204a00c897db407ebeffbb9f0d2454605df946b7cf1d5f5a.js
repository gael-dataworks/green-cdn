export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo material: satin finish, wood-like roughness, no metalness.
  // We will apply a procedural texture to this.
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd4b87a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Dark interior for holes
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1510,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Binding material (dark wrap near the node)
  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0x3d2b1f,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Procedural Bamboo Texture ---
  // Generate a longitudinal grain texture to avoid a plastic look.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseR = 212, baseG = 184, baseB = 122; // #d4b87a
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      
      // Base color with slight vertical gradient variation
      let r = baseR + (Math.sin(x * 0.1) * 10);
      let g = baseG + (Math.sin(x * 0.1) * 8);
      let b = baseB + (Math.sin(x * 0.1) * 5);

      // Add vertical grain lines (deterministic pseudo-noise)
      // Use x-coordinate to determine "grain streaks"
      const grainPhase = (x * 17) % 20; 
      if (grainPhase < 2 || grainPhase > 18) {
        // Darker streak
        r *= 0.85; g *= 0.85; b *= 0.85;
      }
      
      // Add subtle speckles
      if ((x * y) % 53 === 0) {
        r *= 0.9; g *= 0.9; b *= 0.9;
      }

      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
      data[idx + 3] = 255;
    }
  }

  const bambooTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  bambooTexture.colorSpace = THREE.SRGBColorSpace;
  bambooTexture.wrapS = THREE.RepeatWrapping;
  bambooTexture.wrapT = THREE.RepeatWrapping;
  // Repeat along the length of the flute (mapped to cylinder height)
  bambooTexture.repeat.set(1, 4); 
  bambooTexture.needsUpdate = true;
  bambooMat.map = bambooTexture;

  // --- Dimensions ---
  const length = 1.2;
  const radius = 0.09;
  const wallThickness = 0.015;

  // --- Main Body ---
  // Cylinder lies along Y by default. We want it along Z.
  // Rotation X = -90 deg (or 90) puts Y axis along Z.
  const bodyGeom = new THREE.CylinderGeometry(radius, radius, length, 32);
  const body = new THREE.Mesh(bodyGeom, bambooMat);
  body.rotation.x = Math.PI / 2;
  root.add(body);

  // --- Nodes (Bamboo Joints) ---
  // Slightly raised rings at specific intervals
  const nodePositions = [-0.25, 0.35]; // Z positions relative to center
  const nodeWidth = 0.04;
  const nodeRadius = radius + 0.012;

  for (const z of nodePositions) {
    const nodeGeom = new THREE.CylinderGeometry(nodeRadius, nodeRadius, nodeWidth, 32);
    const node = new THREE.Mesh(nodeGeom, bambooMat);
    node.rotation.x = Math.PI / 2;
    node.position.z = z;
    // Slightly offset Y to sit on top? No, concentric is better for bamboo nodes usually, 
    // but image shows them as bulges. Concentric is fine.
    root.add(node);
  }

  // --- Binding (Dark wrap near the embouchure node) ---
  // Visible near the left node (negative Z)
  const bindZ = -0.25; 
  const bindGeom = new THREE.CylinderGeometry(radius + 0.002, radius + 0.002, 0.03, 32);
  const binding = new THREE.Mesh(bindGeom, bindingMat);
  binding.rotation.x = Math.PI / 2;
  binding.position.z = bindZ;
  root.add(binding);

  // --- Holes ---
  // Helper to create a hole with depth
  function createHole(zPos, holeRadius, isEmbouchure = false) {
    const holeGroup = new THREE.Group();
    
    // 1. The visible hole opening (slightly inset dark disc)
    const holeCapGeom = new THREE.CircleGeometry(holeRadius, 16);
    const holeCap = new THREE.Mesh(holeCapGeom, holeMat);
    // Position on the surface (Y = radius)
    holeCap.position.set(0, radius - 0.002, 0); 
    holeCap.rotation.x = -Math.PI / 2; // Face up
    holeGroup.add(holeCap);

    // 2. The inner wall (simulated depth)
    // A small cylinder going down into the flute
    const depth = 0.04;
    const innerGeom = new THREE.CylinderGeometry(holeRadius * 0.95, holeRadius * 0.85, depth, 16);
    const innerWall = new THREE.Mesh(innerGeom, holeMat);
    // Position slightly below surface
    innerWall.position.set(0, radius - (depth * 0.5), 0);
    innerWall.rotation.x = -Math.PI / 2;
    holeGroup.add(innerWall);

    holeGroup.position.z = zPos;
    root.add(holeGroup);
  }

  // Embouchure hole (large, near left end)
  createHole(-0.45, 0.018, true);

  // Finger holes (smaller, distributed along the body)
  // Approximate positions based on standard flute spacing relative to nodes
  const fingerHoleZs = [-0.10, -0.04, 0.02, 0.15, 0.21, 0.27];
  for (const z of fingerHoleZs) {
    createHole(z, 0.009);
  }

  // --- End Caps / Interior hint ---
  // The ends are open. We can see darkness inside.
  // Add dark discs at the very ends to simulate the open tube interior.
  const endCapGeom = new THREE.CircleGeometry(radius - wallThickness, 32);
  const leftEnd = new THREE.Mesh(endCapGeom, holeMat);
  leftEnd.rotation.x = Math.PI / 2; // Face +Z
  leftEnd.position.z = -length / 2 + 0.001;
  root.add(leftEnd);

  const rightEnd = new THREE.Mesh(endCapGeom, holeMat);
  rightEnd.rotation.x = -Math.PI / 2; // Face -Z
  rightEnd.position.z = length / 2 - 0.001;
  root.add(rightEnd);

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