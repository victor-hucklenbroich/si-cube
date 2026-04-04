import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const settings = {
  theme: getPreferredTheme(),
  lang: localStorage.getItem("lang") || "en"
};

const translations = {
  de: {
    title: "Si Kristallebenen",
    subtitle: "Millersche Indizes",
    facing: "BETRACHTETE EBENE",
    angles: "WINKEL",
    rotate: "Drehen",
    pan: "Bewegen",
    zoom: "Zoom"
  },
  en: {
    title: "Si Crystal Planes",
    subtitle: "Miller Indices",
    facing: "FACING PLANE",
    angles: "ANGLES",
    rotate: "Rotate",
    pan: "Pan",
    zoom: "Zoom"
  }
};

let scene, camera, renderer, controls;
let facesData = [];
let currentFaceIdx = -1;
let animTarget = null;

async function init() {
  setLanguage(settings["lang"]);
  setTheme(settings["theme"]);

  const resp = await fetch('data/cube.json');
  const cube = await resp.json();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x262626);

  const container = document.getElementById('canvas-container');
  camera = new THREE.PerspectiveCamera(
    40,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(2.8, 2.0, 2.8);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.minDistance = 4;
  controls.maxDistance = 25;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.7);
  d1.position.set(3, 5, 4);
  scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x8888ff, 0.25);
  d2.position.set(-3, -2, -4);
  scene.add(d2);

  buildCube(cube);

  window.addEventListener('resize', onResize);

  // Cancel animation on manual interaction
  renderer.domElement.addEventListener('pointerdown', () => {
    if (animTarget) {
      animTarget = null;
      controls.enableDamping = true;
    }
  });

  animate();
}

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
}

function setTheme(theme) {
  localStorage.setItem("theme", theme);
}

function getPreferredLanguage() {
  const browserLang = navigator.language.startsWith("de") ? "de" : "en";
  const savedLang = localStorage.getItem("lang") || browserLang;
  return savedLang;
}

function setLanguage(lang) {
  const elements = document.querySelectorAll("[data-i18n]");

  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = translations[lang][key];
  });

  localStorage.setItem("lang", lang);
}

function buildCube(cube) {
  const vertices = cube.vertices;
  const positions = [], colors = [], normals = [], edgePositions = [];
  facesData = [];

  cube.faces.forEach((face) => {
    const normal = new THREE.Vector3(...face.normal);
    const centroid = new THREE.Vector3(...face.centroid);

    facesData.push({
      label: face.label,
      family: face.family,
      normal: normal.clone(),
      centroid: centroid.clone(),
    });

    face.triangles.forEach((tri) => {
      for (let i = 0; i < 3; i++) {
        const v = vertices[tri[i]];
        positions.push(v[0], v[1], v[2]);
        normals.push(normal.x, normal.y, normal.z);
      }
    });

    const edgeCount = {};
    face.triangles.forEach((tri) => {
      for (let i = 0; i < 3; i++) {
        const a = tri[i], b = tri[(i + 1) % 3];
        const key = Math.min(a, b) + ',' + Math.max(a, b);
        edgeCount[key] = (edgeCount[key] || 0) + 1;
      }
    });
    Object.entries(edgeCount).forEach(([key, count]) => {
      if (count === 1) {
        const [a, b] = key.split(',').map(Number);
        edgePositions.push(...vertices[a], ...vertices[b]);
      }
    });
  });

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  scene.add(
    new THREE.Mesh(
      geom,
      new THREE.MeshPhongMaterial({
        vertexColors: false,
        flatShading: true,
        transparent: false,
        side: THREE.DoubleSide,
      })
    )
  );

  // Wireframe edges
  const eGeom = new THREE.BufferGeometry();
  eGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  scene.add(new THREE.LineSegments(eGeom, new THREE.LineBasicMaterial({color: 0x3a3f4a})));
}

// Miller index formatting
function formatMillerIndexHTML(hkl) {
  return (
    '(' +
    hkl
      .map((v) =>
        v < 0
          ? '<span style="text-decoration:overline">' + Math.abs(v) + '</span>'
          : '' + v
      )
      .join(' ') +
    ')'
  );
}

// Facing detection
function findFacingPlane() {
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  let bestIdx = 0,
    bestDot = -Infinity;
  facesData.forEach((face, i) => {
    const dot = -camDir.dot(face.normal);
    if (dot > bestDot) {
      bestDot = dot;
      bestIdx = i;
    }
  });
  return bestIdx;
}

function angleBetween(n1, n2) {
  const dot = THREE.MathUtils.clamp(n1.dot(n2), -1, 1);
  return THREE.MathUtils.radToDeg(Math.acos(dot));
}

window.navigateToFace = function (faceIdx) {
  const face = facesData[faceIdx];
  const radius = camera.position.length();
  animTarget = {
    position: face.normal.clone().multiplyScalar(radius),
    startPos: camera.position.clone(),
    progress: 0,
  };
  controls.enableDamping = false;
};

function updateHUD() {
  const faceIdx = findFacingPlane();
  if (faceIdx === currentFaceIdx) return;
  currentFaceIdx = faceIdx;

  const face = facesData[faceIdx];

  document.getElementById('facing-index').innerHTML = formatMillerIndexHTML(face.label);
  const familyEl = document.getElementById('facing-family');
  familyEl.textContent = '{' + face.family + '}';
  familyEl.className = 'family-tag family-' + face.family;

  const seen = new Set();
  const entries = [];
  facesData.forEach((other, i) => {
    if (i === faceIdx) return;
    const key = other.label.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({
      label: other.label,
      family: other.family,
      angle: angleBetween(face.normal, other.normal),
      idx: i,
    });
  });
  entries.sort((a, b) => a.angle - b.angle);

  document.getElementById('angle-list').innerHTML = entries
    .map(
      (e) => `
    <div class="angle-row" onclick="navigateToFace(${e.idx})">
      <span class="dot dot-${e.family}"></span>
      <span class="idx">${formatMillerIndexHTML(e.label)}</span>
      <span class="deg">${e.angle.toFixed(1)}°</span>
    </div>`
    )
    .join('');
}

// Resize
function onResize() {
  const container = document.getElementById('canvas-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Render loop
function animate() {
  requestAnimationFrame(animate);

  if (animTarget) {
    animTarget.progress += 0.03;
    const t = Math.min(1, animTarget.progress);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(animTarget.startPos, animTarget.position, ease);
    camera.lookAt(0, 0, 0);
    controls.update();
    if (t >= 1) {
      animTarget = null;
      controls.enableDamping = true;
    }
  } else {
    controls.update();
  }

  updateHUD();
  renderer.render(scene, camera);
}

init().catch(console.error);
