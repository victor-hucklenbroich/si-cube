export function formatMillerIndexHTML(hkl) {
    const digits = hkl.map((v) => v < 0
        ? `<span style="text-decoration:underline;text-underline-offset:0.14em">${Math.abs(v)}</span>`
        : String(v));
    return `(${digits.join(' ')})`;
}

export function angleBetween(hkl1, hkl2) {
    const dot = hkl1.reduce((sum, v, i) => sum + v * hkl2[i], 0);
    const lengths = Math.hypot(...hkl1) * Math.hypot(...hkl2);
    return Math.acos(Math.min(1, Math.abs(dot) / lengths)) * 180 / Math.PI;
}
