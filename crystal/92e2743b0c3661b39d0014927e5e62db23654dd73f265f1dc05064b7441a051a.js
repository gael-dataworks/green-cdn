export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.1,
    roughness: 0.7,
  });

  const detailMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.2,
    roughness: 0.5,
  });

  // --- 1. Main Case Body ---
  // We use ExtrudeGeometry for the main shape to get rounded corners on the face
  // and bevels on the sides.
  const shape = new THREE.Shape();
  const w = 0.60;
  const h = 1.00;
  const radius = 0.06;
  
  // Draw rounded rectangle
  shape.moveTo(-w/2 + radius, -h/2);
  shape.lineTo(w/2 - radius, -h/2);
  shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + radius);
  shape.lineTo(w/2, h/2 - radius);
  shape.quadraticCurveTo(w/2, h/2, w/2 - radius, h/2);
  shape.lineTo(-w/2 + radius, h/2);
  shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - radius);
  shape.lineTo(-w/2, -h/2 + radius);
  shape.quadraticCurveTo(-w/2, -h/2, -w/2 + radius, -h/2);

  const extrudeSettings = {
    steps: 1,
    depth: 0.09, // Thickness of the case
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
  };

  const caseGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry so pivot is at the center of the back face roughly
  caseGeom.center();
  
  const caseBody = new THREE.Mesh(caseGeom, caseMat);
  // Rotate to stand upright. Extrude is along Z. We want Z to be depth (thickness).
  // The shape is in XY. So Z is thickness.
  // In the image, the case is tilted back.
  caseBody.rotation.x = -0.35; // Tilt back slightly
  root.add(caseBody);

  // --- 2. Kickstand ---
  // A flat panel hinged near the bottom of the back.
  const standW = 0.35;
  const standH = 0.45;
  const standThick = 0.025;
  
  const standGeom = new THREE.BoxGeometry(standW, standH, standThick);
  const stand = new THREE.Mesh(standGeom, caseMat);
  
  // Position stand on the back of the case
  // Case depth is ~0.12 with bevels. Back face is at z = -depth/2
  const caseDepth = 0.09 + 0.015 * 2; 
  stand.position.z = -caseDepth / 2 - standThick / 2;
  stand.position.y = -0.15; // Lower half of the case
  
  // Rotate stand out to prop it up
  // Hinge is at the bottom of the stand panel relative to the case back
  // We need to pivot around the bottom edge of the stand mesh
  stand.geometry.translate(0, standH / 2, 0); // Move pivot to bottom edge
  stand.rotation.x = -0.9; // Angle out from the back
  
  root.add(stand);

  // --- 3. Side Buttons (Volume & Power) ---
  // Modeled as slightly inset darker shapes on the side walls
  
  // Volume buttons (Left side in this view, assuming standard phone orientation)
  // Actually in the image, the buttons are on the right side relative to the screen,
  // but we are looking at the back. So buttons are on the Right side of the case (positive X).
  // Wait, looking at the image: The stand is on the back. The buttons visible are on the Right edge.
  // There is a long button (power?) and two shorter ones (volume).
  // Let's place them on the +X side.
  
  const buttonDepth = 0.005; // How much they stick out or are recessed
  const buttonZ = -caseDepth / 2; // Side wall Z position approx
  
  // Power button (top one, longer)
  const pwrBtnGeom = new THREE.BoxGeometry(0.015, 0.08, 0.04);
  const pwrBtn = new THREE.Mesh(pwrBtnGeom, detailMat);
  pwrBtn.position.set(w/2 + 0.005, 0.15, 0); // On the side
  root.add(pwrBtn);

  // Volume Up
  const volUpGeom = new THREE.BoxGeometry(0.015, 0.05, 0.04);
  const volUp = new THREE.Mesh(volUpGeom, detailMat);
  volUp.position.set(w/2 + 0.005, 0.02, 0);
  root.add(volUp);

  // Volume Down
  const volDownGeom = new THREE.BoxGeometry(0.015, 0.05, 0.04);
  const volDown = new THREE.Mesh(volDownGeom, detailMat);
  volDown.position.set(w/2 + 0.005, -0.05, 0);
  root.add(volDown);

  // --- 4. Bottom Ports ---
  // Charging port (center), Speaker grilles (sides)
  
  // USB-C Port
  const usbGeom = new THREE.BoxGeometry(0.04, 0.015, 0.02);
  const usb = new THREE.Mesh(usbGeom, detailMat);
  usb.position.set(0, -h/2 - 0.01, 0); // Bottom edge
  usb.rotation.x = Math.PI / 2; // Face downwards/outwards
  root.add(usb);

  // Speaker Grilles (small holes)
  const speakerGeom = new THREE.BoxGeometry(0.08, 0.01, 0.02);
  const spkLeft = new THREE.Mesh(speakerGeom, detailMat);
  spkLeft.position.set(-0.15, -h/2 - 0.01, 0);
  spkLeft.rotation.x = Math.PI / 2;
  root.add(spkLeft);

  const spkRight = new THREE.Mesh(speakerGeom, detailMat);
  spkRight.position.set(0.15, -h/2 - 0.01, 0);
  spkRight.rotation.x = Math.PI / 2;
  root.add(spkRight);

  // --- 5. Camera Cutout (Back Top Left) ---
  // A raised or distinct area for the camera module
  const camW = 0.25;
  const camH = 0.25;
  const camGeom = new THREE.BoxGeometry(camW, camH, 0.015);
  const camModule = new THREE.Mesh(camGeom, caseMat);
  camModule.position.set(-w/2 + 0.15, h/2 - 0.15, -caseDepth/2 - 0.01);
  root.add(camModule);
  
  // Camera lenses (black circles)
  const lensGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const lens1 = new THREE.Mesh(lensGeom, detailMat);
  lens1.rotation.x = Math.PI / 2;
  lens1.position.set(-w/2 + 0.10, h/2 - 0.10, -caseDepth/2 - 0.02);
  root.add(lens1);

  const lens2 = new THREE.Mesh(lensGeom, detailMat);
  lens2.rotation.x = Math.PI / 2;
  lens2.position.set(-w/2 + 0.20, h/2 - 0.10, -caseDepth/2 - 0.02);
  root.add(lens2);
  
  const lens3 = new THREE.Mesh(lensGeom, detailMat);
  lens3.rotation.x = Math.PI / 2;
  lens3.position.set(-w/2 + 0.15, h/2 - 0.20, -caseDepth/2 - 0.02);
  root.add(lens3);

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