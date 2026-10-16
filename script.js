'use strict';

/* =========================================================
   CASE FILE 11:59
   A murder mystery for Detective Kriti, then the birthday reveal.
   ========================================================= */

/* ---------- Personal text: edit these ---------- */
const CONFIG = {
    detective: 'Kriti',

    // Shown under "Welcome to your 30s, Detective Kriti."
    welcomeLine: "It's gonna be an amazing adventure.",

    /* ---------- Game settings ---------- */
    vaultCode: '3010',
    cipherShift: 11,
    photoCount: 16,
    photoPath: n => `photos/photo${n}.jpeg`,
    suspectPhoto: id => `photos/suspects/${id}.jpeg`,
    videoSrc: 'videos/compilation.mp4'
};

/* ---------- Small helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function seeded(seed){
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/* ---------- Save state ---------- */
const SAVE_KEY = 'casefile-1159-game';
const freshState = () => ({
    stage: 'cover',
    found: [],
    broken: [],
    hintsLeft: 3,
    hintStep: {},
    mistakes: 0,
    boardFails: 0,
    board: { slots: [null, null, null, null, null, null], links: {}, solved: false },
    decoded: false,
    briefed: {}
});
let S = freshState();

function save(){
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}
function load(){
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw){
            const data = JSON.parse(raw);
            S = Object.assign(freshState(), data);
            S.board = Object.assign(freshState().board, data.board || {});
        }
    } catch (e) { S = freshState(); }
}
function resetSave(){
    S = freshState();
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

/* =========================================================
   ART (original drawings, no external images)
   ========================================================= */
let artId = 0;
const ART = {};

ART.watch = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M57 23 q22 -9 30 10" fill="none" stroke="#b8923f" stroke-width="2.5" stroke-dasharray="4 3"/><rect x="44" y="17" width="12" height="9" rx="2" fill="#c9a24a"/><circle cx="50" cy="56" r="29" fill="#1c1912" stroke="#d8b25a" stroke-width="4.5"/><circle cx="50" cy="56" r="23" fill="none" stroke="#6b5a35" stroke-width="1"/><path d="M50 33 v5 M73 56 h-5 M50 79 v-5 M27 56 h5" stroke="#a58b52" stroke-width="2"/><path d="M50 56 L47.5 41" stroke="#efe3c2" stroke-width="4" stroke-linecap="round"/><path d="M50 56 L48 33" stroke="#efe3c2" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="56" r="3" fill="#d8b25a"/></svg>`;

ART.vial = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="41" y="10" width="18" height="10" rx="2" fill="#7a5a2a"/><path d="M43 20 h14 v18 l13 32 a10 10 0 0 1 -9 14 H39 a10 10 0 0 1 -9 -14 l13 -32 z" fill="rgba(150,200,190,.14)" stroke="#cfe0d8" stroke-width="3"/><path d="M34 78 q16 7 32 0 l2 5 q-18 7 -36 0 z" fill="#5a4026"/><path d="M40 52 h20 v11 l-5 -3 -4 4 -4 -3 -7 3 z" fill="#d9c9a0"/></svg>`;

ART.goblet = `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="66" cy="78" rx="26" ry="7" fill="#c46a1f" opacity=".75"/><g transform="rotate(-72 50 55)"><path d="M33 22 h34 l-5 27 a12 12 0 0 1 -24 0 z" fill="#2a2416" stroke="#c9a24a" stroke-width="3"/><rect x="47" y="60" width="6" height="16" fill="#c9a24a"/><rect x="37" y="76" width="26" height="5" rx="2" fill="#c9a24a"/></g></svg>`;

ART.parchment = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M20 20 h52 l8 8 v50 l-6 -3 -5 4 -6 -3 -5 4 -6 -3 -5 4 -6 -3 -5 4 -6 -3 -5 3 z" fill="#d9c9a0" stroke="#5e4320" stroke-width="2"/><path d="M28 34 h40 M28 44 h34 M28 54 h38" stroke="#5e4320" stroke-width="2.5" stroke-dasharray="3 2"/><circle cx="64" cy="66" r="7" fill="none" stroke="#9e1f29" stroke-width="2.5"/></svg>`;

ART.broom = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 92 L52 40" stroke="#6b4f2a" stroke-width="5" stroke-linecap="round"/><path d="M56 34 L68 8" stroke="#6b4f2a" stroke-width="5" stroke-linecap="round"/><path d="M52 40 l3 -3 l2 2 l-1 -5" stroke="#6b4f2a" stroke-width="2" fill="none"/><path d="M30 92 l-12 6 M30 92 l-6 8 M30 92 l2 8 M30 92 l-14 1" stroke="#8a7350" stroke-width="2.5"/><path d="M60 30 q8 -6 14 -2 M58 26 q10 -2 12 6" stroke="#9aa3b5" stroke-width="1" fill="none" opacity=".7"/></svg>`;

ART.feather = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M78 12 C44 26 26 58 22 90 C46 72 70 46 78 12 z" fill="#11131b" stroke="#8d8aa0" stroke-width="2"/><path d="M78 12 L24 88" stroke="#5a586a" stroke-width="1.5"/></svg>`;

ART.prints = (() => {
    const steps = [[42,200,1],[60,182,1],[40,160,.95],[58,140,.9],[40,120,.85],[56,100,.8],[42,80,.75],[54,62,.7],[44,44,.65],[52,28,.6]];
    const boots = steps.map(([x, y, s], i) =>
        `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="8" ry="13" fill="#cfc6b0" opacity=".7"/><ellipse cx="0" cy="15" rx="6" ry="5" fill="#cfc6b0" opacity=".7"/>${i % 3 === 0 ? '<g fill="#fff"><circle cx="-3" cy="-4" r="1.5"/><circle cx="3" cy="2" r="1.3"/><circle cx="-1" cy="6" r="1.2"/></g>' : ''}</g>`
    ).join('');
    return `<svg viewBox="0 0 100 220" aria-hidden="true">${boots}</svg>`;
})();

ART.fang = `<svg viewBox="0 0 120 100" aria-hidden="true"><path class="fang-tail" d="M24 72 C10 68 4 54 10 44" fill="none" stroke="#2e2c28" stroke-width="7" stroke-linecap="round"/><path d="M24 94 C18 72 26 54 44 48 C58 44 70 46 76 38 L80 24 C82 16 92 14 98 20 L108 28 C112 32 110 38 104 38 L94 40 C92 52 90 64 86 76 L88 94 Z" fill="#0d0f15" stroke="#5d5a52" stroke-width="1.5"/><path d="M86 18 L82 5 L93 13 Z" fill="#0d0f15" stroke="#5d5a52" stroke-width="1.2"/><circle cx="96" cy="26" r="2.2" fill="#c9a24a"/></svg>`;

ART.puddle = `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="62" rx="44" ry="20" fill="#121a29" stroke="#4a5a78" stroke-width="2"/><g transform="translate(50 62) scale(1 -.5)"><circle r="24" fill="#1b2130" stroke="#d8b25a" stroke-width="3"/><path d="M0 0 L-2 -14" stroke="#efe3c2" stroke-width="3.5" stroke-linecap="round"/><path d="M0 0 L-2 -20" stroke="#efe3c2" stroke-width="2" stroke-linecap="round"/><path d="M-16 -22 L4 -6" stroke="#8d6a3a" stroke-width="3" stroke-linecap="round"/></g></svg>`;

ART.feather_pip = `<svg viewBox="0 0 10 18" aria-hidden="true"><path d="M5 0 C9.5 5 9.5 12 5 18 C.5 12 .5 5 5 0 Z" fill="#f1cf7a"/><path d="M5 2 V18" stroke="#6b4f1e" stroke-width=".8"/></svg>`;

ART.courtyard = `<svg class="scene-art" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true">
<defs>
<linearGradient id="cy-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b111e"/><stop offset="1" stop-color="#1c2537"/></linearGradient>
<linearGradient id="cy-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3547"/><stop offset="1" stop-color="#151a25"/></linearGradient>
<linearGradient id="cy-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#252d3c"/><stop offset="1" stop-color="#0c1018"/></linearGradient>
<radialGradient id="cy-moon"><stop offset="0" stop-color="#e8e2c8" stop-opacity=".45"/><stop offset="1" stop-color="#e8e2c8" stop-opacity="0"/></radialGradient>
<linearGradient id="cy-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb0c8" stop-opacity=".18"/><stop offset=".5" stop-color="#9fb0c8" stop-opacity="0"/><stop offset="1" stop-color="#9fb0c8" stop-opacity=".1"/></linearGradient>
<clipPath id="cy-puddle"><ellipse cx="830" cy="730" rx="120" ry="38"/></clipPath>
</defs>
<rect width="1000" height="800" fill="url(#cy-sky)"/>
<circle cx="830" cy="105" r="150" fill="url(#cy-moon)"/>
<circle cx="830" cy="105" r="36" fill="#d9d2b6" opacity=".55"/>
<g fill="#0a0e18" opacity=".9"><ellipse cx="770" cy="124" rx="120" ry="20"/><ellipse cx="905" cy="88" rx="95" ry="16"/><ellipse cx="160" cy="70" rx="160" ry="22"/></g>
<path d="M0 300 H30 V278 H62 V300 H94 V278 H126 V300 H158 V278 H190 V300 H222 V278 H254 V300 H286 V278 H318 V300 H400 V570 H0 Z" fill="url(#cy-stone)"/>
<path d="M600 300 H682 V278 H714 V300 H746 V278 H778 V300 H810 V278 H842 V300 H874 V278 H906 V300 H938 V278 H970 V300 H1000 V570 H600 Z" fill="url(#cy-stone)"/>
<g stroke="#0f131c" stroke-width="2" opacity=".6"><path d="M0 345 H400 M0 395 H400 M600 345 H1000 M600 395 H1000"/></g>
<g fill="#070a11"><path d="M50 570 V430 a45 45 0 0 1 90 0 V570 Z"/><path d="M220 570 V430 a45 45 0 0 1 90 0 V570 Z"/><path d="M690 570 V430 a45 45 0 0 1 90 0 V570 Z"/><path d="M860 570 V440 a45 45 0 0 1 90 0 V570 Z"/></g>
<g fill="#3a2f22"><rect x="176" y="402" width="9" height="32"/><rect x="815" y="402" width="9" height="32"/></g>
<g fill="#1b1611"><path d="M170 402 h21 l-4 -14 h-13 z"/><path d="M809 402 h21 l-4 -14 h-13 z"/></g>
<path d="M405 100 L500 6 L595 100 Z" fill="#141925"/>
<rect x="420" y="96" width="160" height="474" fill="url(#cy-stone)"/>
<g stroke="#10141d" stroke-width="2" opacity=".7"><path d="M420 290 H580 M420 345 H580 M420 400 H580 M420 455 H580"/></g>
<rect x="488" y="300" width="24" height="60" rx="12" fill="#070a11"/>
<circle cx="500" cy="190" r="58" fill="#1b2130" stroke="#7a6438" stroke-width="5"/>
<g stroke="#a58b52" stroke-width="3"><path d="M500 138 v10 M552 190 h-10 M500 242 v-10 M448 190 h10"/></g>
<path d="M500 190 L497 158" stroke="#c9b27a" stroke-width="5" stroke-linecap="round"/>
<path d="M500 190 L496 145" stroke="#c9b27a" stroke-width="3" stroke-linecap="round"/>
<g fill="#aab3c6" opacity=".3"><ellipse cx="478" cy="190" rx="115" ry="28"/><ellipse cx="532" cy="168" rx="92" ry="24"/><ellipse cx="500" cy="214" rx="120" ry="22"/></g>
<path d="M462 570 V505 a38 38 0 0 1 76 0 V570 Z" fill="#05070c"/>
<rect y="565" width="1000" height="235" fill="url(#cy-ground)"/>
<g stroke="#0a0d14" stroke-width="2" opacity=".8" fill="none"><path d="M0 600 H1000 M0 652 H1000 M0 716 H1000 M0 796 H1000"/><path d="M500 565 L500 800 M500 565 L330 800 M500 565 L160 800 M500 565 L0 790 M500 565 L670 800 M500 565 L840 800 M500 565 L1000 790"/></g>
<ellipse cx="830" cy="730" rx="120" ry="38" fill="#0f1726" stroke="#2c3a54" stroke-width="2"/>
<g clip-path="url(#cy-puddle)"><g transform="translate(830 728) scale(1 -0.55)" opacity=".92"><circle r="40" fill="#1b2130" stroke="#c9a24a" stroke-width="4"/><path d="M0 -40 v8 M40 0 h-8 M0 40 v-8 M-40 0 h8" stroke="#a58b52" stroke-width="3"/><path d="M0 0 L-3 -22" stroke="#efe3c2" stroke-width="5" stroke-linecap="round"/><path d="M0 0 L-4 -34" stroke="#efe3c2" stroke-width="3" stroke-linecap="round"/><path d="M-30 -38 L6 -9" stroke="#8a6a3a" stroke-width="4" stroke-linecap="round"/><circle r="3.5" fill="#c9a24a"/></g><ellipse cx="830" cy="730" rx="120" ry="38" fill="url(#cy-sheen)"/></g>
<path d="M282 618 C292 566 350 548 404 552 C462 556 512 576 516 618 Z" fill="#0b0e15" stroke="#2a3142" stroke-width="2"/>
<path d="M305 602 C345 590 385 596 430 588 M330 575 C360 570 400 574 440 568" stroke="#1d2330" stroke-width="2" fill="none"/>
<ellipse cx="524" cy="612" rx="18" ry="10" fill="#17120d"/><ellipse cx="520" cy="595" rx="16" ry="9" fill="#17120d"/>
<path d="M286 608 C274 611 266 615 258 622" stroke="#2a2018" stroke-width="11" stroke-linecap="round" fill="none"/>
</svg>`;

ART.castlePanel = (() => {
    const rnd = seeded(7);
    let rain = '';
    for (let i = 0; i < 70; i++){
        const x = rnd() * 820 - 40, y = rnd() * 420;
        rain += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-10 26"/>`;
    }
    return `<svg viewBox="0 0 760 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060912"/><stop offset="1" stop-color="#1c2436"/></linearGradient><radialGradient id="cp-glow"><stop offset="0" stop-color="#f1cf7a" stop-opacity=".8"/><stop offset="1" stop-color="#f1cf7a" stop-opacity="0"/></radialGradient></defs><rect width="760" height="420" fill="url(#cp-sky)"/><circle cx="610" cy="88" r="38" fill="#d9d2b6" opacity=".3"/><path d="M0 420 V330 L60 320 V260 L80 230 L100 260 V300 H150 V240 L170 200 L190 240 V310 H240 V280 H270 V170 L290 130 L310 170 V280 H340 V100 L380 28 L420 100 V290 H450 V220 L475 180 L500 220 V300 H560 V250 L580 215 L600 250 V320 H660 V280 L690 250 L720 280 V330 L760 340 V420 Z" fill="#04060b"/><circle cx="380" cy="138" r="70" fill="url(#cp-glow)" opacity=".35"/><circle cx="380" cy="138" r="22" fill="#2a2416" stroke="#c9a24a" stroke-width="3"/><path d="M380 138 L378 124 M380 138 L377 119" stroke="#f1cf7a" stroke-width="2.5" stroke-linecap="round"/><g fill="#c9a24a" opacity=".75"><rect x="286" y="205" width="6" height="11"/><rect x="471" y="240" width="6" height="11"/><rect x="166" y="255" width="6" height="11"/><rect x="576" y="270" width="6" height="11"/><rect x="372" y="200" width="7" height="13"/></g><g stroke="#9fb0c8" stroke-opacity=".28" stroke-width="1.2">${rain}</g></svg>`;
})();

ART.owlWindow = `<svg viewBox="0 0 760 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="760" height="420" fill="#0b0e16"/><path d="M230 420 V170 a150 150 0 0 1 300 0 V420 Z" fill="#18202f"/><circle cx="440" cy="150" r="46" fill="#d9d2b6" opacity=".45"/><g stroke="#05070c" stroke-width="12" fill="none"><path d="M380 22 V420 M230 250 H530"/><path d="M230 420 V170 a150 150 0 0 1 300 0 V420"/></g><rect x="196" y="338" width="368" height="22" fill="#2b2418"/><g fill="#05070c"><ellipse cx="318" cy="290" rx="38" ry="50"/><circle cx="318" cy="236" r="30"/><path d="M294 220 L290 196 L306 214 Z M342 220 L346 196 L330 214 Z"/></g><circle cx="307" cy="234" r="5" fill="#f1cf7a"/><circle cx="329" cy="234" r="5" fill="#f1cf7a"/><rect x="300" y="250" width="40" height="26" fill="#d9c9a0" transform="rotate(-8 320 263)"/><circle cx="322" cy="264" r="6" fill="#9e1f29"/><g stroke="#9fb0c8" stroke-opacity=".22" stroke-width="1.2"><path d="M260 40 l-8 22 M300 90 l-8 22 M470 60 l-8 22 M420 280 l-8 22 M500 200 l-8 22 M270 160 l-8 22 M450 330 l-8 22"/></g></svg>`;

ART.ember = `<svg viewBox="0 0 160 180" aria-hidden="true"><path d="M8 168 H152" stroke="#3a2f22" stroke-width="8" stroke-linecap="round"/><path d="M34 62 L40 18 L64 50 Z M96 50 L120 18 L126 62 Z" fill="#3b3226"/><ellipse cx="80" cy="104" rx="56" ry="64" fill="#4a3d2c"/><ellipse cx="80" cy="124" rx="34" ry="42" fill="#6b5a40"/><path d="M62 112 l6 5 l6 -5 M86 112 l6 5 l6 -5 M70 130 l6 5 l6 -5 M80 146 l6 5 l6 -5 M60 146 l6 5 l6 -5" stroke="#4a3d2c" stroke-width="2.2" fill="none"/><circle cx="58" cy="78" r="21" fill="#1a150e"/><circle cx="102" cy="78" r="21" fill="#1a150e"/><circle cx="58" cy="78" r="14" fill="#f1cf7a"/><circle cx="102" cy="78" r="14" fill="#f1cf7a"/><circle cx="60" cy="80" r="6.5" fill="#0a0806"/><circle cx="100" cy="80" r="6.5" fill="#0a0806"/><circle cx="62" cy="77" r="2" fill="#fff8e0"/><circle cx="102" cy="77" r="2" fill="#fff8e0"/><path d="M73 92 L80 108 L87 92 Z" fill="#c9a24a"/><path d="M62 166 l-6 -6 M66 166 v-8 M94 166 v-8 M98 166 l6 -6" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/></svg>`;

ART.morwen = `<svg viewBox="0 0 260 330" aria-hidden="true"><defs><radialGradient id="mw-bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#3b3a26"/><stop offset="1" stop-color="#0f120d"/></radialGradient></defs><rect width="260" height="330" rx="6" fill="#5a431b"/><rect x="9" y="9" width="242" height="312" fill="none" stroke="#e0bd68" stroke-width="4"/><rect x="22" y="22" width="216" height="286" fill="url(#mw-bg)"/><path d="M40 308 C50 240 90 222 130 222 C170 222 210 240 220 308 Z" fill="#1d1a2a"/><path d="M108 226 L130 262 L152 226" fill="none" stroke="#c9a24a" stroke-width="2"/><path d="M96 150 C92 200 100 226 130 228 C160 226 168 200 164 150 Z" fill="#2a2116"/><ellipse cx="130" cy="160" rx="29" ry="37" fill="#c7b089"/><path d="M114 156 q6 -5 12 0 M134 156 q6 -5 12 0" stroke="#3a2a16" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M122 180 q8 4 16 0" stroke="#7a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="130" cy="122" rx="66" ry="13" fill="#141019"/><path d="M98 120 L144 34 L150 46 L176 40 L162 120 Z" fill="#141019"/><path d="M104 114 H158" stroke="#9e1f29" stroke-width="5"/><g fill="#e0bd68"><circle cx="22" cy="22" r="7"/><circle cx="238" cy="22" r="7"/><circle cx="22" cy="308" r="7"/><circle cx="238" cy="308" r="7"/></g></svg>`;

ART.hagridUp = `<svg viewBox="0 0 760 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><radialGradient id="hu-glow" cx="52%" cy="45%" r="45%"><stop offset="0" stop-color="#c9a24a" stop-opacity=".55"/><stop offset=".6" stop-color="#3a2d16" stop-opacity=".35"/><stop offset="1" stop-color="#10151f" stop-opacity="0"/></radialGradient></defs><rect width="760" height="360" fill="#10151f"/><rect width="760" height="360" fill="url(#hu-glow)"/><rect y="290" width="760" height="70" fill="#0b0e15"/><path d="M200 300 C210 250 260 236 320 240 L330 300 Z" fill="#090b11"/><path d="M300 300 C300 230 320 170 380 160 C440 150 470 200 470 300 Z" fill="#06080d"/><circle cx="392" cy="122" r="44" fill="#06080d"/><path d="M350 130 C340 170 360 196 392 200 C424 196 446 170 436 130 Z" fill="#0d0f15"/><path d="M356 96 C346 70 380 64 392 76 C404 62 440 70 428 98" fill="#06080d"/><path d="M440 190 C470 150 476 120 450 100" stroke="#06080d" stroke-width="26" stroke-linecap="round" fill="none"/><circle cx="378" cy="120" r="3" fill="#c9a24a"/><circle cx="406" cy="120" r="3" fill="#c9a24a"/><g transform="translate(520 210)"><path class="fang-tail" d="M24 72 C10 68 4 54 10 44" fill="none" stroke="#2e2c28" stroke-width="7" stroke-linecap="round" style="animation:wag .3s ease-in-out infinite alternate"/><path d="M24 94 C18 72 26 54 44 48 C58 44 70 46 76 38 L80 24 C82 16 92 14 98 20 L108 28 C112 32 110 38 104 38 L94 40 C92 52 90 64 86 76 L88 94 Z" fill="#0d0f15" stroke="#5d5a52" stroke-width="1.5"/></g><text x="620" y="180" font-family="Cinzel Decorative, Georgia, serif" font-size="46" font-weight="700" fill="#d0404a" transform="rotate(-8 620 180)">WOOF.</text></svg>`;

ART.glyphs = [
    `<svg viewBox="0 0 20 20"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor"/></svg>`,
    `<svg viewBox="0 0 20 20"><path d="M10 1 L12.6 7.2 L19.4 7.6 L14.2 12 L15.8 18.6 L10 15 L4.2 18.6 L5.8 12 L.6 7.6 L7.4 7.2 Z" fill="currentColor"/></svg>`,
    `<svg viewBox="0 0 20 20"><path d="M13 2 A8 8 0 1 0 18 15 A6.5 6.5 0 1 1 13 2 Z" fill="currentColor"/></svg>`,
    `<svg viewBox="0 0 20 20"><path d="M10 3 L11 9 L17 10 L11 11 L10 17 L9 11 L3 10 L9 9 Z" fill="currentColor"/><path d="M10 6 L10.5 9.5 L14 10 L10.5 10.5 L10 14 L9.5 10.5 L6 10 L9.5 9.5 Z" fill="#fff8e0" opacity=".7"/></svg>`
];

function silhouette(id){
    const g = 'sil' + (++artId);
    const back = `<defs><radialGradient id="${g}" cx="50%" cy="38%" r="68%"><stop offset="0" stop-color="#c9a24a" stop-opacity=".6"/><stop offset=".5" stop-color="#3a2d16" stop-opacity=".55"/><stop offset="1" stop-color="#090c14"/></radialGradient></defs><rect width="200" height="240" fill="url(#${g})"/>`;
    const ink = '#05070c';
    const bust = `<path d="M18 240 C22 190 60 172 100 172 C140 172 178 190 182 240 Z" fill="${ink}"/><rect x="86" y="140" width="28" height="40" fill="${ink}"/>`;
    let shape = '';
    switch (id){
        case 'thorne':
            shape = `${bust}<ellipse cx="100" cy="106" rx="31" ry="44" fill="${ink}"/><path d="M68 98 C66 62 134 58 132 98 C120 80 82 80 68 98 Z" fill="${ink}"/><path d="M58 184 L76 140 L94 176 Z M142 184 L124 140 L106 176 Z" fill="${ink}"/><path d="M70 212 q30 16 60 0" stroke="#c9a24a" stroke-width="2.5" fill="none"/><circle cx="130" cy="212" r="5" fill="#c9a24a"/>`;
            break;
        case 'wren':
            shape = `${bust}<ellipse cx="100" cy="110" rx="34" ry="42" fill="${ink}"/><circle cx="100" cy="62" r="22" fill="${ink}"/><path d="M110 50 C124 30 140 34 142 40 C132 42 122 46 112 56 Z" fill="#2f4a2a"/><path d="M106 46 C112 24 126 22 130 26 C120 30 114 38 110 50 Z" fill="#3c5a33"/><path d="M58 184 C80 196 120 196 142 184 L136 200 C112 208 88 208 64 200 Z" fill="#1d2a1d"/>`;
            break;
        case 'crumb':
            shape = `<path d="M8 240 C12 186 56 168 100 168 C144 168 188 186 192 240 Z" fill="${ink}"/><circle cx="100" cy="118" r="42" fill="${ink}"/><path d="M62 92 C46 44 80 30 100 46 C120 30 156 44 138 92 Z" fill="#1e222c" stroke="#6b6555" stroke-width="2"/><rect x="64" y="84" width="72" height="12" fill="#1e222c" stroke="#6b6555" stroke-width="2"/><circle cx="150" cy="196" r="13" fill="#3a2a18"/>`;
            break;
        case 'odessa':
            shape = `<path d="M58 200 C52 140 58 80 100 66 C142 80 148 140 142 200 Z" fill="${ink}"/>${bust}<ellipse cx="100" cy="112" rx="31" ry="41" fill="${ink}"/><g fill="none" stroke="#c9a24a" stroke-width="2.5"><circle cx="87" cy="112" r="10"/><circle cx="113" cy="112" r="10"/><path d="M97 112 h6"/></g>`;
            break;
        case 'kriti':
            shape = `<path d="M60 206 C52 150 60 82 100 70 C140 82 148 150 140 206 Z" fill="${ink}"/>${bust}<ellipse cx="100" cy="114" rx="31" ry="41" fill="${ink}"/><path d="M52 190 L70 150 L90 182 Z M148 190 L130 150 L110 182 Z" fill="${ink}"/><path d="M146 240 L178 150" stroke="#6b4f2a" stroke-width="5" stroke-linecap="round"/><circle cx="178" cy="150" r="9" fill="#f1cf7a" opacity=".9"/><circle cx="178" cy="150" r="22" fill="#f1cf7a" opacity=".25"/>`;
            break;
        default:
            shape = `${bust}<ellipse cx="100" cy="110" rx="33" ry="42" fill="${ink}"/>`;
    }
    return `<svg viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${back}${shape}</svg>`;
}

/* Photo portraits: use the real photo if it exists, otherwise the inked silhouette */
const missingPhotos = new Set();
function portrait(id){
    const d = `style="--d:-${(Math.random() * 6).toFixed(2)}s"`;
    if (missingPhotos.has(id)) return `<div class="portrait living" ${d}>${silhouette(id)}</div>`;
    return `<div class="portrait living" ${d}><img src="${CONFIG.suspectPhoto(id)}" alt="" data-sil="${id}"></div>`;
}
function wirePortraits(root){
    (root || document).querySelectorAll('img[data-sil]').forEach(img => {
        const swap = () => {
            missingPhotos.add(img.dataset.sil);
            if (!img.isConnected) return;
            const holder = document.createElement('div');
            holder.innerHTML = silhouette(img.dataset.sil);
            img.replaceWith(holder.firstElementChild);
        };
        if (img.complete && img.naturalWidth === 0 && img.src) swap();
        else img.addEventListener('error', swap, { once: true });
    });
}

function placeholderPhoto(n){
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#171d2a"/><rect x="24" y="24" width="552" height="552" fill="none" stroke="#c9a24a" stroke-opacity=".4" stroke-width="2" stroke-dasharray="10 8"/><text x="300" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#c9a24a">Photo ${n}</text><text x="300" y="346" text-anchor="middle" font-family="Courier New, monospace" font-size="22" fill="#a39a84">your photo goes here</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function photoWithFallback(img, n){
    img.addEventListener('error', () => { img.src = placeholderPhoto(n); }, { once: true });
    img.src = CONFIG.photoPath(n);
}

/* =========================================================
   SOUND (generated score + effects, no audio files)
   ========================================================= */
const Sound = {
    ctx: null, master: null, scoreBus: null, sfxBus: null,
    muted: false, running: false,
    tickInterval: 1000, tickTimer: null, motifTimer: null, tickAlt: false,
    nodes: [],

    init(){
        if (this.ctx) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        try { this.ctx = new AC(); } catch (e) { return false; }
        const c = this.ctx;
        this.master = c.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(c.destination);
        this.scoreBus = c.createGain(); this.scoreBus.gain.value = 0; this.scoreBus.connect(this.master);
        this.sfxBus = c.createGain(); this.sfxBus.gain.value = .9; this.sfxBus.connect(this.master);

        this.delay = c.createDelay(1); this.delay.delayTime.value = .34;
        const fb = c.createGain(); fb.gain.value = .36;
        const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
        this.delay.connect(dlp); dlp.connect(fb); fb.connect(this.delay); dlp.connect(this.scoreBus);

        const len = c.sampleRate * 2;
        this.noise = c.createBuffer(1, len, c.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return true;
    },
    resume(){ if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    hz: m => 440 * Math.pow(2, (m - 69) / 12),

    startScore(){
        if (!this.init()) return;
        this.resume();
        if (this.running) return;
        this.running = true;
        const c = this.ctx, t = c.currentTime;

        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 3;
        const lfo = c.createOscillator(); lfo.frequency.value = .05;
        const lfoG = c.createGain(); lfoG.gain.value = 110;
        lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
        const dg = c.createGain(); dg.gain.value = .085;
        [[55, 'sawtooth', .5], [55.4, 'sawtooth', .5], [82.4, 'triangle', .5], [41.2, 'sine', .9]].forEach(([f, type, g]) => {
            const o = c.createOscillator(); o.type = type; o.frequency.value = f;
            const og = c.createGain(); og.gain.value = g;
            o.connect(og); og.connect(lp); o.start();
            this.nodes.push(o);
        });
        lp.connect(dg); dg.connect(this.scoreBus);
        this.nodes.push(lfo);

        const rain = c.createBufferSource(); rain.buffer = this.noise; rain.loop = true;
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
        const rl = c.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 5200;
        this.rainGain = c.createGain(); this.rainGain.gain.value = .045;
        rain.connect(hp); hp.connect(rl); rl.connect(this.rainGain); this.rainGain.connect(this.scoreBus);
        rain.start(); this.nodes.push(rain);

        const rum = c.createBufferSource(); rum.buffer = this.noise; rum.loop = true;
        const rlp = c.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 220;
        const rg = c.createGain(); rg.gain.value = .05;
        rum.connect(rlp); rlp.connect(rg); rg.connect(this.scoreBus);
        rum.start(); this.nodes.push(rum);

        this.scoreBus.gain.cancelScheduledValues(t);
        this.scoreBus.gain.setValueAtTime(0, t);
        this.scoreBus.gain.linearRampToValueAtTime(.9, t + 4);
        this.loopTick();
        this.loopMotif(3000);
    },

    stopScore(fade = 2){
        if (!this.ctx || !this.running) return;
        this.running = false;
        clearTimeout(this.tickTimer); clearTimeout(this.motifTimer);
        const t = this.ctx.currentTime;
        this.scoreBus.gain.cancelScheduledValues(t);
        this.scoreBus.gain.setValueAtTime(this.scoreBus.gain.value, t);
        this.scoreBus.gain.linearRampToValueAtTime(0, t + fade);
        const old = this.nodes; this.nodes = [];
        setTimeout(() => old.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }), fade * 1000 + 200);
    },

    setTension(level){
        this.tickInterval = [1000, 1000, 920, 840, 760, 680, 600][level] || 1000;
    },

    loopTick(){
        clearTimeout(this.tickTimer);
        const step = () => {
            if (!this.running) return;
            this.tickAlt = !this.tickAlt;
            this.tick(this.scoreBus, this.tickAlt ? 2600 : 1950, .14);
            this.tickTimer = setTimeout(step, this.tickInterval);
        };
        step();
    },

    tick(bus, freq, vol){
        const c = this.ctx, t = c.currentTime;
        const n = c.createBufferSource(); n.buffer = this.noise;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 9;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + .004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + .05);
        n.connect(bp); bp.connect(g); g.connect(bus);
        n.start(t, Math.random()); n.stop(t + .07);
    },

    loopMotif(delay){
        clearTimeout(this.motifTimer);
        this.motifTimer = setTimeout(() => {
            if (!this.running) return;
            this.playMotif();
            this.loopMotif(9000 + Math.random() * 5000);
        }, delay);
    },

    playMotif(){
        const phrases = [
            [69, 72, 76, 74, 72, 71, 68, 69],
            [76, 74, 72, 71, 72, 69, 68, 69],
            [64, 69, 72, 71, 69, 68, 64],
            [81, 76, 77, 76, 72, 74, 71, 69]
        ];
        const p = phrases[Math.floor(Math.random() * phrases.length)];
        const t = this.ctx.currentTime + .05;
        p.forEach((m, i) => this.pluck(this.hz(m), t + i * .44, .05, this.scoreBus, true));
    },

    pluck(freq, t, vol, bus, echo){
        const c = this.ctx;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + .006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
        const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
        const g2 = c.createGain(); g2.gain.value = .25;
        o1.connect(g); o2.connect(g2); g2.connect(g);
        g.connect(bus);
        if (echo) g.connect(this.delay);
        o1.start(t); o2.start(t); o1.stop(t + 1.7); o2.stop(t + 1.7);
    },

    bell(freq, t, vol){
        const c = this.ctx;
        [[1, 1], [2, .5], [2.4, .35], [3, .25], [4.2, .15], [5.4, .1]].forEach(([r, a]) => {
            const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * r;
            const g = c.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol * a, t + .01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 5 / r + 1);
            o.connect(g); g.connect(this.sfxBus);
            o.start(t); o.stop(t + 6.5);
        });
    },

    burst(freqType, freq, dur, vol, q){
        const c = this.ctx, t = c.currentTime;
        const n = c.createBufferSource(); n.buffer = this.noise;
        const f = c.createBiquadFilter(); f.type = freqType; f.frequency.value = freq; if (q) f.Q.value = q;
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        n.connect(f); f.connect(g); g.connect(this.sfxBus);
        n.start(t, Math.random()); n.stop(t + dur + .05);
    },

    thump(from, to, dur, vol){
        const c = this.ctx, t = c.currentTime;
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(from, t);
        o.frequency.exponentialRampToValueAtTime(to, t + dur);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.sfxBus);
        o.start(t); o.stop(t + dur + .05);
    },

    sfx(name){
        if (!this.init()) return;
        this.resume();
        const t = this.ctx.currentTime;
        switch (name){
            case 'clue':
                this.pluck(this.hz(88), t, .09, this.sfxBus); this.pluck(this.hz(93), t + .09, .08, this.sfxBus); break;
            case 'reveal':
                [81, 84, 88, 91, 93].forEach((m, i) => this.pluck(this.hz(m), t + i * .06, .05, this.sfxBus)); break;
            case 'wrong':
                this.thump(120, 42, .45, .5); this.burst('lowpass', 380, .3, .25); break;
            case 'slam':
                this.burst('lowpass', 900, .35, .7); this.thump(80, 35, .5, .6); break;
            case 'unlock':
                [69, 72, 76, 81].forEach((m, i) => this.pluck(this.hz(m), t + i * .12, .1, this.sfxBus)); break;
            case 'page':
                this.burst('bandpass', 1700, .22, .12, 1.2); break;
            case 'click':
                this.burst('bandpass', 3200, .03, .25, 6); break;
            case 'tickLoud':
                this.tick(this.sfxBus, 2300, .5); break;
            case 'bell':
                this.bell(196, t, .32); break;
            case 'whoosh': {
                const c = this.ctx, t0 = c.currentTime;
                const n = c.createBufferSource(); n.buffer = this.noise;
                const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
                f.frequency.setValueAtTime(260, t0); f.frequency.exponentialRampToValueAtTime(1900, t0 + .7);
                const g = c.createGain();
                g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(.45, t0 + .25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + .9);
                n.connect(f); f.connect(g); g.connect(this.sfxBus);
                n.start(t0, Math.random()); n.stop(t0 + 1);
                this.thump(90, 40, .9, .25);
                break;
            }
            case 'crack':
                this.burst('highpass', 2200, .09, .5); this.thump(220, 70, .18, .35); break;
            case 'shimmer':
                [93, 96, 100, 98, 105].forEach((m, i) => this.pluck(this.hz(m), t + i * .05, .035, this.sfxBus)); break;
            case 'bark':
                this.burst('bandpass', 650, .12, .6, 3);
                setTimeout(() => this.burst('bandpass', 560, .16, .6, 3), 180);
                break;
        }
    },

    setMuted(m){
        this.muted = m;
        if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, .05);
        const music = $('#music');
        if (music) music.muted = m;
        const v = $('#finalCompilation');
        if (v) v.muted = m;
    }
};

