export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Medium brown, satin finish, non-metallic
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Wire: Silver metal, slightly rougher than chrome to look like tensioned wire
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Geometry Reuse ---
  // Beam dimensions: Length 1.0 to span the cube, cross-section 0.1 x 0.1
  const beamGeom = new THREE.BoxGeometry(1.0, 0.1, 0.1);
  const beamGeomY = new THREE.BoxGeometry(0.1, 1.0, 0.1);
  const beamGeomZ = new THREE.BoxGeometry(0.1, 0.1, 1.0);

  // --- Helpers ---
  function addBeam(name, geom, mat, x, y, z, rotX, rotY, rotZ) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, rotZ);
    root.add(mesh);
    return mesh;
  }

  function addWire(name, start, end) {
    const curve = new THREE.LineCurve3(start, end);
    const geom = new THREE.TubeGeometry(curve, 4, 0.008, 8, false);
    const mesh = new THREE.Mesh(geom, wireMat);
    mesh.name = name;
    root.add(mesh);
    return mesh;
  }

  // --- Cube Frame Construction ---
  // Outer bounds: -0.5 to 0.5 on all axes.
  // Beams are centered on the edges.

  // 1. Beams along X axis (Top/Bottom, Front/Back)
  // Top Front
  addBeam('beam_top_front', beamGeom, woodMat, 0, 0.5, 0.5, 0, 0, 0);
  // Top Back
  addBeam('beam_top_back', beamGeom, woodMat, 0, 0.5, -0.5, 0, 0, 0);
  // Bottom Front
  addBeam('beam_bottom_front', beamGeom, woodMat, 0, -0.5, 0.5, 0, 0, 0);
  // Bottom Back
  addBeam('beam_bottom_back', beamGeom, woodMat, 0, -0.5, -0.5, 0, 0, 0);

  // 2. Beams along Y axis (Left/Right, Front/Back)
  // Front Left
  addBeam('beam_front_left', beamGeomY, woodMat, -0.5, 0, 0.5, 0, 0, 0);
  // Front Right
  addBeam('beam_front_right', beamGeomY, woodMat, 0.5, 0, 0.5, 0, 0, 0);
  // Back Left
  addBeam('beam_back_left', beamGeomY, woodMat, -0.5, 0, -0.5, 0, 0, 0);
  // Back Right
  addBeam('beam_back_right', beamGeomY, woodMat, 0.5, 0, -0.5, 0, 0, 0);

  // 3. Beams along Z axis (Top/Bottom, Left/Right)
  // Top Left
  addBeam('beam_top_left', beamGeomZ, woodMat, -0.5, 0.5, 0, 0, 0, 0);
  // Top Right
  addBeam('beam_top_right', beamGeomZ, woodMat, 0.5, 0.5, 0, 0, 0, 0);
  // Bottom Left
  addBeam('beam_bottom_left', beamGeomZ, woodMat, -0.5, -0.5, 0, 0, 0, 0);
  // Bottom Right
  addBeam('beam_bottom_right', beamGeomZ, woodMat, 0.5, -0.5, 0, 0, 0, 0);

  // --- Wire Bracing Construction ---
  // Wires connect opposite corners of each face.
  // Define corners for clarity
  const c = 0.5;
  const corners = {
    tfl: new THREE.Vector3(-c, c, c),   // Top Front Left
    tfr: new THREE.Vector3(c, c, c),    // Top Front Right
    tbl: new THREE.Vector3(-c, c, -c),  // Top Back Left
    tbr: new THREE.Vector3(c, c, -c),   // Top Back Right
    bfl: new THREE.Vector3(-c, -c, c),  // Bottom Front Left
    bfr: new THREE.Vector3(c, -c, c),   // Bottom Front Right
    bbl: new THREE.Vector3(-c, -c, -c), // Bottom Back Left
    bbr: new THREE.Vector3(c, -c, -c),  // Bottom Back Right
  };

  // Front Face (z = c)
  addWire('wire_front_1', corners.bfl, corners.tfr);
  addWire('wire_front_2', corners.bfr, corners.tfl);

  // Back Face (z = -c)
  addWire('wire_back_1', corners.bbl, corners.tbr);
  addWire('wire_back_2', corners.bbr, corners.tbl);

  // Top Face (y = c)
  addWire('wire_top_1', corners.tbl, corners.tfr);
  addWire('wire_top_2', corners.tbr, corners.tfl);

  // Bottom Face (y = -c)
  addWire('wire_bottom_1', corners.bbl, corners.bfr);
  addWire('wire_bottom_2', corners.bbr, corners.bfl);

  // Left Face (x = -c)
  addWire('wire_left_1', corners.tbl, corners.bfl);
  addWire('wire_left_2', corners.tfl, corners.bbl);

  // Right Face (x = c)
  addWire('wire_right_1', corners.tbr, corners.bfr);
  addWire('wire_right_2', corners.tfr, corners.bbr);

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