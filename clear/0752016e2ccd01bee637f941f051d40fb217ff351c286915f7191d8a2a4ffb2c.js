export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Glass Shell: Clear, high transmission, low roughness.
  // Metalness must be 0 for dielectric glass.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false, // Helps with transparency sorting
  });

  // Swirl Material: Glossy plastic/glass look, colored by texture.
  const swirlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
  });

  // --- Procedural Texture for Swirl ---
  // Create a 1D gradient texture to map along the tube length.
  // The image shows a rainbow spiral fading to a dark center.
  const texWidth = 512;
  const texHeight = 1;
  const data = new Uint8Array(texWidth * texHeight * 4);

  function setPixel(idx, r, g, b) {
    data[idx * 4] = r;
    data[idx * 4 + 1] = g;
    data[idx * 4 + 2] = b;
    data[idx * 4 + 3] = 255;
  }

  for (let i = 0; i < texWidth; i++) {
    const t = i / texWidth; // 0 (outside) to 1 (center)
    let r, g, b;

    // Map t to colors: Outside(Red) -> Yellow -> Green -> Blue -> Center(Black)
    if (t < 0.15) { 
      // Red / Pink
      r = 220; g = 60; b = 100; 
    } else if (t < 0.30) { 
      // Orange / Yellow
      r = 255; g = 200; b = 50; 
    } else if (t < 0.45) { 
      // Green
      r = 50; g = 220; b = 100; 
    } else if (t < 0.60) { 
      // Cyan / Blue
      r = 50; g = 150; b = 255; 
    } else if (t < 0.75) { 
      // Purple / Indigo
      r = 100; g = 50; b = 200; 
    } else { 
      // Dark Center
      r = 20; g = 20; b = 40; 
    }
    setPixel(i, r, g, b);
  }

  const swirlTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  swirlTexture.colorSpace = THREE.SRGBColorSpace;
  swirlTexture.wrapS = THREE.ClampToEdgeWrapping; // Clamp so ends don't repeat weirdly
  swirlTexture.needsUpdate = true;
  swirlMat.map = swirlTexture;

  // --- Geometry: Glass Sphere ---
  // Radius 1.0, high segment count for smooth refraction silhouette.
  const sphereGeom = new THREE.SphereGeometry(1.0, 48, 48);
  const glassSphere = new THREE.Mesh(sphereGeom, glassMat);
  root.add(glassSphere);

  // --- Geometry: Inner Swirl ---
  // Construct a spiral path that starts wide (outside) and tightens to the center.
  const points = [];
  const turns = 1.6; // Number of spiral rotations
  const segments = 120;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1
    const angle = t * turns * Math.PI * 2;
    
    // Radius tapers from 0.85 (near sphere edge) to 0.05 (center)
    const radius = 0.85 * (1 - t) + 0.05 * t;
    
    // Add slight vertical undulation to give the ribbon 3D volume, not just a flat disk
    // The swirl tilts up at the outer edge in the reference.
    const y = Math.sin(t * Math.PI) * 0.15 * (1 - t);
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CatmullRomCurve3(points);
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  // Radius 0.12 creates a thick ribbon.
  const swirlGeom = new THREE.TubeGeometry(path, 120, 0.12, 16, false);
  
  const swirl = new THREE.Mesh(swirlGeom, swirlMat);
  
  // Flatten the tube cross-section to look like a ribbon rather than a pipe
  // Scale Y of the mesh (local space) to squash the tube diameter
  swirl.scale.set(1, 0.5, 1);
  
  // Rotate the entire swirl assembly to match the dynamic angle in the reference
  // Tilted forward and to the side.
  swirl.rotation.x = Math.PI / 3.5; 
  swirl.rotation.z = Math.PI / 6;
  
  root.add(swirl);

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