export default function generate(THREE) {
  const group = new THREE.Group();

  // Dimensions (local units, will be normalized to fit unit cube)
  const W = 1.2; // Width
  const H = 0.8; // Height
  const D = 0.8; // Depth
  const R = 0.035; // Tube radius

  // Reusable Geometries
  const tubeGeomBase = new THREE.CylinderGeometry(R, R, 1, 12);
  const jointGeomBase = new THREE.SphereGeometry(R * 1.3, 12, 12);

  // Materials
  // Painted metal: low metalness, moderate roughness, bright color
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a5fdc,
    metalness: 0.1,
    roughness: 0.35,
  });

  const netMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });

  // Helper: Add a tube between two points using shared geometry
  function addTube(p1, p2) {
    const dist = p1.distanceTo(p2);
    if (dist < 0.001) return;
    
    const mesh = new THREE.Mesh(tubeGeomBase, frameMat);
    
    // Position at midpoint
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(mid);
    
    // Scale height to match distance
    mesh.scale.set(1, dist, 1);
    
    // Orient: Cylinder is Y-up. LookAt makes Z point to target.
    // Rotate X by 90deg to align Y to Z.
    mesh.lookAt(p2);
    mesh.rotateX(Math.PI / 2);
    
    group.add(mesh);
  }

  // Helper: Add a sphere joint using shared geometry
  function addJoint(pos) {
    const mesh = new THREE.Mesh(jointGeomBase, frameMat);
    mesh.position.copy(pos);
    group.add(mesh);
  }

  // Define Frame Corners
  const zF = D / 2;
  const zR = -D / 2;
  const xL = -W / 2;
  const xR = W / 2;
  const yB = 0;
  const yT = H;

  const p_fbl = new THREE.Vector3(xL, yB, zF);
  const p_fbr = new THREE.Vector3(xR, yB, zF);
  const p_ftl = new THREE.Vector3(xL, yT, zF);
  const p_ftr = new THREE.Vector3(xR, yT, zF);

  const p_rbl = new THREE.Vector3(xL, yB, zR);
  const p_rbr = new THREE.Vector3(xR, yB, zR);
  const p_rtl = new THREE.Vector3(xL, yT, zR);
  const p_rtr = new THREE.Vector3(xR, yT, zR);

  // Build Frame Tubes
  // Front Rectangle
  addTube(p_fbl, p_fbr); // Bottom
  addTube(p_ftl, p_ftr); // Top
  addTube(p_fbl, p_ftl); // Left Post
  addTube(p_fbr, p_ftr); // Right Post

  // Rear Rectangle
  addTube(p_rbl, p_rbr); // Bottom
  addTube(p_rtl, p_rtr); // Top
  addTube(p_rbl, p_rtl); // Left Post
  addTube(p_rbr, p_rtr); // Right Post

  // Connecting Side Bars
  addTube(p_ftl, p_rtl); // Top Left
  addTube(p_ftr, p_rtr); // Top Right
  addTube(p_fbl, p_rbl); // Bottom Left
  addTube(p_fbr, p_rbr); // Bottom Right

  // Add Joints at all 8 corners
  [p_fbl, p_fbr, p_ftl, p_ftr, p_rbl, p_rbr, p_rtl, p_rtr].forEach(addJoint);

  // Helper: Create a grid of lines (Net) on a quad defined by 4 points
  function addNetPanel(p00, p10, p01, p11, stepsU, stepsV) {
    const positions = [];
    
    // Lines along U direction (varying V)
    // Connects edge (p00-p01) to edge (p10-p11)
    for (let i = 0; i <= stepsV; i++) {
      const v = i / stepsV;
      const start = new THREE.Vector3().lerpVectors(p00, p01, v);
      const end = new THREE.Vector3().lerpVectors(p10, p11, v);
      positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    }
    
    // Lines along V direction (varying U)
    // Connects edge (p00-p10) to edge (p01-p11)
    for (let i = 0; i <= stepsU; i++) {
      const u = i / stepsU;
      const start = new THREE.Vector3().lerpVectors(p00, p10, u);
      const end = new THREE.Vector3().lerpVectors(p01, p11, u);
      positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.LineSegments(geom, netMat);
    group.add(lines);
  }

  // Net Offset (position net slightly inside the frame)
  const offset = 0.02;

  // Top Panel (y = H)
  addNetPanel(
    new THREE.Vector3(xL + offset, yT - offset, zF - offset), // Front-Left
    new THREE.Vector3(xR - offset, yT - offset, zF - offset), // Front-Right
    new THREE.Vector3(xL + offset, yT - offset, zR + offset), // Rear-Left
    new THREE.Vector3(xR - offset, yT - offset, zR + offset), // Rear-Right
    30, 20
  );

  // Back Panel (z = -D/2)
  addNetPanel(
    new THREE.Vector3(xL + offset, yB + offset, zR + offset), // Bottom-Left
    new THREE.Vector3(xR - offset, yB + offset, zR + offset), // Bottom-Right
    new THREE.Vector3(xL + offset, yT - offset, zR + offset), // Top-Left
    new THREE.Vector3(xR - offset, yT - offset, zR + offset), // Top-Right
    30, 20
  );

  // Left Panel (x = -W/2)
  addNetPanel(
    new THREE.Vector3(xL + offset, yB + offset, zF - offset), // Front-Bottom
    new THREE.Vector3(xL + offset, yB + offset, zR + offset), // Rear-Bottom
    new THREE.Vector3(xL + offset, yT - offset, zF - offset), // Front-Top
    new THREE.Vector3(xL + offset, yT - offset, zR + offset), // Rear-Top
    20, 20
  );

  // Right Panel (x = W/2)
  addNetPanel(
    new THREE.Vector3(xR - offset, yB + offset, zF - offset), // Front-Bottom
    new THREE.Vector3(xR - offset, yB + offset, zR + offset), // Rear-Bottom
    new THREE.Vector3(xR - offset, yT - offset, zF - offset), // Front-Top
    new THREE.Vector3(xR - offset, yT - offset, zR + offset), // Rear-Top
    20, 20
  );

  fitToUnitCube(THREE, group);
  return group;
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