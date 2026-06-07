export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver/white gold. Metalness capped at 0.6 for no-env-map rendering.
  // Emissive added to ensure brightness against white background.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Diamond-like stone. High transmission, high IOR, low roughness.
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 2.4,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  // --- Geometry Helpers ---

  // Create a heart shape path
  function createHeartShape(scale = 1) {
    const s = scale;
    const shape = new THREE.Shape();
    // Start at bottom tip
    shape.moveTo(0, -0.15 * s);
    // Right lobe
    shape.bezierCurveTo(0.15 * s, -0.15 * s, 0.15 * s, 0.05 * s, 0, 0.15 * s);
    // Left lobe (mirror)
    shape.bezierCurveTo(-0.15 * s, 0.05 * s, -0.15 * s, -0.15 * s, 0, -0.15 * s);
    return shape;
  }

  // --- 1. The Band ---
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie in XZ plane (flat).
  const bandRadius = 0.28;
  const bandTube = 0.045;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 48);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // --- 2. The Bezel (Setting) ---
  // A thin metal frame holding the stone.
  // Constructed by extruding a heart shape with a hole in the middle.
  const bezelScale = 1.15;
  const outerHeart = createHeartShape(bezelScale);
  const innerHeart = createHeartShape(1.0);
  // The inner heart is the hole. We need to translate its points to match the outer shape's center if they differed,
  // but since both are centered at 0,0, we can just push the path.
  // However, Shape.holes expects an array of Vector2 or a Path.
  // createHeartShape returns a Shape. We need to extract the curves or just make a new Path.
  // Easier: Make the outer shape, then create a Path from the inner shape's points.
  
  const holePath = new THREE.Path();
  // Reconstruct the inner heart as a path for the hole
  // We can just copy the commands or sample points. Sampling is safer for holes.
  const innerPoints = innerHeart.getSpacedPoints(20);
  // Move to first point
  holePath.moveTo(innerPoints[0].x, innerPoints[0].y);
  for (let i = 1; i < innerPoints.length; i++) {
    holePath.lineTo(innerPoints[i].x, innerPoints[i].y);
  }
  outerHeart.holes.push(holePath);

  const bezelGeom = new THREE.ExtrudeGeometry(outerHeart, {
    depth: 0.06,
    bevelEnabled: false,
  });
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  // Position on top of the band
  // Band top is at y = bandRadius + bandTube (since band is rotated to XZ plane, its 'up' is Y)
  // Actually, Torus centered at 0,0,0 rotated X=90. Top point is at Y = bandRadius + bandTube.
  // We want the bezel to sit slightly embedded or right on top.
  bezel.position.y = bandRadius + bandTube - 0.02; 
  root.add(bezel);

  // --- 3. The Stone ---
  // Heart shaped diamond.
  const stoneShape = createHeartShape(1.0);
  const stoneGeom = new THREE.ExtrudeGeometry(stoneShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 3,
  });
  const stone = new THREE.Mesh(stoneGeom, diamondMat);
  // Center the stone vertically relative to the bezel
  // Bezels sits at y ~ 0.32. Depth 0.06. Center of bezel is y + 0.03.
  // Stone depth 0.12 + bevels. Let's align centers.
  stone.position.y = bezel.position.y + 0.03;
  root.add(stone);

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