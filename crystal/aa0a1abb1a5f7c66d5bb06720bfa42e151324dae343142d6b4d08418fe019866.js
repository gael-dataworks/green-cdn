export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Procedural leather texture
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let i = 0; i < texSize * texSize; i++) {
    // Simple deterministic noise for leather grain
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const val = Math.abs(noise);
    const base = 40; // Dark gray base
    const grain = base + val * 20; // Variation
    const idx = i * 4;
    texData[idx] = grain;
    texData[idx + 1] = grain;
    texData[idx + 2] = grain;
    texData[idx + 3] = 255;
  }
  const leatherTexture = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  leatherTexture.colorSpace = THREE.SRGBColorSpace;
  leatherTexture.wrapS = THREE.RepeatWrapping;
  leatherTexture.wrapT = THREE.RepeatWrapping;
  leatherTexture.needsUpdate = true;

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    map: leatherTexture,
    metalness: 0.0,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });

  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const bodyHeight = 0.65;
  const bodyWidthTop = 0.32;
  const bodyThickness = 0.04;
  const loopHeight = 0.35;
  const loopRadius = 0.006;

  // --- Leather Body ---
  // Shape: Isosceles triangle with rounded bottom tip
  const bodyShape = new THREE.Shape();
  const h = bodyHeight / 2;
  const w = bodyWidthTop / 2;
  
  // Start top-left
  bodyShape.moveTo(-w, h);
  // Line to bottom tip (rounded)
  bodyShape.lineTo(-0.04, -h + 0.04);
  // Curve to round the tip
  bodyShape.quadraticCurveTo(0, -h, 0.04, -h + 0.04);
  // Line to top-right
  bodyShape.lineTo(w, h);
  // Close
  bodyShape.lineTo(-w, h);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  // Center the geometry
  bodyGeom.translate(0, 0, -bodyThickness / 2);

  const leatherBody = new THREE.Mesh(bodyGeom, leatherMat);
  root.add(leatherBody);

  // --- Stitching ---
  // Left stitch line
  const stitchLeftPoints = [
    new THREE.Vector3(-w + 0.025, h - 0.025, 0.002),
    new THREE.Vector3(-0.03, -h + 0.03, 0.002)
  ];
  const stitchLeftCurve = new THREE.LineCurve3(stitchLeftPoints[0], stitchLeftPoints[1]);
  const stitchLeftGeom = new THREE.TubeGeometry(stitchLeftCurve, 16, 0.003, 8, false);
  const stitchLeft = new THREE.Mesh(stitchLeftGeom, stitchMat);
  root.add(stitchLeft);

  // Right stitch line
  const stitchRightPoints = [
    new THREE.Vector3(w - 0.025, h - 0.025, 0.002),
    new THREE.Vector3(0.03, -h + 0.03, 0.002)
  ];
  const stitchRightCurve = new THREE.LineCurve3(stitchRightPoints[0], stitchRightPoints[1]);
  const stitchRightGeom = new THREE.TubeGeometry(stitchRightCurve, 16, 0.003, 8, false);
  const stitchRight = new THREE.Mesh(stitchRightGeom, stitchMat);
  root.add(stitchRight);

  // --- Knot ---
  // A small torus knot or sphere at the top center where cord attaches
  const knotGeom = new THREE.TorusGeometry(0.018, 0.006, 8, 16, Math.PI * 2);
  const knot = new THREE.Mesh(knotGeom, cordMat);
  knot.position.set(0, h + 0.01, 0);
  knot.rotation.x = Math.PI / 2;
  root.add(knot);

  // --- Cord Loop ---
  // Curve from knot up and back down
  const loopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.01, h + 0.02, 0), // Start near knot left
    new THREE.Vector3(-0.08, h + loopHeight, 0), // Top left arc
    new THREE.Vector3(0, h + loopHeight + 0.05, 0), // Top center peak
    new THREE.Vector3(0.08, h + loopHeight, 0), // Top right arc
    new THREE.Vector3(0.01, h + 0.02, 0)  // End near knot right
  ]);

  const loopGeom = new THREE.TubeGeometry(loopCurve, 32, loopRadius, 12, false);
  const cordLoop = new THREE.Mesh(loopGeom, cordMat);
  root.add(cordLoop);

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