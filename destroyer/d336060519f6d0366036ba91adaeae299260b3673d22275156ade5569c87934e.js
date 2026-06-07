export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear container body (plastic/glass)
  const containerMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  // Red lid (matte plastic)
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0xd93025,
    metalness: 0.1,
    roughness: 0.4,
  });

  // White beads (pearl/plastic)
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const radius = 0.35;
  const height = 0.7;
  const lidHeight = 0.18;
  const wallThickness = 0.015;
  const beadRadius = 0.028;

  // --- Container Body ---
  // Outer cylinder
  const bodyGeom = new THREE.CylinderGeometry(radius, radius, height, 32);
  const containerBody = new THREE.Mesh(bodyGeom, containerMat);
  root.add(containerBody);

  // Inner hollow (to make it a vessel, not a solid block)
  // We can achieve this by scaling an inner black mesh or using negative geometry, 
  // but for transmission materials, a simple thin shell often works best visually 
  // if we don't need complex refraction inside. 
  // However, to show beads inside clearly, let's make the container a thin shell.
  // Actually, for simplicity and robustness with transmission, a single cylinder 
  // with transmission often looks like a solid block of glass. 
  // Better approach: Two cylinders, one slightly smaller inside, subtracted? 
  // Three.js doesn't do CSG natively easily in one pass without complexity.
  // Alternative: Just use a single cylinder with transmission. The beads inside 
  // will be visible through the material. To simulate thickness, we can add 
  // a slightly smaller inner cylinder with same material but no transmission? 
  // No, let's keep it simple: One transparent cylinder. The beads will be inside.
  // To prevent z-fighting and make it look like a container, we can scale the 
  // inner volume slightly or just rely on the transmission.
  // Let's add an inner cylinder slightly smaller to define the inner wall.
  const innerRadius = radius - wallThickness;
  const innerHeight = height - wallThickness;
  const innerGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 32);
  const containerInner = new THREE.Mesh(innerGeom, containerMat);
  // Position inner slightly up to align bottoms or center? Let's center it.
  containerInner.position.y = 0; 
  root.add(containerInner);

  // --- Lid ---
  // Red band at the top
  const lidGeom = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, lidHeight, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = height / 2 - lidHeight / 2;
  root.add(lid);

  // Lid Top Cap (solid top)
  const lidTopGeom = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, 0.02, 32);
  const lidTop = new THREE.Mesh(lidTopGeom, lidMat);
  lidTop.position.y = height / 2 - 0.01;
  root.add(lidTop);

  // --- Handle ---
  // Integrated loop handle on the side of the lid
  // Using a Torus for the loop
  const handleRadius = 0.06;
  const handleTube = 0.025;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32);
  const handle = new THREE.Mesh(handleGeom, lidMat);
  // Position on the side of the lid
  handle.position.set(radius + 0.01 + handleRadius, lid.position.y, 0);
  // Rotate to be vertical loop on the side
  handle.rotation.z = Math.PI / 2;
  root.add(handle);

  // --- Beads ---
  // Fill the container with white spheres
  // Deterministic distribution using Golden Angle Spiral
  const beadCount = 150;
  const beadGeom = new THREE.SphereGeometry(beadRadius, 16, 16);
  const beadsMesh = new THREE.InstancedMesh(beadGeom, beadMat, beadCount);
  
  const dummy = new THREE.Object3D();
  const fillRadius = innerRadius - beadRadius - 0.01;
  const fillHeight = innerHeight - beadRadius * 2;
  const bottomY = -height / 2 + wallThickness + beadRadius;

  for (let i = 0; i < beadCount; i++) {
    // Golden angle spiral for even distribution in circle
    const theta = i * 2.399963229728653; // 2 * PI * (1 - 0.61803398875)
    const r = fillRadius * Math.sqrt(i / beadCount);
    
    // Height distribution: stack them up
    // Simple layer approach or random-ish height based on index
    // Let's use a deterministic pseudo-random height based on index to simulate packing
    const layer = Math.floor(i / 20); // Approx 20 beads per layer
    const y = bottomY + (i % 20) * (beadRadius * 1.8) + (Math.sin(i * 132.5) * 0.5 + 0.5) * beadRadius;
    
    // Clamp Y to be within bounds
    const clampedY = Math.min(y, height / 2 - wallThickness - beadRadius);

    dummy.position.set(
      Math.cos(theta) * r,
      clampedY,
      Math.sin(theta) * r
    );
    
    // Slight random rotation for variety (deterministic)
    dummy.rotation.set(
      (i * 0.5) % Math.PI,
      (i * 0.7) % Math.PI,
      (i * 0.3) % Math.PI
    );
    
    dummy.scale.setScalar(0.9 + (i % 5) * 0.02); // Slight size variation

    dummy.updateMatrix();
    beadsMesh.setMatrixAt(i, dummy.matrix);
  }
  
  root.add(beadsMesh);

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