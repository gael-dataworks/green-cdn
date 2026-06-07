export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Gold band material
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.9,
    roughness: 0.3,
  });

  // Agate/Teal stone material
  // Using Physical material for transmission (translucency) typical of agate slices
  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x40E0D0,       // Turquoise/Teal base
    metalness: 0.0,
    roughness: 0.2,        // Polished top surface
    transmission: 0.6,     // Semi-translucent
    thickness: 0.8,        // Volume for refraction
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // --- Geometry Construction ---

  // 1. The Band
  // Standard torus for a ring band. 
  // Radius ~0.12, Tube ~0.025. 
  // Rotated to sit flat on XZ plane (default Torus is in XY).
  const bandGeom = new THREE.TorusGeometry(0.12, 0.025, 16, 32);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.0; 
  root.add(band);

  // 2. The Stone (Agate Slice)
  // We use ExtrudeGeometry to create a slab with a custom 2D profile.
  // The profile is a rounded rectangle with slight irregularities to mimic a raw slice.
  
  const stoneWidth = 0.28;
  const stoneLength = 0.45;
  const stoneDepth = 0.06;

  const shape = new THREE.Shape();
  
  // Define a slightly irregular rectangular path
  // Start bottom-left
  const x = -stoneWidth / 2;
  const y = -stoneLength / 2;
  const w = stoneWidth;
  const h = stoneLength;
  
  // We draw the perimeter with slight curves to avoid perfect straight lines
  // Bottom edge
  shape.moveTo(x, y);
  shape.lineTo(x + w * 0.4, y - 0.01); // slight dip
  shape.lineTo(x + w, y);
  
  // Right edge
  shape.quadraticCurveTo(x + w + 0.01, y + h * 0.1, x + w, y + h * 0.3);
  shape.lineTo(x + w, y + h * 0.7);
  shape.quadraticCurveTo(x + w + 0.01, y + h * 0.9, x + w, y + h);
  
  // Top edge
  shape.lineTo(x + w * 0.6, y + h + 0.01); // slight bump
  shape.lineTo(x, y + h);
  
  // Left edge
  shape.quadraticCurveTo(x - 0.01, y + h * 0.9, x, y + h * 0.7);
  shape.lineTo(x, y + h * 0.3);
  shape.quadraticCurveTo(x - 0.01, y + h * 0.1, x, y);

  const extrudeSettings = {
    steps: 1,
    depth: stoneDepth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  };

  const stoneGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Center the geometry so pivot is at the center of the slab
  stoneGeom.center();

  const stone = new THREE.Mesh(stoneGeom, stoneMat);
  
  // Position the stone on top of the band
  // The band top is roughly at y = 0.025 (tube radius)
  // Stone center needs to be above that.
  stone.position.y = 0.025 + (stoneDepth / 2);
  
  // Rotate slightly to match the dynamic angle in the reference (tilted back)
  stone.rotation.x = -0.2; 
  
  root.add(stone);

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