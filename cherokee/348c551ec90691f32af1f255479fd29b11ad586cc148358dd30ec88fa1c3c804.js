export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Antique Bronze / Copper look. Metalness capped at 0.6 per rules.
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Darker metal for the mesh/lattice
  const meshMat = new THREE.MeshStandardMaterial({
    color: 0x4a3c31,
    metalness: 0.5,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  // --- Helpers ---

  // Procedural Diamond Lattice Texture
  function createLatticeTexture() {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const lineThickness = 6;
    const gridSize = 32;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Diagonal lines for diamond pattern
        const d1 = (x + y) % gridSize;
        const d2 = (x - y + size) % gridSize;
        
        let alpha = 0;
        // Check proximity to diagonal lines
        if (d1 < lineThickness || d1 > gridSize - lineThickness ||
            d2 < lineThickness || d2 > gridSize - lineThickness) {
          alpha = 255;
          // Color: dark bronze
          data[idx] = 100;
          data[idx + 1] = 80;
          data[idx + 2] = 60;
        } else {
          alpha = 0; // Transparent hole
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        }
        data[idx + 3] = alpha;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 6); // Repeat pattern across the panel
    texture.needsUpdate = true;
    return texture;
  }

  const latticeTexture = createLatticeTexture();
  const latticeMaterial = meshMat.clone();
  latticeMaterial.map = latticeTexture;
  latticeMaterial.transparent = true;
  latticeMaterial.alphaTest = 0.5;

  // --- Geometry Construction ---

  // 1. Base (Flared Bell Shape)
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.38, 0),
    new THREE.Vector2(0.40, 0.05),
    new THREE.Vector2(0.32, 0.25),
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, bronzeMat);
  root.add(base);

  // 2. Body Frame (Hexagonal Prism)
  const bodyHeight = 0.55;
  const bodyRadius = 0.32;
  const postWidth = 0.04;
  const postDepth = 0.06;
  
  // Vertical Posts (6)
  const postGeom = new THREE.BoxGeometry(postWidth, bodyHeight, postDepth);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * bodyRadius;
    const z = Math.sin(angle) * bodyRadius;
    
    const post = new THREE.Mesh(postGeom, bronzeMat);
    post.position.set(x, 0.25 + bodyHeight / 2, z);
    post.rotation.y = -angle; // Face center
    root.add(post);

    // Hinges (Small boxes on posts)
    if (i % 2 === 0) { // Add hinges to alternating posts
      const hingeGeom = new THREE.BoxGeometry(0.015, 0.04, 0.02);
      const hinge1 = new THREE.Mesh(hingeGeom, bronzeMat);
      hinge1.position.set(x + Math.cos(angle)*0.03, 0.25 + 0.1, z + Math.sin(angle)*0.03);
      hinge1.rotation.y = -angle;
      root.add(hinge1);

      const hinge2 = new THREE.Mesh(hingeGeom, bronzeMat);
      hinge2.position.set(x + Math.cos(angle)*0.03, 0.25 + 0.45, z + Math.sin(angle)*0.03);
      hinge2.rotation.y = -angle;
      root.add(hinge2);
    }
    
    // Latch (Front post, i=0 is front in this loop if angle starts at 0)
    if (i === 0) {
      const latchGeom = new THREE.SphereGeometry(0.025, 16, 16);
      const latch = new THREE.Mesh(latchGeom, bronzeMat);
      latch.position.set(x + Math.cos(angle)*0.04, 0.25 + 0.27, z + Math.sin(angle)*0.04);
      root.add(latch);
    }
  }

  // Top and Bottom Rings for the body frame
  const ringGeom = new THREE.TorusGeometry(bodyRadius, 0.025, 8, 6);
  // Bottom Ring
  const bottomRing = new THREE.Mesh(ringGeom, bronzeMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = 0.25;
  root.add(bottomRing);
  
  // Top Ring
  const topRing = new THREE.Mesh(ringGeom, bronzeMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 0.25 + bodyHeight;
  root.add(topRing);

  // 3. Lattice Panels (6 Planes inside the frame)
  const panelWidth = bodyRadius * 1.15; // Chord length approx
  const panelHeight = bodyHeight - 0.05;
  const panelGeom = new THREE.PlaneGeometry(panelWidth, panelHeight);
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6; // Offset to be between posts
    const dist = bodyRadius * Math.cos(Math.PI / 6); // Apothem
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const panel = new THREE.Mesh(panelGeom, latticeMaterial);
    panel.position.set(x, 0.25 + bodyHeight / 2, z);
    panel.rotation.y = -angle;
    // Push slightly inward so it sits behind the frame posts
    panel.translateZ(0.02); 
    root.add(panel);
  }

  // 4. Top Cap (Domed)
  const capProfile = [
    new THREE.Vector2(0.32, 0), // Match body top radius
    new THREE.Vector2(0.34, 0.05),
    new THREE.Vector2(0.25, 0.15),
    new THREE.Vector2(0.15, 0.22),
    new THREE.Vector2(0.08, 0.25),
    new THREE.Vector2(0, 0.28), // Top center
  ];
  const capGeom = new THREE.LatheGeometry(capProfile, 32);
  const topCap = new THREE.Mesh(capGeom, bronzeMat);
  topCap.position.y = 0.25 + bodyHeight;
  root.add(topCap);

  // 5. Handle (Curved Tube)
  const handleRadius = 0.15;
  const handleHeight = 0.35;
  const curvePoints = [
    new THREE.Vector3(-0.15, 0.25 + bodyHeight + 0.05, 0),
    new THREE.Vector3(-0.20, 0.25 + bodyHeight + 0.25, 0),
    new THREE.Vector3(0, 0.25 + bodyHeight + handleHeight, 0),
    new THREE.Vector3(0.20, 0.25 + bodyHeight + 0.25, 0),
    new THREE.Vector3(0.15, 0.25 + bodyHeight + 0.05, 0),
  ];
  const handleCurve = new THREE.CatmullRomCurve3(curvePoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.025, 8, false);
  const handle = new THREE.Mesh(handleGeom, bronzeMat);
  // Rotate handle to align with lantern sides (attach to opposite posts)
  handle.rotation.y = Math.PI / 6; 
  root.add(handle);

  // Handle Attachment Points (Small spheres where handle meets cap)
  const attachGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const attach1 = new THREE.Mesh(attachGeom, bronzeMat);
  attach1.position.set(-0.15, 0.25 + bodyHeight + 0.05, 0);
  attach1.rotation.y = Math.PI / 6; // Match handle rotation context if needed, but sphere is symmetric
  // Need to rotate position to match handle orientation
  attach1.position.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/6);
  root.add(attach1);

  const attach2 = new THREE.Mesh(attachGeom, bronzeMat);
  attach2.position.set(0.15, 0.25 + bodyHeight + 0.05, 0);
  attach2.position.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/6);
  root.add(attach2);

  // 6. Finial (Top Knob)
  const finialGeom = new THREE.SphereGeometry(0.04, 16, 16);
  const finial = new THREE.Mesh(finialGeom, bronzeMat);
  finial.position.y = 0.25 + bodyHeight + 0.28 + 0.05;
  root.add(finial);

  // 7. Inner Candle Holder (Optional detail visible through mesh)
  const holderGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16);
  const holderMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
  const holder = new THREE.Mesh(holderGeom, holderMat);
  holder.position.y = 0.25 + 0.075;
  root.add(holder);

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