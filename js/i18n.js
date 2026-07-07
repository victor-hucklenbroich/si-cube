
export const translations = {
    de: {
        page: "Silizium Würfel · TUM MW0080",
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
        impressum: "Impressum",
        impressum_html: `
            <p class="imp-label">Angaben gemäß § 5 DDG</p>
            <p>Victor Hucklenbroich<br>München</p>
            <p class="imp-label">Kontakt</p>
            <p>E-Mail: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>
            <p class="imp-label">Code</p>
            <p>GitHub: <a href="https://github.com/victor-hucklenbroich/si-cube">victor-hucklenbroich/si-cube</a></p>
            <p class="imp-disclaimer">Dies ist ein unabhängiges, nicht-kommerzielles, open-source Studierendenprojekt, welches in keiner offiziellen Verbindung zur Technischen Universität München (TUM) steht und weder von ihr betrieben noch unterstützt wird.</p>`,
    },
    en: {
        page: "Silicon Cube · TUM MW0080",
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
        impressum: "Imprint",
        impressum_html: `
            <p class="imp-label">Information pursuant to § 5 DDG</p>
            <p>Victor Hucklenbroich<br>Munich</p>
            <p class="imp-label">Contact</p>
            <p>Email: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>
            <p class="imp-label">Source Code</p>
            <p>GitHub: <a href="https://github.com/victor-hucklenbroich/si-cube">victor-hucklenbroich/si-cube</a></p>
            <p class="imp-disclaimer">This is an independent, non-commercial, open-source student project, which is not officially affiliated with, endorsed by, or operated by the Technical University of Munich (TUM).</p>`,
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
