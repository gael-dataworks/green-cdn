export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass material: capped metalness for no-env-map rendering, moderate roughness for aged look.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Darker brass/bronze for the central pivot area (oxidized look)
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    metalness: 0.5,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const radius = 0.5;
  const thickness = 0.04;
  const armRadius = 0.012;
  const armLength = 0.85; // Longer than base radius to overhang slightly

  // --- Procedural Texture for Dial Face ---
  // Generates concentric circles, radial lines, and tick marks on a brass background.
  function createDialTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const brassR = 212, brassG = 175, brassB = 55; // #d4af37
    const lineR = 40, lineG = 30, lineB = 20;      // Dark engraving color

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 10;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Distance from center
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        let r = brassR, g = brassG, b = brassB;

        // Concentric circles
        // Radii at roughly 20%, 35%, 50%, 65%, 80% of maxR
        const circles = [0.2, 0.35, 0.5, 0.65, 0.8];
        let onLine = false;
        
        for (let i = 0; i < circles.length; i++) {
          const targetR = circles[i] * maxR;
          if (Math.abs(dist - targetR) < 2.0) {
            onLine = true;
            break;
          }
        }

        // Radial lines (every 30 degrees = 12 lines, plus 45 deg intermediates)
        // Normalize angle to 0-2PI
        let normAngle = angle < 0 ? angle + Math.PI * 2 : angle;
        // Check proximity to 0, 30, 45, 60, 90... degrees
        const step = Math.PI / 12; // 15 degrees
        // We want main lines every 30 deg, minor every 15? Let's do a grid.
        // Just simple radial lines for the grid look
        if (dist > 0.1 * maxR && dist < 0.95 * maxR) {
            // Check if angle is close to a multiple of 15 degrees
            const rem = normAngle % (Math.PI / 12);
            if (rem < 0.05 || rem > (Math.PI / 12) - 0.05) {
                onLine = true;
            }
        }

        // Outer tick marks ring
        if (dist > 0.9 * maxR && dist < 0.98 * maxR) {
             const tickStep = Math.PI / 36; // 5 degrees
             const rem = normAngle % tickStep;
             if (rem < 0.03 || rem > tickStep - 0.03) {
                 onLine = true;
             }
        }
        
        // Central crosshair
        if (Math.abs(dx) < 2.0 || Math.abs(dy) < 2.0) {
            if (dist < 0.95 * maxR) onLine = true;
        }

        if (onLine) {
          r = lineR; g = lineG; b = lineB;
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Wrap to avoid seams if UVs go slightly over, though cylinder cap usually handles 0-1
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  const dialTexture = createDialTexture();
  const dialFaceMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.4,
    map: dialTexture,
  });

  // --- Base Plate ---
  // Cylinder for the body
  const baseGeom = new THREE.CylinderGeometry(radius, radius, thickness, 64);
  const basePlate = new THREE.Mesh(baseGeom, brassMat);
  // Cylinder is Y-up by default. We want the top face to be the dial.
  // The texture needs to be on the top cap. 
  // Standard CylinderGeometry maps the top cap UVs radially, which is perfect for our texture.
  // However, we need to assign the textured material to the top face specifically.
  // CylinderGeometry has 3 groups: side, top, bottom.
  // Group 1 is top cap.
  basePlate.material = [brassMat, dialFaceMat, brassMat]; 
  
  root.add(basePlate);

  // --- Central Hub ---
  const hubGeom = new THREE.SphereGeometry(0.04, 32, 16);
  const hub = new THREE.Mesh(hubGeom, bronzeMat);
  hub.position.y = thickness / 2 + 0.02; // Sit on top of base
  root.add(hub);

  // --- Arms / Pointers ---
  // Helper to create an arm
  function createArm(length, rotX, rotY, rotZ, x, y, z) {
    const geom = new THREE.CylinderGeometry(armRadius * 0.8, armRadius, length, 16);
    // Cylinder is Y-up. To point along Z, rotate X by 90. To point along X, rotate Z by 90.
    // We will orient the cylinder to point along its local +Y initially, then rotate.
    // Actually, easier: Cylinder is along Y. 
    // If we want it to lie flat on XZ, rotate X by 90 deg.
    const mesh = new THREE.Mesh(geom, brassMat);
    
    // Pivot point adjustment: Cylinder center is at 0,0,0. We want one end at 0,0,0.
    // Translate geometry or mesh? Mesh translation is easier for hierarchy, but we are adding to root.
    // Let's translate the mesh so its bottom is at the origin, then rotate.
    mesh.position.y = length / 2; 
    
    // Apply rotations
    mesh.rotation.x = rotX;
    mesh.rotation.y = rotY;
    mesh.rotation.z = rotZ;

    // Apply position offset (all start from center)
    mesh.position.x += x;
    mesh.position.y += y;
    mesh.position.z += z;

    return mesh;
  }

  const pivotY = thickness / 2 + 0.02;

  // Arm 1: The Gnomon (Long, angled up)
  // Points roughly to 1 o'clock in the image, angled up.
  // Let's say it points in XZ plane at -45 deg (towards +X, -Z? No, image shows +X, +Z roughly).
  // Image: Top-right. Let's aim for +X, +Z diagonal.
  // Angle up: ~30-40 degrees from horizontal.
  const gnomon = createArm(armLength, -Math.PI / 6, Math.PI / 4, 0, 0, pivotY, 0);
  // Correction: createArm puts pivot at bottom. 
  // We need to rotate around the bottom point (0, pivotY, 0).
  // My helper sets position.y = length/2, so center is at length/2. Bottom is at 0.
  // So rotation happens around the center unless we change pivot.
  // Better approach: Create a Group for each arm, add mesh to group, offset mesh in group, rotate group.
  
  function addArm(length, angleX, angleY, angleZ) {
      const group = new THREE.Group();
      group.position.set(0, pivotY, 0);
      
      const geom = new THREE.CylinderGeometry(armRadius * 0.7, armRadius * 0.9, length, 16);
      const mesh = new THREE.Mesh(geom, brassMat);
      // Offset mesh so bottom is at group origin
      mesh.position.y = length / 2;
      
      group.add(mesh);
      
      // Rotate the group to aim the arm
      group.rotation.x = angleX;
      group.rotation.y = angleY;
      group.rotation.z = angleZ;
      
      root.add(group);
      return group;
  }

  // 1. Main Gnomon: Angled up (~50 deg) and to the right (~45 deg azimuth)
  // In image, it points to top-right.
  addArm(armLength, -Math.PI / 3.5, Math.PI / 4, 0);

  // 2. Horizontal Arm: Points Right (+X)
  // Rotate -90 deg around Z to point along +X (since cylinder is Y-up)
  // Wait, if cylinder is Y-up, rotating Z by -90 makes it point +X.
  // But I'm using group rotation.
  // Default cylinder points +Y.
  // To point +X: Rotate Z -90 (or 270).
  // To point +Z: Rotate X 90.
  // To point -X: Rotate Z 90.
  // To point -Z: Rotate X -90.
  
  // Let's restart the arm logic to be precise.
  // Clear previous arm attempts from logic, implement cleanly below.
  while(root.children.length > 2) { root.remove(root.children[2]); } // Remove temp arms

  // Re-implement arms cleanly
  function makePointer(len, rotOrder) {
      const g = new THREE.Group();
      g.position.set(0, pivotY, 0);
      const m = new THREE.Mesh(
          new THREE.CylinderGeometry(armRadius * 0.6, armRadius, len, 12),
          brassMat
      );
      m.position.y = len / 2;
      g.add(m);
      
      // Apply rotations based on target direction
      // Default is +Y.
      if (rotOrder === 'right') { // +X
          g.rotation.z = -Math.PI / 2;
      } else if (rotOrder === 'left') { // -X
          g.rotation.z = Math.PI / 2;
      } else if (rotOrder === 'front') { // +Z
          g.rotation.x = Math.PI / 2;
      } else if (rotOrder === 'back') { // -Z
          g.rotation.x = -Math.PI / 2;
      } else if (rotOrder === 'up_right') {
          // Angled up and right
          g.rotation.z = -Math.PI / 3; // Tilt towards X
          g.rotation.x = -Math.PI / 4; // Tilt up
      } else if (rotOrder === 'down_left') {
          // On the dial face, pointing down-left
          g.rotation.z = Math.PI / 2; // Point -X
          g.rotation.x = -Math.PI / 4; // Tilt down into the dial? No, lie on dial.
          // If lying on dial (XZ plane), we need to rotate X by 90 first to lay flat, then rotate Y for angle.
          // Let's use a simpler vector approach.
      }
      root.add(g);
  }

  // Let's use a generic vector-based arm creator
  function addVectorArm(len, x, y, z) {
      const group = new THREE.Group();
      group.position.set(0, pivotY, 0);
      
      const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(armRadius * 0.6, armRadius * 0.9, len, 12),
          brassMat
      );
      mesh.position.y = len / 2;
      group.add(mesh);
      
      // Orient group to look at direction (x, y, z)
      // Default up is Y. We want the cylinder (local Y) to point along (x,y,z).
      // So we just rotate the group.
      const target = new THREE.Vector3(x, y, z).normalize();
      // We need a quaternion to rotate (0,1,0) to target
      const v1 = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(v1, target);
      group.quaternion.copy(quaternion);
      
      root.add(group);
  }

  // Based on image analysis:
  // 1. Long arm pointing Up-Right (Gnomon). Vector: (1, 1, 0) roughly.
  addVectorArm(armLength, 1, 0.8, 0.5); 
  
  // 2. Horizontal arm pointing Right. Vector: (1, 0, 0).
  addVectorArm(armLength * 0.9, 1, 0, 0);

  // 3. Short arm pointing Down-Left. Vector: (-1, 0, -1).
  addVectorArm(armLength * 0.5, -1, 0, -1);

  // 4. Short arm pointing Down-Right. Vector: (1, 0, -1).
  addVectorArm(armLength * 0.5, 1, 0, -1);

  // Central decorative cap on top of the pivot
  const capGeom = new THREE.SphereGeometry(armRadius * 1.5, 16, 8);
  const cap = new THREE.Mesh(capGeom, bronzeMat);
  cap.position.set(0, pivotY + 0.01, 0);
  root.add(cap);

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