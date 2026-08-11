import * as THREE from 'three';

export function formatMillerIndexHTML(hkl) {
    const digits = hkl.map((v) => v < 0
        ? `<span style="text-decoration:underline;text-underline-offset:0.14em">${Math.abs(v)}</span>`
        : String(v));
    return `(${digits.join(' ')})`;
}

export function angleBetween(n1, n2) {
    return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(Math.abs(n1.dot(n2)), 0, 1)));
}
