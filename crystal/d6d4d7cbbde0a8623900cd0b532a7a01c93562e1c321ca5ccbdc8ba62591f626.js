export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const width = 1.2;
  const height = 0.7;
  const depth = 0.7;
  const tubeRadius = 0.032;
  const tubeSegments = 16;

  // --- Materials ---
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e5cd6,
    metalness: 0.3,
    roughness: 0.4,
  });

  const netMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
  });

  // --- Helper to create oriented cylinders ---
  function createTube(p1, p2, radius, material) {
    const distance = p1.distanceTo(p2);
    const cylinder = new THREE.CylinderGeometry(radius, radius, distance, tubeSegments);
    const mesh = new THREE.Mesh(cylinder, material);
    
    // Orient cylinder to align with p1 -> p2
    const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(midpoint);
    mesh.lookAt(p2);
    mesh.rotateX(Math.PI / 2); // Cylinder default is Y-up, lookAt makes it Z-forward, so rotate X to align
    
    return mesh;
  }

  // --- Frame Coordinates ---
  const fl = new THREE.Vector3(-width / 2, 0, 0);       // Front Left Bottom
  const fr = new THREE.Vector3(width / 2, 0, 0);        // Front Right Bottom
  const ftl = new THREE.Vector3(-width / 2, height, 0); // Front Top Left
  const ftr = new THREE.Vector3(width / 2, height, 0);  // Front Top Right
  
  const rl = new THREE.Vector3(-width / 2, 0, -depth);  // Rear Left Bottom
  const rr = new THREE.Vector3(width / 2, 0, -depth);   // Rear Right Bottom
  const rtl = new THREE.Vector3(-width / 2, height, -depth); // Rear Top Left
  const rtr = new THREE.Vector3(width / 2, height, -depth);  // Rear Top Right

  // --- Frame Parts ---
  
  // Front Vertical Posts
  const front_left_post = createTube(fl, ftl, tubeRadius, frameMat);
  const front_right_post = createTube(fr, ftr, tubeRadius, frameMat);
  root.add(front_left_post, front_right_post);

  // Front Crossbar
  const front_crossbar = createTube(ftl, ftr, tubeRadius, frameMat);
  root.add(front_crossbar);

  // Rear Vertical Posts
  const rear_left_post = createTube(rl, rtl, tubeRadius, frameMat);
  const rear_right_post = createTube(rr, rtr, tubeRadius, frameMat);
  root.add(rear_left_post, rear_right_post);

  // Rear Top Crossbar
  const rear_crossbar_top = createTube(rtl, rtr, tubeRadius, frameMat);
  root.add(rear_crossbar_top);

  // Rear Bottom Crossbar
  const rear_crossbar_bottom = createTube(rl, rr, tubeRadius, frameMat);
  root.add(rear_crossbar_bottom);

  // Side Top Bars
  const side_top_left = createTube(ftl, rtl, tubeRadius, frameMat);
  const side_top_right = createTube(ftr, rtr, tubeRadius, frameMat);
  root.add(side_top_left, side_top_right);

  // Side Bottom Bars
  const side_bottom_left = createTube(fl, rl, tubeRadius, frameMat);
  const side_bottom_right = createTube(fr, rr, tubeRadius, frameMat);
  root.add(side_bottom_left, side_bottom_right);

  // --- Net Construction ---
  const netGroup = new THREE.Group();
  const netOffset = 0.015; // Slightly inside the frame
  const gridSize = 0.08;   // Size of net squares

  function createNetPlane(p1, p2, p3, p4) {
    // p1, p2, p3, p4 define the corners of the rectangular net area
    // We generate lines along u (p1->p2) and v (p1->p4)
    
    const positions = [];
    
    // Vector edges
    const edgeU = new THREE.Vector3().subVectors(p2, p1);
    const edgeV = new THREE.Vector3().subVectors(p4, p1);
    
    const lenU = edgeU.length();
    const lenV = edgeV.length();
    
    const stepsU = Math.floor(lenU / gridSize);
    const stepsV = Math.floor(lenV / gridSize);
    
    const dirU = edgeU.clone().normalize();
    const dirV = edgeV.clone().normalize();

    // Lines along V (fixed U steps)
    for (let i = 0; i <= stepsU; i++) {
      const t = i / stepsU;
      const start = p1.clone().add(dirU.clone().multiplyScalar(t * lenU)).add(dirV.clone().multiplyScalar(netOffset)); // Offset inward roughly
      // Better offset: calculate normal of the plane
      const normal = new THREE.Vector3().crossVectors(edgeU, edgeV).normalize();
      // For simple box faces, we can just offset by normal * netOffset
      const origin = p1.clone().add(normal.clone().multiplyScalar(netOffset));
      
      const uStep = dirU.clone().multiplyScalar(lenU / stepsU);
      const vStep = dirV.clone().multiplyScalar(lenV / stepsV);
      
      const lineStart = origin.clone().add(uStep.clone().multiplyScalar(i));
      const lineEnd = lineStart.clone().add(dirV.clone().multiplyScalar(lenV));
      
      positions.push(lineStart.x, lineStart.y, lineStart.z);
      positions.push(lineEnd.x, lineEnd.y, lineEnd.z);
    }

    // Lines along U (fixed V steps)
    for (let j = 0; j <= stepsV; j++) {
      const normal = new THREE.Vector3().crossVectors(edgeU, edgeV).normalize();
      const origin = p1.clone().add(normal.clone().multiplyScalar(netOffset));
      
      const uStep = dirU.clone().multiplyScalar(lenU / stepsU);
      const vStep = dirV.clone().multiplyScalar(lenV / stepsV);
      
      const lineStart = origin.clone().add(vStep.clone().multiplyScalar(j));
      const lineEnd = lineStart.clone().add(dirU.clone().multiplyScalar(lenU));
      
      positions.push(lineStart.x, lineStart.y, lineStart.z);
      positions.push(lineEnd.x, lineEnd.y, lineEnd.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.LineSegments(geometry, netMat);
    netGroup.add(lines);
  }

  // Define Net Faces (Inner corners)
  // Top Face: ftl, ftr, rtr, rtl
  createNetPlane(ftl, ftr, rtr, rtl);
  
  // Back Face: rtl, rtr, rr, rl
  createNetPlane(rtl, rtr, rr, rl);
  
  // Left Face: fl, ftl, rtl, rl
  createNetPlane(fl, ftl, rtl, rl);
  
  // Right Face: fr, ftr, rtr, rr
  createNetPlane(fr, ftr, rtr, rr);

  root.add(netGroup);

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