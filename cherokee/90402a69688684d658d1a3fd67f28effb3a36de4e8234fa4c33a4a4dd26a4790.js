export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6a00,
    roughness: 0.4,
    metalness: 0.1,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.1,
  });

  const greyMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Procedural Label Texture
  function createLabelTexture() {
    const w = 256, h = 128;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      // Black background
      data[i * 4] = 20;
      data[i * 4 + 1] = 20;
      data[i * 4 + 2] = 20;
      data[i * 4 + 3] = 255;
    }
    // White text bars
    const ctx = { w, h, data }; // Mock context for logic
    // Top bar (Logo area)
    for (let y = 20; y < 50; y++) {
      for (let x = 20; x < 100; x++) {
        const idx = (y * w + x) * 4;
        data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; // White
      }
      // Orange accent in logo
      for (let x = 20; x < 40; x++) {
        const idx = (y * w + x) * 4;
        data[idx] = 255; data[idx+1] = 100; data[idx+2] = 0;
      }
    }
    // Bottom bar (Specs)
    for (let y = 70; y < 90; y++) {
      for (let x = 20; x < 200; x++) {
        const idx = (y * w + x) * 4;
        data[idx] = 200; data[idx+1] = 200; data[idx+2] = 200; // Grey text
      }
    }
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.0,
    map: createLabelTexture(),
  });

  // --- Geometry Helpers ---

  // 1. Main Orange Body (Handle + Motor Housing)
  // We'll compose this of a cylinder for the handle and a rounded box for the body
  const handleGeom = new THREE.CylinderGeometry(0.13, 0.14, 0.35, 24);
  handleGeom.rotateX(Math.PI / 2); // Align along Z
  const handle = new THREE.Mesh(handleGeom, orangeMat);
  handle.position.z = -0.45;
  root.add(handle);

  const bodyGeom = new THREE.BoxGeometry(0.26, 0.24, 0.55);
  // Round the edges slightly by scaling vertices or just use a high-segment box? 
  // For procedural simplicity, we'll keep the box and add fillets if needed, 
  // but a simple box with smoothed normals (not available here) or just standard box works for low-poly.
  // Let's use a slightly smaller box inside to simulate the main chunk.
  const body = new THREE.Mesh(bodyGeom, orangeMat);
  body.position.z = -0.15;
  root.add(body);

  // 2. Black Head (Gear Housing)
  // Tapered shape at the front
  const headShape = new THREE.Shape();
  headShape.moveTo(0, -0.11);
  headShape.lineTo(0.12, -0.11);
  headShape.lineTo(0.14, -0.08);
  headShape.lineTo(0.14, 0.08);
  headShape.lineTo(0.12, 0.11);
  headShape.lineTo(0, 0.11);
  headShape.lineTo(-0.02, 0.08);
  headShape.lineTo(-0.02, -0.08);
  headShape.lineTo(0, -0.11);

  const headExtrudeSettings = { depth: 0.22, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
  const headGeom = new THREE.ExtrudeGeometry(headShape, headExtrudeSettings);
  // Center the geometry
  headGeom.center();
  const head = new THREE.Mesh(headGeom, blackMat);
  head.position.z = 0.25;
  root.add(head);

  // 3. Sanding Pad (Triangular)
  const padShape = new THREE.Shape();
  padShape.moveTo(0, -0.09);
  padShape.lineTo(0.14, -0.09);
  padShape.lineTo(0.14, 0.09);
  padShape.lineTo(0, 0.09);
  padShape.lineTo(-0.02, 0);
  padShape.lineTo(0, -0.09);

  const padGeom = new THREE.ExtrudeGeometry(padShape, { depth: 0.015, bevelEnabled: false });
  padGeom.center();
  const pad = new THREE.Mesh(padGeom, greyMat);
  pad.position.z = 0.42;
  // Tilt the pad slightly down
  pad.rotation.x = 0.15;
  root.add(pad);

  // 4. Vents (Black slots on the side of the orange body)
  const ventGeom = new THREE.BoxGeometry(0.01, 0.025, 0.06);
  const ventPositions = [
    [0.131, 0.05, -0.15],
    [0.131, 0.0, -0.15],
    [0.131, -0.05, -0.15],
    [0.131, 0.05, -0.25],
    [0.131, 0.0, -0.25],
    [0.131, -0.05, -0.25],
  ];
  for (const [x, y, z] of ventPositions) {
    const vent = new THREE.Mesh(ventGeom, blackMat);
    vent.position.set(x, y, z);
    root.add(vent);
  }

  // 5. Switch (Black slider on the side)
  const switchGeom = new THREE.BoxGeometry(0.01, 0.04, 0.08);
  const switchMesh = new THREE.Mesh(switchGeom, blackMat);
  switchMesh.position.set(0.131, 0.08, -0.05);
  root.add(switchMesh);

  // 6. Labels (Textured planes on the side)
  const labelGeom1 = new THREE.PlaneGeometry(0.18, 0.06);
  const label1 = new THREE.Mesh(labelGeom1, labelMat);
  label1.position.set(0.131, 0.05, -0.05);
  label1.rotation.y = Math.PI / 2; // Face outward
  root.add(label1);

  const labelGeom2 = new THREE.PlaneGeometry(0.12, 0.04);
  const label2 = new THREE.Mesh(labelGeom2, labelMat);
  label2.position.set(0.131, -0.05, -0.25);
  label2.rotation.y = Math.PI / 2;
  root.add(label2);

  // 7. Screws (Small black cylinders)
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8);
  screwGeom.rotateX(Math.PI / 2);
  const screwPositions = [
    [0.131, 0.10, -0.35],
    [0.131, -0.10, -0.35],
    [0.131, 0.10, 0.05],
    [0.131, -0.10, 0.05],
  ];
  for (const [x, y, z] of screwPositions) {
    const screw = new THREE.Mesh(screwGeom, blackMat);
    screw.position.set(x, y, z);
    root.add(screw);
  }

  // 8. Front Mounting Screw/Hole on the black head
  const mountScrewGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12);
  mountScrewGeom.rotateX(Math.PI / 2);
  const mountScrew = new THREE.Mesh(mountScrewGeom, blackMat);
  mountScrew.position.set(0.131, 0, 0.25);
  root.add(mountScrew);

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