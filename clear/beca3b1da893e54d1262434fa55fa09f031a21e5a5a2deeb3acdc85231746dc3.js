export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for the main body and headband
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Softer matte for the headband padding underside
  const paddingMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Ear cushion material (leather-like)
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Inner driver foam
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Procedural Texture for Grill & Logo ---
  // Creates a mesh pattern with the "WWAE" logo
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // Base dark gray
      let r = 30, g = 30, b = 30;
      
      // Mesh pattern (small dots)
      if (x % 6 === 0 && y % 6 === 0) {
        r = 50; g = 50; b = 50;
      }

      // Logo "WWAE" area (centered roughly)
      // Simple blocky text representation
      const cx = W / 2;
      const cy = H / 2;
      const textW = 120;
      const textH = 40;
      
      // Bounding box for text
      if (x > cx - textW/2 && x < cx + textW/2 && y > cy - textH/2 && y < cy + textH/2) {
         // Draw "W"
         if (x < cx - 30) {
             const localX = x - (cx - 60);
             // W shape logic
             if (Math.abs(localX - 15) < 5 || Math.abs(localX - 45) < 5 || (localX > 15 && localX < 45 && y > cy + 10 - (localX-30))) {
                 r = 255; g = 255; b = 255;
             }
         }
         // Draw "W" (second)
         else if (x < cx) {
             const localX = x - (cx - 10);
             if (Math.abs(localX - 15) < 5 || Math.abs(localX - 45) < 5 || (localX > 15 && localX < 45 && y > cy + 10 - (localX-30))) {
                 r = 255; g = 255; b = 255;
             }
         }
         // Draw "A"
         else if (x < cx + 40) {
             const localX = x - (cx + 20);
             if (Math.abs(localX - 25) < 5 || (localX > 5 && localX < 45 && y > cy + 15 - (localX-25)*0.8)) {
                 r = 255; g = 255; b = 255;
             }
         }
         // Draw "E"
         else {
             const localX = x - (cx + 50);
             if (localX < 5 || (localX > 5 && localX < 35 && (Math.abs(y - cy) < 5 || y < cy - 15 || y > cy + 15))) {
                 r = 255; g = 255; b = 255;
             }
         }
      }

      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
      data[i+3] = 255;
    }
  }
  const grillTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  grillTexture.colorSpace = THREE.SRGBColorSpace;
  grillTexture.needsUpdate = true;

  const grillMat = new THREE.MeshStandardMaterial({
    map: grillTexture,
    color: 0xffffff,
    metalness: 0.2,
    roughness: 0.4,
  });

  // --- Geometry Helpers ---

  // 1. Headband Arch
  // Using a Torus but scaled to look like a flat strap
  const headbandGeom = new THREE.TorusGeometry(0.35, 0.06, 16, 48, Math.PI);
  const headband = new THREE.Mesh(headbandGeom, bodyMat);
  headband.rotation.x = Math.PI; // Flip to open downwards
  headband.scale.set(1, 0.6, 1); // Flatten it
  root.add(headband);

  // Headband Padding (underside)
  const paddingGeom = new THREE.TorusGeometry(0.33, 0.04, 16, 48, Math.PI);
  const padding = new THREE.Mesh(paddingGeom, paddingMat);
  padding.rotation.x = Math.PI;
  padding.scale.set(1, 0.7, 1);
  padding.position.y = -0.02; // Slightly lower than the band
  root.add(padding);

  // 2. Ear Cup Housing Function
  function createEarCup(isLeft) {
    const cupGroup = new THREE.Group();
    const side = isLeft ? 1 : -1;

    // Main Housing Shape (Rounded Rectangle)
    const shape = new THREE.Shape();
    const w = 0.22; // width (x-axis relative to cup)
    const h = 0.32; // height (y-axis relative to cup)
    const r = 0.06; // corner radius
    
    shape.moveTo(-w/2 + r, -h/2);
    shape.lineTo(w/2 - r, -h/2);
    shape.absarc(w/2 - r, -h/2 + r, r, Math.PI * 1.5, 0, false);
    shape.lineTo(w/2, h/2 - r);
    shape.absarc(w/2 - r, h/2 - r, r, 0, Math.PI * 0.5, false);
    shape.lineTo(-w/2 + r, h/2);
    shape.absarc(-w/2 + r, h/2 - r, r, Math.PI * 0.5, Math.PI, false);
    shape.lineTo(-w/2, -h/2 + r);
    shape.absarc(-w/2 + r, -h/2 + r, r, Math.PI, Math.PI * 1.5, false);

    const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 };
    const housingGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry
    housingGeom.center();
    
    const housing = new THREE.Mesh(housingGeom, bodyMat);
    // Rotate to face outward (Z-axis)
    housing.rotation.y = Math.PI / 2 * side; 
    cupGroup.add(housing);

    // Outer Grill Plate
    const grillGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.01, 32);
    const grill = new THREE.Mesh(grillGeom, grillMat);
    grill.rotation.y = Math.PI / 2 * side;
    grill.position.set(side * 0.04, 0, 0); // Slightly offset from housing face
    cupGroup.add(grill);

    // Ear Cushion (Torus)
    const cushionGeom = new THREE.TorusGeometry(0.11, 0.035, 16, 32);
    const cushion = new THREE.Mesh(cushionGeom, cushionMat);
    cushion.rotation.y = Math.PI / 2 * side;
    cushion.position.set(side * 0.03, 0, 0);
    cupGroup.add(cushion);

    // Inner Foam (Disk inside cushion)
    const foamGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 32);
    const foam = new THREE.Mesh(foamGeom, foamMat);
    foam.rotation.y = Math.PI / 2 * side;
    foam.position.set(side * 0.03, 0, 0);
    cupGroup.add(foam);

    // Controls (Only on the bottom of the Left cup in this model, matching image)
    if (isLeft) {
        // Button on bottom edge
        const btnGeom = new THREE.CapsuleGeometry(0.015, 0.04, 4, 8);
        const btn = new THREE.Mesh(btnGeom, bodyMat);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(side * 0.05, -0.14, 0);
        cupGroup.add(btn);
        
        // Cable port area
        const portGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 16);
        const port = new THREE.Mesh(portGeom, bodyMat);
        port.rotation.x = Math.PI / 2;
        port.position.set(side * 0.05, -0.16, 0);
        cupGroup.add(port);
    }

    // Yoke/Connector to headband
    const yokeGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
    const yoke = new THREE.Mesh(yokeGeom, bodyMat);
    yoke.rotation.z = Math.PI / 2;
    yoke.position.set(side * 0.12, 0.12, 0); // Top of the cup
    cupGroup.add(yoke);

    // Slider mechanism (visible on headband ends)
    const sliderGeom = new THREE.BoxGeometry(0.04, 0.08, 0.04);
    const slider = new THREE.Mesh(sliderGeom, bodyMat);
    slider.position.set(side * 0.12, 0.12, 0);
    cupGroup.add(slider);

    return cupGroup;
  }

  // 3. Assemble Ear Cups
  const leftCup = createEarCup(true);
  // Position left cup at the end of the headband arch
  // Torus radius 0.35. Ends are at x = +/- 0.35.
  leftCup.position.set(0.35, 0, 0);
  root.add(leftCup);

  const rightCup = createEarCup(false);
  rightCup.position.set(-0.35, 0, 0);
  root.add(rightCup);

  // 4. Cable
  // Curve from bottom of left cup
  const cablePoints = [
    new THREE.Vector3(0.35, -0.16, 0), // Start at port
    new THREE.Vector3(0.35, -0.25, 0.05),
    new THREE.Vector3(0.25, -0.35, 0.1),
    new THREE.Vector3(0.1, -0.40, 0.1),
  ];
  const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
  const cableGeom = new THREE.TubeGeometry(cableCurve, 20, 0.008, 8, false);
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
  const cable = new THREE.Mesh(cableGeom, cableMat);
  root.add(cable);

  // 5. Final Normalization
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