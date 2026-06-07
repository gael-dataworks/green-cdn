export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Nylon/Polyester sail material: slightly shiny, low metalness
  const redSailMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const blueSailMat = new THREE.MeshStandardMaterial({
    color: 0x3333ff,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  // Bamboo frame: tan, matte
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Binding tape (black strips holding sail to frame)
  const tapeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Bridle line: thin white
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  // --- Dimensions ---
  const kiteWidth = 1.2;
  const kiteHeight = 0.7;
  const sparRadius = 0.012;
  const sailThickness = 0.005;

  // --- Sail Geometry (Delta Shape) ---
  // We construct the sail from flat shapes to handle the color pattern cleanly.
  // Main shape vertices (concave trailing edge typical of delta kites)
  const topV = new THREE.Vector2(0, kiteHeight / 2);
  const leftV = new THREE.Vector2(-kiteWidth / 2, -kiteHeight / 2);
  const rightV = new THREE.Vector2(kiteWidth / 2, -kiteHeight / 2);
  const centerBottomV = new THREE.Vector2(0, -kiteHeight / 4);

  // 1. Main Red Body (Large triangle with a cutout or just the base)
  // Let's build patches to match the image pattern:
  // - Top blue triangle
  // - Center red spine area
  // - Side blue triangles
  // - Outer red wings

  function createSailPatch(points, material, zOffset) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: sailThickness,
      bevelEnabled: false,
    });
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.z = zOffset;
    return mesh;
  }

  // Top Blue Triangle
  const topBluePoints = [
    new THREE.Vector2(0, kiteHeight / 2),
    new THREE.Vector2(-0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(0.15, kiteHeight / 2 - 0.2),
  ];
  const sail_blue_top = createSailPatch(topBluePoints, blueSailMat, 0.01);
  root.add(sail_blue_top);

  // Center Red Spine Area (below top blue)
  const centerRedPoints = [
    new THREE.Vector2(-0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(0.05, -kiteHeight / 4),
    new THREE.Vector2(-0.05, -kiteHeight / 4),
  ];
  const sail_red_center = createSailPatch(centerRedPoints, redSailMat, 0.01);
  root.add(sail_red_center);

  // Left Wing (Red outer, Blue inner)
  // Blue inner wedge
  const leftBluePoints = [
    new THREE.Vector2(-0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(-0.05, -kiteHeight / 4),
    new THREE.Vector2(-0.4, -kiteHeight / 2 + 0.1),
  ];
  const sail_blue_wing_l = createSailPatch(leftBluePoints, blueSailMat, 0.01);
  root.add(sail_blue_wing_l);

  // Red outer left
  const leftRedPoints = [
    new THREE.Vector2(-0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(-kiteWidth / 2, -kiteHeight / 2),
    new THREE.Vector2(-0.4, -kiteHeight / 2 + 0.1),
  ];
  const sail_red_wing_l = createSailPatch(leftRedPoints, redSailMat, 0.01);
  root.add(sail_red_wing_l);

  // Right Wing (Red outer, Blue inner)
  // Blue inner wedge
  const rightBluePoints = [
    new THREE.Vector2(0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(0.4, -kiteHeight / 2 + 0.1),
    new THREE.Vector2(0.05, -kiteHeight / 4),
  ];
  const sail_blue_wing_r = createSailPatch(rightBluePoints, blueSailMat, 0.01);
  root.add(sail_blue_wing_r);

  // Red outer right
  const rightRedPoints = [
    new THREE.Vector2(0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(-0.4, -kiteHeight / 2 + 0.1), // Wait, symmetry
    new THREE.Vector2(kiteWidth / 2, -kiteHeight / 2),
  ];
  // Correcting right red points for symmetry
  const rightRedPointsFixed = [
    new THREE.Vector2(0.15, kiteHeight / 2 - 0.2),
    new THREE.Vector2(0.4, -kiteHeight / 2 + 0.1),
    new THREE.Vector2(kiteWidth / 2, -kiteHeight / 2),
  ];
  const sail_red_wing_r = createSailPatch(rightRedPointsFixed, redSailMat, 0.01);
  root.add(sail_red_wing_r);


  // --- Frame (Bamboo Spars) ---
  // Central Spine
  const spineHeight = kiteHeight + 0.1; // Extends slightly
  const spineGeom = new THREE.CylinderGeometry(sparRadius, sparRadius, spineHeight, 8);
  const spine = new THREE.Mesh(spineGeom, bambooMat);
  spine.position.y = 0; // Centered vertically relative to group before fit
  spine.rotation.z = Math.PI / 2; // Cylinder is Y-up by default, we want it along Y axis of kite? 
  // Wait, CylinderGeometry is Y-up. To make it vertical in XY plane, no rotation needed if we align Y.
  // But our kite is in XY plane. So spine is along Y axis.
  spine.rotation.z = 0; 
  spine.position.set(0, 0, 0.02); // Slightly in front of sail
  root.add(spine);

  // Leading Edge Spars (Left and Right)
  // They go from top tip to wingtips
  const sparLength = Math.sqrt(Math.pow(kiteWidth / 2, 2) + Math.pow(kiteHeight, 2));
  const sparAngle = Math.atan2(kiteHeight, kiteWidth / 2);

  function createSpar(angle, side) {
    const geom = new THREE.CylinderGeometry(sparRadius, sparRadius, sparLength + 0.2, 8);
    const mesh = new THREE.Mesh(geom, bambooMat);
    // Position at top tip, rotate to angle
    mesh.position.set(0, kiteHeight / 2, 0.02);
    mesh.rotation.z = -side * (Math.PI / 2 - sparAngle); 
    // Pivot adjustment: cylinder centers at 0,0. We want it to pivot from top.
    // Translate geometry or use a group. Let's translate geometry via position offset.
    // Actually simpler: Position mesh at midpoint of the spar.
    const midX = side * (kiteWidth / 4);
    const midY = 0; 
    mesh.position.set(midX, midY, 0.02);
    mesh.rotation.z = -side * (Math.PI / 2 - sparAngle);
    return mesh;
  }

  const spar_l = createSpar(sparAngle, -1);
  root.add(spar_l);

  const spar_r = createSpar(sparAngle, 1);
  root.add(spar_r);

  // Wingtip Extensions (The bamboo sticks poking out)
  // Left extension
  const tipExtLen = 0.25;
  const tipExtGeom = new THREE.CylinderGeometry(sparRadius * 0.8, sparRadius * 0.8, tipExtLen, 8);
  
  const tip_spar_l = new THREE.Mesh(tipExtGeom, bambooMat);
  // Position at left wingtip
  tip_spar_l.position.set(-kiteWidth / 2 - tipExtLen / 2 + 0.05, -kiteHeight / 2 + 0.05, 0.02);
  // Angle matches leading edge roughly but flatter
  tip_spar_l.rotation.z = 0.2; 
  root.add(tip_spar_l);

  const tip_spar_r = new THREE.Mesh(tipExtGeom, bambooMat);
  tip_spar_r.position.set(kiteWidth / 2 + tipExtLen / 2 - 0.05, -kiteHeight / 2 + 0.05, 0.02);
  tip_spar_r.rotation.z = -0.2;
  root.add(tip_spar_r);

  // Cross brace (optional, visible in some kites, skipping for clean delta look unless clearly seen)
  // The image shows black tape bindings. Let's add small black cylinders at joints.
  const tapeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8);
  const tapeMatLocal = tapeMat;
  
  const tapeTop = new THREE.Mesh(tapeGeom, tapeMatLocal);
  tapeTop.rotation.z = Math.PI / 2;
  tapeTop.position.set(0, kiteHeight / 2 - 0.05, 0.03);
  root.add(tapeTop);

  const tapeLeft = new THREE.Mesh(tapeGeom, tapeMatLocal);
  tapeLeft.rotation.z = Math.PI / 2 - sparAngle;
  tapeLeft.position.set(-kiteWidth / 2 + 0.1, -kiteHeight / 2 + 0.1, 0.03);
  root.add(tapeLeft);

  const tapeRight = new THREE.Mesh(tapeGeom, tapeMatLocal);
  tapeRight.rotation.z = -(Math.PI / 2 - sparAngle);
  tapeRight.position.set(kiteWidth / 2 - 0.1, -kiteHeight / 2 + 0.1, 0.03);
  root.add(tapeRight);


  // --- Tails & Bridle ---
  
  // Helper for wavy ribbon
  function createRibbon(color, startX, startY, startZ, length, axis) {
    const points = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = startY - t * length;
      // Sine wave for flutter
      const x = startX + Math.sin(t * 10 + (axis === 'left' ? 0 : Math.PI)) * 0.05 * t;
      const z = startZ + Math.cos(t * 15) * 0.02 * t;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
    const mat = new THREE.MeshStandardMaterial({ 
      color: color, 
      roughness: 0.6, 
      metalness: 0.1,
      side: THREE.DoubleSide 
    });
    return new THREE.Mesh(geom, mat);
  }

  // Left Tail (Red)
  const tail_l = createRibbon(0xff3333, -kiteWidth / 2 - 0.1, -kiteHeight / 2, 0, 0.6, 'left');
  root.add(tail_l);

  // Right Tail (Blue)
  const tail_r = createRibbon(0x3333ff, kiteWidth / 2 + 0.1, -kiteHeight / 2, 0, 0.6, 'right');
  root.add(tail_r);

  // Bridle Line (White string from center bottom)
  const bridleLen = 0.8;
  const bridlePoints = [
    new THREE.Vector3(0, -kiteHeight / 4, 0.05), // Attach point on spine
    new THREE.Vector3(0, -kiteHeight / 4 - bridleLen, 0.2) // Angled back/down
  ];
  const bridleCurve = new THREE.LineCurve3(bridlePoints[0], bridlePoints[1]);
  const bridleGeom = new THREE.TubeGeometry(bridleCurve, 10, 0.005, 8, false);
  const bridle_line = new THREE.Mesh(bridleGeom, lineMat);
  root.add(bridle_line);

  // Bridle Tail (Red flag at end of line)
  const bridleTailPoints = [];
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    const y = bridlePoints[1].y - t * 0.3;
    const x = bridlePoints[1].x + Math.sin(t * 12) * 0.03;
    const z = bridlePoints[1].z + t * 0.1;
    bridleTailPoints.push(new THREE.Vector3(x, y, z));
  }
  const bridleTailCurve = new THREE.CatmullRomCurve3(bridleTailPoints);
  const bridleTailGeom = new THREE.TubeGeometry(bridleTailCurve, 15, 0.012, 8, false);
  const bridle_tail = new THREE.Mesh(bridleTailGeom, redSailMat);
  root.add(bridle_tail);


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