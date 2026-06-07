export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const FRAME_SIZE = 1.0;
  const BEAM_THICKNESS = 0.12;
  const WIRE_RADIUS = 0.012;
  const INNER_HALF = (FRAME_SIZE - BEAM_THICKNESS) / 2; // 0.44
  const WIRE_ATTACH_OFFSET = BEAM_THICKNESS / 2;        // 0.06
  const WIRE_BOUND = INNER_HALF - WIRE_ATTACH_OFFSET;   // 0.38

  // --- Materials ---

  // Procedural Wood Texture
  function createWoodTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const baseR = 139, baseG = 90, baseB = 43; // #8B5A2B
    const darkR = 92, darkG = 58, darkB = 30;  // #5C3A1E

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (x + y * size) * 4;
        // Simple grain noise
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.05) * 20 + Math.sin(x * 0.5 + y * 0.2) * 10;
        const r = Math.max(0, Math.min(255, baseR + noise));
        const g = Math.max(0, Math.min(255, baseG + noise * 0.8));
        const b = Math.max(0, Math.min(255, baseB + noise * 0.6));
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }

  const woodMat = new THREE.MeshStandardMaterial({
    map: createWoodTexture(),
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Frame Construction ---
  // 12 Beams
  const beamGeomLong = new THREE.BoxGeometry(FRAME_SIZE, BEAM_THICKNESS, BEAM_THICKNESS);
  const beamGeomShort = new THREE.BoxGeometry(BEAM_THICKNESS, FRAME_SIZE, BEAM_THICKNESS); 
  // Actually, to avoid complex overlaps, let's just use one geometry and rotate/scale?
  // No, distinct geometries for X, Y, Z aligned beams is cleaner for UVs if needed, 
  // but BoxGeometry is symmetric enough. Let's use specific dimensions for clarity.
  
  const geomX = new THREE.BoxGeometry(FRAME_SIZE, BEAM_THICKNESS, BEAM_THICKNESS);
  const geomY = new THREE.BoxGeometry(BEAM_THICKNESS, FRAME_SIZE, BEAM_THICKNESS);
  const geomZ = new THREE.BoxGeometry(BEAM_THICKNESS, BEAM_THICKNESS, FRAME_SIZE);

  const beamPos = INNER_HALF;

  // 4 Vertical (Y)
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      const mesh = new THREE.Mesh(geomY, woodMat);
      mesh.position.set(x * beamPos, 0, z * beamPos);
      root.add(mesh);
    }
  }

  // 4 Horizontal X
  for (const y of [-1, 1]) {
    for (const z of [-1, 1]) {
      const mesh = new THREE.Mesh(geomX, woodMat);
      mesh.position.set(0, y * beamPos, z * beamPos);
      root.add(mesh);
    }
  }

  // 4 Horizontal Z
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      const mesh = new THREE.Mesh(geomZ, woodMat);
      mesh.position.set(x * beamPos, y * beamPos, 0);
      root.add(mesh);
    }
  }

  // --- Wire Bracing ---
  // 6 Faces, 2 wires each = 12 wires
  // Coordinates for wire endpoints are at ±WIRE_BOUND
  
  const corners = [
    new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND),
    new THREE.Vector3( WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND),
    new THREE.Vector3( WIRE_BOUND,  WIRE_BOUND, -WIRE_BOUND),
    new THREE.Vector3(-WIRE_BOUND,  WIRE_BOUND, -WIRE_BOUND),
    new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND,  WIRE_BOUND),
    new THREE.Vector3( WIRE_BOUND, -WIRE_BOUND,  WIRE_BOUND),
    new THREE.Vector3( WIRE_BOUND,  WIRE_BOUND,  WIRE_BOUND),
    new THREE.Vector3(-WIRE_BOUND,  WIRE_BOUND,  WIRE_BOUND),
  ];

  // Define faces by 4 corner indices (0-7)
  // Bottom (y-), Top (y+), Front (z+), Back (z-), Right (x+), Left (x-)
  // Mapping corners: 
  // 0:---1
  // |   |
  // 3---2  (Bottom face z-? No, let's just define pairs explicitly)
  
  const facePairs = [
    // Front (z = +WIRE_BOUND)
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, WIRE_BOUND)],
    [new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND)],
    // Back (z = -WIRE_BOUND)
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND)],
    [new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND)],
    // Top (y = +WIRE_BOUND)
    [new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, WIRE_BOUND)],
    [new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND)],
    // Bottom (y = -WIRE_BOUND)
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND)],
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND)],
    // Right (x = +WIRE_BOUND)
    [new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, WIRE_BOUND)],
    [new THREE.Vector3(WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND)],
    // Left (x = -WIRE_BOUND)
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, WIRE_BOUND), new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, -WIRE_BOUND)],
    [new THREE.Vector3(-WIRE_BOUND, -WIRE_BOUND, -WIRE_BOUND), new THREE.Vector3(-WIRE_BOUND, WIRE_BOUND, WIRE_BOUND)],
  ];

  const wireGeomCache = new Map();

  function getWireGeom(p1, p2) {
    const key = `${p1.x},${p1.y},${p1.z}-${p2.x},${p2.y},${p2.z}`;
    if (wireGeomCache.has(key)) return wireGeomCache.get(key);
    
    const curve = new THREE.LineCurve3(p1, p2);
    const geom = new THREE.TubeGeometry(curve, 1, WIRE_RADIUS, 6, false);
    wireGeomCache.set(key, geom);
    return geom;
  }

  for (const [p1, p2] of facePairs) {
    const geom = getWireGeom(p1, p2);
    const wire = new THREE.Mesh(geom, wireMat);
    root.add(wire);
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