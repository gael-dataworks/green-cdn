export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light wood (bamboo/pine style)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb376,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Slightly darker wood for contrast on bands/carvings if needed, 
  // but keeping it uniform looks more like a single piece of wood.
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb89056,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Dimensions ---
  const bucketRadius = 0.32;
  const bucketHeight = 0.55;
  const staveCount = 24;
  const staveWidth = (Math.PI * 2 * bucketRadius) / staveCount;
  const staveThickness = 0.015;
  
  // --- 1. Staves (Body) ---
  // We create individual planks to simulate the bucket construction
  const staveGeom = new THREE.BoxGeometry(staveWidth + 0.002, bucketHeight, staveThickness);
  
  for (let i = 0; i < staveCount; i++) {
    const angle = (i / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(staveGeom, woodMat);
    
    // Position on the circle
    stave.position.x = Math.cos(angle) * bucketRadius;
    stave.position.z = Math.sin(angle) * bucketRadius;
    stave.position.y = 0; // Centered vertically
    
    // Rotate to face outward
    stave.rotation.y = -angle;
    
    root.add(stave);
  }

  // --- 2. Base ---
  const baseGeom = new THREE.CylinderGeometry(bucketRadius - staveThickness, bucketRadius - staveThickness, 0.02, 32);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = -bucketHeight / 2 - 0.01;
  root.add(base);

  // --- 3. Rim (Top Ring) ---
  // A thick torus to represent the top rim
  const rimRadius = bucketRadius + staveThickness / 2;
  const rimTube = 0.025;
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 64);
  const rim = new THREE.Mesh(rimGeom, woodMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = bucketHeight / 2 - rimTube; // Sit on top
  root.add(rim);

  // --- 4. Bands (Holding the staves) ---
  // Top Band
  const bandTube = 0.012;
  const bandRadius = bucketRadius + staveThickness + bandTube * 0.5;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 64);
  
  const topBand = new THREE.Mesh(bandGeom, darkWoodMat);
  topBand.rotation.x = Math.PI / 2;
  topBand.position.y = bucketHeight / 2 - 0.08;
  root.add(topBand);

  // Bottom Band
  const bottomBand = new THREE.Mesh(bandGeom, darkWoodMat);
  bottomBand.rotation.x = Math.PI / 2;
  bottomBand.position.y = -bucketHeight / 2 + 0.08;
  root.add(bottomBand);

  // --- 5. Handle ---
  // Simple arch handle on the side
  const handleRadius = 0.18;
  const handleTube = 0.015;
  // Torus is in XY plane by default. We need it in YZ plane (rotated 90 deg around Z)
  // And positioned on the side.
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 8, 32, Math.PI); // Half torus
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.rotation.z = Math.PI / 2; // Stand it up
  handle.rotation.y = Math.PI / 2; // Face outward along X
  handle.position.set(bucketRadius + staveThickness, bucketHeight / 2 - 0.05, 0);
  root.add(handle);

  // Handle attachment knobs
  const knobGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const knobLeft = new THREE.Mesh(knobGeom, darkWoodMat);
  knobLeft.position.set(bucketRadius + staveThickness, bucketHeight / 2 - 0.05, handleRadius);
  root.add(knobLeft);
  
  const knobRight = new THREE.Mesh(knobGeom, darkWoodMat);
  knobRight.position.set(bucketRadius + staveThickness, bucketHeight / 2 - 0.05, -handleRadius);
  root.add(knobRight);

  // --- 6. Carved Decorations (Procedural Surface Relief) ---
  // We simulate the carvings using thin tubes and flattened spheres placed on the surface.
  // Material: Same wood, maybe slightly darker to show depth via shadow, or just same.
  const carvingMat = new THREE.MeshStandardMaterial({
    color: 0xc49b5a,
    metalness: 0.0,
    roughness: 0.7,
  });

  const carvingGroup = new THREE.Group();
  const carveRadius = bucketRadius + staveThickness + 0.005; // Slightly outside surface

  // Helper to create a vine segment on the cylinder surface
  function addVineSegment(startAngle, startH, endAngle, endH, thickness) {
    const points = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = startAngle + (endAngle - startAngle) * t;
      const h = startH + (endH - startH) * t;
      // Add some sine wave wiggle for organic look
      const wiggle = Math.sin(t * Math.PI * 4) * 0.02;
      const r = carveRadius + wiggle;
      
      points.push(new THREE.Vector3(
        Math.cos(a) * r,
        h,
        Math.sin(a) * r
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, thickness, 8, false),
      carvingMat
    );
    carvingGroup.add(tube);
  }

  // Helper to add a flower/leaf
  function addFlower(angle, h, scale) {
    const x = Math.cos(angle) * carveRadius;
    const z = Math.sin(angle) * carveRadius;
    
    // Center
    const center = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.04, 8, 8), carvingMat);
    center.position.set(x, h, z);
    carvingGroup.add(center);

    // Petals (flattened spheres)
    for (let i = 0; i < 5; i++) {
      const pa = (i / 5) * Math.PI * 2;
      const px = x + Math.cos(pa) * scale * 0.03;
      const pz = z + Math.sin(pa) * scale * 0.03;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.025, 8, 8), carvingMat);
      petal.scale.set(1, 0.4, 1); // Flatten
      petal.position.set(px, h, pz);
      carvingGroup.add(petal);
    }
  }

  // --- Vertical Carving Panel (Left Side) ---
  // Approximate the vertical vine pattern seen in the image
  // It runs from near bottom band to near top band
  const vStartH = -bucketHeight / 2 + 0.15;
  const vEndH = bucketHeight / 2 - 0.15;
  const vAngle = Math.PI; // Back/Side
  
  // Main vertical stem
  addVineSegment(vAngle - 0.1, vStartH, vAngle + 0.1, vEndH, 0.008);
  
  // Leaves/Flowers along the vertical stem
  addFlower(vAngle, vStartH + 0.05, 1.2);
  addFlower(vAngle, vStartH + 0.15, 0.8);
  addFlower(vAngle, vStartH + 0.30, 1.0);
  addFlower(vAngle, vEndH - 0.10, 0.9);

  // --- Horizontal Carving Band (Lower Section) ---
  // Wraps around the front/sides
  const hBandH = -bucketHeight / 2 + 0.12;
  const hStartAngle = Math.PI * 0.6;
  const hEndAngle = Math.PI * 1.4;
  
  addVineSegment(hStartAngle, hBandH, hEndAngle, hBandH + 0.02, 0.009);
  
  // Flowers on horizontal band
  addFlower(Math.PI, hBandH, 1.0);
  addFlower(Math.PI * 0.8, hBandH + 0.01, 0.7);
  addFlower(Math.PI * 1.2, hBandH + 0.01, 0.7);

  root.add(carvingGroup);

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