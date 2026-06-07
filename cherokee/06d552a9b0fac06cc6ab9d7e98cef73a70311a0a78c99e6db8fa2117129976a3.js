export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic: Glossy white.
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.25,
  });

  // Gold: Shiny metal. Capped metalness, added emissive for brightness.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // Floral: Pink for roses, Green for leaves.
  const roseMat = new THREE.MeshStandardMaterial({
    color: 0xff88aa,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const roseDarkMat = new THREE.MeshStandardMaterial({
    color: 0xcc4466,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x558855,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x669966,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Cup Body (Lathe) ---
  // Profile from bottom center (0,0) up to top rim.
  // x = radius, y = height
  const profilePoints = [
    new THREE.Vector2(0, 0),          // Bottom center
    new THREE.Vector2(0.18, 0),       // Foot bottom edge
    new THREE.Vector2(0.16, 0.05),    // Foot curve in
    new THREE.Vector2(0.14, 0.10),    // Base of bowl
    new THREE.Vector2(0.22, 0.35),    // Widest part of bowl
    new THREE.Vector2(0.24, 0.48),    // Just below rim
    new THREE.Vector2(0.25, 0.50),    // Rim edge
    new THREE.Vector2(0.23, 0.50),    // Rim thickness start (inner)
    new THREE.Vector2(0.21, 0.48),    // Inner wall start
    new THREE.Vector2(0.10, 0.10),    // Inner bottom curve
    new THREE.Vector2(0, 0.10),       // Inner bottom center
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Fix normals for smooth shading
  cupGeom.computeVertexNormals();
  const cupBody = new THREE.Mesh(cupGeom, ceramicMat);
  root.add(cupBody);

  // --- Gold Rim (Top) ---
  // Torus rotated to lie flat on XZ plane at top of cup
  const rimTop = new THREE.Mesh(
    new THREE.TorusGeometry(0.245, 0.008, 16, 64),
    goldMat
  );
  rimTop.rotation.x = Math.PI / 2;
  rimTop.position.y = 0.50;
  root.add(rimTop);

  // --- Gold Band (Bottom Foot) ---
  const rimBottom = new THREE.Mesh(
    new THREE.TorusGeometry(0.175, 0.006, 16, 64),
    goldMat
  );
  rimBottom.rotation.x = Math.PI / 2;
  rimBottom.position.y = 0.02;
  root.add(rimBottom);

  // --- Handle (Tube) ---
  // Scroll shape attached to the side (+X)
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.45, 0.05),  // Top attach (slightly back)
    new THREE.Vector3(0.35, 0.48, 0.08),  // Top loop out
    new THREE.Vector3(0.38, 0.35, 0.05),  // Mid curve
    new THREE.Vector3(0.32, 0.20, 0.02),  // Lower curve in
    new THREE.Vector3(0.24, 0.15, 0.0),   // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.018, 12, false);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  root.add(handle);

  // --- Floral Decals (Surface Bound) ---
  // Helper to get radius of cup at a given Y height (approximate from profile)
  function getCupRadius(y) {
    if (y < 0.10) return 0.14 + (y - 0.10) * 0.8; // Tapering up from foot
    if (y < 0.35) return 0.14 + (y - 0.10) * 0.32; // Expanding bowl
    if (y < 0.48) return 0.22 + (y - 0.35) * 0.15; // Upper bowl
    return 0.24; // Rim
  }

  // Helper to place a mesh on the surface
  function placeOnSurface(mesh, angle, y, scale = 1) {
    const r = getCupRadius(y) + 0.005; // Slight offset
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    
    // Orient to face outward
    const normal = new THREE.Vector3(x, 0, z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), // Default face direction for flat shapes
      normal
    );
    mesh.quaternion.copy(quaternion);
    
    // Rotate around normal to align vertically (up is Y)
    // The setFromUnitVectors aligns Z to Normal. We need Y to remain roughly Y.
    // A simple rotation around the new local Z might be needed, but for flowers 
    // random rotation around normal is often fine. Let's align 'up' of the flower to world Y.
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    
    // Construct matrix manually for precise orientation
    const m = new THREE.Matrix4();
    m.makeBasis(tangent, binormal, normal);
    mesh.quaternion.setFromRotationMatrix(m);
    
    root.add(mesh);
  }

  // Create a simple rose shape (group of petals)
  function createRose() {
    const roseGroup = new THREE.Group();
    // Center
    const center = new THREE.Mesh(new THREE.CircleGeometry(0.015, 16), roseDarkMat);
    roseGroup.add(center);
    // Petals
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), roseMat);
      petal.position.set(Math.cos(angle) * 0.015, Math.sin(angle) * 0.015, 0);
      petal.rotation.z = angle + Math.PI / 2;
      petal.scale.y = 0.6;
      roseGroup.add(petal);
    }
    return roseGroup;
  }

  // Create a leaf shape
  function createLeaf() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.01, 0.02, 0.01, 0.04, 0, 0.06);
    shape.bezierCurveTo(-0.01, 0.04, -0.01, 0.02, 0, 0);
    const geom = new THREE.ShapeGeometry(shape);
    return new THREE.Mesh(geom, leafMat);
  }

  // --- Place Decorations ---
  // Main rose on the front (-Z side usually, but let's put it at angle 0 for +Z facing)
  // Image shows rose on the side/front. Let's place one at angle 0 (front)
  const mainRose = createRose();
  placeOnSurface(mainRose, 0, 0.28, 1.8);

  // Leaves around the main rose
  const leaf1 = createLeaf();
  placeOnSurface(leaf1, -0.3, 0.32, 1.5);
  leaf1.rotation.z = -0.5; // Tilt leaf

  const leaf2 = createLeaf();
  placeOnSurface(leaf2, 0.3, 0.25, 1.5);
  leaf2.rotation.z = 0.5;

  // Smaller buds/flowers on the sides
  const sideRose1 = createRose();
  placeOnSurface(sideRose1, -1.2, 0.30, 1.0);
  
  const sideRose2 = createRose();
  placeOnSurface(sideRose2, 1.2, 0.30, 1.0);

  // Vines connecting them (simple tubes)
  function addVine(angle1, y1, angle2, y2) {
    const r1 = getCupRadius(y1) + 0.006;
    const r2 = getCupRadius(y2) + 0.006;
    const p1 = new THREE.Vector3(Math.cos(angle1) * r1, y1, Math.sin(angle1) * r1);
    const p2 = new THREE.Vector3(Math.cos(angle2) * r2, y2, Math.sin(angle2) * r2);
    
    // Midpoint slightly off surface for curve
    const midAngle = (angle1 + angle2) / 2;
    const midY = (y1 + y2) / 2;
    const rMid = getCupRadius(midY) + 0.008;
    const pMid = new THREE.Vector3(Math.cos(midAngle) * rMid, midY, Math.sin(midAngle) * rMid);

    const curve = new THREE.QuadraticBezierCurve3(p1, pMid, p2);
    const vine = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.004, 8, false), vineMat);
    root.add(vine);
  }

  addVine(-1.2, 0.30, -0.3, 0.32);
  addVine(0.3, 0.25, 1.2, 0.30);

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