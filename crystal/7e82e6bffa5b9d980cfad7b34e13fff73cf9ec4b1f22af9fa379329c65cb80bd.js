export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Main fur: Tan, very matte, soft look
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xD2B48C,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Snout & Pads: Lighter cream/wheat color
  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xF5DEB3,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Nose: Dark brown, slightly smoother than fur
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x3E2723,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Eyes: Black, shiny bead-like
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.1,
  });

  // --- Body ---
  // Large rounded base, sitting posture
  const bodyGeom = new THREE.SphereGeometry(0.32, 32, 32);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.position.y = -0.15;
  body.scale.set(1.0, 0.9, 0.85); // Slightly squat
  root.add(body);

  // --- Head ---
  // Round head on top of body
  const headGeom = new THREE.SphereGeometry(0.26, 32, 32);
  const head = new THREE.Mesh(headGeom, furMat);
  head.position.set(0, 0.35, 0.05); // Slightly forward
  root.add(head);

  // --- Snout ---
  // Protruding lighter muzzle
  const snoutGeom = new THREE.SphereGeometry(0.11, 32, 32);
  const snout = new THREE.Mesh(snoutGeom, snoutMat);
  snout.position.set(0, 0.32, 0.24);
  snout.scale.set(1.0, 0.8, 0.7); // Flattened sphere
  root.add(snout);

  // --- Nose ---
  // Small dark tip on snout
  const noseGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, 0.34, 0.33);
  root.add(nose);

  // --- Ears ---
  // Two rounded ears on top
  const earGeom = new THREE.SphereGeometry(0.07, 24, 24);
  
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.position.set(-0.18, 0.55, 0.0);
  leftEar.scale.set(1.0, 0.8, 0.6);
  leftEar.rotation.z = -0.3;
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.position.set(0.18, 0.55, 0.0);
  rightEar.scale.set(1.0, 0.8, 0.6);
  rightEar.rotation.z = 0.3;
  root.add(rightEar);

  // --- Eyes ---
  // Small black beads on sides of head
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.12, 0.42, 0.20);
  root.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.12, 0.42, 0.20);
  root.add(rightEye);

  // --- Arms ---
  // Capsule shapes hanging at sides
  const armGeom = new THREE.CapsuleGeometry(0.09, 0.22, 8, 16);
  
  const leftArm = new THREE.Mesh(armGeom, furMat);
  leftArm.position.set(-0.28, 0.15, 0.05);
  leftArm.rotation.z = 0.4;
  leftArm.rotation.x = -0.2;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, furMat);
  rightArm.position.set(0.28, 0.15, 0.05);
  rightArm.rotation.z = -0.4;
  rightArm.rotation.x = -0.2;
  root.add(rightArm);

  // --- Legs ---
  // Bulbous shapes at the bottom front
  const legGeom = new THREE.SphereGeometry(0.13, 32, 32);
  
  const leftLeg = new THREE.Mesh(legGeom, furMat);
  leftLeg.position.set(-0.20, -0.25, 0.25);
  leftLeg.scale.set(1.0, 0.9, 1.1);
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, furMat);
  rightLeg.position.set(0.20, -0.25, 0.25);
  rightLeg.scale.set(1.0, 0.9, 1.1);
  root.add(rightLeg);

  // --- Footpads ---
  // Lighter ovals on the front of the legs
  const padGeom = new THREE.SphereGeometry(0.08, 24, 24);
  
  const leftPad = new THREE.Mesh(padGeom, snoutMat);
  leftPad.position.set(-0.20, -0.28, 0.36);
  leftPad.scale.set(1.0, 0.4, 0.8);
  leftPad.rotation.x = -0.5;
  root.add(leftPad);

  const rightPad = new THREE.Mesh(padGeom, snoutMat);
  rightPad.position.set(0.20, -0.28, 0.36);
  rightPad.scale.set(1.0, 0.4, 0.8);
  rightPad.rotation.x = -0.5;
  root.add(rightPad);

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