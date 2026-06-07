export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Steel/Metal for rim, mesh, and hooks
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Wood for handle
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb386,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Darker metal for the bracket holding the handle
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.5,
    roughness: 0.3,
  });

  // --- Helpers ---

  // Procedural grid texture for the mesh bowl
  function createMeshTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const gridColor = [180, 180, 190]; // Light steel gray
    const lineColor = [100, 100, 110]; // Darker grid lines
    const spacing = 8; // Grid frequency
    const lineWidth = 1;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const isLine = (x % spacing < lineWidth) || (y % spacing < lineWidth);
        const color = isLine ? lineColor : gridColor;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat texture to make grid fine enough on the bowl
    texture.repeat.set(20, 10); 
    return texture;
  }

  const meshTexture = createMeshTexture();
  const meshMat = new THREE.MeshStandardMaterial({
    map: meshTexture,
    color: 0xffffff, // White base to let texture color show
    metalness: 0.3,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const bowlRadius = 0.35;
  const rimRadius = bowlRadius + 0.025; // Outer edge of rim
  const rimThickness = 0.015;
  const handleLength = 0.45;
  const hookOffset = 0.15;

  // --- 1. Mesh Bowl ---
  // Profile for a hemisphere/bowl shape
  const profilePoints = [];
  const segments = 32;
  // Start at bottom center
  profilePoints.push(new THREE.Vector2(0, 0));
  // Curve out to radius
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI / 2; // 0 to 90 degrees
    const r = Math.sin(angle) * bowlRadius;
    const y = -Math.cos(angle) * bowlRadius; // Negative Y for bowl hanging down
    profilePoints.push(new THREE.Vector2(r, y));
  }
  // Add a small lip at the top for connection
  profilePoints.push(new THREE.Vector2(bowlRadius, 0));
  
  const bowlGeom = new THREE.LatheGeometry(profilePoints, 64);
  const meshBowl = new THREE.Mesh(bowlGeom, meshMat);
  root.add(meshBowl);

  // --- 2. Metal Rim ---
  // Torus for the top rim
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimThickness, 32, 64);
  const rim = new THREE.Mesh(rimGeom, steelMat);
  rim.rotation.x = Math.PI / 2; // Lay flat in XZ
  rim.position.y = 0;
  root.add(rim);

  // Inner ring to hide the mesh edge under the rim
  const innerRimGeom = new THREE.TorusGeometry(bowlRadius - 0.005, 0.005, 16, 64);
  const innerRim = new THREE.Mesh(innerRimGeom, steelMat);
  innerRim.rotation.x = Math.PI / 2;
  innerRim.position.y = 0.005;
  root.add(innerRim);

  // --- 3. Handle ---
  // Handle shape: Tapered cylinder with a rounded end and a hole
  const handleGroup = new THREE.Group();
  
  // Main handle body
  const handleShape = new THREE.Shape();
  // Draw profile in XY plane, will extrude along Z (which we will rotate)
  // Actually, let's use Lathe for a rounded handle profile rotated around X axis?
  // Easier: CylinderGeometry with taper, rotated.
  
  const handleGeom = new THREE.CylinderGeometry(0.035, 0.055, handleLength, 32);
  const handleMesh = new THREE.Mesh(handleGeom, woodMat);
  // Cylinder is Y-up, we want it along X
  handleMesh.rotation.z = Math.PI / 2;
  // Position so left end is near rim, right end is free
  handleMesh.position.x = rimRadius + handleLength / 2;
  handleGroup.add(handleMesh);

  // Handle end cap (rounded)
  const handleCapGeom = new THREE.SphereGeometry(0.055, 32, 16);
  const handleCap = new THREE.Mesh(handleCapGeom, woodMat);
  handleCap.position.x = rimRadius + handleLength;
  handleCap.scale.set(0.4, 1, 1); // Flatten slightly
  handleGroup.add(handleCap);

  // Handle hole (visual only - a dark torus or cylinder)
  const holeGeom = new THREE.TorusGeometry(0.025, 0.008, 16, 32);
  const holeMesh = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
  holeMesh.rotation.y = Math.PI / 2;
  holeMesh.position.x = rimRadius + handleLength - 0.04;
  handleGroup.add(holeMesh);

  // --- 4. Handle Bracket ---
  // Connects handle to rim
  const bracketGeom = new THREE.BoxGeometry(0.08, 0.04, 0.06);
  const bracket = new THREE.Mesh(bracketGeom, bracketMat);
  bracket.position.x = rimRadius + 0.04;
  // Angle it slightly to match handle taper
  bracket.rotation.z = -0.1; 
  root.add(bracket);

  // Add handle group to root (after bracket so bracket is under handle visually if needed, 
  // but here they are separate. Let's add handle to root directly to manage position better)
  root.add(handleGroup);

  // --- 5. Support Hooks ---
  // Two J-shaped hooks on the left side (negative X)
  function createHook(side) {
    const points = [];
    const startX = -rimRadius;
    const startY = 0;
    const startZ = side * 0.15; // Offset from center line

    // Start at rim
    points.push(new THREE.Vector3(startX, startY, startZ));
    // Extend out
    points.push(new THREE.Vector3(startX - 0.1, startY, startZ));
    // Curve down
    points.push(new THREE.Vector3(startX - 0.15, -0.15, startZ));
    // Hook back up
    points.push(new THREE.Vector3(startX - 0.12, -0.18, startZ));

    const curve = new THREE.CatmullRomCurve3(points);
    const hookGeom = new THREE.TubeGeometry(curve, 20, 0.008, 12, false);
    const hook = new THREE.Mesh(hookGeom, steelMat);
    root.add(hook);
  }

  createHook(1);  // Right hook (positive Z)
  createHook(-1); // Left hook (negative Z)

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