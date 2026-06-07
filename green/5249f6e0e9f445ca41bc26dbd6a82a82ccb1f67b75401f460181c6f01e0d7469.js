export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rustic reclaimed wood: high roughness, low metalness, warm grey-brown tone.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9C8468,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Darker accent for gaps/shadows if needed, but we'll rely on geometry gaps.
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x6B5340,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const tableHeight = 0.40;
  const topThickness = 0.05;
  const topSize = 0.80;
  const legHeight = tableHeight - topThickness;
  const legSize = 0.09;
  const legSpacing = 0.60; // Distance between leg centers
  const apronHeight = 0.10;
  const apronThickness = 0.06;

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Top Surface (3 Planks) ---
  // The top is made of 3 wide planks with visible seams.
  const plankWidth = topSize / 3;
  const plankGap = 0.005;
  const totalPlankWidth = plankWidth * 3 + plankGap * 2;
  const startX = -(totalPlankWidth / 2) + (plankWidth / 2);

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (plankWidth + plankGap);
    // Slight randomization in height/rotation is banned, so we keep them flat but separated.
    addBox(plankWidth, topThickness, topSize, woodMat, x, tableHeight / 2, 0);
  }

  // --- Legs ---
  // 4 sturdy legs at the corners of the inner frame.
  const legPositions = [
    { x: -legSpacing / 2, z: -legSpacing / 2 },
    { x:  legSpacing / 2, z: -legSpacing / 2 },
    { x: -legSpacing / 2, z:  legSpacing / 2 },
    { x:  legSpacing / 2, z:  legSpacing / 2 },
  ];

  const legY = (tableHeight - topThickness) / 2 - topThickness / 2; // Center of leg below top

  legPositions.forEach((pos) => {
    addBox(legSize, legHeight, legSize, woodMat, pos.x, legY, pos.z);
  });

  // --- Apron (Frame under top) ---
  // Connects the legs. Front/Back beams and Side beams.
  const apronY = legY + (legHeight / 2) - (apronHeight / 2);
  const innerSpan = legSpacing - legSize; // Space between legs

  // Front & Back Aprons
  addBox(legSpacing, apronHeight, apronThickness, woodMat, 0, apronY, -legSpacing / 2);
  addBox(legSpacing, apronHeight, apronThickness, woodMat, 0, apronY,  legSpacing / 2);

  // Side Aprons (fit between front/back aprons visually, or overlap. Let's overlap for sturdiness look)
  // Actually, to fit between legs cleanly:
  addBox(apronThickness, apronHeight, innerSpan, woodMat, -legSpacing / 2, apronY, 0);
  addBox(apronThickness, apronHeight, innerSpan, woodMat,  legSpacing / 2, apronY, 0);

  // --- Corner Blocks / Gussets ---
  // Small triangular-ish supports under the corners where leg meets apron.
  // Approximated with small rotated boxes or cubes for rustic look.
  const blockY = apronY - (apronHeight / 2) + 0.03;
  const blockOffset = legSize / 2 + 0.02;

  legPositions.forEach((pos) => {
    // Diagonal support block
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), woodMat);
    block.position.set(
      pos.x + (pos.x > 0 ? -0.02 : 0.02),
      blockY,
      pos.z + (pos.z > 0 ? -0.02 : 0.02)
    );
    // Rotate to look like a gusset
    block.rotation.y = Math.PI / 4;
    root.add(block);
  });

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