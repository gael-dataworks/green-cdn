export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte grey plastic for the case body
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Darker material for cutouts (camera, ports) to simulate depth/shadow
  const cutoutMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const width = 0.50;
  const height = 0.95;
  const depth = 0.025;
  const cornerRadius = 0.06;

  // --- 1. Main Case Body ---
  // Use ExtrudeGeometry for rounded rectangle silhouette
  const bodyShape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  // Draw rounded rect
  bodyShape.moveTo(x, y + cornerRadius);
  bodyShape.lineTo(x, y + height - cornerRadius);
  bodyShape.quadraticCurveTo(x, y + height, x + cornerRadius, y + height);
  bodyShape.lineTo(x + width - cornerRadius, y + height);
  bodyShape.quadraticCurveTo(x + width, y + height, x + width, y + height - cornerRadius);
  bodyShape.lineTo(x + width, y + cornerRadius);
  bodyShape.quadraticCurveTo(x + width, y, x + width - cornerRadius, y);
  bodyShape.lineTo(x + cornerRadius, y);
  bodyShape.quadraticCurveTo(x, y, x, y + cornerRadius);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the geometry so (0,0,0) is the center of the case
  bodyGeom.center();

  const caseBody = new THREE.Mesh(bodyGeom, caseMat);
  root.add(caseBody);

  // --- 2. Camera Cutout ---
  // Pill shape at top left (from back view)
  const camW = 0.14;
  const camH = 0.22;
  const camShape = new THREE.Shape();
  const cx = -width / 2 + 0.08;
  const cy = height / 2 - 0.08 - camH;
  
  camShape.moveTo(cx, cy + camH / 2 - camW / 2);
  camShape.quadraticCurveTo(cx, cy + camH / 2, cx + camW / 2, cy + camH / 2);
  camShape.lineTo(cx + camW / 2, cy - camH / 2 + camW / 2);
  camShape.quadraticCurveTo(cx + camW / 2, cy - camH / 2, cx, cy - camH / 2);
  camShape.lineTo(cx - camW / 2, cy - camH / 2 + camW / 2);
  camShape.quadraticCurveTo(cx - camW / 2, cy - camH / 2, cx, cy - camH / 2);
  camShape.lineTo(cx - camW / 2, cy + camH / 2 - camW / 2);
  camShape.quadraticCurveTo(cx - camW / 2, cy + camH / 2, cx, cy + camH / 2);

  const camGeom = new THREE.ExtrudeGeometry(camShape, {
    depth: 0.004, // Slight recess
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  camGeom.center();

  const cameraCutout = new THREE.Mesh(camGeom, cutoutMat);
  // Position on the back face (negative Z)
  cameraCutout.position.set(-width / 2 + 0.09, height / 2 - 0.12, -depth / 2);
  root.add(cameraCutout);

  // --- 3. Side Buttons ---
  // Visible on the right side (positive X)
  const btnW = 0.015; // protrusion
  const btnD = 0.012; // thickness along Z
  const btnH_short = 0.05;
  const btnH_long = 0.08;
  const btnMat = caseMat; // Same material

  // Power button (top)
  const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(btnW, btnH_long, btnD), btnMat);
  powerBtn.position.set(width / 2 + btnW / 2, height / 2 - 0.15, 0);
  root.add(powerBtn);

  // Volume Up
  const volUpBtn = new THREE.Mesh(new THREE.BoxGeometry(btnW, btnH_short, btnD), btnMat);
  volUpBtn.position.set(width / 2 + btnW / 2, height / 2 - 0.28, 0);
  root.add(volUpBtn);

  // Volume Down
  const volDownBtn = new THREE.Mesh(new THREE.BoxGeometry(btnW, btnH_short, btnD), btnMat);
  volDownBtn.position.set(width / 2 + btnW / 2, height / 2 - 0.38, 0);
  root.add(volDownBtn);

  // --- 4. Bottom Ports ---
  // Charging port (center)
  const portW = 0.06;
  const portH = 0.015;
  const portD = 0.008;
  const chargePort = new THREE.Mesh(new THREE.BoxGeometry(portW, portH, portD), cutoutMat);
  chargePort.position.set(0, -height / 2, 0);
  root.add(chargePort);

  // Speaker grilles (left and right of charging port)
  const speakerW = 0.04;
  const speakerH = 0.006;
  const speakerD = 0.005;
  
  const speakerL = new THREE.Mesh(new THREE.BoxGeometry(speakerW, speakerH, speakerD), cutoutMat);
  speakerL.position.set(-0.12, -height / 2, 0);
  root.add(speakerL);

  const speakerR = new THREE.Mesh(new THREE.BoxGeometry(speakerW, speakerH, speakerD), cutoutMat);
  speakerR.position.set(0.12, -height / 2, 0);
  root.add(speakerR);

  // --- 5. Kickstand ---
  // A flat plate attached to the back, rotated open
  const standW = 0.28;
  const standH = 0.35;
  const standThick = 0.006;
  const standRadius = 0.04;

  const standShape = new THREE.Shape();
  const sx = -standW / 2;
  const sy = -standH / 2;
  standShape.moveTo(sx, sy + standRadius);
  standShape.lineTo(sx, sy + standH - standRadius);
  standShape.quadraticCurveTo(sx, sy + standH, sx + standRadius, sy + standH);
  standShape.lineTo(sx + standW - standRadius, sy + standH);
  standShape.quadraticCurveTo(sx + standW, sy + standH, sx + standW, sy + standH - standRadius);
  standShape.lineTo(sx + standW, sy + standRadius);
  standShape.quadraticCurveTo(sx + standW, sy, sx + standW - standRadius, sy);
  standShape.lineTo(sx + standRadius, sy);
  standShape.quadraticCurveTo(sx, sy, sx, sy + standRadius);

  const standGeom = new THREE.ExtrudeGeometry(standShape, {
    depth: standThick,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
  standGeom.center();

  const standMesh = new THREE.Mesh(standGeom, caseMat);
  
  // Position the stand on the back of the case
  // Pivot point roughly 1/3 up from bottom
  const pivotY = -height / 2 + 0.25;
  standMesh.position.set(0, pivotY, -depth / 2 - standThick / 2);
  
  // Rotate around X axis to open it (leaning back)
  // In the image, it forms a triangle support. 
  // A simple rotation of ~50 degrees creates the stand effect.
  standMesh.rotation.x = -Math.PI / 3.5; 

  root.add(standMesh);

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