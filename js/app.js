import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';


const settings = {
    theme: getPreferredTheme(),
    lang: getPreferredLanguage(),
};

const translations = {
    de: {
        title: "Si Kristallebenen",
        subtitle: "Millersche Indizes",
        facing: "BETRACHTETE EBENE",
        angles: "WINKEL",
        rotate: "Drehen",
        pan: "Bewegen",
        zoom: "Zoom",
        center: "⌂ Zentrieren",
    },
    en: {
        title: "Si Crystal Planes",
        subtitle: "Miller Indices",
        facing: "FACING PLANE",
        angles: "ANGLES",
        rotate: "Rotate",
        pan: "Pan",
        zoom: "Zoom",
        center: "⌂ Center",
    },
};

const THEME_COLORS = {
    dark: {
        sceneBg: 0x262626,
        edgeColor: 0x3a3f4a,
        faceBgBase: 60,
        faceTextAlpha: 1.0,
    },
    light: {
        sceneBg: 0xd4d4d4,
        edgeColor: 0x9ca3af,
        faceBgBase: 210,
        faceTextAlpha: 0.85,
    },
};

const FAMILY_COLORS = {
    '100': {r: 94, g: 234, b: 212},
    '110': {r: 245, g: 158, b: 11},
    '111': {r: 167, g: 139, b: 250},
};

const DEFAULT_CAM = {x: 3.8, y: 2.5, z: 3.8};

let scene, camera, renderer, controls;
let facesData = [];
let currentFaceIdx = -1;
let animTarget = null;
let faceMeshes = [];
let edgeLines = null;
let cubeData = null;


async function init() {
    applyLanguage(settings.lang);
    applyTheme(settings.theme);

    const resp = await fetch('data/cube.json');
    cubeData = await resp.json();

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(THEME_COLORS[settings.theme].sceneBg);

    // Camera
    const container = document.getElementById('canvas-container');
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.6);
    d1.position.set(3, 5, 4);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x8888ff, 0.2);
    d2.position.set(-3, -2, -4);
    scene.add(d2);

    // Build
    buildCube(cubeData);

    // Events
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', () => {
        if (animTarget) {
            animTarget = null;
            controls.enableDamping = true;
        }
    });

    animate();
}

function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    settings.theme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☽' : '☀';

    if (scene) {
        const tc = THEME_COLORS[theme];
        scene.background = new THREE.Color(tc.sceneBg);
        if (edgeLines) edgeLines.material.color.set(tc.edgeColor);
        rebuildFaceTextures();
    }
}

window.switchTheme = function () {
    applyTheme(settings.theme === 'dark' ? 'light' : 'dark');
};

function getPreferredLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    return navigator.language.startsWith('de') ? 'de' : 'en';
}

function applyLanguage(lang) {
    settings.lang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = lang === 'de' ? 'DE' : 'EN';

    // Force HUD re-render
    currentFaceIdx = -1;
}

window.switchLanguage = function () {
    applyLanguage(settings.lang === 'de' ? 'en' : 'de');
};

// Miller index labels
function createFaceTexture(label, family, isTriangle) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const fc = FAMILY_COLORS[family];
    const tc = THEME_COLORS[settings.theme];
    const base = tc.faceBgBase;

    // Background tinted with family color
    ctx.fillStyle = `rgb(${Math.round(fc.r * 0.15 + base)}, ${Math.round(fc.g * 0.15 + base)}, ${Math.round(fc.b * 0.15 + base)})`;
    ctx.fillRect(0, 0, size, size);

    // Text
    const fontSize = isTriangle ? 38 : 44;
    ctx.font = `300 ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = tc.faceTextAlpha;
    ctx.fillStyle = `rgb(${fc.r}, ${fc.g}, ${fc.b})`;

    const cx = size / 2, cy = size / 2;
    const parts = label.map((v) => ({val: Math.abs(v), neg: v < 0}));
    const spacing = fontSize * 0.55;
    const totalW = spacing * (parts.length - 1);
    const startX = cx - totalW / 2;

    ctx.fillText('(', startX - fontSize * 0.45, cy);
    ctx.fillText(')', startX + totalW + fontSize * 0.45, cy);

    parts.forEach((p, i) => {
        const x = startX + i * spacing;
        ctx.fillText(String(p.val), x, cy);
        if (p.neg) {
            const w = ctx.measureText(String(p.val)).width / 2;
            ctx.strokeStyle = `rgb(${fc.r}, ${fc.g}, ${fc.b})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x - w, cy - fontSize * 0.42);
            ctx.lineTo(x + w, cy - fontSize * 0.42);
            ctx.stroke();
        }
    });

    ctx.globalAlpha = 1.0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
}

function rebuildFaceTextures() {
    faceMeshes.forEach(({mesh, label, family, isTriangle}) => {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.map = createFaceTexture(label, family, isTriangle);
        mesh.material.needsUpdate = true;
    });
}

