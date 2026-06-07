export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Burgundy leather: moderate roughness, low metalness, deep red color.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x802040,
    metalness: 0.1,
    roughness: 0.55,
  });

  // Slightly darker material for stitching lines to create contrast.
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x501025,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const width = 0.50;
  const height = 0.34;
  const depth = 0.04;
  const cornerRadius = 0.03;

  // --- Base Body (Back) ---
  // The back of the clutch, slightly smaller than the front flap.
  const backBodyGeom = new THREE.BoxGeometry(width - 0.02, height - 0.02, depth);
  const backBody = new THREE.Mesh(backBodyGeom, leatherMat);
  backBody.position.z = -depth / 2;
  root.add(backBody);

  // --- Front Flap ---
  // The main visible face with quilting.
  // Using a BoxGeometry with segments to allow for slight curvature if needed,
  // but primarily to serve as the base for the quilting.
  const flapGeom = new THREE.BoxGeometry(width, height, depth * 0.8, 1, 1, 1);
  const frontFlap = new THREE.Mesh(flapGeom, leatherMat);
  frontFlap.position.z = depth * 0.1;
  root.add(frontFlap);

  // --- Side Fold / Gusset ---
  // Simulating the leather folding around the right side.
  const sideFoldGeom = new THREE.CylinderGeometry(depth * 0.8, depth * 0.8, height, 8, 1, true, 0, Math.PI * 0.5);
  const sideFold = new THREE.Mesh(sideFoldGeom, leatherMat);
  sideFold.rotation.y = -Math.PI / 2;
  sideFold.position.set(width / 2 - 0.01, 0, 0);
  root.add(sideFold);

  // --- Quilting: Puffy Diamonds ---
  // We use InstancedMesh for efficiency and consistency.
  // Shape: Flattened sphere to simulate a puffy cushion.
  const diamondRadius = 0.055;
  const diamondGeom = new THREE.SphereGeometry(diamondRadius, 16, 16);
  // Flatten the sphere to look like a puffy diamond
  diamondGeom.scale(1, 0.4, 1); 
  
  const diamondMat = leatherMat; // Share the leather material
  const diamondCount = 30; // Approximate grid 6x5
  const diamonds = new THREE.InstancedMesh(diamondGeom, diamondMat, diamondCount);
  
  const dummy = new THREE.Object3D();
  let idx = 0;

  // Grid parameters
  const rows = 5;
  const cols = 6;
  const xSpacing = width / (cols + 1);
  const ySpacing = height / (rows + 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= diamondCount) break;

      // Stagger every other row for diamond pattern
      const xOffset = (r % 2 === 0) ? 0 : xSpacing * 0.5;
      const x = (c - (cols - 1) / 2) * xSpacing + xOffset;
      const y = (r - (rows - 1) / 2) * ySpacing;
      
      dummy.position.set(x, y, depth * 0.4 + 0.005); // Slightly in front of flap
      dummy.rotation.z = Math.PI / 4; // Rotate 45 degrees to form diamond shape
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      diamonds.setMatrixAt(idx, dummy.matrix);
      idx++;
    }
  }
  root.add(diamonds);

  // --- Stitching Lines ---
  // Thin tubes connecting the diamonds to simulate the indented stitching.
  // We create a few long lines rather than many small segments for performance.
  const stitchThickness = 0.004;
  
  // Helper to create a stitch line
  function addStitchLine(p1, p2) {
    const points = [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
    const curve = new THREE.LineCurve3(points[0], points[1]);
    const geom = new THREE.TubeGeometry(curve, 4, stitchThickness, 8, false);
    const mesh = new THREE.Mesh(geom, stitchMat);
    // Push slightly forward of the flap surface but behind the diamond puffs
    mesh.position.z = depth * 0.4 + 0.002; 
    root.add(mesh);
  }

  // Draw diagonal stitching lines across the flap
  // We approximate the grid lines diagonally
  const zLevel = depth * 0.4 + 0.002;
  const margin = 0.02;
  
  // Diagonal 1 (Top-Left to Bottom-Right direction)
  for (let i = -2; i <= 2; i++) {
    const offset = i * xSpacing * 1.4;
    // Line equation approx: y = -x + offset
    const x1 = -width/2 + margin;
    const y1 = -x1 + offset;
    const x2 = width/2 - margin;
    const y2 = -x2 + offset;
    
    // Clamp to flap bounds roughly
    if (Math.abs(y1) < height/2 + margin && Math.abs(y2) < height/2 + margin) {
       addStitchLine([x1, y1, zLevel], [x2, y2, zLevel]);
    }
  }

  // Diagonal 2 (Bottom-Left to Top-Right direction)
  for (let i = -2; i <= 2; i++) {
    const offset = i * xSpacing * 1.4;
    // Line equation approx: y = x + offset
    const x1 = -width/2 + margin;
    const y1 = x1 + offset;
    const x2 = width/2 - margin;
    const y2 = x2 + offset;

    if (Math.abs(y1) < height/2 + margin && Math.abs(y2) < height/2 + margin) {
       addStitchLine([x1, y1, zLevel], [x2, y2, zLevel]);
    }
  }

  // --- Edge Piping (Optional Detail) ---
  // A thin tube around the edge of the flap to define the boundary
  const edgeCurve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    width / 2 - 0.01, height / 2 - 0.01, // xRadius, yRadius
    0, 2 * Math.PI,  // aStartAngle, aEndAngle
    false,           // aClockwise
    0                // aRotation
  );
  const points = edgeCurve.getPoints(50);
  const edgePath = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, depth * 0.4)));
  const edgeGeom = new THREE.TubeGeometry(edgePath, 50, 0.003, 8, false);
  const edgePipe = new THREE.Mesh(edgeGeom, stitchMat);
  root.add(edgePipe);

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