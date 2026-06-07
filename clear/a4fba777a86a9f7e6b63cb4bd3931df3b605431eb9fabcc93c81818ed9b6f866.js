export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Satin finish, warm brown
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Black Plastic/Rubber: Matte to semi-gloss
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const handleHeight = 2.2;
  const handleRadius = 0.07;
  const gripStartY = -handleHeight / 2 + 0.4;
  const gripCount = 4;
  const gripSpacing = 0.06;
  const gripThickness = 0.015;
  const gripRadius = handleRadius + 0.015;

  const neckLength = 1.1;
  const neckRadius = 0.055;

  const headLength = 0.65;
  const headWidth = 0.28;
  const headThickness = 0.015;

  // --- Handle ---
  // Main wooden shaft
  const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleHeight, 24);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = 0;
  root.add(handle);

  // Bottom cap (black)
  const bottomCapGeom = new THREE.SphereGeometry(handleRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const bottomCap = new THREE.Mesh(bottomCapGeom, blackMat);
  bottomCap.position.y = -handleHeight / 2;
  bottomCap.rotation.x = Math.PI; // Flip to cover bottom
  root.add(bottomCap);

  // --- Grip Ridges ---
  // Black rings near the bottom of the handle
  for (let i = 0; i < gripCount; i++) {
    const y = gripStartY + i * gripSpacing;
    const ridgeGeom = new THREE.CylinderGeometry(gripRadius, gripRadius, gripThickness, 24);
    const ridge = new THREE.Mesh(ridgeGeom, blackMat);
    ridge.position.y = y;
    root.add(ridge);
  }

  // --- Neck ---
  // Curved black tube extending from top of handle
  // Curve starts at top of handle, goes up and curves forward (+Z)
  const neckStart = new THREE.Vector3(0, handleHeight / 2, 0);
  const neckControl1 = new THREE.Vector3(0, handleHeight / 2 + neckLength * 0.4, 0);
  const neckControl2 = new THREE.Vector3(0, handleHeight / 2 + neckLength * 0.8, neckLength * 0.3);
  const neckEnd = new THREE.Vector3(0, handleHeight / 2 + neckLength, neckLength * 0.5);

  const neckCurve = new THREE.CatmullRomCurve3([
    neckStart,
    neckControl1,
    neckControl2,
    neckEnd
  ]);

  const neckGeom = new THREE.TubeGeometry(neckCurve, 32, neckRadius, 16, false);
  const neck = new THREE.Mesh(neckGeom, blackMat);
  root.add(neck);

  // Neck base ring (transition from wood to black)
  const neckBaseGeom = new THREE.CylinderGeometry(neckRadius + 0.01, neckRadius + 0.01, 0.04, 24);
  const neckBase = new THREE.Mesh(neckBaseGeom, blackMat);
  neckBase.position.copy(neckStart);
  root.add(neckBase);

  // --- Head ---
  // Flat wooden leaf shape attached to the end of the neck
  // Create a leaf shape
  const headShape = new THREE.Shape();
  const hl = headLength / 2;
  const hw = headWidth / 2;
  
  // Draw leaf profile (pointed at tip, rounded at base)
  headShape.moveTo(0, -hl); // Base center
  headShape.quadraticCurveTo(hw, -hl * 0.5, hw * 0.8, 0); // Side bulge
  headShape.quadraticCurveTo(hw, hl * 0.5, 0, hl); // Tip
  headShape.quadraticCurveTo(-hw, hl * 0.5, -hw * 0.8, 0); // Other side
  headShape.quadraticCurveTo(-hw, -hl * 0.5, 0, -hl); // Back to base

  const headGeom = new THREE.ExtrudeGeometry(headShape, {
    depth: headThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12
  });

  const head = new THREE.Mesh(headGeom, woodMat);
  
  // Position head at the end of the neck
  // The neck curve ends at neckEnd. We need to align the head base with the curve tangent.
  // For simplicity in procedural generation without complex Frenet frames, 
  // we approximate the orientation based on the curve end points.
  head.position.copy(neckEnd);
  
  // The head needs to be angled. In the image, it angles back towards the handle slightly 
  // or continues the curve. Let's rotate it to face somewhat "down/back" relative to the tip.
  // Default extrude is along Z. We need to rotate it to lie in the plane of the curve.
  // Approximate rotation: Tilt back around X axis.
  head.rotation.x = -Math.PI / 3; // Tilt back 60 degrees
  head.rotation.z = Math.PI; // Flip so base is at the neck connection
  
  // Adjust position slightly so the base of the extrusion connects to the tube end
  // The extrusion center is at 0,0,0. The shape goes from -hl to hl in Y (local).
  // We want the base (-hl) to be at the neck tip.
  head.translateY(-hl); 

  root.add(head);

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