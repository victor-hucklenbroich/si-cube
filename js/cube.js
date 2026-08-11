import * as THREE from 'three';

import {REFERENCE_COLORS} from './config.js';
import {createFaceTexture} from './faceTexture.js';
import {getTheme, themeColors} from './theme.js';

const TRIANGLE_FAMILY = '111';
const UV_PADDING = 0.02;
const GLOW = {base: 0.15, amplitude: 0.33, speed: 0.004};

export function buildCube(data) {
    const faces = data.faces.map((face, index) => createFace(face, data.vertices, index));
    const edgeLines = createEdgeLines(data);

    const group = new THREE.Group();
    faces.forEach((face) => group.add(face.mesh));
    group.add(edgeLines);

    function refreshTextures(selection) {
        const referenceIdx = selection.referenceIndex();
        faces.forEach((face, idx) => {
            const reference = idx === referenceIdx;
            const material = face.mesh.material;
            material.map?.dispose();
            material.map = createFaceTexture(face, {selected: selection.has(idx), reference});
            if (!reference) {
                material.emissive.setHex(0x000000);
                material.emissiveIntensity = 1;
            }
            material.needsUpdate = true;
        });
    }

    function applyTheme(selection) {
        edgeLines.material.color.set(themeColors().edgeColor);
        refreshTextures(selection);
    }

    // Gentle breathing glow so the reference plane stands out
    function pulseReference(selection) {
        const face = faces[selection.referenceIndex()];
        if (!face) return;
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * GLOW.speed);
        face.mesh.material.emissive.set(REFERENCE_COLORS[getTheme()]);
        face.mesh.material.emissiveIntensity = GLOW.base + GLOW.amplitude * pulse;
    }

    return {group, faces, refreshTextures, applyTheme, pulseReference};
}

function createFace(face, vertices, index) {
    const corners = uniqueVertexIndices(face.triangles);
    const {uvs, centroid} = computeFaceUVs(corners.map((i) => vertices[i]), face.normal);
    const uvByVertex = new Map(corners.map((vertexIdx, i) => [vertexIdx, uvs[i]]));

    const record = {
        label: face.label,
        family: face.family,
        isTriangle: face.family === TRIANGLE_FAMILY,
        textCenter: centroid,
    };

    record.mesh = new THREE.Mesh(
        createFaceGeometry(face, vertices, uvByVertex),
        new THREE.MeshPhongMaterial({
            map: createFaceTexture(record),
            flatShading: true,
            side: THREE.DoubleSide,
        }),
    );
    record.mesh.userData.faceIndex = index;
    return record;
}

function createFaceGeometry(face, vertices, uvByVertex) {
    const positions = [], normals = [], uvs = [];
    face.triangles.forEach((triangle) => {
        triangle.forEach((vertexIdx) => {
            const uv = uvByVertex.get(vertexIdx);
            positions.push(...vertices[vertexIdx]);
            normals.push(...face.normal);
            uvs.push(uv.u, uv.v);
        });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return geometry;
}

function createEdgeLines(data) {
    const positions = [];
    data.faces.forEach((face) => {
        boundaryEdges(face.triangles).forEach(([a, b]) => {
            positions.push(...data.vertices[a], ...data.vertices[b]);
        });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
        color: themeColors().edgeColor,
    }));
}

// Edges shared by two triangles lie inside the plane; the rest form its outline
function boundaryEdges(triangles) {
    const counts = new Map();
    triangles.forEach((triangle) => {
        for (let i = 0; i < 3; i++) {
            const a = triangle[i], b = triangle[(i + 1) % 3];
            const key = `${Math.min(a, b)},${Math.max(a, b)}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    });

    return Array.from(counts)
        .filter(([, count]) => count === 1)
        .map(([key]) => key.split(',').map(Number));
}

function uniqueVertexIndices(triangles) {
    return Array.from(new Set(triangles.flat()));
}

function computeFaceUVs(corners, normal) {
    const n = new THREE.Vector3(...normal).normalize();
    const u = new THREE.Vector3();
    if (Math.abs(n.x) < 0.9) u.crossVectors(n, new THREE.Vector3(1, 0, 0));
    else u.crossVectors(n, new THREE.Vector3(0, 1, 0));
    u.normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();

    const points = corners.map((corner) => {
        const p = new THREE.Vector3(...corner);
        return {x: p.dot(u), y: p.dot(v)};
    });

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const rangeX = Math.max(...xs) - minX || 1;
    const rangeY = Math.max(...ys) - minY || 1;
    const scale = 1 - 2 * UV_PADDING;

    const uvs = points.map((p) => ({
        u: UV_PADDING + scale * (p.x - minX) / rangeX,
        v: UV_PADDING + scale * (p.y - minY) / rangeY,
    }));

    return {uvs, centroid: centroidOf(uvs)};
}

function centroidOf(uvs) {
    const sum = uvs.reduce((acc, p) => ({u: acc.u + p.u, v: acc.v + p.v}), {u: 0, v: 0});
    return {u: sum.u / uvs.length, v: sum.v / uvs.length};
}
