export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Steel Blade: Bright, polished metal. Using emissive to combat dim renderer.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Brass/Gold Bolster & End Cap
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // Handle: Matte black composite/wood
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Procedural Logo Texture ---
  // Creates a simple data texture for the blade marking
  const texWidth = 256;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  for (let i = 0; i < texWidth * texHeight; i++) {
    // Base light steel color
    data[i * 4] = 220;
    data[i * 4 + 1] = 220;
    data[i * 4 + 2] = 220;
    data[i * 4 + 3] = 255;
  }
  // Draw a dark rectangular "text" area in the center
  const startX = Math.floor(texWidth * 0.3);
  const endX = Math.floor(texWidth * 0.7);
  const startY = Math.floor(texHeight * 0.2);
  const endY = Math.floor(texHeight * 0.8);
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * texWidth + x) * 4;
      // Dark gray text
      data[idx] = 40;
      data[idx + 1] = 40;
      data[idx + 2] = 40;
      // Add some "noise" or lines to simulate text characters
      if ((x + y) % 4 === 0) {
        data[idx] = 20;
        data[idx + 1] = 20;
        data[idx + 2] = 20;
      }
    }
  }
  const logoTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  // Flip Y because UVs often start bottom-left
  logoTexture.flipY = true;
  bladeMat.map = logoTexture;

  // --- Geometry: Blade ---
  // Modeled in XY plane (standing up), will be rotated later.
  // Tip at Y=0.45, Handle junction at Y=-0.1
  const bladeShape = new THREE.Shape();
  // Start at tip
  bladeShape.moveTo(0, 0.45);
  // Spine (top edge) - slight curve down
  bladeShape.quadraticCurveTo(-0.02, 0.2, -0.05, 0.0);
  // Heel (back of blade)
  bladeShape.lineTo(-0.05, -0.1);
  // Bottom edge (tang/insertion point)
  bladeShape.lineTo(-0.02, -0.1);
  // Cutting Edge (belly) - curve back to tip
  bladeShape.quadraticCurveTo(0.02, 0.1, 0, 0.45);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry so pivot is reasonable
  bladeGeom.computeBoundingBox();
  const bladeCenter = new THREE.Vector3();
  bladeGeom.boundingBox.getCenter(bladeCenter);
  bladeGeom.translate(-bladeCenter.x, -bladeCenter.y, -bladeCenter.z);

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Position blade so tip is at +Y, handle junction at Y=0
  // The extrusion center is now 0,0,0. We need to shift it so the "bottom" (handle end) is at Y=0.
  // Original Y range was -0.1 to 0.45. Height = 0.55. Center was 0.175.
  // We want bottom at Y=0. So shift up by 0.1.
  blade.position.y = 0.1;
  root.add(blade);

  // --- Geometry: Bolster ---
  // Short brass cylinder between blade and handle
  const bolsterGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.04, 32);
  const bolster = new THREE.Mesh(bolsterGeom, brassMat);
  bolster.position.y = -0.02; // Just below blade junction
  root.add(bolster);

  // --- Geometry: Handle ---
  // Lathe profile in XY plane (X is radius, Y is height going down)
  // Starts at Y=0 (top of handle), ends at Y=-0.35 (bottom)
  const handlePoints = [];
  handlePoints.push(new THREE.Vector2(0.04, 0));      // Top neck
  handlePoints.push(new THREE.Vector2(0.05, -0.12));  // Belly (widest)
  handlePoints.push(new THREE.Vector2(0.045, -0.25)); // Taper
  handlePoints.push(new THREE.Vector2(0.035, -0.35)); // End
  // Close the loop for Lathe (bottom center, top center)
  handlePoints.push(new THREE.Vector2(0, -0.35));
  handlePoints.push(new THREE.Vector2(0, 0));

  const handleGeom = new THREE.LatheGeometry(handlePoints, 32);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.y = -0.02; // Align top with bolster bottom
  root.add(handle);

  // --- Geometry: End Cap ---
  // Brass cap at the bottom of the handle
  const capGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.025, 32);
  // Round the bottom slightly by scaling or using a sphere? Cylinder is fine for this style.
  const endCap = new THREE.Mesh(capGeom, brassMat);
  endCap.position.y = -0.35 - 0.0125; // Half height below handle end
  root.add(endCap);

  // --- Orientation ---
  // Currently the knife is standing up along +Y.
  // We need it to lie flat on the "table" (XZ plane) and point +Z.
  // Rotate -90 degrees around X axis.
  root.rotation.x = -Math.PI / 2;

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