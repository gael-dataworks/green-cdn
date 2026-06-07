export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Light hardwood (boxwood/maple), matte/satin finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Metal: Aged copper/bronze. Capped metalness at 0.5 to prevent blackness.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Dark slot inside wood (simulating the split tang)
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0x3a2010,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- 1. Wooden Handle ---
  // Profile for lathe: [radius, y]
  // Start from bottom (metal joint) to top (pommel)
  const handleProfile = [
    new THREE.Vector2(0.045, 0.00), // Joint with metal (slight flare)
    new THREE.Vector2(0.050, 0.02), // Flare out
    new THREE.Vector2(0.048, 0.15), // Main grip cylinder start
    new THREE.Vector2(0.048, 0.45), // Main grip cylinder end
    new THREE.Vector2(0.055, 0.50), // Pommel start curve
    new THREE.Vector2(0.040, 0.58), // Pommel top curve
    new THREE.Vector2(0.00, 0.60),  // Top center
  ];
  const handleGeom = new THREE.LatheGeometry(handleProfile, 24);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position so the bottom of the handle is at y=0
  handle.position.y = 0; 
  root.add(handle);

  // --- 2. Split Tang Slot (Visual Detail) ---
  // A thin box inside the wood to represent the split where the metal tang sits
  const slotGeom = new THREE.BoxGeometry(0.004, 0.08, 0.12);
  const slot = new THREE.Mesh(slotGeom, slotMat);
  slot.position.set(0, 0.04, 0); // Just above the metal joint
  // Rotate to align with the "front" of the handle roughly
  slot.rotation.y = Math.PI / 4; 
  root.add(slot);

  // --- 3. Metal Shaft (Tapered) ---
  // The metal part emerging from the wood.
  // Radius top (at wood): ~0.045, Radius bottom (start of threads): ~0.025
  // Height: ~0.35
  const shaftGeom = new THREE.CylinderGeometry(0.045, 0.025, 0.35, 8); // 8 segments for slight octagon look
  const shaft = new THREE.Mesh(shaftGeom, metalMat);
  // Position: The top of the shaft should be slightly inside/flush with the handle bottom
  shaft.position.y = -0.175; 
  root.add(shaft);

  // --- 4. Screw Threads ---
  // Procedural stacked torus rings to simulate the auger thread
  const threadCount = 6;
  const threadStartY = -0.30; // Start below shaft center
  const threadEndY = -0.50;   // End near tip
  const threadSpacing = (threadStartY - threadEndY) / threadCount;
  
  for (let i = 0; i < threadCount; i++) {
    const t = i / (threadCount - 1); // 0 to 1
    // Taper the thread radius
    const maxThreadR = 0.032;
    const minThreadR = 0.022;
    const currentR = maxThreadR - (maxThreadR - minThreadR) * t;
    
    // Tube thickness
    const tubeR = 0.004;
    
    const threadGeom = new THREE.TorusGeometry(currentR, tubeR, 8, 16);
    const thread = new THREE.Mesh(threadGeom, metalMat);
    
    // Position along the taper
    const y = threadStartY - (t * (threadStartY - threadEndY));
    thread.position.y = y;
    
    // Rotate torus to lie flat (XY plane -> XZ plane for horizontal rings)
    thread.rotation.x = Math.PI / 2;
    
    root.add(thread);
  }

  // --- 5. Tip Point ---
  // Small cone at the very bottom
  const tipGeom = new THREE.ConeGeometry(0.022, 0.06, 8);
  const tip = new THREE.Mesh(tipGeom, metalMat);
  tip.position.y = -0.53; // Below the last thread
  root.add(tip);

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