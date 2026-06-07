export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bronze metal: warm, slightly rough, with emissive boost for the dim renderer.
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0xb87333,
    emissiveIntensity: 0.25,
  });

  // Darker bronze for shadows/crevices (hinges, lattice lines if needed)
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Glass for the inner candle chamber
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    opacity: 0.3,
    ior: 1.5,
  });

  // --- Dimensions ---
  const baseH = 0.18;
  const bodyH = 0.55;
  const domeH = 0.22;
  const totalH = baseH + bodyH + domeH;
  const hexRadius = 0.22; // Distance from center to corner
  const postRadius = 0.015;
  const railThickness = 0.025;

  // --- 1. Base ---
  // Flared bottom, narrowing to the body width.
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.28, 0.0),
    new THREE.Vector2(0.30, 0.05),
    new THREE.Vector2(0.24, 0.15),
    new THREE.Vector2(hexRadius + 0.02, baseH),
    new THREE.Vector2(0.0, baseH),
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, bronzeMat);
  root.add(base);

  // --- 2. Body Frame ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = baseH;
  root.add(bodyGroup);

  // Corner Posts (6 instances)
  const postGeom = new THREE.CylinderGeometry(postRadius, postRadius, bodyH, 12);
  const postMat = bronzeMat;
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * hexRadius;
    const z = Math.sin(angle) * hexRadius;
    const post = new THREE.Mesh(postGeom, postMat);
    post.position.set(x, bodyH / 2, z);
    bodyGroup.add(post);
  }

  // Top and Bottom Rails (Hexagonal rings made of 6 boxes each)
  const railLength = hexRadius * 1.15; // Approx side length of hex
  const railGeom = new THREE.BoxGeometry(railLength, railThickness, railThickness);
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * (hexRadius * 0.866); // Apothem
    const z = Math.sin(angle) * (hexRadius * 0.866);
    
    // Bottom Rail
    const bottomRail = new THREE.Mesh(railGeom, bronzeMat);
    bottomRail.position.set(x, 0, z);
    bottomRail.rotation.y = -angle;
    bodyGroup.add(bottomRail);

    // Top Rail
    const topRail = new THREE.Mesh(railGeom, bronzeMat);
    topRail.position.set(x, bodyH, z);
    topRail.rotation.y = -angle;
    bodyGroup.add(topRail);
  }

  // Lattice Panels (Wire mesh simulation using LineSegments)
  // We create one geometry for all lines to save draw calls, but positioning is tricky.
  // Instead, we'll use 6 Planes with a procedural grid texture for the "mesh" look.
  // This is cleaner and fits the "procedural texture" hint for patterns.
  
  const panelW = railLength;
  const panelH = bodyH - railThickness * 2;
  
  // Create a procedural grid texture
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Draw diagonal lines
      const u = x / texSize;
      const v = y / texSize;
      // Diagonal 1
      const d1 = Math.abs((u - v) * 20) % 2; 
      // Diagonal 2
      const d2 = Math.abs((u + v - 1) * 20) % 2;
      
      const isLine = (d1 < 0.15 || d2 < 0.15);
      
      if (isLine) {
        data[idx] = 139; // R
        data[idx+1] = 90; // G
        data[idx+2] = 43; // B
        data[idx+3] = 255; // A
      } else {
        data[idx] = 0;
        data[idx+1] = 0;
        data[idx+2] = 0;
        data[idx+3] = 0; // Transparent
      }
    }
  }
  const latticeTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  latticeTex.colorSpace = THREE.SRGBColorSpace;
  latticeTex.needsUpdate = true;
  latticeTex.wrapS = THREE.RepeatWrapping;
  latticeTex.wrapT = THREE.RepeatWrapping;
  latticeTex.repeat.set(4, 8); // Repeat pattern

  const latticeMat = new THREE.MeshStandardMaterial({
    map: latticeTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.4,
  });

  const latticeGeom = new THREE.PlaneGeometry(panelW * 0.9, panelH * 0.95);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = hexRadius * 0.866; // Apothem
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    
    const panel = new THREE.Mesh(latticeGeom, latticeMat);
    panel.position.set(x, bodyH / 2, z);
    panel.rotation.y = -angle;
    bodyGroup.add(panel);
  }

  // --- 3. Top Dome ---
  const domeGroup = new THREE.Group();
  domeGroup.position.y = baseH + bodyH;
  root.add(domeGroup);

  // Dome shape via Lathe
  const domeProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(hexRadius + 0.02, 0.0),
    new THREE.Vector2(hexRadius + 0.05, 0.05),
    new THREE.Vector2(0.15, 0.15),
    new THREE.Vector2(0.05, 0.20),
    new THREE.Vector2(0.0, 0.22),
  ];
  const domeGeom = new THREE.LatheGeometry(domeProfile, 32);
  const dome = new THREE.Mesh(domeGeom, bronzeMat);
  domeGroup.add(dome);

  // Finial (small ball on top)
  const finialGeom = new THREE.SphereGeometry(0.03, 16, 16);
  const finial = new THREE.Mesh(finialGeom, bronzeMat);
  finial.position.y = 0.22;
  domeGroup.add(finial);

  // --- 4. Handle ---
  // Attached to sides of the dome
  const handleRadius = 0.18;
  const handleTube = 0.012;
  // Torus is in XY plane. We need it in YZ plane (standing up).
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 8, 20, Math.PI);
  const handle = new THREE.Mesh(handleGeom, bronzeMat);
  handle.rotation.x = Math.PI / 2; // Lay flat in XZ
  handle.rotation.z = Math.PI / 2; // Stand up in YZ
  handle.position.y = 0.05; // Sit on top of dome rim
  domeGroup.add(handle);

  // Handle attachment points (small spheres on dome sides)
  const attachGeom = new THREE.SphereGeometry(0.025, 8, 8);
  const attachL = new THREE.Mesh(attachGeom, bronzeMat);
  attachL.position.set(-handleRadius - 0.02, 0.05, 0);
  domeGroup.add(attachL);
  
  const attachR = new THREE.Mesh(attachGeom, bronzeMat);
  attachR.position.set(handleRadius + 0.02, 0.05, 0);
  domeGroup.add(attachR);

  // --- 5. Inner Candle Cup ---
  // A glass cylinder inside the body
  const cupH = bodyH * 0.6;
  const cupR = hexRadius * 0.6;
  const cupGeom = new THREE.CylinderGeometry(cupR, cupR, cupH, 32, 1, true);
  const cup = new THREE.Mesh(cupGeom, glassMat);
  cup.position.y = baseH + (bodyH - cupH) / 2;
  root.add(cup);

  // --- 6. Hinges/Details ---
  // Small boxes on the corners to simulate door hinges
  const hingeGeom = new THREE.BoxGeometry(0.015, 0.04, 0.02);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * (hexRadius + postRadius);
    const z = Math.sin(angle) * (hexRadius + postRadius);
    
    // Top hinge
    const h1 = new THREE.Mesh(hingeGeom, darkBronzeMat);
    h1.position.set(x, baseH + bodyH - 0.1, z);
    h1.rotation.y = -angle;
    root.add(h1);

    // Bottom hinge
    const h2 = new THREE.Mesh(hingeGeom, darkBronzeMat);
    h2.position.set(x, baseH + 0.1, z);
    h2.rotation.y = -angle;
    root.add(h2);
  }

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