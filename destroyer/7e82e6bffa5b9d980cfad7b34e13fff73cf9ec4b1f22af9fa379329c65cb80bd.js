export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Fur is very matte and soft.
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Snout and foot pads are lighter cream, slightly less rough.
  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xf5deb3,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Nose is dark and slightly smoother (leather-like).
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Eyes are glossy black beads.
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.2,
  });

  // --- Dimensions ---
  // Base scale for the bear before normalization.
  const bodyRadius = 0.26;
  const headRadius = 0.23;
  const limbRadius = 0.11;
  const earRadius = 0.08;
  const snoutRadius = 0.09;
  const padRadius = 0.075;
  const noseRadius = 0.028;
  const eyeRadius = 0.018;

  // --- Body ---
  // Squashed sphere for the torso.
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 32, 32);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.scale.set(1.1, 0.9, 1.0);
  body.position.y = 0.22;
  root.add(body);

  // --- Head Group ---
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.48;
  root.add(headGroup);

  const headGeom = new THREE.SphereGeometry(headRadius, 32, 32);
  const head = new THREE.Mesh(headGeom, furMat);
  // Slight squash for head
  head.scale.set(1.05, 0.95, 1.0);
  headGroup.add(head);

  // --- Snout ---
  const snoutGeom = new THREE.SphereGeometry(snoutRadius, 32, 32);
  const snout = new THREE.Mesh(snoutGeom, snoutMat);
  snout.scale.set(1.3, 0.9, 0.9);
  snout.position.set(0, -0.02, 0.19);
  headGroup.add(snout);

  // --- Nose ---
  const noseGeom = new THREE.SphereGeometry(noseRadius, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, 0.02, 0.26);
  headGroup.add(nose);

  // --- Eyes ---
  const eyeGeom = new THREE.SphereGeometry(eyeRadius, 16, 16);
  
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.09, 0.05, 0.18);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.09, 0.05, 0.18);
  headGroup.add(rightEye);

  // --- Ears ---
  const earGeom = new THREE.SphereGeometry(earRadius, 32, 32);
  
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.scale.set(1.0, 0.8, 0.4); // Flattened
  leftEar.position.set(-0.16, 0.18, -0.12);
  leftEar.rotation.z = 0.2;
  leftEar.rotation.x = -0.2;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.scale.set(1.0, 0.8, 0.4); // Flattened
  rightEar.position.set(0.16, 0.18, -0.12);
  rightEar.rotation.z = -0.2;
  rightEar.rotation.x = -0.2;
  headGroup.add(rightEar);

  // --- Arms ---
  const armGeom = new THREE.SphereGeometry(limbRadius, 32, 32);
  
  const leftArm = new THREE.Mesh(armGeom, furMat);
  leftArm.scale.set(0.9, 1.2, 0.9); // Elongated
  leftArm.position.set(-0.28, 0.25, 0.05);
  leftArm.rotation.z = 0.3;
  leftArm.rotation.x = 0.2;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, furMat);
  rightArm.scale.set(0.9, 1.2, 0.9); // Elongated
  rightArm.position.set(0.28, 0.25, 0.05);
  rightArm.rotation.z = -0.3;
  rightArm.rotation.x = 0.2;
  root.add(rightArm);

  // --- Legs ---
  const legGeom = new THREE.SphereGeometry(limbRadius, 32, 32);
  
  const leftLeg = new THREE.Mesh(legGeom, furMat);
  leftLeg.scale.set(1.0, 1.0, 1.1);
  leftLeg.position.set(-0.16, 0.05, 0.22);
  leftLeg.rotation.z = 0.4;
  leftLeg.rotation.x = 0.5;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, furMat);
  rightLeg.scale.set(1.0, 1.0, 1.1);
  rightLeg.position.set(0.16, 0.05, 0.22);
  rightLeg.rotation.z = -0.4;
  rightLeg.rotation.x = 0.5;
  root.add(rightLeg);

  // --- Foot Pads ---
  const padGeom = new THREE.SphereGeometry(padRadius, 32, 32);
  
  const leftPad = new THREE.Mesh(padGeom, snoutMat);
  leftPad.scale.set(1.0, 0.4, 1.3); // Flat oval
  leftPad.position.set(-0.16, 0.01, 0.30);
  leftPad.rotation.z = 0.4;
  leftPad.rotation.x = 0.5;
  root.add(leftPad);

  const rightPad = new THREE.Mesh(padGeom, snoutMat);
  rightPad.scale.set(1.0, 0.4, 1.3); // Flat oval
  rightPad.position.set(0.16, 0.01, 0.30);
  rightPad.rotation.z = -0.4;
  rightPad.rotation.x = 0.5;
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