/* =========================================================
   RAIN + EMBERS
   ========================================================= */
const Rain = {
    on: false, drops: [], raf: 0,
    init(){
        this.c = $('#rain');
        this.ctx = this.c.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    resize(){
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = window.innerWidth; this.h = window.innerHeight;
        this.c.width = this.w * dpr; this.c.height = this.h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(220, Math.round(this.w / 7));
        this.drops = Array.from({ length: n }, () => this.drop(true));
    },
    drop(anyY){
        return { x: Math.random() * (this.w + 200) - 100, y: anyY ? Math.random() * this.h : -30, l: 12 + Math.random() * 18, v: 9 + Math.random() * 8, a: .08 + Math.random() * .16 };
    },
    start(){
        if (this.on) return;
        this.on = true;
        this.c.classList.add('on');
        if (reduceMotion){ this.draw(); return; }
        const loop = () => {
            if (!this.on) return;
            this.draw(true);
            this.raf = requestAnimationFrame(loop);
        };
        loop();
    },
    draw(move){
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.lineWidth = 1;
        for (const d of this.drops){
            ctx.strokeStyle = `rgba(170,185,210,${d.a})`;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - d.l * .28, d.y + d.l);
            ctx.stroke();
            if (move){
                d.y += d.v; d.x -= d.v * .28;
                if (d.y > this.h + 30) Object.assign(d, this.drop(false));
            }
        }
    },
    stop(){
        this.on = false;
        this.c.classList.remove('on');
        setTimeout(() => { if (!this.on){ cancelAnimationFrame(this.raf); this.ctx.clearRect(0, 0, this.w, this.h); } }, 2600);
    }
};

