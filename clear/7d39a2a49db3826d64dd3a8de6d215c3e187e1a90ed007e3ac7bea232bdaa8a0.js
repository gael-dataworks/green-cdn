export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark teal/green painted metal
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1f3a3a,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Frosted glowing glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    metalness: 0.0,
    roughness: 0.3,
    transmission: 0.85,
    transparent: true,
    opacity: 0.9,
    emissive: 0xaaccff,
    emissiveIntensity: 0.6,
  });

  // Black wire handle
  const wireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const baseH = 0.18;
  const baseR = 0.22;
  const globeH = 0.48;
  const globeR = 0.19;
  const topH = 0.16;
  const totalH = baseH + globeH + topH;

  // --- Base (Fuel Tank) ---
  const baseGeom = new THREE.CylinderGeometry(baseR * 0.85, baseR, baseH, 32);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.position.y = baseH / 2;
  root.add(base);

  // Base Rim / Collar
  const baseRimGeom = new THREE.TorusGeometry(baseR + 0.02, 0.015, 16, 48);
  const baseRim = new THREE.Mesh(baseRimGeom, metalMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = baseH;
  root.add(baseRim);

  // Wick Knob (on front of base)
  const knobGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
  const knob = new THREE.Mesh(knobGeom, metalMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, baseH * 0.6, baseR * 0.85 + 0.02);
  root.add(knob);

  // --- Globe (Glass) ---
  // Lathe profile for bulbous shape
  const profilePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.14, 0.05),
    new THREE.Vector2(0.19, 0.24),
    new THREE.Vector2(0.17, 0.43),
    new THREE.Vector2(0.12, 0.48),
    new THREE.Vector2(0, 0.48),
  ];
  const globeGeom = new THREE.LatheGeometry(profilePoints, 32);
  const globe = new THREE.Mesh(globeGeom, glassMat);
  globe.position.y = baseH + globeH / 2;
  root.add(globe);

  // --- Frame (Wire Cage) ---
  const frameGroup = new THREE.Group();
  
  // Vertical bars (4 sides)
  const barHeight = globeH + 0.04; // Connect base rim to top collar
  const barGeom = new THREE.CylinderGeometry(0.008, 0.008, barHeight, 8);
  const barPositions = [
    [globeR + 0.02, baseH - 0.02, 0],
    [-globeR - 0.02, baseH - 0.02, 0],
    [0, baseH - 0.02, globeR + 0.02],
    [0, baseH - 0.02, -globeR - 0.02],
  ];

  for (const [x, y, z] of barPositions) {
    const bar = new THREE.Mesh(barGeom, metalMat);
    bar.position.set(x, y + barHeight / 2, z);
    
    // Rotate bars to face center if needed, but cylinders are symmetric radially
    // However, we need to tilt them slightly to match the globe taper if strict,
    // but vertical is standard for lanterns.
    if (x !== 0) bar.rotation.z = Math.PI / 2;
    if (z !== 0) bar.rotation.x = Math.PI / 2;
    
    frameGroup.add(bar);
  }

  // Top Frame Ring (holds the vertical bars)
  const topRingR = globeR + 0.02;
  const topRingGeom = new THREE.TorusGeometry(topRingR, 0.012, 16, 48);
  const topRing = new THREE.Mesh(topRingGeom, metalMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = baseH + globeH - 0.02;
  frameGroup.add(topRing);

  // Bottom Frame Ring (sits on base rim)
  const botRingGeom = new THREE.TorusGeometry(topRingR, 0.012, 16, 48);
  const botRing = new THREE.Mesh(botRingGeom, metalMat);
  botRing.rotation.x = Math.PI / 2;
  botRing.position.y = baseH - 0.02;
  frameGroup.add(botRing);

  root.add(frameGroup);

  // --- Top Cap (Chimney/Vent) ---
  const topGroup = new THREE.Group();
  
  // Lower collar (wider)
  const collarGeom = new THREE.CylinderGeometry(topRingR + 0.01, topRingR + 0.01, 0.04, 32);
  const collar = new THREE.Mesh(collarGeom, metalMat);
  collar.position.y = 0.02;
  topGroup.add(collar);

  // Upper vent (tapered cylinder)
  const ventGeom = new THREE.CylinderGeometry(0.12, topRingR + 0.01, 0.12, 32);
  const vent = new THREE.Mesh(ventGeom, metalMat);
  vent.position.y = 0.04 + 0.12 / 2;
  topGroup.add(vent);

  // Top Lid (flat disc)
  const lidGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.015, 32);
  const lid = new THREE.Mesh(lidGeom, metalMat);
  lid.position.y = 0.04 + 0.12 + 0.0075;
  topGroup.add(lid);

  topGroup.position.y = baseH + globeH;
  root.add(topGroup);

  // --- Handle ---
  // Arching wire
  const handleRadius = 0.16;
  const handleTubeR = 0.012;
  // Torus is in XY plane by default. We want it in YZ plane (facing X) or XZ?
  // Lantern handle usually goes front-to-back or side-to-side. Image shows side-to-side arch.
  // So we rotate the torus 90 deg around Y to stand up, then 90 around Z to face front?
  // Actually, a Torus in XY plane:
  // Rotate X 90 -> XZ plane (flat on ground).
  // Rotate Z 90 -> YZ plane (standing up like a wheel).
  // We want an arch over the top.
  
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTubeR, 16, 32, Math.PI);
  const handle = new THREE.Mesh(handleGeom, wireMat);
  // Orient the half-torus to arch over the lantern
  handle.rotation.x = Math.PI / 2; // Lay flat in XZ
  handle.rotation.z = Math.PI / 2; // Stand up in YZ
  // Position at top center
  handle.position.set(0, baseH + globeH + topH + handleRadius, 0);
  
  // Attach handle ends to the frame/base area
  // The torus center is at the apex. The ends are at y=0 relative to handle mesh.
  // We need to lower it so ends touch the frame attachment points.
  // Attachment points are roughly at the top ring level.
  handle.position.y = (baseH + globeH) + handleRadius; 
  
  root.add(handle);

  // Handle attachment brackets (small loops on top cap)
  const bracketGeom = new THREE.TorusGeometry(0.02, 0.006, 8, 16);
  const bracketL = new THREE.Mesh(bracketGeom, metalMat);
  bracketL.rotation.y = Math.PI / 2;
  bracketL.position.set(-handleRadius, baseH + globeH + 0.05, 0);
  root.add(bracketL);

  const bracketR = new THREE.Mesh(bracketGeom, metalMat);
  bracketR.rotation.y = Math.PI / 2;
  bracketR.position.set(handleRadius, baseH + globeH + 0.05, 0);
  root.add(bracketR);

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