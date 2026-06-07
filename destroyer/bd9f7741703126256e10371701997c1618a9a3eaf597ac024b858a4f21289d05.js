export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Gold band material - polished metal
  // Using emissive to brighten the gold as per metal brightness rules
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3
  });

  // Gemstone material - Teal/Aquamarine slice
  // Using MeshPhysicalMaterial for transmission/glass effect
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x7fffd4,       // Aquamarine base
    metalness: 0.1,
    roughness: 0.3,
    transmission: 0.7,     // Semi-transparent
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });

  // --- Procedural Texture for Inclusions/Cracks ---
  // Simulates the white matrix/cracks seen in the raw slice
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Fill base with transparent teal-ish noise
  for (let i = 0; i < texSize * texSize; i++) {
    const stride = i * 4;
    // Base color: light teal
    data[stride] = 127;     // R
    data[stride + 1] = 255; // G
    data[stride + 2] = 220; // B
    data[stride + 3] = 200; // Alpha (semi-opaque base)
  }

  // Draw deterministic "cracks" using sine waves and lines
  // We iterate over pixels to draw lines
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const stride = (y * texSize + x) * 4;
      
      // Crack 1: Diagonal jagged line
      const crack1Y = x * 0.8 + 50 * Math.sin(x * 0.05);
      const dist1 = Math.abs(y - crack1Y);
      if (dist1 < 8) {
        const alpha = 255 * (1 - dist1 / 8);
        // White inclusion
        data[stride] = 255;
        data[stride + 1] = 255;
        data[stride + 2] = 255;
        data[stride + 3] = Math.max(data[stride + 3], alpha);
      }

      // Crack 2: Another diagonal
      const crack2Y = x * 1.2 - 20 + 30 * Math.sin(x * 0.08);
      const dist2 = Math.abs(y - crack2Y);
      if (dist2 < 6) {
        const alpha = 255 * (1 - dist2 / 6);
        data[stride] = 240;
        data[stride + 1] = 250;
        data[stride + 2] = 255;
        data[stride + 3] = Math.max(data[stride + 3], alpha);
      }
      
      // Speckles
      if (Math.sin(x * 0.5) * Math.cos(y * 0.5) > 0.95) {
         data[stride] = 255;
         data[stride + 1] = 255;
         data[stride + 2] = 255;
         data[stride + 3] = 180;
      }
    }
  }

  const inclusionMap = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  inclusionMap.colorSpace = THREE.SRGBColorSpace;
  inclusionMap.needsUpdate = true;
  inclusionMap.wrapS = THREE.ClampToEdgeWrapping;
  inclusionMap.wrapT = THREE.ClampToEdgeWrapping;
  
  gemMat.map = inclusionMap;
  // Use the map for opacity as well to make cracks more solid
  gemMat.alphaMap = inclusionMap; 
  gemMat.transparent = true;


  // --- Geometry Construction ---

  // 1. Ring Band
  // TorusGeometry(radius, tube, radialSegments, tubularSegments)
  // We want a flat band, so tube is small relative to radius, but we rotate it.
  const bandRadius = 0.18;
  const bandTube = 0.025;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 32);
  const band = new THREE.Mesh(bandGeom, goldMat);
  // Torus lies in XY plane by default. We need it to sit flat on XZ (like a ring on a table)
  // But actually for a ring worn on finger, the hole is along Y. 
  // Standard ring orientation: Hole along Y. Band circles XZ plane.
  // Torus default is XY plane. Rotate X by 90 deg (PI/2) to make it lie in XZ.
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.02; // Slightly up so stone sits on top
  root.add(band);

  // 2. Gemstone
  // Rectangular slice. BoxGeometry is best.
  const stoneW = 0.28;
  const stoneD = 0.18;
  const stoneH = 0.06;
  
  // Use two boxes to simulate the "step cut" or layered depth of a slice
  // Base layer (larger, slightly darker/more opaque)
  const baseGeom = new THREE.BoxGeometry(stoneW, stoneH * 0.8, stoneD);
  const baseMesh = new THREE.Mesh(baseGeom, gemMat);
  
  // Top layer (smaller, clearer) - creates the facet look
  const topGeom = new THREE.BoxGeometry(stoneW * 0.85, stoneH * 0.6, stoneD * 0.85);
  const topMesh = new THREE.Mesh(topGeom, gemMat);
  topMesh.position.y = stoneH * 0.5; // Sit on top of base

  const stoneGroup = new THREE.Group();
  stoneGroup.add(baseMesh);
  stoneGroup.add(topMesh);

  // Position stone above the band
  stoneGroup.position.y = bandRadius + bandTube + (stoneH * 0.5);
  
  // Tilt the stone to match the reference angle
  // Reference shows it tilted back and slightly rotated
  stoneGroup.rotation.x = -0.4; 
  stoneGroup.rotation.z = 0.3;
  stoneGroup.rotation.y = 0.2;

  root.add(stoneGroup);

  // 3. Prongs/Setting (Optional but adds realism)
  // Small gold beads at corners to hold the stone
  const prongGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const prongPositions = [
    [stoneW/2, 0, stoneD/2],
    [-stoneW/2, 0, stoneD/2],
    [stoneW/2, 0, -stoneD/2],
    [-stoneW/2, 0, -stoneD/2]
  ];

  prongPositions.forEach(pos => {
    const prong = new THREE.Mesh(prongGeom, goldMat);
    // Apply stone group rotation/position to prongs so they stick to stone
    // Actually easier to add prongs to stoneGroup and position locally
    prong.position.set(pos[0], pos[1], pos[2]);
    // Adjust Y to be halfway up the stone
    prong.position.y = 0; 
    stoneGroup.add(prong);
  });

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