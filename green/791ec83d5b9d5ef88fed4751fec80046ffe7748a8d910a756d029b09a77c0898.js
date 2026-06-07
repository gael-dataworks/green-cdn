export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9C6635,
    metalness: 0.0,
    roughness: 0.7,
  });

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Dimensions
  const size = 1.0;
  const halfSize = size / 2;
  const beamThick = 0.12;
  const wireRadius = 0.015;

  // Geometries
  // We can reuse one box geometry for all beams if we scale/position, 
  // but creating specific ones or scaling meshes is fine. 
  // Let's create one base box and clone/scale meshes for efficiency.
  const baseBeamGeom = new THREE.BoxGeometry(1, 1, 1);

  // Helper to add a beam
  function addBeam(x, y, z, sx, sy, sz) {
    const mesh = new THREE.Mesh(baseBeamGeom, woodMat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
  }

  // 1. Wooden Frame Construction
  // Vertical Posts (4)
  // Positioned at corners of the XZ plane, full height Y
  const corners = [
    [ -halfSize, halfSize ],
    [  halfSize, halfSize ],
    [ -halfSize, -halfSize ],
    [  halfSize, -halfSize ]
  ];
  
  for (const [cx, cz] of corners) {
    addBeam(cx, 0, cz, beamThick, size, beamThick);
  }

  // Top & Bottom Rails along X (4)
  // Connect left and right posts at top and bottom, front and back
  const zPositions = [ -halfSize, halfSize ];
  const yPositions = [ -halfSize, halfSize ];
  
  for (const z of zPositions) {
    for (const y of yPositions) {
      // Beam spans X from -half to half. Length = size.
      // Center is at x=0.
      addBeam(0, y, z, size, beamThick, beamThick);
    }
  }

  // Top & Bottom Rails along Z (4)
  // Connect front and back posts at top and bottom, left and right
  const xPositions = [ -halfSize, halfSize ];
  
  for (const x of xPositions) {
    for (const y of yPositions) {
      // Beam spans Z from -half to half. Length = size.
      // Center is at z=0.
      addBeam(x, y, 0, beamThick, beamThick, size);
    }
  }

  // 2. Wire Bracing
  // Use TubeGeometry with LineCurve3 for precise diagonal placement
  const diagonalLen = Math.sqrt(size * size + size * size);
  
  function addWire(p1, p2) {
    const curve = new THREE.LineCurve3(p1, p2);
    const geom = new THREE.TubeGeometry(curve, 1, wireRadius, 8, false);
    const mesh = new THREE.Mesh(geom, wireMat);
    root.add(mesh);
  }

  // Define face centers and corners for bracing
  // Front Face (z = halfSize)
  const f_tl = new THREE.Vector3(-halfSize, halfSize, halfSize);
  const f_tr = new THREE.Vector3( halfSize, halfSize, halfSize);
  const f_bl = new THREE.Vector3(-halfSize, -halfSize, halfSize);
  const f_br = new THREE.Vector3( halfSize, -halfSize, halfSize);
  addWire(f_tl, f_br);
  addWire(f_tr, f_bl);

  // Back Face (z = -halfSize)
  const b_tl = new THREE.Vector3(-halfSize, halfSize, -halfSize);
  const b_tr = new THREE.Vector3( halfSize, halfSize, -halfSize);
  const b_bl = new THREE.Vector3(-halfSize, -halfSize, -halfSize);
  const b_br = new THREE.Vector3( halfSize, -halfSize, -halfSize);
  addWire(b_tl, b_br);
  addWire(b_tr, b_bl);

  // Left Face (x = -halfSize)
  const l_tb = new THREE.Vector3(-halfSize, halfSize, -halfSize); // top-back
  const l_tf = new THREE.Vector3(-halfSize, halfSize,  halfSize); // top-front
  const l_bb = new THREE.Vector3(-halfSize, -halfSize, -halfSize); // bot-back
  const l_bf = new THREE.Vector3(-halfSize, -halfSize,  halfSize); // bot-front
  addWire(l_tb, l_bf);
  addWire(l_tf, l_bb);

  // Right Face (x = halfSize)
  const r_tb = new THREE.Vector3( halfSize, halfSize, -halfSize);
  const r_tf = new THREE.Vector3( halfSize, halfSize,  halfSize);
  const r_bb = new THREE.Vector3( halfSize, -halfSize, -halfSize);
  const r_bf = new THREE.Vector3( halfSize, -halfSize,  halfSize);
  addWire(r_tb, r_bf);
  addWire(r_tf, r_bb);

  // Top Face (y = halfSize)
  const t_lb = new THREE.Vector3(-halfSize, halfSize, -halfSize); // left-back
  const t_rf = new THREE.Vector3( halfSize, halfSize,  halfSize); // right-front
  const t_rb = new THREE.Vector3( halfSize, halfSize, -halfSize); // right-back
  const t_lf = new THREE.Vector3(-halfSize, halfSize,  halfSize); // left-front
  addWire(t_lb, t_rf);
  addWire(t_rb, t_lf);

  // Bottom Face (y = -halfSize)
  const bot_lb = new THREE.Vector3(-halfSize, -halfSize, -halfSize);
  const bot_rf = new THREE.Vector3( halfSize, -halfSize,  halfSize);
  const bot_rb = new THREE.Vector3( halfSize, -halfSize, -halfSize);
  const bot_lf = new THREE.Vector3(-halfSize, -halfSize,  halfSize);
  addWire(bot_lb, bot_rf);
  addWire(bot_rb, bot_lf);

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