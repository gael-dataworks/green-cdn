export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rusty metal: Dark base, high roughness, low metalness (rust is not shiny).
  // We will use a procedural texture for the rust patches.
  const rustColor = new THREE.Color(0x8b4513); // SaddleBrown
  const metalColor = new THREE.Color(0x2a2a2a); // Dark Grey
  
  const textureSize = 128;
  const data = new Uint8Array(textureSize * textureSize * 4);
  
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      // Deterministic pseudo-random noise
      const angle = x * 12.9898 + y * 78.233;
      const noise = Math.abs(Math.sin(angle) * 43758.5453) % 1;
      
      // Mix metal and rust based on noise
      // More rust spots (noise > 0.4)
      const isRust = noise > 0.4;
      const mixFactor = isRust ? 1.0 : 0.0;
      
      // Add some variation to the rust color
      const r = Math.floor((metalColor.r * (1 - mixFactor) + rustColor.r * mixFactor) * 255);
      const g = Math.floor((metalColor.g * (1 - mixFactor) + rustColor.g * mixFactor) * 255);
      const b = Math.floor((metalColor.b * (1 - mixFactor) + rustColor.b * mixFactor) * 255);
      
      const index = (y * textureSize + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255; // Alpha
    }
  }

  const rustTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
  rustTexture.colorSpace = THREE.SRGBColorSpace;
  rustTexture.needsUpdate = true;
  // Wrap to avoid seams on cylindrical handle
  rustTexture.wrapS = THREE.RepeatWrapping;
  rustTexture.wrapT = THREE.RepeatWrapping;

  const rustyMetalMat = new THREE.MeshStandardMaterial({
    map: rustTexture,
    color: 0xffffff, // Let texture drive color
    metalness: 0.3,  // Rusty metal isn't very reflective
    roughness: 0.85, // Rust is rough
  });

  // --- Geometry & Meshes ---

  // 1. Head
  // A lump hammer head is roughly a hexagonal prism with rounded ends.
  // Using CylinderGeometry with 6 segments gives a good faceted look.
  // Axis of cylinder is X (striking axis).
  const headRadius = 0.065;
  const headLength = 0.18; // Along X
  const headGeom = new THREE.CylinderGeometry(headRadius, headRadius, headLength, 8);
  
  const head = new THREE.Mesh(headGeom, rustyMetalMat);
  head.rotation.z = Math.PI / 2; // Rotate cylinder axis from Y to X
  head.position.set(0, 0, 0);
  root.add(head);

  // 2. Handle
  // Tapered cylinder along Z axis.
  // Starts at head center (0,0,0) and extends to +Z.
  const handleLength = 0.45;
  const handleRadiusTop = 0.020; // Near head
  const handleRadiusBottom = 0.024; // At end
  const handleGeom = new THREE.CylinderGeometry(handleRadiusTop, handleRadiusBottom, handleLength, 16);
  
  const handle = new THREE.Mesh(handleGeom, rustyMetalMat);
  // Cylinder is centered at origin. Move it so it starts at head center and goes +Z.
  handle.position.set(0, 0, handleLength / 2);
  root.add(handle);

  // 3. Handle Knob / Pommel
  // Swollen end of the handle.
  const knobRadius = 0.032;
  const knobHeight = 0.04;
  const knobGeom = new THREE.CylinderGeometry(knobRadius, knobRadius, knobHeight, 16);
  
  const knob = new THREE.Mesh(knobGeom, rustyMetalMat);
  // Place at the very end of the handle
  knob.position.set(0, 0, handleLength + knobHeight / 2);
  root.add(knob);

  // 4. Striking Face Detail (Optional but adds realism)
  // The face might be slightly worn/different. 
  // We can add a thin disc to represent the wear pattern or just rely on the main geometry.
  // The main cylinder geometry already has flat caps. 
  // Let's add a slight bevel or just leave it as the cylinder cap.
  // To make it look more like a used hammer, let's add a small ring on the face.
  const faceRingGeom = new THREE.TorusGeometry(headRadius * 0.8, 0.005, 8, 24);
  const faceRing = new THREE.Mesh(faceRingGeom, rustyMetalMat);
  faceRing.position.set(headLength / 2 + 0.006, 0, 0); // Slightly in front of face
  faceRing.rotation.y = Math.PI / 2;
  root.add(faceRing);

  // Same for the other face (Peen)
  const peenRingGeom = new THREE.TorusGeometry(headRadius * 0.8, 0.005, 8, 24);
  const peenRing = new THREE.Mesh(peenRingGeom, rustyMetalMat);
  peenRing.position.set(-headLength / 2 - 0.006, 0, 0);
  peenRing.rotation.y = Math.PI / 2;
  root.add(peenRing);

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