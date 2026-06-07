export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy Red Metal/Plastic
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd92b2b,
    metalness: 0.4,
    roughness: 0.3,
  });

  // Matte Black Plastic/Rubber
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.2,
    roughness: 0.7,
  });

  // Dark Grey for grip texture detail
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.8,
  });

  // --- Dimensions ---
  // Approximate scale before normalization
  const totalLength = 1.2;
  const barrelRadius = 0.09;
  const slideHeight = 0.14;
  const gripHeight = 0.35;
  const gripWidth = 0.10;

  // --- Main Body (Slide & Barrel Assembly) ---
  // The main upper receiver is a thick, somewhat triangular block
  const slideGeom = new THREE.BoxGeometry(gripWidth * 1.1, slideHeight, totalLength * 0.65);
  const slide = new THREE.Mesh(slideGeom, redMat);
  slide.position.set(0, 0.12, -0.15);
  root.add(slide);

  // Barrel extension (front cylindrical part)
  const barrelGeom = new THREE.CylinderGeometry(barrelRadius, barrelRadius * 0.9, totalLength * 0.45, 24);
  const barrel = new THREE.Mesh(barrelGeom, redMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.10, totalLength * 0.15);
  root.add(barrel);

  // Muzzle opening (black interior)
  const muzzleGeom = new THREE.CylinderGeometry(barrelRadius * 0.6, barrelRadius * 0.6, 0.04, 24);
  const muzzle = new THREE.Mesh(muzzleGeom, blackMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.10, totalLength * 0.38);
  root.add(muzzle);

  // Front Sight (Black blade)
  const frontSightGeom = new THREE.BoxGeometry(0.04, 0.03, 0.04);
  const frontSight = new THREE.Mesh(frontSightGeom, blackMat);
  frontSight.position.set(0, slideHeight / 2 + 0.03, totalLength * 0.35);
  root.add(frontSight);

  // Rear Sight (Black notch block)
  const rearSightGeom = new THREE.BoxGeometry(0.06, 0.04, 0.06);
  const rearSight = new THREE.Mesh(rearSightGeom, blackMat);
  rearSight.position.set(0, slideHeight / 2 + 0.03, -totalLength * 0.45);
  root.add(rearSight);

  // Rear Cap / Hammer area (Black block at the very back)
  const rearCapGeom = new THREE.BoxGeometry(gripWidth * 1.05, slideHeight * 0.8, 0.15);
  const rearCap = new THREE.Mesh(rearCapGeom, blackMat);
  rearCap.position.set(0, 0.12, -totalLength * 0.55);
  root.add(rearCap);

  // --- Frame & Grip ---
  // Lower frame under the slide
  const frameGeom = new THREE.BoxGeometry(gripWidth, slideHeight * 0.4, totalLength * 0.4);
  const frame = new THREE.Mesh(frameGeom, redMat);
  frame.position.set(0, -0.05, -0.05);
  root.add(frame);

  // Grip (Angled handle)
  // Using a box rotated to match the ergonomic angle
  const gripGeom = new THREE.BoxGeometry(gripWidth, gripHeight, gripWidth * 1.2);
  const grip = new THREE.Mesh(gripGeom, redMat);
  grip.rotation.z = Math.PI / 8; // Tilt back slightly
  grip.rotation.x = -Math.PI / 12; // Tilt forward slightly for ergonomic hold
  grip.position.set(0, -0.25, -0.15);
  root.add(grip);

  // Grip Panels (Textured inserts on sides)
  const panelGeom = new THREE.BoxGeometry(0.01, gripHeight * 0.6, gripWidth);
  
  const leftPanel = new THREE.Mesh(panelGeom, gripMat);
  leftPanel.position.set(-gripWidth / 2 - 0.005, -0.25, -0.15);
  leftPanel.rotation.z = Math.PI / 8;
  leftPanel.rotation.x = -Math.PI / 12;
  root.add(leftPanel);

  const rightPanel = new THREE.Mesh(panelGeom, gripMat);
  rightPanel.position.set(gripWidth / 2 + 0.005, -0.25, -0.15);
  rightPanel.rotation.z = Math.PI / 8;
  rightPanel.rotation.x = -Math.PI / 12;
  root.add(rightPanel);

  // Trigger Guard (Loop)
  // Using a Torus segment or Tube. Torus is easier for a clean loop.
  // Torus lies in XY plane by default. We need it in XZ plane roughly.
  const guardRadius = 0.12;
  const guardTube = 0.015;
  const guardGeom = new THREE.TorusGeometry(guardRadius, guardTube, 8, 24, Math.PI); // Half torus
  const guard = new THREE.Mesh(guardGeom, redMat);
  guard.rotation.x = Math.PI / 2; // Lay flat in XZ
  guard.rotation.z = -Math.PI / 2; // Orient loop opening
  guard.position.set(0, -0.12, 0.05);
  root.add(guard);

  // Trigger (Curved piece inside guard)
  const triggerGeom = new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI / 1.5);
  const trigger = new THREE.Mesh(triggerGeom, blackMat);
  trigger.rotation.x = Math.PI / 2;
  trigger.rotation.z = -Math.PI / 2;
  trigger.rotation.y = -Math.PI / 6; // Angle it back
  trigger.position.set(0, -0.11, 0.08);
  root.add(trigger);

  // Safety Switch / Slide Release (Small black details on side)
  const safetyGeom = new THREE.BoxGeometry(0.01, 0.03, 0.06);
  const safety = new THREE.Mesh(safetyGeom, blackMat);
  safety.position.set(gripWidth / 2 + 0.005, 0.02, -0.10);
  root.add(safety);

  const releaseGeom = new THREE.BoxGeometry(0.01, 0.02, 0.04);
  const release = new THREE.Mesh(releaseGeom, blackMat);
  release.position.set(gripWidth / 2 + 0.005, -0.02, 0.05);
  root.add(release);

  // Decorative grooves on the slide (simulated with thin black boxes inset slightly)
  // Or just rely on the main shape. The reference has some panel lines.
  // Let's add a subtle detail line on the side of the slide
  const lineGeom = new THREE.BoxGeometry(0.005, 0.01, 0.3);
  const lineLeft = new THREE.Mesh(lineGeom, blackMat);
  lineLeft.position.set(-gripWidth/2 - 0.001, 0.05, -0.1);
  root.add(lineLeft);
  
  const lineRight = new THREE.Mesh(lineGeom, blackMat);
  lineRight.position.set(gripWidth/2 + 0.001, 0.05, -0.1);
  root.add(lineRight);

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