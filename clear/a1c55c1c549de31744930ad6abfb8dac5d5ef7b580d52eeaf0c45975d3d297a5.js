export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red plastic body (satin finish)
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Black plastic/rubber parts (sights, grip panels, trigger)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Dark gray for small metal pins/details
  const grayMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.3,
    roughness: 0.5,
  });

  // --- Helpers ---
  function addMesh(geom, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    return mesh;
  }

  // --- Dimensions ---
  // Approximate scale before normalization
  const totalLength = 1.2;
  const slideLength = 0.65;
  const slideHeight = 0.14;
  const slideWidth = 0.13;
  const frameHeight = 0.08;
  const gripAngle = -0.35; // Radians back

  // --- 1. Slide Assembly ---
  const slideGroup = new THREE.Group();
  
  // Main slide block
  // Using a box for the main body, slightly rounded via scale or just box for low-poly look
  const slideGeom = new THREE.BoxGeometry(slideLength, slideHeight, slideWidth);
  const slideBody = new THREE.Mesh(slideGeom, redMat);
  slideGroup.add(slideBody);

  // Top rail (raised strip on top)
  const railGeom = new THREE.BoxGeometry(slideLength * 0.8, 0.02, slideWidth * 0.4);
  const rail = new THREE.Mesh(railGeom, redMat);
  rail.position.y = slideHeight / 2 + 0.01;
  slideGroup.add(rail);

  // Front Sight (Black)
  const frontSightGeom = new THREE.BoxGeometry(0.015, 0.025, 0.04);
  const frontSight = new THREE.Mesh(frontSightGeom, blackMat);
  frontSight.position.set(slideLength / 2 - 0.02, slideHeight / 2 + 0.015, 0);
  slideGroup.add(frontSight);

  // Rear Sight (Black, U-shape approx)
  const rearSightBaseGeom = new THREE.BoxGeometry(0.04, 0.025, 0.04);
  const rearSight = new THREE.Mesh(rearSightBaseGeom, blackMat);
  rearSight.position.set(-slideLength / 2 + 0.03, slideHeight / 2 + 0.015, 0);
  slideGroup.add(rearSight);
  // Notch in rear sight
  const notchGeom = new THREE.BoxGeometry(0.02, 0.015, 0.045);
  const notch = new THREE.Mesh(notchGeom, blackMat); // Same color to blend or slightly darker
  notch.position.set(-slideLength / 2 + 0.03, slideHeight / 2 + 0.025, 0);
  slideGroup.add(notch);

  // Rear Cap (Black cylinder at back)
  const rearCapGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16);
  const rearCap = new THREE.Mesh(rearCapGeom, blackMat);
  rearCap.rotation.z = Math.PI / 2;
  rearCap.position.set(-slideLength / 2 - 0.015, 0, 0);
  slideGroup.add(rearCap);

  // Muzzle Face (Black ring inside front)
  const muzzleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const muzzle = new THREE.Mesh(muzzleGeom, blackMat);
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.set(slideLength / 2 + 0.01, 0, 0);
  slideGroup.add(muzzle);
  
  // Barrel hole (smaller black cylinder inside muzzle)
  const barrelHoleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 16);
  const barrelHole = new THREE.Mesh(barrelHoleGeom, blackMat);
  barrelHole.rotation.z = Math.PI / 2;
  barrelHole.position.set(slideLength / 2 + 0.01, 0, 0);
  slideGroup.add(barrelHole);

  // Slide Serrations (Vertical black strips on rear sides)
  const serrationGeom = new THREE.BoxGeometry(0.005, 0.06, 0.02);
  for (let i = 0; i < 5; i++) {
    const zOffset = -0.04 + i * 0.02;
    // Left side
    const serrL = new THREE.Mesh(serrationGeom, blackMat);
    serrL.position.set(-slideLength / 2 + 0.08, 0, slideWidth / 2 + 0.001);
    slideGroup.add(serrL);
    // Right side
    const serrR = new THREE.Mesh(serrationGeom, blackMat);
    serrR.position.set(-slideLength / 2 + 0.08, 0, -slideWidth / 2 - 0.001);
    slideGroup.add(serrR);
  }

  // "N5" Decal Texture
  // Create a procedural texture for the side marking
  const texWidth = 128;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  const redColor = { r: 211, g: 47, b: 47 }; // #d32f2f
  const blackColor = { r: 26, g: 26, b: 26 }; // #1a1a1a

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;
      // Base red
      data[i] = redColor.r;
      data[i + 1] = redColor.g;
      data[i + 2] = redColor.b;
      data[i + 3] = 255;

      // Draw 'N' (x: 20-40, y: 10-54)
      if (x >= 20 && x <= 26 && y >= 10 && y <= 54) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; } // Left vert
      if (x >= 34 && x <= 40 && y >= 10 && y <= 54) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; } // Right vert
      // Diagonal for N
      if (x >= 26 && x <= 34 && y >= 10 && y <= 54) {
         const progress = (y - 10) / 44;
         const diagX = 26 + (progress * 8);
         if (Math.abs(x - diagX) < 3.5) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; }
      }

      // Draw '5' (x: 50-75, y: 10-54)
      // Top bar
      if (x >= 50 && x <= 70 && y >= 10 && y <= 18) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; }
      // Vert down
      if (x >= 50 && x <= 56 && y >= 18 && y <= 32) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; }
      // Curve bottom (approximated by blocks)
      if (x >= 50 && x <= 70 && y >= 32 && y <= 40 && x > 50 + (y-32)) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; }
      if (x >= 50 && x <= 56 && y >= 40 && y <= 54) { data[i] = blackColor.r; data[i+1] = blackColor.g; data[i+2] = blackColor.b; }
    }
  }
  const decalTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  decalTexture.colorSpace = THREE.SRGBColorSpace;
  decalTexture.needsUpdate = true;
  // Flip Y because texture coords usually start top-left, but we drew bottom-up logic or vice versa depending on UVs. 
  // BoxGeometry UVs: Y is up. Let's just flip the texture vertically if needed.
  decalTexture.flipY = true; 

  const decalMat = new THREE.MeshBasicMaterial({ map: decalTexture, transparent: true });
  // Apply decal to the side of the slide
  const decalGeom = new THREE.PlaneGeometry(0.15, 0.08);
  const decal = new THREE.Mesh(decalGeom, decalMat);
  decal.position.set(0, 0, slideWidth / 2 + 0.001);
  decal.rotation.y = Math.PI / 2; // Face outward
  // Adjust position to be centered on the rear half of the slide
  decal.position.set(-0.1, 0, slideWidth / 2 + 0.001); 
  slideGroup.add(decal);

  root.add(slideGroup);

  // --- 2. Frame Assembly ---
  const frameGroup = new THREE.Group();

  // Main Frame Rail (under slide)
  const frameRailGeom = new THREE.BoxGeometry(slideLength * 0.9, frameHeight, slideWidth * 0.9);
  const frameRail = new THREE.Mesh(frameRailGeom, redMat);
  frameRail.position.y = -slideHeight / 2 - frameHeight / 2;
  frameGroup.add(frameRail);

  // Dust Cover (Front extension of frame)
  const dustCoverGeom = new THREE.BoxGeometry(0.15, frameHeight * 0.8, slideWidth * 0.85);
  const dustCover = new THREE.Mesh(dustCoverGeom, redMat);
  dustCover.position.set(slideLength / 2 - 0.1, -slideHeight / 2 - frameHeight / 2, 0);
  frameGroup.add(dustCover);

  // Trigger Guard (Torus)
  // Torus is in XY plane. We need it in XZ plane roughly, hanging down.
  const guardRadius = 0.06;
  const guardTube = 0.012;
  const guardGeom = new THREE.TorusGeometry(guardRadius, guardTube, 8, 16, Math.PI); // Half torus
  const guard = new THREE.Mesh(guardGeom, redMat);
  guard.rotation.x = Math.PI / 2; // Lay flat in XZ
  guard.rotation.z = Math.PI; // Open side up
  guard.position.set(0.05, -slideHeight / 2 - frameHeight, 0);
  frameGroup.add(guard);

  // Trigger (Curved black piece inside guard)
  // Use a thin torus slice or tube
  const triggerGeom = new THREE.TorusGeometry(0.04, 0.008, 8, 16, Math.PI * 0.6);
  const trigger = new THREE.Mesh(triggerGeom, blackMat);
  trigger.rotation.x = Math.PI / 2;
  trigger.rotation.z = Math.PI * 1.2; // Angle it back
  trigger.position.set(0.08, -slideHeight / 2 - frameHeight + 0.02, 0);
  frameGroup.add(trigger);

  // Grip (Angled handle)
  // Use a rotated box/cylinder combo
  const gripHeight = 0.35;
  const gripWidth = 0.12;
  const gripDepth = 0.08;
  const gripGeom = new THREE.BoxGeometry(gripHeight, gripWidth, gripDepth);
  const grip = new THREE.Mesh(gripGeom, redMat);
  // Position: Under the rear of the frame
  grip.position.set(-slideLength / 2 + 0.1, -slideHeight / 2 - frameHeight / 2 - gripHeight / 2, 0);
  grip.rotation.z = gripAngle;
  frameGroup.add(grip);

  // Grip Panels (Black textured rectangles on sides)
  const panelGeom = new THREE.BoxGeometry(gripHeight * 0.7, gripWidth * 0.05, gripDepth * 0.9);
  const panelLeft = new THREE.Mesh(panelGeom, blackMat);
  panelLeft.position.set(-slideLength / 2 + 0.1, -slideHeight / 2 - frameHeight / 2 - gripHeight / 2, gripDepth / 2 + 0.001);
  panelLeft.rotation.z = gripAngle;
  frameGroup.add(panelLeft);

  const panelRight = new THREE.Mesh(panelGeom, blackMat);
  panelRight.position.set(-slideLength / 2 + 0.1, -slideHeight / 2 - frameHeight / 2 - gripHeight / 2, -gripDepth / 2 - 0.001);
  panelRight.rotation.z = gripAngle;
  frameGroup.add(panelRight);

  // Controls on the side (Slide Stop / Safety)
  // Slide Stop Lever (Long thin black rectangle)
  const slideStopGeom = new THREE.BoxGeometry(0.08, 0.015, 0.005);
  const slideStop = new THREE.Mesh(slideStopGeom, blackMat);
  slideStop.position.set(0.05, -slideHeight / 2 - 0.02, slideWidth / 2 + 0.001);
  slideStop.rotation.z = 0.1;
  frameGroup.add(slideStop);

  // Safety Switch (Small oval/capsule)
  const safetyGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 12);
  const safety = new THREE.Mesh(safetyGeom, blackMat);
  safety.rotation.x = Math.PI / 2;
  safety.position.set(-0.15, -slideHeight / 2 + 0.02, slideWidth / 2 + 0.001);
  frameGroup.add(safety);

  // Pin near rear of frame
  const pinGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 8);
  const pin = new THREE.Mesh(pinGeom, grayMat);
  pin.rotation.x = Math.PI / 2;
  pin.position.set(-slideLength / 2 + 0.05, -slideHeight / 2, slideWidth / 2 + 0.001);
  frameGroup.add(pin);

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