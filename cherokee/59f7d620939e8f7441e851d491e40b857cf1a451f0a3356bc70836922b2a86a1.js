export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished Silver / White Gold (System Prompt Rule: metalness <= 0.6)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Diamond / Clear Gem (Physical Material for transmission/refraction)
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 2.2, // High refraction for gem look
    thickness: 0.5,
    transparent: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // --- Dimensions ---
  const bandRadius = 0.28;
  const bandTube = 0.035;
  const stoneSize = 0.24; // Approximate width

  // --- 1. Ring Band ---
  // Torus lies in XY plane by default. Rotate X by PI/2 to lie in XZ plane.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 48);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // --- 2. Heart Shape Definition ---
  // Create a reusable heart shape for both the stone and the bezel
  function createHeartShape(scale) {
    const s = scale;
    const shape = new THREE.Shape();
    // Start at bottom point
    shape.moveTo(0, -0.6 * s);
    // Left curve
    shape.bezierCurveTo(
      -0.6 * s, -0.6 * s, // cp1
      -0.6 * s, 0.2 * s,  // cp2
      0, 0.4 * s          // end (center dip)
    );
    // Right curve (mirror)
    shape.bezierCurveTo(
      0.6 * s, 0.2 * s,   // cp1
      0.6 * s, -0.6 * s,  // cp2
      0, -0.6 * s         // end (back to start)
    );
    return shape;
  }

  const heartShape = createHeartShape(stoneSize);

  // --- 3. Bezel Setting (Metal rim holding the stone) ---
  // Slightly larger than stone, thin extrusion
  const bezelShape = createHeartShape(stoneSize * 1.05);
  const bezelGeom = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  // Center the geometry
  bezel.geometry.center();
  // Position on top of the band
  // The band top is at Y = bandTube. We want the bezel to sit there.
  bezel.position.y = bandTube; 
  // Tilt slightly to match the perspective of a ring on a finger/hand usually
  // But for a clean product shot, upright is often safer, or slight tilt.
  // The reference shows a slight tilt towards the camera.
  bezel.rotation.x = -0.2; 
  root.add(bezel);

  // --- 4. Heart Gemstone ---
  // Use the same shape, slightly smaller to fit inside bezel
  const stoneShape = createHeartShape(stoneSize * 0.92);
  const stoneGeom = new THREE.ExtrudeGeometry(stoneShape, {
    depth: 0.12, // Thickness of the gem
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3, // More segments for smoother facets look
    steps: 2,
  });
  const stone = new THREE.Mesh(stoneGeom, gemMat);
  stone.geometry.center();
  // Position slightly in front of bezel
  stone.position.y = bandTube + 0.02;
  stone.rotation.x = -0.2; // Match bezel tilt
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