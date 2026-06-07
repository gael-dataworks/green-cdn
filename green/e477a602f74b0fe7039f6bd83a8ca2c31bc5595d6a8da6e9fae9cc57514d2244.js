export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold metal for the holder
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Off-white matte for the feather vanes
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // Slightly darker/greyer for the central rachis (shaft)
  const rachisMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- 1. Metal Holder (Lathe) ---
  // Profile points [radius, y] from bottom tip to top socket
  const metalProfile = [
    new THREE.Vector2(0.00, 0.00), // Tip
    new THREE.Vector2(0.04, 1.20), // End of needle taper
    new THREE.Vector2(0.10, 1.30), // Start of grip
    new THREE.Vector2(0.10, 1.80), // End of grip
    new THREE.Vector2(0.13, 1.90), // Ring 1 bottom
    new THREE.Vector2(0.13, 2.00), // Ring 1 top
    new THREE.Vector2(0.10, 2.05), // Gap
    new THREE.Vector2(0.13, 2.15), // Ring 2 bottom
    new THREE.Vector2(0.13, 2.25), // Ring 2 top
    new THREE.Vector2(0.11, 2.30), // Neck
    new THREE.Vector2(0.14, 2.50), // Flare at base of feather
    new THREE.Vector2(0.08, 2.60), // Top rim
  ];

  const metalGeom = new THREE.LatheGeometry(metalProfile, 32);
  const metalHolder = new THREE.Mesh(metalGeom, brassMat);
  // Center the metal part vertically so tip is at bottom
  metalHolder.position.y = -2.60; 
  root.add(metalHolder);

  // --- 2. Feather Shaft (Rachis) ---
  // Define a gentle curve for the feather
  // Starts at top of metal holder (0, 2.6, 0)
  const featherStart = new THREE.Vector3(0, 2.60, 0);
  const featherEnd = new THREE.Vector3(0, 5.80, 0.2);
  const control1 = new THREE.Vector3(0, 3.50, 0.1);
  const control2 = new THREE.Vector3(0, 4.50, -0.1);

  const rachisCurve = new THREE.CatmullRomCurve3([
    featherStart,
    control1,
    control2,
    featherEnd,
  ]);

  // The rachis is a thin tube along this curve
  const rachisGeom = new THREE.TubeGeometry(rachisCurve, 64, 0.015, 8, false);
  const featherRachis = new THREE.Mesh(rachisGeom, rachisMat);
  root.add(featherRachis);

  // --- 3. Feather Vanes (Custom BufferGeometry) ---
  // We construct the vanes manually to follow the curve and taper correctly
  const segments = 40;
  const positions = [];
  const indices = [];
  const uvs = [];
  
  // Helper to get width at a given t (0 to 1)
  // Bell curve skewed slightly towards the tip
  function getVaneWidth(t) {
    if (t < 0.05 || t > 0.95) return 0;
    // Skewed sine wave
    const skew = 0.6; 
    const val = Math.sin(Math.PI * Math.pow(t, skew));
    return val * 0.35; // Max width
  }

  // We need consistent normals to orient the vanes. 
  // Since the curve is mostly Y-up, we can use a fixed "up" vector to derive "side".
  const globalUp = new THREE.Vector3(0, 0, 1);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const point = new THREE.Vector3();

  // Store vertices for left and right sides
  const leftVerts = [];
  const rightVerts = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    rachisCurve.getPoint(t, point);
    rachisCurve.getTangent(t, tangent).normalize();

    // Calculate side vector (perpendicular to tangent and globalUp)
    side.crossVectors(tangent, globalUp).normalize();
    
    // If tangent is parallel to globalUp, cross product is zero. 
    // Fallback to another up vector if needed, but for this curve it's fine.
    if (side.lengthSq() < 0.001) {
      side.crossVectors(tangent, new THREE.Vector3(1, 0, 0)).normalize();
    }

    const width = getVaneWidth(t);
    
    // Add a slight "cup" rotation around the tangent
    // Rotate side vector by a small angle (e.g., 15 degrees) to make it concave
    const cupAngle = 0.2 * Math.sin(t * Math.PI); // Cup more in the middle
    const cosA = Math.cos(cupAngle);
    const sinA = Math.sin(cupAngle);
    
    // We need a normal vector to rotate around tangent. 
    // Let's use the curve's normal from Frenet frames if possible, or just approximate.
    // Simpler: Just offset in Z slightly based on width to create cup.
    // Actually, let's just displace along the 'side' vector and add a Z offset relative to the curve plane.
    // Since our curve is mostly in Y, and globalUp is Z, the 'side' is X.
    // So we are in XY plane roughly. Cupping means bending towards Z.
    
    const cupOffset = width * 0.15 * Math.sin(t * Math.PI); // Max cup in middle

    // Left vane point
    const leftPos = point.clone().add(side.clone().multiplyScalar(-width)).add(globalUp.clone().multiplyScalar(cupOffset));
    // Right vane point
    const rightPos = point.clone().add(side.clone().multiplyScalar(width)).add(globalUp.clone().multiplyScalar(cupOffset));

    leftVerts.push(leftPos);
    rightVerts.push(rightPos);

    // UVs
    uvs.push(t, 0); // Left
    uvs.push(t, 1); // Right
  }

  // Build geometry
  // Vertices: interleaved or separate? Let's do separate arrays for left and right strips, then merge.
  // Actually, let's just push to positions array directly.
  // Order: Left0, Right0, Left1, Right1... for triangle strip?
  // Better: Two triangles per quad segment.
  
  const geomPositions = [];
  const geomIndices = [];
  const geomUVs = [];

  for (let i = 0; i <= segments; i++) {
    geomPositions.push(leftVerts[i].x, leftVerts[i].y, leftVerts[i].z);
    geomPositions.push(rightVerts[i].x, rightVerts[i].y, rightVerts[i].z);
    geomUVs.push(i / segments, 0);
    geomUVs.push(i / segments, 1);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;       // Left i
    const b = i * 2 + 1;   // Right i
    const c = (i + 1) * 2; // Left i+1
    const d = (i + 1) * 2 + 1; // Right i+1

    // Triangle 1: a, b, c
    geomIndices.push(a, b, c);
    // Triangle 2: b, d, c
    geomIndices.push(b, d, c);
  }

  const vanesGeom = new THREE.BufferGeometry();
  vanesGeom.setAttribute('position', new THREE.Float32BufferAttribute(geomPositions, 3));
  vanesGeom.setAttribute('uv', new THREE.Float32BufferAttribute(geomUVs, 2));
  vanesGeom.setIndex(geomIndices);
  vanesGeom.computeVertexNormals();

  const featherVanes = new THREE.Mesh(vanesGeom, featherMat);
  root.add(featherVanes);

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