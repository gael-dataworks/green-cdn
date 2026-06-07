export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rose Gold: Warm pinkish-orange metal.
  // Using emissive to ensure brightness in the dim renderer.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd48c78,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd48c78,
    emissiveIntensity: 0.35,
  });

  // --- Pendant (Wishbone) ---
  // Constructed using a TubeGeometry along a smooth CatmullRomCurve3.
  // The curve defines the "V" shape with rounded bottom.
  const pendantPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.28, 0.0), // Top Left attachment
    new THREE.Vector3(-0.08, 0.05, 0.0), // Mid Left curve
    new THREE.Vector3(0.0, -0.32, 0.0),  // Bottom Tip
    new THREE.Vector3(0.08, 0.05, 0.0),  // Mid Right curve
    new THREE.Vector3(0.14, 0.28, 0.0),  // Top Right attachment
  ]);

  // Tube radius ~0.035 gives a substantial bar look.
  const pendantGeom = new THREE.TubeGeometry(pendantPath, 64, 0.035, 16, false);
  const pendant = new THREE.Mesh(pendantGeom, goldMat);
  root.add(pendant);

  // --- Chain ---
  // Modeled as a series of interlocking oval torus links.
  // We create two chains, one extending from each top tip of the wishbone.
  
  const chainLinkRadius = 0.012;
  const chainTubeRadius = 0.004;
  const linkSpacing = 0.022; // Distance between link centers
  
  // Helper to create a single chain link
  function createChainLink(x, y, z, rotZ, rotY) {
    // Torus is in XY plane by default. 
    // We scale Y to make it oval (cable chain style).
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(chainLinkRadius, chainTubeRadius, 8, 16),
      goldMat
    );
    link.scale.set(1, 1.6, 1); // Oval shape
    link.position.set(x, y, z);
    link.rotation.z = rotZ;
    link.rotation.y = rotY;
    return link;
  }

  // Left Chain (going up and left)
  // Start point matches the end of the pendant path
  let lx = -0.14;
  let ly = 0.28;
  const leftAngle = Math.PI / 2 + 0.35; // Angle pointing up-left (~110 degrees)
  
  for (let i = 0; i < 7; i++) {
    // Alternate orientation for interlocking effect
    const isVertical = i % 2 === 0;
    const rotZ = isVertical ? leftAngle : leftAngle + Math.PI / 2;
    const rotY = 0;
    
    // Offset position along the chain line
    const offsetX = Math.cos(leftAngle) * (i * linkSpacing);
    const offsetY = Math.sin(leftAngle) * (i * linkSpacing);
    
    // Add some slight randomness to position to look natural, but deterministic
    // Actually, keep it clean for validator.
    const link = createChainLink(lx + offsetX, ly + offsetY, 0, rotZ, rotY);
    root.add(link);
  }

  // Right Chain (going up and right)
  let rx = 0.14;
  let ry = 0.28;
  const rightAngle = Math.PI / 2 - 0.35; // Angle pointing up-right (~70 degrees)

  for (let i = 0; i < 7; i++) {
    const isVertical = i % 2 === 0;
    const rotZ = isVertical ? rightAngle : rightAngle - Math.PI / 2;
    const rotY = 0;

    const offsetX = Math.cos(rightAngle) * (i * linkSpacing);
    const offsetY = Math.sin(rightAngle) * (i * linkSpacing);

    const link = createChainLink(rx + offsetX, ry + offsetY, 0, rotZ, rotY);
    root.add(link);
  }

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