// UV Mapping
function computeFaceUVs(faceVerts3D, normal) {
    const n = new THREE.Vector3(...normal).normalize();
    const u = new THREE.Vector3();
    if (Math.abs(n.x) < 0.9) u.crossVectors(n, new THREE.Vector3(1, 0, 0));
    else u.crossVectors(n, new THREE.Vector3(0, 1, 0));
    u.normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();

    const pts = faceVerts3D.map((p) => ({
        x: new THREE.Vector3(...p).dot(u),
        y: new THREE.Vector3(...p).dot(v),
    }));

    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    pts.forEach((p) => {
        mnX = Math.min(mnX, p.x);
        mxX = Math.max(mxX, p.x);
        mnY = Math.min(mnY, p.y);
        mxY = Math.max(mxY, p.y);
    });
    const rX = mxX - mnX || 1, rY = mxY - mnY || 1, pad = 0.02;
    return pts.map((p) => ({
        u: pad + (1 - 2 * pad) * (p.x - mnX) / rX,
        v: pad + (1 - 2 * pad) * (p.y - mnY) / rY,
    }));
}

function buildCube(cube) {
    const vertices = cube.vertices;
    const edgePositions = [];
    facesData = [];
    faceMeshes = [];

    cube.faces.forEach((face) => {
        const n = face.normal;
        const isTriangle = face.family === '111';

        facesData.push({
            label: face.label,
            family: face.family,
            normal: new THREE.Vector3(...n),
            centroid: new THREE.Vector3(...face.centroid),
        });

        // Collect unique vertices for UV computation
        const idxSet = new Set();
        face.triangles.forEach((tri) => tri.forEach((i) => idxSet.add(i)));
        const uArr = Array.from(idxSet);
        const uvs = computeFaceUVs(uArr.map((i) => vertices[i]), n);
        const idxToUV = {};
        uArr.forEach((vi, i) => {
            idxToUV[vi] = uvs[i];
        });

        // Geometry with UVs
        const pos = [], nrm = [], uv = [];
        face.triangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const v = vertices[tri[i]];
                pos.push(v[0], v[1], v[2]);
                nrm.push(n[0], n[1], n[2]);
                const fuv = idxToUV[tri[i]];
                uv.push(fuv.u, fuv.v);
            }
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));

        const texture = createFaceTexture(face.label, face.family, isTriangle);
        const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 40,
            specular: 0x222222,
            side: THREE.DoubleSide,
        }));
        scene.add(mesh);
        faceMeshes.push({mesh, label: face.label, family: face.family, isTriangle});

        // Boundary edges
        const ec = {};
        face.triangles.forEach((tri) => {
            for (let i = 0; i < 3; i++) {
                const a = tri[i], b = tri[(i + 1) % 3];
                const key = Math.min(a, b) + ',' + Math.max(a, b);
                ec[key] = (ec[key] || 0) + 1;
            }
        });
        Object.entries(ec).forEach(([key, count]) => {
            if (count === 1) {
                const [a, b] = key.split(',').map(Number);
                edgePositions.push(...vertices[a], ...vertices[b]);
            }
        });
    });

    // Edge wireframe
    const eGeom = new THREE.BufferGeometry();
    eGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeLines = new THREE.LineSegments(eGeom, new THREE.LineBasicMaterial({
        color: THEME_COLORS[settings.theme].edgeColor,
    }));
    scene.add(edgeLines);
}

// Miller index formatting
function formatMillerIndexHTML(hkl) {
    return '(' + hkl.map((v) =>
        v < 0 ? '<span style="text-decoration:overline">' + Math.abs(v) + '</span>' : '' + v
    ).join(' ') + ')';
}

// Facing detection
function findFacingPlane() {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    let bestIdx = 0, bestDot = -Infinity;
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
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(n1.dot(n2), -1, 1)));
}

window.navigateToFace = function (faceIdx) {
    const face = facesData[faceIdx];
    const radius = camera.position.length();
    animTarget = {
        position: face.normal.clone().multiplyScalar(radius),
        startPos: camera.position.clone(),
        startTarget: controls.target.clone(),
        endTarget: new THREE.Vector3(0, 0, 0),
        progress: 0,
    };
    controls.enableDamping = false;
};

window.resetCamera = function () {
    animTarget = {
        position: new THREE.Vector3(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z),
        startPos: camera.position.clone(),
        startTarget: controls.target.clone(),
        endTarget: new THREE.Vector3(0, 0, 0),
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
            label: other.label, family: other.family,
            angle: angleBetween(face.normal, other.normal), idx: i,
        });
    });
    entries.sort((a, b) => a.angle - b.angle);

    document.getElementById('angle-list').innerHTML = entries.map((e) => `
    <div class="angle-row" onclick="navigateToFace(${e.idx})">
      <span class="dot dot-${e.family}"></span>
      <span class="idx">${formatMillerIndexHTML(e.label)}</span>
      <span class="deg">${e.angle.toFixed(1)}°</span>
    </div>
  `).join('');
}

function onResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (animTarget) {
        animTarget.progress += 0.03;
        const t = Math.min(1, animTarget.progress);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camera.position.lerpVectors(animTarget.startPos, animTarget.position, ease);
        controls.target.lerpVectors(animTarget.startTarget, animTarget.endTarget, ease);
        camera.lookAt(controls.target);
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
