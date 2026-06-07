export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Procedural cork texture (noise)
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  for (let i = 0; i < corkSize * corkSize; i++) {
    const noise = Math.sin(i * 0.1) * 0.5 + 0.5; // Deterministic pseudo-noise
    const r = 180 + noise * 40;
    const g = 140 + noise * 30;
    const b = 100 + noise * 20;
    corkData[i * 4] = r;
    corkData[i * 4 + 1] = g;
    corkData[i * 4 + 2] = b;
    corkData[i * 4 + 3] = 255;
  }
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.wrapS = THREE.RepeatWrapping;
  corkTexture.wrapT = THREE.RepeatWrapping;
  corkTexture.repeat.set(4, 4);
  corkTexture.needsUpdate = true;
  corkMat.map = corkTexture;
  corkMat.bumpMap = corkTexture;
  corkMat.bumpScale = 0.02;

  // --- Bottle Body (Lathe) ---
  // Profile points [radius, y] from bottom to top
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),       // Center bottom
    new THREE.Vector2(0.32, 0.0),      // Bottom edge
    new THREE.Vector2(0.32, 0.05),     // Slight base rise
    new THREE.Vector2(0.30, 0.1),      // Base curve
    new THREE.Vector2(0.34, 0.4),      // Belly max
    new THREE.Vector2(0.32, 0.65),     // Shoulder start
    new THREE.Vector2(0.28, 0.75),     // Shoulder taper
    new THREE.Vector2(0.12, 0.85),     // Neck base
    new THREE.Vector2(0.12, 1.05),     // Neck top
    new THREE.Vector2(0.14, 1.08),     // Lip flare
    new THREE.Vector2(0.12, 1.10),     // Lip top inner
    new THREE.Vector2(0.0, 1.10),      // Top center
  ];

  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Cork Stopper ---
  const corkGeom = new THREE.CylinderGeometry(0.11, 0.11, 0.18, 16);
  const cork = new THREE.Mesh(corkGeom, corkMat);
  cork.position.y = 1.05; // Sit on top of neck
  root.add(cork);

  // --- Embossed Decoration ---
  // We model the relief as shallow extrusions placed slightly outside the glass surface.
  // Using the same glassMat ensures it looks like part of the glass.
  const embossDepth = 0.008;
  const embossGroup = new THREE.Group();
  
  // Helper to create a leaf shape
  function createLeafShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.05, 0.05, 0.15, 0.05, 0.2, 0); // Tip
    shape.bezierCurveTo(0.15, -0.05, 0.05, -0.05, 0, 0); // Base
    return shape;
  }

  const leafGeom = new THREE.ExtrudeGeometry(createLeafShape(), {
    depth: embossDepth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry locally so rotation pivot is at base
  leafGeom.translate(0, 0, -embossDepth / 2); 

  const leafMat = glassMat; // Same material

  // Helper to place decoration on the bottle surface
  // Approximate radius at height y based on profile
  function getRadiusAtY(y) {
    if (y < 0.1) return 0.32;
    if (y < 0.65) return 0.34;
    if (y < 0.85) return 0.34 - (y - 0.65) * 0.2; // Taper
    return 0.12;
  }

  function addLeaf(x, y, z, rotZ, scaleX = 1) {
    const leaf = new THREE.Mesh(leafGeom, leafMat);
    leaf.position.set(x, y, z);
    leaf.rotation.z = rotZ;
    leaf.scale.set(scaleX, scaleX, 1);
    embossGroup.add(leaf);
  }

  function addVineCurve(startX, startY, startZ, endX, endY, endZ) {
    const points = [];
    const segments = 10;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Simple linear interpolation with a slight bulge for organic feel
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t + Math.sin(t * Math.PI) * 0.03;
      const z = startZ + (endZ - startZ) * t;
      points.push(new THREE.Vector3(x, y, z));
    }
    const path = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(path, 10, 0.015, 8, false);
    const vine = new THREE.Mesh(tubeGeom, glassMat);
    embossGroup.add(vine);
  }

  function addCircleRing(x, y, z, radius, thickness) {
    const ringGeom = new THREE.TorusGeometry(radius, thickness, 8, 24);
    const ring = new THREE.Mesh(ringGeom, glassMat);
    ring.position.set(x, y, z);
    // Torus is in XY plane, we want it facing Z (flat on bottle front)
    // Actually Torus is XY plane by default. To face Z, we don't rotate? 
    // Wait, Torus default is in XY plane. Normal is Z. So it faces Z. Correct.
    // But we need to push it forward to sit on surface.
    ring.position.z = z + 0.005; 
    embossGroup.add(ring);
  }

  // Central Medallion Area (approx y=0.4, z=0.34)
  const medallionY = 0.45;
  const medallionZ = getRadiusAtY(medallionY) + 0.005;
  
  // Outer Ring
  addCircleRing(0, medallionY, medallionZ, 0.12, 0.008);
  // Inner Ring
  addCircleRing(0, medallionY, medallionZ, 0.09, 0.006);
  
  // Central Text Block (Abstract "1805" representation using boxes)
  // Since we can't load fonts, we make a decorative badge center
  const badgeGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.005, 16);
  const badge = new THREE.Mesh(badgeGeom, glassMat);
  badge.position.set(0, medallionY, medallionZ + 0.005);
  badge.rotation.x = Math.PI / 2; // Cylinder axis Y, we want flat face Z? 
  // Cylinder default axis is Y. To make flat face point Z, rotate X by 90.
  embossGroup.add(badge);

  // Floral Vines surrounding the medallion
  // Left Vine
  addVineCurve(-0.15, 0.3, medallionZ, -0.10, 0.6, medallionZ);
  // Right Vine
  addVineCurve(0.15, 0.3, medallionZ, 0.10, 0.6, medallionZ);

  // Leaves on vines
  // Left side leaves
  addLeaf(-0.12, 0.35, medallionZ + 0.005, Math.PI / 4, 0.8);
  addLeaf(-0.14, 0.50, medallionZ + 0.005, -Math.PI / 6, 0.7);
  addLeaf(-0.08, 0.55, medallionZ + 0.005, Math.PI / 3, 0.6);
  
  // Right side leaves
  addLeaf(0.12, 0.35, medallionZ + 0.005, -Math.PI / 4, 0.8);
  addLeaf(0.14, 0.50, medallionZ + 0.005, Math.PI / 6, 0.7);
  addLeaf(0.08, 0.55, medallionZ + 0.005, -Math.PI / 3, 0.6);

  // Top flourish
  addLeaf(0, 0.65, medallionZ + 0.005, Math.PI, 1.0);

  root.add(embossGroup);

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