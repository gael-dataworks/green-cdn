export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stainless Steel (Brushed)
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Black Plastic (Handles, Knob, Panel Base)
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Dark Grey Base Ring
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.2,
    roughness: 0.5,
  });

  // Display Screen (Black background)
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Emissive Digits (Green)
  const digitMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 1.5,
    metalness: 0.0,
    roughness: 0.1,
  });
  
  // Button Icons (White/Blue/Red hints)
  const iconMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Dimensions ---
  const bodyRadius = 0.35;
  const bodyHeight = 0.55;
  const lidHeight = 0.12;
  const totalHeight = bodyHeight + lidHeight;
  const handleWidth = 0.08;
  const handleDepth = 0.06;

  // --- 1. Main Body (Lathe) ---
  // Profile: Bottom center -> Bottom curve -> Side wall -> Top lip
  const bodyProfilePoints = [
    new THREE.Vector2(0, 0),                  // Bottom center
    new THREE.Vector2(0, 0.04),               // Bottom curve start
    new THREE.Vector2(0.08, 0.01),            // Bottom curve out
    new THREE.Vector2(bodyRadius, 0.08),      // Max radius (slightly up from bottom)
    new THREE.Vector2(bodyRadius, bodyHeight - 0.02), // Top of straight wall
    new THREE.Vector2(bodyRadius + 0.015, bodyHeight), // Top lip flare
    new THREE.Vector2(bodyRadius, bodyHeight + 0.01),  // Top lip drop (for lid seat)
  ];
  
  // Smooth the profile using a curve
  const bodyCurve = new THREE.CatmullRomCurve3(bodyProfilePoints.map(p => new THREE.Vector3(p.x, p.y, 0)));
  // We need Vector2 for Lathe, so map back
  const bodyPoints = bodyCurve.getPoints(50).map(p => new THREE.Vector2(p.x, p.y));
  // Ensure start and end are clean
  bodyPoints[0].set(0, 0); 
  
  const bodyGeom = new THREE.LatheGeometry(bodyPoints, 48);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  root.add(body);

  // --- 2. Base Ring ---
  const baseGeom = new THREE.TorusGeometry(bodyRadius + 0.015, 0.015, 16, 48);
  const baseRing = new THREE.Mesh(baseGeom, baseMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.02; // Slightly up from absolute bottom
  root.add(baseRing);

  // --- 3. Lid (Lathe) ---
  // Profile: Seat on body -> Dome up -> Flat top for knob
  const lidProfilePoints = [
    new THREE.Vector2(bodyRadius, bodyHeight + 0.01), // Inner seat
    new THREE.Vector2(bodyRadius + 0.02, bodyHeight + 0.02), // Outer rim
    new THREE.Vector2(bodyRadius + 0.01, bodyHeight + 0.06), // Start of dome
    new THREE.Vector2(0.15, bodyHeight + 0.10), // Mid dome
    new THREE.Vector2(0.06, bodyHeight + lidHeight), // Top flat start
    new THREE.Vector2(0, bodyHeight + lidHeight), // Center top
  ];
  
  const lidCurve = new THREE.CatmullRomCurve3(lidProfilePoints.map(p => new THREE.Vector3(p.x, p.y, 0)));
  const lidPoints = lidCurve.getPoints(40).map(p => new THREE.Vector2(p.x, p.y));
  
  const lidGeom = new THREE.LatheGeometry(lidPoints, 48);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  root.add(lid);

  // --- 4. Handles (Left & Right) ---
  // Handle shape: A loop attached to the body
  function createHandle(side) {
    const handleGroup = new THREE.Group();
    const dir = side === 'left' ? -1 : 1;
    
    // Mounting bracket on body
    const bracketGeom = new THREE.BoxGeometry(0.04, 0.08, 0.12);
    const bracket = new THREE.Mesh(bracketGeom, blackPlasticMat);
    bracket.position.set(dir * (bodyRadius + 0.02), bodyHeight * 0.6, 0);
    // Rotate bracket to follow cylinder curvature roughly
    bracket.rotation.y = dir * Math.PI / 2; 
    handleGroup.add(bracket);

    // The Loop (Torus)
    // Torus is in XY plane. We want it in YZ plane (facing X).
    // So rotate X by 90 deg.
    const loopGeom = new THREE.TorusGeometry(0.09, 0.025, 16, 32);
    const loop = new THREE.Mesh(loopGeom, blackPlasticMat);
    loop.rotation.x = Math.PI / 2;
    loop.position.set(dir * (bodyRadius + 0.06), bodyHeight * 0.6, 0);
    handleGroup.add(loop);

    // Connector between bracket and loop
    const connGeom = new THREE.BoxGeometry(0.04, 0.06, 0.04);
    const conn = new THREE.Mesh(connGeom, blackPlasticMat);
    conn.position.set(dir * (bodyRadius + 0.04), bodyHeight * 0.6, 0);
    handleGroup.add(conn);

    return handleGroup;
  }

  const leftHandle = createHandle('left');
  root.add(leftHandle);

  const rightHandle = createHandle('right');
  root.add(rightHandle);

  // --- 5. Top Knob ---
  const knobBaseGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.03, 32);
  const knobBase = new THREE.Mesh(knobBaseGeom, blackPlasticMat);
  knobBase.position.set(0, bodyHeight + lidHeight + 0.015, 0);
  root.add(knobBase);

  const knobTopGeom = new THREE.CylinderGeometry(0.06, 0.04, 0.04, 32);
  const knobTop = new THREE.Mesh(knobTopGeom, blackPlasticMat);
  knobTop.position.set(0, bodyHeight + lidHeight + 0.05, 0);
  root.add(knobTop);
  
  // Knob Grip Ridges (Torus slices or just boxes)
  for(let i=0; i<8; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.04), blackPlasticMat);
    const angle = (i / 8) * Math.PI * 2;
    ridge.position.set(Math.cos(angle)*0.05, bodyHeight + lidHeight + 0.05, Math.sin(angle)*0.05);
    ridge.rotation.y = -angle;
    root.add(ridge);
  }

  // --- 6. Control Panel ---
  // Positioned on the front of the lid
  const panelWidth = 0.14;
  const panelHeight = 0.05;
  const panelDepth = 0.01;
  
  // Panel Background (Rounded Box approximation via Box + smoothing or just Box)
  const panelGeom = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
  const panel = new THREE.Mesh(panelGeom, blackPlasticMat);
  
  // Position on lid surface
  // Lid radius at this height is approx bodyRadius. 
  // We need to push it out and rotate to face forward.
  const panelY = bodyHeight + 0.08;
  const panelZ = Math.sqrt(Math.pow(bodyRadius + 0.02, 2) - Math.pow(0, 2)); // approx
  
  panel.position.set(0, panelY, bodyRadius + 0.025);
  // Tilt slightly to match lid curvature
  panel.rotation.x = -0.2; 
  root.add(panel);

  // --- 7. Display Screen & Digits ---
  const screenW = 0.06;
  const screenH = 0.025;
  const screenGeom = new THREE.PlaneGeometry(screenW, screenH);
  const screen = new THREE.Mesh(screenGeom, screenMat);
  screen.position.set(-0.02, panelY, bodyRadius + 0.031); // Slightly in front of panel
  screen.rotation.x = -0.2;
  root.add(screen);

  // Procedural Digit Texture for "3:58" or similar
  // Creating a simple grid texture for the digits
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let i = 0; i < texSize * texSize; i++) {
    // Black background
    data[i * 4] = 0;
    data[i * 4 + 1] = 0;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
    
    // Draw some green segments roughly
    const x = i % texSize;
    const y = Math.floor(i / texSize);
    
    // Simple "8" shape logic for demo
    const isOn = 
      (y > 10 && y < 20 && x > 40 && x < 80) || // Top bar
      (y > 50 && y < 60 && x > 40 && x < 80) || // Mid bar
      (y > 90 && y < 100 && x > 40 && x < 80) || // Bot bar
      (x > 40 && x < 50 && y > 20 && y < 50) || // Top Left
      (x > 70 && x < 80 && y > 20 && y < 50) || // Top Right
      (x > 40 && x < 50 && y > 60 && y < 90) || // Bot Left
      (x > 70 && x < 80 && y > 60 && y < 90);   // Bot Right
      
    if (isOn) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 255;
      data[i * 4 + 2] = 0;
    }
  }
  const digitTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  digitTexture.colorSpace = THREE.SRGBColorSpace;
  digitTexture.needsUpdate = true;
  
  const digitMatTex = new THREE.MeshBasicMaterial({ map: digitTexture, transparent: true });
  const digitMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW * 0.8, screenH * 0.8), digitMatTex);
  digitMesh.position.copy(screen.position);
  digitMesh.position.z += 0.001;
  digitMesh.rotation.copy(screen.rotation);
  root.add(digitMesh);

  // --- 8. Panel Buttons/Icons ---
  // Small circles on left and right of screen
  function addIcon(xOffset, colorHex) {
    const iconGeom = new THREE.CircleGeometry(0.008, 16);
    const iconMatLocal = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.8,
      metalness: 0,
      roughness: 0.2
    });
    const icon = new THREE.Mesh(iconGeom, iconMatLocal);
    icon.position.set(xOffset, panelY, bodyRadius + 0.031);
    icon.rotation.x = -0.2;
    root.add(icon);
  }

  addIcon(-0.055, 0xff3333); // Red power icon
  addIcon(0.055, 0x3333ff);  // Blue menu icon

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