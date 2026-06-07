export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold metal: Brightened with emissive to avoid looking dark gray without env map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4af37,
    emissiveIntensity: 0.4,
  });

  // Aquamarine gem: Translucent, glass-like.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x40e0d0,       // Turquoise/Aquamarine base
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,    // High transparency
    ior: 1.55,             // Gemstone IOR
    transparent: true,
    thickness: 0.5,        // Volume thickness for refraction
  });

  // Inclusion/Raw edge material: Opaque, rough, light gray/white.
  const inclusionMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const stoneWidth = 0.50;
  const stoneLength = 0.70;
  const stoneHeight = 0.35;
  const bandThickness = 0.04;
  const bandRadius = 0.25;

  // --- Gemstone Construction ---
  const gemGroup = new THREE.Group();

  // 1. Pavilion (Bottom pyramid part)
  // Cylinder with 4 radial segments creates a pyramid.
  // We scale it to match the rectangular footprint.
  const pavilionGeom = new THREE.CylinderGeometry(0.01, stoneWidth * 0.6, stoneHeight * 0.6, 4);
  const pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  pavilion.scale.set(1, 1, stoneLength / stoneWidth); // Stretch to rectangle
  pavilion.rotation.y = Math.PI / 4; // Align square pyramid to rectangle
  pavilion.position.y = -stoneHeight * 0.3;
  gemGroup.add(pavilion);

  // 2. Crown (Top blocky part)
  // Using ExtrudeGeometry to get beveled/stepped edges typical of emerald cuts.
  const crownShape = new THREE.Shape();
  const w = stoneWidth / 2;
  const l = stoneLength / 2;
  crownShape.moveTo(-w, -l);
  crownShape.lineTo(w, -l);
  crownShape.lineTo(w, l);
  crownShape.lineTo(-w, l);
  crownShape.lineTo(-w, -l);

  const crownGeom = new THREE.ExtrudeGeometry(crownShape, {
    depth: stoneHeight * 0.6,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    steps: 1,
  });
  const crown = new THREE.Mesh(crownGeom, gemMat);
  crown.position.y = 0;
  gemGroup.add(crown);

  // 3. Table (Top flat facet)
  // A thin box on top to emphasize the flat table facet.
  const tableGeom = new THREE.BoxGeometry(stoneWidth * 0.6, 0.01, stoneLength * 0.6);
  const table = new THREE.Mesh(tableGeom, gemMat);
  table.position.y = stoneHeight * 0.3;
  gemGroup.add(table);

  // 4. Inclusions / Raw Edges
  // Add a few irregular chunks on one side to mimic the raw crystal look in the reference.
  const inclusion1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03, 0), inclusionMat);
  inclusion1.position.set(stoneWidth * 0.45, 0.05, stoneLength * 0.2);
  inclusion1.scale.set(1.5, 0.8, 2.0);
  inclusion1.rotation.set(0.5, 0.2, 0.1);
  gemGroup.add(inclusion1);

  const inclusion2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.02, 0), inclusionMat);
  inclusion2.position.set(stoneWidth * 0.48, -0.1, -stoneLength * 0.1);
  inclusion2.scale.set(1.2, 1.2, 1.5);
  gemGroup.add(inclusion2);
  
  const inclusion3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.015, 0), inclusionMat);
  inclusion3.position.set(-stoneWidth * 0.4, 0.1, stoneLength * 0.3);
  gemGroup.add(inclusion3);

  root.add(gemGroup);

  // --- Band Construction ---
  // Use TubeGeometry for a curved shank.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -bandRadius, -bandThickness),
    new THREE.Vector3(-bandRadius * 0.5, -bandRadius * 0.8, bandThickness),
    new THREE.Vector3(-bandRadius, 0, bandThickness * 2),
    new THREE.Vector3(-bandRadius * 0.5, bandRadius * 0.8, bandThickness),
    new THREE.Vector3(0, bandRadius, -bandThickness),
  ]);
  
  // We only want a partial ring, but Torus is easier for a simple C-shape if we hide the rest?
  // No, let's use a Torus segment logic or just a simple curved Tube.
  // Actually, a simple TorusGeometry cut or just positioned is easier for a ring shank.
  // Let's make a C-shaped tube using TubeGeometry and a semi-circle path.
  
  const shankPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -bandRadius, 0),
    new THREE.Vector3(-bandRadius * 0.7, -bandRadius * 0.7, 0),
    new THREE.Vector3(-bandRadius, 0, 0),
    new THREE.Vector3(-bandRadius * 0.7, bandRadius * 0.7, 0),
    new THREE.Vector3(0, bandRadius, 0),
  ]);

  const shankGeom = new THREE.TubeGeometry(shankPath, 20, bandThickness, 8, false);
  const shank = new THREE.Mesh(shankGeom, goldMat);
  // Position shank so the opening is at the bottom/back, stone sits on top.
  // The path above creates a C-shape in the XZ plane roughly. 
  // Let's orient it so the stone sits on the "top" of the C.
  shank.rotation.z = Math.PI / 2; // Lay flat in XY? No.
  // Let's rebuild the path for a standard ring orientation (Y up, finger hole along X? No, finger hole along Z usually for rings facing camera).
  // Standard ring: Band circles around Z axis? No, usually around Y or X.
  // Let's assume the ring sits on a finger along the X axis (hole is X).
  // So the band curves in the YZ plane.
  
  const bandPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -bandRadius, -bandRadius * 0.8), // Bottom back
    new THREE.Vector3(0, -bandRadius * 0.5, -bandRadius), // Bottom side
    new THREE.Vector3(0, 0, -bandRadius * 1.1),           // Bottom center (lowest point)
    new THREE.Vector3(0, bandRadius * 0.5, -bandRadius),  // Top side
    new THREE.Vector3(0, bandRadius, -bandRadius * 0.8),  // Top back
  ]);
  
  // Actually, simpler: A TorusGeometry is a full ring. We can just scale it or use a partial tube.
  // Let's use a TorusGeometry and scale it to look like a thick band, then position the stone on top.
  // But we only see part of the band. A partial tube is better.
  
  const pathPoints = [];
  const segments = 30;
  const angleStart = Math.PI * 0.2;
  const angleEnd = Math.PI * 0.8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = angleStart + (angleEnd - angleStart) * t;
    // Arc in YZ plane, centered at origin, radius bandRadius
    // x=0, y = r*cos(a), z = r*sin(a)
    // We want the top of the arc to be at +Y.
    pathPoints.push(new THREE.Vector3(0, Math.cos(angle) * bandRadius, Math.sin(angle) * bandRadius));
  }
  
  const bandCurve = new THREE.CatmullRomCurve3(pathPoints);
  const bandGeom = new THREE.TubeGeometry(bandCurve, 20, bandThickness, 12, false);
  const band = new THREE.Mesh(bandGeom, goldMat);
  // Rotate to align with stone. Stone is flat on XZ? No, stone face is usually up (Y).
  // The path above creates an arc in YZ plane. The top of the arc is at Y=bandRadius.
  // So the stone should sit at Y=bandRadius.
  root.add(band);

  // Position stone on top of the band arc
  gemGroup.position.y = bandRadius + bandThickness; 
  // Tilt the stone slightly to match the dynamic angle in the reference
  gemGroup.rotation.x = -0.3;
  gemGroup.rotation.z = 0.2;
  gemGroup.rotation.y = 0.5;

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