const Embers = {
    timer: null,
    start(){
        if (this.timer || reduceMotion) return;
        this.timer = setInterval(() => this.spawn(), 850);
    },
    stop(){ clearInterval(this.timer); this.timer = null; },
    spawn(){
        const el = document.createElement('div');
        const glyph = Math.random() < .45;
        el.className = 'ember' + (glyph ? ' glyph' : '');
        if (glyph){
            el.innerHTML = ART.glyphs[Math.floor(Math.random() * ART.glyphs.length)];
            el.style.setProperty('--gs', (11 + Math.random() * 12).toFixed(0) + 'px');
        } else { const s = 2 + Math.random() * 4; el.style.width = s + 'px'; el.style.height = s + 'px'; }
        el.style.left = (Math.random() * 100) + 'vw';
        const dur = 10 + Math.random() * 8;
        el.style.animationDuration = dur + 's';
        el.style.setProperty('--drift', (Math.random() * 120 - 60) + 'px');
        $('#embers').appendChild(el);
        setTimeout(() => el.remove(), dur * 1000);
    }
};

/* =========================================================
   UI PRIMITIVES
   ========================================================= */
function showScreen(id){
    $$('.screen.active').forEach(s => s.classList.remove('active'));
    $('#' + id).classList.add('active');
    window.scrollTo(0, 0);
}

let modalResolve = null;
function modal({ art = '', title = '', html = '', buttons = [{ label: 'Continue' }], flip = false, burst = false }){
    return new Promise(resolve => {
        if (modalResolve) modalResolve(null);
        modalResolve = resolve;
        const card = $('#modal .modal-card');
        $('#modalArt').innerHTML = art;
        card.classList.toggle('no-art', !art);
        $('#modalTitle').textContent = title;
        $('#modalTitle').hidden = !title;
        $('#modalText').innerHTML = html;
        const bw = $('#modalButtons');
        bw.innerHTML = '';
        buttons.forEach((b, i) => {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'btn ' + (b.cls || (i === buttons.length - 1 ? 'primary' : 'ghost'));
            el.textContent = b.label;
            el.addEventListener('click', () => modalDone(b.value !== undefined ? b.value : i));
            bw.appendChild(el);
        });
        $('#modal').hidden = false;
        wirePortraits($('#modal'));
        card.scrollTop = 0;
        card.classList.remove('flip-in');
        if (flip){ void card.offsetWidth; card.classList.add('flip-in'); }
        if (burst) setTimeout(() => { sparksAt($('#modalArt').innerHTML ? $('#modalArt') : card, { count: 30, spread: 130 }); Sound.sfx('shimmer'); }, flip ? 380 : 120);
        setTimeout(() => { const last = bw.lastElementChild; if (last) last.focus({ preventScroll: true }); }, 60);
    });
}
function modalDone(value){
    $('#modal').hidden = true;
    const r = modalResolve; modalResolve = null;
    if (r) r(value);
}
const modalOpen = () => !$('#modal').hidden;

const said = (who, text) => `<p class="said"><b>${esc(who)}</b>${esc(text)}</p>`;
const typed = text => `<p class="typed">${esc(text)}</p>`;
const clueHtml = c => typed(c.note) + `<p class="thought"><b>Detective's thought</b>${esc(c.thought)}</p>`;

let toastTimer = null;
function toast(msg, ms = 2400){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

function typeInto(el, text, speed = 26){
    if (reduceMotion){ el.textContent = text; return { done: true, finish(){} }; }
    let i = 0;
    el.textContent = '';
    const ctl = {
        done: false,
        finish(){ clearInterval(timer); el.textContent = text; ctl.done = true; }
    };
    const timer = setInterval(() => {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i >= text.length){ clearInterval(timer); ctl.done = true; }
    }, speed);
    return ctl;
}

/* =========================================================
   FX: quill, ink writing, handwriting, sparks, ink wipe
   ========================================================= */
ART.quill = `<svg viewBox="0 0 60 120" aria-hidden="true"><defs><linearGradient id="qf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f0df"/><stop offset="1" stop-color="#b3a37f"/></linearGradient></defs><path d="M5 117 L15 91" stroke="#1e1710" stroke-width="3.4" stroke-linecap="round"/><path d="M5 117 L8 109" stroke="#c9a24a" stroke-width="1.6" stroke-linecap="round"/><path d="M15 92 C10 60 22 26 55 2 C51 30 43 62 19 94 Z" fill="url(#qf)" stroke="#857553" stroke-width="1"/><path d="M15 94 C25 66 37 36 53 6" stroke="#857553" stroke-width="1.2" fill="none"/><path d="M23 70 l-8 -3 M28 58 l-9 -4 M33 46 l-8 -5 M39 34 l-7 -5 M45 22 l-6 -5" stroke="#d9cdb0" stroke-width=".9"/></svg>`;

const Quill = {
    el: null,
    at(x, y){
        if (!this.el){
            this.el = document.createElement('div');
            this.el.className = 'quill';
            this.el.innerHTML = ART.quill;
            this.el.hidden = true;
            document.body.appendChild(this.el);
        }
        if (this.el.hidden){
            this.el.style.transition = 'none';
            this.el.style.transform = `translate(${x - 3}px, ${y - 66}px)`;
            this.el.hidden = false;
            void this.el.offsetWidth;
            this.el.style.transition = '';
        } else {
            this.el.style.transform = `translate(${x - 3}px, ${y - 66}px)`;
        }
    },
    hide(){ if (this.el) this.el.hidden = true; }
};

/* Words ink onto the page one by one, with the quill gliding along the line */
function inkWrite(el, text, opts = {}){
    const speed = opts.speed === undefined ? 60 : opts.speed;
    const useQuill = opts.quill !== false;
    const parts = String(text).split(/(\s+)/);
    el.innerHTML = parts.map(w => (!w || /^\s+$/.test(w)) ? w.replace(/\n/g, '<br>') : `<span class="ink-w">${esc(w)}</span>`).join('');
    const spans = Array.from(el.querySelectorAll('.ink-w'));
    let i = 0, timer = null, resolve;
    const ctl = { done: false, promise: new Promise(r => { resolve = r; }) };
    ctl.finish = () => {
        if (ctl.done) return;
        ctl.done = true;
        clearTimeout(timer);
        spans.forEach(s => s.classList.add('in'));
        if (useQuill) Quill.hide();
        resolve();
    };
    if (reduceMotion || !spans.length || speed === 0){ ctl.finish(); return ctl; }
    const step = () => {
        if (ctl.done) return;
        if (!el.isConnected){ ctl.finish(); return; }
        const s = spans[i];
        s.classList.add('in');
        if (useQuill){
            const r = s.getBoundingClientRect();
            if (r.width) Quill.at(r.right + 2, r.bottom - r.height * .2);
        }
        i++;
        if (i >= spans.length){ timer = setTimeout(ctl.finish, 300); return; }
        timer = setTimeout(step, speed + s.textContent.length * 14);
    };
    step();
    return ctl;
}

/* Real stroke-by-stroke handwriting for short lines, with the quill on the nib */
let varaPatched = false, hwSeq = 0;
function patchVara(){
    if (varaPatched || !window.Vara || !window.HANDWRITING_FONT) return;
    varaPatched = true;
    const measure = window.Vara.prototype.analyseWidth;
    window.Vara.prototype.analyseWidth = function(){
        const out = measure.call(this);
        this.texts.forEach(t => { t.minWidth = 0; });
        return out;
    };
    window.Vara.prototype.getSVGData = function(){
        const self = this;
        setTimeout(() => {
            self.contents = window.HANDWRITING_FONT;
            self.characters = window.HANDWRITING_FONT.c;
            self.preCreate();
            self.createText();
        }, 0);
    };
}
/* Parisienne's flourished capitals and tall loops leave gaps; pull the next letter in */
const HW_KERN = { K: .27, F: .24, T: .24, N: .2, l: .11, f: .08, P: .1, W: .06, J: .12, I: .08, '.': -.2 };
const HW_KERN_BEFORE = { y: .1 };
function kernHandwriting(el, v, size, align){
    const lines = (v.texts && v.texts[0] && v.texts[0].text) || [];
    const outer = el.querySelector('svg > g.outer');
    if (!outer) return;
    Array.from(outer.children).forEach((lg, li) => {
        const str = String(lines[li] || '');
        const chars = Array.from(lg.children);
        const shifts = [];
        let acc = 0;
        chars.forEach((cg, ci) => {
            if (ci > 0){
                const after = HW_KERN[str[ci - 1]] || 0;
                const before = str[ci - 1] === ' ' ? 0 : (HW_KERN_BEFORE[str[ci]] || 0);
                acc += (after < 0 ? after : Math.max(after, before)) * size;
            }
            shifts.push(acc);
        });
        const total = acc;
        const offset = align === 'center' ? total / 2 : align === 'right' ? total : 0;
        chars.forEach((cg, ci) => {
            const delta = offset - shifts[ci];
            if (!delta) return;
            const t = cg.transform.baseVal.consolidate();
            if (!t) return;
            const m = t.matrix;
            cg.setAttribute('transform', `translate(${(m.e + delta).toFixed(2)},${m.f.toFixed(2)}) scale(${m.a})`);
        });
    });
}

function handwrite(el, text, opts = {}){
    const size = opts.size || 40;
    const color = opts.color || '#f1cf7a';
    const align = opts.align || 'left';
    let resolve, raf = 0, safety = 0;
    const ctl = { done: false, promise: new Promise(r => { resolve = r; }) };
    ctl.finish = () => {
        if (ctl.done) return;
        ctl.done = true;
        cancelAnimationFrame(raf);
        clearTimeout(safety);
        el.classList.add('hw-done');
        Quill.hide();
        resolve();
    };
    const fallback = () => {
        el.innerHTML = `<span class="hand-fallback" style="font-size:${Math.round(size * 1.15)}px;text-align:${align}">${esc(text)}</span>`;
        ctl.finish();
    };
    patchVara();
    if (!window.Vara || !window.HANDWRITING_FONT || reduceMotion || !el.isConnected){ fallback(); return ctl; }
    el.innerHTML = '';
    el.classList.remove('hw-done');
    el.classList.add('hand');
    if (!el.id) el.id = 'hw' + (++hwSeq);
    const dur = opts.duration || Math.max(1300, text.replace(/\s/g, '').length * 130);
    let v;
    try {
        v = new window.Vara('#' + el.id, '', [{ text, fontSize: size, strokeWidth: opts.stroke || 1.3, color, duration: dur, textAlign: align }], { textAlign: align });
    } catch (e){ fallback(); return ctl; }
    v.ready(() => {
        if (ctl.done) return;
        try { kernHandwriting(el, v, size, align); } catch (e){ /* keep default spacing */ }
        const paths = Array.from(el.querySelectorAll('path')).filter(p => p.getAttribute('stroke') !== 'transparent');
        const lens = paths.map(p => p.getTotalLength());
        const track = () => {
            if (ctl.done || !el.isConnected){ Quill.hide(); return; }
            let cur = null, pos = 0;
            for (let k = 0; k < paths.length; k++){
                const off = parseFloat(paths[k].style.strokeDashoffset);
                if (off > lens[k]){ cur = paths[k]; pos = 0; break; }
                if (off > .05){ cur = paths[k]; pos = lens[k] - off; break; }
            }
            if (cur){
                const pt = cur.getPointAtLength(Math.max(0, pos));
                const m = cur.getScreenCTM();
                if (m) Quill.at(m.a * pt.x + m.c * pt.y + m.e, m.b * pt.x + m.d * pt.y + m.f);
            }
            raf = requestAnimationFrame(track);
        };
        raf = requestAnimationFrame(track);
    });
    v.animationEnd(() => setTimeout(ctl.finish, 120));
    safety = setTimeout(ctl.finish, dur + 5000);
    return ctl;
}

/* Bursts of gold sparks */
function sparks(x, y, opts = {}){
    if (reduceMotion) return;
    const n = opts.count || 24;
    const colors = opts.colors || ['#f1cf7a', '#fff3c4', '#c9a24a'];
    const spread = opts.spread || 110;
    for (let i = 0; i < n; i++){
        const s = document.createElement('span');
        s.className = 'spark';
        const a = Math.random() * Math.PI * 2;
        const d = spread * (.35 + Math.random() * .85);
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1) + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * d + 20).toFixed(1) + 'px');
        s.style.background = colors[i % colors.length];
        s.style.color = colors[i % colors.length];
        const sz = 2 + Math.random() * 3.5;
        s.style.width = sz + 'px'; s.style.height = sz + 'px';
        s.style.animationDuration = (550 + Math.random() * 650) + 'ms';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1300);
    }
}
function sparksAt(el, opts){
    if (!el) return;
    const r = el.getBoundingClientRect();
    sparks(r.left + r.width / 2, r.top + r.height / 2, opts);
}

