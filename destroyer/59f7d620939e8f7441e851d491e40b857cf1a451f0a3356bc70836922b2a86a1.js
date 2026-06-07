export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver/White Gold: Bright, reflective. 
  // Using emissive to ensure it pops in the dim renderer as per metal brightness rules.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4
  });

  // Diamond/Gem: High transmission, low roughness, high IOR.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.8,
    transparent: true,
    thickness: 0.5
  });

  // --- Geometry Helpers ---

  // Generate heart shape points using parametric equation
  // x = 16 * sin(t)^3
  // y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)
  function getHeartPoints(scale = 1, segments = 64) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      // Flip Y because Three.js Y is up, but standard math heart is Y-up. 
      // However, we want the point at the bottom. The formula gives point at bottom (negative Y).
      // We want the cleft at top. So we might need to negate Y or rotate.
      // Standard formula: cleft is at top (positive Y), point is at bottom (negative Y).
      // Let's keep standard orientation first.
      points.push(new THREE.Vector2(x * scale, y * scale));
    }
    return points;
  }

  // 1. The Band (Torus)
  // Standard torus is in XY plane. Rotate X by 90 deg to lie in XZ plane (finger ring orientation).
  const bandRadius = 0.12;
  const bandTube = 0.018;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 64);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // 2. The Stone (Heart Shape Extrusion)
  // Create a Shape from heart points
  const heartShape = new THREE.Shape();
  const heartPoints2D = getHeartPoints(0.015); // Scale down to fit ring
  if (heartPoints2D.length > 0) {
    heartShape.moveTo(heartPoints2D[0].x, heartPoints2D[0].y);
    for (let i = 1; i < heartPoints2D.length; i++) {
      heartShape.lineTo(heartPoints2D[i].x, heartPoints2D[i].y);
    }
  }

  // Extrude settings for faceted look
  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.004,
    bevelSegments: 2
  };

  const stoneGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  const stone = new THREE.Mesh(stoneGeom, gemMat);
  
  // Position stone on top of the band
  // Band is in XZ plane. Top of band is at Y = bandTube.
  // Stone center needs to be higher.
  // The heart shape is centered at 0,0 in local space. 
  // The formula puts the point at negative Y. We want the point facing down towards the finger? 
  // Usually heart rings have the point facing down (towards finger) or up (away). 
  // Reference shows point facing DOWN towards the finger band.
  // Standard math heart: Point is at bottom (negative Y). Cleft is at top (positive Y).
  // So if we place it normally, point is at -Y. 
  // We want the stone to sit on the band. 
  // Let's rotate the stone 180 deg around Z so the cleft is at bottom? No, reference shows cleft at TOP.
  // Wait, reference image: Heart is upright. Cleft at top, point at bottom.
  // Standard formula: Cleft at top (+Y), Point at bottom (-Y).
  // So the geometry is already oriented correctly for an upright heart.
  // We just need to place it on the band.
  
  stone.position.set(0, bandTube + 0.03, bandRadius); 
  // Y: bandTube (top of ring) + half stone height approx.
  // Z: bandRadius (front of ring)
  root.add(stone);

  // 3. The Bezel (Rim)
  // A thin tube following the heart outline, sitting just under the stone's widest part or around edges.
  // We need a 3D curve for the TubeGeometry.
  const bezelPoints3D = [];
  const bezelY = bandTube + 0.01; // Slightly above band surface
  const bezelScale = 0.0155; // Slightly larger than stone to hug it
  
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3) * bezelScale;
    const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * bezelScale;
    // The heart shape Y is local to the stone. 
    // We need to map this to world space relative to the stone position.
    // But TubeGeometry creates its own mesh. We can just create the tube mesh and position it.
    // The curve should be in XZ plane? No, the heart is vertical (XY plane relative to ring front).
    // The ring front face is in XY plane (at Z = bandRadius).
    // So the heart lies in a plane parallel to XY.
    // So the curve points should be (x, y, 0) locally, then we position the tube mesh.
    bezelPoints3D.push(new THREE.Vector3(x, y, 0));
  }

  const bezelCurve = new THREE.CatmullRomCurve3(bezelPoints3D);
  bezelCurve.closed = true;
  
  const bezelGeom = new THREE.TubeGeometry(bezelCurve, 64, 0.003, 8, true);
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  
  // Position bezel to match stone
  // Stone is at (0, bandTube + 0.03, bandRadius)
  // The tube geometry is centered at 0,0,0.
  // We need to shift it to the stone's position, but account for the heart's local center.
  // The heart formula center is roughly (0,0).
  // So we just move the bezel mesh to the stone's position, but slightly lower to act as a cup.
  bezel.position.set(0, bandTube + 0.025, bandRadius);
  root.add(bezel);

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