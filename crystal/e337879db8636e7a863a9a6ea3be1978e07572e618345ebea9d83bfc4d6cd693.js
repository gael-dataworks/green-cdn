export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark polished wood (rosewood/mahogany)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Gold/Brass metal for bars and screws
  // Using emissive to ensure brightness since metalness is capped at 0.6
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // --- Dimensions ---
  const totalLength = 1.2;
  const totalWidth = 0.35;
  const baseHeight = 0.08;
  const railHeight = 0.04;
  const channelWidth = 0.24; // Space between rails
  const barThickness = 0.018;
  const barWidth = 0.045; // Width of individual bar (Z-dimension in local space)
  
  const numBars = 8;
  const longestBar = 0.38;
  const shortestBar = 0.22;
  const barSpacing = 0.015; // Gap between bars

  // --- Base Structure ---
  
  // Main wooden block (floor of the channel)
  const baseGeom = new THREE.BoxGeometry(totalLength, baseHeight, totalWidth);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Side rails (walls of the channel)
  // Left rail
  const railLength = totalLength;
  const railWidth = (totalWidth - channelWidth) / 2;
  const railGeom = new THREE.BoxGeometry(railLength, railHeight, railWidth);
  
  const railLeft = new THREE.Mesh(railGeom, woodMat);
  railLeft.position.set(0, baseHeight + railHeight / 2, channelWidth / 2 + railWidth / 2);
  root.add(railLeft);

  // Right rail
  const railRight = new THREE.Mesh(railGeom, woodMat);
  railRight.position.set(0, baseHeight + railHeight / 2, -(channelWidth / 2 + railWidth / 2));
  root.add(railRight);

  // --- Bars and Screws ---
  
  // We create bars from longest (index 0) to shortest (index 7)
  // They are arranged along the X axis.
  const totalBarsWidth = (numBars * barWidth) + ((numBars - 1) * barSpacing);
  const startX = -totalBarsWidth / 2 + barWidth / 2;

  // Screw geometry (small cylinders)
  const screwGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 8);
  screwGeom.rotateX(Math.PI / 2); // Lay flat

  for (let i = 0; i < numBars; i++) {
    // Calculate bar length (linear interpolation)
    const t = i / (numBars - 1);
    const barLength = longestBar - t * (longestBar - shortestBar);
    
    // Bar position
    const barX = startX + i * (barWidth + barSpacing);
    const barY = baseHeight + railHeight + barThickness / 2; // Sit on top of rails/channel floor
    
    // Create Bar
    // Using CapsuleGeometry flattened to get rounded ends, or BoxGeometry. 
    // Reference shows flat bars with rounded ends. Capsule scaled Y is good.
    // Capsule(radius, length, capSegments, radialSegments)
    // Length here is the cylindrical part. Total length = length + 2*radius.
    // We want total length = barLength. Radius = barWidth / 2.
    const capRadius = barWidth / 2;
    const cylLength = Math.max(0.01, barLength - 2 * capRadius);
    
    const barGeom = new THREE.CapsuleGeometry(capRadius, cylLength, 4, 8);
    // Capsule is vertical by default. Rotate to lie flat along X.
    barGeom.rotateZ(Math.PI / 2); 
    // Now it's along X. But we want it flat (thin). Scale Y.
    // Actually, simpler: BoxGeometry with rounded edges via normal smoothing or just Box.
    // Let's use BoxGeometry for stability and simplicity, reference is low-poly enough.
    // To get rounded ends with Box, we'd need more segments or a different approach.
    // Let's stick to BoxGeometry but scale it to look like a bar.
    // Wait, reference shows distinctly rounded ends. 
    // Let's use the Capsule approach but orient correctly.
    // Capsule is Y-up. Rotate X by 90 -> Z-axis. Rotate Z by 90 -> X-axis.
    // Then scale Y to make it thin.
    
    const barMesh = new THREE.Mesh(barGeom, goldMat);
    barMesh.position.set(barX, barY, 0);
    barMesh.scale.set(1, barThickness / barWidth, 1); // Flatten it
    // Re-calculate scale logic:
    // Capsule radius is capRadius. Height is cylLength.
    // If we scale Y by factor S, thickness becomes capRadius * 2 * S.
    // We want thickness = barThickness. So S = barThickness / (capRadius * 2).
    const flattenScale = barThickness / (capRadius * 2);
    barMesh.scale.set(1, flattenScale, 1);
    
    root.add(barMesh);

    // Screws (2 per bar)
    const screwOffset = barLength / 2 - 0.025; // Inset from ends
    
    // Screw 1 (Left)
    const screw1 = new THREE.Mesh(screwGeom, goldMat);
    screw1.position.set(barX - screwOffset, barY, 0);
    root.add(screw1);

    // Screw 2 (Right)
    const screw2 = new THREE.Mesh(screwGeom, goldMat);
    screw2.position.set(barX + screwOffset, barY, 0);
    root.add(screw2);
  }

  // Feet (small pads at corners underneath)
  const footSize = 0.04;
  const footGeom = new THREE.BoxGeometry(footSize, 0.015, footSize);
  const footPositions = [
    [-totalLength/2 + 0.05, 0, totalWidth/2 - 0.05],
    [totalLength/2 - 0.05, 0, totalWidth/2 - 0.05],
    [-totalLength/2 + 0.05, 0, -totalWidth/2 + 0.05],
    [totalLength/2 - 0.05, 0, -totalWidth/2 + 0.05],
  ];
  
  for (const pos of footPositions) {
    const foot = new THREE.Mesh(footGeom, woodMat);
    foot.position.set(...pos);
    root.add(foot);
  }

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