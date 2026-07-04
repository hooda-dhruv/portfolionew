const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => observer.observe(item));

document.querySelectorAll(".tilt-card, .parallax-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const isMajd = document.body.classList.contains("majd-inspired") || document.body.classList.contains("majd-exact");
    const rotateY = isMajd ? x * 14 : x * 8;
    const rotateX = isMajd ? y * -12 : y * -7;
    const lift = isMajd ? -10 : -4;
    card.style.transform = `perspective(900px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(${lift}px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const form = document.getElementById("contactForm");
const statusNode = document.getElementById("formStatus");

if (form && statusNode) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get("name")?.toString().trim() || "there";
    statusNode.textContent = `Got it, ${name}. Your project brief is ready to turn into a build.`;
    form.reset();
  });
}

const yearNode = document.getElementById("year");
if (yearNode) yearNode.textContent = new Date().getFullYear();

const soundToggle = document.querySelector(".sound-toggle");
let audioContext;
let soundEnabled = document.body.classList.contains("majd-inspired") || document.body.classList.contains("majd-exact");
let ambientNodes;

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  return audioContext;
}

function playTone(frequency = 520, duration = 0.08, type = "sine", gainValue = 0.035) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.32, context.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function startAmbientSound() {
  if (!soundEnabled || ambientNodes) return;
  const context = getAudioContext();
  if (!context || context.state === "suspended") return;

  const hum = context.createOscillator();
  const shimmer = context.createOscillator();
  const humGain = context.createGain();
  const shimmerGain = context.createGain();
  const output = context.createGain();

  hum.type = "sine";
  hum.frequency.value = 82;
  shimmer.type = "triangle";
  shimmer.frequency.value = 164;
  humGain.gain.value = 0.012;
  shimmerGain.gain.value = 0.006;
  output.gain.value = 0.55;

  hum.connect(humGain);
  shimmer.connect(shimmerGain);
  humGain.connect(output);
  shimmerGain.connect(output);
  output.connect(context.destination);
  hum.start();
  shimmer.start();
  ambientNodes = { hum, shimmer, output };
}

function stopAmbientSound() {
  if (!ambientNodes) return;
  ambientNodes.output.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
  ambientNodes.hum.stop(audioContext.currentTime + 0.14);
  ambientNodes.shimmer.stop(audioContext.currentTime + 0.14);
  ambientNodes = null;
}

if (soundToggle) {
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.lastChild.textContent = soundEnabled ? " Sound on" : " Sound off";

  soundToggle.addEventListener("click", async () => {
    const context = getAudioContext();
    if (context?.state === "suspended") await context.resume();
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundToggle.lastChild.textContent = soundEnabled ? " Sound on" : " Sound off";
    if (soundEnabled) {
      startAmbientSound();
      playTone(420, 0.12, "triangle", 0.045);
    } else {
      stopAmbientSound();
    }
  });

  document.querySelectorAll("a, button, .tilt-card, .parallax-card, .showcase-card, .work-row, .service-tile, .testimonial-card, .exact-project, .exact-service, .exact-testimonial").forEach((item) => {
    item.addEventListener("pointerenter", () => {
      startAmbientSound();
      playTone(360, 0.045, "sine", 0.018);
    });
    item.addEventListener("click", () => {
      startAmbientSound();
      playTone(640, 0.07, "triangle", 0.028);
    });
  });

  ["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
    window.addEventListener(
      eventName,
      async () => {
        const context = getAudioContext();
        if (context?.state === "suspended") await context.resume();
        startAmbientSound();
      },
      { once: true }
    );
  });
}

document.querySelectorAll("img[data-photo]").forEach((image) => {
  const photoPath = image.getAttribute("data-photo");
  if (!photoPath) return;

  const candidate = new Image();
  candidate.addEventListener("load", () => {
    image.src = photoPath;
  });
  candidate.src = photoPath;
});

const canvas = document.getElementById("spaceCanvas");

if (canvas) {
  import("https://unpkg.com/three@0.165.0/build/three.module.js")
    .then((module) => initSpaceScene(module))
    .catch(() => {
      canvas.style.display = "none";
    });
}

function initSpaceScene(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 7.2);

  const group = new THREE.Group();
  scene.add(group);

  const page = document.body.dataset.page || "home";
  const colorMap = {
    home: [0xf6ead2, 0xf5c86a],
    about: [0xa8ff60, 0x4df4ff],
    services: [0x4b7dff, 0x4df4ff],
    projects: [0xff4fd8, 0x4b7dff],
    personal: [0xa8ff60, 0x4b7dff],
    lab: [0x4df4ff, 0xa8ff60],
    process: [0xa8ff60, 0xff4fd8],
    contact: [0xff4fd8, 0x4df4ff],
  };
  const [primaryColor, secondaryColor] = colorMap[page] || colorMap.home;
  const isEditorialHome = document.body.classList.contains("editorial-home") || document.body.classList.contains("majd-inspired") || document.body.classList.contains("majd-exact");

  const coreGeometry = new THREE.IcosahedronGeometry(1.1, 2);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.32,
    roughness: 0.18,
    emissive: primaryColor,
    emissiveIntensity: 0.16,
    wireframe: true,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  if (isEditorialHome) core.scale.setScalar(1.28);
  group.add(core);

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });

  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85 + index * 0.45, 0.012, 16, 160), ringMaterial.clone());
    ring.rotation.x = Math.PI / (2.2 + index * 0.22);
    ring.rotation.y = index * 0.72;
    ring.material.opacity = 0.48 - index * 0.1;
    group.add(ring);
  }

  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f7fb,
    emissive: secondaryColor,
    emissiveIntensity: 0.2,
    metalness: 0.4,
    roughness: 0.25,
  });

  for (let index = 0; index < 18; index += 1) {
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (index % 3) * 0.012, 16, 16), nodeMaterial);
    const angle = index * 0.82;
    const radius = 2.25 + (index % 5) * 0.28;
    node.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.7) * 0.9, Math.sin(angle) * radius);
    group.add(node);
  }

  if (isEditorialHome) {
    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0xf6ead2,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });

    for (let index = 0; index < 7; index += 1) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.18), panelMaterial.clone());
      const angle = (index / 7) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 3.2, Math.sin(angle * 1.4) * 1.2, Math.sin(angle) * 2.8);
      panel.rotation.set(angle * 0.25, angle, angle * 0.12);
      panel.userData.floatOffset = index * 0.8;
      panel.userData.baseY = panel.position.y;
      group.add(panel);
    }
  }

  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);

  for (let index = 0; index < particleCount; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 18;
    positions[index * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 14;
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0.52,
    })
  );
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const lightA = new THREE.PointLight(primaryColor, 4.5, 14);
  lightA.position.set(3, 2.6, 3.8);
  scene.add(lightA);

  const lightB = new THREE.PointLight(secondaryColor, 3.2, 12);
  lightB.position.set(-3.4, -1.7, 3.2);
  scene.add(lightB);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();
    const scrollRatio = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);

    group.rotation.x = elapsed * 0.13 + pointer.y * 0.12;
    group.rotation.y = elapsed * (isEditorialHome ? 0.24 : 0.18) + pointer.x * 0.2 + scrollRatio * 1.45;
    group.rotation.z = isEditorialHome ? Math.sin(elapsed * 0.35) * 0.04 : 0;
    group.position.x = pointer.x * (isEditorialHome ? 0.36 : 0.22);
    group.position.y = -0.25 + pointer.y * (isEditorialHome ? -0.24 : -0.16);

    core.rotation.x = elapsed * 0.42;
    core.rotation.z = elapsed * 0.22;
    particles.rotation.y = elapsed * 0.018;
    particles.rotation.x = pointer.y * 0.03;

    group.children.forEach((child) => {
      if (child.userData.floatOffset !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(elapsed + child.userData.floatOffset) * 0.16;
        child.rotation.z += 0.002;
      }
    });

    camera.position.z = (isEditorialHome ? 6.7 : 7.2) - scrollRatio * 1.1;
    camera.position.x = pointer.x * (isEditorialHome ? 0.16 : 0);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
