/* ───── Circa prototype interactions ───── */

// ───── tab nav ─────
const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.target;
    tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
    screens.forEach((s) => s.classList.toggle('is-active', s.dataset.screen === target));
    if (navigator.vibrate) navigator.vibrate(8);
  });
});

// ───── roda da vida ─────
const AREAS = [
  { key: 'saude',   label: 'saúde',        value: 7 },
  { key: 'carreira',label: 'carreira',     value: 8 },
  { key: 'familia', label: 'família',      value: 6 },
  { key: 'relac',   label: 'relações',     value: 5 },
  { key: 'lazer',   label: 'lazer',        value: 4 },
  { key: 'desenv',  label: 'desenvolv.',   value: 6 },
  { key: 'espirit', label: 'espírito',     value: 3 },
  { key: 'financas',label: 'finanças',     value: 5 },
];

const R_MAX = 130;
const R_MIN = 10;

const svg       = document.getElementById('wheel');
const spokesEl  = document.getElementById('wheel-spokes');
const handlesEl = document.getElementById('wheel-handles');
const labelsEl  = document.getElementById('wheel-labels');
const shape     = document.getElementById('wheel-shape');

function angleFor(i) {
  // start at top, go clockwise
  return (-Math.PI / 2) + (i / AREAS.length) * Math.PI * 2;
}

function pointFor(i, v) {
  const a = angleFor(i);
  const r = R_MIN + (R_MAX - R_MIN) * (v / 10);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function labelPointFor(i) {
  const a = angleFor(i);
  const r = R_MAX + 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function renderWheel() {
  // spokes
  spokesEl.innerHTML = AREAS.map((_, i) => {
    const a = angleFor(i);
    const x2 = Math.cos(a) * R_MAX;
    const y2 = Math.sin(a) * R_MAX;
    return `<line class="wheel__spoke" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');

  // labels
  labelsEl.innerHTML = AREAS.map((area, i) => {
    const p = labelPointFor(i);
    return `<text class="wheel__label" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${area.label}</text>`;
  }).join('');

  updateShape();
}

function updateShape() {
  const pts = AREAS.map((a, i) => {
    const p = pointFor(i, a.value);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  shape.setAttribute('points', pts);

  // handles
  handlesEl.innerHTML = AREAS.map((a, i) => {
    const p = pointFor(i, a.value);
    return `<circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7" data-i="${i}"/>`;
  }).join('');

  // re-bind drag after re-render
  handlesEl.querySelectorAll('.wheel__handle').forEach(attachDrag);
}

function attachDrag(handle) {
  let dragging = false;
  const i = parseInt(handle.dataset.i, 10);

  const start = (ev) => {
    ev.preventDefault();
    dragging = true;
    if (navigator.vibrate) navigator.vibrate(6);
  };

  const move = (ev) => {
    if (!dragging) return;
    const pt = getSvgPoint(ev);
    if (!pt) return;
    const a = angleFor(i);
    // project pt onto spoke direction
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const proj = pt.x * dx + pt.y * dy;
    const r = Math.max(R_MIN, Math.min(R_MAX, proj));
    const v = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 10);
    if (v !== AREAS[i].value) {
      AREAS[i].value = v;
      updateShape();
      if (navigator.vibrate) navigator.vibrate(3);
    }
  };

  const end = () => { dragging = false; };

  handle.addEventListener('mousedown', start);
  handle.addEventListener('touchstart', start, { passive: false });
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);
}

function getSvgPoint(ev) {
  const t = ev.touches ? ev.touches[0] : ev;
  const pt = svg.createSVGPoint();
  pt.x = t.clientX;
  pt.y = t.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  return pt.matrixTransform(ctm.inverse());
}

if (svg) renderWheel();

// ───── mood sliders ─────
document.querySelectorAll('.slider__input').forEach((input) => {
  input.addEventListener('input', () => {
    if (navigator.vibrate) navigator.vibrate(2);
  });
  input.addEventListener('change', () => {
    if (navigator.vibrate) navigator.vibrate(10);
  });
});

// ───── button micro-feedback ─────
document.querySelectorAll('.btn, .quick__item').forEach((b) => {
  b.addEventListener('click', () => {
    if (navigator.vibrate) navigator.vibrate(12);
  });
});
