export default function generate(THREE) {
  // --- Deterministic Rust Texture Generation ---
  // Creates a noisy rust pattern without using Math.random
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 92, g: 64, b: 51 }; // Dark brown
  const rustColor = { r: 160, g: 82, b: 45 }; // Sienna/Rust
  const darkSpotColor = { r: 40, g: 30, b: 25 }; // Dark grime

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Deterministic pseudo-noise using sine
      const n = Math.sin(x * 0.15) * Math.cos(y * 0.15) + Math.sin(x * 0.05 + y * 0.05) * 0.5;
      const noise = (n + 1.5) / 2.5; // Normalize roughly 0..1

      let r, g, b;
      if (noise > 0.65) {
        // Rust patch
        r = rustColor.r; g = rustColor.g; b = rustColor.b;
      } else if (noise < 0.25) {
        // Dark grime
        r = darkSpotColor.r; g = darkSpotColor.g; b = darkSpotColor.b;
      } else {
        // Base metal/wood
        r = baseColor.r; g = baseColor.g; b = baseColor.b;
      }

      // Add some fine grain
      const grain = (Math.sin(x * 13.5 + y * 27.3) * 0.5 + 0.5) * 20;
      r = Math.min(255, Math.max(0, r + grain));
      g = Math.min(255, Math.max(0, g + grain));
      b = Math.min(255, Math.max(0, b + grain));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const rustTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  rustTexture.colorSpace = THREE.SRGBColorSpace;
  rustTexture.wrapS = THREE.RepeatWrapping;
  rustTexture.wrapT = THREE.RepeatWrapping;
  rustTexture.needsUpdate = true;

  // --- Materials ---
  // Rusty metal/wood mix. High roughness, low metalness (rust is dielectric).
  const rustMat = new THREE.MeshStandardMaterial({
    map: rustTexture,
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.85,
  });

  // --- Geometries ---

  // 1. Hammer Head
  // Profile: Rounded rectangle, extruded to create width.
  const headShape = new THREE.Shape();
  const hw = 0.06; // Half thickness (X)
  const hh = 0.11; // Half height (Y)
  const hr = 0.025; // Corner radius

  // Draw rounded rect counter-clockwise
  headShape.moveTo(-hw, hh - hr);
  headShape.lineTo(-hw, -hh + hr);
  headShape.absarc(-hw + hr, -hh + hr, hr, Math.PI, Math.PI * 1.5, false);
  headShape.lineTo(hw - hr, -hh);
  headShape.absarc(hw - hr, -hh + hr, hr, Math.PI * 1.5, 0, false);
  headShape.lineTo(hw, hh - hr);
  headShape.absarc(hw - hr, hh - hr, hr, 0, Math.PI * 0.5, false);
  headShape.lineTo(-hw + hr, hh);
  headShape.absarc(-hw + hr, hh - hr, hr, Math.PI * 0.5, Math.PI, false);

  const headGeom = new THREE.ExtrudeGeometry(headShape, {
    depth: 0.26, // Width of the hammer head (Z)
    bevelEnabled: false,
    curveSegments: 8,
  });
  // Center the geometry
  headGeom.center();

  // 2. Hammer Handle
  // Tapered cylinder
  const handleGeom = new THREE.CylinderGeometry(0.035, 0.025, 0.55, 16);
  handleGeom.rotateX(Math.PI / 2); // Align along Y axis (default is Y, but we want it vertical)
  // Wait, CylinderGeometry is Y-aligned by default. No rotation needed for vertical handle.
  // But I want the handle to point DOWN from the head.
  // If head is at 0,0,0, handle should be below.
  // Cylinder center is at 0,0,0.
  // So position handle at y = - (headHalfHeight + handleHalfHeight - overlap)
  // Let's just position meshes.

  // --- Meshes ---
  const head = new THREE.Mesh(headGeom, rustMat);
  // Rotate head so the extrusion (Z) is along X or Z?
  // ExtrudeGeometry extrudes along Z.
  // I want the wide face of the hammer to be along X (striking faces left/right) or Z?
  // Standard: Handle along Y. Head along X. Striking faces at +/- X.
  // Extrusion is Z. So I need to rotate head 90 deg around Y to put extrusion along X?
  // No, if extrusion is Z, the flat faces are at +/- Z.
  // I want flat faces at +/- X (striking faces).
  // So rotate head 90 deg around Y.
  head.rotation.y = Math.PI / 2;

  const handle = new THREE.Mesh(handleGeom, rustMat);
  // Handle is Y-aligned cylinder.
  // Position it so top overlaps head.
  // Head height is ~0.22. Head center at 0.
  // Handle length 0.55.
  // Place handle center at y = -0.15 (so top is at -0.15 + 0.275 = 0.125, inside head)
  handle.position.y = -0.18;

  // --- Assembly ---
  const root = new THREE.Group();
  root.add(head);
  root.add(handle);

  // Add a slight rotation to match the dynamic angle in the reference
  // Reference shows handle pointing down-left, head diagonal.
  // We model upright, but can rotate group for presentation if desired.
  // However, standard is upright. I will leave it upright for stability.
  // Actually, let's rotate it slightly to look less static.
  root.rotation.z = Math.PI / 6;
  root.rotation.y = -Math.PI / 6;

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