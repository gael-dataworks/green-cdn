export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Medium brown, satin finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Wire: Silver metal, shiny but not black (metalness capped at 0.6).
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry ---
  // Beam: Square profile, length 1.0 (will be scaled/positioned to edges)
  const beamGeom = new THREE.BoxGeometry(0.12, 1.0, 0.12);
  
  // Wire: Thin cylinder, length 1.0 (will be scaled to diagonal length)
  const wireGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);

  // --- Instanced Meshes ---
  // 12 beams for the cube frame
  const beamMesh = new THREE.InstancedMesh(beamGeom, woodMat, 12);
  beamMesh.count = 12;
  
  // 12 wires for the face diagonals (2 per face * 6 faces)
  const wireMesh = new THREE.InstancedMesh(wireGeom, wireMat, 12);
  wireMesh.count = 12;

  const dummy = new THREE.Object3D();
  let beamIdx = 0;
  let wireIdx = 0;

  // --- Helper to set instance transform ---
  function setInstance(mesh, idx, x, y, z, rx, ry, rz, sx, sy, sz) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
  }

  // --- Build Frame (12 Beams) ---
  // Cube spans -0.5 to 0.5. Beams are length 1.0, centered on edges.
  
  // 4 Verticals (Y-axis) at corners
  const corners = [
    [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5] // x, z
  ];
  for (let i = 0; i < 4; i++) {
    setInstance(beamMesh, beamIdx++, corners[i][0], 0, corners[i][1], 0, 0, 0, 1, 1, 1);
  }

  // 4 Top Horizontals (y = 0.5)
  // 2 along X (z = ±0.5)
  setInstance(beamMesh, beamIdx++, 0, 0.5, 0.5, 0, 0, Math.PI / 2, 1, 1, 1);
  setInstance(beamMesh, beamIdx++, 0, 0.5, -0.5, 0, 0, Math.PI / 2, 1, 1, 1);
  // 2 along Z (x = ±0.5)
  setInstance(beamMesh, beamIdx++, 0.5, 0.5, 0, Math.PI / 2, 0, 0, 1, 1, 1);
  setInstance(beamMesh, beamIdx++, -0.5, 0.5, 0, Math.PI / 2, 0, 0, 1, 1, 1);

  // 4 Bottom Horizontals (y = -0.5)
  // 2 along X (z = ±0.5)
  setInstance(beamMesh, beamIdx++, 0, -0.5, 0.5, 0, 0, Math.PI / 2, 1, 1, 1);
  setInstance(beamMesh, beamIdx++, 0, -0.5, -0.5, 0, 0, Math.PI / 2, 1, 1, 1);
  // 2 along Z (x = ±0.5)
  setInstance(beamMesh, beamIdx++, 0.5, -0.5, 0, Math.PI / 2, 0, 0, 1, 1, 1);
  setInstance(beamMesh, beamIdx++, -0.5, -0.5, 0, Math.PI / 2, 0, 0, 1, 1, 1);

  // --- Build Wire Bracing (12 Wires) ---
  // Diagonal length for 1.0 cube face is sqrt(2) ≈ 1.414.
  // We want them to span the inner opening, so scale slightly less, e.g., 1.25.
  const wireScale = 1.25;
  const halfFace = 0.5;

  // Helper for wires on a face
  function addFaceWires(x, y, z, axis, sign) {
    // axis: 'x', 'y', 'z' indicates the face normal direction
    // sign: 1 or -1 indicates which side of the axis (e.g., y=0.5 or y=-0.5)
    
    // Base rotations to lay the cylinder (initially Y-up) onto the face plane
    let rx = 0, ry = 0, rz = 0;
    
    if (axis === 'y') {
      // Face is XZ plane. Rotate X 90 to lie on Z, then rotate Y for diagonal.
      rx = Math.PI / 2;
      // Wire 1: +45 deg in XZ (around Y)
      setInstance(wireMesh, wireIdx++, x, y, z, rx, Math.PI / 4, rz, wireScale, wireScale, wireScale);
      // Wire 2: -45 deg in XZ
      setInstance(wireMesh, wireIdx++, x, y, z, rx, -Math.PI / 4, rz, wireScale, wireScale, wireScale);
    } else if (axis === 'z') {
      // Face is XY plane. Rotate Z 90 to lie on X, then rotate Z for diagonal.
      rz = Math.PI / 2;
      // Wire 1: +45 deg in XY (around Z) -> Total Z rot = 90 + 45 = 135? 
      // Wait, if I rotate Z 90, cylinder is along X. To get diagonal (1,1), I need +45 deg around Z.
      setInstance(wireMesh, wireIdx++, x, y, z, rx, ry, rz + Math.PI / 4, wireScale, wireScale, wireScale);
      // Wire 2: -45 deg -> Total Z rot = 90 - 45 = 45.
      setInstance(wireMesh, wireIdx++, x, y, z, rx, ry, rz - Math.PI / 4, wireScale, wireScale, wireScale);
    } else if (axis === 'x') {
      // Face is YZ plane. Rotate X 90 to lie on Z, then rotate X for diagonal.
      rx = Math.PI / 2;
      // Wire 1: +45 deg in YZ (around X)
      setInstance(wireMesh, wireIdx++, x, y, z, rx + Math.PI / 4, ry, rz, wireScale, wireScale, wireScale);
      // Wire 2: -45 deg
      setInstance(wireMesh, wireIdx++, x, y, z, rx - Math.PI / 4, ry, rz, wireScale, wireScale, wireScale);
    }
  }

  // Top (y=0.5) & Bottom (y=-0.5)
  addFaceWires(0, halfFace, 0, 'y', 1);
  addFaceWires(0, -halfFace, 0, 'y', -1);

  // Front (z=0.5) & Back (z=-0.5)
  addFaceWires(0, 0, halfFace, 'z', 1);
  addFaceWires(0, 0, -halfFace, 'z', -1);

  // Right (x=0.5) & Left (x=-0.5)
  addFaceWires(halfFace, 0, 0, 'x', 1);
  addFaceWires(-halfFace, 0, 0, 'x', -1);

  root.add(beamMesh);
  root.add(wireMesh);

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