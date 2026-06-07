export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Metal: Silver/Steel. High metalness, low roughness, bright emissive to avoid darkness.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd6dadf,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd6dadf,
    emissiveIntensity: 0.3
  });

  // Wood: Light tan, matte.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.6
  });

  // --- Helper: Procedural Mesh Grid Texture ---
  function createMeshTexture() {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const lineColor = [180, 180, 180]; // Light gray metal lines
    const bgColor = [200, 200, 200, 0]; // Transparent background (alpha 0)
    
    // We want a grid. Let's draw lines every 4 pixels.
    const step = 4;
    const lineWidth = 1;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Check if we are on a grid line
        const isLineX = (x % step) < lineWidth;
        const isLineY = (y % step) < lineWidth;
        
        if (isLineX || isLineY) {
          data[idx] = lineColor[0];
          data[idx + 1] = lineColor[1];
          data[idx + 2] = lineColor[2];
          data[idx + 3] = 255; // Opaque line
        } else {
          data[idx] = 220;
          data[idx + 1] = 220;
          data[idx + 2] = 220;
          data[idx + 3] = 50; // Slightly transparent background to simulate holes
        }
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat enough times to look fine on the sphere
    texture.repeat.set(10, 10); 
    return texture;
  }

  const meshTexture = createMeshTexture();
  const meshMat = new THREE.MeshStandardMaterial({
    map: meshTexture,
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });

  // --- 1. Mesh Bowl ---
  // Hemisphere. SphereGeometry with phiLength Math.PI covers half sphere.
  // Default sphere is centered at 0,0,0. We want the open top at y=0.
  // So we use radius 0.35, and rotate it so the flat side is up? 
  // Standard Sphere: poles at Y. phiLength=Math.PI gives a half-sphere from pole to equator.
  // We want the "bowl" shape, so the pole is at the bottom (-Y).
  const bowlRadius = 0.35;
  const bowlGeom = new THREE.SphereGeometry(bowlRadius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  // This creates the top half (y > 0). We need to flip it or move it.
  // Let's just scale Y by -1 to make it a bowl opening up.
  const meshBowl = new THREE.Mesh(bowlGeom, meshMat);
  meshBowl.scale.set(1, -1, 1); 
  // Now the flat open part is at y=0, curved part goes down to y=-0.35.
  root.add(meshBowl);

  // --- 2. Rim ---
  // Torus around the top edge (y=0).
  const rimRadius = bowlRadius;
  const rimTube = 0.018;
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 64);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  // Torus is in XY plane by default. We need it in XZ plane (flat on top).
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0;
  root.add(rim);

  // --- 3. Wooden Reinforcement Band ---
  // Around the lower part of the bowl.
  const bandY = -0.18;
  const bandRadius = 0.32; // Slightly smaller than rim
  const bandGeom = new THREE.TorusGeometry(bandRadius, 0.015, 16, 64);
  const band = new THREE.Mesh(bandGeom, woodMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = bandY;
  root.add(band);

  // --- 4. Handle ---
  // Flat tapered shape with a hole.
  const handleShape = new THREE.Shape();
  const hLen = 0.45;
  const hStartW = 0.06;
  const hEndW = 0.04;
  
  // Start at rim connection (x=0)
  handleShape.moveTo(0, -hStartW / 2);
  // Taper out
  handleShape.lineTo(hLen * 0.2, -hEndW / 2);
  handleShape.lineTo(hLen, -hEndW / 2);
  // Rounded end
  handleShape.absarc(hLen, 0, hEndW / 2, -Math.PI / 2, Math.PI / 2, false);
  handleShape.lineTo(hLen * 0.2, hEndW / 2);
  handleShape.lineTo(0, hStartW / 2);
  handleShape.lineTo(0, -hStartW / 2);

  // Hole
  const holePath = new THREE.Path();
  const holeX = hLen * 0.85;
  const holeR = 0.012;
  holePath.absarc(holeX, 0, holeR, 0, Math.PI * 2, true);
  handleShape.holes.push(holePath);

  const handleExtrudeSettings = {
    steps: 1,
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  };

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, handleExtrudeSettings);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Extrude is along Z. We want it along X.
  // Also need to position it so it connects to the rim at x=rimRadius.
  // The shape starts at x=0. So we place the mesh at x=rimRadius.
  handle.position.set(rimRadius, 0.02, 0); // Slightly above rim center
  handle.rotation.z = -0.1; // Slight upward angle
  root.add(handle);

  // --- 5. Hooks / Rests ---
  // Two metal hooks on the opposite side (x = -rimRadius).
  // They extend left, then curve down.
  function createHook(offsetZ) {
    const points = [];
    const startX = -rimRadius;
    const startY = 0.02;
    const startZ = offsetZ;
    
    // Extend out
    points.push(new THREE.Vector3(startX, startY, startZ));
    points.push(new THREE.Vector3(startX - 0.08, startY, startZ));
    // Curve down
    points.push(new THREE.Vector3(startX - 0.12, startY - 0.05, startZ));
    // Hook back slightly
    points.push(new THREE.Vector3(startX - 0.12, startY - 0.08, startZ));

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.006, 8, false);
    const hook = new THREE.Mesh(tubeGeom, metalMat);
    root.add(hook);
  }

  // Two hooks, spaced apart on the Z axis
  createHook(0.06);
  createHook(-0.06);

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