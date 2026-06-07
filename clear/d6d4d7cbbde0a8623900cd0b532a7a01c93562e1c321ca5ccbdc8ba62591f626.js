export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const frameColor = 0x0055ee;
  const netColor = 0xccddff;
  const tubeRadius = 0.035;
  
  // Goal Dimensions (local units before normalization)
  const frontWidth = 1.2;
  const backWidth = 0.7;
  const height = 0.7;
  const depth = 0.8;
  const frontZ = depth / 2;
  const backZ = -depth / 2;

  // --- Materials ---
  const frameMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    metalness: 0.3,
    roughness: 0.4,
  });

  const netMat = new THREE.LineBasicMaterial({
    color: netColor,
    transparent: true,
    opacity: 0.8,
  });

  // --- Helpers ---

  // Create a straight pipe between two points
  function createPipe(p1, p2, mat) {
    const distance = p1.distanceTo(p2);
    const geometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, distance, 16);
    const mesh = new THREE.Mesh(geometry, mat);
    
    // Position at midpoint
    const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(midpoint);
    
    // Orient to look at p2
    mesh.lookAt(p2);
    // CylinderGeometry is Y-up, lookAt makes Z point to target. Rotate X -90 to align Y with Z.
    mesh.rotateX(Math.PI / 2);
    
    return mesh;
  }

  // Create a net grid on a quad defined by 4 corners
  function createNet(p1, p2, p3, p4, divisionsU, divisionsV) {
    const points = [];
    
    // Helper to interpolate
    const lerp = (a, b, t) => new THREE.Vector3().lerpVectors(a, b, t);

    // Horizontal lines (U direction)
    for (let i = 0; i <= divisionsV; i++) {
      const t = i / divisionsV;
      const start = lerp(p1, p4, t); // p1->p4 is left edge
      const end = lerp(p2, p3, t);   // p2->p3 is right edge
      points.push(start, end);
    }

    // Vertical lines (V direction)
    for (let i = 0; i <= divisionsU; i++) {
      const t = i / divisionsU;
      const start = lerp(p1, p2, t); // p1->p2 is top edge
      const end = lerp(p4, p3, t);   // p4->p3 is bottom edge
      points.push(start, end);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.LineSegments(geometry, netMat);
  }

  // --- Corner Points ---
  // Front Face (z = frontZ)
  const pFrontTopLeft = new THREE.Vector3(-frontWidth / 2, height, frontZ);
  const pFrontTopRight = new THREE.Vector3(frontWidth / 2, height, frontZ);
  const pFrontBottomLeft = new THREE.Vector3(-frontWidth / 2, 0, frontZ);
  const pFrontBottomRight = new THREE.Vector3(frontWidth / 2, 0, frontZ);

  // Back Face (z = backZ)
  const pBackTopLeft = new THREE.Vector3(-backWidth / 2, height, backZ);
  const pBackTopRight = new THREE.Vector3(backWidth / 2, height, backZ);
  const pBackBottomLeft = new THREE.Vector3(-backWidth / 2, 0, backZ);
  const pBackBottomRight = new THREE.Vector3(backWidth / 2, 0, backZ);

  // --- Frame Construction ---

  // Front Frame
  root.add(createPipe(pFrontBottomLeft, pFrontTopLeft, frameMat));   // Front Left Post
  root.add(createPipe(pFrontBottomRight, pFrontTopRight, frameMat)); // Front Right Post
  root.add(createPipe(pFrontTopLeft, pFrontTopRight, frameMat));     // Front Crossbar

  // Back Frame
  root.add(createPipe(pBackBottomLeft, pBackTopLeft, frameMat));     // Back Left Post
  root.add(createPipe(pBackBottomRight, pBackTopRight, frameMat));   // Back Right Post
  root.add(createPipe(pBackTopLeft, pBackTopRight, frameMat));       // Back Crossbar
  root.add(createPipe(pBackBottomLeft, pBackBottomRight, frameMat)); // Back Bottom Bar

  // Connecting Rails (Top & Bottom)
  root.add(createPipe(pFrontTopLeft, pBackTopLeft, frameMat));       // Left Top Rail
  root.add(createPipe(pFrontTopRight, pBackTopRight, frameMat));     // Right Top Rail
  root.add(createPipe(pFrontBottomLeft, pBackBottomLeft, frameMat)); // Left Bottom Rail
  root.add(createPipe(pFrontBottomRight, pBackBottomRight, frameMat)); // Right Bottom Rail

  // --- Net Construction ---
  // Order of points for createNet: TopLeft, TopRight, BottomRight, BottomLeft (Clockwise looking from outside)
  
  // Top Net
  root.add(createNet(pFrontTopLeft, pFrontTopRight, pBackTopRight, pBackTopLeft, 20, 10));
  
  // Left Side Net
  root.add(createNet(pFrontTopLeft, pBackTopLeft, pBackBottomLeft, pFrontBottomLeft, 10, 20));
  
  // Right Side Net
  root.add(createNet(pBackTopRight, pFrontTopRight, pFrontBottomRight, pBackBottomRight, 10, 20));
  
  // Back Net
  root.add(createNet(pBackTopLeft, pBackTopRight, pBackBottomRight, pBackBottomLeft, 20, 15));

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