/* Organic ink blot outline */
function blobPath(cx, cy, r, seed){
    const rnd = seeded(seed);
    const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
    const n = 72;
    let d = '';
    for (let i = 0; i <= n; i++){
        const a = i / n * Math.PI * 2;
        let rr = r * (1 + .12 * Math.sin(3 * a + ph[0]) + .07 * Math.sin(7 * a + ph[1]) + .04 * Math.sin(13 * a + ph[2]));
        if (i % 9 === 4 && rnd() < .7) rr *= 1.18 + rnd() * .25;
        d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2) + ' ';
    }
    return d + 'Z';
}

/* Shake a screen */
function quake(el){
    if (reduceMotion || !el) return;
    el.classList.remove('quake'); void el.offsetWidth; el.classList.add('quake');
    setTimeout(() => el.classList.remove('quake'), 600);
}

/* Ink wipe + gold-foil chapter title between chapters */
const CHAPTER_TITLES = {
    courtyard: ['Chapter One', 'The Courtyard'],
    interro: ['Chapter Two', 'The Interrogations'],
    gate: ['Interlude', 'The Portrait Gate'],
    board: ['Chapter Three', 'The Evidence Board'],
    vault: ['Chapter Four', 'The Vault Cipher'],
    accuse: ['The Finale', 'The Accusation']
};
const InkWipe = {
    el: null, busy: false,
    build(){
        if (this.el) return this.el;
        const w = document.createElement('div');
        w.className = 'ink-wipe';
        w.hidden = true;
        w.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="blob b1" d="${blobPath(50, 50, 16, 3)}"/><path class="blob b2" d="${blobPath(18, 28, 12, 8)}"/><path class="blob b3" d="${blobPath(84, 74, 12, 13)}"/><path class="blob b4" d="${blobPath(80, 18, 9, 21)}"/></svg>
            <div class="wipe-title"><p class="wipe-kicker"></p><h2 class="wipe-name foil"></h2><span class="wipe-rule"></span></div>`;
        document.body.appendChild(w);
        this.el = w;
        return w;
    }
};
async function transitionTo(stage){
    const t = CHAPTER_TITLES[stage];
    if (reduceMotion || !t){ go(stage); return; }
    if (InkWipe.busy) return;
    InkWipe.busy = true;
    const w = InkWipe.build();
    w.querySelector('.wipe-kicker').textContent = t[0];
    w.querySelector('.wipe-name').textContent = t[1];
    w.className = 'ink-wipe';
    w.hidden = false;
    void w.offsetWidth;
    w.classList.add('in');
    Sound.sfx('whoosh');
    await sleep(950);
    go(stage, { noBrief: true });
    w.classList.add('titled');
    Sound.sfx('reveal');
    await sleep(2100);
    w.classList.add('out');
    await sleep(850);
    w.hidden = true;
    w.className = 'ink-wipe';
    InkWipe.busy = false;
    if (BRIEFS[stage] && !S.briefed[stage]) showBrief(stage);
}

/* ---------- HUD ---------- */
const HUD = {
    show(label){ $('#hud').hidden = false; $('#hudChapter').textContent = label; this.pips(); },
    hide(){ $('#hud').hidden = true; },
    pips(){
        $('#hintPips').innerHTML = [0, 1, 2].map(i => `<span class="pip ${i < 3 - S.hintsLeft ? 'used' : ''}">${ART.feather_pip}</span>`).join('');
    }
};

/* =========================================================
   STAGE FLOW
   ========================================================= */
const STAGE_LABEL = {
    comic: 'Prologue',
    courtyard: 'Chapter 1 · The Courtyard',
    interro: 'Chapter 2 · The Interrogations',
    gate: 'The Portrait Gate',
    board: 'Chapter 3 · The Evidence Board',
    vault: 'Chapter 4 · The Vault Cipher',
    accuse: 'The Accusation',
    reveal: 'Case File 11:59',
    after: 'Case closed'
};

function go(stage, opts = {}){
    S.stage = stage;
    save();
    Courtyard.stop();
    switch (stage){
        case 'comic':
            HUD.hide(); Rain.start(); Sound.startScore(); Sound.setTension(0);
            showScreen('comic-screen'); Comic.start(); break;
        case 'courtyard':
            HUD.show(STAGE_LABEL.courtyard); Rain.start(); Sound.startScore(); Sound.setTension(1);
            showScreen('courtyard-screen'); Courtyard.start(); break;
        case 'interro':
            HUD.show(STAGE_LABEL.interro); Rain.start(); Sound.startScore(); Sound.setTension(2);
            showScreen('interro-screen'); Interro.start(); break;
        case 'gate':
            HUD.show(STAGE_LABEL.gate); Rain.start(); Sound.startScore(); Sound.setTension(3);
            showScreen('gate-screen'); Gate.start(); break;
        case 'board':
            HUD.show(STAGE_LABEL.board); Rain.start(); Sound.startScore(); Sound.setTension(4);
            showScreen('board-screen'); Board.start(); break;
        case 'vault':
            HUD.show(STAGE_LABEL.vault); Rain.start(); Sound.startScore(); Sound.setTension(5);
            showScreen('vault-screen'); Vault.start(); break;
        case 'accuse':
            HUD.show(STAGE_LABEL.accuse); Rain.start(); Sound.startScore(); Sound.setTension(6);
            showScreen('accuse-screen'); Accuse.start(); break;
        case 'reveal':
            HUD.hide(); showScreen('reveal-screen'); Reveal.run(); break;
        case 'after':
            HUD.hide(); Rain.stop(); After.start(); break;
    }
    if (!opts.noBrief && BRIEFS[stage] && !S.briefed[stage]) setTimeout(() => showBrief(stage), 500);
}

/* =========================================================
   COVER
   ========================================================= */
const Cover = {
    taps: 0, tapTimer: null,
    init(){
        $('#openFileBtn').addEventListener('click', async () => {
            if (this.opening) return;
            this.opening = true;
            if (S.stage === 'done' || S.stage === 'after'){ resetSave(); HUD.pips(); }
            const stage = S.stage === 'cover' ? 'comic' : S.stage;
            if (stage !== 'after') Sound.startScore();
            Sound.sfx('whoosh');
            sparksAt($('#openFileBtn'), { count: 34, spread: 140 });
            const folder = $('.folder');
            if (!reduceMotion){ folder.classList.add('opening'); await sleep(820); }
            if (CHAPTER_TITLES[stage]) transitionTo(stage);
            else go(stage);
            setTimeout(() => { folder.classList.remove('opening'); this.opening = false; }, 600);
        });
        setTimeout(() => {
            if ($('#cover-screen').classList.contains('active')){
                const forEl = $('#folderFor');
                handwrite(forEl, `For the eyes of Detective ${CONFIG.detective} only.`, { size: Math.min(30, Math.max(22, window.innerWidth / 22)), align: 'center', color: '#f6e6bd', duration: 2600 });
            }
        }, 1500);
        $('#classifiedStamp').addEventListener('click', () => {
            this.taps++;
            clearTimeout(this.tapTimer);
            this.tapTimer = setTimeout(() => { this.taps = 0; }, 2500);
            if (this.taps >= 5){
                this.taps = 0;
                resetSave();
                HUD.pips();
                this.refresh();
                toast('Case file reset. Starting fresh.');
            }
        });
        this.refresh();
    },
    refresh(){
        const btn = $('#openFileBtn'), note = $('#resumeNote');
        if (S.stage === 'done' || S.stage === 'after'){
            btn.textContent = 'Play again';
            note.hidden = false;
            note.textContent = 'Case closed. Tap to start a fresh investigation.';
        } else if (S.stage && S.stage !== 'cover'){
            btn.textContent = 'Resume the case';
            note.hidden = false;
            note.textContent = 'Saved at: ' + (STAGE_LABEL[S.stage] || 'the beginning');
        } else {
            btn.textContent = 'Open the file';
            note.hidden = true;
        }
    }
};

/* =========================================================
   COMIC INTRO
   ========================================================= */
const Comic = {
    i: 0, typer: null,
    panels: [
        { art: 'castlePanel', caption: '11:47 PM. Rain had been falling on the castle since sundown.' },
        { art: 'owlWindow', caption: "An owl doesn't knock this late unless someone is dead." },
        { letter: "Detective Kriti,\n\nHagrid has been found at the foot of the clock tower. Every clock in the castle stopped at 11:59. Four people were in the tower tonight.\n\nFind out what happened to him. Come alone.", sign: 'The Headmistress' },
        { lineup: true, caption: 'Four suspects. Four alibis. Not one of them is telling the truth.' },
        { who: 'kriti', speaker: 'Detective Kriti', text: "Then nobody leaves this courtyard until I know who's lying." },
        { who: 'ember', speaker: 'Ember', text: "Hoo. I'll be up here if you need a hint. You won't. But I'll be here." },
        { take: true }
    ],
    start(){ this.i = 0; this.render(); },
    render(){
        const p = this.panels[this.i];
        const el = $('#comicPanel');
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
        let html = '', typeText = null;
        if (p.art){
            html = `<div class="comic-art">${ART[p.art]}<div class="caption-box" data-type></div></div>`;
            typeText = p.caption;
        } else if (p.letter){
            html = `<div class="comic-art"><div class="scroll"><span class="scroll-rod top"></span><div class="letter-panel"><div data-letter></div><div class="letter-sign" id="letterSign"></div></div><span class="scroll-rod bottom"></span><div class="wax"><span class="half l"></span><span class="half r"></span></div></div></div>`;
        } else if (p.lineup){
            const four = [['thorne', 'Prof. Cassius Thorne'], ['wren', 'Wren Ashcroft'], ['crumb', 'Bonnie Crumb'], ['odessa', 'Odessa Vale']]
                .map(([id, n]) => `<div class="lineup-card">${portrait(id)}<span class="tag">${n}</span></div>`).join('');
            html = `<div class="comic-art lineup-art"><div class="caption-box static" data-type></div><div class="suspect-lineup">${four}</div></div>`;
            typeText = p.caption;
        } else if (p.who){
            const art = p.who === 'ember'
                ? `<div style="width:min(200px,45%);margin:24px auto 0">${ART.ember}</div>`
                : `<div style="width:min(230px,52%);margin:24px auto 0">${portrait('kriti')}</div>`;
            html = `<div class="comic-art" style="flex-direction:column;justify-content:flex-start;position:relative">${art}<div class="bubble" style="align-self:stretch"><span class="speaker">${esc(p.speaker)}</span><span data-type></span></div></div>`;
            typeText = p.text;
        } else if (p.take){
            html = `<div class="take-case"><p class="eyebrow">Case File 11:59</p><h3>Take the case?</h3><p class="chapter-sub">Four suspects. One tower. Every clock stopped at 11:59.</p><button id="lumosBtn" class="btn primary" type="button">Lumos</button></div>`;
        }
        el.innerHTML = html;
        wirePortraits(el);
        $('#comicCount').textContent = p.take ? '' : `Panel ${this.i + 1} of 6`;
        $('.comic-tap').style.visibility = p.take ? 'hidden' : 'visible';
        if (typeText){
            this.typer = inkWrite(el.querySelector('[data-type]'), typeText, { speed: 70 });
        } else if (p.letter){
            this.typer = this.letterSequence(el, p);
        } else this.typer = null;
        if (p.take){
            $('#lumosBtn').addEventListener('click', e => { e.stopPropagation(); Sound.sfx('reveal'); transitionTo('courtyard'); });
            setTimeout(() => $('#lumosBtn') && $('#lumosBtn').focus(), 100);
        }
    },
    letterSequence(el, p){
        const seq = { done: false, skip: false, cur: null, finish(){ this.skip = true; if (this.cur) this.cur.finish(); } };
        const wait = ms => seq.skip ? Promise.resolve() : sleep(ms);
        (async () => {
            const scroll = el.querySelector('.scroll');
            await wait(500);
            scroll.classList.add('cracked');
            Sound.sfx('crack');
            sparksAt(scroll.querySelector('.wax'), { count: 14, spread: 60, colors: ['#d0404a', '#9e1f29', '#f1cf7a'] });
            await wait(450);
            scroll.classList.add('open');
            Sound.sfx('page');
            await wait(850);
            if (!el.isConnected) return;
            seq.cur = inkWrite(el.querySelector('[data-letter]'), p.letter, { speed: 48 });
            if (seq.skip) seq.cur.finish();
            await seq.cur.promise;
            if (!el.isConnected) return;
            seq.cur = handwrite(el.querySelector('#letterSign'), p.sign, { size: 30, align: 'left', color: '#3a2410', stroke: 1.1, duration: 1800 });
            if (seq.skip) seq.cur.finish();
            await seq.cur.promise;
            seq.done = true;
        })();
        return seq;
    },
    advance(){
        const p = this.panels[this.i];
        if (p.take) return;
        if (this.typer && !this.typer.done){ this.typer.finish(); return; }
        this.i = Math.min(this.i + 1, this.panels.length - 1);
        Sound.sfx('page');
        this.render();
    }
};

/* =========================================================
   CHAPTER 1: THE COURTYARD
   ========================================================= */
const CLUES = {
    c1: { name: 'Pocket watch', note: 'Stopped at 11:59. Engraved C.T. on the back. Still warm.', x: 15, y: 87.5, w: 7, thought: 'C.T. Only one person in the castle has those initials: Professor Cassius Thorne.', icon: 'watch', where: 'the flagstones at the far left' },
    c2: { name: 'Empty vial', note: 'Torn label: "...ing Death". Greenhouse soil caked on the base.', x: 72, y: 80, w: 6.5, thought: 'A potion ending in "...ing Death". And that soil came from a greenhouse. Wren Ashcroft keeps Greenhouse Three.', icon: 'vial', where: 'the ground near the right-hand wall, past Fang' },
    c3: { name: 'Footprints', note: 'Four sets, to the tower door and back. No sign of a struggle. One set is dusted with flour.', x: 55.5, y: 87, w: 8, h: 22, thought: 'Four people walked to the tower and back, calmly. The flour points to the kitchens, and Bonnie Crumb.', icon: 'prints', hold: true, hidden: true, where: 'the stones between Hagrid and Fang (hold your light still there)' },
    c4: { name: 'Overturned goblet', note: 'Sticky orange residue. Pumpkin juice, and something bitter underneath.', x: 26, y: 77.5, w: 7, thought: 'Hagrid drank something just before he fell. Someone put it in his juice.', icon: 'goblet', where: "beside Hagrid's outstretched hand" },
    c5: { name: 'Scorched parchment', note: 'Stamped "Restricted Section". One line of scrambled letters; the rest has burnt away.', x: 11, y: 58.75, w: 7, thought: 'Only one person stamps things "Restricted Section": the archivist, Odessa Vale.', icon: 'parchment', where: 'the left wall, caught by the wind' },
    c6: { name: 'Fang', note: "He isn't howling over his master. He's wagging.", x: 64, y: 73.5, w: 10, h: 10.4, thought: 'If Hagrid were really dead, Fang would be howling. Is Hagrid dead at all?', icon: 'fang', hold: true, where: 'Fang himself (hold your light on him)', pre: 'Fang lies beside his master, very still. Keep the light on him.' },
    c7: { name: 'Reflection in the puddle', note: 'The tower clock reads 11:59. Its hour hand is wedged in place with a wand.', x: 83, y: 91.25, w: 24, h: 11, thought: 'Someone stopped the tower clock by hand, on purpose, at 11:59. A potions master who lives by the clock?', icon: 'puddle', hotspot: true, where: 'the puddle at the front right' },
    r1: { name: 'Broken broomstick', note: 'Cobwebs on the snapped end. This has been lying here for weeks.', x: 90, y: 62.5, w: 7, thought: 'Did someone fall from a broom tonight? Or did this break long ago?', icon: 'broom', where: 'against the right-hand wall' },
    r2: { name: 'Black feather', note: 'A raven feather. No ravens nest in this tower.', x: 33, y: 93.5, w: 6, thought: 'Ravens don\'t nest here. So who, or what, left it?', icon: 'feather', where: 'the ground in front of Hagrid' }
};
const CLUE_ORDER = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'r1', 'r2'];
const REAL_CLUES = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];

const Courtyard = {
    built: false, active: false,
    beam: { x: 0, y: 0, set: false }, r: 100,
    hold: {}, revealed: {},
    nextFlicker: 0, flickerUntil: 0, last: 0,

    build(){
        const sc = $('#scene');
        const clues = CLUE_ORDER.map(id => {
            const c = CLUES[id];
            const h = c.h || c.w * 1.25;
            const cls = ['clue', c.hidden ? 'hidden-clue' : '', c.hotspot ? 'hotspot' : ''].join(' ');
            return `<button type="button" class="${cls}" data-id="${id}" style="left:${c.x}%;top:${c.y}%;width:${c.w}%;height:${h}%" aria-label="Something in the dark">${c.hotspot ? '' : ART[c.icon]}${c.hold ? '<span class="shimmer"></span>' : ''}</button>`;
        }).join('');
        sc.innerHTML = ART.courtyard + clues +
            `<button type="button" class="clue hotspot" data-id="hagrid" style="left:40%;top:73%;width:22%;height:10%" aria-label="Hagrid"></button>` +
            `<div class="scene-glow"></div><div class="scene-dark"></div><canvas class="scene-dust" aria-hidden="true"></canvas>`;

        const setPos = e => {
            const r = sc.getBoundingClientRect();
            this.beam.x = Math.max(0, Math.min(r.width, e.clientX - r.left));
            this.beam.y = Math.max(0, Math.min(r.height, e.clientY - r.top));
            this.beam.set = true;
        };
        sc.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) setPos(e); });
        sc.addEventListener('pointerdown', setPos);
        sc.addEventListener('click', e => {
            const el = e.target.closest('.clue');
            if (el) this.tap(el.dataset.id, el);
        });
        this.built = true;
    },

    start(){
        if (!this.built) this.build();
        this.active = true;
        S.found.forEach(id => {
            const el = $(`#scene .clue[data-id="${id}"]`);
            if (el){ el.classList.add('found'); this.revealed[id] = true; el.classList.add('revealed'); }
        });
        if (!this.beam.set){
            const r = $('#scene').getBoundingClientRect();
            this.beam.x = r.width * .5; this.beam.y = r.height * .62;
        }
        this.renderSatchel();
        this.last = performance.now();
        this.nextFlicker = this.last + 12000;
        requestAnimationFrame(t => this.frame(t));
        if (S.found.length === CLUE_ORDER.length) setTimeout(() => this.complete(), 500);
    },

    stop(){ this.active = false; },

    centerOf(id, rect){
        if (id === 'hagrid') return { x: rect.width * .40, y: rect.height * .73, size: rect.width * .1 };
        const c = CLUES[id];
        return { x: rect.width * c.x / 100, y: rect.height * c.y / 100, size: Math.min(rect.width * c.w / 100, rect.height * (c.h || c.w * 1.25) / 100) };
    },

    isLit(id, rect){
        const p = this.centerOf(id, rect);
        const d = Math.hypot(p.x - this.beam.x, p.y - this.beam.y);
        return d < this.r * .7 + p.size * .3;
    },

    frame(now){
        if (!this.active) return;
        const dt = Math.min(64, now - this.last); this.last = now;
        const sc = $('#scene');
        const rect = sc.getBoundingClientRect();
        if (rect.width === 0){ requestAnimationFrame(t => this.frame(t)); return; }
        const base = Math.max(54, rect.width * .12);
        let f = 1;
        if (!reduceMotion){
            if (now > this.nextFlicker){ this.flickerUntil = now + 1400; this.nextFlicker = now + 14000 + Math.random() * 9000; }
            f = now < this.flickerUntil ? .4 + Math.random() * .14 : 1 + Math.sin(now / 170) * .02;
        }
        this.r = base * f;
        this.drawDust(dt, rect);
        sc.style.setProperty('--r', this.r.toFixed(1) + 'px');
        sc.style.setProperty('--x', this.beam.x.toFixed(1) + 'px');
        sc.style.setProperty('--y', this.beam.y.toFixed(1) + 'px');

        sc.querySelectorAll('.clue').forEach(el => {
            const id = el.dataset.id;
            const lit = this.isLit(id, rect);
            el.classList.toggle('lit', lit && !S.found.includes(id));
            const c = CLUES[id];
            if (c && !c.hotspot){
                const p = this.centerOf(id, rect);
                const d = Math.hypot(p.x - this.beam.x, p.y - this.beam.y) - p.size * .3;
                const vis = Math.max(0, Math.min(1, 1 - (d - this.r * .45) / (this.r * .55)));
                el.style.opacity = (S.found.includes(id) ? vis * .4 : vis).toFixed(2);
            }
            if (c && c.hold && !this.revealed[id]){
                this.hold[id] = this.hold[id] || 0;
                if (lit) this.hold[id] += dt;
                else this.hold[id] = Math.max(0, this.hold[id] - dt * 1.5);
                el.style.setProperty('--p', Math.min(1, this.hold[id] / 2000).toFixed(2));
                if (this.hold[id] >= 2000){
                    this.revealed[id] = true;
                    el.classList.add('revealed');
                    Sound.sfx('reveal');
                    sparksAt(el, { count: 18, spread: 70 });
                    toast('Revelio. Something shows itself.');
                }
            }
        });
        requestAnimationFrame(t => this.frame(t));
    },

    drawDust(dt, rect){
        const cv = $('#scene .scene-dust');
        if (!cv) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
        if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
        const ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (reduceMotion) return;
        if (!this.motes){
            this.motes = Array.from({ length: 48 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00003, vy: -Math.random() * .00002 - .000006, s: .6 + Math.random() * 1.6, tw: Math.random() * 6.28 }));
            this.trail = [];
        }
        const bx = this.beam.x, by = this.beam.y, r = this.r;
        for (const m of this.motes){
            m.x += m.vx * dt; m.y += m.vy * dt; m.tw += dt * .004;
            if (m.y < 0) m.y = 1;
            if (m.x < 0) m.x = 1;
            if (m.x > 1) m.x = 0;
            const x = m.x * rect.width, y = m.y * rect.height;
            const d = Math.hypot(x - bx, y - by);
            if (d > r) continue;
            const a = (1 - d / r) * (.55 + .45 * Math.sin(m.tw));
            ctx.fillStyle = `rgba(255,236,180,${(a * .9).toFixed(3)})`;
            ctx.beginPath(); ctx.arc(x, y, m.s, 0, 6.283); ctx.fill();
        }
        const moved = Math.hypot(bx - (this.lastBx === undefined ? bx : this.lastBx), by - (this.lastBy === undefined ? by : this.lastBy));
        this.lastBx = bx; this.lastBy = by;
        if (moved > 1.5){
            for (let k = 0; k < 2; k++){
                this.trail.push({ x: bx + (Math.random() - .5) * 8, y: by + (Math.random() - .5) * 8, vx: (Math.random() - .5) * .03, vy: Math.random() * .03 + .006, life: 1, s: .8 + Math.random() * 1.6 });
            }
        }
        for (let k = this.trail.length - 1; k >= 0; k--){
            const p = this.trail[k];
            p.life -= dt / 1300;
            if (p.life <= 0){ this.trail.splice(k, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            ctx.fillStyle = `rgba(241,207,122,${(p.life * .9).toFixed(3)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.s * p.life + .3, 0, 6.283); ctx.fill();
        }
        if (this.trail.length > 180) this.trail.splice(0, this.trail.length - 180);
    },

    tap(id, el){
        if (modalOpen()) return;
        const rect = $('#scene').getBoundingClientRect();
        if (id === 'hagrid'){
            if (!this.isLit(id, rect)) return;
            modal({ title: 'Hagrid', html: typed('Cold to the touch. No pulse you can find. And not a single wound.'), buttons: [{ label: 'Step back' }] });
            return;
        }
        const c = CLUES[id];
        if (S.found.includes(id)){ this.showNote(id); return; }
        if (!this.isLit(id, rect)) return;
        if (c.hold && !this.revealed[id]){
            toast(c.pre || "Something's here. Hold your light still.");
            return;
        }
        S.found.push(id);
        save();
        el.classList.add('found');
        Sound.sfx('clue');
        this.renderSatchel();
        const last = S.found.length === CLUE_ORDER.length;
        modal({ art: ART[c.icon], title: c.name, html: clueHtml(c), flip: true, burst: true, buttons: [{ label: last ? 'Close the satchel' : 'Into the satchel' }] })
            .then(() => { if (last) this.complete(); });
    },

    showNote(id){
        const c = CLUES[id];
        modal({ art: ART[c.icon], title: c.name, html: clueHtml(c), buttons: [{ label: 'Close' }] });
    },

    renderSatchel(){
        $('#evidenceCount').textContent = `Evidence ${S.found.length} / ${CLUE_ORDER.length}`;
        const slots = $('#satchelSlots');
        slots.innerHTML = Array.from({ length: CLUE_ORDER.length }, (_, i) => {
            const id = S.found[i];
            return id
                ? `<button type="button" class="slot filled" data-id="${id}" aria-label="${esc(CLUES[id].name)}">${ART[CLUES[id].icon]}</button>`
                : `<div class="slot" aria-hidden="true"></div>`;
        }).join('');
        slots.querySelectorAll('button.slot').forEach(b => b.addEventListener('click', () => this.showNote(b.dataset.id)));
    },

    async complete(){
        if (S.stage !== 'courtyard') return;
        await modal({
            art: portrait('kriti'),
            title: 'The courtyard is done talking',
            html: said('Detective Kriti', "A watch marked C.T. A vial of something deadly-sounding. Floury footprints. A Restricted Section parchment. And a dog who isn't grieving. Something about this death is wrong.") + said('Ember', 'Hoo. Every clue points at someone. Four suspects are waiting in the Great Hall. Each of them will lie to you once.'),
            buttons: [{ label: 'Bring them in' }]
        });
        transitionTo('interro');
    }
};

/* =========================================================
   CHAPTER 2: THE INTERROGATIONS
   ========================================================= */
const SUSPECTS = {
    thorne: {
        name: 'Professor Cassius Thorne', short: 'Thorne', role: 'Potions master, exiled to the dungeons',
        quirk: 'Checks his pocket watch mid-sentence. Or tries to.',
        stmts: [
            { t: 'I was in the dungeons from ten until well past midnight.', p: "That brew needs stirring every minute for ninety minutes. I couldn't leave if I wanted to." },
            { t: 'I never left. Not once.', p: 'He reaches into his waistcoat for his watch. His hand comes out empty.', narr: true },
            { t: 'Punctuality is the only virtue left in this castle.', p: 'Every clock in this castle keeps my time. Or it did, until tonight.' }
        ],
        answer: { s: 1, clue: 'c1' },
        wrong: ['That proves nothing, Detective. Do try harder.', 'Is that the best you have?', 'I fail to see the relevance.'],
        confession: "...Fine. I was in the courtyard. I brewed a Draught of Living Death tonight, and someone had to make sure every clock stopped exactly on time."
    },
    wren: {
        name: 'Wren Ashcroft', short: 'Wren', role: 'Keeper of Greenhouse Three',
        quirk: 'Talks to his plants. Hums when nervous.',
        stmts: [
            { t: 'Greenhouse Three, all night. The Mandrakes needed repotting.', p: 'I wore earmuffs the whole time. Mandrakes scream, you know. I heard nothing.' },
            { t: "I haven't touched a potion vial in years. Plants, Detective. Only plants.", p: 'He starts humming. Loudly.', narr: true },
            { t: "I didn't even hear the clocks stop.", p: 'Greenhouse walls are thick. Glass, but thick.' }
        ],
        answer: { s: 1, clue: 'c2' },
        wrong: ['That has nothing to do with me.', 'Why would I know anything about that?', 'My Mandrakes could tell you that means nothing.'],
        confession: "The asphodel and the wormwood came from my greenhouse. I carried the vial up myself. That's all I'm saying."
    },
    crumb: {
        name: 'Bonnie Crumb', short: 'Bonnie', role: 'Night cook in the castle kitchens',
        quirk: "Always eating. Eats faster when she's hiding something.",
        stmts: [
            { t: 'Kitchens, all night. Twelve trays of rock cakes, ask anyone.', p: "Thirteen, if you count the one I'm holding." },
            { t: 'I never went near that tower. Never.', p: 'She takes a very large bite of something.', narr: true },
            { t: "Hagrid? Last saw him at supper. Three goblets of pumpkin juice. Well, two. The third one wasn't... never mind.", p: 'Forget I said that. Rock cake?' }
        ],
        answer: { s: 1, clue: 'c3' },
        wrong: ["That's not... I mean, so what?", 'Never seen it. Rock cake?', 'You can\'t pin that on a cook.'],
        confession: "Alright! I put it in his juice and I helped carry him. Four of us did. He's heavier than he looks."
    },
    odessa: {
        name: 'Odessa Vale', short: 'Odessa', role: 'Archivist of the Restricted Section',
        quirk: 'Remembers everything. Answers questions with questions.',
        stmts: [
            { t: 'The library, cataloguing until the candles burned out.', p: 'The candles in the Restricted Section burn for exactly two hours. Did you know that? I lit them at ten.' },
            { t: "I've never seen this parchment before.", p: 'Have you? Seen it before, I mean?' },
            { t: 'Ask yourself, Detective: who gains anything from a stopped clock?', p: "Clocks don't stop themselves. People stop them." }
        ],
        answer: { s: 1, clue: 'c5' },
        wrong: ['And what, exactly, do you think that proves?', 'Is that a question, Detective? Or a guess?', 'Do you always argue with the wrong evidence?'],
        confession: 'The stamp is mine. The note is mine. The vault is sealed, and only the right answer opens it. I wrote the riddle. You\'ll have to earn the key.'
    }
};
const SUSPECT_ORDER = ['thorne', 'wren', 'crumb', 'odessa'];

const Interro = {
    cur: null, si: 0, pressed: {}, wands: {},
    start(){
        SUSPECT_ORDER.forEach(id => { if (this.wands[id] === undefined) this.wands[id] = 5; });
        if (!this.cur) this.cur = SUSPECT_ORDER.find(id => !S.broken.includes(id)) || 'thorne';
        this.render();
        if (S.broken.length === 4) setTimeout(() => this.finish(), 400);
    },
    select(id){ this.cur = id; this.si = 0; Sound.sfx('page'); this.render(); },
    render(){
        $('#suspectTabs').innerHTML = SUSPECT_ORDER.map(id => {
            const b = S.broken.includes(id);
            return `<button type="button" class="suspect-tab ${id === this.cur ? 'active' : ''} ${b ? 'broken' : ''}" data-id="${id}">${portrait(id)}<span class="st-text"><span class="st-name">${esc(SUSPECTS[id].short)}</span><span class="st-state">${b ? 'Confessed' : 'Lying'}</span></span></button>`;
        }).join('');
        $$('#suspectTabs .suspect-tab').forEach(b => b.addEventListener('click', () => this.select(b.dataset.id)));
        wirePortraits($('#suspectTabs'));

        const sp = SUSPECTS[this.cur];
        const stage = $('#interroStage');
        const who = `<div class="who">${portrait(this.cur)}<h3>${esc(sp.name)}</h3><span class="who-role">${esc(sp.role)}</span><span class="who-quirk">${esc(sp.quirk)}</span></div>`;

        if (S.broken.includes(this.cur)){
            stage.innerHTML = `<div class="interro-panel">${who}<div><p class="eyebrow">Confession</p><p class="confession" style="margin-top:10px">${esc(sp.confession)}</p></div></div>`;
            wirePortraits(stage);
            return;
        }
        const st = sp.stmts[this.si];
        const key = this.cur + this.si;
        const press = this.pressed[key]
            ? `<div class="bubble press-bubble">${st.narr ? `<span class="speaker">Detective's note</span><em>${esc(st.p)}</em>` : `<span class="speaker">${esc(sp.short)}, pressed</span>${esc(st.p)}`}</div>`
            : '';
        const wands = Array.from({ length: 5 }, (_, i) => `<span class="wand ${i >= this.wands[this.cur] ? 'lost' : ''}"></span>`).join('');
        stage.innerHTML = `
            <div class="interro-panel" id="interroPanel">
                ${who}
                <div>
                    <div class="bubble"><span class="speaker">${esc(sp.short)}</span>${esc(st.t)}</div>
                    ${press}
                    <div class="statement-nav">
                        <button type="button" id="prevStmt" aria-label="Previous statement">&lsaquo;</button>
                        <span>Statement ${this.si + 1} of 3</span>
                        <button type="button" id="nextStmt" aria-label="Next statement">&rsaquo;</button>
                    </div>
                </div>
            </div>
            <div class="interro-actions">
                <div class="wands" aria-label="Credibility">Credibility ${wands}</div>
                <div class="btns">
                    <button type="button" class="btn" id="pressBtn">Press</button>
                    <button type="button" class="btn danger" id="exposeBtn">Expose</button>
                </div>
            </div>`;
        wirePortraits(stage);
        $('#prevStmt').addEventListener('click', () => { this.si = (this.si + 2) % 3; Sound.sfx('click'); this.render(); });
        $('#nextStmt').addEventListener('click', () => { this.si = (this.si + 1) % 3; Sound.sfx('click'); this.render(); });
        $('#pressBtn').addEventListener('click', () => { this.pressed[key] = true; Sound.sfx('page'); this.render(); });
        $('#exposeBtn').addEventListener('click', () => this.expose());
    },

    async expose(){
        const cards = S.found.map(id => `<button type="button" class="ev-card" data-id="${id}">${ART[CLUES[id].icon]}<span>${esc(CLUES[id].name)}</span></button>`).join('');
        const p = modal({
            title: 'Present evidence',
            html: `<p>Which piece of evidence contradicts this statement?</p><p class="said">"${esc(SUSPECTS[this.cur].stmts[this.si].t)}"</p><div class="evidence-pick">${cards}</div>`,
            buttons: [{ label: 'Cancel', value: null, cls: 'ghost' }]
        });
        $$('#modalText .ev-card').forEach(b => b.addEventListener('click', () => modalDone(b.dataset.id)));
        const pick = await p;
        if (!pick) return;
        const sp = SUSPECTS[this.cur];
        if (this.si === sp.answer.s && pick === sp.answer.clue){
            Sound.sfx('slam');
            const panel = $('#interroPanel');
            if (panel){
                panel.insertAdjacentHTML('beforeend', `<svg class="ink-splash" viewBox="0 0 100 100" aria-hidden="true"><path d="${blobPath(50, 50, 24, 40 + S.broken.length * 7)}"/></svg><div class="exposed-slam">EXPOSED</div>`);
                sparksAt(panel, { count: 44, spread: 200, colors: ['#d0404a', '#9e1f29', '#f1cf7a'] });
            }
            quake($('#interro-screen'));
            S.broken.push(this.cur);
            save();
            await sleep(1500);
            await modal({ art: portrait(this.cur), title: sp.name, html: said(sp.short, sp.confession), flip: true, buttons: [{ label: 'Next' }] });
            const next = SUSPECT_ORDER.find(id => !S.broken.includes(id));
            if (next){ this.cur = next; this.si = 0; this.render(); }
            else { this.render(); this.finish(); }
        } else {
            Sound.sfx('wrong');
            S.mistakes++;
            this.wands[this.cur]--;
            save();
            if (this.wands[this.cur] <= 0){
                await modal({ title: 'Credibility gone', html: `<p>${esc(sp.short)} has stopped talking. Your credibility is spent.</p><p>Start this interrogation again.</p>`, buttons: [{ label: 'Start again' }] });
                this.wands[this.cur] = 5;
                this.si = 0;
                Object.keys(this.pressed).forEach(k => { if (k.startsWith(this.cur)) delete this.pressed[k]; });
                this.render();
            } else {
                this.render();
                toast(`${sp.short}: "${sp.wrong[Math.floor(Math.random() * sp.wrong.length)]}"`, 3200);
            }
        }
    },

    async finish(){
        if (S.stage !== 'interro') return;
        await modal({
            art: portrait('kriti'),
            title: 'Four confessions',
            html: said('Detective Kriti', "Thorne brewed it. Wren grew it. Bonnie poured it. Odessa sealed something at the top of the tower. Four people, one plan.") + said('Detective Kriti', "And the Draught of Living Death doesn't kill anyone. It only makes you look dead.") + said('Ember', "Hoo. Then why fake a murder at all? The answer is at the top of the tower. The portrait at the door won't make it easy."),
            buttons: [{ label: 'To the tower' }]
        });
        transitionTo('gate');
    }
};

/* =========================================================
   THE PORTRAIT GATE
   ========================================================= */
const RIDDLES = [
    { q: 'What did Hagrid name the three-headed dog guarding the trapdoor?', o: ['Fang', 'Fluffy', 'Norbert', 'Aragog'], a: 1 },
    { q: 'Which potion makes the drinker appear dead?', o: ['Polyjuice Potion', 'Felix Felicis', 'Draught of Living Death', 'Amortentia'], a: 2 },
    { q: 'Which platform does the Hogwarts Express leave from?', o: ['Nine and a half', 'Nine and three-quarters', 'Ten and a quarter', 'Seven and three-quarters'], a: 1 },
    { q: "What is the core of Harry's wand?", o: ['Dragon heartstring', 'Unicorn hair', 'Phoenix feather', 'Thestral tail hair'], a: 2 },
    { q: 'What kind of creature is Buckbeak?', o: ['Thestral', 'Hippogriff', 'Griffin', 'Abraxan'], a: 1 },
    { q: 'Which house did the Sorting Hat consider for Harry before Gryffindor?', o: ['Ravenclaw', 'Hufflepuff', 'Slytherin', 'It never hesitated'], a: 2 },
    { q: "What was the name of Hagrid's baby dragon in the first book?", o: ['Norbert', 'Fawkes', 'Errol', 'Crookshanks'], a: 0 },
    { q: "What form does Hermione's Patronus take?", o: ['A cat', 'An otter', 'A hare', 'A swan'], a: 1 }
];

const Gate = {
    set: [], qi: 0, struck: [], busy: false,
    start(){ this.newSet(); this.render("Who disturbs my sleep at this hour? Three questions, Detective. Answer all three, or go back to the rain."); },
    newSet(){
        const pool = RIDDLES.map((_, i) => i).sort(() => Math.random() - .5);
        this.set = pool.slice(0, 3);
        this.qi = 0; this.struck = [];
    },
    render(line){
        const r = RIDDLES[this.set[this.qi]];
        $('#gateStage').innerHTML = `
            <div class="morwen">${ART.morwen}</div>
            <div class="riddle-box">
                <p class="morwen-says" id="morwenSays">${esc(line || '')}</p>
                <p class="riddle-count">Riddle ${this.qi + 1} of 3 &middot; Lady Morwen</p>
                <p class="riddle-q">${esc(r.q)}</p>
                <div class="options">${r.o.map((o, i) => `<button type="button" class="opt ${this.struck.includes(i) ? 'struck' : ''}" data-i="${i}">${esc(o)}</button>`).join('')}</div>
            </div>`;
        $$('#gateStage .opt').forEach(b => b.addEventListener('click', () => this.answer(+b.dataset.i, b)));
    },
    async answer(i, btn){
        if (this.busy) return;
        this.busy = true;
        const r = RIDDLES[this.set[this.qi]];
        if (i === r.a){
            btn.classList.add('right');
            Sound.sfx('click');
            await sleep(650);
            this.qi++; this.struck = [];
            if (this.qi >= 3){
                Sound.sfx('unlock');
                $('#morwenSays').textContent = 'Very well. Mind the stairs, Detective.';
                await sleep(700);
                $('.morwen').classList.add('swing');
                Sound.sfx('whoosh');
                sparksAt($('.morwen'), { count: 36, spread: 170 });
                await sleep(1300);
                this.busy = false;
                await modal({ art: ART.morwen, title: 'The portrait swings open', html: typed('Behind it, a spiral stair. At the top, a room you have never seen: a corkboard, red string, and every piece of tonight laid out waiting.'), buttons: [{ label: 'Climb' }] });
                transitionTo('board');
                return;
            }
            this.render('Correct. Again.');
        } else {
            btn.classList.add('wrong');
            Sound.sfx('wrong');
            S.mistakes++; save();
            $('#morwenSays').textContent = "Wrong. I'll ask three new ones.";
            await sleep(1500);
            this.newSet();
            this.render('From the beginning, then.');
        }
        this.busy = false;
    },
    strike(){
        const r = RIDDLES[this.set[this.qi]];
        const wrong = r.o.map((_, i) => i).filter(i => i !== r.a && !this.struck.includes(i));
        wrong.sort(() => Math.random() - .5);
        this.struck.push(...wrong.slice(0, 2));
        this.render('Hmph. That owl is cheating.');
    }
};

/* =========================================================
   CHAPTER 3: THE EVIDENCE BOARD
   ========================================================= */
const EVENTS = {
    e1: 'Ingredients carried up from Greenhouse Three',
    e2: 'The Draught of Living Death is brewed',
    e3: "The draught goes into Hagrid's pumpkin juice",
    e4: 'Hagrid is carried to the foot of the tower',
    e5: 'The vault is sealed and a coded note left behind',
    e6: 'Every clock in the castle stops',
    d1: 'A curse is cast from the tower window',
    d2: 'Hagrid falls from the clock tower'
};
const EVENT_POOL_ORDER = ['e4', 'd1', 'e2', 'e6', 'e1', 'd2', 'e5', 'e3'];
const TIMES = ['11:20', '11:35', '11:45', '11:52', '11:58', '11:59'];
const TRUE_ORDER = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'];
const TARGETS = [
    { id: 'thorne', label: 'Thorne' }, { id: 'wren', label: 'Wren' }, { id: 'crumb', label: 'Bonnie' },
    { id: 'odessa', label: 'Odessa' }, { id: 'hagrid', label: 'Hagrid' }, { id: 'none', label: 'Irrelevant', tray: true }
];
const TRUE_LINKS = { c1: 'thorne', c7: 'thorne', c2: 'wren', c3: 'crumb', c4: 'crumb', c5: 'odessa', c6: 'hagrid', r1: 'none', r2: 'none' };

const Board = {
    selEvent: null, selEv: null, resizeBound: false,
    start(){
        if (!this.resizeBound){
            window.addEventListener('resize', () => { if (S.stage === 'board') this.drawStrings(); });
            this.resizeBound = true;
        }
        this.render();
        if (S.board.solved) setTimeout(() => this.solved(true), 400);
    },
    render(){
        const b = S.board;
        const pool = EVENT_POOL_ORDER.filter(e => !b.slots.includes(e));
        const slots = TIMES.map((t, i) => {
            const e = b.slots[i];
            return `<button type="button" class="tslot ${e ? 'filled' : ''} ${this.selEvent ? 'target' : ''}" data-i="${i}"><span class="time">${t}</span><span class="ev-text">${e ? esc(EVENTS[e]) : '&nbsp;'}</span></button>`;
        }).join('');
        const evRows = CLUE_ORDER.map(id => `<button type="button" class="ev-row ${this.selEv === id ? 'selected' : ''}" data-id="${id}">${ART[CLUES[id].icon]}<span>${esc(CLUES[id].name)}</span></button>`).join('');
        const tgs = TARGETS.map(t => `<button type="button" class="tg ${t.tray ? 'tray' : ''}" data-id="${t.id}">${esc(t.label)}</button>`).join('');
        $('#boardStage').innerHTML = `
            <div class="board-section">
                <h3>The night, in order</h3>
                <p class="board-help">Tap an event card, then tap the time it happened. Tap a placed card to take it back. Not every card belongs on the timeline.</p>
                <div class="timeline">${slots}</div>
                <div class="event-pool">${pool.map(e => `<button type="button" class="event-card ${this.selEvent === e ? 'selected' : ''}" data-e="${e}">${esc(EVENTS[e])}</button>`).join('') || '<span class="board-help">All cards placed.</span>'}</div>
            </div>
            <div class="board-section">
                <h3>Red string</h3>
                <p class="board-help">Tap a piece of evidence, then tap the person it points to. Evidence that points to no one goes in Irrelevant.</p>
                <div class="strings" id="strings">
                    <svg class="string-layer" id="stringLayer"></svg>
                    <div class="ev-col">${evRows}</div>
                    <div class="tg-col">${tgs}</div>
                </div>
            </div>
            <div class="board-foot">
                <p class="board-feedback" id="boardFeedback">${esc(this.lastFb || '')}</p>
                <button type="button" class="btn primary" id="pinBtn">Pin it</button>
            </div>`;
        if (b.solved) $('#boardStage').classList.add('solved');
        $$('#boardStage .event-card').forEach(el => el.addEventListener('click', () => {
            this.selEvent = this.selEvent === el.dataset.e ? null : el.dataset.e;
            Sound.sfx('click'); this.render();
        }));
        $$('#boardStage .tslot').forEach(el => el.addEventListener('click', () => this.slot(+el.dataset.i)));
        $$('#boardStage .ev-row').forEach(el => el.addEventListener('click', () => {
            this.selEv = this.selEv === el.dataset.id ? null : el.dataset.id;
            Sound.sfx('click'); this.render();
        }));
        $$('#boardStage .tg').forEach(el => el.addEventListener('click', () => this.link(el.dataset.id)));
        $('#pinBtn').addEventListener('click', () => this.check());
        requestAnimationFrame(() => this.drawStrings());
    },
    slot(i){
        const b = S.board;
        if (this.selEvent){
            b.slots[i] = this.selEvent;
            this.selEvent = null;
        } else if (b.slots[i]){
            b.slots[i] = null;
        } else {
            toast('Pick an event card first.');
            return;
        }
        Sound.sfx('click'); save(); this.render();
    },
    link(target){
        if (!this.selEv){ toast('Pick a piece of evidence first.'); return; }
        const links = S.board.links;
        if (links[this.selEv] === target) delete links[this.selEv];
        else links[this.selEv] = target;
        this.selEv = null;
        Sound.sfx('click'); save(); this.render();
    },
    drawStrings(){
        const wrap = $('#strings'), layer = $('#stringLayer');
        if (!wrap || !layer) return;
        const W = wrap.getBoundingClientRect();
        let paths = '';
        Object.entries(S.board.links).forEach(([ev, tg]) => {
            const a = wrap.querySelector(`.ev-row[data-id="${ev}"]`);
            const b = wrap.querySelector(`.tg[data-id="${tg}"]`);
            if (!a || !b) return;
            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            const x1 = ra.right - W.left, y1 = ra.top + ra.height / 2 - W.top;
            const x2 = rb.left - W.left, y2 = rb.top + rb.height / 2 - W.top;
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 18;
            const col = S.board.solved ? '#f1cf7a' : '#d0404a';
            paths += `<path class="string" d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" opacity=".9"/><circle cx="${x1}" cy="${y1}" r="3.5" fill="${col}"/>`;
        });
        layer.setAttribute('viewBox', `0 0 ${W.width} ${W.height}`);
        layer.innerHTML = paths;
    },
    check(){
        if (S.board.solved) return;
        const b = S.board;
        const evOK = b.slots.filter((e, i) => e === TRUE_ORDER[i]).length;
        const wrongStrings = REAL_CLUES.filter(id => b.links[id] !== TRUE_LINKS[id]).length;
        const herringBad = ['r1', 'r2'].filter(id => b.links[id] !== 'none').length;
        if (evOK === 6 && wrongStrings === 0 && herringBad === 0){
            S.board.solved = true; save();
            this.solved(false);
            return;
        }
        if (S.boardFails >= 1) S.mistakes++;
        S.boardFails++;
        save();
        Sound.sfx('wrong');
        const fb = `Last check: ${evOK} of 6 events are in place. ${wrongStrings} ${wrongStrings === 1 ? 'string is' : 'strings are'} wrong. ${herringBad} ${herringBad === 1 ? "card doesn't" : "cards don't"} belong.`;
        this.lastFb = fb;
        $('#boardFeedback').textContent = fb;
    },
    async solved(resumed){
        if (S.stage !== 'board') return;
        $('#boardStage').classList.add('solved');
        this.drawStrings();
        if (!resumed){
            Sound.sfx('unlock');
            sparksAt($('#strings'), { count: 50, spread: 260 });
            setTimeout(() => sparksAt($('#pinBtn'), { count: 24, spread: 120 }), 250);
            await sleep(1500);
        }
        $('#boardFeedback').textContent = 'Every pin holds.';
        await modal({
            art: portrait('kriti'),
            title: 'The board goes gold',
            html: said('Detective Kriti', 'Every one of them had a hand in it, and not one of them hurt him. Hagrid drank that juice knowing exactly what was in it.') + said('Detective Kriti', "This wasn't a murder. It was a plan. And the plan ends at Odessa's vault."),
            buttons: [{ label: 'Climb to the vault' }]
        });
        transitionTo('vault');
    }
};

