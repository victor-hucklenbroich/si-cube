
export const translations = {
    de: {
        page: "Silizium Würfel",
        title: "Si Kristallebenen",
        subtitle: "Millersche Indizes",
        angles: "WINKEL",
        rotate: "Drehen",
        reference: "Referenzebene",
        select: "Auswählen",
        zoom: "Zoom",
        hint_empty: "Rechtsklick auf eine Ebene (•••) um diese auszuwählen. Shift+Rechtsklick wählt alle äquialenten Ebenen {•••} aus.",
        hint_single: "Wähle eine weitere Ebene, um dessen Winkel zu vergleichen.",
        formula_plane1: "Indizes Ebene 1",
        formula_plane2: "Indizes Ebene 2",
    },
    en: {
        page: "Silicon Cube",
        title: "Si Crystal Planes",
        subtitle: "Miller Indices",
        angles: "ANGLES",
        rotate: "Rotate",
        reference: "Reference Plane",
        select: "Select",
        zoom: "Zoom",
        hint_empty: "Right-click a plane (•••) to select. Shift+right-click selects all equivalent planes {•••}.",
        hint_single: "Select another plane to compare their angles.",
        formula_plane1: "indices of plane 1",
        formula_plane2: "indices of plane 2",
    },
};

export function getPreferredLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
    return navigator.language.startsWith('de') ? 'de' : 'en';
}

export function applyTranslations(lang) {
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });

    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = lang === 'de' ? 'DE' : 'EN';
}
