import * as THREE from 'three';

import {PLANE_COLORS, REFERENCE_COLORS} from './config.js';
import {getTheme, themeColors} from './theme.js';

const SIZE = 256;
const FONT_SIZE = {triangle: 38, quad: 48};

export function createFaceTexture(face, {selected = false, reference = false} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const colors = themeColors();

    if (reference) ctx.fillStyle = REFERENCE_COLORS[getTheme()];
    else if (selected) ctx.fillStyle = PLANE_COLORS[getTheme()][face.family];
    else ctx.fillStyle = colors.faceColor;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const highlighted = selected || reference;
    ctx.globalAlpha = highlighted ? 1.0 : colors.faceTextAlpha;
    drawLabel(ctx, face.label, {
        center: face.textCenter,
        fontSize: face.isTriangle ? FONT_SIZE.triangle : FONT_SIZE.quad,
        color: highlighted ? '#ffffff' : colors.textColor,
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

function drawLabel(ctx, label, {center, fontSize, color}) {
    ctx.font = `300 ${fontSize}px 'Helvetica Neue', 'Arial', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    const cx = center.u * SIZE;
    const cy = (1 - center.v) * SIZE;
    const spacing = fontSize * 0.55;
    const width = spacing * (label.length - 1);
    const startX = cx - width / 2;

    ctx.fillText('(', startX - fontSize * 0.45, cy);
    ctx.fillText(')', startX + width + fontSize * 0.45, cy);

    label.forEach((value, i) => {
        const digit = String(Math.abs(value));
        const x = startX + i * spacing;
        ctx.fillText(digit, x, cy);
        if (value < 0) drawBar(ctx, x, cy, ctx.measureText(digit).width / 2, fontSize);
    });
}

function drawBar(ctx, x, y, halfWidth, fontSize) {
    ctx.lineWidth = 2.65;
    ctx.beginPath();
    ctx.moveTo(x - halfWidth, y + fontSize * 0.5);
    ctx.lineTo(x + halfWidth, y + fontSize * 0.5);
    ctx.stroke();
}
