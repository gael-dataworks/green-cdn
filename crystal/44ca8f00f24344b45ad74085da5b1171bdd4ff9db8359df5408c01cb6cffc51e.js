export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Capped metalness at 0.6 per rules. Color carries the gold shade.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE5C165,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Glass: Physical material for transmission/refraction.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.02,
  });

  // Dial: White matte surface.
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Hands: Dark metal/plastic.
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Center Pin: Gold.
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xE5C165,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const caseRadius = 0.40;
  const caseThickness = 0.08;
  const bezelWidth = 0.045;
  const dialRadius = caseRadius - bezelWidth - 0.01;

  // --- 1. Case Body (Gold Rim) ---
  // Using Torus for the main bezel/rim structure
  const caseGeom = new THREE.TorusGeometry(caseRadius - bezelWidth / 2, bezelWidth / 2, 16, 64);
  const caseMesh = new THREE.Mesh(caseGeom, goldMat);
  // Torus is in XY plane by default. We want it facing Z.
  caseMesh.rotation.y = Math.PI / 2; 
  root.add(caseMesh);

  // Case Back (Solid cylinder to close the back)
  const backGeom = new THREE.CylinderGeometry(caseRadius - bezelWidth, caseRadius - bezelWidth, caseThickness, 64);
  const backMesh = new THREE.Mesh(backGeom, goldMat);
  backMesh.position.z = -caseThickness / 2;
  root.add(backMesh);

  // Case Side Wall (Thin cylinder connecting front/back rims if needed, 
  // but the Torus + Back usually covers it for a simple pocket watch look.
  // Let's add a thin side wall for completeness.)
  const sideGeom = new THREE.CylinderGeometry(caseRadius - bezelWidth, caseRadius - bezelWidth, caseThickness, 64, 1, true);
  const sideMesh = new THREE.Mesh(sideGeom, goldMat);
  sideMesh.position.z = 0;
  root.add(sideMesh);


  // --- 2. Crystal (Glass Cover) ---
  // Slightly smaller torus or cylinder sitting on top
  const crystalGeom = new THREE.TorusGeometry(caseRadius - bezelWidth / 2 - 0.005, 0.015, 8, 64);
  const crystalMesh = new THREE.Mesh(crystalGeom, glassMat);
  crystalMesh.rotation.y = Math.PI / 2;
  crystalMesh.position.z = caseThickness / 2 + 0.01;
  root.add(crystalMesh);
  
  // Glass pane (flat circle to seal the front)
  const glassPaneGeom = new THREE.CircleGeometry(caseRadius - bezelWidth - 0.01, 32);
  const glassPane = new THREE.Mesh(glassPaneGeom, glassMat);
  glassPane.position.z = caseThickness / 2 + 0.01;
  root.add(glassPane);


  // --- 3. Dial (Face) ---
  const dialGeom = new THREE.CircleGeometry(dialRadius, 64);
  const dialMesh = new THREE.Mesh(dialGeom, dialMat);
  dialMesh.position.z = caseThickness / 2 + 0.015;
  root.add(dialMesh);

  // --- 4. Markers (Procedural Geometry) ---
  // Hour markers: Thick black bars
  const hourMarkerGeom = new THREE.BoxGeometry(0.015, 0.08, 0.002);
  // Minute markers: Thin black lines
  const minuteMarkerGeom = new THREE.BoxGeometry(0.008, 0.04, 0.002);

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const isHour = i % 5 === 0;
    
    const marker = new THREE.Mesh(
      isHour ? hourMarkerGeom : minuteMarkerGeom,
      handMat
    );
    
    // Position on the dial circle
    const r = isHour ? dialRadius - 0.04 : dialRadius - 0.02;
    marker.position.set(
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      caseThickness / 2 + 0.016
    );
    
    // Rotate to face center
    marker.rotation.z = -angle + Math.PI / 2;
    root.add(marker);
  }

  // --- 5. Hands ---
  // Pivot point
  const pivotZ = caseThickness / 2 + 0.02;

  // Hour Hand (Short, thicker)
  const hourHandGeom = new THREE.BoxGeometry(0.012, 0.18, 0.002);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  // Offset geometry so pivot is at one end (bottom of box is -height/2)
  hourHand.position.y = 0.09; 
  hourHand.position.z = pivotZ;
  // Time: Approx 10:22 based on image (Short hand near 10, Long near 4)
  // 10 o'clock is 300 degrees (5 * 60 deg). In Three.js 0 is +X (3 o'clock).
  // 10 o'clock is roughly -60 deg or 300 deg. 
  // Let's aim for ~10:20. Hour hand at 10 + 20/60 = 10.33 hours.
  // Angle = (10.33 / 12) * 360 = 310 degrees.
  // Three.js rotation: 0 is +X. 90 is +Y. 
  // 12 o'clock is +Y (90 deg). 10 o'clock is 30 deg left of Y -> 60 deg.
  hourHand.rotation.z = Math.PI / 2 + (10.33 / 12) * Math.PI * 2; 
  root.add(hourHand);

  // Minute Hand (Long, thinner)
  const minuteHandGeom = new THREE.BoxGeometry(0.008, 0.28, 0.002);
  const minuteHand = new THREE.Mesh(minuteHandGeom, handMat);
  minuteHand.position.y = 0.14;
  minuteHand.position.z = pivotZ + 0.001; // Slightly above hour hand
  // 22 minutes = 22/60 * 360 = 132 degrees from 12 o'clock.
  // 12 o'clock is PI/2. 
  minuteHand.rotation.z = Math.PI / 2 - (22 / 60) * Math.PI * 2;
  root.add(minuteHand);

  // Center Pin
  const pinGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const pin = new THREE.Mesh(pinGeom, pinMat);
  pin.rotation.x = Math.PI / 2;
  pin.position.z = pivotZ + 0.002;
  root.add(pin);


  // --- 6. Crown (Left Side in Image) ---
  // Cylinder stem
  const crownStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 16);
  const crownStem = new THREE.Mesh(crownStemGeom, goldMat);
  crownStem.rotation.z = Math.PI / 2;
  crownStem.position.set(-caseRadius - 0.03, 0, 0);
  root.add(crownStem);

  // Crown Head (Knurled cylinder)
  const crownHeadGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12); // 12 segments for knurling look
  const crownHead = new THREE.Mesh(crownHeadGeom, goldMat);
  crownHead.rotation.z = Math.PI / 2;
  crownHead.position.set(-caseRadius - 0.06, 0, 0);
  root.add(crownHead);


  // --- 7. Bow/Stem (Right Side in Image) ---
  // Stem
  const bowStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 16);
  const bowStem = new THREE.Mesh(bowStemGeom, goldMat);
  bowStem.rotation.z = Math.PI / 2;
  bowStem.position.set(caseRadius + 0.04, 0, 0);
  root.add(bowStem);

  // Bow Ball/Loop end
  const bowBallGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const bowBall = new THREE.Mesh(bowBallGeom, goldMat);
  bowBall.position.set(caseRadius + 0.08, 0, 0);
  root.add(bowBall);


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