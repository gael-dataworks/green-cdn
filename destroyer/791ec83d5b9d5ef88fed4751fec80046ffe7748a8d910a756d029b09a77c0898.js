export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const frameSize = 0.55;       // Outer dimension of the cube
  const beamThick = 0.045;      // Thickness of wooden beams
  const wireRadius = 0.0025;    // Thickness of metal wires
  const innerOffset = frameSize / 2 - beamThick; // Inner boundary for wires

  // --- Materials ---
  // Wood: Oak-like, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xB58856,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Wire: Silver metal, shiny
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometries ---
  // Beam geometry: Long box, we will scale/rotate as needed
  // Using a standard length and scaling is efficient
  const beamGeom = new THREE.BoxGeometry(beamThick, frameSize, beamThick);
  
  // Wire geometry: We will create specific cylinders for each wire to get exact length/rotation
  // Or use a generic one and scale. Let's use a generic long one and scale.
  const wireGeomBase = new THREE.CylinderGeometry(wireRadius, wireRadius, 1, 8);
  // Shift geometry so scaling happens from center correctly (default is centered)
  // CylinderGeometry is centered at 0,0,0 with height along Y.

  // --- Helper: Add Beam ---
  function addBeam(x, y, z, rotX, rotY, rotZ) {
    const mesh = new THREE.Mesh(beamGeom, woodMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, rotZ);
    root.add(mesh);
  }

  // --- Helper: Add Wire between two points ---
  function addWire(p1, p2) {
    const dist = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
    
    const mesh = new THREE.Mesh(wireGeomBase, wireMat);
    mesh.position.copy(mid);
    mesh.scale.set(1, dist, 1); // Scale Y (height) to match distance
    mesh.lookAt(p2); // Align Y axis to direction
    root.add(mesh);
  }

  // --- Build Frame (12 Beams) ---
  // We position beams at the edges of the cube defined by frameSize
  // Coordinate system: Center at 0,0,0. Bounds at ±frameSize/2.
  const halfS = frameSize / 2;
  const halfT = beamThick / 2;

  // 1. Vertical Beams (4) - Aligned Y
  // Positions at corners of the XZ plane
  const vPos = halfS - halfT;
  addBeam( vPos, 0,  vPos, 0, 0, 0);
  addBeam(-vPos, 0,  vPos, 0, 0, 0);
  addBeam( vPos, 0, -vPos, 0, 0, 0);
  addBeam(-vPos, 0, -vPos, 0, 0, 0);

  // 2. Horizontal X Beams (4) - Aligned X (Rotate Z by 90)
  // Positions at corners of the YZ plane
  // Wait, if we rotate Box(Thick, Size, Thick) by Z=90, it becomes (Thick, Thick, Size) along X?
  // Original: W=Thick, H=Size, D=Thick. Y is up.
  // Rotate Z 90: X becomes Y, Y becomes -X. So Height (Y) becomes Width (-X).
  // We want length along X. So we need the 'Size' dimension to be along X.
  // Original Y is Size. Rotate Z 90 -> Y becomes -X. So Length is along -X. Correct.
  const hPos = halfS - halfT;
  // Top Front, Top Back, Bottom Front, Bottom Back
  addBeam(0,  hPos,  vPos, 0, 0, Math.PI / 2);
  addBeam(0,  hPos, -vPos, 0, 0, Math.PI / 2);
  addBeam(0, -hPos,  vPos, 0, 0, Math.PI / 2);
  addBeam(0, -hPos, -vPos, 0, 0, Math.PI / 2);

  // 3. Horizontal Z Beams (4) - Aligned Z (Rotate X by 90)
  // Original Y is Size. Rotate X 90 -> Y becomes Z. Length along Z.
  // Positions at corners of XY plane
  addBeam( vPos,  hPos, 0, Math.PI / 2, 0, 0);
  addBeam(-vPos,  hPos, 0, Math.PI / 2, 0, 0);
  addBeam( vPos, -hPos, 0, Math.PI / 2, 0, 0);
  addBeam(-vPos, -hPos, 0, Math.PI / 2, 0, 0);

  // --- Build Wires (12 Wires, 2 per face) ---
  // Wires connect the INNER corners of the frame.
  // Inner boundary is at ±innerOffset
  const h = innerOffset;
  
  // Define corners for reference
  // Front Face (z = h)
  const f_tl = new THREE.Vector3(-h,  h, h);
  const f_tr = new THREE.Vector3( h,  h, h);
  const f_bl = new THREE.Vector3(-h, -h, h);
  const f_br = new THREE.Vector3( h, -h, h);
  addWire(f_tl, f_br);
  addWire(f_tr, f_bl);

  // Back Face (z = -h)
  const b_tl = new THREE.Vector3(-h,  h, -h);
  const b_tr = new THREE.Vector3( h,  h, -h);
  const b_bl = new THREE.Vector3(-h, -h, -h);
  const b_br = new THREE.Vector3( h, -h, -h);
  addWire(b_tl, b_br);
  addWire(b_tr, b_bl);

  // Right Face (x = h)
  const r_tl = new THREE.Vector3(h,  h, -h); // Top Left relative to face normal
  const r_tr = new THREE.Vector3(h,  h,  h);
  const r_bl = new THREE.Vector3(h, -h, -h);
  const r_br = new THREE.Vector3(h, -h,  h);
  addWire(r_tl, r_br);
  addWire(r_tr, r_bl);

  // Left Face (x = -h)
  const l_tl = new THREE.Vector3(-h,  h,  h);
  const l_tr = new THREE.Vector3(-h,  h, -h);
  const l_bl = new THREE.Vector3(-h, -h,  h);
  const l_br = new THREE.Vector3(-h, -h, -h);
  addWire(l_tl, l_br);
  addWire(l_tr, l_bl);

  // Top Face (y = h)
  const t_tl = new THREE.Vector3(-h, h, -h);
  const t_tr = new THREE.Vector3( h, h, -h);
  const t_bl = new THREE.Vector3(-h, h,  h);
  const t_br = new THREE.Vector3( h, h,  h);
  addWire(t_tl, t_br);
  addWire(t_tr, t_bl);

  // Bottom Face (y = -h)
  const bot_tl = new THREE.Vector3(-h, -h,  h);
  const bot_tr = new THREE.Vector3( h, -h,  h);
  const bot_bl = new THREE.Vector3(-h, -h, -h);
  const bot_br = new THREE.Vector3( h, -h, -h);
  addWire(bot_tl, bot_br);
  addWire(bot_tr, bot_bl);

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