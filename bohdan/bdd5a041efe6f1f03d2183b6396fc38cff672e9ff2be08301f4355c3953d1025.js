export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Iridescent Metallic Purple/Pink
  // Using metalness 0.6 (cap) and emissive to simulate the bright, shiny reference
  // which would otherwise look too dark without an environment map.
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xd050d0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x602060,
    emissiveIntensity: 0.4,
  });

  // --- 1. Main Shell Body (Lathe) ---
  // Profile defines the teardrop shape from tip (left) to face (right)
  // Coordinates: x = length axis, y = radius
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Tip
    new THREE.Vector2(0.05, 0.04), // Neck start
    new THREE.Vector2(0.15, 0.08), // Neck
    new THREE.Vector2(0.35, 0.18), // Body start expanding
    new THREE.Vector2(0.55, 0.28), // Max bulge
    new THREE.Vector2(0.75, 0.31), // Approaching face
    new THREE.Vector2(0.85, 0.30), // Face rim
    new THREE.Vector2(0.85, 0.00), // Face center (closes the volume)
  ];

  const shellGeom = new THREE.LatheGeometry(profilePoints, 32);
  const shellBody = new THREE.Mesh(shellGeom, shellMat);
  // Rotate to align with Z axis if desired, but let's keep X as main axis for now
  // The reference has the tip pointing left (-X) and spiral on right (+X).
  // Lathe creates around Y axis. So the profile X becomes radial distance?
  // No, Lathe rotates the 2D shape (x,y) around the Y axis.
  // So the 'x' in Vector2 becomes the radius, and 'y' becomes the height.
  // I need the long axis to be Z or X.
  // Let's redefine: Profile (radius, height).
  // Height axis = Z (length of shell). Radius axis = X/Y.
  
  // Corrected Profile for Lathe (radius, height)
  // Shell lies along Z axis. Tip at -Z, Face at +Z.
  const latheProfile = [
    new THREE.Vector2(0.00, -0.50), // Tip (bottom)
    new THREE.Vector2(0.05, -0.40), 
    new THREE.Vector2(0.10, -0.30), 
    new THREE.Vector2(0.18, -0.15), 
    new THREE.Vector2(0.28, 0.05),  // Max bulge
    new THREE.Vector2(0.30, 0.25),  // Upper body
    new THREE.Vector2(0.29, 0.35),  // Rim
    new THREE.Vector2(0.00, 0.35),  // Center of face (top)
  ];

  const bodyGeom = new THREE.LatheGeometry(latheProfile, 36);
  const shellBodyMesh = new THREE.Mesh(bodyGeom, shellMat);
  root.add(shellBodyMesh);

  // --- 2. Spiral Ridge Detail ---
  // The spiral is on the "face" of the shell (the wide end).
  // In our Lathe setup, the face is at Z = 0.35, facing +Z.
  // We need a spiral in the XY plane at Z ~ 0.34.
  
  const spiralPoints = [];
  const turns = 2.5;
  const segments = 64;
  const startRadius = 0.26;
  const endRadius = 0.04;
  const spiralZ = 0.34; // Slightly in front of the face center

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = t * turns * Math.PI * 2;
    // Archimedean spiral: radius decreases as angle increases
    const r = startRadius - (t * (startRadius - endRadius));
    
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const z = spiralZ;
    
    spiralPoints.push(new THREE.Vector3(x, y, z));
  }

  const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
  // Tube radius needs to be small to look like a ridge/groove
  const spiralGeom = new THREE.TubeGeometry(spiralCurve, 64, 0.015, 8, false);
  const spiralRidge = new THREE.Mesh(spiralGeom, shellMat);
  root.add(spiralRidge);

  // --- 3. Spiral Center Cap ---
  // A small nub at the very center of the spiral
  const centerGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const centerCap = new THREE.Mesh(centerGeom, shellMat);
  centerCap.position.set(0, 0, spiralZ);
  root.add(centerCap);

  // --- 4. Tip Detail ---
  // The tip in the reference has a small segmented look or just a sharp point.
  // Let's add a tiny ring near the tip to break up the silhouette.
  const tipRingGeom = new THREE.TorusGeometry(0.06, 0.012, 8, 16);
  const tipRing = new THREE.Mesh(tipRingGeom, shellMat);
  tipRing.rotation.x = Math.PI / 2; // Flat in XY
  tipRing.position.set(0, 0, -0.42); // Near the tip (-Z)
  root.add(tipRing);

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