export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light bamboo/wood color. Matte finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c896,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Slightly darker wood for the carved details to create contrast via color,
  // simulating shadow/depth without complex boolean operations.
  const carvingMat = new THREE.MeshStandardMaterial({
    color: 0xc4a878,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Metal eyelet material
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const radius = 0.28;
  const height = 0.48;
  const numSlats = 24;
  const slatGap = 0.005;
  const slatAngle = (Math.PI * 2) / numSlats;
  const slatWidthArc = slatAngle - slatGap / radius; // Approximate arc angle for the slat

  // --- Body Slats ---
  // We use CylinderGeometry segments to create the staves.
  const slatGeom = new THREE.CylinderGeometry(
    radius, radius, height, 
    1, 1, // radialSegments (irrelevant for 1 segment)
    true, // openEnded
    0,    // thetaStart
    slatAngle - (slatGap / radius) * 1.5 // thetaLength
  );
  
  // We need to shift the geometry so the pivot is at the center of the bucket, 
  // but the cylinder segment is drawn from the center. 
  // Actually, CylinderGeometry draws from center. We need to rotate instances.
  // To make them flat-faced like planks, we could use Boxes, but Cylinders curve better.
  // Let's use Boxes for the "plank" look seen in the reference (flat faces).
  const plankWidth = (Math.PI * 2 * radius) / numSlats - slatGap;
  const plankGeom = new THREE.BoxGeometry(plankWidth, height, 0.04); // 0.04 thickness
  
  for (let i = 0; i < numSlats; i++) {
    const angle = i * slatAngle;
    const plank = new THREE.Mesh(plankGeom, woodMat);
    // Position on the circle
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    plank.position.set(x, 0, z);
    // Rotate to face outward
    plank.rotation.y = -angle;
    root.add(plank);
  }

  // --- Top Rim ---
  // A thick torus at the top
  const rimGeom = new THREE.TorusGeometry(radius + 0.02, 0.025, 16, 64);
  const rim = new THREE.Mesh(rimGeom, woodMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = height / 2;
  root.add(rim);

  // --- Bands (Hoops) ---
  // Upper band
  const bandGeom = new THREE.TorusGeometry(radius + 0.015, 0.012, 16, 64);
  const upperBand = new THREE.Mesh(bandGeom, woodMat);
  upperBand.rotation.x = Math.PI / 2;
  upperBand.position.y = height / 2 - 0.06;
  root.add(upperBand);

  // Lower band
  const lowerBand = new THREE.Mesh(bandGeom, woodMat);
  lowerBand.rotation.x = Math.PI / 2;
  lowerBand.position.y = -height / 2 + 0.06;
  root.add(lowerBand);

  // --- Bottom Cap ---
  const bottomGeom = new THREE.CircleGeometry(radius - 0.02, 32);
  const bottom = new THREE.Mesh(bottomGeom, woodMat);
  bottom.rotation.x = Math.PI / 2;
  bottom.position.y = -height / 2;
  root.add(bottom);

  // --- Carvings / Decorations ---
  
  // 1. Vertical Vine (Left Side)
  // Create a wavy path for the vine
  const vinePoints = [];
  const vineStartY = height / 2 - 0.15;
  const vineEndY = -height / 2 + 0.15;
  const vineAngle = -Math.PI / 2; // Left side (-Z)
  
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = vineStartY + (vineEndY - vineStartY) * t;
    // Add some sine wave wiggle in angle and radius
    const wiggle = Math.sin(t * Math.PI * 4) * 0.01; 
    const r = radius + 0.005 + wiggle; 
    const a = vineAngle + Math.cos(t * Math.PI * 6) * 0.05;
    
    vinePoints.push(new THREE.Vector3(
      Math.cos(a) * r,
      y,
      Math.sin(a) * r
    ));
  }
  
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineTube = new THREE.Mesh(
    new THREE.TubeGeometry(vineCurve, 20, 0.008, 8, false),
    carvingMat
  );
  root.add(vineTube);

  // Add some leaves/berries to the vertical vine
  for (let i = 2; i < 9; i += 2) {
    const pt = vinePoints[i];
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), carvingMat);
    leaf.scale.set(1, 1, 0.2); // Flatten
    leaf.position.copy(pt);
    leaf.lookAt(new THREE.Vector3(0, pt.y, 0)); // Face center
    leaf.translateZ(0.01); // Push out slightly
    root.add(leaf);
  }

  // 2. Horizontal Floral Band (Bottom Area)
  // A ring of flowers/vines around the lower section
  const flowerCount = 8;
  const flowerY = -height / 2 + 0.06; // Aligned with lower band
  const flowerR = radius + 0.005;

  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI * 2;
    const x = Math.cos(angle) * flowerR;
    const z = Math.sin(angle) * flowerR;
    
    // Flower center
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), carvingMat);
    flower.position.set(x, flowerY, z);
    // Orient flower to face outward
    flower.lookAt(new THREE.Vector3(x * 2, flowerY, z * 2));
    root.add(flower);

    // Small vine connector between flowers
    if (i < flowerCount - 1) {
      const nextAngle = ((i + 1) / flowerCount) * Math.PI * 2;
      const nx = Math.cos(nextAngle) * flowerR;
      const nz = Math.sin(nextAngle) * flowerR;
      
      const connectorPoints = [
        new THREE.Vector3(x, flowerY, z),
        new THREE.Vector3((x + nx) / 2, flowerY + 0.01, (z + nz) / 2), // Arch up slightly
        new THREE.Vector3(nx, flowerY, nz)
      ];
      const connCurve = new THREE.CatmullRomCurve3(connectorPoints);
      const connTube = new THREE.Mesh(
        new THREE.TubeGeometry(connCurve, 8, 0.006, 6, false),
        carvingMat
      );
      root.add(connTube);
    }
  }

  // --- Handle Attachment (Eyelet) ---
  // Small metal loop on the left side, attached to the upper band
  const eyeletPos = new THREE.Vector3(
    Math.cos(-Math.PI / 2) * (radius + 0.03),
    height / 2 - 0.06,
    Math.sin(-Math.PI / 2) * (radius + 0.03)
  );
  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.004, 8, 16), metalMat);
  eyelet.position.copy(eyeletPos);
  eyelet.rotation.y = -Math.PI / 2; // Face outward
  eyelet.rotation.z = Math.PI / 2;  // Vertical loop
  root.add(eyelet);

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