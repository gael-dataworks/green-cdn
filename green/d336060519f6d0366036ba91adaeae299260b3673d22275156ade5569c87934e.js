export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red glossy plastic body
  const redPlasticMat = new THREE.MeshStandardMaterial({
    color: 0xd93025,
    metalness: 0.1,
    roughness: 0.25,
  });

  // Clear cap material (transmission for glass-like look)
  const clearCapMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // White pearlescent beads
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.2,
  });

  // --- Dimensions ---
  const containerRadius = 0.32;
  const innerRadius = 0.28;
  const bodyHalfHeight = 0.30; // Red part half-length
  const capThickness = 0.04;
  const totalHalfLength = bodyHalfHeight + capThickness;
  const beadRadius = 0.024;
  const beadCount = 90;

  // --- 1. Red Body (Hollow Cylinder Segment) ---
  // Use LatheGeometry to create a hollow tube segment for the red middle part.
  // Profile in XY plane, rotated around Y. Then we rotate the mesh to align with Z.
  const bodyProfile = [
    new THREE.Vector2(innerRadius, -bodyHalfHeight),
    new THREE.Vector2(containerRadius, -bodyHalfHeight),
    new THREE.Vector2(containerRadius, bodyHalfHeight),
    new THREE.Vector2(innerRadius, bodyHalfHeight),
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const redBody = new THREE.Mesh(bodyGeom, redPlasticMat);
  // Rotate to lie along Z axis (default Lathe is Y-up cylinder)
  redBody.rotation.x = Math.PI / 2;
  root.add(redBody);

  // --- 2. Clear Caps (Front and Back) ---
  // Simple cylinders for the end caps.
  const capGeom = new THREE.CylinderGeometry(containerRadius, containerRadius, capThickness, 32);
  
  const frontCap = new THREE.Mesh(capGeom, clearCapMat);
  frontCap.position.z = totalHalfLength - capThickness / 2;
  frontCap.rotation.x = Math.PI / 2;
  root.add(frontCap);

  const backCap = new THREE.Mesh(capGeom, clearCapMat);
  backCap.position.z = -totalHalfLength + capThickness / 2;
  backCap.rotation.x = Math.PI / 2;
  root.add(backCap);

  // --- 3. Inner Rim (Front) ---
  // A thin ring inside the front cap to simulate the holding structure.
  const rimGeom = new THREE.TorusGeometry(innerRadius + 0.01, 0.015, 16, 32);
  const rim = new THREE.Mesh(rimGeom, redPlasticMat);
  rim.position.z = totalHalfLength - 0.005; // Just inside the cap
  rim.rotation.y = Math.PI / 2; // Face Z
  root.add(rim);

  // --- 4. Handle ---
  // Modeled as a thick tube loop on the side of the red body.
  // Using TorusGeometry for a clean loop, scaled to look like a handle.
  const handleRadius = 0.08;
  const handleTube = 0.035;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 24);
  const handle = new THREE.Mesh(handleGeom, redPlasticMat);
  
  // Position on the +Y side of the body (which is now +Y in local space after body rotation? 
  // Wait, body was rotated X 90. So local Y of body is now local Z of scene? 
  // No, we rotated the MESH. The Group is still standard.
  // Body mesh: rotated X 90. So its local Y axis points to Scene Z.
  // We want the handle on the "top" of the cylinder relative to the image.
  // In the image, the handle is on the side. Let's put it at local +Y of the Group.
  // The body is a cylinder along Z. So +Y is perpendicular to the axis.
  handle.position.set(0, containerRadius - handleTube, 0);
  // Torus lies in XY. We need it to loop out from the cylinder surface.
  // Cylinder surface normal at +Y is +Y.
  // So the Torus plane should be YZ?
  // Default Torus is XY. Rotate X 90 -> YZ.
  handle.rotation.x = Math.PI / 2;
  root.add(handle);

  // --- 5. Beads (InstancedMesh) ---
  // Deterministic distribution inside the cylinder volume.
  const beadsGeom = new THREE.SphereGeometry(beadRadius, 12, 12);
  const beadsMesh = new THREE.InstancedMesh(beadsGeom, beadMat, beadCount);
  
  const dummy = new THREE.Object3D();
  let index = 0;

  // Simple grid packing with deterministic offset
  const steps = 10;
  const zStart = -bodyHalfHeight + beadRadius;
  const zEnd = bodyHalfHeight - beadRadius;
  const zStep = (zEnd - zStart) / steps;

  for (let i = 0; i < steps; i++) {
    const z = zStart + i * zStep;
    // Hexagonal-ish packing in XY plane for each slice
    const rings = 4;
    for (let rIdx = 0; rIdx < rings; rIdx++) {
      const r = (rIdx + 0.5) * (innerRadius / rings);
      const countInRing = Math.max(1, Math.floor(2 * Math.PI * r / (beadRadius * 2.2)));
      for (let j = 0; j < countInRing; j++) {
        if (index >= beadCount) break;
        const angle = (j / countInRing) * Math.PI * 2 + (i % 2) * (Math.PI / countInRing);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        
        // Add small deterministic jitter based on index to avoid perfect grid look
        const jitter = 0.005;
        const jx = x + Math.sin(index * 13.5) * jitter;
        const jy = y + Math.cos(index * 27.3) * jitter;
        const jz = z + Math.sin(index * 5.1) * jitter;

        dummy.position.set(jx, jy, jz);
        dummy.updateMatrix();
        beadsMesh.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
  }
  // Fill remaining if any with a center column
  while (index < beadCount) {
    const z = zStart + (index % steps) * zStep;
    dummy.position.set(0, 0, z);
    dummy.updateMatrix();
    beadsMesh.setMatrixAt(index, dummy.matrix);
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