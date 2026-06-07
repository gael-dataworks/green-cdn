export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic material with procedural speckle texture
  const ceramicColor = 0xb58b65;
  const speckleSize = 256;
  const speckleData = new Uint8Array(speckleSize * speckleSize * 4);
  
  // Deterministic noise for glaze speckles
  for (let i = 0; i < speckleSize * speckleSize; i++) {
    const baseR = 181; // #b5
    const baseG = 139; // #8b
    const baseB = 101; // #65
    
    // Simple deterministic pseudo-random using sin
    const noise = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const absNoise = Math.abs(noise);
    
    // Add speckles (darker spots)
    const isSpeckle = absNoise > 0.85 ? 0.6 : 1.0;
    const isLightSpeckle = absNoise > 0.95 ? 1.3 : 1.0;

    speckleData[i * 4 + 0] = Math.min(255, baseR * isSpeckle * isLightSpeckle);
    speckleData[i * 4 + 1] = Math.min(255, baseG * isSpeckle * isLightSpeckle);
    speckleData[i * 4 + 2] = Math.min(255, baseB * isSpeckle * isLightSpeckle);
    speckleData[i * 4 + 3] = 255;
  }

  const ceramicTexture = new THREE.DataTexture(speckleData, speckleSize, speckleSize, THREE.RGBAFormat);
  ceramicTexture.colorSpace = THREE.SRGBColorSpace;
  ceramicTexture.needsUpdate = true;
  ceramicTexture.wrapS = THREE.RepeatWrapping;
  ceramicTexture.wrapT = THREE.RepeatWrapping;

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: ceramicColor,
    map: ceramicTexture,
    metalness: 0.0,
    roughness: 0.45,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Geometry: Bowl (Lathe) ---
  // Profile points (radius, y)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),   // Center bottom
    new THREE.Vector2(0.11, 0.00),   // Foot edge
    new THREE.Vector2(0.11, 0.04),   // Foot top
    new THREE.Vector2(0.13, 0.06),   // Start curve
    new THREE.Vector2(0.26, 0.20),   // Belly
    new THREE.Vector2(0.31, 0.25),   // Upper belly
    new THREE.Vector2(0.33, 0.26),   // Rim edge
    new THREE.Vector2(0.34, 0.265),  // Lip flare
    new THREE.Vector2(0.00, 0.265),  // Top center (closed for solid look)
  ];

  const bowlGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  root.add(bowl);

  // --- Geometry: Handle ---
  // Flat handle extending from the rim
  const handleShape = new THREE.Shape();
  handleShape.moveTo(0, -0.04);
  handleShape.lineTo(0.18, -0.04);
  handleShape.absarc(0.18, 0, 0.04, Math.PI * 1.5, Math.PI * 0.5, false); // Rounded end
  handleShape.lineTo(0, 0.04);
  handleShape.lineTo(0, -0.04);

  // Hole in handle (subtraction simulation via dark disc)
  // We will add a dark disc later, for now just the shape
  
  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });

  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  // Position handle at the rim (profile point index ~7 was rim edge)
  // Rim radius approx 0.33. Handle starts there.
  handle.position.set(0.33, 0.25, 0);
  handle.rotation.y = Math.PI / 2; // Point along X
  // The extrude goes along Z, we rotated Y, so it lies in XY plane? 
  // Extrude is +Z. Rotate Y 90 -> +X. Correct.
  // But the shape was drawn in XY. Extrude pushes to Z.
  // We want the flat face to be horizontal (XZ plane).
  // So rotate X 90 degrees.
  handle.rotation.x = Math.PI / 2;
  handle.rotation.y = 0; 
  // Let's re-orient:
  // Shape is in XY. Extrude is Z.
  // We want flat plate in XZ plane. So rotate X by 90.
  // Then position it at the rim.
  handle.rotation.set(Math.PI / 2, 0, 0);
  handle.position.set(0.33, 0.255, 0); // Slightly below rim top
  
  // Adjust handle position to connect smoothly
  // The shape starts at x=0. So mesh origin is at start of handle.
  // We placed mesh at rim.
  root.add(handle);

  // Handle Hole (Dark disc)
  const handleHole = new THREE.Mesh(new THREE.CircleGeometry(0.025, 16), darkMat);
  handleHole.position.set(0.33 + 0.18, 0.255, 0); // At the rounded end center
  handleHole.rotation.x = Math.PI / 2;
  handleHole.position.y -= 0.008; // Slightly inset
  root.add(handleHole);


  // --- Geometry: Holes on Bowl ---
  // We place small dark cylinders on the surface to simulate holes
  const holeGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16);
  
  // Define rows of holes based on Y height and approximate Radius from profile
  // Row 1: Low
  const rows = [
    { y: 0.08, r: 0.16, count: 8 },
    { y: 0.14, r: 0.22, count: 12 },
    { y: 0.20, r: 0.28, count: 16 },
    { y: 0.24, r: 0.31, count: 20 }
  ];

  rows.forEach(row => {
    for (let i = 0; i < row.count; i++) {
      const angle = (i / row.count) * Math.PI * 2;
      const x = Math.cos(angle) * row.r;
      const z = Math.sin(angle) * row.r;
      
      const hole = new THREE.Mesh(holeGeom, darkMat);
      hole.position.set(x, row.y, z);
      
      // Orient hole to face outward radially
      hole.lookAt(new THREE.Vector3(x * 2, row.y, z * 2));
      // Cylinder default is Y-up. lookAt makes Y point to target.
      // We want the cylinder axis (Y) to point radially outward.
      // lookAt(x*2, y, z*2) from (x,y,z) points along the normal.
      
      // Push slightly inward so it looks like a hole, not a bump
      // Actually, for a solid bowl, a dark cylinder ON the surface looks like a hole 
      // if the lighting is right, but pushing it slightly *into* the geometry is better.
      // Since we can't boolean, we just place it on the surface.
      // To make it look like a hole, we rely on the dark material.
      
      root.add(hole);
    }
  });

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