export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Copper/Bronze Metal
  // Using emissive to ensure it doesn't look too dark in the dim renderer
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0xb87333,
    emissiveIntensity: 0.3
  });

  // Wood Handle
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xa07040,
    metalness: 0.0,
    roughness: 0.7
  });

  // Dark interior for the split slot and side window
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9
  });

  // --- Procedural Textures ---

  // 1. Wood Grain Texture for the handle
  function createWoodTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Base wood color variation
        const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.05)) * 20;
        const r = 140 + noise;
        const g = 90 + noise * 0.5;
        const b = 50 + noise * 0.2;
        // Grain lines
        const grain = Math.sin(x * 0.2 + y * 0.02) > 0.8 ? 30 : 0;
        data[i] = Math.min(255, r + grain);
        data[i + 1] = Math.min(255, g + grain * 0.6);
        data[i + 2] = Math.min(255, b + grain * 0.3);
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4); // Stretch grain along the cylinder length
    tex.needsUpdate = true;
    return tex;
  }

  // 2. Knurling Texture for the shaft grip
  function createKnurlTexture() {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Diamond pattern
        const cx = x % 16;
        const cy = y % 16;
        const dist = Math.abs(cx - 8) + Math.abs(cy - 8);
        const val = dist < 6 ? 200 : 140; // Light ridges, dark valleys
        data[i] = val;
        data[i + 1] = val * 0.6;
        data[i + 2] = val * 0.3;
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 4);
    tex.needsUpdate = true;
    return tex;
  }

  const woodTexture = createWoodTexture();
  woodMat.map = woodTexture;

  const knurlTexture = createKnurlTexture();
  const knurlMat = copperMat.clone();
  knurlMat.map = knurlTexture;
  knurlMat.roughness = 0.6; // Knurling is rougher

  // --- Geometry Construction ---

  // Dimensions
  const handleLen = 0.35;
  const handleRadTop = 0.055;
  const handleRadBot = 0.050;
  
  const shaftLen = 0.55;
  const shaftRadTop = 0.048;
  const shaftRadBot = 0.035;
  const knurlLen = 0.25;
  
  const tipLen = 0.12;
  const tipRad = 0.035;

  // 1. Handle (Wood)
  // Tapered cylinder
  const handleGeom = new THREE.CylinderGeometry(handleRadTop, handleRadBot, handleLen, 32);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = handleLen / 2;
  handle.rotation.z = Math.PI / 2; // Align along Z for easier assembly, then rotate group
  root.add(handle);

  // Handle Split Slot (Visual only - dark box inset)
  const slotGeom = new THREE.BoxGeometry(0.004, 0.01, handleLen * 0.9);
  const slot = new THREE.Mesh(slotGeom, darkMat);
  slot.position.set(0, handleRadBot - 0.002, handleLen / 2);
  root.add(slot);

  // 2. Ferrule (Metal ring at junction)
  const ferruleGeom = new THREE.CylinderGeometry(0.052, 0.052, 0.04, 32);
  const ferrule = new THREE.Mesh(ferruleGeom, copperMat);
  ferrule.position.y = -0.02; // Just below handle bottom
  ferrule.rotation.z = Math.PI / 2;
  root.add(ferrule);

  // 3. Shaft Smooth Section (Upper metal part)
  const smoothLen = shaftLen - knurlLen;
  const smoothGeom = new THREE.CylinderGeometry(shaftRadTop, shaftRadBot, smoothLen, 32);
  const shaftSmooth = new THREE.Mesh(smoothGeom, copperMat);
  shaftSmooth.position.y = -(0.04 + smoothLen / 2);
  shaftSmooth.rotation.z = Math.PI / 2;
  root.add(shaftSmooth);

  // 4. Shaft Knurled Section (Lower metal grip)
  const knurlGeom = new THREE.CylinderGeometry(shaftRadBot, shaftRadBot, knurlLen, 32);
  const shaftKnurled = new THREE.Mesh(knurlGeom, knurlMat);
  shaftKnurled.position.y = -(0.04 + smoothLen + knurlLen / 2);
  shaftKnurled.rotation.z = Math.PI / 2;
  root.add(shaftKnurled);

  // 5. Tip (Pointed cone)
  const tipGeom = new THREE.ConeGeometry(tipRad, tipLen, 32);
  const tip = new THREE.Mesh(tipGeom, copperMat);
  tip.position.y = -(0.04 + shaftLen + tipLen / 2);
  tip.rotation.z = Math.PI / 2; // Cone points -Y by default, we want -Z (forward)
  // Correction: ConeGeometry apex is +Y. Rotated Z=PI/2 makes it point +Z.
  // We want it to point away from handle. Handle is at +Z relative to shaft start?
  // Let's re-verify orientation.
  // Handle center: +Z direction from origin.
  // Shaft extends -Z direction from handle bottom.
  // So Tip should point further -Z.
  // Cone default: Apex +Y. Rotate X=PI/2 -> Apex +Z. Rotate X=-PI/2 -> Apex -Z.
  tip.rotation.x = -Math.PI / 2;
  // Wait, I rotated everything Z=PI/2 earlier to lay them along Z axis.
  // Let's restart the mental model for alignment.
  // Standard: Y is up.
  // Let's build the object along the Z axis, pointing towards +Z.
  // Tip at +Z end, Handle at -Z end.
  
  // RE-ORIENTING CONSTRUCTION FOR +Z FACING
  
  root.clear(); // Clear previous attempts

  // Handle (Wood) - Back of the tool
  // Cylinder along Z axis.
  const hGeom = new THREE.CylinderGeometry(handleRadTop, handleRadBot, handleLen, 32);
  // Rotate to align Y-axis cylinder to Z-axis
  hGeom.rotateX(Math.PI / 2);
  const hMesh = new THREE.Mesh(hGeom, woodMat);
  hMesh.position.z = - (shaftLen + tipLen + handleLen / 2);
  root.add(hMesh);

  // Handle Slot
  const sGeom = new THREE.BoxGeometry(0.01, 0.004, handleLen * 0.9);
  sGeom.rotateX(Math.PI / 2);
  const sMesh = new THREE.Mesh(sGeom, darkMat);
  sMesh.position.set(0, handleRadBot - 0.002, - (shaftLen + tipLen + handleLen / 2));
  root.add(sMesh);

  // Ferrule
  const fGeom = new THREE.CylinderGeometry(0.052, 0.052, 0.04, 32);
  fGeom.rotateX(Math.PI / 2);
  const fMesh = new THREE.Mesh(fGeom, copperMat);
  fMesh.position.z = - (shaftLen + tipLen + handleLen + 0.02);
  root.add(fMesh);

  // Shaft Smooth
  const ssGeom = new THREE.CylinderGeometry(shaftRadTop, shaftRadBot, smoothLen, 32);
  ssGeom.rotateX(Math.PI / 2);
  const ssMesh = new THREE.Mesh(ssGeom, copperMat);
  ssMesh.position.z = - (tipLen + knurlLen + smoothLen / 2);
  root.add(ssMesh);

  // Shaft Knurled
  const skGeom = new THREE.CylinderGeometry(shaftRadBot, shaftRadBot, knurlLen, 32);
  skGeom.rotateX(Math.PI / 2);
  const skMesh = new THREE.Mesh(skGeom, knurlMat);
  skMesh.position.z = - (tipLen + knurlLen / 2);
  root.add(skMesh);

  // Tip
  // Cone points +Y. Rotate X=-PI/2 to point -Z? No, we want +Z tip.
  // If object faces +Z, tip is at +Z end.
  // Cone apex is +Y. Rotate X=PI/2 -> Apex +Z.
  const tGeom = new THREE.ConeGeometry(tipRad, tipLen, 32);
  tGeom.rotateX(Math.PI / 2);
  const tMesh = new THREE.Mesh(tGeom, copperMat);
  tMesh.position.z = tipLen / 2;
  root.add(tMesh);

  // Side Window (Small hole on the smooth shaft)
  const wGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 16);
  wGeom.rotateZ(Math.PI / 2); // Cylinder axis along X
  const wMesh = new THREE.Mesh(wGeom, darkMat);
  // Position on the side of the smooth shaft
  // Smooth shaft center is at z = - (tipLen + knurlLen + smoothLen / 2)
  const smoothZ = - (tipLen + knurlLen + smoothLen / 2);
  wMesh.position.set(0, shaftRadTop - 0.005, smoothZ);
  root.add(wMesh);

  // --- Final Orientation ---
  // The reference image shows the tool diagonal, handle top-right, tip bottom-left.
  // Current: Handle at -Z, Tip at +Z, lying flat on Z axis.
  // Rotate around X to lift it up, Rotate around Y to angle it.
  root.rotation.x = Math.PI / 6; // Tilt up 30 deg
  root.rotation.y = -Math.PI / 4; // Angle left 45 deg
  root.rotation.z = Math.PI / 8; // Slight roll

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