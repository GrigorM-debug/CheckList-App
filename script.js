/* ═══════════ script.js — Checklist App ═══════════ */

// Section totals
const SECTION_TOTALS = {
    a1: 7, a2: 15, a3: 7, a4: 6,
    a5: 6, a6: 6, a7: 5, a8: 8, a9: 4, a10: 5
};
const TOTAL = 69;

// State
const checked = new Set();
const collapsed = new Set();

// ── DOM refs ──
const checkedCountEl = document.getElementById('checkedCount');
const progressBarEl = document.getElementById('progressBar');
const progressLabelEl = document.getElementById('progressLabel');
const ringFillEl = document.getElementById('ringFill');
const btnFinish = document.getElementById('btnFinish');
const remainingHint = document.getElementById('remainingHint');
const remainingCount = document.getElementById('remainingCount');
const successOverlay = document.getElementById('successOverlay');

// ── Inject SVG gradient defs ──
(function injectDefs() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.querySelector('.progress-ring');
    const defs = document.createElementNS(svgNS, 'defs');
    const grad = document.createElementNS(svgNS, 'linearGradient');
    grad.setAttribute('id', 'ringGrad');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
    const s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#6c63ff');
    const s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#38bdf8');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.prepend(defs);
})();

// ── Toggle a single item ──
function toggleItem(el) {
    const id = parseInt(el.dataset.id);
    const section = el.dataset.section;

    if (checked.has(id)) {
        checked.delete(id);
        el.classList.remove('checked');
    } else {
        checked.add(id);
        el.classList.add('checked');
        spawnRipple(el);
    }

    updateProgress();
    updateSectionProgress(section);
}

// ── Ripple effect on check ──
function spawnRipple(el) {
    const circle = document.createElement('div');
    circle.className = 'ripple-circle';
    circle.style.cssText = 'left:50%;top:50%;margin-left:-30px;margin-top:-30px;';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
}

// ── Toggle section expand/collapse ──
function toggleSection(id) {
    const body = document.getElementById('body-' + id);
    const chevron = document.getElementById('chevron-' + id);

    if (collapsed.has(id)) {
        collapsed.delete(id);
        body.classList.remove('collapsed');
        chevron.classList.remove('collapsed');
    } else {
        collapsed.add(id);
        body.classList.add('collapsed');
        chevron.classList.add('collapsed');
    }
}

// ── Update progress indicators ──
function updateProgress() {
    const n = checked.size;
    const pct = (n / TOTAL) * 100;

    checkedCountEl.textContent = n;
    progressBarEl.style.width = pct + '%';
    progressLabelEl.textContent = Math.round(pct) + '% завършено';

    // SVG ring (circumference r=50 → 2πr ≈ 314.16)
    const circumference = 314.16;
    const offset = circumference - (pct / 100) * circumference;
    ringFillEl.style.strokeDashoffset = offset;

    // Remaining hint
    const rem = TOTAL - n;
    remainingCount.textContent = rem;
    if (rem === 0) {
        remainingHint.classList.add('hidden');
    } else {
        remainingHint.classList.remove('hidden');
    }

    // Finish button
    if (n === TOTAL) {
        btnFinish.disabled = false;
        btnFinish.querySelector('.btn-icon').textContent = '🚀';
        btnFinish.querySelector('.btn-label').textContent = 'Финализирай чек листа';
    } else {
        btnFinish.disabled = true;
        btnFinish.querySelector('.btn-icon').textContent = '🔒';
    }
}

// ── Update per-section counter ──
function updateSectionProgress(sectionId) {
    const total = SECTION_TOTALS[sectionId];
    const items = document.querySelectorAll(`.checklist-item[data-section="${sectionId}"]`);
    const done = [...items].filter(i => checked.has(parseInt(i.dataset.id))).length;
    const progEl = document.getElementById('prog-' + sectionId);
    const sectionEl = document.querySelector(`.checklist-section[data-section="${sectionId}"]`);

    progEl.textContent = done + '/' + total;

    if (done === total) {
        sectionEl.classList.add('section-complete');
    } else {
        sectionEl.classList.remove('section-complete');
    }
}

// ── Finish / Success ──
function finishChecklist() {
    if (checked.size < TOTAL) return;
    successOverlay.classList.add('visible');
    playSuccessSound();
}

function resetChecklist() {
    checked.clear();
    document.querySelectorAll('.checklist-item.checked').forEach(el => {
        el.classList.remove('checked');
    });
    updateProgress();
    Object.keys(SECTION_TOTALS).forEach(updateSectionProgress);
    successOverlay.classList.remove('visible');
}

// ── Audio ──
function playSuccessSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.16;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
            osc.start(t);
            osc.stop(t + 0.65);
        });
    } catch (e) { /* AudioContext not supported */ }
}

// ── Init ──
updateProgress();
Object.keys(SECTION_TOTALS).forEach(updateSectionProgress);
