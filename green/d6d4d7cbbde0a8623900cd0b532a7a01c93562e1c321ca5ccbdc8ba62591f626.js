export default function generate(THREE) {
  const group = new THREE.Group();

  // --- Dimensions ---
  // Proportions based on a standard small backyard goal
  const frontWidth = 1.2;
  const backWidth = 0.7;
  const height = 0.8;
  const depth = 0.9;
  const tubeRadius = 0.035;

  // --- Materials ---
  // Blue painted metal frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a5cc8,
    metalness: 0.3,
    roughness: 0.4,
  });

  // White net lines
  const netMat = new THREE.LineBasicMaterial({
    color: 0xeeeeee,
    transparent: true,
    opacity: 0.9,
  });

  // --- Frame Points ---
  // Y is up. Z is depth (+Z front, -Z back). X is width.
  // Define the 8 corners of the trapezoidal prism frame
  const p_fbl = new THREE.Vector3(-frontWidth / 2, 0, depth / 2);   // Front Bottom Left
  const p_ftl = new THREE.Vector3(-frontWidth / 2, height, depth / 2); // Front Top Left
  const p_ftr = new THREE.Vector3(frontWidth / 2, height, depth / 2);  // Front Top Right
  const p_fbr = new THREE.Vector3(frontWidth / 2, 0, depth / 2);    // Front Bottom Right
  
  const p_bbr = new THREE.Vector3(backWidth / 2, 0, -depth / 2);    // Back Bottom Right
  const p_btr = new THREE.Vector3(backWidth / 2, height, -depth / 2);  // Back Top Right
  const p_btl = new THREE.Vector3(-backWidth / 2, height, -depth / 2); // Back Top Left
  const p_bbl = new THREE.Vector3(-backWidth / 2, 0, -depth / 2);   // Back Bottom Left

  // --- Frame Geometry ---
  // Continuous tube loop connecting all 8 corners
  const curvePoints = [p_fbl, p_ftl, p_ftr, p_fbr, p_bbr, p_btr, p_btl, p_bbl];
  const curve = new THREE.CatmullRomCurve3(curvePoints, true); // true = closed loop
  curve.tension = 0.5; // Smooth rounded elbows

  const frameGeom = new THREE.TubeGeometry(curve, 64, tubeRadius, 12, true);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  group.add(frame);

  // --- Net Geometry ---
  // Generate a grid of lines for the 4 covered faces: Left, Right, Top, Back
  const netPositions = [];
  const segments = 14; // Grid resolution (14x14 squares)
  const insetFactor = 0.12; // Pull net slightly inside the frame to avoid z-fighting

  function addNetFace(p1, p2, p3, p4) {
    // p1: Top-Left, p2: Top-Right, p3: Bottom-Right, p4: Bottom-Left (relative to face)
    
    // Calculate face center for inset
    const center = new THREE.Vector3()
      .addVectors(p1, p2)
      .add(p3)
      .add(p4)
      .multiplyScalar(0.25);

    // Helper to lerp point towards center
    const applyInset = (pt) => {
      return new THREE.Vector3().lerpVectors(pt, center, insetFactor);
    };

    // Generate "vertical" lines (connecting top edge to bottom edge)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const topPt = applyInset(new THREE.Vector3().lerpVectors(p1, p2, t));
      const botPt = applyInset(new THREE.Vector3().lerpVectors(p4, p3, t));
      
      netPositions.push(topPt.x, topPt.y, topPt.z);
      netPositions.push(botPt.x, botPt.y, botPt.z);
    }

    // Generate "horizontal" lines (connecting left edge to right edge)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const leftPt = applyInset(new THREE.Vector3().lerpVectors(p1, p4, t));
      const rightPt = applyInset(new THREE.Vector3().lerpVectors(p2, p3, t));
      
      netPositions.push(leftPt.x, leftPt.y, leftPt.z);
      netPositions.push(rightPt.x, rightPt.y, rightPt.z);
    }
  }

  // Define faces with correct corner ordering for the helper function
  // Left Face: Top-Left(F_TL), Top-Right(B_TL), Bottom-Right(B_BL), Bottom-Left(F_BL)
  addNetFace(p_ftl, p_btl, p_bbl, p_fbl);

  // Right Face: Top-Left(F_TR), Top-Right(B_TR), Bottom-Right(B_BR), Bottom-Left(F_BR)
  addNetFace(p_ftr, p_btr, p_bbr, p_fbr);

  // Top Face: Top-Left(F_TL), Top-Right(F_TR), Bottom-Right(B_TR), Bottom-Left(B_TL)
  addNetFace(p_ftl, p_ftr, p_btr, p_btl);

  // Back Face: Top-Left(B_TL), Top-Right(B_TR), Bottom-Right(B_BR), Bottom-Left(B_BL)
  addNetFace(p_btl, p_btr, p_bbr, p_bbl);

  const netGeom = new THREE.BufferGeometry();
  netGeom.setAttribute('position', new THREE.Float32BufferAttribute(netPositions, 3));
  const net = new THREE.LineSegments(netGeom, netMat);
  group.add(net);

  // --- Normalization ---
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