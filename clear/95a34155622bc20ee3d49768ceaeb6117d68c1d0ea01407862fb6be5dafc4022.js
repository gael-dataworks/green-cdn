export default function generate(THREE) {
  // --- Materials ---

  // Brass/Gold Case: High brightness via emissive, capped metalness
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.55,
    roughness: 0.35,
    emissive: 0xd4af37,
    emissiveIntensity: 0.35
  });

  // Dark Metal Hands
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.4
  });

  // Leather Strap
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    metalness: 0.0,
    roughness: 0.85
  });

  // Dial Background (Cream)
  const dialBaseMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    metalness: 0.0,
    roughness: 0.6
  });

  // Glass Crystal
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true
  });

  // Stitching Thread
  const threadMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.9
  });

  // --- Procedural Dial Texture (Vintage Map/Compass) ---
  const texSize = 512;
  const texData = new Uint8Array(texSize * texSize * 4);
  const cx = texSize / 2;
  const cy = texSize / 2;
  const maxR = texSize / 2 - 10;

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Base cream color
      let r = 245, g = 245, b = 220;

      // Add "aged paper" noise
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
      r -= noise; g -= noise; b -= noise;

      // Compass ticks (outer ring)
      if (dist > maxR * 0.85 && dist < maxR * 0.95) {
        const tickAngle = angle * (180 / Math.PI);
        // Major ticks every 30 deg, minor every 6
        if (Math.abs(tickAngle % 30) < 2 || Math.abs(tickAngle % 6) < 1) {
           r = 50; g = 50; b = 50;
        }
      }

      // Concentric grid lines
      if (Math.abs(dist % 40) < 2 && dist < maxR * 0.8) {
        r = 180; g = 160; b = 140;
      }

      // Radial "Map" lines (simulated coastlines using sine interference)
      const mapNoise = Math.sin(dist * 0.05 + angle * 3) * Math.cos(dist * 0.08 - angle * 2);
      if (mapNoise > 0.8) {
        r = 139; g = 110; b = 80; // Sepia lines
      }

      // Center pin hole
      if (dist < 10) {
        r = 50; g = 50; b = 50;
      }

      texData[idx] = r;
      texData[idx + 1] = g;
      texData[idx + 2] = b;
      texData[idx + 3] = 255;
    }
  }

  const dialTexture = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  dialTexture.colorSpace = THREE.SRGBColorSpace;
  dialTexture.needsUpdate = true;
  dialBaseMat.map = dialTexture;

  // --- Geometry Builders ---

  const root = new THREE.Group();

  // 1. Case Body
  const caseRadius = 0.26;
  const caseThickness = 0.05;
  const caseGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 64);
  const caseBody = new THREE.Mesh(caseGeom, caseMat);
  root.add(caseBody);

  // 2. Bezel (Torus)
  const bezelGeom = new THREE.TorusGeometry(caseRadius + 0.02, 0.015, 16, 64);
  const bezel = new THREE.Mesh(bezelGeom, caseMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = caseThickness / 2;
  root.add(bezel);

  // 3. Dial Face
  const dialGeom = new THREE.CylinderGeometry(caseRadius - 0.03, caseRadius - 0.03, 0.005, 64);
  const dialFace = new THREE.Mesh(dialGeom, dialBaseMat);
  dialFace.position.y = caseThickness / 2 + 0.0025;
  root.add(dialFace);

  // 4. Hands
  // Hour Hand
  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.002, 0.12);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.set(0, caseThickness / 2 + 0.006, 0);
  hourHand.rotation.z = Math.PI / 6; // 30 degrees
  root.add(hourHand);

  // Minute Hand
  const minHandGeom = new THREE.BoxGeometry(0.012, 0.002, 0.18);
  const minHand = new THREE.Mesh(minHandGeom, handMat);
  minHand.position.set(0, caseThickness / 2 + 0.008, 0);
  minHand.rotation.z = -Math.PI / 4; // -45 degrees
  root.add(minHand);

  // Second Hand (Thin needle)
  const secHandGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.22, 8);
  const secHand = new THREE.Mesh(secHandGeom, handMat);
  secHand.rotation.z = Math.PI / 2; // 90 degrees
  secHand.rotation.x = Math.PI / 2; // Lay flat
  secHand.position.set(0, caseThickness / 2 + 0.01, 0);
  root.add(secHand);

  // Center Pin
  const pinGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 16);
  const pin = new THREE.Mesh(pinGeom, caseMat);
  pin.position.y = caseThickness / 2 + 0.012;
  root.add(pin);

  // 5. Glass
  const glassGeom = new THREE.CylinderGeometry(caseRadius - 0.01, caseRadius - 0.01, 0.005, 64);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.y = caseThickness / 2 + 0.005;
  root.add(glass);

  // 6. Crown (Side knob at 3 o'clock)
  const crownGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const crown = new THREE.Mesh(crownGeom, caseMat);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(caseRadius + 0.01, 0, 0);
  root.add(crown);

  // 7. Lugs (Connectors for strap)
  const lugGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 16);
  const lugPositions = [
    { x: 0, z: caseRadius - 0.02, rot: 0 },    // Top
    { x: 0, z: -caseRadius + 0.02, rot: 0 },   // Bottom
  ];
  
  lugPositions.forEach(pos => {
    const lug = new THREE.Mesh(lugGeom, caseMat);
    lug.rotation.x = Math.PI / 2;
    lug.position.set(pos.x, 0, pos.z);
    root.add(lug);
  });

  // 8. Straps (Extruded along curve)
  // Define a rounded rectangle shape for the strap cross-section
  const strapShape = new THREE.Shape();
  const sw = 0.11; // strap width
  const st = 0.04; // strap thickness
  const r = 0.01;  // corner radius
  strapShape.moveTo(-sw/2 + r, -st/2);
  strapShape.lineTo(sw/2 - r, -st/2);
  strapShape.quadraticCurveTo(sw/2, -st/2, sw/2, -st/2 + r);
  strapShape.lineTo(sw/2, st/2 - r);
  strapShape.quadraticCurveTo(sw/2, st/2, sw/2 - r, st/2);
  strapShape.lineTo(-sw/2 + r, st/2);
  strapShape.quadraticCurveTo(-sw/2, st/2, -sw/2, st/2 - r);
  strapShape.lineTo(-sw/2, -st/2 + r);
  strapShape.quadraticCurveTo(-sw/2, -st/2, -sw/2 + r, -st/2);

  const strapExtrudeSettings = {
    steps: 20,
    bevelEnabled: false,
    extrudePath: null // Set per strap
  };

  // Top Strap (Curves up and back)
  const topPathPoints = [
    new THREE.Vector3(0, 0, caseRadius),
    new THREE.Vector3(0, 0.15, caseRadius + 0.1),
    new THREE.Vector3(0, 0.3, caseRadius + 0.05)
  ];
  const topPath = new THREE.CatmullRomCurve3(topPathPoints);
  strapExtrudeSettings.extrudePath = topPath;
  const topStrapGeom = new THREE.ExtrudeGeometry(strapShape, strapExtrudeSettings);
  const topStrap = new THREE.Mesh(topStrapGeom, leatherMat);
  // Center the extrusion (ExtrudeGeometry starts at origin relative to path start)
  // We need to shift it so the start aligns with the lug
  topStrap.position.copy(topPathPoints[0]);
  // Rotate to align with Z axis initially if needed, but CatmullRom handles orientation mostly
  // The shape is in XY plane, extruded along Z. Our path is in YZ plane.
  // We need to rotate the geometry 90 deg around X so the flat face is up/down?
  // Actually, Shape is XY. Extrude goes Z. Path is YZ.
  // So we need to rotate the mesh so local Z aligns with path tangent.
  // Easier: Define path in XY, extrude Z, then rotate whole mesh.
  // Let's just rotate the mesh to match the lugs.
  topStrap.rotation.x = Math.PI / 2; 
  topStrap.position.set(0, 0.02, caseRadius); // Start slightly above case
  root.add(topStrap);

  // Add stitching to top strap (small cylinders along edges)
  for(let i=0; i<5; i++) {
      const stitch = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.005, 8), threadMat);
      stitch.rotation.x = Math.PI / 2;
      stitch.position.set(-sw/2 + 0.01, 0.02 + i*0.06, caseRadius + 0.05);
      root.add(stitch);
      const stitch2 = stitch.clone();
      stitch2.position.set(sw/2 - 0.01, 0.02 + i*0.06, caseRadius + 0.05);
      root.add(stitch2);
  }

  // Bottom Strap (Curves down and forward)
  const botPathPoints = [
    new THREE.Vector3(0, 0, -caseRadius),
    new THREE.Vector3(0, -0.15, -caseRadius - 0.1),
    new THREE.Vector3(0, -0.3, -caseRadius - 0.05)
  ];
  const botPath = new THREE.CatmullRomCurve3(botPathPoints);
  strapExtrudeSettings.extrudePath = botPath;
  const botStrapGeom = new THREE.ExtrudeGeometry(strapShape, strapExtrudeSettings);
  const botStrap = new THREE.Mesh(botStrapGeom, leatherMat);
  botStrap.rotation.x = Math.PI / 2;
  botStrap.position.set(0, -0.02, -caseRadius);
  root.add(botStrap);

  // Stitching bottom
  for(let i=0; i<5; i++) {
      const stitch = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.005, 8), threadMat);
      stitch.rotation.x = Math.PI / 2;
      stitch.position.set(-sw/2 + 0.01, -0.02 - i*0.06, -caseRadius - 0.05);
      root.add(stitch);
      const stitch2 = stitch.clone();
      stitch2.position.set(sw/2 - 0.01, -0.02 - i*0.06, -caseRadius - 0.05);
      root.add(stitch2);
  }

  // 9. Buckle (on the end of the bottom strap roughly)
  const buckleGeom = new THREE.TorusGeometry(0.03, 0.004, 8, 16);
  const buckle = new THREE.Mesh(buckleGeom, caseMat);
  buckle.rotation.x = Math.PI / 2;
  buckle.position.set(0, -0.35, -caseRadius - 0.15);
  root.add(buckle);

  // Normalize
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