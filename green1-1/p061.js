export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Cookie dough: light tan, very matte/rough
  const cookieMat = new THREE.MeshStandardMaterial({
    color: 0xe3c69e,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Cracks: darker tan/brown to simulate shadowed gaps
  const crackMat = new THREE.MeshStandardMaterial({
    color: 0xbfa075,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Sugar/Salt speckles: white, slightly less rough
  const speckleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Base Cookie Sphere with deterministic surface noise ---
  // High segment count to allow for vertex displacement
  const baseRadius = 0.5;
  const segments = 64;
  const cookieGeom = new THREE.SphereGeometry(baseRadius, segments, segments);

  // Access position attribute to modify vertices deterministically
  const positions = cookieGeom.attributes.position.array;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positions.length; i += 3) {
    vertex.set(positions[i], positions[i + 1], positions[i + 2]);
    
    // Convert to spherical to apply noise based on angles
    const r = vertex.length();
    const theta = Math.atan2(vertex.z, vertex.x); // Azimuth
    const phi = Math.acos(vertex.y / r); // Polar angle

    // Deterministic "noise" function using trigonometric sums
    // Creates a bumpy, organic cookie dough texture
    const noise = 
      Math.sin(theta * 8.0) * Math.cos(phi * 6.0) * 0.015 +
      Math.sin(theta * 20.0 + phi * 10.0) * 0.005;

    // Apply noise to radius
    const newR = r + noise;
    vertex.normalize().multiplyScalar(newR);

    positions[i] = vertex.x;
    positions[i + 1] = vertex.y;
    positions[i + 2] = vertex.z;
  }
  cookieGeom.computeVertexNormals();

  const cookieBase = new THREE.Mesh(cookieGeom, cookieMat);
  root.add(cookieBase);

  // --- Cracks (Dark shadows/gaps on surface) ---
  // Defined as curves on the sphere surface, slightly inset
  // Helper to get cartesian from spherical
  function getSurfacePoint(theta, phi, radiusOffset) {
    const r = baseRadius + radiusOffset;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  // Define crack paths using spherical coordinates {theta, phi}
  // Theta: 0 to 2PI, Phi: 0 to PI
  const crackPaths = [
    // Main equatorial crack
    [
      { t: 0.2, p: 1.8 }, { t: 0.8, p: 1.6 }, { t: 1.5, p: 1.9 }, 
      { t: 2.5, p: 1.5 }, { t: 3.8, p: 1.7 }, { t: 5.0, p: 1.6 }
    ],
    // Vertical crack
    [
      { t: 4.5, p: 0.5 }, { t: 4.6, p: 1.0 }, { t: 4.4, p: 1.5 }, 
      { t: 4.7, p: 2.0 }, { t: 4.5, p: 2.5 }
    ],
    // Side crack
    [
      { t: 1.0, p: 0.8 }, { t: 1.2, p: 1.2 }, { t: 0.8, p: 1.6 }, 
      { t: 1.5, p: 2.0 }
    ],
    // Small branching crack
    [
      { t: 2.8, p: 1.2 }, { t: 3.0, p: 1.4 }, { t: 2.9, p: 1.7 }
    ]
  ];

  crackPaths.forEach((pathPoints, index) => {
    const curvePoints = pathPoints.map(pt => 
      getSurfacePoint(pt.t, pt.p, -0.015) // Slightly inset (-0.015) to look like a gap
    );
    
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    // Tube radius small, tubular segments low for performance
    const crackGeom = new THREE.TubeGeometry(curve, 20, 0.025, 8, false);
    const crackMesh = new THREE.Mesh(crackGeom, crackMat);
    root.add(crackMesh);
  });

  // --- Speckles (Sugar/Salt crystals) ---
  // Tiny spheres scattered on the surface
  const speckleCount = 60;
  const speckleGeom = new THREE.SphereGeometry(0.012, 4, 4);

  for (let i = 0; i < speckleCount; i++) {
    // Deterministic distribution using golden angle approximation
    const phi = Math.acos(1 - 2 * (i + 0.5) / speckleCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

    // Filter some out deterministically to make it look random/scattered
    if (Math.sin(i * 3.7) > 0.6) { 
      const pos = getSurfacePoint(theta, phi, 0.01); // Slightly outside (+0.01)
      const speckle = new THREE.Mesh(speckleGeom, speckleMat);
      speckle.position.copy(pos);
      
      // Random-ish rotation using index
      speckle.rotation.set(i * 0.5, i * 0.3, i * 0.7);
      root.add(speckle);
    }
  }

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