/* =========================================================
   CHAPTER 4: THE VAULT CIPHER
   ========================================================= */
const PLAIN_NOTE = 'ENTER HER NEW AGE THEN THE DAY SHE WAS BORN';
const shiftText = (txt, k) => txt.replace(/[A-Z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 65 + k + 2600) % 26 + 65));
const CIPHER_NOTE = shiftText(PLAIN_NOTE, CONFIG.cipherShift);

const Vault = {
    rot: 0, digits: [0, 0, 0, 0], drag: null,
    start(){ this.render(); },
    wheelSVG(){
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const step = 360 / 26;
        const outer = A.split('').map((ch, i) => `<text x="160" y="40" text-anchor="middle" transform="rotate(${(i * step).toFixed(2)} 160 160)" font-family="IM Fell English SC, Georgia, serif" font-size="17" fill="#14110c">${ch}</text>`).join('');
        const inner = A.split('').map((ch, i) => `<text x="160" y="76" text-anchor="middle" transform="rotate(${(i * step).toFixed(2)} 160 160)" font-family="IM Fell English SC, Georgia, serif" font-size="16" fill="#f1cf7a">${ch}</text>`).join('');
        const ticks = A.split('').map((_, i) => `<path d="M160 50 v6" transform="rotate(${(i * step + step / 2).toFixed(2)} 160 160)" stroke="#6b4a1f" stroke-width="1"/>`).join('');
        return `<svg viewBox="0 0 320 320" aria-label="Cipher wheel" role="img">
            <circle cx="160" cy="160" r="152" fill="#d6c493" stroke="#6b4a1f" stroke-width="3"/>
            <circle cx="160" cy="160" r="124" fill="none" stroke="#6b4a1f" stroke-width="1.5"/>
            ${outer}${ticks}
            <g id="innerRing" transform="rotate(${(this.rot * step).toFixed(2)} 160 160)">
                <circle cx="160" cy="160" r="120" fill="#1b2130" stroke="#c9a24a" stroke-width="2.5"/>
                <circle cx="160" cy="160" r="88" fill="none" stroke="rgba(201,162,74,.35)" stroke-width="1"/>
                ${inner}
                <circle cx="160" cy="160" r="54" fill="#121722" stroke="#c9a24a" stroke-width="1.5"/>
                <path d="M160 112 l-6 12 h12 z" fill="#c9a24a"/>
            </g>
            <path d="M160 6 l-9 -0 l9 16 l9 -16 z" fill="#9e1f29"/>
            <circle cx="160" cy="160" r="6" fill="#c9a24a"/>
        </svg>`;
    },
    render(){
        const reading = shiftText(CIPHER_NOTE, -this.rot);
        $('#vaultStage').innerHTML = `
            <div class="note-parchment unroll ${S.decoded ? 'decoded' : ''}" id="noteParchment">
                <p class="label">Found in the vault door &middot; stamped Restricted Section</p>
                <p class="cipher-text">${CIPHER_NOTE}</p>
                <div class="reading">
                    <p class="label">Read through the wheel</p>
                    <p class="reading-text" id="readingText">${reading}</p>
                </div>
            </div>
            <div class="wheel-box">
                <div class="wheel" id="wheel">${this.wheelSVG()}</div>
                <div class="wheel-ctrl">
                    <button type="button" id="rotL" aria-label="Turn the inner ring left">&#8634;</button>
                    <span class="eyebrow">Turn the inner ring</span>
                    <button type="button" id="rotR" aria-label="Turn the inner ring right">&#8635;</button>
                </div>
            </div>
            <div class="lock" id="lock">
                <p class="eyebrow">Vault lock</p>
                <div class="tumblers">${this.digits.map((d, i) => `
                    <div class="tumbler">
                        <button type="button" data-i="${i}" data-d="1" aria-label="Digit ${i + 1} up">&#9650;</button>
                        <div class="digit" id="digit${i}">${d}</div>
                        <button type="button" data-i="${i}" data-d="-1" aria-label="Digit ${i + 1} down">&#9660;</button>
                    </div>`).join('')}
                </div>
                <button type="button" class="btn primary" id="turnHandle">Turn the handle</button>
            </div>`;
        $('#rotL').addEventListener('click', () => this.turn(-1));
        $('#rotR').addEventListener('click', () => this.turn(1));
        $$('#lock .tumbler button').forEach(b => b.addEventListener('click', () => {
            const i = +b.dataset.i;
            this.digits[i] = (this.digits[i] + +b.dataset.d + 10) % 10;
            $('#digit' + i).textContent = this.digits[i];
            Sound.sfx('click');
        }));
        $('#turnHandle').addEventListener('click', () => this.tryCode());
        this.wireDrag();
    },
    turn(d){
        this.rot = (this.rot + d + 26) % 26;
        const step = 360 / 26;
        $('#innerRing').setAttribute('transform', `rotate(${(this.rot * step).toFixed(2)} 160 160)`);
        $('#readingText').textContent = shiftText(CIPHER_NOTE, -this.rot);
        Sound.sfx('click');
        if (this.rot === CONFIG.cipherShift && !S.decoded){
            S.decoded = true; save();
            $('#noteParchment').classList.add('decoded');
            Sound.sfx('unlock');
            toast('The note gives up its secret.');
        }
    },
    wireDrag(){
        const wheel = $('#wheel');
        const angle = e => {
            const r = wheel.getBoundingClientRect();
            return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
        };
        wheel.addEventListener('pointerdown', e => { this.drag = { a: angle(e), acc: 0 }; wheel.setPointerCapture(e.pointerId); });
        wheel.addEventListener('pointermove', e => {
            if (!this.drag) return;
            const a = angle(e);
            let d = a - this.drag.a;
            if (d > 180) d -= 360;
            if (d < -180) d += 360;
            this.drag.a = a;
            this.drag.acc += d;
            const step = 360 / 26;
            while (this.drag.acc >= step){ this.turn(1); this.drag.acc -= step; }
            while (this.drag.acc <= -step){ this.turn(-1); this.drag.acc += step; }
        });
        const end = () => { this.drag = null; };
        wheel.addEventListener('pointerup', end);
        wheel.addEventListener('pointercancel', end);
    },
    async tryCode(){
        const code = this.digits.join('');
        if (code === CONFIG.vaultCode){
            Sound.sfx('unlock');
            const lock = $('#lock');
            lock.classList.add('opened');
            sparksAt(lock, { count: 60, spread: 260 });
            setTimeout(() => Sound.sfx('bell'), 400);
            await sleep(1400);
            await modal({
                title: 'The vault door swings open',
                html: typed('Inside, on a velvet cushion: one sealed envelope with your name on it, and a card in Odessa\'s handwriting.') + said('The card', 'Before you open this, Detective, tell us what really happened tonight.'),
                buttons: [{ label: 'Make the accusation' }]
            });
            transitionTo('accuse');
        } else {
            Sound.sfx('wrong');
            S.mistakes++; save();
            const lock = $('#lock');
            lock.classList.remove('shake'); void lock.offsetWidth; lock.classList.add('shake');
            toast('The vault shudders. Nothing gives.');
        }
    }
};

