export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red painted metal body
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Black matte plastic/rubber for grips, sights, trigger
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.7,
  });

  // Dark grey for internal muzzle
  const darkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const barrelLen = 0.65;
  const barrelRad = 0.09;
  const frameHeight = 0.12;
  const gripAngle = -0.35; // Radians back

  // --- 1. Slide Assembly (Top Part) ---
  const slide = new THREE.Group();

  // Main Slide Body: Octagonal cylinder to simulate blocky barrel
  const slideGeom = new THREE.CylinderGeometry(barrelRad, barrelRad, barrelLen, 8);
  slideGeom.rotateX(Math.PI / 2); // Align Z
  const slideMesh = new THREE.Mesh(slideGeom, redMat);
  slide.add(slideMesh);

  // Front Sight
  const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.06), blackMat);
  frontSight.position.set(0, barrelRad + 0.012, -barrelLen / 2 + 0.04);
  slide.add(frontSight);

  // Rear Sight
  const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.08), blackMat);
  rearSight.position.set(0, barrelRad + 0.015, barrelLen / 2 - 0.06);
  slide.add(rearSight);

  // Muzzle Face (Black ring)
  const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(barrelRad - 0.015, 0.015, 8, 24), blackMat);
  muzzleRing.rotation.y = Math.PI / 2;
  muzzleRing.position.set(0, 0, -barrelLen / 2);
  slide.add(muzzleRing);

  // Muzzle Interior (Dark hole)
  const muzzleHole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16), darkGreyMat);
  muzzleHole.rotation.x = Math.PI / 2;
  muzzleHole.position.set(0, 0, -barrelLen / 2 - 0.025);
  slide.add(muzzleHole);

  // Slide Serrations (Rear grip texture)
  for (let i = 0; i < 4; i++) {
    const serration = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.005), blackMat);
    // Position on the side of the barrel
    const angle = (i / 4) * Math.PI * 2;
    // We only want side serrations, roughly at 45 degrees or flat sides
    // Let's just put them on the flat sides of the octagon
    // Simplified: just side boxes
    if (i < 2) { 
       const s = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.04, 0.08), blackMat);
       s.position.set(barrelRad + 0.002, 0, barrelLen/2 - 0.12 - (i*0.05));
       slide.add(s);
       const s2 = s.clone();
       s2.position.set(-barrelRad - 0.002, 0, barrelLen/2 - 0.12 - (i*0.05));
       slide.add(s2);
    }
  }

  // "NS" Logo relief (Small raised box)
  const logoBox = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.025, 0.04), redMat);
  logoBox.position.set(barrelRad + 0.002, 0, barrelLen / 2 - 0.25);
  slide.add(logoBox);

  // Slide Release Lever
  const slideRelease = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.015, 0.04), blackMat);
  slideRelease.position.set(barrelRad + 0.002, -0.02, barrelLen / 2 - 0.18);
  slide.add(slideRelease);

  root.add(slide);

  // --- 2. Frame Assembly (Lower Part) ---
  const frame = new THREE.Group();

  // Lower Receiver (Rail)
  const railGeom = new THREE.BoxGeometry(barrelRad * 1.8, 0.06, barrelLen * 0.6);
  const rail = new THREE.Mesh(railGeom, redMat);
  rail.position.set(0, -barrelRad + 0.03, barrelLen * 0.1); // Slightly forward offset
  frame.add(rail);

  // Trigger Guard
  // Use a Torus cut in half or a Tube. Let's use a Torus segment approximation with a box mask or just a curved tube
  const guardCurve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    0.08, 0.06,      // xRadius, yRadius
    0, Math.PI,      // aStartAngle, aEndAngle (bottom half)
    false,           // aClockwise
    0                // aRotation
  );
  const points = guardCurve.getPoints(20);
  const guardPoints3D = points.map(p => new THREE.Vector3(p.x, -p.y - 0.06, barrelLen * 0.15)); // Shift down and forward
  
  // Simpler: Box with rounded edges or just a thick Torus slice
  const guardGeom = new THREE.TorusGeometry(0.07, 0.008, 8, 20, Math.PI);
  const guard = new THREE.Mesh(guardGeom, blackMat);
  guard.rotation.x = Math.PI / 2;
  guard.rotation.z = Math.PI; // Flip to face down
  guard.position.set(0, -barrelRad - 0.04, barrelLen * 0.15);
  frame.add(guard);

  // Trigger
  const triggerGeom = new THREE.TorusGeometry(0.035, 0.006, 8, 10, Math.PI * 0.6);
  const trigger = new THREE.Mesh(triggerGeom, blackMat);
  trigger.rotation.x = Math.PI / 2;
  trigger.rotation.z = Math.PI * 0.8; // Angle back
  trigger.position.set(0, -barrelRad - 0.03, barrelLen * 0.15);
  frame.add(trigger);

  // Grip Frame
  // Angled box
  const gripH = 0.22;
  const gripW = 0.08;
  const gripD = 0.09;
  const gripGeom = new THREE.BoxGeometry(gripW, gripH, gripD);
  const gripMesh = new THREE.Mesh(gripGeom, redMat);
  // Position: under the rear of the rail
  gripMesh.position.set(0, -barrelRad - gripH / 2, barrelLen / 2 - 0.15);
  gripMesh.rotation.z = gripAngle;
  frame.add(gripMesh);

  // Grip Panel (Textured black insert)
  const panelGeom = new THREE.BoxGeometry(gripW + 0.002, gripH * 0.7, gripD + 0.002);
  const panel = new THREE.Mesh(panelGeom, blackMat);
  panel.position.copy(gripMesh.position);
  panel.position.x = gripW / 2 + 0.001; // Slightly offset to side
  panel.rotation.z = gripAngle;
  frame.add(panel);

  // Back Strap / Cap
  const backCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16), blackMat);
  backCap.rotation.x = Math.PI / 2;
  backCap.position.set(0, -barrelRad - 0.02, barrelLen / 2 + 0.02);
  frame.add(backCap);

  // Safety Switch (Small cylinder on side)
  const safety = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8), blackMat);
  safety.rotation.z = Math.PI / 2;
  safety.position.set(barrelRad + 0.01, 0.02, barrelLen / 2 - 0.05);
  frame.add(safety);

  root.add(frame);

  // --- 3. Final Assembly & Normalization ---
  
  // Group everything
  const weaponGroup = new THREE.Group();
  weaponGroup.add(slide);
  weaponGroup.add(frame);
  
  // Center the weapon roughly before fitting
  weaponGroup.position.set(0, 0, 0);

  fitToUnitCube(THREE, weaponGroup);
  return weaponGroup;
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