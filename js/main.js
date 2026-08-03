import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import {THEME_COLORS, PLANE_COLORS, REFERENCE_COLORS, DEFAULT_CAM} from './config.js';
import {translations, getPreferredLanguage, applyTranslations} from './i18n.js';
import {renderFormula, setupFormulaPopover, setupAngleCalcPopover, showAngleCalc, closeAngleCalc} from './formula.js';


const BASE_FOV = 40;

const settings = {
    theme: getPreferredTheme(),
    lang: getPreferredLanguage(),
};

let scene, camera, renderer, controls;
let facesData = [];
let currentRefIdx = -1;
let currentRefMode = null;
let faceMeshes = [];
let edgeLines = null;
let cubeData = null;
let referenceIdx = -1;

// Selection state
const selectedFaces = new Set();
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

// Gesture recognition
const LONG_PRESS_MS = 500;
const MOUSE_SLOP_SQ = 25;
const TOUCH_SLOP_SQ = 144;
let gesture = null;
let inputTouch = false;


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
    camera = new THREE.PerspectiveCamera(BASE_FOV, container.clientWidth / container.clientHeight, 0.1, 100);
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
    controls.minDistance = 6;
    controls.maxDistance = 25;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null,
    };

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    setInputMode(window.matchMedia('(pointer: coarse)').matches);

    // Build
    buildCube(cubeData);
    updateReferenceFace();
    updateAngleList();
    renderFormula();
    setupFormulaPopover();
    setupAngleCalcPopover();

    // Events
    new ResizeObserver(onResize).observe(container);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', endGesture);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (impressumOverlay().classList.contains('open')) closeImpressum();
        else if (selectedFaces.size > 0) clearSelection();
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

function applyLanguage(lang) {
    settings.lang = lang;
    applyTranslations(lang);

    const impBody = document.getElementById('impressum-body');
    if (impBody) impBody.innerHTML = translations[lang].impressum_html;

    // Force HUD re-render so reference-mode label gets correct translation
    currentRefIdx = -1;
    currentRefMode = null;
    if (facesData.length) {
        updateReferenceFace();
        updateAngleList();
    }
}

window.switchLanguage = function () {
    applyLanguage(settings.lang === 'de' ? 'en' : 'de');
};

// Impressum modal
const impressumOverlay = () => document.getElementById('impressum-overlay');

window.openImpressum = function () {
    impressumOverlay().classList.add('open');
};

function closeImpressum() {
    impressumOverlay().classList.remove('open');
}

window.closeImpressum = closeImpressum;

window.closeImpressumBackdrop = function (e) {
    if (e.target === impressumOverlay()) closeImpressum();
};