/* =========================================================
   THE ACCUSATION
   ========================================================= */
const ACCUSE = [
    { q: 'Who is responsible?', o: ['Professor Cassius Thorne', 'Wren Ashcroft', 'Bonnie Crumb', 'Odessa Vale', 'All four, together'], a: 4 },
    { q: 'How did Hagrid fall?', o: ['A curse from the tower window', 'Poison slipped into his pumpkin juice', 'A fall from the clock tower', 'He drank the Draught of Living Death willingly'], a: 3 },
    { q: 'Why?', o: ['Revenge for an old grudge', 'To steal what was in the vault', 'A stolen inheritance', 'To make sure you found what was in the vault'], a: 3 }
];
const Accuse = {
    sel: [null, null, null],
    start(){ this.render(); },
    render(){
        $('#accuseStage').innerHTML = ACCUSE.map((q, qi) => `
            <div class="q-block">
                <h3>${esc(q.q)}</h3>
                <div class="choice-grid">${q.o.map((o, oi) => `<button type="button" class="choice" data-q="${qi}" data-o="${oi}" aria-pressed="${this.sel[qi] === oi}">${esc(o)}</button>`).join('')}</div>
            </div>`).join('') + `
            <div class="accuse-foot">
                <p class="accuse-msg" id="accuseMsg"></p>
                <button type="button" class="btn danger" id="accuseBtn" ${this.sel.includes(null) ? 'disabled' : ''}>Accuse</button>
            </div>`;
        $$('#accuseStage .choice').forEach(b => b.addEventListener('click', () => {
            this.sel[+b.dataset.q] = +b.dataset.o;
            Sound.sfx('click');
            this.render();
        }));
        $('#accuseBtn').addEventListener('click', () => this.accuse());
    },
    accuse(){
        const right = ACCUSE.every((q, i) => this.sel[i] === q.a);
        if (right){
            Sound.sfx('slam');
            quake($('#accuse-screen'));
            sparksAt($('#accuseBtn'), { count: 40, spread: 180, colors: ['#d0404a', '#f1cf7a'] });
            setTimeout(() => go('reveal'), 1100);
        } else {
            Sound.sfx('wrong');
            S.mistakes++; save();
            $('#accuseMsg').textContent = 'The Headmistress shakes her head. Look again, Detective.';
        }
    }
};

