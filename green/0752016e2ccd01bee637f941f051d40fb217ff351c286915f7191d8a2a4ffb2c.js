export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear Glass Shell
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

  // Internal Swirl Material (Glossy Colored Glass/Resin)
  // We will apply a procedural texture for the color bands
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x222222,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
  });

  // --- Procedural Texture for Swirl Colors ---
  // Creates a gradient strip of the colors seen in the reference:
  // Black, Dark Blue, Cyan, Pink, Yellow, White
  function createSwirlTexture(THREE) {
    const width = 512;
    const height = 4;
    const data = new Uint8Array(width * height * 4);
    
    // Define color stops (R, G, B)
    const colors = [
      [0, 0, 0],       // Black
      [0, 0, 50],      // Dark Blue
      [0, 100, 255],   // Blue
      [0, 255, 255],   // Cyan
      [255, 0, 150],   // Pink/Magenta
      [255, 255, 0],   // Yellow
      [255, 255, 255], // White
      [255, 100, 100], // Reddish
      [0, 0, 0]        // Back to Black
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = x / (width - 1);
        const colorIndex = t * (colors.length - 1);
        const i0 = Math.floor(colorIndex);
        const i1 = Math.min(i0 + 1, colors.length - 1);
        const frac = colorIndex - i0;

        const c0 = colors[i0];
        const c1 = colors[i1];

        const r = Math.round(c0[0] + (c1[0] - c0[0]) * frac);
        const g = Math.round(c0[1] + (c1[1] - c0[1]) * frac);
        const b = Math.round(c0[2] + (c1[2] - c0[2]) * frac);

        const index = (y * width + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255; // Alpha
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  swirlMat.map = createSwirlTexture(THREE);

  // --- Geometry: Outer Sphere ---
  const sphereRadius = 0.5;
  const sphereGeom = new THREE.SphereGeometry(sphereRadius, 64, 64);
  const glassSphere = new THREE.Mesh(sphereGeom, glassMat);
  root.add(glassSphere);

  // --- Geometry: Internal Swirl ---
  // Create a spiral path
  const points = [];
  const turns = 2.5;
  const segments = 200;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1
    const angle = t * Math.PI * 2 * turns;
    
    // Radius starts wide, gets tight in middle, widens slightly at end
    // Using a combination of functions to shape the spiral
    const r = 0.35 * (1.0 - t * 0.6) + 0.05 * Math.sin(t * Math.PI * 4); 
    
    // Height goes from bottom to top
    const y = -0.35 + t * 0.7;

    // Add some organic wobble to the radius to mimic the hand-blown look
    const wobble = 0.02 * Math.sin(angle * 3);

    const x = Math.cos(angle) * (r + wobble);
    const z = Math.sin(angle) * (r + wobble);

    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CatmullRomCurve3(points);
  
  // Tube parameters: radius 0.06, tubularSegments matches points, radialSegments 12 (enough for a flattened look)
  const tubeGeom = new THREE.TubeGeometry(path, 200, 0.055, 12, false);
  
  // Flatten the tube into a ribbon by scaling Y
  // We do this by modifying the geometry vertices directly to keep transforms clean
  const posAttr = tubeGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    // Flatten Y to make it a ribbon
    vertex.y *= 0.35; 
    // Taper the ends slightly
    const t = i / posAttr.count;
    const taper = (t < 0.1 || t > 0.9) ? 0.5 : 1.0;
    vertex.multiplyScalar(taper);
    
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  tubeGeom.computeVertexNormals();

  const swirl = new THREE.Mesh(tubeGeom, swirlMat);
  
  // Rotate the swirl to match the reference orientation
  // The reference shows the spiral face somewhat towards the camera, tilted.
  swirl.rotation.z = Math.PI / 8;
  swirl.rotation.x = Math.PI / 12;
  
  root.add(swirl);

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