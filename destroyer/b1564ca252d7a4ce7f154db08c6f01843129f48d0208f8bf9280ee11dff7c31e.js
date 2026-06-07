export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Orange juice: Opaque, slightly glossy liquid
  const juiceMat = new THREE.MeshStandardMaterial({
    color: 0xFFAA00,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Bottle Glass: Clear, refractive plastic
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.05,
  });

  // Cap: Green plastic, matte
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2E8B57,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Geometry Profiles ---
  // We define the outer silhouette. 
  // The liquid will be a slightly scaled-down version of the body part.
  
  // Profile points [radius, y]
  // Bottom to Top
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Bottom Center
    new THREE.Vector2(0.18, 0.00),  // Bottom Edge
    new THREE.Vector2(0.19, 0.15),  // Lower Bulge
    new THREE.Vector2(0.17, 0.35),  // Waist (narrower)
    new THREE.Vector2(0.19, 0.55),  // Shoulder
    new THREE.Vector2(0.15, 0.65),  // Neck Base
    new THREE.Vector2(0.15, 0.75),  // Neck Top
    new THREE.Vector2(0.16, 0.78),  // Lip flare
    new THREE.Vector2(0.00, 0.78),  // Top Center (close the solid)
  ];

  // --- 1. Liquid Volume ---
  // We create a lathe for the liquid. It stops below the neck.
  // To make it fit inside, we scale it slightly down relative to the bottle body.
  const liquidProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.17, 0.00),  // Slightly smaller radius
    new THREE.Vector2(0.18, 0.15),
    new THREE.Vector2(0.16, 0.35),
    new THREE.Vector2(0.18, 0.55),
    new THREE.Vector2(0.14, 0.64),  // Fill line (below neck base)
    new THREE.Vector2(0.00, 0.64),  // Close top
  ];
  
  const liquidGeom = new THREE.LatheGeometry(liquidProfile, 32);
  const liquid = new THREE.Mesh(liquidGeom, juiceMat);
  // Center the liquid geometry if needed, but Lathe centers based on points usually.
  // Our points start at 0,0 so bottom is at 0.
  root.add(liquid);

  // --- 2. Glass Bottle Shell ---
  // We need a hollow shell. 
  // Strategy: Create a solid glass bottle, but rely on the liquid inside to occlude the back.
  // However, the neck must be hollow.
  // Better Strategy for Validator/Performance: 
  // Just model the outer shape as glass. The liquid inside is opaque, so it hides the back face of the glass body.
  // The neck area (above liquid) needs to be hollow. 
  // We can model the neck as a separate thin cylinder or modify the lathe.
  // Let's use a Lathe for the whole bottle, but we need thickness.
  // Simplest robust way: 
  // A) Outer Bottle Lathe (Solid)
  // B) Inner Bottle Lathe (Solid, slightly smaller, subtracted? No CSG).
  // C) Just use the Outer Lathe for the body, and a separate Tube/Cylinder for the neck wall.
  
  // Let's try: 
  // Body: Lathe of outer profile up to shoulder.
  // Neck: Thin cylinder.
  // Lip: Torus or small lathe.
  
  // Actually, a single Lathe with a "thickness" profile is best if we define the cross section.
  // Profile: (InnerBottom, 0) -> (OuterBottom, 0) -> ... -> (OuterTop, H) -> (InnerTop, H) -> (InnerBottom, 0)
  const wallThickness = 0.008;
  const bottleProfile = [
    // Inner Bottom
    new THREE.Vector2(0.00, 0.00), 
    // Outer Bottom
    new THREE.Vector2(0.18, 0.00),
    // Outer Wall
    new THREE.Vector2(0.19, 0.15),
    new THREE.Vector2(0.17, 0.35),
    new THREE.Vector2(0.19, 0.55),
    new THREE.Vector2(0.15, 0.65), // Neck Outer
    new THREE.Vector2(0.15, 0.75), // Neck Top Outer
    new THREE.Vector2(0.16, 0.78), // Lip Outer
    // Lip Top
    new THREE.Vector2(0.16, 0.79), 
    // Lip Inner
    new THREE.Vector2(0.15, 0.79),
    // Neck Inner Top
    new THREE.Vector2(0.142, 0.75), // 0.15 - thickness
    new THREE.Vector2(0.142, 0.65),
    // Shoulder Inner (approx)
    new THREE.Vector2(0.182, 0.55),
    new THREE.Vector2(0.162, 0.35),
    new THREE.Vector2(0.182, 0.15),
    // Inner Bottom Edge
    new THREE.Vector2(0.172, 0.00),
    // Close at center
    new THREE.Vector2(0.00, 0.00)
  ];

  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- 3. Cap ---
  const capHeight = 0.06;
  const capRadius = 0.165; // Slightly wider than neck
  const capY = 0.78;

  // Cap Base
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = capY + capHeight / 2;
  root.add(cap);

  // Cap Ridges (Knurling)
  const ridgeCount = 24;
  const ridgeWidth = 0.015;
  const ridgeDepth = 0.005;
  const ridgeHeight = capHeight * 0.8;
  
  const ridgeGeom = new THREE.BoxGeometry(ridgeWidth, ridgeHeight, ridgeDepth);
  
  for (let i = 0; i < ridgeCount; i++) {
    const angle = (i / ridgeCount) * Math.PI * 2;
    const x = Math.cos(angle) * capRadius;
    const z = Math.sin(angle) * capRadius;
    
    const ridge = new THREE.Mesh(ridgeGeom, capMat);
    ridge.position.set(x, capY + capHeight / 2, z);
    ridge.rotation.y = -angle;
    // Move ridge outward so it sits on surface
    ridge.translateY(ridgeDepth / 2 + 0.001); 
    root.add(ridge);
  }

  // Cap Top Detail (optional slight inset)
  const topDiscGeom = new THREE.CylinderGeometry(capRadius * 0.9, capRadius * 0.9, 0.005, 32);
  const topDisc = new THREE.Mesh(topDiscGeom, capMat);
  topDisc.position.y = capY + capHeight;
  root.add(topDisc);

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