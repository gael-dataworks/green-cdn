export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver/white gold: High metalness (capped at 0.6), low roughness.
  // Added emissive to ensure brightness in the dim render environment.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3,
  });

  // Diamond/Clear Gem: Physical material for transmission/refraction.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 2.4, // Diamond IOR
    transparent: true,
    thickness: 0.5, // Helps refraction calculation
  });

  // --- Dimensions ---
  const bandRadius = 0.28;
  const bandTube = 0.045;
  const stoneScale = 0.24; // Base scale for the heart shape
  const stoneDepth = 0.12;
  const bezelOffsetY = 0.02; // Slightly above band top

  // --- 1. The Band ---
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie flat in XZ.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 64);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0; // Base level
  root.add(band);

  // --- 2. The Heart Shape Definition ---
  // Generate a smooth heart shape using parametric equations sampled into a THREE.Shape
  function createHeartShape(size) {
    const shape = new THREE.Shape();
    const points = 64;
    // Start at bottom tip
    shape.moveTo(0, -size * 0.9); 
    
    // Sample parametric heart curve: x = 16sin^3(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    // We map t from 0 to 2PI.
    // To align the tip to -Y and humps to +Y, we adjust the phase.
    for (let i = 0; i <= points; i++) {
      const t = (i / points) * Math.PI * 2;
      // Standard heart parametric
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      // Scale and offset to center roughly
      // The formula naturally centers around 0,0 but the tip is at -Y.
      shape.lineTo(hx * (size / 18), hy * (size / 18));
    }
    return shape;
  }

  const heartShape = createHeartShape(stoneScale);

  // --- 3. The Bezel Setting ---
  // A thin tube following the heart contour to hold the stone.
  // We create a 3D curve from the 2D shape points.
  const curvePoints = [];
  // Sample the shape outline
  const samples = heartShape.getSpacedPoints(64);
  for (const p of samples) {
    curvePoints.push(new THREE.Vector3(p.x, bezelOffsetY + stoneDepth * 0.5, p.y)); // Map shape Y to world Z, Shape X to world X
  }
  // Close the loop explicitly if needed, though CatmullRom handles it if closed=true
  const heartCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'centripetal', 0.5);
  
  const bezelGeom = new THREE.TubeGeometry(heartCurve, 64, 0.012, 8, true);
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  // The curve was built in XZ plane (using shape x,y mapped to x,z). 
  // TubeGeometry follows the curve.
  root.add(bezel);

  // --- 4. The Gemstone ---
  // To simulate a cut gem without complex CSG, we use an ExtrudeGeometry with bevels.
  // We create two parts: a Crown (top) and a Pavilion (bottom) to give it volume and facets.
  
  // Extrude settings for a faceted look
  const extrudeSettings = {
    depth: stoneDepth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  };

  // Crown: The top part, slightly smaller or same size, sitting on top of the girdle
  // We shift the shape so the extrusion centers correctly relative to the bezel
  const crownGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  // Center the geometry locally so positioning is easier
  crownGeom.computeBoundingBox();
  const crownCenter = new THREE.Vector3();
  crownGeom.boundingBox.getCenter(crownCenter);
  crownGeom.translate(-crownCenter.x, -crownCenter.y - (stoneDepth / 2), -crownCenter.z);
  
  const crown = new THREE.Mesh(crownGeom, gemMat);
  // Position: Shape was X,Y. We mapped to X,Z for the ring.
  // So local X is X, local Y is Z (up), local Z is -Y (depth).
  // Wait, ExtrudeGeometry extrudes along Z axis by default.
  // Our heart shape is in XY plane. Extrusion goes along Z.
  // We want the stone to stand up? No, the heart face should be visible from top/side.
  // In the image, the heart face is tilted towards the viewer.
  // Let's orient the stone so the flat face is roughly vertical/tilted.
  // Actually, standard ring orientation: Band in XZ. Stone sits on top.
  // Heart face should face somewhat up/out.
  // Let's keep the extrusion along Y (up) for the stone height.
  // So we need to rotate the shape or the mesh.
  
  // Correction: ExtrudeGeometry extrudes the 2D shape (in XY) along the Z axis.
  // So the flat face is in XY.
  // We want the flat face to be tilted.
  // Let's rotate the mesh: 
  // 1. Start with flat face in XY (facing +Z).
  // 2. Rotate X by -45 deg to tilt it back? Or just sit it on top.
  // In the image, the heart is upright relative to the band.
  // So the heart plane is roughly YZ? No, the band is XZ. The heart rises from the band.
  // The heart face is roughly in the YZ plane (facing +X) or tilted.
  // Let's assume the heart face is in the XY plane (vertical) and we rotate it to sit on the band.
  
  // Let's restart the stone orientation logic for clarity.
  // Band is in XZ plane. Top of band is +Y.
  // Stone sits at (0, bandRadius + bandTube, 0).
  // Heart shape should be in a plane that includes the Y axis.
  // Let's define the heart in XZ plane (flat on ground) then rotate up?
  // No, let's define heart in XY plane (vertical).
  // Then rotate it to sit on the band.
  
  // Re-defining Stone Geometry for correct orientation
  // Shape is in XY. Extrusion is along Z.
  // We want the "Face" (XY plane) to be visible.
  // We want the "Thickness" (Z axis) to be the depth of the stone.
  // So we place the stone at the top of the ring.
  // We rotate the stone so its local Y aligns with world Y (up).
  // Its local X/Z plane needs to align with the ring tangent?
  // In the image, the heart is facing somewhat forward (+Z) and up (+Y).
  // It looks like it's mounted on the front of the band.
  // So the heart plane is roughly X-Y, tilted back slightly.
  
  crown.rotation.x = -Math.PI / 6; // Tilt back 30 degrees
  crown.position.set(0, bandRadius + bandTube - 0.05, 0.05); // Sit on top of band
  root.add(crown);

  // --- 5. Internal Facets (Optional Polish) ---
  // Add a few internal planes to catch light and simulate facets inside the transparent stone
  const facetGeom = new THREE.PlaneGeometry(stoneScale * 0.8, stoneDepth * 0.8);
  const facet1 = new THREE.Mesh(facetGeom, gemMat);
  facet1.rotation.x = Math.PI / 4;
  facet1.rotation.y = Math.PI / 4;
  facet1.position.copy(crown.position);
  facet1.position.z += 0.02; // Slightly forward
  root.add(facet1);

  const facet2 = new THREE.Mesh(facetGeom, gemMat);
  facet2.rotation.x = Math.PI / 4;
  facet2.rotation.y = -Math.PI / 4;
  facet2.position.copy(crown.position);
  facet2.position.z += 0.02;
  root.add(facet2);

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