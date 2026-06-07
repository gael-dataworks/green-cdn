export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Leather material with procedural texture
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Generate procedural leather grain texture
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Deterministic noise using sin/cos
      const nx = x / texSize;
      const ny = y / texSize;
      const noise = 
        0.5 + 
        0.2 * Math.sin(nx * 40.0) * Math.sin(ny * 40.0) +
        0.1 * Math.sin(nx * 120.0 + ny * 50.0) +
        0.05 * Math.sin(nx * 200.0);
      
      const val = Math.floor(noise * 255);
      data[i] = val;     // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A
    }
  }
  const leatherMap = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  leatherMap.colorSpace = THREE.SRGBColorSpace;
  leatherMap.wrapS = THREE.RepeatWrapping;
  leatherMap.wrapT = THREE.RepeatWrapping;
  leatherMap.repeat.set(4, 6); // Tile across the bob
  leatherMap.needsUpdate = true;
  leatherMat.map = leatherMap;
  // Use the same texture for bump to enhance grain
  leatherMat.bumpMap = leatherMap;
  leatherMat.bumpScale = 0.02;

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bobHeight = 0.55;
  const bobTopWidth = 0.18;
  const bobDepth = 0.08;
  const loopHeight = 0.35;
  const loopRadius = 0.014;

  // --- Pendulum Bob (Body) ---
  // Shape: Isosceles triangle
  const bobShape = new THREE.Shape();
  const halfTop = bobTopWidth / 2;
  const tipY = -bobHeight / 2;
  const topY = bobHeight / 2;

  bobShape.moveTo(-halfTop, topY);
  bobShape.lineTo(halfTop, topY);
  bobShape.lineTo(0, tipY);
  bobShape.lineTo(-halfTop, topY);

  const bobGeom = new THREE.ExtrudeGeometry(bobShape, {
    depth: bobDepth,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 12,
  });
  // Center the geometry
  bobGeom.center();
  
  const bob = new THREE.Mesh(bobGeom, leatherMat);
  root.add(bob);

  // --- Stitching ---
  // Create dashed lines following the perimeter on front and back faces
  const stitchOffset = 0.025; // Distance from edge
  const zFront = bobDepth / 2 + 0.002;
  const zBack = -bobDepth / 2 - 0.002;

  function createStitchPath(z) {
    const points = [];
    // Top edge
    points.push(new THREE.Vector3(-halfTop + stitchOffset, topY - stitchOffset, z));
    points.push(new THREE.Vector3(halfTop - stitchOffset, topY - stitchOffset, z));
    // Right edge to tip
    points.push(new THREE.Vector3(stitchOffset * 1.5, tipY + stitchOffset * 2, z));
    // Left edge to top
    points.push(new THREE.Vector3(-stitchOffset * 1.5, tipY + stitchOffset * 2, z));
    points.push(new THREE.Vector3(-halfTop + stitchOffset, topY - stitchOffset, z));
    return points;
  }

  function addStitching(z) {
    const points = createStitchPath(z);
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.003, 8, false);
    const stitchMesh = new THREE.Mesh(tubeGeom, stitchMat);
    root.add(stitchMesh);
    
    // Add individual stitch marks (dashes) for better visibility
    const dashCount = 24;
    const dashGeom = new THREE.CapsuleGeometry(0.004, 0.015, 4, 8);
    for (let i = 0; i < dashCount; i++) {
      const t = i / dashCount;
      const pos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const dash = new THREE.Mesh(dashGeom, stitchMat);
      dash.position.copy(pos);
      dash.lookAt(pos.clone().add(tangent));
      dash.rotateZ(Math.PI / 2);
      root.add(dash);
    }
  }

  addStitching(zFront);
  addStitching(zBack);

  // --- Knot ---
  // A tight knot at the top of the bob
  const knotGeom = new THREE.TorusKnotGeometry(0.025, 0.008, 64, 8, 2, 3);
  const knot = new THREE.Mesh(knotGeom, ropeMat);
  knot.position.y = bobHeight / 2 - 0.02;
  knot.scale.set(1.2, 0.8, 1.2); // Flatten slightly
  root.add(knot);

  // --- Loop ---
  // Rope loop hanging from the knot
  const loopPoints = [];
  const loopTopY = knot.position.y + loopHeight;
  const loopWidth = 0.12;
  
  // Start at knot top
  loopPoints.push(new THREE.Vector3(0, knot.position.y + 0.02, 0));
  // Curve up and out
  loopPoints.push(new THREE.Vector3(loopWidth * 0.4, loopTopY * 0.5, 0.02));
  loopPoints.push(new THREE.Vector3(loopWidth / 2, loopTopY, 0));
  // Curve down and in (back side of loop to give volume)
  loopPoints.push(new THREE.Vector3(loopWidth * 0.4, loopTopY * 0.5, -0.02));
  // End at knot top
  loopPoints.push(new THREE.Vector3(0, knot.position.y + 0.02, 0));

  const loopCurve = new THREE.CatmullRomCurve3(loopPoints);
  const loopGeom = new THREE.TubeGeometry(loopCurve, 32, loopRadius, 8, false);
  const loopMesh = new THREE.Mesh(loopGeom, ropeMat);
  root.add(loopMesh);

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