// Miller index labels
function createFaceTexture(label, family, isTriangle, isSelected, isReference, textCenter) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const tc = THEME_COLORS[settings.theme];

    if (isReference) ctx.fillStyle = REFERENCE_COLORS[settings.theme];
    else if (isSelected) ctx.fillStyle = PLANE_COLORS[settings.theme][family];
    else ctx.fillStyle = tc.faceColor;
    ctx.fillRect(0, 0, size, size);

    // Text
    const fontSize = isTriangle ? 38 : 48;
    ctx.font = `300 ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const highlighted = isSelected || isReference;
    const textColor = highlighted ? '#ffffff' : tc.textColor;
    ctx.globalAlpha = highlighted ? 1.0 : tc.faceTextAlpha;
    ctx.fillStyle = textColor;

    const tcu = textCenter ? textCenter.u : 0.5;
    const tcv = textCenter ? textCenter.v : 0.5;
    const cx = tcu * size;
    const cy = (1 - tcv) * size;
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
            ctx.strokeStyle = textColor;
            ctx.lineWidth = 2.65;
            ctx.beginPath();
            ctx.moveTo(x - w, cy + fontSize * 0.5);
            ctx.lineTo(x + w, cy + fontSize * 0.5);
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
    referenceIdx = selectedFaces.size > 0 ? selectedFaces.values().next().value : -1;
    faceMeshes.forEach((fm, idx) => {
        const isSelected = selectedFaces.has(idx);
        const isReference = idx === referenceIdx;
        if (fm.mesh.material.map) fm.mesh.material.map.dispose();
        fm.mesh.material.map = createFaceTexture(fm.label, fm.family, fm.isTriangle, isSelected, isReference, fm.textCenter);
        if (!isReference) {
            fm.mesh.material.emissive.setHex(0x000000);
            fm.mesh.material.emissiveIntensity = 1;
        }
        fm.mesh.material.needsUpdate = true;
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
    const uvs = pts.map((p) => ({
        u: pad + (1 - 2 * pad) * (p.x - mnX) / rX,
        v: pad + (1 - 2 * pad) * (p.y - mnY) / rY,
    }));

    // Geometric centroid of the face in UV space
    let cu = 0, cv = 0;
    uvs.forEach((p) => { cu += p.u; cv += p.v; });
    cu /= uvs.length;
    cv /= uvs.length;

    return { uvs, centroid: { u: cu, v: cv } };
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
        const { uvs, centroid: uvCentroid } = computeFaceUVs(uArr.map((i) => vertices[i]), n);
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

        const texture = createFaceTexture(face.label, face.family, isTriangle, false, false, uvCentroid);
        const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({
            map: texture,
            flatShading: true,
            side: THREE.DoubleSide,
        }));
        scene.add(mesh);
        faceMeshes.push({mesh, label: face.label, family: face.family, isTriangle, textCenter: uvCentroid});

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
        v < 0 ? '<span style="text-decoration:underline;text-underline-offset:0.14em">' + Math.abs(v) + '</span>' : '' + v
    ).join(' ') + ')';
}

function angleBetween(n1, n2) {
    // Use the absolute dot product so the angle is always <= 90 degrees
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(Math.abs(n1.dot(n2)), 0, 1)));
}

// Selection
function setInputMode(touch) {
    if (touch === inputTouch) return;
    inputTouch = touch;
    document.body.classList.toggle('input-touch', touch);
    if (facesData.length) updateAngleList();
}

function endGesture() {
    if (gesture && gesture.timer) clearTimeout(gesture.timer);
    gesture = null;
}

function onPointerDown(e) {
    const touch = e.pointerType !== 'mouse';
    setInputMode(touch);

    if (gesture) { endGesture(); return; }

    if (!touch && e.button !== 2) return;

    gesture = {id: e.pointerId, x: e.clientX, y: e.clientY, touch, longPress: false, timer: null};

    if (touch) {
        gesture.timer = setTimeout(() => {
            if (!gesture) return;
            gesture.longPress = true;
            navigator.vibrate?.(15);
            selectAt(gesture.x, gesture.y, true);
        }, LONG_PRESS_MS);
    }
}

function onPointerMove(e) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;

    if (dx * dx + dy * dy > (gesture.touch ? TOUCH_SLOP_SQ : MOUSE_SLOP_SQ)) endGesture();
}

function onPointerUp(e) {
    if (!gesture || gesture.id !== e.pointerId) return;
    const g = gesture;
    endGesture();
    if (g.longPress) return;  // already handled when the timer fired
    selectAt(e.clientX, e.clientY, !g.touch && e.shiftKey);
}

function selectAt(clientX, clientY, wholeFamily) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseNDC, camera);
    const meshes = faceMeshes.map(f => f.mesh);
    const hits = raycaster.intersectObjects(meshes, false);

    if (hits.length === 0) {
        if (selectedFaces.size > 0) clearSelection();
        return;
    }

    const idx = faceMeshes.findIndex(f => f.mesh === hits[0].object);
    if (idx < 0) return;

    if (wholeFamily) toggleFamily(idx);
    else toggleFace(idx);

    rebuildFaceTextures();
    updateReferenceFace();
    updateAngleList();
}

function toggleFace(idx) {
    if (selectedFaces.has(idx)) selectedFaces.delete(idx);
    else selectedFaces.add(idx);
}

function toggleFamily(clickedIdx) {
    const family = facesData[clickedIdx].family;
    const ids = facesData
        .map((f, i) => f.family === family ? i : -1)
        .filter(i => i >= 0);
    const allOn = ids.every(i => selectedFaces.has(i));
    if (allOn) {
        ids.forEach(i => selectedFaces.delete(i));
    } else {
        selectedFaces.add(clickedIdx);
        ids.forEach(i => selectedFaces.add(i));
    }
}

function clearSelection() {
    selectedFaces.clear();
    rebuildFaceTextures();
    updateReferenceFace();
    updateAngleList();
}

window.clearSelection = clearSelection;

window.openAngleCalc = function (e, refIdx, otherIdx) {
    e.stopPropagation();
    const ref = facesData[refIdx];
    const other = facesData[otherIdx];
    const header =
        `<span class="dot dot-${ref.family}"></span>` +
        `<span class="idx">${formatMillerIndexHTML(ref.label)}</span>` +
        `<span class="calc-sep">∠</span>` +
        `<span class="dot dot-${other.family}"></span>` +
        `<span class="idx">${formatMillerIndexHTML(other.label)}</span>`;
    showAngleCalc(e.currentTarget, header, ref.label, other.label);
};

function updateReferenceFace() {
    const faceEl = document.getElementById('current-face');

    if (selectedFaces.size === 0) {
        currentRefIdx = -1;
        currentRefMode = null;
        faceEl.style.display = 'none';
        return;
    }

    const idx = selectedFaces.values().next().value;
    if (idx === currentRefIdx && currentRefMode === 'selected') return;
    currentRefIdx = idx;
    currentRefMode = 'selected';
    faceEl.style.display = '';

    const face = facesData[idx];
    document.getElementById('facing-index').innerHTML = formatMillerIndexHTML(face.label);
    const familyEl = document.getElementById('facing-family');
    familyEl.textContent = '{' + face.family + '}';
    familyEl.className = 'family-tag family-' + face.family;
    document.getElementById('face-label').textContent = translations[settings.lang].reference;
}

function updateAngleList() {
    const listEl = document.getElementById('angle-list');
    const clearBtn = document.getElementById('clear-btn');
    const t = translations[settings.lang];

    const selected = Array.from(selectedFaces);

    // The selection changed, so any open calculation popover is now outdated
    closeAngleCalc();

    if (clearBtn) clearBtn.style.visibility = selected.length > 0 ? 'visible' : 'hidden';

    if (selected.length === 0) {
        listEl.innerHTML = `<div class="hint-msg">${inputTouch ? t.hint_empty_touch : t.hint_empty}</div>`;
        return;
    }

    if (selected.length === 1) {
        listEl.innerHTML = `<div class="hint-msg">${t.hint_single}</div>`;
        return;
    }

    // Angles from the reference plane (first selected)
    const refIdx = selected[0];
    const ref = facesData[refIdx];

    const others = selected.slice(1).map(i => ({
        idx: i,
        face: facesData[i],
        angle: angleBetween(ref.normal, facesData[i].normal),
    }));
    others.sort((a, b) => a.angle - b.angle);

    listEl.innerHTML = others.map(o => `
        <div class="angle-row" onclick="openAngleCalc(event, ${refIdx}, ${o.idx})">
            <span class="dot dot-${o.face.family}"></span>
            <span class="idx">${formatMillerIndexHTML(o.face.label)}</span>
            <span class="deg">${o.angle.toFixed(1)}°</span>
        </div>
    `).join('');
}

function onResize() {
    const container = document.getElementById('canvas-container');
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    const aspect = w / h;
    camera.fov = aspect >= 1
        ? BASE_FOV
        : THREE.MathUtils.radToDeg(
            2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV) / 2) / aspect));
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    // Gentle breathing glow on the reference plane so it stands out
    if (referenceIdx >= 0 && faceMeshes[referenceIdx]) {
        const mat = faceMeshes[referenceIdx].mesh.material;
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
        mat.emissive.set(REFERENCE_COLORS[settings.theme]);
        mat.emissiveIntensity = 0.15 + 0.33 * pulse;
    }

    renderer.render(scene, camera);
}

init().catch(console.error);
