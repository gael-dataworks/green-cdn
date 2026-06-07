export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red plastic body: bright, satin finish.
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    metalness: 0.1,
    roughness: 0.35,
  });

  // Black plastic/rubber accents: matte.
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Dark grey for muzzle interior.
  const darkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.2,
    roughness: 0.5,
  });

  // Grip panel material with procedural stipple texture.
  const gripTextureData = new Uint8Array(64 * 64 * 3);
  for (let i = 0; i < 64 * 64; i++) {
    // Deterministic pseudo-random pattern for rubber stipple
    const x = i % 64;
    const y = Math.floor(i / 64);
    const seed = (x * 17 + y * 31) % 100;
    const val = seed > 80 ? 40 : 20; // Dark dots on slightly lighter background
    gripTextureData[i * 3] = val;
    gripTextureData[i * 3 + 1] = val;
    gripTextureData[i * 3 + 2] = val;
  }
  const gripTexture = new THREE.DataTexture(gripTextureData, 64, 64, THREE.RGBFormat);
  gripTexture.needsUpdate = true;
  gripTexture.wrapS = THREE.RepeatWrapping;
  gripTexture.wrapT = THREE.RepeatWrapping;
  gripTexture.repeat.set(4, 6);

  const gripMat = new THREE.MeshStandardMaterial({
    map: gripTexture,
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const barrelLen = 0.55;
  const barrelRad = 0.075;
  const frameHeight = 0.12;
  const gripAngle = -0.35; // Radians, tilting back

  // --- Slide Assembly (Upper) ---
  const slideGroup = new THREE.Group();

  // Main slide body (Cylinder along Z)
  const slideGeom = new THREE.CylinderGeometry(barrelRad, barrelRad, barrelLen, 16);
  slideGeom.rotateX(Math.PI / 2); // Align to Z
  const slide = new THREE.Mesh(slideGeom, redMat);
  slideGroup.add(slide);

  // Muzzle face (Ring)
  const muzzleGeom = new THREE.RingGeometry(0.04, barrelRad, 16);
  const muzzle = new THREE.Mesh(muzzleGeom, darkGreyMat);
  muzzle.position.z = barrelLen / 2 + 0.001;
  muzzle.rotation.y = Math.PI / 2; // Face forward
  slideGroup.add(muzzle);

  // Muzzle interior (Circle)
  const boreGeom = new THREE.CircleGeometry(0.04, 16);
  const bore = new THREE.Mesh(boreGeom, darkGreyMat);
  bore.position.z = barrelLen / 2 + 0.002;
  bore.rotation.y = Math.PI / 2;
  slideGroup.add(bore);

  // Front Sight (Black block)
  const frontSightGeom = new THREE.BoxGeometry(0.04, 0.025, 0.03);
  const frontSight = new THREE.Mesh(frontSightGeom, blackMat);
  frontSight.position.set(0, barrelRad + 0.012, -barrelLen / 2 + 0.04);
  slideGroup.add(frontSight);

  // Rear Sight (Black block)
  const rearSightGeom = new THREE.BoxGeometry(0.05, 0.03, 0.04);
  const rearSight = new THREE.Mesh(rearSightGeom, blackMat);
  rearSight.position.set(0, barrelRad + 0.015, barrelLen / 2 - 0.05);
  slideGroup.add(rearSight);

  // Rear Cap (Black disc)
  const rearCapGeom = new THREE.CylinderGeometry(barrelRad + 0.005, barrelRad + 0.005, 0.02, 16);
  rearCapGeom.rotateX(Math.PI / 2);
  const rearCap = new THREE.Mesh(rearCapGeom, blackMat);
  rearCap.position.z = barrelLen / 2 + 0.01;
  slideGroup.add(rearCap);

  // Side Vents/Details (Black rectangular inserts)
  const ventGeom = new THREE.BoxGeometry(0.01, 0.015, 0.12);
  // Left side vent
  const ventL = new THREE.Mesh(ventGeom, blackMat);
  ventL.position.set(-barrelRad - 0.001, 0, -0.1);
  slideGroup.add(ventL);
  // Right side vent
  const ventR = new THREE.Mesh(ventGeom, blackMat);
  ventR.position.set(barrelRad + 0.001, 0, -0.1);
  slideGroup.add(ventR);

  // Top Rail details (Small raised boxes)
  const railGeom = new THREE.BoxGeometry(0.04, 0.01, 0.15);
  const rail = new THREE.Mesh(railGeom, redMat);
  rail.position.set(0, barrelRad + 0.005, 0.15);
  slideGroup.add(rail);

  root.add(slideGroup);

  // --- Frame Assembly (Lower) ---
  const frameGroup = new THREE.Group();

  // Main frame block (under slide)
  // Using a box that tapers slightly towards the front
  const frameGeom = new THREE.BoxGeometry(0.14, frameHeight, 0.25);
  const frame = new THREE.Mesh(frameGeom, redMat);
  frame.position.set(0, -barrelRad - frameHeight / 2, 0.15);
  frameGroup.add(frame);

  // Trigger Guard (Torus segment)
  // Torus is in XY plane, need to rotate to XZ plane and position
  const guardGeom = new THREE.TorusGeometry(0.06, 0.008, 8, 24, Math.PI);
  const guard = new THREE.Mesh(guardGeom, blackMat);
  guard.rotation.x = Math.PI / 2; // Lay flat in XZ
  guard.rotation.z = Math.PI / 2; // Open towards back
  guard.position.set(0, -barrelRad - frameHeight + 0.02, -0.05);
  frameGroup.add(guard);

  // Trigger (Curved shape inside guard)
  const triggerGeom = new THREE.TorusGeometry(0.035, 0.006, 8, 16, Math.PI / 1.5);
  const trigger = new THREE.Mesh(triggerGeom, blackMat);
  trigger.rotation.x = Math.PI / 2;
  trigger.rotation.z = Math.PI / 2;
  trigger.rotation.y = -0.2; // Angle back slightly
  trigger.position.set(0, -barrelRad - frameHeight + 0.02, -0.04);
  frameGroup.add(trigger);

  // Slide Release / Safety (Small cylinder on side)
  const safetyGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8);
  safetyGeom.rotateX(Math.PI / 2);
  const safety = new THREE.Mesh(safetyGeom, blackMat);
  safety.position.set(0.075, -barrelRad - 0.02, 0.05);
  safety.rotation.z = Math.PI / 4; // Angled
  frameGroup.add(safety);

  root.add(frameGroup);

  // --- Grip Assembly ---
  const gripGroup = new THREE.Group();

  // Grip Core (Angled Box)
  const gripH = 0.22;
  const gripW = 0.10;
  const gripD = 0.06;
  const gripGeom = new THREE.BoxGeometry(gripW, gripH, gripD);
  const gripCore = new THREE.Mesh(gripGeom, redMat);
  // Position: attached to bottom of frame, angled back
  gripCore.position.set(0, -barrelRad - frameHeight - gripH / 2, -0.08);
  gripCore.rotation.x = gripAngle;
  root.add(gripCore); // Add directly to root to manage angle easily relative to frame

  // Grip Panels (Textured black rectangles on sides)
  const panelW = 0.09;
  const panelH = 0.16;
  const panelD = 0.005;
  const panelGeom = new THREE.BoxGeometry(panelW, panelH, panelD);
  
  // Left Panel
  const panelL = new THREE.Mesh(panelGeom, gripMat);
  panelL.position.set(-gripW / 2 - panelD / 2, 0, 0);
  panelL.rotation.x = gripAngle;
  panelL.position.copy(gripCore.position);
  panelL.position.x -= (gripW / 2 + panelD / 2);
  root.add(panelL);

  // Right Panel
  const panelR = new THREE.Mesh(panelGeom, gripMat);
  panelR.position.set(gripW / 2 + panelD / 2, 0, 0);
  panelR.rotation.x = gripAngle;
  panelR.position.copy(gripCore.position);
  panelR.position.x += (gripW / 2 + panelD / 2);
  root.add(panelR);

  // Grip Bottom Cap (Black disc at bottom of grip)
  const gripCapGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 16);
  gripCapGeom.rotateX(Math.PI / 2);
  const gripCap = new THREE.Mesh(gripCapGeom, blackMat);
  gripCap.position.copy(gripCore.position);
  gripCap.position.y -= gripH / 2 * Math.cos(gripAngle) + gripCore.position.y; // Approximate bottom
  // Correct positioning logic for cap relative to angled grip:
  // The grip is rotated around its center. The cap should be at the bottom tip.
  // Let's simplify: place cap at the very bottom of the angled box.
  const bottomOffset = new THREE.Vector3(0, -gripH/2 - 0.008, 0);
  bottomOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), gripAngle);
  gripCap.position.copy(gripCore.position).add(bottomOffset);
  // Align cap rotation to match grip angle
  gripCap.rotation.x = gripAngle; 
  root.add(gripCap);


  // --- Final Normalization ---
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