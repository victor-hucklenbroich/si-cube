import {THEME_COLORS} from './config.js';

const STORAGE_KEY = 'theme';
const GLYPHS = {dark: '☽', light: '☀'};

const listeners = new Set();
let current = preferredTheme();

function preferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in THEME_COLORS) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getTheme() {
    return current;
}

export function themeColors() {
    return THEME_COLORS[current];
}

export function applyTheme(theme = current) {
    current = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    document.body.setAttribute('data-theme', theme);

    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = GLYPHS[theme];

    listeners.forEach((fn) => fn(theme));
}

export function toggleTheme() {
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

export function onThemeChange(fn) {
    listeners.add(fn);
}
