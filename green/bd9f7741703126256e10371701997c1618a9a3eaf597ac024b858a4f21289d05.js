export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold band: Bright gold with emissive to pop in this renderer
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE5C165,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xE5C165,
    emissiveIntensity: 0.3
  });

  // Gem core: Teal/Aquamarine physical material for glass-like transmission
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x4FD0C7,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.65,
    ior: 1.55,
    transparent: true,
    thickness: 0.5
  });

  // Rock crust: Rough, matte, off-white/grey
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xD8D8D0,
    metalness: 0.0,
    roughness: 0.9
  });

  // --- Dimensions ---
  const stoneW = 0.55;
  const stoneD = 0.38;
  const stoneH = 0.14;
  const bevelSize = 0.04;
  const bevelThickness = 0.04;

  // --- 1. The Gem Core (Teal Faceted Block) ---
  // Using ExtrudeGeometry for the emerald-cut shape with bevels
  const shape = new THREE.Shape();
  const hw = stoneW / 2;
  const hd = stoneD / 2;
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.lineTo(-hw, -hd);

  const extrudeSettings = {
    steps: 1,
    depth: stoneH,
    bevelEnabled: true,
    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelSegments: 3
  };

  const gemGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry vertically so pivot is at bottom/middle
  gemGeom.translate(0, 0, -stoneH / 2); 
  // Rotate to lie flat in XZ plane (Extrude is along Z by default, we want Y up)
  // Actually ExtrudeGeometry extrudes along Z. We want the flat face on top (XY plane? No, XZ plane).
  // Standard Extrude: Shape in XY, extrudes to Z.
  // We want Shape in XZ, extrudes to Y.
  // So we rotate the geometry -90 deg on X.
  gemGeom.rotateX(-Math.PI / 2);
  // Now pivot is roughly centered. Let's re-center bounding box.
  gemGeom.center();

  const gemCore = new THREE.Mesh(gemGeom, gemMat);
  gemCore.position.y = 0.08; // Lift above band
  root.add(gemCore);

  // --- 2. The Raw Rock Crust (Druzy Edge) ---
  // Procedurally place small irregular rocks along the perimeter of the gem
  const crustGroup = new THREE.Group();
  const rockGeom = new THREE.DodecahedronGeometry(0.015, 0); // Low poly for rough look
  
  // Perimeter path points
  const perimeter = [
    [-hw, -hd], [hw, -hd], // Bottom
    [hw, -hd], [hw, hd],   // Right
    [hw, hd], [-hw, hd],   // Top
    [-hw, hd], [-hw, -hd]  // Left
  ];

  let rockIndex = 0;
  for (let i = 0; i < perimeter.length; i += 2) {
    const p1 = perimeter[i];
    const p2 = perimeter[i+1];
    const dist = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));
    const count = Math.floor(dist / 0.04); // Place a rock every ~0.04 units
    
    for (let j = 0; j < count; j++) {
      const t = j / count;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const z = p1[1] + (p2[1] - p1[1]) * t;
      
      // Deterministic variation based on index
      const scaleVar = 0.8 + 0.4 * Math.sin(rockIndex * 1.5);
      const rotVar = rockIndex * 2.5;
      const yOffset = (Math.sin(rockIndex * 3.0) * 0.02); 

      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(x, stoneH * 0.4 + yOffset, z); // Sit on the side, halfway up
      rock.scale.setScalar(scaleVar * 0.03);
      rock.rotation.set(rotVar, rotVar * 0.5, rotVar);
      crustGroup.add(rock);
      rockIndex++;
    }
  }
  root.add(crustGroup);

  // --- 3. The Gold Band ---
  // Torus geometry for the ring shank
  const bandRadius = 0.11;
  const bandTube = 0.035;
  // We only need a partial torus, but a full one is safer for generic viewing
  // Arc length ~240 degrees visible
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 32, Math.PI * 1.4);
  const band = new THREE.Mesh(bandGeom, goldMat);
  
  // Position band below the stone
  // The torus is in XY plane by default. We need it in YZ plane (standing up like a ring)
  band.rotation.x = Math.PI / 2; 
  band.position.y = -0.05; // Tuck under the stone
  band.position.z = -0.05; // Push back slightly so stone overhangs front
  
  root.add(band);

  // --- 4. Inner Band Support (Optional but adds realism) ---
  // A small gold plate connecting the band to the stone bottom
  const supportGeom = new THREE.BoxGeometry(0.15, 0.02, 0.08);
  const support = new THREE.Mesh(supportGeom, goldMat);
  support.position.y = 0.01;
  root.add(support);

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