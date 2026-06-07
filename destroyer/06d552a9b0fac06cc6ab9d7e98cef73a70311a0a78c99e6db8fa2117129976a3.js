export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Porcelain: Glossy white ceramic.
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.15,
  });

  // Gold: Metallic trim. Capped metalness at 0.5 per instructions.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.5,
    roughness: 0.25,
    emissive: 0xaa8800,
    emissiveIntensity: 0.2,
  });

  // Floral Materials
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffb7c5,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const petalDarkMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x558b2f,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Cup Body (Lathe) ---
  // Profile points (radius, height). Defines outer shell, rim, and inner hollow.
  const profilePoints = [
    new THREE.Vector2(0, 0),       // Bottom center
    new THREE.Vector2(0.13, 0),    // Foot outer edge
    new THREE.Vector2(0.13, 0.05), // Foot top
    new THREE.Vector2(0.11, 0.06), // Waist indent
    new THREE.Vector2(0.16, 0.14), // Belly max
    new THREE.Vector2(0.155, 0.22),// Rim outer top
    new THREE.Vector2(0.145, 0.22),// Rim inner top
    new THREE.Vector2(0.06, 0.16), // Inner wall curve
    new THREE.Vector2(0, 0.16),    // Inner bottom center
  ];
  
  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Ensure normals are correct for the hollow inside
  cupGeom.computeVertexNormals(); 
  
  const cupBody = new THREE.Mesh(cupGeom, porcelainMat);
  root.add(cupBody);

  // --- Gold Rims ---
  // Top Rim: Torus at rim height
  const rimTopGeom = new THREE.TorusGeometry(0.155, 0.004, 16, 32);
  const rimTop = new THREE.Mesh(rimTopGeom, goldMat);
  rimTop.rotation.x = Math.PI / 2;
  rimTop.position.y = 0.22;
  root.add(rimTop);

  // Bottom Foot Rim: Torus at foot base
  const rimBottomGeom = new THREE.TorusGeometry(0.13, 0.004, 16, 32);
  const rimBottom = new THREE.Mesh(rimBottomGeom, goldMat);
  rimBottom.rotation.x = Math.PI / 2;
  rimBottom.position.y = 0.005;
  root.add(rimBottom);

  // --- Handle ---
  // Curve from lower body to upper body, curving outward in +X
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, 0.11, 0),  // Attach lower
    new THREE.Vector3(0.24, 0.11, 0),  // Curve out
    new THREE.Vector3(0.26, 0.16, 0),  // Peak
    new THREE.Vector3(0.24, 0.21, 0),  // Curve in
    new THREE.Vector3(0.15, 0.21, 0),  // Attach upper
  ]);
  
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.012, 12, false);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  root.add(handle);

  // --- Floral Decoration (Surface-bound) ---
  // Helper to get radius and normal at a specific height on the cup profile
  function getCupSurfaceData(y) {
    // Interpolate between profile points to find radius and slope
    // We only care about the OUTER profile for decoration (points 0 to 5)
    const outerProfile = profilePoints.slice(0, 6);
    
    for (let i = 0; i < outerProfile.length - 1; i++) {
      const p1 = outerProfile[i];
      const p2 = outerProfile[i + 1];
      
      if (y >= p1.y && y <= p2.y) {
        const t = (y - p1.y) / (p2.y - p1.y || 0.001);
        const r = p1.x + (p2.x - p1.x) * t;
        
        // Tangent (dr, dy)
        const dr = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        // Normal (dy, -dr) normalized, pointing OUT
        const len = Math.sqrt(dy*dy + dr*dr);
        const nx = dy / len;
        const ny = -dr / len;
        
        return { r, nx, ny };
      }
    }
    // Fallback
    return { r: 0.15, nx: 1, ny: 0 };
  }

  // Helper to place a mesh on the surface
  function placeOnSurface(mesh, angle, y, offset = 0.002) {
    const data = getCupSurfaceData(y);
    const r = data.r + offset;
    
    // Position in 3D
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    mesh.position.set(x, y, z);
    
    // Orientation: Y-axis of mesh should align with surface normal
    // Surface normal in 3D: (nx * cos(a), ny, nx * sin(a))
    const normal = new THREE.Vector3(
      data.nx * Math.cos(angle),
      data.ny,
      data.nx * Math.sin(angle)
    ).normalize();
    
    // Tangent vector (along the circle)
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    
    // Bitangent (along the profile slope)
    const bitangent = new THREE.Vector3(
      -data.ny * Math.cos(angle),
      data.nx,
      -data.ny * Math.sin(angle)
    ).normalize();

    // Construct rotation matrix
    const m = new THREE.Matrix4();
    m.makeBasis(tangent, normal, bitangent); // X, Y, Z axes of local space
    
    // Apply rotation to mesh
    mesh.setRotationFromMatrix(m);
    
    // Randomize rotation around normal slightly for natural look
    mesh.rotateZ((angle * 10) % 1); 
  }

  const floralGroup = new THREE.Group();
  root.add(floralGroup);

  // Function to create a rose cluster
  function addRose(angle, y, scale) {
    const roseGroup = new THREE.Group();
    
    // Center
    const centerGeom = new THREE.CircleGeometry(0.015 * scale, 8);
    const center = new THREE.Mesh(centerGeom, petalDarkMat);
    center.rotation.x = -Math.PI / 2; // Face normal
    roseGroup.add(center);
    
    // Petals (2 rings)
    const petalGeom = new THREE.CircleGeometry(0.025 * scale, 8);
    
    // Inner petals
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(Math.cos(a) * 0.015 * scale, Math.sin(a) * 0.015 * scale, 0);
      petal.rotation.z = a + Math.PI / 2;
      petal.scale.set(1, 0.6, 1);
      roseGroup.add(petal);
    }
    
    // Outer petals
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.position.set(Math.cos(a) * 0.035 * scale, Math.sin(a) * 0.035 * scale, 0);
      petal.rotation.z = a + Math.PI / 2;
      petal.scale.set(1, 0.7, 1);
      roseGroup.add(petal);
    }
    
    placeOnSurface(roseGroup, angle, y);
    floralGroup.add(roseGroup);
  }

  // Function to add a leaf
  function addLeaf(angle, y, scale, rotOffset) {
    const leafGeom = new THREE.CircleGeometry(0.02 * scale, 8);
    const leaf = new THREE.Mesh(leafGeom, leafMat);
    leaf.scale.set(1, 0.4, 1);
    leaf.rotation.z = rotOffset;
    placeOnSurface(leaf, angle, y);
    floralGroup.add(leaf);
  }

  // Function to add a vine segment
  function addVine(angle1, y1, angle2, y2) {
    const pts = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = angle1 + (angle2 - angle1) * t;
      const y = y1 + (y2 - y1) * t;
      const data = getCupSurfaceData(y);
      const r = data.r + 0.002;
      pts.push(new THREE.Vector3(
        Math.cos(a) * r,
        y,
        Math.sin(a) * r
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.003, 6, false), vineMat);
    floralGroup.add(vine);
  }

  // --- Place Decorations ---
  // Main Rose Front
  addRose(0, 0.13, 1.0);
  addLeaf(0.3, 0.11, 1.2, 0.5);
  addLeaf(-0.3, 0.11, 1.2, -0.5);
  
  // Side Buds
  addRose(0.8, 0.15, 0.7);
  addLeaf(1.0, 0.14, 1.0, 0.2);
  
  addRose(-0.8, 0.15, 0.7);
  addLeaf(-1.0, 0.14, 1.0, -0.2);

  // Vines connecting them
  addVine(0, 0.13, 0.8, 0.15);
  addVine(0, 0.13, -0.8, 0.15);
  
  // Small scattered leaves
  addLeaf(0.5, 0.18, 0.8, 1.0);
  addLeaf(-0.5, 0.18, 0.8, -1.0);

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