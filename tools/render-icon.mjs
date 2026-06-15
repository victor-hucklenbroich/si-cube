// Generates assets/favicon.svg by projecting the real cube geometry
// (data/cube.json) through the same camera the live renderer uses, so the icon
// shows the cube from the app's default viewing angle.
//
//   node tools/render-icon.mjs


import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cube = JSON.parse(readFileSync(join(root, 'data/cube.json'), 'utf8'));

// --- Camera ---
const CAM = [3.8, 2.5, 3.8];
const TARGET = [0, 0, 0];
const UP = [0, 1, 0];
const FOV_Y = 40;
const FAMILY_COLORS = {'100': '#14b8a6', '110': '#f97316', '111': '#8b5cf6'};
const SIDE = 64, PAD = 5, STROKE = '#0b1220', STROKE_W = 1.1;

// --- tiny vec3 helpers ---
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// View basis
const zAxis = norm(sub(CAM, TARGET));
const xAxis = norm(cross(UP, zAxis));
const yAxis = cross(zAxis, xAxis);
const f = 1 / Math.tan((FOV_Y / 2) * Math.PI / 180);

// World point
function project(p) {
    const d = sub(p, CAM);
    const cx = dot(d, xAxis), cy = dot(d, yAxis), cz = dot(d, zAxis);
    const depth = -cz;
    return {x: f * cx / depth, y: -f * cy / depth, depth};
}

function orderRing(indices, centroid, normal) {
    const n = norm(normal);
    let u = cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]);
    u = norm(u);
    const v = cross(n, u);
    return [...indices].sort((ia, ib) => {
        const a = sub(cube.vertices[ia], centroid), b = sub(cube.vertices[ib], centroid);
        return Math.atan2(dot(a, v), dot(a, u)) - Math.atan2(dot(b, v), dot(b, u));
    });
}

// Build the visible faces
const faces = [];
for (const face of cube.faces) {
    if (dot(face.normal, sub(CAM, face.centroid)) <= 1e-6) continue;
    const idx = [...new Set(face.triangles.flat())];
    const ring = orderRing(idx, face.centroid, face.normal);
    const pts = ring.map((i) => project(cube.vertices[i]));
    const depth = project(face.centroid).depth;
    faces.push({family: face.family, pts, depth});
}

// Fit projected geometry into the viewBox with padding
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const fc of faces) for (const p of fc.pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
}
const scale = (SIDE - 2 * PAD) / Math.max(maxX - minX, maxY - minY);
const offX = PAD + ((SIDE - 2 * PAD) - (maxX - minX) * scale) / 2 - minX * scale;
const offY = PAD + ((SIDE - 2 * PAD) - (maxY - minY) * scale) / 2 - minY * scale;
const sx = (x) => +(x * scale + offX).toFixed(2);
const sy = (y) => +(y * scale + offY).toFixed(2);

// Painter order
faces.sort((a, b) => b.depth - a.depth);

const paths = faces.map((fc) => {
    const d = fc.pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)} ${sy(p.y)}`).join(' ') + ' Z';
    return `    <path d="${d}" fill="${FAMILY_COLORS[fc.family]}"/>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIDE} ${SIDE}" width="${SIDE}" height="${SIDE}">
  <title>Si Cube</title>
  <g stroke="${STROKE}" stroke-width="${STROKE_W}" stroke-linejoin="round" stroke-linecap="round">
${paths}
  </g>
</svg>
`;

mkdirSync(join(root, 'assets'), {recursive: true});
writeFileSync(join(root, 'assets/favicon.svg'), svg);
console.log('Generated assets/favicon.svg');
