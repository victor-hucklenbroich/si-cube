
export const translations = {
    de: {
        page: "Silizium Würfel · TUM MW0080",
        title: "Silizium Würfel",
        subtitle: "Millersche Indizes",
        angles: "WINKEL",
        reference: "Referenzebene",
        hint_empty: "Rechtsklick auf eine Ebene des Würfels, um zu starten.",
        hint_empty_touch: "Tippe auf eine Ebene des Würfels, um zu starten.",
        hint_single: "Wähle eine weitere Ebene, um dessen Winkel zu vergleichen.",
        formula_plane1: "Indizes Ebene 1",
        formula_plane2: "Indizes Ebene 2",
        tutorial_button: "Tutorial",
        tutorial_skip: "Überspringen",
        tutorial_back: "Zurück",
        tutorial_next: "Weiter",
        tutorial_done: "Fertig",
        tutorial_cube_title: "Der Silizium-Würfel",
        tutorial_cube_body: "Jede Fläche ist eine Kristallebene, beschriftet mit ihrem Millerschen Index: 6 Würfelflächen {100}, 12 Kantenschnitte {110} und 8 Eckschnitte {111}. Die Farben entsprechen der Legende unten im Panel.",
        tutorial_view_title: "Drehen und Zoomen",
        tutorial_view_body: "<kbd>Ziehen (Linksklick)</kbd> dreht den Würfel, <kbd>Scrollen</kbd> zoomt hinein und heraus.",
        tutorial_view_body_touch: "<kbd>Ziehen</kbd> dreht den Würfel, <kbd>zwei Finger</kbd> zoomen hinein und heraus.",
        tutorial_reference_title: "Die Referenzebene",
        tutorial_reference_body: "<kbd>Rechtsklick</kbd> wählt eine Ebene aus. Die erste ausgewählte Ebene wird zur Referenz. Alle Winkel beziehen sich auf sie.",
        tutorial_reference_body_touch: "<kbd>Tippen</kbd> wählt eine Ebene aus. Die erste ausgewählte Ebene wird zur Referenz. Alle Winkel beziehen sich auf sie.",
        tutorial_angles_title: "Winkel zur Referenz",
        tutorial_angles_body: "Jede weitere ausgewählte Ebene erscheint mit ihrem Winkel zur Referenz. Angegeben wird immer der spitze Winkel zwischen beiden Ebenen, also nie mehr als 90°.",
        tutorial_family_title: "Äquivalente Ebenen",
        tutorial_family_body: "<kbd>Shift + Rechtsklick</kbd> oder <kbd>Rechtsklick</kbd> gedrückt halten wählt alle äquivalenten Ebenen {•••} auf einmal aus.",
        tutorial_family_body_touch: "<kbd>Langes Drücken</kbd> wählt alle äquivalenten Ebenen {•••} auf einmal aus.",
        tutorial_calc_title: "Rechenweg anzeigen",
        tutorial_calc_body: "Ein Klick auf einen Winkel zeigt Schritt für Schritt, wie er berechnet wurde. Das <kbd>i</kbd> zeigt die allgemeine Formel.",
        tutorial_calc_body_touch: "Ein Tippen auf einen Winkel zeigt Schritt für Schritt, wie er berechnet wurde. Das <kbd>i</kbd> zeigt die allgemeine Formel.",
        tutorial_controls_title: "Zurücksetzen",
        tutorial_controls_body: "<kbd>Esc</kbd>, das <kbd>×</kbd> im Panel oder ein <kbd>Rechtsklick</kbd> ins Leere löscht die Auswahl.",
        tutorial_controls_body_touch: "Das <kbd>×</kbd> im Panel oder ein <kbd>Tippen</kbd> ins Leere löscht die Auswahl.",
        tutorial_settings_title: "Einstellungen",
        tutorial_settings_body: "Hier können Einstellung gewählt und dieses Tutorial jederzeit erneut abgespielt werden.",
        impressum: "Impressum",
        impressum_html: `
            <p class="legal-label">Angaben gemäß § 5 DDG</p>
            <p>Victor Hucklenbroich<br>München</p>
            <p class="legal-label">Kontakt</p>
            <p>E-Mail: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>
            <p class="legal-label">Code</p>
            <p>GitHub: <a href="https://github.com/victor-hucklenbroich/si-cube">victor-hucklenbroich/si-cube</a></p>
            <p class="legal-disclaimer">Dies ist ein unabhängiges, nicht-kommerzielles, open-source Studierendenprojekt, welches in keiner offiziellen Verbindung zur Technischen Universität München (TUM) steht und weder von ihr betrieben noch unterstützt wird.</p>`,
        privacy: "Datenschutz",
        privacy_html: `
            <p class="legal-label">Verantwortlicher</p>
            <p>Victor Hucklenbroich, München<br>E-Mail: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>

            <p class="legal-label">Überblick</p>
            <p>Diese Seite ist eine rein statische Web-Anwendung. Es gibt keine Benutzerkonten, keine Formulare, keine Cookies und kein seitenübergreifendes Tracking. Sämtliche Berechnungen laufen ausschließlich in Ihrem Browser. Ihre Auswahl von Ebenen und die daraus berechneten Winkel werden zu keinem Zeitpunkt an einen Server übertragen.</p>

            <p class="legal-label">Einstellungen auf Ihrem Gerät</p>
            <p>Ihre Auswahl von Farbschema (hell/dunkel) und Sprache (DE/EN) sowie ein Vermerk darüber, dass die Einführungstour bereits angezeigt wurde, werden lokal in Ihrem Browser gespeichert (<code>localStorage</code>), damit sie beim nächsten Besuch erhalten bleiben. Diese Werte verlassen Ihr Gerät nicht und enthalten keine Kennungen oder personenbezogenen Daten. Die Speicherung ist für die von Ihnen ausdrücklich gewünschte Funktion unbedingt erforderlich und daher nach § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei. Sie können sie jederzeit über die Website-Daten Ihres Browsers löschen.</p>

            <p class="legal-label">Hosting</p>
            <p>Die Seite wird über GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) ausgeliefert. Beim Abruf verarbeitet GitHub technisch notwendige Server-Logdaten, insbesondere IP-Adresse, Datum und Uhrzeit, die abgerufene Datei sowie den User-Agent. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und effizienten Bereitstellung des Angebots). GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.</p>

            <p class="legal-label">Externe Ressourcen</p>
            <p>Beim Aufruf der Seite werden Schriftarten und Programmbibliotheken von externen Servern nachgeladen. Dabei wird Ihre IP-Adresse technisch bedingt an den jeweiligen Anbieter übertragen:</p>
            <ul>
                <li>Google Fonts (Google Ireland Limited, Irland; Google LLC, USA) &ndash; Schriftarten</li>
                <li>unpkg (Cloudflare, Inc., USA) &ndash; 3D-Bibliothek <em>three.js</em></li>
                <li>jsDelivr (Prospect One, Polen) &ndash; Formelsatz <em>KaTeX</em></li>
            </ul>
            <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer performanten und einheitlichen Darstellung des Angebots).</p>
            
            <p class="legal-label">Reichweitenmessung</p>
            <p>Zur Messung der Seitenaufrufe wird Cloudflare Web Analytics (Cloudflare, Inc., USA) eingesetzt. Der Dienst arbeitet ohne Cookies, ohne Speicherung auf Ihrem Endgerät und ohne Fingerprinting und bildet keine geräteübergreifenden Nutzerprofile. Ihre IP-Adresse wird zur Erstellung aggregierter Statistiken verarbeitet und nicht dauerhaft gespeichert. Da nicht auf Informationen in Ihrem Endgerät zugegriffen wird, ist keine Einwilligung nach § 25 TDDDG erforderlich; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der statistischen Auswertung der Nutzung). Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert.</p>

            <p class="legal-label">Kontakt per E-Mail</p>
            <p>Wenn Sie mich per E-Mail kontaktieren, verarbeite ich Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden gelöscht, sobald sie hierfür nicht mehr erforderlich sind.</p>

            <p class="legal-label">Ihre Rechte</p>
            <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20) sowie ein Widerspruchsrecht gegen Verarbeitungen, die auf berechtigten Interessen beruhen (Art. 21 DSGVO). Wenden Sie sich hierfür an die oben genannte E-Mail-Adresse.</p>
            <p>Ihnen steht zudem ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu, für dieses Angebot etwa beim Bayerischen Landesamt für Datenschutzaufsicht (BayLDA), Promenade 27, 91522 Ansbach.</p>

            <p class="legal-disclaimer">Stand: August 2026</p>`,
    },
    en: {
        page: "Silicon Cube · TUM MW0080",
        title: "Silicon Cube",
        subtitle: "Miller Indices",
        angles: "ANGLES",
        reference: "Reference Plane",
        hint_empty: "Right-click a plane on the cube to get started.",
        hint_empty_touch: "Tap a plane on the cube to get started.",
        hint_single: "Select another plane to compare their angles.",
        formula_plane1: "indices of plane 1",
        formula_plane2: "indices of plane 2",
        tutorial_button: "Tutorial",
        tutorial_skip: "Skip",
        tutorial_back: "Back",
        tutorial_next: "Next",
        tutorial_done: "Done",
        tutorial_cube_title: "The silicon cube",
        tutorial_cube_body: "Every face is a crystal plane, labelled with its Miller index: 6 cube faces {100}, 12 edge cuts {110} and 8 corner cuts {111}. The colours match the legend at the bottom of the panel.",
        tutorial_view_title: "Rotate and zoom",
        tutorial_view_body: "<kbd>Drag (left-click)</kbd> anywhere to orbit around the cube, <kbd>scroll</kbd> to zoom in and out.",
        tutorial_view_body_touch: "<kbd>Drag</kbd> anywhere to orbit around the cube, <kbd>pinch</kbd> to zoom in and out.",
        tutorial_reference_title: "The reference plane",
        tutorial_reference_body: "<kbd>Right-click</kbd> a plane to select it. The first plane you pick becomes the reference. Every angle is measured against it.",
        tutorial_reference_body_touch: "<kbd>Tap</kbd> a plane to select it. The first plane you pick becomes the reference. Every angle is measured against it.",
        tutorial_angles_title: "Angles to the reference",
        tutorial_angles_body: "Every further plane you select is listed with its angle to the reference. It is always the acute angle between the two planes, so it never exceeds 90°.",
        tutorial_family_title: "Equivalent Planes",
        tutorial_family_body: "<kbd>Shift + right-click</kbd> or holding <kbd>right-click</kbd> selects every equivalent plane {•••}.",
        tutorial_family_body_touch: "<kbd>Long-press</kbd> selects every equivalent plane {•••}.",
        tutorial_calc_title: "Show the calculation",
        tutorial_calc_body: "Click any angle to see how it was calculated, step by step. The <kbd>i</kbd> shows the general formula.",
        tutorial_calc_body_touch: "Tap any angle to see how it was calculated, step by step. The <kbd>i</kbd> shows the general formula.",
        tutorial_controls_title: "Clearing",
        tutorial_controls_body: "<kbd>Esc</kbd>, the <kbd>×</kbd> in the panel or a <kbd>right-click</kbd> into empty space clears the selection.",
        tutorial_controls_body_touch: "The <kbd>×</kbd> in the panel or a <kbd>tap</kbd> into empty space clears the selection.",
        tutorial_settings_title: "Settings",
        tutorial_settings_body: "Here you can pick settings, and replay this tutorial at any time.",
        impressum: "Imprint",
        impressum_html: `
            <p class="legal-label">Information pursuant to § 5 DDG</p>
            <p>Victor Hucklenbroich<br>Munich</p>
            <p class="legal-label">Contact</p>
            <p>Email: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>
            <p class="legal-label">Source Code</p>
            <p>GitHub: <a href="https://github.com/victor-hucklenbroich/si-cube">victor-hucklenbroich/si-cube</a></p>
            <p class="legal-disclaimer">This is an independent, non-commercial, open-source student project, which is not officially affiliated with, endorsed by, or operated by the Technical University of Munich (TUM).</p>`,
        privacy: "Privacy",
        privacy_html: `
            <p class="legal-label">Controller</p>
            <p>Victor Hucklenbroich, Munich, Germany<br>Email: <a href="mailto:victor.hucklenbroich@tum.de">victor.hucklenbroich@tum.de</a></p>

            <p class="legal-label">Overview</p>
            <p>This site is a purely static web application. There are no user accounts, no forms, no cookies and no cross-site tracking. All calculations run entirely in your browser. The planes you select and the angles derived from them are never transmitted to any server.</p>

            <p class="legal-label">Settings stored on your device</p>
            <p>Your choice of colour scheme (light/dark) and language (DE/EN), together with a note that the introductory tour has already been shown, are stored locally in your browser (<code>localStorage</code>) so that they persist across visits. These values never leave your device and contain no identifiers or personal data. Storing them is strictly necessary to provide a feature you explicitly requested and therefore requires no consent under § 25(2) no. 2 TDDDG. You can delete them at any time via your browser's site data settings.</p>

            <p class="legal-label">Hosting</p>
            <p>This site is served by GitHub Pages (GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA). When you access it, GitHub processes technically necessary server log data, in particular your IP address, the date and time, the file requested and the user agent. The legal basis is Art. 6(1)(f) GDPR (legitimate interest in providing the site securely and efficiently). GitHub is certified under the EU-US Data Privacy Framework.</p>

            <p class="legal-label">External resources</p>
            <p>When the page loads, fonts and software libraries are fetched from external servers. This necessarily transmits your IP address to the respective provider:</p>
            <ul>
                <li>Google Fonts (Google Ireland Limited, Ireland; Google LLC, USA) &ndash; typefaces</li>
                <li>unpkg (Cloudflare, Inc., USA) &ndash; the <em>three.js</em> 3D library</li>
                <li>jsDelivr (Prospect One, Poland) &ndash; the <em>KaTeX</em> formula renderer</li>
            </ul>
            <p>The legal basis is Art. 6(1)(f) GDPR (legitimate interest in fast and consistent presentation of the site).</p>
            
            <p class="legal-label">Analytics</p>
            <p>Cloudflare Web Analytics (Cloudflare, Inc., USA) is used to count page views. The service works without cookies, without storing anything on your device and without fingerprinting, and it does not build cross-device user profiles. Your IP address is processed to generate aggregate statistics and is not stored permanently. Because no information is accessed on your device, no consent is required under § 25 TDDDG; the legal basis is Art. 6(1)(f) GDPR (legitimate interest in statistical analysis of usage). Cloudflare is certified under the EU-US Data Privacy Framework.</p>

            <p class="legal-label">Contact by email</p>
            <p>If you contact me by email, I process the information you provide solely in order to handle your enquiry (Art. 6(1)(f) GDPR). The data is deleted once it is no longer required for that purpose.</p>

            <p class="legal-label">Your rights</p>
            <p>You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and data portability (Art. 20), as well as the right to object to processing based on legitimate interests (Art. 21 GDPR). To exercise them, please use the email address above.</p>
            <p>You also have the right to lodge a complaint with a data protection supervisory authority, for this site the Bavarian Data Protection Authority (BayLDA), Promenade 27, 91522 Ansbach, Germany.</p>

            <p class="legal-disclaimer">Last updated: August 2026</p>`,
    },
};

const STORAGE_KEY = 'lang';

const listeners = new Set();
let current = preferredLanguage();

function preferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved in translations) return saved;
    return navigator.language.startsWith('de') ? 'de' : 'en';
}

export function t() {
    return translations[current];
}

export function applyLanguage(lang = current) {
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const text = translations[lang][el.getAttribute('data-i18n')];
        if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const text = translations[lang][el.getAttribute('data-i18n-title')];
        if (text) el.title = text;
    });

    const btn = document.getElementById('btn-lang');
    if (btn) btn.textContent = lang.toUpperCase();

    listeners.forEach((fn) => fn(lang));
}

export function toggleLanguage() {
    applyLanguage(current === 'de' ? 'en' : 'de');
}

export function onLanguageChange(fn) {
    listeners.add(fn);
}
