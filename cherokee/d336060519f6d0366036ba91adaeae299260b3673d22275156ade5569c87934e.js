export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear plastic for container and caps
  const clearMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    transparent: true,
    opacity: 1.0,
    ior: 1.5,
    thickness: 0.5,
  });

  // Red plastic for the grip band and handle
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd93025,
    metalness: 0.1,
    roughness: 0.3,
  });

  // White beads (pearl-like)
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const containerRadius = 0.35;
  const containerHeight = 0.9;
  const wallThickness = 0.02;
  const redBandHeight = 0.35;
  const beadRadius = 0.045;

  // --- Container Body (Clear) ---
  // Main clear cylinder that holds the beads
  const containerGeom = new THREE.CylinderGeometry(
    containerRadius,
    containerRadius,
    containerHeight,
    32
  );
  const container = new THREE.Mesh(containerGeom, clearMat);
  root.add(container);

  // --- Red Grip Band ---
  // A slightly larger cylinder segment around the middle
  const bandRadius = containerRadius + 0.01;
  const bandGeom = new THREE.CylinderGeometry(
    bandRadius,
    bandRadius,
    redBandHeight,
    32
  );
  const redBand = new THREE.Mesh(bandGeom, redMat);
  root.add(redBand);

  // --- Handle ---
  // A torus loop attached to the side of the red band
  // Torus is in XY plane by default, we need it in YZ or XZ to loop out from side
  // Let's use a Torus and rotate it.
  const handleTorusRadius = 0.12;
  const handleTubeRadius = 0.035;
  const handleGeom = new THREE.TorusGeometry(
    handleTorusRadius,
    handleTubeRadius,
    16,
    32,
    Math.PI * 1.8 // Almost a full circle, leave a small gap or make it closed
  );
  const handle = new THREE.Mesh(handleGeom, redMat);
  // Position on the side (+X)
  handle.position.set(containerRadius + handleTorusRadius, 0, 0);
  // Rotate to stand vertically on the side
  handle.rotation.y = Math.PI / 2;
  root.add(handle);

  // --- End Caps (Clear) ---
  // Thin disks to seal the ends, slightly larger than inner radius
  const capThickness = 0.03;
  const capGeom = new THREE.CylinderGeometry(
    containerRadius - wallThickness,
    containerRadius - wallThickness,
    capThickness,
    32
  );
  
  const topCap = new THREE.Mesh(capGeom, clearMat);
  topCap.position.y = containerHeight / 2 - capThickness / 2;
  root.add(topCap);

  const bottomCap = new THREE.Mesh(capGeom, clearMat);
  bottomCap.position.y = -containerHeight / 2 + capThickness / 2;
  root.add(bottomCap);

  // --- Beads (InstancedMesh) ---
  // Fill the inner volume with white spheres
  const innerRadius = containerRadius - wallThickness - beadRadius - 0.01;
  const innerHeight = containerHeight - capThickness * 2 - beadRadius * 2;
  
  // Estimate count based on volume packing (~0.64 packing density)
  // V_container ~ pi * r^2 * h
  // V_bead ~ 4/3 * pi * r^3
  // Count ~ 0.64 * V_container / V_bead
  // Roughly 150-200 beads
  const beadCount = 180;
  const beadsMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(beadRadius, 12, 12),
    beadMat,
    beadCount
  );

  const dummy = new THREE.Object3D();
  let index = 0;

  // Deterministic packing using layers and hexagonal-ish offset
  const layers = 12;
  const layerHeight = innerHeight / layers;
  
  for (let l = 0; l < layers; l++) {
    const y = -innerHeight / 2 + layerHeight / 2 + l * layerHeight;
    // Number of beads per layer varies by radius, but let's keep it simple grid
    // Use polar grid for circular container
    const rings = 4;
    for (let rIdx = 0; rIdx <= rings; rIdx++) {
      const r = (rIdx / rings) * innerRadius;
      const circumference = 2 * Math.PI * r;
      const countInRing = Math.floor(circumference / (beadRadius * 2.2));
      
      for (let i = 0; i < countInRing; i++) {
        if (index >= beadCount) break;
        
        const angle = (i / countInRing) * Math.PI * 2 + (l % 2) * (Math.PI / countInRing);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        
        // Deterministic jitter using sine of index
        const jitterX = Math.sin(index * 12.9) * 0.01;
        const jitterY = Math.cos(index * 7.3) * 0.01;
        const jitterZ = Math.sin(index * 5.1) * 0.01;

        dummy.position.set(x + jitterX, y + jitterY, z + jitterZ);
        dummy.updateMatrix();
        beadsMesh.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
  }
  
  // Fill remaining with simple grid if count not reached
  while (index < beadCount) {
    const x = (Math.sin(index * 1.5) * innerRadius * 0.8);
    const z = (Math.cos(index * 2.3) * innerRadius * 0.8);
    const y = (Math.sin(index * 3.7) * innerHeight * 0.8);
    
    // Check bounds roughly
    if (x*x + z*z < innerRadius*innerRadius && Math.abs(y) < innerHeight/2) {
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        beadsMesh.setMatrixAt(index, dummy.matrix);
    }
    index++;
  }

  root.add(beadsMesh);

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