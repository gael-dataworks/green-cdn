export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo body: light tan, matte/satin finish.
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xdcc690,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Nodes: darker, slightly rougher wood.
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Holes & Interior: dark, near-black to simulate depth.
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Bamboo Grain Texture ---
  // Generate a vertical grain pattern to map along the length of the cylinder.
  const texWidth = 128;
  const texHeight = 256;
  const size = texWidth * texHeight * 4;
  const data = new Uint8Array(size);
  const baseR = 220, baseG = 198, baseB = 144; // #dcc690

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;
      
      // Deterministic noise for grain lines
      // Use sin/cos to create vertical streaks without Math.random
      const grain = Math.sin(x * 0.15) * 0.5 + 0.5; 
      const streak = Math.sin(x * 0.05 + y * 0.02) * 0.3;
      const noise = (grain + streak) * 0.4; // Darkening factor

      data[i] = Math.max(50, baseR - noise * 60);     // R
      data[i + 1] = Math.max(50, baseG - noise * 50); // G
      data[i + 2] = Math.max(50, baseB - noise * 40); // B
      data[i + 3] = 255; // Alpha
    }
  }

  const grainTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  grainTexture.colorSpace = THREE.SRGBColorSpace;
  grainTexture.wrapS = THREE.RepeatWrapping;
  grainTexture.wrapT = THREE.ClampToEdgeWrapping;
  grainTexture.repeat.set(4, 1); // Repeat grain around circumference
  grainTexture.needsUpdate = true;
  bambooMat.map = grainTexture;

  // --- Dimensions ---
  const length = 1.0;
  const outerRadius = 0.08;
  const innerRadius = 0.072;
  const nodeRadius = 0.095;
  const nodeWidth = 0.03;

  // --- Geometry Construction (Local Y-Up) ---
  // We build along Y, then rotate the whole group to lie on Z.

  // 1. Main Body (Outer Shell)
  const bodyGeom = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 32);
  const body = new THREE.Mesh(bodyGeom, bambooMat);
  root.add(body);

  // 2. Inner Bore (Hollow interior visible at ends)
  // Slightly shorter than body so it doesn't z-fight at caps if we had them, 
  // but since we want open ends, we make it same length and rely on rendering order or slight inset.
  // Actually, to show the rim, we need the inner tube to be visible.
  const boreGeom = new THREE.CylinderGeometry(innerRadius, innerRadius, length - 0.002, 32);
  const bore = new THREE.Mesh(boreGeom, interiorMat);
  root.add(bore);

  // 3. Nodes (Joints)
  // Modeled as short, slightly wider cylinders.
  const nodeGeom = new THREE.CylinderGeometry(nodeRadius, nodeRadius, nodeWidth, 32);
  
  // Node positions along Y (local)
  const nodePositions = [-0.12, 0.22];
  const nodes = [];
  for (let i = 0; i < nodePositions.length; i++) {
    const node = new THREE.Mesh(nodeGeom, nodeMat);
    node.position.y = nodePositions[i];
    // Add some subtle irregularity to node position if desired, but keeping deterministic
    root.add(node);
    nodes.push(node);
  }

  // 4. Finger Holes
  // Modeled as small dark cylinders pushed slightly into the surface.
  const holeDepth = 0.015;
  const holeGeomLarge = new THREE.CylinderGeometry(0.025, 0.025, holeDepth, 16);
  const holeGeomSmall = new THREE.CylinderGeometry(0.015, 0.015, holeDepth, 16);
  const holeGeomMed = new THREE.CylinderGeometry(0.018, 0.018, holeDepth, 16);

  // Hole definitions: [y_pos (along flute), radius_type, geom]
  // y_pos corresponds to Z in world space after rotation.
  const holeDefs = [
    { y: -0.38, geom: holeGeomLarge }, // Blow hole
    { y: -0.28, geom: holeGeomSmall },
    { y: -0.02, geom: holeGeomSmall },
    { y: 0.08,  geom: holeGeomLarge },
    { y: 0.18,  geom: holeGeomSmall },
    { y: 0.35,  geom: holeGeomMed },
  ];

  const holes = [];
  for (let i = 0; i < holeDefs.length; i++) {
    const def = holeDefs[i];
    const hole = new THREE.Mesh(def.geom, interiorMat);
    // Position on surface: y = outerRadius. 
    // Push in by half depth so it sits flush/inset.
    hole.position.set(0, outerRadius - holeDepth * 0.5, def.y);
    // Rotate to face inward? No, cylinder is Y-up. 
    // We want the hole to go INTO the body (towards -Y local).
    // Default Cylinder is Y-up. We want it to point -Y.
    hole.rotation.x = Math.PI; 
    root.add(hole);
    holes.push(hole);
  }

  // --- Orientation ---
  // Rotate the entire assembly -90 degrees around X so the flute lies along Z axis.
  // Local Y (length) becomes World Z.
  // Local +Y (top surface/holes) becomes World +Z (facing forward).
  root.rotation.x = -Math.PI / 2;

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