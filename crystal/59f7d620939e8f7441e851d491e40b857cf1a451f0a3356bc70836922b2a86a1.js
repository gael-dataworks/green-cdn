export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver/white gold. Using emissive to ensure brightness in this renderer.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Diamond-like gemstone. High transmission, low roughness, high IOR.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 2.0,
    transparent: true,
    thickness: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // --- Geometry Helpers ---

  // Generate heart shape points.
  // Returns { shape: THREE.Shape, curve: THREE.CatmullRomCurve3 }
  function createHeartData(scale = 1.0) {
    const points2D = [];
    const points3D = [];
    const steps = 64;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      // Standard heart equation
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

      // Scale down
      const x = hx * scale;
      const y = hy * scale;

      // 2D Shape for Extrusion (XY plane)
      // We want the point of the heart to face +Z in 3D space later.
      // In 2D Shape (XY), +Y is up. Let's keep standard orientation for now.
      points2D.push(new THREE.Vector2(x, y));

      // 3D Curve for Bezel (XZ plane)
      // Map 2D Y to 3D -Z so the point (negative Y in standard math) faces +Z.
      // Actually standard heart math: t=0 -> (0, 16) [top cleft? no, let's check]
      // t=0: sin=0, cos=1 -> x=0, y=13-5-2-1 = 5.
      // t=PI: sin=0, cos=-1 -> x=0, y=-13-5+2-1 = -17. (Point is at negative Y).
      // So in 2D Shape, point is at -Y.
      // In 3D Ring, we want point at +Z. So Z = -Y_2D.
      points3D.push(new THREE.Vector3(x, 0, -y));
    }

    const shape = new THREE.Shape(points2D);
    const curve = new THREE.CatmullRomCurve3(points3D);
    // Close the curve explicitly just in case, though points match start/end
    curve.closed = true;

    return { shape, curve };
  }

  const heartScale = 0.012; // Scale factor to fit unit cube
  const { shape: heartShape, curve: heartCurve } = createHeartData(heartScale);

  // --- Components ---

  // 1. Band
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie in XZ.
  const bandRadius = 0.18;
  const bandTube = 0.025;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 64);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  // Position band so top is at y=0
  band.position.y = 0;
  root.add(band);

  // 2. Bezel (Metal rim holding the stone)
  // TubeGeometry follows the heart curve.
  const bezelTubeRadius = 0.006; // Thin rim
  const bezelGeom = new THREE.TubeGeometry(heartCurve, 64, bezelTubeRadius, 8, true);
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  // Position bezel on top of the band.
  // Band top is at y = bandTube (0.025).
  // Bezel needs to sit on that.
  bezel.position.y = bandTube + bezelTubeRadius;
  root.add(bezel);

  // 3. Gemstone
  // Extrude the heart shape.
  const extrudeSettings = {
    depth: 0.04, // Thickness of the stone
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 12,
  };

  const gemGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  const gemstone = new THREE.Mesh(gemGeom, gemMat);

  // Center the geometry locally so pivot is at center of heart
  gemGeom.center();

  // Position gemstone inside the bezel.
  // Bezel center is at y = bandTube + bezelTubeRadius.
  // Gem needs to sit slightly higher to look set in.
  // ExtrudeGeometry creates geometry from z=0 to z=depth. Center() moves pivot to middle.
  // So local Y range is approx -depth/2 to +depth/2.
  // We want the bottom of the gem to be slightly inside the bezel ring.
  gemstone.position.y = bandTube + bezelTubeRadius;

  // Rotate gem to match bezel orientation.
  // Shape was drawn in XY. Extrude goes along Z.
  // We want the flat face of the gem to be horizontal (XZ plane).
  // So rotate X by 90 deg.
  gemstone.rotation.x = Math.PI / 2;

  // The heart shape in 2D has point at -Y.
  // After rotation X=90:
  // Original -Y becomes +Z.
  // So the point of the heart faces +Z. This matches our bezel curve logic.
  root.add(gemstone);

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