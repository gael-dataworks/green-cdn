export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb35c,
    metalness: 0.0,
    roughness: 0.7,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.5,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const span = 1.2;
  const height = 0.9;
  const wingTipY = -0.25;
  const noseY = 0.45;
  const tailY = -0.35;
  const bowDepth = 0.15;

  // --- Sail Panels ---
  // We construct the sail from separate colored panels to match the reference.
  // All panels lie roughly in the XY plane (Z=0).

  // 1. Central Red Body
  // A complex polygon covering the main area, excluding the blue inserts.
  // To simplify, we make a large red base and overlay blue triangles.
  const redShape = new THREE.Shape();
  redShape.moveTo(0, noseY);
  redShape.lineTo(-span * 0.15, noseY * 0.6); // Top blue boundary
  redShape.lineTo(-span * 0.4, wingTipY * 0.8); // Side blue boundary
  redShape.lineTo(-span * 0.5, wingTipY); // Wingtip area
  redShape.lineTo(0, tailY); // Bottom point
  redShape.lineTo(span * 0.5, wingTipY);
  redShape.lineTo(span * 0.4, wingTipY * 0.8);
  redShape.lineTo(span * 0.15, noseY * 0.6);
  redShape.closePath();

  const redSailGeom = new THREE.ShapeGeometry(redShape);
  const redSail = new THREE.Mesh(redSailGeom, redMat);
  redSail.position.z = 0.002; // Slightly behind frame
  root.add(redSail);

  // 2. Top Blue Triangle
  const topBlueShape = new THREE.Shape();
  topBlueShape.moveTo(0, noseY);
  topBlueShape.lineTo(-span * 0.15, noseY * 0.6);
  topBlueShape.lineTo(span * 0.15, noseY * 0.6);
  topBlueShape.closePath();
  const topBlueGeom = new THREE.ShapeGeometry(topBlueShape);
  const topBlueSail = new THREE.Mesh(topBlueGeom, blueMat);
  topBlueSail.position.z = 0.002;
  root.add(topBlueSail);

  // 3. Left Wing Blue Triangle
  const leftBlueShape = new THREE.Shape();
  leftBlueShape.moveTo(-span * 0.5, wingTipY);
  leftBlueShape.lineTo(-span * 0.4, wingTipY * 0.8);
  leftBlueShape.lineTo(-span * 0.2, wingTipY * 0.5); // Inner point
  leftBlueShape.closePath();
  const leftBlueGeom = new THREE.ShapeGeometry(leftBlueShape);
  const leftBlueSail = new THREE.Mesh(leftBlueGeom, blueMat);
  leftBlueSail.position.z = 0.002;
  root.add(leftBlueSail);

  // 4. Right Wing Blue Triangle
  const rightBlueShape = new THREE.Shape();
  rightBlueShape.moveTo(span * 0.5, wingTipY);
  rightBlueShape.lineTo(span * 0.4, wingTipY * 0.8);
  rightBlueShape.lineTo(span * 0.2, wingTipY * 0.5);
  rightBlueShape.closePath();
  const rightBlueGeom = new THREE.ShapeGeometry(rightBlueShape);
  const rightBlueSail = new THREE.Mesh(rightBlueGeom, blueMat);
  rightBlueSail.position.z = 0.002;
  root.add(rightBlueSail);

  // --- Frame ---
  const frameRadius = 0.008;

  // 1. Spine (Vertical)
  const spineGeom = new THREE.CylinderGeometry(frameRadius, frameRadius, noseY - tailY, 8);
  const spine = new THREE.Mesh(spineGeom, woodMat);
  spine.position.set(0, (noseY + tailY) / 2, 0.005); // On top of sail
  root.add(spine);

  // 2. Cross Spar (Bowed)
  // Use TubeGeometry with a CatmullRomCurve3 to create the bow.
  // Bows backwards (-Z).
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-span / 2, wingTipY, 0),
    new THREE.Vector3(-span * 0.25, wingTipY, -bowDepth * 0.5),
    new THREE.Vector3(0, wingTipY, -bowDepth),
    new THREE.Vector3(span * 0.25, wingTipY, -bowDepth * 0.5),
    new THREE.Vector3(span / 2, wingTipY, 0),
  ]);
  const crossSparGeom = new THREE.TubeGeometry(curve, 20, frameRadius, 8, false);
  const crossSpar = new THREE.Mesh(crossSparGeom, woodMat);
  crossSpar.position.z = 0.005; // On top of sail
  root.add(crossSpar);

  // 3. Connectors (Black tape/bindings)
  // Center joint
  const centerConnGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8);
  const centerConn = new THREE.Mesh(centerConnGeom, blackMat);
  centerConn.rotation.x = Math.PI / 2;
  centerConn.position.set(0, wingTipY, 0.015);
  root.add(centerConn);

  // Wingtip connectors
  const tipConnGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
  
  const leftTipConn = new THREE.Mesh(tipConnGeom, blackMat);
  leftTipConn.rotation.z = Math.PI / 2; // Align with wing angle roughly
  leftTipConn.rotation.y = -0.2;
  leftTipConn.position.set(-span / 2, wingTipY, 0.015);
  root.add(leftTipConn);

  const rightTipConn = new THREE.Mesh(tipConnGeom, blackMat);
  rightTipConn.rotation.z = Math.PI / 2;
  rightTipConn.rotation.y = 0.2;
  rightTipConn.position.set(span / 2, wingTipY, 0.015);
  root.add(rightTipConn);

  // Nose connector
  const noseConnGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
  const noseConn = new THREE.Mesh(noseConnGeom, blackMat);
  noseConn.position.set(0, noseY, 0.015);
  root.add(noseConn);

  // --- Tails ---
  // Tails are ribbons hanging from wingtips and center.
  // Use thin BoxGeometry for ribbons.

  function createRibbonTail(startX, startY, startZ, colorMat, length, curveFactor) {
    const tailGeom = new THREE.BoxGeometry(0.015, length, 0.002);
    const tail = new THREE.Mesh(tailGeom, colorMat);
    // Position at start
    tail.position.set(startX, startY - length / 2, startZ);
    // Add some wave/curve via vertices or just rotate slightly
    tail.rotation.x = 0.2; // Hang down and back
    tail.rotation.z = (startX > 0 ? 1 : -1) * 0.1; // Splay out
    return tail;
  }

  // Left Red Tail
  const leftTail = createRibbonTail(-span / 2, wingTipY, 0, redMat, 0.6, 0);
  // Add some wave to the tail geometry for realism
  const ltPos = leftTail.geometry.attributes.position;
  for (let i = 0; i < ltPos.count; i++) {
    const y = ltPos.getY(i);
    if (y < 0) {
      ltPos.setX(i, ltPos.getX(i) + Math.sin(y * 5) * 0.02);
      ltPos.setZ(i, ltPos.getZ(i) + Math.cos(y * 3) * 0.02);
    }
  }
  ltPos.needsUpdate = true;
  root.add(leftTail);

  // Right Blue Tail
  const rightTail = createRibbonTail(span / 2, wingTipY, 0, blueMat, 0.6, 0);
  const rtPos = rightTail.geometry.attributes.position;
  for (let i = 0; i < rtPos.count; i++) {
    const y = rtPos.getY(i);
    if (y < 0) {
      rtPos.setX(i, rtPos.getX(i) + Math.sin(y * 5) * 0.02);
      rtPos.setZ(i, rtPos.getZ(i) + Math.cos(y * 3) * 0.02);
    }
  }
  rtPos.needsUpdate = true;
  root.add(rightTail);

  // --- Bridle & Center Line ---
  // Bridle connects frame to flying line.
  // Two lines from spine meeting at a point in front.
  const bridleMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  
  // Upper bridle point (near nose)
  const b1Start = new THREE.Vector3(0, noseY * 0.5, 0.01);
  // Lower bridle point (near crossbar)
  const b2Start = new THREE.Vector3(0, wingTipY, 0.01);
  // Meeting point (in front of kite, +Z)
  const bEnd = new THREE.Vector3(0, noseY * 0.2, 0.3);

  const bridleGeo = new THREE.BufferGeometry().setFromPoints([b1Start, bEnd, b2Start]);
  const bridle = new THREE.LineSegments(bridleGeo, bridleMat);
  root.add(bridle);

  // Flying Line / Center Tail
  // A long white line extending from bridle point down
  const linePoints = [];
  linePoints.push(bEnd);
  linePoints.push(new THREE.Vector3(0, -0.5, 0.5)); // Extends down and forward
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const flyingLine = new THREE.Line(lineGeo, bridleMat);
  root.add(flyingLine);

  // Red tail on the flying line (often a spinner or drogue)
  const centerTail = createRibbonTail(0, -0.5, 0.5, redMat, 0.4, 0);
  centerTail.rotation.x = 0.5;
  root.add(centerTail);

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