export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const radius = 0.24;
  const height = 0.42;
  const stavesCount = 16;
  
  // --- Materials ---
  // Light bamboo/wood color. Low metalness, moderate roughness.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb375,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Slightly darker wood for carved details to make them pop, 
  // or same material with normal offset. Let's use same material 
  // but rely on geometry depth.
  const carvingMat = woodMat;

  // --- Main Body (Staves) ---
  // Using a cylinder with open ends to represent the collection of staves.
  // We add a slight radius bump to simulate the roundness of staves.
  const bodyGeom = new THREE.CylinderGeometry(radius, radius, height, stavesCount, 1, true);
  const body = new THREE.Mesh(bodyGeom, woodMat);
  root.add(body);

  // --- Bottom Cap ---
  const bottomGeom = new THREE.CircleGeometry(radius, stavesCount);
  const bottom = new THREE.Mesh(bottomGeom, woodMat);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = -height / 2;
  root.add(bottom);

  // --- Bands (Rims) ---
  // Helper to create a horizontal band using TorusGeometry
  function createBand(r, tube, y) {
    const geom = new THREE.TorusGeometry(r, tube, 12, 32);
    const mesh = new THREE.Mesh(geom, woodMat);
    mesh.rotation.x = Math.PI / 2; // Lay flat in XZ plane
    mesh.position.y = y;
    return mesh;
  }

  // Top Rim (Thick)
  const topRim = createBand(radius + 0.015, 0.018, height / 2 - 0.01);
  root.add(topRim);

  // Middle Band (Thin strip)
  const midBand = createBand(radius + 0.008, 0.006, height / 2 - 0.06);
  root.add(midBand);

  // Bottom Band (Thick, holds the horizontal carving)
  const botBandY = -height / 2 + 0.04;
  const botBand = createBand(radius + 0.015, 0.022, botBandY);
  root.add(botBand);

  // --- Decorations (Carvings) ---
  const decorGroup = new THREE.Group();
  root.add(decorGroup);

  // 1. Vertical Vine Carving (Left Side)
  // Runs from below midBand to above botBand
  const vineStartY = height / 2 - 0.08;
  const vineEndY = -height / 2 + 0.08;
  const vineLength = vineStartY - vineEndY;
  const vineAngleBase = Math.PI * 0.6; // Left-ish side

  const vinePoints = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = vineStartY - t * vineLength;
    // Organic wiggle
    const angle = vineAngleBase + Math.sin(t * Math.PI * 4) * 0.15;
    const r = radius + 0.005; // Slightly above stave surface
    vinePoints.push(new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    ));
  }
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineGeom = new THREE.TubeGeometry(vineCurve, 20, 0.006, 8, false);
  const vineMesh = new THREE.Mesh(vineGeom, carvingMat);
  decorGroup.add(vineMesh);

  // Add leaves to vertical vine
  for (let i = 2; i < segments - 2; i += 3) {
    const t = i / segments;
    const angle = vineAngleBase + Math.sin(t * Math.PI * 4) * 0.15;
    const y = vineStartY - t * vineLength;
    const r = radius + 0.008;
    
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), carvingMat);
    leaf.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    leaf.scale.set(1, 0.4, 1); // Flatten
    leaf.lookAt(new THREE.Vector3(0, y, 0)); // Face center
    leaf.rotateZ(Math.PI / 2); // Orient along vine
    decorGroup.add(leaf);
  }

  // 2. Horizontal Floral Band (On Bottom Band)
  const hBandRadius = radius + 0.015 + 0.005; // On top of bottom band
  const hBandY = botBandY;
  const hPoints = [];
  const hSegments = 32;
  for (let i = 0; i <= hSegments; i++) {
    const angle = (i / hSegments) * Math.PI * 2;
    // Slight wave for organic vine look
    const rOffset = Math.sin(angle * 6) * 0.003; 
    hPoints.push(new THREE.Vector3(
      Math.cos(angle) * (hBandRadius + rOffset),
      hBandY,
      Math.sin(angle) * (hBandRadius + rOffset)
    ));
  }
  const hCurve = new THREE.CatmullRomCurve3(hPoints);
  const hVineGeom = new THREE.TubeGeometry(hCurve, 40, 0.005, 8, true); // Closed loop
  const hVineMesh = new THREE.Mesh(hVineGeom, carvingMat);
  decorGroup.add(hVineMesh);

  // Add flowers to horizontal band
  const flowerCount = 8;
  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI * 2;
    const r = hBandRadius + 0.005;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), carvingMat);
    flower.position.set(Math.cos(angle) * r, hBandY, Math.sin(angle) * r);
    flower.scale.set(1, 0.5, 1); // Flatten like a daisy
    flower.lookAt(new THREE.Vector3(0, hBandY, 0));
    decorGroup.add(flower);
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