/* =========================================================
   THE REVEAL
   ========================================================= */
function clockSVG(sec){
    const midnight = sec >= 60;
    const s = midnight ? 0 : sec * 6;
    const m = midnight ? 0 : 354 + sec * .1;
    const h = midnight ? 0 : 359.5 + sec / 120;
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((n, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return `<text x="${(150 + Math.cos(a) * 106).toFixed(1)}" y="${(150 + Math.sin(a) * 106 + 7).toFixed(1)}" text-anchor="middle" font-family="Cinzel Decorative, Georgia, serif" font-size="19" fill="#e6dcc3">${n}</text>`;
    }).join('');
    const hand = (deg, len, w, color) => `<line x1="150" y1="150" x2="150" y2="${150 - len}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" transform="rotate(${deg.toFixed(2)} 150 150)"/>`;
    return `<svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="142" fill="#141925" stroke="#c9a24a" stroke-width="6"/><circle cx="150" cy="150" r="128" fill="none" stroke="#6b5a35" stroke-width="1"/>${numerals}${hand(h, 66, 7, '#e6dcc3')}${hand(m, 100, 4.5, '#e6dcc3')}${hand(s, 112, 2, '#d0404a')}<circle cx="150" cy="150" r="7" fill="#c9a24a"/></svg>`;
}

function rankOf(){
    const h = 3 - S.hintsLeft, m = S.mistakes;
    if (h === 0 && m <= 3) return ['S', 'Head of Magical Law Enforcement'];
    if (h <= 1 && m <= 8) return ['A', 'Senior Auror'];
    if (h <= 2 && m <= 15) return ['B', 'Auror'];
    return ['C', 'Trainee Auror'];
}

const Reveal = {
    running: false,
    async run(){
        if (this.running) return;
        this.running = true;
        const st = $('#revealStage');
        $('#goldFlood').classList.remove('on');
        Rain.stop();
        Sound.stopScore(3);

        st.innerHTML = '<p class="reveal-line">Silence. The rain has stopped.</p>';
        await sleep(3000);

        const next = (label = 'Continue') => new Promise(res => {
            st.insertAdjacentHTML('beforeend', `<button type="button" class="btn primary reveal-next" id="revealNext">${esc(label)}</button>`);
            const btn = $('#revealNext');
            btn.addEventListener('click', () => { Sound.sfx('page'); res(); }, { once: true });
            setTimeout(() => btn.focus(), 60);
        });

        const speak = async (sel, text) => {
            const target = st.querySelector(sel);
            const ctl = inkWrite(target, text, { speed: 55 });
            const panel = st.querySelector('.reveal-panel');
            const skip = () => ctl.finish();
            if (panel) panel.addEventListener('click', skip);
            await ctl.promise;
            if (panel) panel.removeEventListener('click', skip);
        };

        Sound.sfx('bark');
        st.innerHTML = `<div class="reveal-panel"><div class="comic-art">${ART.hagridUp}</div><div class="bubble"><span class="speaker">Hagrid</span><span data-say></span></div></div>`;
        await speak('[data-say]', "Blimey. That draught tastes worse than it smells. Sorry for the fright, Detective. Had to make it convincin'.");
        await next();

        st.innerHTML = `<div class="reveal-panel"><div class="caption-box" style="position:relative;top:0;left:0;max-width:none;margin-bottom:14px" data-cap></div><div class="reveal-four">${SUSPECT_ORDER.map(id => portrait(id)).join('')}</div><div class="bubble"><span class="speaker">Odessa</span><span data-say></span></div></div>`;
        wirePortraits(st);
        await speak('[data-cap]', 'Four suspects step out of the shadows, grinning. Bonnie is still holding a rock cake.');
        await speak('[data-say]', 'You were never investigating a murder, Detective. You were investigating a countdown.');
        await next('What really happened?');

        const truth = [
            ['11:20', 'Wren brought the ingredients up from Greenhouse Three.'],
            ['11:35', 'Thorne brewed the Draught of Living Death.'],
            ['11:45', "Bonnie poured it into Hagrid's pumpkin juice. Hagrid drank it, knowing."],
            ['11:52', 'All four carried him to the foot of the tower.'],
            ['11:58', 'Odessa sealed the vault and left you the coded note.'],
            ['11:59', 'Thorne stopped every clock in the castle.']
        ];
        st.innerHTML = `<div class="reveal-panel"><p class="eyebrow" style="margin-bottom:14px">What really happened</p><ol class="truth-list">${truth.map(([t, x], i) => `<li style="animation-delay:${(i * .55).toFixed(2)}s"><span class="t">${t}</span><span>${esc(x)}</span></li>`).join('')}</ol><p class="truth-foot" data-say></p></div>`;
        await sleep(reduceMotion ? 0 : truth.length * 550 + 400);
        await speak('[data-say]', 'Nobody was hurt. They stopped every clock at 11:59 so that the moment you solved it, it would be midnight. Your midnight.');
        await next('Let the clocks run');

        st.innerHTML = `<div class="clock-wrap"><div class="clock-face" id="bigClock">${clockSVG(57)}</div></div><div class="digital" id="digital">11:59:57</div>`;
        Sound.sfx('tickLoud');
        for (const sec of [58, 59]){
            await sleep(1000);
            $('#bigClock').innerHTML = clockSVG(sec);
            $('#digital').textContent = '11:59:' + sec;
            Sound.sfx('tickLoud');
        }
        await sleep(1000);
        $('#bigClock').innerHTML = clockSVG(60);
        $('#digital').textContent = '12:00:00';
        Sound.sfx('bell');
        this.shockwave();
        $('#goldFlood').classList.add('on');
        this.confetti();
        await sleep(1500);
        Sound.sfx('bell');
        await sleep(1400);

        const [letter, title] = rankOf();
        const hints = 3 - S.hintsLeft;
        const big = Math.round(Math.min(58, Math.max(30, window.innerWidth / 13)));
        st.innerHTML = `
            <h1 class="sr-only">Welcome to your 30s, Detective ${esc(CONFIG.detective)}.</h1>
            <div class="welcome-hand" id="welcomeA"></div>
            <div class="welcome-hand" id="welcomeB"></div>
            <p class="welcome-sub" data-say></p>
            <div class="rank-card" hidden>
                <span class="eyebrow">Detective rank</span>
                <span class="rank-letter foil">${letter}</span>
                <span class="rank-title">${esc(title)}</span>
                <span class="rank-stats">${hints} ${hints === 1 ? 'hint' : 'hints'} used &middot; ${S.mistakes} ${S.mistakes === 1 ? 'mistake' : 'mistakes'}</span>
            </div>
            <div class="case-closed-end" hidden>
                <div class="end-stamp">CASE CLOSED</div>
                <button type="button" class="btn ghost" id="replayBtn">Replay the case</button>
            </div>`;
        let hw = handwrite($('#welcomeA'), 'Welcome to your 30s,', { size: big, align: 'center', duration: 2600, stroke: 1.5 });
        await hw.promise;
        hw = handwrite($('#welcomeB'), `Detective ${CONFIG.detective}.`, { size: big, align: 'center', duration: 2000, stroke: 1.5 });
        await hw.promise;
        sparksAt($('#welcomeB'), { count: 30, spread: 200 });
        Sound.sfx('shimmer');
        await inkWrite(st.querySelector('[data-say]'), CONFIG.welcomeLine, { speed: 60 }).promise;
        st.querySelector('.rank-card').hidden = false;
        await sleep(reduceMotion ? 0 : 1600);
        const end = st.querySelector('.case-closed-end');
        end.hidden = false;
        Sound.sfx('slam');
        sparksAt(end.querySelector('.end-stamp'), { count: 40, spread: 180, colors: ['#d0404a', '#f1cf7a'] });
        Embers.start();
        S.stage = 'done'; save();
        this.running = false;
        $('#replayBtn').addEventListener('click', () => { resetSave(); location.reload(); });
        setTimeout(() => Sound.sfx('bell'), 600);
    },
    shockwave(){
        const wrap = $('#bigClock');
        if (!wrap) return;
        if (!reduceMotion){
            const holder = wrap.parentElement;
            for (let i = 0; i < 3; i++){
                const ring = document.createElement('span');
                ring.className = 'shock';
                ring.style.animationDelay = (i * .28) + 's';
                holder.appendChild(ring);
                setTimeout(() => ring.remove(), 2600);
            }
            quake($('#reveal-screen'));
        }
        sparksAt(wrap, { count: 80, spread: 320 });
    },
    confetti(){
        if (typeof confetti !== 'function' || reduceMotion) return;
        const gold = ['#f1cf7a', '#c9a24a', '#e6dcc3', '#9e1f29'];
        confetti({ particleCount: 160, spread: 120, origin: { y: .55 }, colors: gold });
        for (let i = 0; i < 6; i++){
            setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { x: Math.random(), y: Math.random() * .5 + .2 }, colors: gold }), i * 350);
        }
    }
};

/* =========================================================
   AFTER THE GAME: archive, polaroids, video, letter
   ========================================================= */
