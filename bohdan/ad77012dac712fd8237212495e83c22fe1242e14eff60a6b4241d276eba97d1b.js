export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Glass: Clear, high transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Cork: Brown, rough, with procedural texture
  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Generate cork texture (deterministic noise)
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  for (let i = 0; i < corkSize * corkSize; i++) {
    const x = i % corkSize;
    const y = Math.floor(i / corkSize);
    // Simple deterministic noise using sin
    const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin((x + y) * 0.2)) * 0.5 + 0.5;
    const r = 196 * noise;
    const g = 165 * noise;
    const b = 116 * noise;
    corkData[i * 4] = r;
    corkData[i * 4 + 1] = g;
    corkData[i * 4 + 2] = b;
    corkData[i * 4 + 3] = 255;
  }
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.needsUpdate = true;
  corkMat.map = corkTexture;

  // Embossing material (same as glass but slightly different roughness to catch light)
  const embossMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });

  // --- Bottle Body (Lathe) ---
  // Profile points [radius, height]
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.32, 0.00), // Base edge
    new THREE.Vector2(0.32, 0.04), // Base thickness
    new THREE.Vector2(0.38, 0.15), // Belly start
    new THREE.Vector2(0.42, 0.45), // Widest point
    new THREE.Vector2(0.40, 0.65), // Shoulder start
    new THREE.Vector2(0.28, 0.80), // Neck start
    new THREE.Vector2(0.28, 1.05), // Neck top
    new THREE.Vector2(0.34, 1.08), // Lip flare
    new THREE.Vector2(0.34, 1.12), // Lip top
    new THREE.Vector2(0.00, 1.12), // Close top
  ];

  const bottleGeom = new THREE.LatheGeometry(profilePoints, 48);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Cork Stopper ---
  const corkGeom = new THREE.CylinderGeometry(0.26, 0.28, 0.35, 24);
  const cork = new THREE.Mesh(corkGeom, corkMat);
  cork.position.y = 1.05; // Sit on top of neck
  root.add(cork);

  // --- Embossed Decoration ---
  // We model vines and leaves as shallow geometry on the surface.
  // Bottle radius at decoration height (approx y=0.4) is ~0.42.
  const decoRadius = 0.425; // Slightly larger than bottle to sit on surface
  const decoGroup = new THREE.Group();
  bottle.add(decoGroup); // Add to bottle so it scales/transforms with it

  // Helper to place on surface
  function getSurfacePos(angle, y) {
    const x = Math.cos(angle) * decoRadius;
    const z = Math.sin(angle) * decoRadius;
    return new THREE.Vector3(x, y, z);
  }

  // Helper to create a leaf shape
  function createLeafShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.05, 0.05, 0.1, 0.05, 0.15, 0);
    shape.bezierCurveTo(0.1, -0.05, 0.05, -0.05, 0, 0);
    return shape;
  }

  const leafShape = createLeafShape();
  const leafGeom = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry
  leafGeom.center();

  // Helper to add a leaf at angle/height
  function addLeaf(angle, y, scale, rotation) {
    const leaf = new THREE.Mesh(leafGeom, embossMat);
    const pos = getSurfacePos(angle, y);
    leaf.position.copy(pos);
    
    // Orient leaf to face outward and rotate
    leaf.lookAt(new THREE.Vector3(0, y, 0)); // Face center
    leaf.rotateY(Math.PI); // Flip to face out
    leaf.rotateZ(rotation); // Twist along vine
    leaf.scale.set(scale, scale, 1);
    
    // Push slightly out
    leaf.translateZ(0.005);
    
    decoGroup.add(leaf);
  }

  // Helper to add a vine segment
  function addVine(points) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.008, 8, false);
    const vine = new THREE.Mesh(tubeGeom, embossMat);
    decoGroup.add(vine);
  }

  // --- Central Medallion ---
  // A ring
  const ringGeom = new THREE.TorusGeometry(0.12, 0.015, 16, 48);
  const medallionRing = new THREE.Mesh(ringGeom, embossMat);
  medallionRing.position.set(0, 0.45, decoRadius + 0.005);
  medallionRing.rotation.y = 0; // Face front
  decoGroup.add(medallionRing);

  // Inner text area (simplified as a circle for now, text is hard procedurally)
  const innerGeom = new THREE.CircleGeometry(0.08, 32);
  const innerDisc = new THREE.Mesh(innerGeom, embossMat);
  innerDisc.position.set(0, 0.45, decoRadius + 0.006);
  decoGroup.add(innerDisc);

  // --- Vines and Leaves ---
  // Main vine wrapping around
  const vinePoints = [];
  const vineStartAngle = -Math.PI / 4;
  const vineEndAngle = Math.PI / 4;
  const vineYStart = 0.35;
  const vineYEnd = 0.55;
  
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const angle = vineStartAngle + (vineEndAngle - vineStartAngle) * t;
    const y = vineYStart + (vineYEnd - vineYStart) * t + Math.sin(t * Math.PI) * 0.05;
    const pos = getSurfacePos(angle, y);
    vinePoints.push(pos);
  }
  addVine(vinePoints);

  // Leaves along the vine
  for (let i = 2; i < 9; i += 2) {
    const t = i / 10;
    const angle = vineStartAngle + (vineEndAngle - vineStartAngle) * t;
    const y = vineYStart + (vineYEnd - vineYStart) * t + Math.sin(t * Math.PI) * 0.05;
    addLeaf(angle, y, 0.6, Math.PI / 4);
  }

  // Side vines (left and right)
  function addSideVine(side) {
    const pts = [];
    const baseAngle = side * Math.PI / 3;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const angle = baseAngle + side * t * 0.5;
      const y = 0.3 + t * 0.3;
      pts.push(getSurfacePos(angle, y));
    }
    addVine(pts);
    // Leaves on side vine
    for (let i = 2; i < 7; i += 2) {
      const t = i / 8;
      const angle = baseAngle + side * t * 0.5;
      const y = 0.3 + t * 0.3;
      addLeaf(angle, y, 0.5, side * Math.PI / 6);
    }
  }
  addSideVine(-1);
  addSideVine(1);

  // Top flourish
  const topVinePts = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const angle = -0.2 + t * 0.4;
    const y = 0.65 + Math.sin(t * Math.PI) * 0.05;
    topVinePts.push(getSurfacePos(angle, y));
  }
  addVine(topVinePts);

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