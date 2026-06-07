export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass material for the outer sphere
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
  });

  // Material for the inner swirl ribbon
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });

  // --- Procedural Texture for Swirl ---
  // Generates a diagonal striped pattern to simulate multicolor glass cane
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const colors = [
    { r: 255, g: 0, b: 128 },   // Pink
    { r: 0, g: 191, b: 255 },   // Deep Sky Blue
    { r: 255, g: 215, b: 0 },   // Gold
    { r: 20, g: 20, b: 40 },    // Dark Purple/Black
  ];

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // Diagonal stripes
      const stripeIndex = Math.floor((x + y) / 32) % colors.length;
      const c = colors[stripeIndex];
      const i = (y * texSize + x) * 4;
      data[i] = c.r;
      data[i + 1] = c.g;
      data[i + 2] = c.b;
      data[i + 3] = 255;
    }
  }

  const swirlTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  swirlTexture.colorSpace = THREE.SRGBColorSpace;
  swirlTexture.wrapS = THREE.RepeatWrapping;
  swirlTexture.wrapT = THREE.RepeatWrapping;
  swirlTexture.repeat.set(4, 1); // Repeat colors along the length of the tube
  swirlTexture.needsUpdate = true;
  swirlMat.map = swirlTexture;

  // --- Geometry Construction ---

  // 1. Inner Swirl Path
  // Create a spiral that starts wide and tightens towards the center
  const points = [];
  const turns = 3.5;
  const totalPoints = 100;
  
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints; // 0 to 1
    const angle = t * Math.PI * 2 * turns;
    // Radius decreases from 0.35 to 0.02
    const radius = 0.35 * (1 - t) + 0.02;
    
    // Spiral in XY plane initially
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    // Slight Z curve to give it 3D volume
    const z = Math.sin(t * Math.PI) * 0.15;
    
    points.push(new THREE.Vector3(x, y, z));
  }

  const swirlPath = new THREE.CatmullRomCurve3(points);
  
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  // Flatten the tube to make it a ribbon: scale later or use small radialSegments
  const swirlGeom = new THREE.TubeGeometry(swirlPath, 64, 0.045, 8, false);
  
  const innerSwirl = new THREE.Mesh(swirlGeom, swirlMat);
  
  // Rotate the swirl to match the diagonal orientation in the reference
  // The reference shows the swirl entering from top-right, curving down-left
  innerSwirl.rotation.z = -Math.PI / 4; 
  innerSwirl.rotation.x = Math.PI / 6;
  
  root.add(innerSwirl);

  // 2. Outer Glass Sphere
  // Must be large enough to contain the swirl
  const sphereRadius = 0.48;
  const sphereGeom = new THREE.SphereGeometry(sphereRadius, 48, 48);
  const glassSphere = new THREE.Mesh(sphereGeom, glassMat);
  
  root.add(glassSphere);

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