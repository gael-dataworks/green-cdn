export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const SLICE_RADIUS = 0.4;
  const SLICE_HEIGHT = 0.32;
  const CRUST_HEIGHT = 0.04;
  const FILLING_HEIGHT = SLICE_HEIGHT - CRUST_HEIGHT;
  const SLICE_ANGLE = Math.PI / 2.5; // ~72 degrees

  // --- Deterministic Noise Helper ---
  function createNoiseTexture(baseColorHex, variance, size = 128) {
    const data = new Uint8Array(size * size * 4);
    const base = new THREE.Color(baseColorHex);
    for (let i = 0; i < size * size; i++) {
      const x = i % size;
      const y = Math.floor(i / size);
      // Pseudo-random noise without Math.random
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noiseVal = n - Math.floor(n); 
      
      // Apply variance
      const r = Math.max(0, Math.min(255, base.r * 255 + (noiseVal - 0.5) * variance * 255));
      const g = Math.max(0, Math.min(255, base.g * 255 + (noiseVal - 0.5) * variance * 255));
      const b = Math.max(0, Math.min(255, base.b * 255 + (noiseVal - 0.5) * variance * 255));
      
      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // --- Materials ---
  // Filling: Creamy, porous sponge
  const fillingMat = new THREE.MeshStandardMaterial({
    color: 0xfffdd0,
    roughness: 0.8,
    metalness: 0.0,
    map: createNoiseTexture('#fffdd0', 0.15, 64)
  });

  // Crust: Brown, crumbly
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0xc4a474,
    roughness: 0.9,
    metalness: 0.0,
    map: createNoiseTexture('#c4a474', 0.2, 64)
  });

  // Glaze: Shiny, wet, red
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xd62856,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.2,
    transparent: true,
    opacity: 0.95
  });

  // Cherry: Dark red, very glossy
  const cherryMat = new THREE.MeshPhysicalMaterial({
    color: 0x720e1e,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });

  // --- Geometry Helpers ---
  function createWedgeShape(radius, angle) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(radius, 0);
    shape.absarc(0, 0, radius, 0, angle, false);
    shape.lineTo(0, 0);
    return shape;
  }

  function createExtrudedWedge(shape, depth, material, x, y, z, rotX = 0, rotY = 0, rotZ = 0) {
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: false,
      steps: 1
    });
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, rotZ);
    root.add(mesh);
    return mesh;
  }

  // --- Build Cake ---
  
  // 1. Crust (Bottom Layer)
  const crustShape = createWedgeShape(SLICE_RADIUS, SLICE_ANGLE);
  // Crust is slightly smaller radius to simulate crumbs falling off / inset
  const crustShapeInset = createWedgeShape(SLICE_RADIUS * 0.98, SLICE_ANGLE);
  
  const crust = createExtrudedWedge(
    crustShapeInset, 
    CRUST_HEIGHT, 
    crustMat, 
    0, 
    -SLICE_HEIGHT / 2 + CRUST_HEIGHT / 2, 
    0, 
    -Math.PI / 2, // Rotate so extrusion is along Y (up)
    0, 
    0
  );
  // Name for critic
  crust.name = "crust";

  // 2. Filling (Main Body)
  const fillingShape = createWedgeShape(SLICE_RADIUS, SLICE_ANGLE);
  const filling = createExtrudedWedge(
    fillingShape, 
    FILLING_HEIGHT, 
    fillingMat, 
    0, 
    -SLICE_HEIGHT / 2 + CRUST_HEIGHT + FILLING_HEIGHT / 2, 
    0, 
    -Math.PI / 2, 
    0, 
    0
  );
  filling.name = "filling";

  // 3. Glaze (Top Layer)
  // Thin layer on top
  const glazeShape = createWedgeShape(SLICE_RADIUS * 0.95, SLICE_ANGLE);
  const glazeLayer = createExtrudedWedge(
    glazeShape,
    0.015,
    glazeMat,
    0,
    SLICE_HEIGHT / 2 - 0.015 / 2,
    0,
    -Math.PI / 2,
    0,
    0
  );
  glazeLayer.name = "glaze_layer";

  // 4. Glaze Drips (Along the back arc)
  // Place small spheres along the arc to simulate dripping
  const dripCount = 5;
  for (let i = 0; i < dripCount; i++) {
    const t = i / (dripCount - 1);
    const angle = t * SLICE_ANGLE;
    const x = Math.cos(angle) * SLICE_RADIUS * 0.95;
    const z = Math.sin(angle) * SLICE_RADIUS * 0.95;
    const y = SLICE_HEIGHT / 2 - 0.02; // Start from top edge
    
    // Drip extends down
    const dripHeight = 0.03 + Math.sin(t * Math.PI) * 0.04;
    
    const dripGeom = new THREE.SphereGeometry(0.015, 16, 16);
    const drip = new THREE.Mesh(dripGeom, glazeMat);
    // Scale Y to make it a drip
    drip.scale.set(1.5, dripHeight / 0.015, 1.5);
    drip.position.set(x, y - dripHeight / 2, z);
    root.add(drip);
    drip.name = `glaze_drip_${i}`;
  }

  // 5. Cherries (Toppings)
  const cherryCount = 3;
  const cherryRadius = 0.045;
  const cherryLineDist = 0.12; // Distance between cherries
  const cherryStartOffset = -0.12; // Offset from center of slice
  
  // Bisector angle
  const bisector = SLICE_ANGLE / 2;
  const cherryRadiusDist = SLICE_RADIUS * 0.6; // Distance from tip

  for (let i = 0; i < cherryCount; i++) {
    // Distribute along the bisector line
    const offset = (i - (cherryCount - 1) / 2) * cherryLineDist;
    
    // Calculate position in XZ plane
    // We want them along the center line of the wedge
    const cx = Math.cos(bisector) * cherryRadiusDist;
    const cz = Math.sin(bisector) * cherryRadiusDist;
    
    // But we also want to spread them slightly along the wedge length? 
    // Image shows them in a row along the length of the slice (from tip to back)
    // Let's re-calculate: Tip is at 0,0. Back is at Radius.
    // They are arranged from near tip to near back.
    
    const distFromTip = 0.15 + i * 0.12;
    const px = Math.cos(bisector) * distFromTip;
    const pz = Math.sin(bisector) * distFromTip;
    const py = SLICE_HEIGHT / 2 + cherryRadius * 0.8; // Sit on top

    const cherryGeom = new THREE.SphereGeometry(cherryRadius, 32, 32);
    const cherry = new THREE.Mesh(cherryGeom, cherryMat);
    cherry.position.set(px, py, pz);
    
    // Slight squash
    cherry.scale.set(1, 0.9, 1);
    
    root.add(cherry);
    cherry.name = `cherry_${i}`;
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