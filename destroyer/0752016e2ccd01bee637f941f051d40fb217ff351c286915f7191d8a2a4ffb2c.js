export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Outer clear glass sphere
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 1.0,
  });

  // Inner swirl material with procedural texture
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0x222222,
    emissiveIntensity: 0.2,
  });

  // --- Procedural Texture for Swirl ---
  // Creates a striped pattern resembling the colored glass ribbon
  const texWidth = 512;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Color palette from reference: Black, Deep Blue, Cyan, Magenta, Yellow, White
  const colors = [
    { r: 10, g: 10, b: 20 },    // Dark/Black
    { r: 20, g: 40, b: 100 },   // Deep Blue
    { r: 50, g: 200, b: 255 },  // Cyan
    { r: 255, g: 50, b: 150 },  // Magenta/Pink
    { r: 255, g: 255, b: 100 }, // Yellow
    { r: 240, g: 240, b: 240 }, // White
  ];

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      // Create diagonal stripes
      // We want the stripes to run somewhat diagonally to look like a twisted ribbon
      const stripePhase = (x + y * 2) % (texWidth / 3); 
      const colorIndex = Math.floor((stripePhase / (texWidth / 3)) * colors.length) % colors.length;
      const c = colors[colorIndex];
      
      // Add some softness to edges
      const offset = (stripePhase % (texWidth / 12)) / (texWidth / 12);
      const alpha = 255; 
      
      const i = (y * texWidth + x) * 4;
      data[i] = c.r;
      data[i + 1] = c.g;
      data[i + 2] = c.b;
      data[i + 3] = alpha;
    }
  }

  const swirlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  swirlTexture.colorSpace = THREE.SRGBColorSpace;
  swirlTexture.wrapS = THREE.RepeatWrapping;
  swirlTexture.wrapT = THREE.RepeatWrapping;
  swirlTexture.repeat.set(4, 1); // Repeat pattern along the tube length
  swirlTexture.needsUpdate = true;
  swirlMat.map = swirlTexture;

  // --- Geometry ---

  // 1. Outer Sphere
  const sphereGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const outerSphere = new THREE.Mesh(sphereGeom, glassMat);
  root.add(outerSphere);

  // 2. Inner Swirl Ribbon
  // Construct a spiral curve that fits inside the sphere
  const points = [];
  const turns = 2.5;
  const segments = 200;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1
    const angle = t * Math.PI * 2 * turns;
    // Radius grows then shrinks slightly to fit the "C" shape or spiral
    // Using a spiral that expands from center
    const r = 0.05 + t * 0.35; 
    
    // Tilt the spiral plane
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = (t - 0.5) * 0.6; // Spread along Y
    
    // Add a slight wave to make it look organic/twisted
    const twist = Math.sin(t * Math.PI * 4) * 0.05;
    
    points.push(new THREE.Vector3(x + twist, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  const swirlGeom = new THREE.TubeGeometry(curve, 100, 0.045, 16, false);
  
  // Flatten the tube to make it a ribbon
  // We scale the mesh, not the geometry, to keep normals correct for lighting if possible, 
  // but scaling geometry vertices is more deterministic for the shape itself.
  // Actually, scaling the mesh is fine for visual.
  const innerSwirl = new THREE.Mesh(swirlGeom, swirlMat);
  innerSwirl.scale.set(1, 0.4, 1); // Flatten Y to make it a ribbon
  innerSwirl.rotation.y = Math.PI / 4; // Orient to match reference view roughly
  
  root.add(innerSwirl);

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