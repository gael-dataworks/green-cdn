export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark rough wood for base and stem
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Dark matte metal for cage, socket, and hardware
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.4,
    roughness: 0.6,
  });

  // Clear glass for the bulb envelope
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Glowing filament material
  const filamentMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xffaa00,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- 1. Wooden Base and Stem (Lathe) ---
  // Profile points [radius, height]
  const woodProfilePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.24, 0),       // Bottom edge
    new THREE.Vector2(0.24, 0.06),    // Bottom cylinder side
    new THREE.Vector2(0.22, 0.06),    // Step in
    new THREE.Vector2(0.22, 0.10),    // Upper base cylinder
    new THREE.Vector2(0.16, 0.10),    // Step to stem
    new THREE.Vector2(0.14, 0.14),    // Stem bulb start
    new THREE.Vector2(0.16, 0.18),    // Stem bulb max
    new THREE.Vector2(0.13, 0.22),    // Stem neck
    new THREE.Vector2(0.10, 0.24),    // Stem top
    new THREE.Vector2(0.10, 0.26),    // Socket mount base
  ];
  
  const woodGeom = new THREE.LatheGeometry(woodProfilePoints, 32);
  const woodBaseStem = new THREE.Mesh(woodGeom, woodMat);
  root.add(woodBaseStem);

  // --- 2. Socket Housing ---
  const socketHeight = 0.08;
  const socketRadius = 0.09;
  const socketGeom = new THREE.CylinderGeometry(socketRadius, socketRadius, socketHeight, 24);
  const socket = new THREE.Mesh(socketGeom, darkMetalMat);
  socket.position.y = 0.26 + socketHeight / 2;
  root.add(socket);

  // --- 3. Light Bulb ---
  // Bulb profile [radius, height] relative to bulb base
  const bulbProfilePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.045, 0),      // Metal screw base start
    new THREE.Vector2(0.045, 0.04),   // Metal screw base end
    new THREE.Vector2(0.055, 0.05),   // Glass start flare
    new THREE.Vector2(0.11, 0.20),    // Bulb max width
    new THREE.Vector2(0.09, 0.32),    // Top curve
    new THREE.Vector2(0.04, 0.36),    // Tip
    new THREE.Vector2(0, 0.36),       // Tip center
  ];
  
  const bulbGeom = new THREE.LatheGeometry(bulbProfilePoints, 32);
  const bulb = new THREE.Mesh(bulbGeom, glassMat);
  // Position bulb so it sits in the socket
  bulb.position.y = 0.26 + 0.04; 
  root.add(bulb);

  // Filament (simplified zig-zag inside)
  const filamentPoints = [];
  const fHeight = 0.15;
  const fWidth = 0.04;
  const fBaseY = 0.06; // Inside bulb
  // Simple zig-zag
  filamentPoints.push(new THREE.Vector3(-fWidth/2, fBaseY, 0));
  filamentPoints.push(new THREE.Vector3(-fWidth/2, fBaseY + fHeight/2, 0));
  filamentPoints.push(new THREE.Vector3(fWidth/2, fBaseY + fHeight/2, 0));
  filamentPoints.push(new THREE.Vector3(fWidth/2, fBaseY + fHeight, 0));
  
  const filamentCurve = new THREE.CatmullRomCurve3(filamentPoints);
  const filamentGeom = new THREE.TubeGeometry(filamentCurve, 8, 0.003, 8, false);
  const filament = new THREE.Mesh(filamentGeom, filamentMat);
  filament.position.copy(bulb.position); // Place inside bulb
  root.add(filament);

  // --- 4. Metal Cage ---
  
  // Top Cap
  const topCapHeight = 0.04;
  const topCapRadius = 0.10;
  const topCapGeom = new THREE.CylinderGeometry(topCapRadius, topCapRadius, topCapHeight, 24);
  const topCap = new THREE.Mesh(topCapGeom, darkMetalMat);
  // Position above bulb
  topCap.position.y = bulb.position.y + 0.36 + topCapHeight / 2;
  root.add(topCap);

  // Bottom Ring (around socket area)
  const bottomRingRadius = 0.14;
  const bottomRingTube = 0.008;
  const bottomRingGeom = new THREE.TorusGeometry(bottomRingRadius, bottomRingTube, 16, 32);
  const bottomRing = new THREE.Mesh(bottomRingGeom, darkMetalMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = 0.26 + 0.04 + 0.10; // Around lower bulb
  root.add(bottomRing);

  // Vertical Cage Bars (4 bars)
  const barCount = 4;
  const barRadius = 0.006;
  const topY = topCap.position.y - topCapHeight/2;
  const botY = bottomRing.position.y;
  
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const x = Math.cos(angle) * topCapRadius;
    const z = Math.sin(angle) * topCapRadius;
    
    // Curve outwards slightly in the middle
    const midX = Math.cos(angle) * bottomRingRadius;
    const midZ = Math.sin(angle) * bottomRingRadius;
    const midY = (topY + botY) / 2;

    const curvePoints = [
      new THREE.Vector3(x, topY, z),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(x, botY, z) // Connect back to top radius at bottom? 
      // Actually looking at image, bars connect top cap rim to a ring around the socket.
      // Let's connect to the bottomRing position.
    ];
    
    // Correction: The bottom ring is wider than the top cap in some designs, 
    // but here the cage looks somewhat conical or barrel-shaped.
    // Let's make the bottom connection match the bottomRing radius.
    const botX = Math.cos(angle) * bottomRingRadius;
    const botZ = Math.sin(angle) * bottomRingRadius;
    
    // Update curve to go from TopCap Rim -> Middle (widest) -> BottomRing
    // Actually, looking closely, the bars attach to the top cap and curve down to the bottom ring.
    // The bottom ring is wider than the top cap.
    
    const barCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, topY, z),
      new THREE.Vector3(midX * 1.1, midY, midZ * 1.1), // Bulge out
      new THREE.Vector3(botX, botY, botZ)
    ]);

    const barGeom = new THREE.TubeGeometry(barCurve, 16, barRadius, 8, false);
    const bar = new THREE.Mesh(barGeom, darkMetalMat);
    root.add(bar);
  }

  // Handle Loop on Top
  const handleRadius = 0.04;
  const handleTube = 0.008;
  // Torus is in XY plane by default. We want it vertical (XZ plane rotation) or just rotated.
  // A torus in XY plane, rotated 90 deg around Z stands up like a wheel.
  // We want a loop handle.
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32, Math.PI); // Half torus
  const handle = new THREE.Mesh(handleGeom, darkMetalMat);
  handle.rotation.z = Math.PI / 2; // Stand it up
  handle.position.y = topCap.position.y + topCapHeight/2 + handleRadius;
  root.add(handle);
  
  // Small mounting posts for the handle
  const postGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8);
  const postL = new THREE.Mesh(postGeom, darkMetalMat);
  postL.position.set(-0.03, topCap.position.y + topCapHeight/2, 0);
  root.add(postL);
  const postR = new THREE.Mesh(postGeom, darkMetalMat);
  postR.position.set(0.03, topCap.position.y + topCapHeight/2, 0);
  root.add(postR);

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