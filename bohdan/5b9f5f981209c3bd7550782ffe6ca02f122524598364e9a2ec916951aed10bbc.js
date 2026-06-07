export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const redFabricMat = new THREE.MeshStandardMaterial({
    color: 0xd92525,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const blueFabricMat = new THREE.MeshStandardMaterial({
    color: 0x2566d9,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a464,
    metalness: 0.0,
    roughness: 0.8,
  });

  const stringMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Helper: Create a panel from 2D points, extrude, then bow it ---
  function createPanel(points, material, bowFactor = 0) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.002,
      bevelEnabled: false,
    });

    // Apply bow to Z coordinates based on X position (simulate dihedral/tension)
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Simple parabolic bow: tips (large |x|) move forward (positive Z)
      const zOffset = bowFactor * (x * x);
      pos.setZ(i, zOffset);
    }
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, material);
    return mesh;
  }

  // --- Sail Panels ---
  // Coordinates estimated from image proportions
  // Top: (0, 1.0), Spar Junction: (0, 0.2), Tips: (+/- 1.2, -0.2), Bottom: (0, -0.8)

  // 1. Top Blue Triangle
  const topBluePoints = [
    { x: 0, y: 1.0 },
    { x: -0.3, y: 0.2 },
    { x: 0.3, y: 0.2 },
  ];
  const topBlue = createPanel(topBluePoints, blueFabricMat, 0.15);
  root.add(topBlue);

  // 2. Left Blue Wing
  const leftBluePoints = [
    { x: -0.3, y: 0.2 },
    { x: -1.2, y: -0.2 },
    { x: -0.2, y: -0.4 },
  ];
  const leftBlue = createPanel(leftBluePoints, blueFabricMat, 0.15);
  root.add(leftBlue);

  // 3. Right Blue Wing
  const rightBluePoints = [
    { x: 0.3, y: 0.2 },
    { x: 1.2, y: -0.2 },
    { x: 0.2, y: -0.4 },
  ];
  const rightBlue = createPanel(rightBluePoints, blueFabricMat, 0.15);
  root.add(rightBlue);

  // 4. Center Red Body (Diamond-ish)
  const centerRedPoints = [
    { x: 0, y: 0.2 },
    { x: -0.3, y: 0.2 },
    { x: 0, y: -0.6 },
    { x: 0.3, y: 0.2 },
  ];
  const centerRed = createPanel(centerRedPoints, redFabricMat, 0.15);
  root.add(centerRed);

  // 5. Left Red Trailing Edge
  const leftRedPoints = [
    { x: -0.3, y: 0.2 },
    { x: -0.2, y: -0.4 },
    { x: 0, y: -0.8 },
    { x: 0, y: -0.6 },
  ];
  const leftRed = createPanel(leftRedPoints, redFabricMat, 0.15);
  root.add(leftRed);

  // 6. Right Red Trailing Edge
  const rightRedPoints = [
    { x: 0.3, y: 0.2 },
    { x: 0.2, y: -0.4 },
    { x: 0, y: -0.8 },
    { x: 0, y: -0.6 },
  ];
  const rightRed = createPanel(rightRedPoints, redFabricMat, 0.15);
  root.add(rightRed);

  // --- Frame (Bamboo Spars) ---
  // We need to position these slightly in front of the sail (Z > 0) to sit on top
  // The sail bow logic pushed tips to Z ~ 0.15 * 1.44 = 0.21.
  // Let's place frame at Z = 0.25 to be safe.

  const frameZ = 0.25;
  const spineRadius = 0.018;
  const sparRadius = 0.014;

  // Central Spine
  const spineGeom = new THREE.CylinderGeometry(spineRadius, spineRadius, 1.9, 12);
  const spine = new THREE.Mesh(spineGeom, woodMat);
  spine.position.set(0, 0.1, frameZ); // Centered roughly between 1.0 and -0.8
  root.add(spine);

  // Cross Spar (Left)
  // From (0, 0.2) to (-1.2, -0.2)
  const leftSparLength = Math.sqrt(Math.pow(1.2, 2) + Math.pow(0.4, 2));
  const leftSparGeom = new THREE.CylinderGeometry(sparRadius, sparRadius, leftSparLength, 10);
  const leftSpar = new THREE.Mesh(leftSparGeom, woodMat);
  // Position at midpoint
  leftSpar.position.set(-0.6, 0.0, frameZ);
  // Rotate to match angle
  const leftSparAngle = Math.atan2(-0.4, -1.2); // Angle in XY plane
  leftSpar.rotation.z = leftSparAngle + Math.PI / 2; // Cylinder is Y-up, need to rotate to XY
  // Wait, Cylinder is Y-up. To lie in XY plane, rotate X by 90 deg.
  // Then rotate Z to match the spar angle.
  leftSpar.rotation.x = Math.PI / 2;
  leftSpar.rotation.z = Math.atan2(-0.4, -1.2); 
  root.add(leftSpar);

  // Cross Spar (Right)
  const rightSparGeom = new THREE.CylinderGeometry(sparRadius, sparRadius, leftSparLength, 10);
  const rightSpar = new THREE.Mesh(rightSparGeom, woodMat);
  rightSpar.position.set(0.6, 0.0, frameZ);
  rightSpar.rotation.x = Math.PI / 2;
  rightSpar.rotation.z = Math.atan2(-0.4, 1.2);
  root.add(rightSpar);

  // Tip Extenders (small bits of bamboo at the wing tips)
  const tipGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
  
  const leftTip = new THREE.Mesh(tipGeom, woodMat);
  leftTip.position.set(-1.2, -0.2, frameZ);
  leftTip.rotation.x = Math.PI / 2;
  leftTip.rotation.z = Math.atan2(-0.4, -1.2);
  root.add(leftTip);

  const rightTip = new THREE.Mesh(tipGeom, woodMat);
  rightTip.position.set(1.2, -0.2, frameZ);
  rightTip.rotation.x = Math.PI / 2;
  rightTip.rotation.z = Math.atan2(-0.4, 1.2);
  root.add(rightTip);

  // --- Tails ---
  
  // Helper to create a flowing ribbon tail
  function createTail(startX, startY, startZ, colorMat, length, waveAmp, waveFreq) {
    const points = [];
    const segments = 30;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = startY - t * length;
      // Sinusoidal wave in X and Z
      const x = startX + Math.sin(t * waveFreq * Math.PI) * waveAmp * t;
      const z = startZ + Math.cos(t * waveFreq * Math.PI) * waveAmp * t * 0.5;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, segments, 0.015, 6, false);
    const mesh = new THREE.Mesh(geom, colorMat);
    // Flatten the tube to look like a ribbon
    mesh.scale.set(1, 1, 0.2);
    return mesh;
  }

  // Center Tail (String + Red Ribbon)
  const stringStart = new THREE.Vector3(0, -0.8, 0);
  const stringEnd = new THREE.Vector3(0, -1.5, 0.5);
  const stringCurve = new THREE.LineCurve3(stringStart, stringEnd);
  const stringGeom = new THREE.TubeGeometry(stringCurve, 10, 0.005, 6, false);
  const kiteString = new THREE.Mesh(stringGeom, stringMat);
  root.add(kiteString);

  const centerTail = createTail(0, -1.5, 0.5, redFabricMat, 2.5, 0.3, 4);
  root.add(centerTail);

  // Left Side Tail (Blue)
  // Start from left tip
  const leftTailStart = new THREE.Vector3(-1.2, -0.2, 0.25);
  const leftTail = createTail(-1.2, -0.2, 0.25, blueFabricMat, 1.8, 0.4, 3);
  root.add(leftTail);

  // Right Side Tail (Red)
  const rightTailStart = new THREE.Vector3(1.2, -0.2, 0.25);
  const rightTail = createTail(1.2, -0.2, 0.25, redFabricMat, 1.8, 0.4, 3);
  root.add(rightTail);

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