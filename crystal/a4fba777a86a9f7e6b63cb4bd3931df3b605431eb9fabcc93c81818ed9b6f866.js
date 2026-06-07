export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const handleWoodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  const leafWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const handleRadius = 0.045;
  const handleLength = 1.2;
  const gripStart = -0.5;
  const gripLength = 0.25;
  const gripRadius = handleRadius + 0.005;
  const ringCount = 12;
  const ringThickness = 0.004;
  const ringGap = gripLength / ringCount;

  const neckHeight = 0.35;
  const neckRadius = 0.035;
  
  const leafLength = 0.7;
  const leafWidth = 0.28;
  const leafThickness = 0.015;

  // --- 1. Handle Shaft ---
  const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleLength, 24);
  const handle = new THREE.Mesh(handleGeom, handleWoodMat);
  handle.position.y = 0;
  root.add(handle);

  // --- 2. Grip Winding ---
  // Modeled as a series of thin black rings
  const ringGeom = new THREE.CylinderGeometry(gripRadius, gripRadius, ringThickness, 24);
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(ringGeom, blackMat);
    // Position rings along the grip section
    const y = gripStart + (i * ringGap) + (ringGap / 2);
    ring.position.y = y;
    root.add(ring);
  }

  // --- 3. Base Cap ---
  const capGeom = new THREE.SphereGeometry(handleRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(capGeom, blackMat);
  cap.position.y = -handleLength / 2;
  cap.rotation.x = Math.PI; // Flip to cover bottom
  root.add(cap);

  // --- 4. Neck (Curved Stem) ---
  // Curve from top of handle (0, handleLength/2, 0) curving back and up
  const curvePoints = [];
  const startPoint = new THREE.Vector3(0, handleLength / 2, 0);
  const endPoint = new THREE.Vector3(0, handleLength / 2 + neckHeight, -0.15);
  const controlPoint = new THREE.Vector3(0, handleLength / 2 + neckHeight * 0.5, -0.1);
  
  // Using a simple quadratic bezier approximation with CatmullRom
  curvePoints.push(startPoint);
  curvePoints.push(controlPoint);
  curvePoints.push(endPoint);
  
  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const neckGeom = new THREE.TubeGeometry(curve, 20, neckRadius, 16, false);
  const neck = new THREE.Mesh(neckGeom, blackMat);
  root.add(neck);

  // --- 5. Leaf Blade ---
  // Create a leaf shape
  const leafShape = new THREE.Shape();
  // Start at stem connection
  leafShape.moveTo(0, -leafLength / 2);
  // Curve out to max width
  leafShape.bezierCurveTo(leafWidth * 0.8, -leafLength * 0.2, leafWidth * 1.2, leafLength * 0.3, 0, leafLength / 2);
  // Curve back
  leafShape.bezierCurveTo(-leafWidth * 1.2, leafLength * 0.3, -leafWidth * 0.8, -leafLength * 0.2, 0, -leafLength / 2);

  const leafExtrudeSettings = {
    steps: 1,
    depth: leafThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2
  };

  const leafGeom = new THREE.ExtrudeGeometry(leafShape, leafExtrudeSettings);
  // Center the geometry
  leafGeom.center();
  
  // Generate a procedural texture for the leaf wood grain and veins
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = new THREE.Color(0xc4a484); // Light wood
  const veinColor = new THREE.Color(0x5c4033); // Dark brown
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Normalize coordinates -1 to 1
      const nx = (x / texSize) * 2 - 1;
      const ny = (y / texSize) * 2 - 1;
      
      // Base noise for wood grain
      const noise = Math.sin(nx * 20 + ny * 5) * 0.1;
      
      // Central vein (midrib)
      const midribDist = Math.abs(nx);
      let isVein = midribDist < 0.05;
      
      // Side veins (branching out)
      // Simple pattern: lines radiating from center
      const angle = Math.atan2(ny, Math.abs(nx) + 0.01);
      // Create a few main side veins
      const veinAngle1 = 0.5;
      const veinAngle2 = 1.0;
      const distFromV1 = Math.abs(angle - veinAngle1);
      const distFromV2 = Math.abs(angle - veinAngle2);
      
      if (distFromV1 < 0.05 || distFromV2 < 0.05) isVein = true;

      let r = baseColor.r + noise;
      let g = baseColor.g + noise;
      let b = baseColor.b + noise;

      if (isVein) {
        r = veinColor.r;
        g = veinColor.g;
        b = veinColor.b;
      }

      data[i] = Math.floor(r * 255);
      data[i + 1] = Math.floor(g * 255);
      data[i + 2] = Math.floor(b * 255);
      data[i + 3] = 255;
    }
  }

  const leafTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  leafTexture.colorSpace = THREE.SRGBColorSpace;
  leafTexture.needsUpdate = true;
  leafWoodMat.map = leafTexture;

  const leaf = new THREE.Mesh(leafGeom, leafWoodMat);
  
  // Position leaf at the end of the neck
  // The neck ends roughly at (0, handleLength/2 + neckHeight, -0.15)
  // We need to rotate the leaf to match the curve tangent
  leaf.position.set(0, handleLength / 2 + neckHeight, -0.15);
  // Rotate to face backwards and up slightly
  leaf.rotation.x = -0.5; 
  leaf.rotation.y = Math.PI; // Face the other way if needed, adjust based on shape orientation
  
  // The extrude shape is in XY plane. We want it vertical-ish.
  // Default extrude is +Z depth. 
  // Let's orient it so the flat face is towards the viewer/side.
  leaf.rotation.z = Math.PI / 2; // Make it stand up like a fin
  
  root.add(leaf);

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