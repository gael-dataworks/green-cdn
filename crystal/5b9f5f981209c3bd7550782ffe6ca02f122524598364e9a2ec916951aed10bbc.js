export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Sail fabric: synthetic, slightly rough, no metalness
  const sailRedMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const sailBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2222ff,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Frame: Bamboo/Wood look
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Connectors/Tape: Black
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Tail Ribbon: Red fabric
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  // Bridle String: White
  const stringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const span = 1.6;
  const height = 1.0;
  const noseY = height / 2;
  const tailY = -height / 2;
  const tipX = span / 2;
  const tipY = -height * 0.2; // Tips are swept back, not at the very bottom

  // --- Sail Construction ---
  // We build the sail from separate colored patches to match the pattern exactly.
  // All patches lie roughly on the XZ plane (Y=0 locally), but we will apply a slight dihedral later if needed.
  // For simplicity and robustness, we keep the sail flat in XY plane for construction, then rotate.
  // Wait, standard orientation: Y is up. Kite face is usually XZ or XY?
  // Let's build the kite facing +Z, lying in the XY plane.
  // Nose at (0, noseY, 0), Tail at (0, tailY, 0), Tips at (±tipX, tipY, 0).

  function createSailPatch(points, material) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    const geom = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geom, material);
    // Lift slightly to avoid z-fighting with frame if frame is added later
    mesh.position.z = 0.002; 
    return mesh;
  }

  // 1. Central Red Spine Panel (Diamond/Triangle shape)
  // Runs from nose down the center, widening slightly then narrowing to tail.
  const spineWidthTop = 0.15;
  const spineWidthMid = 0.35;
  const spineWidthBot = 0.05;
  const spineTopY = noseY - 0.15;
  const spineMidY = 0.0;
  
  const spinePoints = [
    new THREE.Vector2(0, noseY),
    new THREE.Vector2(-spineWidthTop, spineTopY),
    new THREE.Vector2(-spineWidthMid, spineMidY),
    new THREE.Vector2(-spineWidthBot, tailY),
    new THREE.Vector2(spineWidthBot, tailY),
    new THREE.Vector2(spineWidthMid, spineMidY),
    new THREE.Vector2(spineWidthTop, spineTopY),
  ];
  const spinePanel = createSailPatch(spinePoints, sailRedMat);
  root.add(spinePanel);

  // 2. Blue Nose Triangle
  // Sits at the very top, flanking the spine.
  const noseBluePoints = [
    new THREE.Vector2(0, noseY),
    new THREE.Vector2(-spineWidthTop, spineTopY),
    new THREE.Vector2(-0.45, noseY - 0.25), // Outer edge
    new THREE.Vector2(0.45, noseY - 0.25),  // Outer edge
    new THREE.Vector2(spineWidthTop, spineTopY),
  ];
  const nosePanel = createSailPatch(noseBluePoints, sailBlueMat);
  root.add(nosePanel);

  // 3. Main Red Wing Panels
  // The large area between the spine and the tips.
  // Left Wing
  const leftWingPoints = [
    new THREE.Vector2(-spineWidthTop, spineTopY),
    new THREE.Vector2(-0.45, noseY - 0.25),
    new THREE.Vector2(-tipX, tipY),
    new THREE.Vector2(-spineWidthBot, tailY),
    new THREE.Vector2(-spineWidthMid, spineMidY),
    new THREE.Vector2(-spineWidthTop, spineTopY),
  ];
  const leftWingPanel = createSailPatch(leftWingPoints, sailRedMat);
  root.add(leftWingPanel);

  // Right Wing
  const rightWingPoints = [
    new THREE.Vector2(spineWidthTop, spineTopY),
    new THREE.Vector2(spineWidthMid, spineMidY),
    new THREE.Vector2(spineWidthBot, tailY),
    new THREE.Vector2(tipX, tipY),
    new THREE.Vector2(0.45, noseY - 0.25),
    new THREE.Vector2(spineWidthTop, spineTopY),
  ];
  const rightWingPanel = createSailPatch(rightWingPoints, sailRedMat);
  root.add(rightWingPanel);

  // 4. Blue Tip Triangles
  // At the very ends of the wings.
  const tipBlueHeight = 0.25;
  // Left Tip
  const leftTipPoints = [
    new THREE.Vector2(-tipX, tipY),
    new THREE.Vector2(-0.45, noseY - 0.25),
    new THREE.Vector2(-tipX + 0.15, tipY + tipBlueHeight), // Inner point
    new THREE.Vector2(-spineWidthBot, tailY), // Connects to tail area
  ];
  // Simplified tip triangle
  const leftTipSimple = [
    new THREE.Vector2(-tipX, tipY),
    new THREE.Vector2(-tipX + 0.3, tipY + 0.2),
    new THREE.Vector2(-spineWidthBot, tailY),
  ];
  const leftTipPanel = createSailPatch(leftTipSimple, sailBlueMat);
  root.add(leftTipPanel);

  // Right Tip
  const rightTipSimple = [
    new THREE.Vector2(tipX, tipY),
    new THREE.Vector2(spineWidthBot, tailY),
    new THREE.Vector2(tipX - 0.3, tipY + 0.2),
  ];
  const rightTipPanel = createSailPatch(rightTipSimple, sailBlueMat);
  root.add(rightTipPanel);


  // --- Frame Construction ---
  const frameGroup = new THREE.Group();
  
  // 1. Spine (Central Rod)
  const spineLength = noseY - tailY;
  const spineGeom = new THREE.CylinderGeometry(0.012, 0.012, spineLength, 8);
  const spineRod = new THREE.Mesh(spineGeom, woodMat);
  spineRod.position.set(0, (noseY + tailY) / 2, -0.005); // Behind sail
  frameGroup.add(spineRod);

  // 2. Leading Edges (Curved Rods)
  // Use TubeGeometry with CatmullRomCurve3 for the sweep
  function createLeadingEdge(side) {
    const dir = side; // -1 or 1
    const points = [
      new THREE.Vector3(0, noseY, -0.005),
      new THREE.Vector3(dir * 0.3, noseY - 0.3, -0.005),
      new THREE.Vector3(dir * 0.6, tipY - 0.1, -0.005),
      new THREE.Vector3(dir * tipX, tipY, -0.005),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.01, 6, false);
    const tube = new THREE.Mesh(tubeGeom, woodMat);
    return tube;
  }
  frameGroup.add(createLeadingEdge(-1));
  frameGroup.add(createLeadingEdge(1));

  // 3. Cross Spar (Bowed backwards)
  const crossSparPoints = [
    new THREE.Vector3(-tipX + 0.1, tipY + 0.1, -0.005),
    new THREE.Vector3(0, 0, -0.08), // Bowed back significantly
    new THREE.Vector3(tipX - 0.1, tipY + 0.1, -0.005),
  ];
  const crossSparCurve = new THREE.CatmullRomCurve3(crossSparPoints);
  const crossSparGeom = new THREE.TubeGeometry(crossSparCurve, 16, 0.008, 6, false);
  const crossSpar = new THREE.Mesh(crossSparGeom, woodMat);
  frameGroup.add(crossSpar);

  // 4. Connectors (Black tape/joints)
  function addConnector(x, y, z) {
    const conn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), blackMat);
    conn.position.set(x, y, z);
    frameGroup.add(conn);
  }
  addConnector(0, noseY, -0.005); // Nose
  addConnector(0, tailY, -0.005); // Tail
  addConnector(-tipX, tipY, -0.005); // Left Tip
  addConnector(tipX, tipY, -0.005); // Right Tip


  // --- Tail Ribbon ---
  // Long wavy ribbon hanging from the tail center
  const tailLength = 1.8;
  const tailPoints = [];
  const tailSegments = 40;
  for (let i = 0; i <= tailSegments; i++) {
    const t = i / tailSegments;
    const y = tailY - t * tailLength;
    // Sine wave for flutter effect
    const x = Math.sin(t * 10) * 0.15 * (1 - t); 
    const z = Math.cos(t * 15) * 0.1 * (1 - t);
    tailPoints.push(new THREE.Vector3(x, y, z));
  }
  const tailCurve = new THREE.CatmullRomCurve3(tailPoints);
  // Flat ribbon: use TubeGeometry with very small radius, or custom extrusion.
  // TubeGeometry is easiest for a flowing ribbon.
  const tailTubeGeom = new THREE.TubeGeometry(tailCurve, 40, 0.015, 3, false);
  // Scale Y to flatten it into a ribbon
  const tailMesh = new THREE.Mesh(tailTubeGeom, tailMat);
  tailMesh.scale.set(1, 0.2, 1); 
  root.add(tailMesh);

  // --- Wingtip Streamers ---
  function createStreamer(side, colorMat) {
    const dir = side;
    const start = new THREE.Vector3(dir * tipX, tipY, 0);
    const points = [
      start,
      new THREE.Vector3(dir * (tipX + 0.1), tipY - 0.3, 0.1),
      new THREE.Vector3(dir * (tipX + 0.2), tipY - 0.6, -0.1),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 10, 0.012, 3, false);
    const mesh = new THREE.Mesh(geom, colorMat);
    mesh.scale.set(1, 0.3, 1); // Flatten
    return mesh;
  }
  root.add(createStreamer(-1, sailRedMat)); // Left streamer red
  root.add(createStreamer(1, sailBlueMat)); // Right streamer blue

  // --- Bridle Line ---
  // Single line from spine connection point down
  const bridleStart = new THREE.Vector3(0, 0.1, -0.005);
  const bridleEnd = new THREE.Vector3(0, -0.8, 0.5); // Hanging down and forward
  const bridleGeom = new THREE.BufferGeometry().setFromPoints([bridleStart, bridleEnd]);
  const bridleLine = new THREE.Line(bridleGeom, stringMat);
  root.add(bridleLine);


  root.add(frameGroup);

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