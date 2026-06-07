export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver/White Metal: color #c0c0c0, metalness 0.5, roughness 0.25
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Wood (polished/satin): color #e3c08d, metalness 0.0, roughness 0.6
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c08d,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Mesh Material: Silver but with a grid texture for transparency
  const meshTexture = createMeshTexture(THREE);
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.5,
    roughness: 0.4,
    map: meshTexture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const rimRadius = 0.25;
  const rimTube = 0.018;
  const bowlDepth = 0.14;
  const handleLength = 0.35;
  const handleWidth = 0.07;
  const handleThickness = 0.025;

  // --- 1. Rim ---
  // Torus lies in XY plane by default. We want it in XZ plane (flat on ground relative to bowl opening).
  // Actually, standard Torus is in XY. If we want the opening facing +Y (up), we rotate X by 90 deg.
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 64);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0; // Rim sits at y=0
  root.add(rim);

  // --- 2. Bowl (Mesh) ---
  // Hemisphere. SphereGeometry with phiLength Math.PI (half sphere).
  // Default sphere is centered at 0,0,0. We want the open top at y=0, bottom at y=-depth.
  const bowlGeom = new THREE.SphereGeometry(rimRadius - 0.02, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const bowl = new THREE.Mesh(bowlGeom, meshMat);
  // Scale Y to make it a shallow bowl, not a deep hemisphere
  bowl.scale.set(1, bowlDepth / (rimRadius - 0.02), 1);
  bowl.position.y = -bowlDepth / 2; // Center it so top edge is near 0
  // Ensure the mesh normals face outwards correctly for DoubleSide
  root.add(bowl);

  // --- 3. Lower Reinforcement Ring (Wood) ---
  // A wooden band around the lower part of the bowl
  const lowerRingRadius = (rimRadius - 0.02) * 0.6; // Approx 60% down the slope
  const lowerRingY = -bowlDepth * 0.6;
  const lowerRingGeom = new THREE.TorusGeometry(lowerRingRadius, 0.012, 16, 64);
  const lowerRing = new THREE.Mesh(lowerRingGeom, woodMat);
  lowerRing.rotation.x = Math.PI / 2;
  lowerRing.position.y = lowerRingY;
  root.add(lowerRing);

  // --- 4. Handle ---
  // Flat tapered box.
  const handleGeom = new THREE.BoxGeometry(handleLength, handleThickness, handleWidth);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position: attached to the right side of the rim (positive X)
  handle.position.set(rimRadius + handleLength / 2, 0, 0);
  root.add(handle);

  // Handle Hole (at the far end)
  // Small dark torus to simulate the hole
  const holeGeom = new THREE.TorusGeometry(0.012, 0.004, 8, 16);
  const hole = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.0, roughness: 0.8 }));
  hole.rotation.y = Math.PI / 2; // Face outward along X
  hole.position.set(rimRadius + handleLength - 0.02, 0, 0);
  root.add(hole);

  // Handle Bracket (Metal connector between wood and rim)
  const bracketGeom = new THREE.BoxGeometry(0.04, 0.03, handleWidth + 0.01);
  const bracket = new THREE.Mesh(bracketGeom, metalMat);
  bracket.position.set(rimRadius + 0.02, 0, 0);
  root.add(bracket);

  // --- 5. Hooks (Rests) ---
  // Two hooks on the left side (negative X)
  // Curve: Start at rim, go left, curve down, hook in slightly.
  function createHook(sideZ) {
    const points = [
      new THREE.Vector3(-rimRadius, 0, sideZ),          // Start at rim edge
      new THREE.Vector3(-rimRadius - 0.08, 0, sideZ),   // Extend out
      new THREE.Vector3(-rimRadius - 0.08, -0.06, sideZ), // Curve down
      new THREE.Vector3(-rimRadius - 0.05, -0.06, sideZ), // Hook in
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const hookGeom = new THREE.TubeGeometry(curve, 16, 0.006, 8, false);
    const hook = new THREE.Mesh(hookGeom, metalMat);
    root.add(hook);
  }

  // Hooks are positioned slightly offset in Z from the center line to attach to the rim
  const hookOffsetZ = 0.04;
  createHook(hookOffsetZ);
  createHook(-hookOffsetZ);

  // --- Helper: Procedural Mesh Texture ---
  function createMeshTexture(THREE) {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const color = 180; // Grayish
    const alpha = 255;
    const bgAlpha = 0; // Transparent background

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = (y * size + x) * 4;
        // Draw a grid: lines every 4 pixels
        const isLine = (x % 4 === 0) || (y % 4 === 0);
        
        if (isLine) {
          data[index] = color;
          data[index + 1] = color;
          data[index + 2] = color;
          data[index + 3] = alpha;
        } else {
          data[index] = color;
          data[index + 1] = color;
          data[index + 2] = color;
          data[index + 3] = 40; // Slight transparency for the holes
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat the grid enough times to look fine on the bowl
    texture.repeat.set(32, 16); 
    return texture;
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