const After = {
    started: false,
    start(){
        if (this.started) return;
        this.started = true;
        Sound.stopScore(1.5);
        const music = $('#music');
        try {
            music.currentTime = 0;
            music.volume = .7;
            music.muted = Sound.muted;
            const p = music.play();
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* no music file */ }
        Embers.start();
        setTimeout(musicSpotlight, 900);
        this.prep();
    },

    prep(){
        showScreen('prep-screen');
        const lines = [
            'Sealing the case file',
            'Breaking the vault seal',
            'Gathering thirty years of evidence',
            'Recovering memories from the archive',
            'Matching every photo to its story',
            'Lighting the candles',
            'Almost there...'
        ];
        const bar = $('#progress-bar'), text = $('#prepText');
        bar.style.width = '0';
        let i = 0;
        const timer = setInterval(() => {
            text.textContent = lines[i];
            bar.style.width = ((i + 1) / lines.length * 100) + '%';
            i++;
            if (i >= lines.length){
                clearInterval(timer);
                setTimeout(() => this.verdict(), 1300);
            }
        }, 1200);
    },

    verdict(){
        showScreen('verdict-screen');
        Sound.sfx('slam');
        setTimeout(() => this.archive(), 4500);
    },

    archive(){
        showScreen('archive-screen');
        const img = $('#archivePhoto'), cap = $('#archiveCaption'), bg = $('#archiveBackground');
        let current = 0;
        const show = () => {
            img.style.opacity = 0;
            cap.style.opacity = 0;
            setTimeout(() => {
                const n = current + 1;
                const probe = new Image();
                probe.onload = () => { img.src = probe.src; bg.style.backgroundImage = `url('${probe.src}')`; };
                probe.onerror = () => { const ph = placeholderPhoto(n); img.src = ph; bg.style.backgroundImage = `url("${ph}")`; };
                probe.src = CONFIG.photoPath(n);
                img.style.opacity = 1;
                cap.style.opacity = 1;
                setTimeout(() => inkWrite(cap, CONFIG.photoCaptions[current] || '', { speed: 70 }), 500);
            }, 1200);
            const dur = current < 12 ? 4500 : 6500;
            setTimeout(() => {
                img.style.opacity = 0;
                cap.style.opacity = 0;
                setTimeout(() => {
                    current++;
                    if (current >= CONFIG.photoCount){ this.transition(); return; }
                    show();
                }, 1200);
            }, dur + 1200);
        };
        show();
    },

    transition(){
        showScreen('transition-screen');
        const msgs = ['One moment...', 'Some evidence is better seen all at once...', "Here's the whole case."];
        const t = $('#transitionText');
        let i = 0;
        t.textContent = msgs[0];
        const timer = setInterval(() => {
            i++;
            if (i >= msgs.length){ clearInterval(timer); setTimeout(() => this.board(), 1000); return; }
            t.textContent = msgs[i];
        }, 2500);
    },

    board(){
        showScreen('memory-board-screen');
        const board = $('#polaroidBoard');
        board.innerHTML = '';
        const rnd = seeded(30);
        for (let n = 1; n <= CONFIG.photoCount; n++){
            const fig = document.createElement('figure');
            fig.className = 'polaroid';
            fig.style.setProperty('--rot', ((rnd() * 10) - 5).toFixed(1) + 'deg');
            const img = document.createElement('img');
            img.alt = '';
            img.addEventListener('load', () => {
                const r = img.naturalHeight / Math.max(1, img.naturalWidth);
                img.classList.add(r > 1.34 ? 'tall' : 'natural');
            });
            photoWithFallback(img, n);
            fig.appendChild(img);
            board.appendChild(fig);
            setTimeout(() => fig.classList.add('show-photo'), (n - 1) * 700 + 200);
        }
        const msgs = ['Every photo is a piece of evidence.', 'Of laughter.', 'Of hard days, survived together.', 'Of a friendship that became family.', 'Of thirty years worth celebrating.', 'And of everything still to come.'];
        const target = $('#memoryBoardMessage');
        let i = 0;
        target.textContent = msgs[0];
        const timer = setInterval(() => {
            i++;
            if (i >= msgs.length){ clearInterval(timer); return; }
            target.style.opacity = 0;
            setTimeout(() => { target.textContent = msgs[i]; target.style.opacity = 1; }, 600);
        }, 3200);
    },

    video(){
        showScreen('video-screen');
        const music = $('#music'), video = $('#finalCompilation');
        music.volume = .25;
        $('#videoMissing').hidden = true;
        video.hidden = false;
        video.muted = Sound.muted;
        const missing = () => {
            try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignore */ }
            video.hidden = true;
            $('#videoMissing').hidden = false;
        };
        video.addEventListener('error', missing, { once: true });
        video.onended = async () => {
            try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* ignore */ }
            this.final();
        };
        if (!video.getAttribute('src')) video.src = CONFIG.videoSrc;
        try {
            const p = video.play();
            if (p && p.catch) p.catch(() => {});
            if (video.requestFullscreen){
                const f = video.requestFullscreen();
                if (f && f.catch) f.catch(() => {});
            }
        } catch (e) { /* ignore */ }
    },

    final(){
        const music = $('#music'), video = $('#finalCompilation');
        try { video.pause(); } catch (e) { /* ignore */ }
        music.volume = .7;
        showScreen('final-screen');
        const box = $('#birthdayMessage');
        box.innerHTML = CONFIG.letter.map((p, i) => `<div class="lp ${p.cls || ''}" data-i="${i}"></div>`).join('') + `<p class="clock-hint"></p>`;
        let fast = false, cur = null;
        const letter = $('.letter');
        const hurry = () => { fast = true; if (cur) cur.finish(); };
        letter.addEventListener('click', hurry);
        (async () => {
            await sleep(700);
            for (let i = 0; i < CONFIG.letter.length; i++){
                const p = CONFIG.letter[i];
                const el = box.querySelector(`.lp[data-i="${i}"]`);
                el.classList.add('in');
                if (p.cls === 'salutation' || p.cls === 'sign'){
                    const size = p.cls === 'sign' ? Math.min(52, Math.max(34, window.innerWidth / 16)) : Math.min(44, Math.max(30, window.innerWidth / 18));
                    cur = handwrite(el, p.text, { size, align: 'left', duration: Math.max(1500, p.text.length * 160) });
                } else {
                    cur = inkWrite(el, p.text, { speed: 55 });
                }
                if (fast) cur.finish();
                await cur.promise;
                if (!fast) await sleep(350);
            }
            letter.removeEventListener('click', hurry);
            const hint = box.querySelector('.clock-hint');
            await sleep(fast ? 200 : 1200);
            hint.classList.add('in');
            hint.textContent = CONFIG.clockHint;
            $('#cornerClock').classList.add('beckon');
            Sound.sfx('shimmer');
            sparksAt($('#cornerClock'), { count: 16, spread: 60 });
        })();
    }
};

/* Easter egg: tap the corner clock 11 times */
let clockTaps = 0;
function easterEgg(e){
    if (e) e.stopPropagation();
    clockTaps++;
    Sound.sfx('tickLoud');
    const btn = $('#cornerClock');
    if (clockTaps < 11){
        btn.textContent = `12:00 · ${clockTaps}/11`;
        return;
    }
    clockTaps = 0;
    btn.textContent = '12:00';
    btn.classList.remove('beckon');
    Sound.sfx('unlock');
    Sound.sfx('bell');
    sparksAt(btn, { count: 50, spread: 200 });
    const egg = CONFIG.easterEgg;
    modal({
        flip: true,
        burst: true,
        html: `<div class="achievement"><p class="ach-kicker">${esc(egg.kicker)}</p><h3 style="margin:8px 0 14px">${esc(egg.title)}</h3>${egg.lines.map(typed).join('')}</div>`,
        buttons: [{ label: 'Accept' }]
    });
}


/* =========================================================
   STORY AIDS: chapter briefings + case notes
   ========================================================= */
const BRIEFS = {
    courtyard: {
        title: 'Chapter 1 · The Courtyard',
        know: ['Hagrid has been found at the foot of the clock tower.', 'Every clock in the castle stopped at exactly 11:59.', 'Four people were in the tower tonight.'],
        task: 'Search the dark courtyard with your wand-light and collect all 9 pieces of evidence. Read each note: it tells you who the clue points to. Some things only appear if you hold the light still on them.'
    },
    interro: {
        title: 'Chapter 2 · The Interrogations',
        know: ["A pocket watch engraved C.T.: Professor Cassius Thorne's initials.", 'An empty vial of "...ing Death", caked in greenhouse soil.', "Footprints dusted with flour, like a cook's.", 'A parchment stamped by the Restricted Section.', 'Fang is wagging, not grieving.'],
        task: 'Each suspect tells exactly one lie. Flip through their 3 statements, find the one your evidence disproves, then tap Expose and show them that evidence. Wrong evidence costs credibility.'
    },
    gate: {
        title: 'The Portrait Gate',
        know: ['All four suspects confessed to a part of tonight.', "Thorne brewed a Draught of Living Death. Wren grew its ingredients. Bonnie put it in Hagrid's juice. Odessa sealed a vault.", "The Draught of Living Death doesn't kill. It only makes the drinker look dead."],
        task: 'Lady Morwen guards the tower door. Answer three of her riddles in a row to get past.'
    },
    board: {
        title: 'Chapter 3 · The Evidence Board',
        know: ['Four people worked together tonight.', 'Nobody seems to have hurt Hagrid.'],
        task: 'Put the night in order: tap each real event, then the time it happened. Two event cards never happened. Then tie each piece of evidence to the person it points to. Clues that point to nobody go in Irrelevant. Press Pin it to check.'
    },
    vault: {
        title: 'Chapter 4 · The Vault Cipher',
        know: ['Hagrid drank the draught knowing exactly what it was. This was a plan, not a murder.', 'Odessa sealed a vault at the top of the tower and left a coded note.', 'Every clock was stopped at 11:59 on purpose.'],
        task: "Turn the cipher wheel until Odessa's note makes sense, then use what it says to open the four-digit lock."
    },
    accuse: {
        title: 'The Accusation',
        know: ['The vault opened.', 'Inside was one sealed envelope, addressed to you.'],
        task: 'Name who is responsible, how Hagrid fell, and why. All three answers must be right.'
    }
};
const BRIEF_ORDER = ['courtyard', 'interro', 'gate', 'board', 'vault', 'accuse'];

function showBrief(stage){
    const b = BRIEFS[stage];
    if (!b) return;
    S.briefed[stage] = true;
    save();
    modal({
        art: portrait('kriti'),
        title: b.title,
        html: `<p class="brief-label">What we know</p><ul class="brief-list">${b.know.map(k => `<li>${esc(k)}</li>`).join('')}</ul><p class="brief-label">Your task</p><p class="brief-task">${esc(b.task)}</p>`,
        buttons: [{ label: 'Begin' }]
    });
}

function showNotes(){
    if (modalOpen()) return;
    const upto = BRIEF_ORDER.indexOf(S.stage);
    const late = upto >= BRIEF_ORDER.indexOf('vault');
    const facts = BRIEF_ORDER.slice(0, upto + 1).flatMap(st => BRIEFS[st].know);
    const ev = S.found.map(id => {
        const c = CLUES[id];
        return `<div class="notes-ev">${ART[c.icon]}<div><b>${esc(c.name)}</b>${esc(c.note)}<br><em>${esc(c.thought)}</em></div></div>`;
    }).join('');
    const conf = S.broken.map(id => `<p><b>${esc(SUSPECTS[id].short)}:</b> ${esc(SUSPECTS[id].confession)}</p>`).join('');
    const task = BRIEFS[S.stage] ? BRIEFS[S.stage].task : '';
    modal({
        title: 'Case notes',
        html: `<div class="notes-section"><p class="brief-label">The question</p><p>${late ? 'What really happened tonight, and why?' : 'What happened to Hagrid, and why did every clock stop at 11:59?'}</p></div>
            ${task ? `<div class="notes-section"><p class="brief-label">Right now</p><p class="brief-task">${esc(task)}</p></div>` : ''}
            <div class="notes-section"><p class="brief-label">What we know</p><ul class="brief-list">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
            ${ev ? `<div class="notes-section"><p class="brief-label">Evidence</p>${ev}</div>` : ''}
            ${conf ? `<div class="notes-section"><p class="brief-label">Confessions</p>${conf}</div>` : ''}`,
        buttons: [{ label: 'Close' }]
    });
}

/* =========================================================
   HINTS (Ember)
   ========================================================= */
const HINTS = {
    courtyard: [
        'Not everything here shows itself at a glance. When something looks wrong, hold your light on it and wait.',
        'Dogs and footprints only answer a patient light. And look down: water remembers what the mist hides.'
    ],
    interro: {
        thorne: ['A man that punctual never goes anywhere without his watch.', 'Press him on his second statement. Watch his hands.', 'Expose his second statement with the pocket watch.'],
        wren: ['He says only plants. What did you find with greenhouse soil on it?', 'His second statement protests too much.', 'Expose his second statement with the empty vial.'],
        crumb: ['Kitchens leave traces on everything. Look at what was dusted white.', 'She swears she never went near the tower. Did her feet agree?', 'Expose her second statement with the footprints.'],
        odessa: ["What carried her section's stamp?", 'She claims she has never seen something. Show it to her.', 'Expose her second statement with the scorched parchment.']
    },
    board: [
        'Follow the night in order: what had to exist before anything could be brewed? And two of those event cards never happened at all.',
        'Fang belongs to his master. The broom and the feather belong to no one: they go in Irrelevant.',
        'Watch and reflection: Thorne. Vial: Wren. Footprints and goblet: Bonnie. Parchment: Odessa. Fang: Hagrid. Timeline: greenhouse, brew, juice, carry, vault, clocks.'
    ],
    vault: [
        'Every clock stopped on the same hour. Maybe the note did too.',
        'Turn the inner ring until the hour lines up.',
        'Eleven turns. Then ask yourself: how old is she now, and on which day was she born?'
    ],
    accuse: [
        'Four confessions. Count the hands that touched that vial.',
        'Did anyone ever say Hagrid was forced to drink?',
        'Remember what was locked in the vault, and who it was locked for.'
    ]
};

function nextHint(){
    const stage = S.stage;
    const take = (key, list) => {
        const step = Math.min(S.hintStep[key] || 0, list.length - 1);
        S.hintStep[key] = step + 1;
        return list[step];
    };
    if (stage === 'courtyard'){
        const step = S.hintStep.courtyard || 0;
        S.hintStep.courtyard = step + 1;
        if (step < 2) return HINTS.courtyard[step];
        const missing = CLUE_ORDER.filter(id => !S.found.includes(id));
        return 'Still missing: ' + missing.map(id => CLUES[id].where).join('; ') + '.';
    }
    if (stage === 'interro'){
        const sid = S.broken.includes(Interro.cur) ? SUSPECT_ORDER.find(id => !S.broken.includes(id)) : Interro.cur;
        if (!sid) return null;
        return take('i_' + sid, HINTS.interro[sid]);
    }
    if (stage === 'gate'){ Gate.strike(); return 'I crossed out two wrong answers on the portrait\'s riddle. Quickly, before she notices.'; }
    if (HINTS[stage]) return take(stage, HINTS[stage]);
    return null;
}

async function askHint(){
    if (modalOpen()) return;
    const playable = ['courtyard', 'interro', 'gate', 'board', 'vault', 'accuse'];
    if (!playable.includes(S.stage)){ toast('Ember has nothing to add here.'); return; }
    if (S.hintsLeft <= 0){
        modal({ art: ART.ember, title: 'Ember', html: said('Ember', "Out of parchment, Detective. You're on your own now."), buttons: [{ label: 'Fine' }] });
        return;
    }
    const ok = await modal({
        art: ART.ember,
        title: 'Ask Ember?',
        html: `<p>You have ${S.hintsLeft} of 3 hints left for the whole case. Each one lowers your detective rank.</p>`,
        buttons: [{ label: 'Not yet', value: false }, { label: 'Ask for a hint', value: true }]
    });
    if (!ok) return;
    const text = nextHint();
    if (!text){ toast('Ember has nothing to add here.'); return; }
    S.hintsLeft--; save(); HUD.pips();
    Sound.sfx('page');
    modal({ art: ART.ember, title: 'Ember drops a scrap of parchment', html: said('Ember', text), buttons: [{ label: 'Thanks, Ember' }] });
}

/* =========================================================
   BOOT
   ========================================================= */
function updateSoundLabel(){
    const btn = $('#soundBtn'), music = $('#music');
    const musicMode = !!music && btn.classList.contains('music-mode');
    const on = musicMode ? (!music.paused && !Sound.muted) : !Sound.muted;
    btn.textContent = musicMode ? (on ? '♪ Music on' : '♪ Music off') : (on ? 'Sound on' : 'Sound off');
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('off', !on);
}

function musicSpotlight(){
    const btn = $('#soundBtn');
    btn.classList.add('music-mode', 'beckon');
    updateSoundLabel();
    const hint = $('#musicHint');
    const music = $('#music');
    hint.textContent = music.paused ? 'There is music for this part. Tap ♪ to play it.' : 'Your song is playing. Tap ♪ any time to pause it.';
    hint.hidden = false;
    requestAnimationFrame(() => hint.classList.add('show'));
    setTimeout(() => { hint.classList.remove('show'); setTimeout(() => { hint.hidden = true; }, 600); }, 7500);
    setTimeout(() => btn.classList.remove('beckon'), 12000);
}

function boot(){
    load();
    Rain.init();
    HUD.pips();
    Cover.init();

    $('#hintBtn').addEventListener('click', askHint);
    $('#notesBtn').addEventListener('click', showNotes);
    $('#soundBtn').addEventListener('click', () => {
        const btn = $('#soundBtn'), music = $('#music');
        if (music && btn.classList.contains('music-mode')){
            if (music.paused || Sound.muted){
                Sound.setMuted(false);
                const p = music.play();
                if (p && p.catch) p.catch(() => toast('Add music/birthday.mp3 to hear the song here.'));
            } else {
                music.pause();
                Sound.setMuted(true);
            }
        } else {
            Sound.setMuted(!Sound.muted);
        }
        updateSoundLabel();
    });
    $('#comicPanel').addEventListener('click', () => Comic.advance());

    document.addEventListener('keydown', e => {
        if (modalOpen()) return;
        if (S.stage === 'comic' && $('#comic-screen').classList.contains('active') && (e.key === ' ' || e.key === 'Enter')){
            if (e.target.tagName === 'BUTTON' && e.target.id === 'lumosBtn') return;
            e.preventDefault();
            Comic.advance();
        }
    });
}

boot();
