export default function generate(THREE) {
  // --- Constants & Dimensions ---
  const WIDTH = 0.50;
  const HEIGHT = 0.32;
  const DEPTH = 0.04;
  const CORNER_RADIUS = 0.03;

  // Colors
  const COLOR_LEATHER = 0x8a3346; // Burgundy
  const COLOR_STITCH = 0x2a1015;  // Dark brown/black
  const COLOR_LEATHER_LIGHT = 0x9a4356; // Highlight

  // --- Helper: Fit to Unit Cube ---
  function fitToUnitCube(root) {
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

  // --- Helper: Procedural Quilted Texture ---
  function createQuiltedTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 3);
    const freq = 18; // Frequency of diamonds
    const seamWidth = 0.15; // Thickness of stitching lines

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Normalize coordinates
        const u = x / size;
        const v = y / size;

        // Rotate coordinates 45 degrees for diamond pattern
        const cx = (u - 0.5) * Math.sqrt(2);
        const cy = (v - 0.5) * Math.sqrt(2);

        // Grid cell coordinates
        const gx = Math.floor(cx * freq);
        const gy = Math.floor(cy * freq);

        // Local coordinates within the cell (-0.5 to 0.5)
        const lx = (cx * freq) - gx - 0.5;
        const ly = (cy * freq) - gy - 0.5;

        // Distance from center of diamond (Manhattan distance for diamond shape)
        const dist = Math.abs(lx) + Math.abs(ly);
        
        // Determine if we are in a seam or a puff
        // Seams are where dist is close to 0.5 (edges of diamonds) or grid lines
        // Actually, let's model the "puff" as the center, seam as the edge.
        // Diamond shape: |x| + |y| <= 0.5. 
        // We want the seam to be the boundary between diamonds.
        
        // Simpler approach: Distance to nearest grid intersection in rotated space
        // But let's stick to the visual of puffy squares rotated.
        
        // Calculate a value that is 1 at center of diamond, 0 at edges
        let puff = 1.0 - (dist * 2.0); // 1 at center, 0 at edge (|x|+|y|=0.5)
        puff = Math.max(0, puff);

        // Seam detection: if puff is low, it's a seam
        const isSeam = puff < seamWidth;

        const idx = (y * size + x) * 3;

        if (isSeam) {
          // Stitching color (dark)
          data[idx] = 60;
          data[idx + 1] = 20;
          data[idx + 2] = 30;
        } else {
          // Leather color with shading based on puff height
          // Normalize puff for shading (0 to 1)
          const shade = (puff - seamWidth) / (1.0 - seamWidth);
          
          // Base color
          let r = 138; 
          let g = 51;
          let b = 70;

          // Add highlight to center of puff
          const highlight = Math.pow(shade, 1.5) * 40;
          
          // Add subtle noise for leather grain (deterministic)
          const noise = (Math.sin(x * 13.0) * Math.cos(y * 17.0)) * 10;

          data[idx] = Math.min(255, r + highlight + noise);
          data[idx + 1] = Math.min(255, g + highlight * 0.5 + noise * 0.5);
          data[idx + 2] = Math.min(255, b + highlight * 0.5 + noise * 0.5);
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const root = new THREE.Group();

  // --- Materials ---
  const leatherMat = new THREE.MeshStandardMaterial({
    color: COLOR_LEATHER,
    roughness: 0.6,
    metalness: 0.1,
  });

  const quiltedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White, tinted by map
    map: createQuiltedTexture(),
    roughness: 0.65,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const darkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x6a2333, // Darker for sides/back
    roughness: 0.7,
    metalness: 0.0,
  });

  // --- Geometry Construction ---

  // 1. Main Body (Back and Sides)
  // We use a BoxGeometry for the main volume, slightly smaller than total width/height
  // to allow the front face to sit on top.
  const bodyDepth = DEPTH * 0.9;
  const bodyGeom = new THREE.BoxGeometry(WIDTH - 0.002, HEIGHT - 0.002, bodyDepth);
  
  // Round the corners of the box geometry by scaling vertices? 
  // No, let's just use a standard box and rely on the front face for detail.
  // To make it look like a clutch, we can taper it slightly or just keep it rectangular.
  // The image shows soft rounded corners.
  // Let's modify the box vertices to round the corners slightly.
  const posAttr = bodyGeom.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    // Simple rounding: clamp corners
    const x = Math.abs(vertex.x);
    const y = Math.abs(vertex.y);
    const z = Math.abs(vertex.z);
    
    // Check if near a corner in XY plane
    if (x > WIDTH/2 - 0.05 && y > HEIGHT/2 - 0.05) {
        // Pull in towards the rounded corner arc
        const angle = Math.atan2(vertex.y, vertex.x);
        // Target radius approx
        const targetR = Math.sqrt(Math.pow(WIDTH/2 - 0.02, 2) + Math.pow(HEIGHT/2 - 0.02, 2)); 
        // This is getting complex for a box. 
        // Let's just keep the box sharp-ish, the texture will distract.
        // Actually, let's just use the box as is, it's a clutch.
    }
  }
  
  const body = new THREE.Mesh(bodyGeom, darkLeatherMat);
  body.position.z = -bodyDepth / 2; // Push back so front face is at z=0
  root.add(body);

  // 2. Front Quilted Face
  // Use PlaneGeometry with high segments for displacement
  const segmentsX = 40;
  const segmentsY = 24;
  const frontGeom = new THREE.PlaneGeometry(WIDTH, HEIGHT, segmentsX, segmentsY);
  
  // Displace vertices to create puffy diamonds
  const frontPos = frontGeom.attributes.position;
  const freq = 12; // Match texture frequency roughly
  const amp = 0.008; // Height of puff

  for (let i = 0; i < frontPos.count; i++) {
    const x = frontPos.getX(i);
    const y = frontPos.getY(i);
    
    // Rotate coords for diamond pattern
    const cx = (x / WIDTH + 0.5) * Math.sqrt(2);
    const cy = (y / HEIGHT + 0.5) * Math.sqrt(2);
    
    const gx = Math.floor(cx * freq);
    const gy = Math.floor(cy * freq);
    const lx = (cx * freq) - gx - 0.5;
    const ly = (cy * freq) - gy - 0.5;
    
    const dist = Math.abs(lx) + Math.abs(ly);
    let puff = 1.0 - (dist * 2.0);
    puff = Math.max(0, puff);
    
    // Smooth the puff
    const height = Math.pow(puff, 1.5) * amp;
    
    // Only displace if not in seam
    if (puff > 0.2) {
        frontPos.setZ(i, height);
    }
  }
  
  frontGeom.computeVertexNormals();
  
  const frontFace = new THREE.Mesh(frontGeom, quiltedMat);
  frontFace.position.z = bodyDepth / 2 + 0.001; // Slightly in front of body
  root.add(frontFace);

  // 3. Side Gussets (Thickness)
  // The body box handles the back, but we need to connect front to back on sides.
  // Since we used a Box for body and Plane for front, there's a gap on the sides/top/bottom.
  // Let's add thin boxes for the sides to close the volume.
  
  const sideDepth = DEPTH;
  const sideHeight = HEIGHT;
  const sideWidth = DEPTH;
  
  // Right Side
  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth), darkLeatherMat);
  rightSide.position.set(WIDTH / 2, 0, 0);
  root.add(rightSide);

  // Left Side
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, sideHeight, sideDepth), darkLeatherMat);
  leftSide.position.set(-WIDTH / 2, 0, 0);
  root.add(leftSide);

  // Top Side
  const topSide = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, sideWidth, sideDepth), darkLeatherMat);
  topSide.position.set(0, HEIGHT / 2, 0);
  root.add(topSide);

  // Bottom Side
  const bottomSide = new THREE.Mesh(new THREE.BoxGeometry(WIDTH, sideWidth, sideDepth), darkLeatherMat);
  bottomSide.position.set(0, -HEIGHT / 2, 0);
  root.add(bottomSide);

  // 4. Soften Corners (Visual Trick)
  // Add small spheres or cylinders at the 4 front corners to blend the sharp box edges
  const cornerR = 0.025;
  const cornerGeom = new THREE.SphereGeometry(cornerR, 16, 16);
  const corners = [
    [WIDTH/2 - 0.01, HEIGHT/2 - 0.01, bodyDepth/2],
    [-WIDTH/2 + 0.01, HEIGHT/2 - 0.01, bodyDepth/2],
    [WIDTH/2 - 0.01, -HEIGHT/2 + 0.01, bodyDepth/2],
    [-WIDTH/2 + 0.01, -HEIGHT/2 + 0.01, bodyDepth/2],
  ];

  for (const [x, y, z] of corners) {
    const corner = new THREE.Mesh(cornerGeom, darkLeatherMat);
    corner.position.set(x, y, z);
    // Scale Z to flatten it against the side
    corner.scale.set(1, 1, 0.5);
    root.add(corner);
  }

  // 5. Back Zipper Detail (Optional but adds realism)
  // A thin cylinder along the top back edge
  const zipperGeom = new THREE.CylinderGeometry(0.005, 0.005, WIDTH * 0.8, 8);
  const zipperMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 });
  const zipper = new THREE.Mesh(zipperGeom, zipperMat);
  zipper.rotation.z = Math.PI / 2;
  zipper.position.set(0, HEIGHT / 2, -bodyDepth / 2 - 0.005);
  root.add(zipper);
  
  // Zipper pull tab
  const tabGeom = new THREE.TorusGeometry(0.015, 0.003, 8, 16);
  const tab = new THREE.Mesh(tabGeom, zipperMat);
  tab.position.set(0, HEIGHT / 2 + 0.015, -bodyDepth / 2 - 0.005);
  root.add(tab);

  fitToUnitCube(root);
  return root;
}