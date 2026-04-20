/* ───── Circa prototype interactions ───── */

const hap = (n = 8) => navigator.vibrate && navigator.vibrate(n);

// ───── tab nav ─────
const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');

function goTo(target) {
  tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.target === target));
  screens.forEach((s) => s.classList.toggle('is-active', s.dataset.screen === target));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    goTo(tab.dataset.target);
    hap(8);
  });
});

// ───── sheet (modal bottom) ─────
const sheets = document.querySelectorAll('.sheet');

function openSheet(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.classList.add('is-open');
  s.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  hap(10);
}

function closeSheet() {
  sheets.forEach((s) => {
    s.classList.remove('is-open');
    s.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

sheets.forEach((s) => {
  s.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeSheet));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

// ───── score hero click ─────
const hero = document.getElementById('hero-btn');
if (hero) {
  hero.addEventListener('click', () => {
    openSheet('sheet-score');
    renderWow();
  });
}

// ───── lab card click ─────
const labOpen = document.getElementById('lab-open');
if (labOpen) {
  labOpen.addEventListener('click', () => openSheet('sheet-lab'));
}

// ───── training card click ─────
const trainingOpen = document.getElementById('training-open');
if (trainingOpen) {
  trainingOpen.addEventListener('click', () => openSheet('sheet-training'));
}

// ───── treino por dia ─────
const WEEK_WORKOUTS = {
  seg: { day: 'seg', label: 'segunda', type: 'musculação', subtitle: 'peito & tríceps · 60min', status: 'done',
         exercises: [
           { name: 'supino reto',        meta: '4 × 8 · 80kg' },
           { name: 'supino inclinado',   meta: '3 × 10 · 60kg' },
           { name: 'crucifixo',          meta: '3 × 12 · 14kg' },
           { name: 'tríceps corda',      meta: '4 × 12 · 22kg' },
           { name: 'tríceps francês',    meta: '3 × 10 · 18kg' },
         ]},
  ter: { day: 'ter', label: 'terça', type: 'bola', subtitle: '2h · alta intensidade', status: 'done',
         exercises: [
           { name: 'aquecimento',        meta: '10 min' },
           { name: 'jogo recreativo',    meta: '90 min' },
           { name: 'alongamento',        meta: '15 min' },
         ]},
  qua: { day: 'qua', label: 'quarta', type: 'musculação', subtitle: 'costas & bíceps · 60min', status: 'done',
         exercises: [
           { name: 'puxada frontal',     meta: '4 × 10 · 55kg' },
           { name: 'remada curvada',     meta: '4 × 8 · 60kg' },
           { name: 'remada baixa',       meta: '3 × 10 · 50kg' },
           { name: 'rosca direta',       meta: '4 × 10 · 16kg' },
           { name: 'rosca martelo',      meta: '3 × 12 · 14kg' },
         ]},
  qui: { day: 'qui', label: 'quinta', type: 'descanso ativo', subtitle: 'mobilidade · 30min', status: 'rest',
         exercises: [
           { name: 'cervical',           meta: '5 min' },
           { name: 'lombar',             meta: '10 min' },
           { name: 'quadril',            meta: '10 min' },
           { name: 'respiração',         meta: '5 min' },
         ]},
  sex: { day: 'sex', label: 'sexta', type: 'musculação', subtitle: 'pernas · 75min', status: 'done',
         exercises: [
           { name: 'agachamento livre',  meta: '5 × 6 · 100kg' },
           { name: 'leg press',          meta: '4 × 10 · 180kg' },
           { name: 'extensora',          meta: '3 × 12 · 45kg' },
           { name: 'stiff',              meta: '4 × 10 · 70kg' },
           { name: 'panturrilha',        meta: '4 × 15 · 100kg' },
         ]},
  sab: { day: 'sab', label: 'sábado', type: 'bola + corrida leve', subtitle: '17:00 – 19:00 · hoje', status: 'today',
         exercises: [
           { name: 'corrida leve',       meta: '20 min · pace 6:30' },
           { name: 'aquecimento c/ bola',meta: '10 min' },
           { name: 'jogo',               meta: '90 min' },
           { name: 'desaquecimento',     meta: '10 min' },
         ]},
  dom: { day: 'dom', label: 'domingo', type: 'descanso', subtitle: 'sem treino programado', status: 'rest',
         exercises: []},
};

let currentDayKey = null;
let dayEditing = false;

function openDay(key) {
  const d = WEEK_WORKOUTS[key];
  if (!d) return;
  currentDayKey = key;
  dayEditing = false;

  document.getElementById('day-eyebrow').textContent = 'dia · ' + d.label;
  document.getElementById('day-title').textContent = d.type;
  document.getElementById('day-subtitle').textContent = d.subtitle;

  const statusEl = document.getElementById('day-status');
  statusEl.className = 'day-status';
  if (d.status === 'done')  { statusEl.textContent = 'feito'; statusEl.classList.add('is-done'); }
  if (d.status === 'today') { statusEl.textContent = 'hoje · em aberto'; statusEl.classList.add('is-today'); }
  if (d.status === 'plan')  { statusEl.textContent = 'planejado'; statusEl.classList.add('is-plan'); }
  if (d.status === 'rest')  { statusEl.textContent = 'descanso'; statusEl.classList.add('is-rest'); }

  renderDayExercises();

  // estado do botão "marcar feito"
  const tgl = document.getElementById('day-toggle-done');
  const tglLabel = document.getElementById('day-toggle-label');
  if (tgl && tglLabel) {
    tgl.classList.toggle('is-active', d.status === 'done');
    tglLabel.textContent = d.status === 'done' ? '✓ feito — desfazer' : 'marcar feito';
  }

  // reset edit mode & swap panel
  document.getElementById('day-exercises').classList.remove('is-editing');
  document.getElementById('day-swap').style.display = 'none';
  document.getElementById('day-exercises-wrap').style.display = '';
  document.getElementById('day-actions').style.display = '';

  openSheet('sheet-day');
}

function renderDayExercises() {
  const d = WEEK_WORKOUTS[currentDayKey];
  const ul = document.getElementById('day-exercises');
  if (!d || !ul) return;
  if (!d.exercises.length) {
    ul.innerHTML = '<li class="day-ex"><span class="day-ex__name" style="color:var(--fg-muted)">sem exercícios nesse dia.</span></li>';
    return;
  }
  ul.innerHTML = d.exercises.map((ex, i) => `
    <li class="day-ex" data-i="${i}">
      <span class="day-ex__name">${ex.name}</span>
      <span class="day-ex__meta">${ex.meta}</span>
      <button class="day-ex__rm" data-rm="${i}" aria-label="remover">✕</button>
    </li>
  `).join('');
  ul.querySelectorAll('[data-rm]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.rm, 10);
      d.exercises.splice(i, 1);
      renderDayExercises();
      hap(8);
    });
  });
}

// clique em qualquer dia da semana
document.querySelectorAll('.wp-day').forEach((el) => {
  el.addEventListener('click', () => {
    const key = el.dataset.day;
    if (key) openDay(key);
  });
});

// toggle feito
const dayToggle = document.getElementById('day-toggle-done');
if (dayToggle) {
  dayToggle.addEventListener('click', () => {
    const d = WEEK_WORKOUTS[currentDayKey];
    if (!d) return;
    d.status = d.status === 'done' ? (currentDayKey === 'sab' ? 'today' : 'plan') : 'done';
    hap(12);
    openDay(currentDayKey); // re-render
  });
}

// editar
const dayEdit = document.getElementById('day-edit');
if (dayEdit) {
  dayEdit.addEventListener('click', () => {
    dayEditing = !dayEditing;
    document.getElementById('day-exercises').classList.toggle('is-editing', dayEditing);
    dayEdit.classList.toggle('is-active', dayEditing);
    dayEdit.querySelector('span').textContent = dayEditing ? 'concluir' : 'editar';
    hap(8);
  });
}

// adicionar exercício
const dayAddEx = document.getElementById('day-add-ex');
if (dayAddEx) {
  dayAddEx.addEventListener('click', () => {
    const d = WEEK_WORKOUTS[currentDayKey];
    if (!d) return;
    d.exercises.push({ name: 'novo exercício', meta: '3 × 10' });
    renderDayExercises();
    if (!dayEditing) dayEdit.click();
    hap(8);
  });
}

// trocar treino
const daySwapBtn = document.getElementById('day-swap-btn');
const daySwap = document.getElementById('day-swap');
if (daySwapBtn && daySwap) {
  daySwapBtn.addEventListener('click', () => {
    const show = daySwap.style.display === 'none';
    daySwap.style.display = show ? '' : 'none';
    document.getElementById('day-exercises-wrap').style.display = show ? 'none' : '';
    document.getElementById('day-actions').style.display = show ? 'none' : '';
    hap(8);
  });
  const cancel = document.getElementById('day-swap-cancel');
  if (cancel) cancel.addEventListener('click', () => {
    daySwap.style.display = 'none';
    document.getElementById('day-exercises-wrap').style.display = '';
    document.getElementById('day-actions').style.display = '';
    hap(6);
  });
}

// apply swap
const SWAP_TEMPLATES = {
  'strength-upper': { type: 'força · superior', subtitle: 'peito, ombro, tríceps · 60min', status: 'plan',
    exercises: [
      { name: 'supino reto',       meta: '4 × 8 · 80kg' },
      { name: 'desenvolvimento',   meta: '4 × 10 · 22kg' },
      { name: 'elevação lateral',  meta: '3 × 12 · 10kg' },
      { name: 'tríceps corda',     meta: '4 × 12 · 22kg' },
    ]},
  'strength-lower': { type: 'força · inferior', subtitle: 'pernas, glúteo · 75min', status: 'plan',
    exercises: [
      { name: 'agachamento',       meta: '5 × 6 · 100kg' },
      { name: 'leg press',         meta: '4 × 10 · 180kg' },
      { name: 'stiff',             meta: '4 × 10 · 70kg' },
      { name: 'panturrilha',       meta: '4 × 15 · 100kg' },
    ]},
  cardio: { type: 'cardio', subtitle: 'corrida ou bike · 45min', status: 'plan',
    exercises: [
      { name: 'aquecimento',       meta: '5 min' },
      { name: 'corrida steady',    meta: '35 min · pace 5:30' },
      { name: 'desaquecimento',    meta: '5 min' },
    ]},
  mobility: { type: 'mobilidade', subtitle: 'alongamento + core · 30min', status: 'plan',
    exercises: [
      { name: 'cervical',          meta: '5 min' },
      { name: 'quadril',           meta: '10 min' },
      { name: 'core',              meta: '10 min' },
      { name: 'respiração',        meta: '5 min' },
    ]},
  rest: { type: 'descanso', subtitle: 'recovery passivo', status: 'rest', exercises: [] },
};

document.querySelectorAll('.swap-opt').forEach((opt) => {
  opt.addEventListener('click', () => {
    const key = opt.dataset.swap;
    const tpl = SWAP_TEMPLATES[key];
    const d = WEEK_WORKOUTS[currentDayKey];
    if (!tpl || !d) return;
    d.type = tpl.type;
    d.subtitle = tpl.subtitle;
    d.status = tpl.status;
    d.exercises = tpl.exercises.map((x) => ({ ...x }));
    hap(15);
    openDay(currentDayKey);
  });
});

// remover → dia vira descanso
const dayRemove = document.getElementById('day-remove');
if (dayRemove) {
  dayRemove.addEventListener('click', () => {
    const d = WEEK_WORKOUTS[currentDayKey];
    if (!d) return;
    d.type = 'descanso';
    d.subtitle = 'sem treino programado';
    d.status = 'rest';
    d.exercises = [];
    hap(15);
    openDay(currentDayKey);
  });
}

// ───── "que a circa revise" ─────
const openReview = document.getElementById('open-review');
if (openReview) {
  openReview.addEventListener('click', () => {
    // fake thinking delay
    openReview.disabled = true;
    const orig = openReview.innerHTML;
    openReview.innerHTML = '<span class="ob-thinking">analisando teus últimos 21 dias…</span>';
    hap(15);
    setTimeout(() => {
      closeSheet();
      setTimeout(() => {
        openSheet('sheet-review');
        openReview.disabled = false;
        openReview.innerHTML = orig;
      }, 260);
    }, 1800);
  });
}

// ───── water ─────
let waterMl = 1800;
const waterGoal = 2800;
const waterMlEl    = document.getElementById('water-ml');
const waterBigEl   = document.getElementById('water-big');
const waterBarEl   = document.getElementById('water-bar-fill');
const waterStatus  = document.getElementById('water-status');
const waterLevel   = document.getElementById('waterLevel');

function updateWater() {
  const L = (waterMl / 1000).toFixed(1);
  if (waterMlEl)  waterMlEl.textContent  = L;
  if (waterBigEl) waterBigEl.textContent = L;
  const pct = Math.min(100, (waterMl / waterGoal) * 100);
  if (waterBarEl) waterBarEl.style.width = pct + '%';
  if (waterStatus) {
    const delta = Math.round(((waterMl - waterGoal) / waterGoal) * 100);
    if (pct >= 95) {
      waterStatus.textContent = 'meta batida · ✓';
      waterStatus.className = 'water-status is-on';
    } else {
      waterStatus.textContent = Math.abs(delta) + '% abaixo da meta';
      waterStatus.className = 'water-status is-low';
    }
  }
  // bottle visual fill
  if (waterLevel) {
    const full = 56; // viewBox height
    const fillPct = Math.min(1, waterMl / waterGoal);
    const y = full - fillPct * full;
    waterLevel.setAttribute('y', y.toFixed(1));
    waterLevel.setAttribute('height', (fillPct * full).toFixed(1));
  }
}
updateWater();

document.querySelectorAll('.water-add').forEach((b) => {
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    const add = parseInt(b.dataset.add, 10);
    waterMl = Math.max(0, Math.min(waterGoal + 500, waterMl + add));
    updateWater();
    hap(12);
  });
});

const waterOpen = document.getElementById('water-open');
if (waterOpen) {
  waterOpen.addEventListener('click', (e) => {
    // avoid firing when the +button bubbles (stopPropagation on button)
    openSheet('sheet-water');
    buildMonthGrid();
  });
}

// water sheet tabs
const wtTabs = document.querySelectorAll('.wt-tab');
wtTabs.forEach((t) => {
  t.addEventListener('click', () => {
    wtTabs.forEach((x) => x.classList.toggle('is-on', x === t));
    const range = t.dataset.range;
    document.getElementById('water-range-week').style.display  = range === 'week' ? '' : 'none';
    document.getElementById('water-range-month').style.display = range === 'month' ? '' : 'none';
    hap(6);
  });
});

function buildMonthGrid() {
  const grid = document.getElementById('water-month-grid');
  if (!grid || grid.children.length) return;
  // 30 days, simulated pct buckets
  const sample = [3,4,3,2,1,3,4,3,3,2,1,4,3,3,2,3,4,4,2,1,3,3,4,2,1,3,3,4,3,2];
  grid.innerHTML = sample.map((p) => `<div class="wm-cell" data-pct="${p}"></div>`).join('');
}

// ───── WoW chart ─────
const WOW_DATA = [62, 64, 60, 68, 66, 70, 72, 69, 74, 71, 76, 73, 75, 78];

function movingAvg(arr, k = 7) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - k + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function pathFromSeries(series, w = 320, h = 100, pad = 8) {
  const min = Math.min(...series) - 4;
  const max = Math.max(...series) + 4;
  const stepX = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return { line, area, lastPt: pts[pts.length - 1] };
}

function renderWow() {
  const line = document.getElementById('wow-line');
  const area = document.getElementById('wow-area');
  const avg  = document.getElementById('wow-avg');
  const dot  = document.getElementById('wow-dot');
  if (!line) return;
  const a = pathFromSeries(WOW_DATA);
  const b = pathFromSeries(movingAvg(WOW_DATA));
  line.setAttribute('d', a.line);
  area.setAttribute('d', a.area);
  avg.setAttribute('d', b.line);
  dot.setAttribute('cx', a.lastPt[0]);
  dot.setAttribute('cy', a.lastPt[1]);
}

// ───── área (roda) data + modal ─────
const AREA_DETAILS = {
  saude:    { title: 'saúde',         goal: 9, last: 'treino hoje · bola 2h',           suggest: 'mantenha cadência. 3 treinos matinais essa semana.' },
  carreira: { title: 'carreira',      goal: 9, last: '2h de deep work ontem',           suggest: 'bloqueia 90min amanhã cedo pro projeto X.' },
  familia:  { title: 'família',       goal: 8, last: 'ligou pra mãe há 4 dias',         suggest: 'marca um almoço esse fim de semana.' },
  relac:    { title: 'relações',      goal: 8, last: 'última refeição social há 9 dias', suggest: 'convida alguém pro jantar de sábado.' },
  lazer:    { title: 'lazer',         goal: 7, last: 'nada logado essa semana',          suggest: 'tira 1h hoje pra algo que não é produtivo.' },
  desenv:   { title: 'desenvolvimento', goal: 8, last: 'leu 20min ontem',                suggest: 'continua no mesmo livro — consistência > volume.' },
  espirit:  { title: 'espírito',      goal: 7, last: 'última prática 12 dias atrás',     suggest: 'você marcou meditação como prática. 10min hoje?' },
  financas: { title: 'finanças',      goal: 8, last: 'sem registro esse mês',            suggest: 'define esse mês onde tá a meta dos 30%.' },
};

const AREA_HIST = {
  saude:    [6, 6, 7, 7, 6, 7, 7, 7],
  carreira: [7, 7, 8, 8, 8, 8, 8, 8],
  familia:  [6, 7, 6, 6, 5, 6, 6, 6],
  relac:    [7, 6, 6, 5, 5, 5, 5, 5],
  lazer:    [5, 5, 4, 5, 4, 4, 4, 4],
  desenv:   [5, 5, 6, 6, 6, 6, 6, 6],
  espirit:  [5, 4, 4, 4, 3, 3, 3, 3],
  financas: [6, 6, 5, 5, 5, 5, 5, 5],
};

function openArea(key) {
  const d = AREA_DETAILS[key];
  const a = AREAS.find((x) => x.key === key);
  if (!d || !a) return;
  document.getElementById('area-eyebrow').textContent = 'área · ' + d.title;
  document.getElementById('area-title').textContent = d.title;
  document.getElementById('area-now').textContent = a.value;
  document.getElementById('area-goal').textContent = d.goal;
  document.getElementById('area-last').textContent = d.last;
  document.getElementById('area-suggest').textContent = d.suggest;
  document.getElementById('area-log-label').textContent = '+ registrar em ' + d.title;

  const line = document.getElementById('area-line');
  if (line) {
    const p = pathFromSeries(AREA_HIST[key] || [5,5,5,5,5,5,5,5]);
    line.setAttribute('d', p.line);
  }
  openSheet('sheet-area');
}

// current area key (set on open)
let currentAreaKey = null;

// histórico simulado: 1 = praticou, 0 = não
const PRACTICE_HIST = {
  espirit:  [1,0,0,0,0,0,0,0,0,0,0,0,0,0], // última prática há 13 dias
  saude:    [1,1,0,1,1,1,0,1,1,0,1,1,1,0],
  carreira: [1,1,1,1,1,0,0,1,1,1,1,1,0,0],
  familia:  [0,0,1,0,0,0,0,1,0,0,0,0,0,1],
  relac:    [0,0,0,0,1,0,0,0,0,0,0,0,0,0],
  lazer:    [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  desenv:   [1,1,0,1,0,1,0,1,0,0,1,0,1,0],
  financas: [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};

// override openArea to also render history if applicable
const _origOpenArea = openArea;
openArea = function(key) {
  currentAreaKey = key;
  _origOpenArea(key);
  renderHistory(key);
  resetPostPractice();
};

function renderHistory(key) {
  const wrap = document.getElementById('area-history');
  const dots = document.getElementById('history-dots');
  if (!wrap || !dots) return;
  // só mostra pra áreas que tem prática binária (espírito como âncora)
  if (key === 'espirit') {
    const arr = PRACTICE_HIST[key] || [];
    dots.innerHTML = arr.map((v, i) => {
      const cls = v ? 'h-dot--on' : 'h-dot--off';
      return `<i class="h-dot ${cls}" title="${i === 13 ? 'hoje' : (13 - i) + 'd atrás'}"></i>`;
    }).join('');
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

function resetPostPractice() {
  const pp = document.getElementById('post-practice');
  if (pp) pp.style.display = 'none';
  const btn = document.getElementById('area-log-btn');
  if (btn) { btn.style.display = ''; btn.style.opacity = ''; btn.disabled = false; }
}

const areaLogBtn = document.getElementById('area-log-btn');
if (areaLogBtn) {
  areaLogBtn.addEventListener('click', () => {
    hap(15);
    // pra espírito, mostrar slider pós-prática em vez de fechar
    if (currentAreaKey === 'espirit') {
      const pp = document.getElementById('post-practice');
      if (pp) pp.style.display = '';
      areaLogBtn.style.display = 'none';
      // update history instantly: last dot fica ligado
      const arr = PRACTICE_HIST[currentAreaKey] || [];
      if (arr.length) {
        arr[arr.length - 1] = 1;
        renderHistory(currentAreaKey);
      }
    } else {
      areaLogBtn.textContent = '✓ registrado';
      areaLogBtn.style.opacity = '0.7';
      setTimeout(() => { closeSheet(); areaLogBtn.style.opacity = ''; }, 600);
    }
  });
}

// post-practice slider
const ppSlider = document.getElementById('pp-slider');
const ppValue  = document.getElementById('pp-value');
if (ppSlider && ppValue) {
  ppSlider.addEventListener('input', () => {
    ppValue.textContent = ppSlider.value;
    hap(2);
  });
}
const ppSkip = document.getElementById('pp-skip');
const ppSave = document.getElementById('pp-save');
if (ppSkip) ppSkip.addEventListener('click', () => { closeSheet(); hap(8); });
if (ppSave) ppSave.addEventListener('click', () => {
  ppSave.textContent = '✓';
  hap(15);
  setTimeout(() => { closeSheet(); ppSave.textContent = 'salvar'; }, 500);
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
  spokesEl.innerHTML = AREAS.map((_, i) => {
    const a = angleFor(i);
    const x2 = Math.cos(a) * R_MAX;
    const y2 = Math.sin(a) * R_MAX;
    return `<line class="wheel__spoke" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');

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

  handlesEl.innerHTML = AREAS.map((a, i) => {
    const p = pointFor(i, a.value);
    return `
      <g class="wheel__grp" data-i="${i}">
        <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" data-i="${i}"/>
        <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
      </g>
    `;
  }).join('');

  handlesEl.querySelectorAll('.wheel__handle').forEach(attachHandle);
}

function attachHandle(handle) {
  let dragging = false;
  let moved = false;
  let startPt = null;
  const i = parseInt(handle.dataset.i, 10);

  const start = (ev) => {
    ev.preventDefault();
    dragging = true;
    moved = false;
    startPt = getSvgPoint(ev);
    hap(6);
  };

  const move = (ev) => {
    if (!dragging) return;
    const pt = getSvgPoint(ev);
    if (!pt) return;
    if (startPt) {
      const dx = pt.x - startPt.x;
      const dy = pt.y - startPt.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
    }
    const a = angleFor(i);
    const projX = Math.cos(a);
    const projY = Math.sin(a);
    const proj = pt.x * projX + pt.y * projY;
    const r = Math.max(R_MIN, Math.min(R_MAX, proj));
    const v = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 10);
    if (v !== AREAS[i].value) {
      AREAS[i].value = v;
      updateShape();
      hap(3);
    }
  };

  const end = () => {
    if (dragging && !moved) {
      openArea(AREAS[i].key);
    }
    dragging = false;
    moved = false;
  };

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

// ───── mood sliders → score reativo ─────
const SCORE_BASE = { sono: 16, comida: 18, treino: 18 }; // static for prototype
const SCORE_WEIGHTS = { humor: 30, sono: 25, comida: 25, treino: 20 };

function moodToHumorContrib() {
  const energy = parseInt(document.querySelector('[data-metric="energy"]').value, 10);
  const humor  = parseInt(document.querySelector('[data-metric="mood"]').value, 10);
  const anx    = parseInt(document.querySelector('[data-metric="anx"]').value, 10);
  // base positiva: energia + humor (cada ponto vale 3) → até 30 pts
  // penalidade da ansiedade (cada ponto tira 1.5) → até -7.5 pts
  // clamp em 0 pra não ficar negativo
  const raw = (energy + humor) * 3 - anx * 1.5;
  return Math.max(0, Math.round(raw));
}

function computeScore() {
  return moodToHumorContrib() + SCORE_BASE.sono + SCORE_BASE.comida + SCORE_BASE.treino;
}

// yesterday's score (static for prototype demo)
const YESTERDAY_SCORE = 66;
const META_3M = 82;
const PATTERN_RANGE = [65, 78]; // "homens ativos aos sábados"

function stateWord(score) {
  if (score >= 90) return 'voando';
  if (score >= 80) return 'firme';
  if (score >= 70) return 'em ritmo';
  if (score >= 60) return 'carregando';
  if (score >= 45) return 'atenção';
  return 'precisa descanso';
}

function narrativeLine(score, humorContrib) {
  const h = humorContrib;
  // regras simples pra prototipo — produção isso vira call pro Claude
  if (h >= 26) return 'humor alto puxou o dia. sono curto ainda pesa.';
  if (h >= 22) return 'dia em ritmo. treino ajudou, sono puxou.';
  if (h >= 16) return 'dia truncado. amanhã começa zerado.';
  return 'humor baixo pesou. respira, amanhã refaz.';
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function updateGlow(score) {
  // t = 0 → bronze dim · 0.5 → champagne · 1 → amarelo quente
  const t = clamp(score / 100, 0.2, 1);

  // cor do stop "alto" do gradiente (mais claro/amarelo em scores altos)
  const r = Math.round(lerp(150, 255, t));
  const g = Math.round(lerp(118, 224, t));
  const b = Math.round(lerp(80, 130, t));

  // cor do stop "baixo" do gradiente (um tom abaixo pro contraste interno)
  const rLo = Math.round(lerp(125, 235, t));
  const gLo = Math.round(lerp(95, 185, t));
  const bLo = Math.round(lerp(65, 95, t));

  const strength = lerp(0.35, 1.15, t); // intensidade do glow

  // set CSS vars no root pra halo + anel
  const root = document.documentElement;
  root.style.setProperty('--glow-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--glow-strength', strength);

  // coroa aparece a partir de 85, peaka em 95+
  const crownOpacity = clamp((score - 85) / 10, 0, 1);
  root.style.setProperty('--crown-opacity', crownOpacity.toFixed(2));

  // drop-shadow multi-camada no anel (mais amarelo + mais forte conforme sobe)
  root.style.setProperty('--ring-shadow', `
    drop-shadow(0 0 4px rgba(${r},${g},${b},${(strength * 1.0).toFixed(2)}))
    drop-shadow(0 0 14px rgba(${r},${g},${b},${(strength * 0.65).toFixed(2)}))
    drop-shadow(0 0 34px rgba(${r},${g},${b},${(strength * 0.4).toFixed(2)}))
    drop-shadow(0 0 70px rgba(${r},${g},${b},${(strength * 0.22).toFixed(2)}))
  `);

  // gradient stops do anel
  const stopLo = document.querySelector('#ringGrad stop:first-child');
  const stopHi = document.querySelector('#ringGrad stop:last-child');
  if (stopLo) stopLo.setAttribute('stop-color', `rgb(${r},${g},${b})`);
  if (stopHi) stopHi.setAttribute('stop-color', `rgb(${rLo},${gLo},${bLo})`);

  // glow também no número e na palavra de estado
  const heroVal = document.querySelector('.hero__value');
  if (heroVal) {
    heroVal.style.textShadow = `0 0 ${(12 + t * 24).toFixed(0)}px rgba(${r},${g},${b},${(strength * 0.35).toFixed(2)})`;
  }
  const stateEl = document.getElementById('hero-state');
  if (stateEl) {
    stateEl.style.textShadow = `0 0 ${(10 + t * 18).toFixed(0)}px rgba(${r},${g},${b},${(strength * 0.5).toFixed(2)})`;
  }
}

function updateHeroScore() {
  const total = computeScore();
  const humorContrib = moodToHumorContrib();

  // hero number
  const heroVal = document.querySelector('.hero__value');
  if (heroVal) heroVal.textContent = total;

  // ring fill
  const ringFill = document.querySelector('.ring__fill');
  if (ringFill) ringFill.setAttribute('stroke-dasharray', `${total} 100`);

  // glow dinâmico (cor + intensidade baseados no score)
  updateGlow(total);

  // state word
  const stateEl = document.getElementById('hero-state');
  if (stateEl) stateEl.textContent = stateWord(total);

  // delta chip
  const deltaEl  = document.getElementById('hero-delta');
  const deltaVal = document.getElementById('delta-val');
  const deltaArr = deltaEl && deltaEl.querySelector('.delta-arrow');
  const diff = total - YESTERDAY_SCORE;
  if (deltaEl && deltaVal && deltaArr) {
    deltaEl.classList.remove('is-down', 'is-flat');
    if (diff > 0)      { deltaArr.textContent = '▲'; deltaVal.textContent = diff; }
    else if (diff < 0) { deltaArr.textContent = '▼'; deltaVal.textContent = Math.abs(diff); deltaEl.classList.add('is-down'); }
    else               { deltaArr.textContent = '─'; deltaVal.textContent = 0; deltaEl.classList.add('is-flat'); }
  }

  // narrative
  const nar = document.getElementById('hero-narrative');
  if (nar) nar.textContent = narrativeLine(total, humorContrib);

  // meta 3m
  const goalGap = document.getElementById('hc-goal-gap');
  const goalBar = document.getElementById('hc-goal-bar');
  if (goalGap) {
    const gap = META_3M - total;
    goalGap.textContent = gap > 0 ? `caminho +${gap}` : gap < 0 ? `superou ${Math.abs(gap)}` : 'na meta';
  }
  if (goalBar) goalBar.style.width = Math.min(100, (total / META_3M) * 100) + '%';

  // pattern pin position (where you sit in the demographic range)
  const pin = document.getElementById('hc-range-pin');
  if (pin) {
    // range vai de 50 a 90 pra visualização (contexto amplo); faixa é 65-78 dentro disso
    const min = 50, max = 90;
    const clamped = Math.max(min, Math.min(max, total));
    const left = ((clamped - min) / (max - min)) * 100;
    pin.style.left = left + '%';
  }

  // humor row no sheet-score breakdown
  const humorRow = document.querySelector('.breakdown .bd-row:nth-child(1)');
  if (humorRow) {
    const pct = Math.round((humorContrib / SCORE_WEIGHTS.humor) * 100);
    humorRow.style.setProperty('--w', pct + '%');
    const bar = humorRow.querySelector('.bd-bar i');
    if (bar) bar.style.width = pct + '%';
    const val = humorRow.querySelector('.bd-val');
    if (val) {
      const first = val.firstChild;
      if (first) first.textContent = '+' + humorContrib + ' ';
    }
  }
}

// palavras qualitativas por métrica
const MOOD_WORDS = {
  energy: ['sem energia', 'baixa', 'pouca', 'ok', 'boa', 'cheia'],
  mood:   ['péssimo', 'baixo', 'instável', 'ok', 'bom', 'ótimo'],
  anx:    ['calma', 'leve', 'controlada', 'alta', 'tensa', 'em crise'],
};

// definições detalhadas pra sheet de status (abre ao tapar na palavra)
const STATUS_DEFS = {
  energy: {
    title: 'energia',
    hint:  'quanto teu corpo tem de bateria disponível pro dia.',
    levels: [
      { desc: 'exausto. corpo pedindo pra parar. comum após madrugada, doença ou semanas seguidas de déficit.' },
      { desc: 'bateria no fim. consegue funcionar, mas cada tarefa pesa. treino pesado hoje vai custar.' },
      { desc: 'engrenando devagar. faz o essencial sem brilho extra. ritmo mínimo sustentável.' },
      { desc: 'operando bem. dá conta do dia normal sem tropeço. treino moderado tranquilo.' },
      { desc: 'disposto. sobra pra fazer o extra — treino sério, foco prolongado, decisões difíceis.' },
      { desc: 'transbordando. dia com capacidade de alto rendimento em qualquer coisa que escolher.' },
    ]
  },
  mood: {
    title: 'humor',
    hint:  'como você tá se sentindo emocionalmente agora.',
    levels: [
      { desc: 'tristeza forte ou irritação difícil de controlar. dia pedindo cuidado extra — conversa, descanso, apoio.' },
      { desc: 'pra baixo, apagado. nada empolga muito. dia tá pesando.' },
      { desc: 'oscilando. alguns momentos bons, outros pesam. sensível a gatilho.' },
      { desc: 'estável. nem pra cima nem pra baixo. neutro funcional.' },
      { desc: 'satisfeito. dia com mais momentos bons que ruins. sensação de tá no lugar certo.' },
      { desc: 'animado, leve, conectado. dia redondo emocionalmente — aproveita.' },
    ]
  },
  anx: {
    title: 'ansiedade',
    hint:  'quanto ruído mental tá atrapalhando o presente. aqui, menos é melhor.',
    levels: [
      { desc: 'presente, relaxado. mente sem ruído de fundo. estado ideal.' },
      { desc: 'um alerta de fundo, mas sob controle. normal em dia de tarefa importante.' },
      { desc: 'preocupação existe mas não atrapalha o que precisa ser feito.' },
      { desc: 'começa a interferir — em decisões, sono, foco. atenção aqui.' },
      { desc: 'corpo tenso, ruminação constante. custa executar tarefa básica. dia pesado.' },
      { desc: 'sintomas físicos, pensamento acelerado, paralisia. procure apoio — não tem que passar sozinho.' },
    ]
  },
};

function openStatus(metric, value) {
  const def = STATUS_DEFS[metric];
  const words = MOOD_WORDS[metric];
  if (!def || !words) return;

  document.getElementById('status-eyebrow').textContent = def.title + ' · nível ' + value + '/5';
  document.getElementById('status-title').textContent = words[value];
  document.getElementById('status-hint').textContent = def.hint;

  const ul = document.getElementById('status-levels');
  ul.innerHTML = def.levels.map((lv, i) => `
    <li class="level-item ${i === value ? 'is-current' : ''}">
      <span class="level-num">${i}</span>
      <span class="level-name">${words[i]}</span>
      <span class="level-desc">${lv.desc}</span>
    </li>
  `).join('');

  openSheet('sheet-status');
}

// tornar a palavra clicável pra abrir explicação
document.querySelectorAll('.slider__word').forEach((el) => {
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  const handler = (e) => {
    e.stopPropagation();
    const metric = el.dataset.word;
    const input = document.querySelector(`[data-metric="${metric}"]`);
    if (!input) return;
    openStatus(metric, parseInt(input.value, 10));
    hap(8);
  };
  el.addEventListener('click', handler);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); }
  });
});

// para ansiedade, valores altos = ruim (semântica invertida)
const MOOD_WARN_AT = {
  energy: (v) => v <= 1,      // energia baixa = warn
  mood:   (v) => v <= 1,      // humor baixo = warn
  anx:    (v) => v >= 3,      // ansiedade alta = warn
};

document.querySelectorAll('.slider__input').forEach((input) => {
  const metric = input.dataset.metric;
  const valEl  = document.querySelector(`[data-value="${metric}"]`);
  const wordEl = document.querySelector(`[data-word="${metric}"]`);
  const sync = () => {
    const v = parseInt(input.value, 10);
    if (valEl)  valEl.textContent = v;
    if (wordEl) {
      wordEl.textContent = MOOD_WORDS[metric][v] || '—';
      wordEl.classList.toggle('slider__word--warn', MOOD_WARN_AT[metric](v));
    }
    updateHeroScore();
  };
  sync();
  input.addEventListener('input', () => { sync(); hap(2); });
  input.addEventListener('change', () => hap(10));
});

// primeiro render sincroniza com defaults
updateHeroScore();

// ───── "pronto" no humor volta pra home ─────
document.querySelectorAll('.screen--mood .btn--primary').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.textContent = '✓';
    setTimeout(() => {
      goTo('home');
      btn.textContent = 'pronto';
    }, 400);
  });
});

// ───── "comi" <-> "desfazer" (reversível) ─────
document.querySelectorAll('.card--action .btn--primary').forEach((btn) => {
  const originalLabel = btn.textContent;
  const card = btn.closest('.card--action');
  const trocaBtn = card && card.querySelector('.btn--ghost');
  btn.addEventListener('click', () => {
    if (!card) return;
    const done = card.classList.toggle('is-done');
    btn.textContent = done ? 'desfazer' : originalLabel;
    btn.classList.toggle('btn--undo', done);
    if (trocaBtn) trocaBtn.disabled = done;
    hap(done ? 15 : 8);
  });
});

// ───── top__close no humor volta pra home ─────
document.querySelectorAll('.top__close').forEach((b) => {
  b.addEventListener('click', () => goTo('home'));
});

// ───── generic button haptic ─────
document.querySelectorAll('.btn, .quick__item').forEach((b) => {
  b.addEventListener('click', () => hap(8));
});

// ───── QUICK LOG drawer ─────
const qd         = document.getElementById('qd');
const qdHandle   = document.getElementById('qd-handle');

function openQd() {
  if (!qd) return;
  qd.classList.add('is-open');
  qd.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  hap(10);
}
function closeQd() {
  if (!qd) return;
  qd.classList.remove('is-open');
  qd.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

qdHandle && qdHandle.addEventListener('click', openQd);
qd && qd.querySelectorAll('[data-close-qd]').forEach((el) => el.addEventListener('click', closeQd));

// ESC also closes qd (piggyback on existing handler pattern)
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQd(); });

// qd items routing
qd && qd.querySelectorAll('.qd__item').forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    hap(12);
    closeQd();
    setTimeout(() => {
      if (type === 'mood')    goTo('mood');
      if (type === 'lab')     goTo('labs');
      if (type === 'water')   { goTo('home'); const m = document.querySelector('[data-add="200"]'); if (m) m.click(); }
      if (type === 'workout') goTo('home');
      if (type === 'meal')    goTo('home');
      if (type === 'sleep')   goTo('home');
      if (type === 'spirit')  openArea('espirit');
      if (type === 'moment')  openSheet('sheet-moment');
    }, 120);
  });
});

// ───── PIN FAB · momento ─────
const pinFab = document.getElementById('pin-fab');
if (pinFab) pinFab.addEventListener('click', () => openSheet('sheet-moment'));

// moment modal — chip multi-select (dentro de cada grupo)
document.querySelectorAll('#sheet-moment .ob-chips').forEach((group) => {
  group.querySelectorAll('.ob-chip').forEach((c) => {
    c.addEventListener('click', () => {
      c.classList.toggle('is-on');
      hap(4);
    });
  });
});

const momentSave = document.getElementById('moment-save');
if (momentSave) {
  momentSave.addEventListener('click', () => {
    const orig = momentSave.textContent;
    momentSave.textContent = '✓ marcado';
    momentSave.style.opacity = '0.75';
    hap(18);
    setTimeout(() => {
      closeSheet();
      momentSave.textContent = orig;
      momentSave.style.opacity = '';
      // limpa textarea e chips
      const ta = document.getElementById('moment-text');
      if (ta) ta.value = '';
      document.querySelectorAll('#sheet-moment .ob-chip.is-on').forEach((c) => c.classList.remove('is-on'));
    }, 700);
  });
}

// ───── RITUAL SEMANAL ─────
const ritualOpen = document.getElementById('open-ritual');
if (ritualOpen) ritualOpen.addEventListener('click', () => {
  openSheet('sheet-ritual');
  renderRitualWheel();
  // reset steps
  showRitualStep('wheel');
});

function showRitualStep(name) {
  ['wheel', 'reflect', 'done'].forEach((s) => {
    const el = document.getElementById('ritual-step-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

const ritualToReflect = document.getElementById('ritual-to-reflect');
if (ritualToReflect) ritualToReflect.addEventListener('click', () => { showRitualStep('reflect'); hap(8); });

const ritualFinish = document.getElementById('ritual-finish');
if (ritualFinish) ritualFinish.addEventListener('click', () => { showRitualStep('done'); hap(15); });

// reflect slider value
const reflectS1 = document.getElementById('reflect-s1');
const reflectV1 = document.getElementById('reflect-v1');
if (reflectS1 && reflectV1) {
  reflectS1.addEventListener('input', () => {
    reflectV1.textContent = reflectS1.value;
    hap(2);
  });
}

// reflect yes/no toggle
document.querySelectorAll('#ritual-step-reflect .yn').forEach((b) => {
  b.addEventListener('click', () => {
    const grp = b.parentElement;
    grp.querySelectorAll('.yn').forEach((x) => x.classList.toggle('is-on', x === b));
    hap(6);
  });
});

// render ritual wheel (clona AREAS)
let ritualReady = false;
const RITUAL_AREAS = AREAS.map((a) => ({ ...a }));

function renderRitualWheel() {
  if (ritualReady) return;
  ritualReady = true;

  const rSvg     = document.getElementById('ritual-wheel');
  const rSpokes  = document.getElementById('ritual-wheel-spokes');
  const rHandles = document.getElementById('ritual-wheel-handles');
  const rLabels  = document.getElementById('ritual-wheel-labels');
  const rShape   = document.getElementById('ritual-wheel-shape');
  if (!rSvg) return;

  rSpokes.innerHTML = RITUAL_AREAS.map((_, i) => {
    const a = angleFor(i);
    const x2 = Math.cos(a) * R_MAX;
    const y2 = Math.sin(a) * R_MAX;
    return `<line class="wheel__spoke" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');

  rLabels.innerHTML = RITUAL_AREAS.map((area, i) => {
    const p = labelPointFor(i);
    return `<text class="wheel__label" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${area.label}</text>`;
  }).join('');

  function updateR() {
    const pts = RITUAL_AREAS.map((a, i) => {
      const p = pointFor(i, a.value);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    rShape.setAttribute('points', pts);

    rHandles.innerHTML = RITUAL_AREAS.map((a, i) => {
      const p = pointFor(i, a.value);
      return `
        <g data-i="${i}">
          <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" data-i="${i}"/>
          <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
        </g>
      `;
    }).join('');

    rHandles.querySelectorAll('.wheel__handle').forEach(bindR);
  }

  function bindR(handle) {
    let dragging = false;
    const i = parseInt(handle.dataset.i, 10);
    const start = (ev) => { ev.preventDefault(); dragging = true; hap(6); };
    const move = (ev) => {
      if (!dragging) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const pt = rSvg.createSVGPoint();
      pt.x = t.clientX; pt.y = t.clientY;
      const ctm = rSvg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      const a = angleFor(i);
      const proj = p.x * Math.cos(a) + p.y * Math.sin(a);
      const r = Math.max(R_MIN, Math.min(R_MAX, proj));
      const v = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 10);
      if (v !== RITUAL_AREAS[i].value) {
        RITUAL_AREAS[i].value = v;
        updateR();
        hap(3);
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

  updateR();
}

// "continuar" na tab Roda também abre o ritual (já que é a mesma coisa no onboarding)
const rodaContinue = document.getElementById('roda-continue');
if (rodaContinue) rodaContinue.addEventListener('click', () => { openSheet('sheet-ritual'); renderRitualWheel(); showRitualStep('wheel'); });

// swipe from left edge to open
let touchStartX = 0;
let touchStartY = 0;
let touchTracking = false;
window.addEventListener('touchstart', (e) => {
  if (!e.touches[0]) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchTracking = touchStartX < 24 && !qd.classList.contains('is-open');
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (!touchTracking || !e.touches[0]) return;
  const dx = e.touches[0].clientX - touchStartX;
  const dy = Math.abs(e.touches[0].clientY - touchStartY);
  if (dx > 40 && dy < 40) {
    touchTracking = false;
    openQd();
  }
}, { passive: true });
window.addEventListener('touchend', () => { touchTracking = false; }, { passive: true });

// swipe left on qd panel to close
const qdPanel = qd && qd.querySelector('.qd__panel');
if (qdPanel) {
  let sx = 0, sy = 0, tracking = false;
  qdPanel.addEventListener('touchstart', (e) => {
    if (!e.touches[0]) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });
  qdPanel.addEventListener('touchmove', (e) => {
    if (!tracking || !e.touches[0]) return;
    const dx = e.touches[0].clientX - sx;
    const dy = Math.abs(e.touches[0].clientY - sy);
    if (dx < -60 && dy < 40) {
      tracking = false;
      closeQd();
    }
  }, { passive: true });
  qdPanel.addEventListener('touchend', () => { tracking = false; }, { passive: true });
}

// ───── ONBOARDING ─────
const TOTAL_STEPS = 8;
let obStep = 1;
const onboard      = document.getElementById('onboard');
const obSlides     = document.querySelectorAll('.ob-slide');
const obProgress   = document.getElementById('ob-progress');
const obBackBtn    = document.getElementById('ob-back');
const obCloseBtn   = document.getElementById('ob-close');

function openOnboard() {
  obStep = 1;
  renderObStep();
  onboard.classList.add('is-open');
  onboard.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  hap(12);
}

function closeOnboard() {
  onboard.classList.remove('is-open');
  onboard.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderObStep() {
  obSlides.forEach((s) => {
    s.classList.toggle('is-active', parseInt(s.dataset.step, 10) === obStep);
  });
  obProgress.querySelectorAll('i').forEach((d, i) => {
    d.classList.toggle('is-done', i + 1 < obStep);
    d.classList.toggle('is-on',   i + 1 === obStep);
  });
  obBackBtn.disabled = obStep === 1;

  // initialize wheel on step 2
  if (obStep === 2) renderObWheel();
  // initialize goal wheel on step 3
  if (obStep === 3) renderObGoalWheel();
}

function nextStep() {
  if (obStep < TOTAL_STEPS) {
    obStep++;
    renderObStep();
    hap(6);
  }
}
function prevStep() {
  if (obStep > 1) {
    obStep--;
    renderObStep();
    hap(4);
  }
}

obBackBtn && obBackBtn.addEventListener('click', prevStep);
obCloseBtn && obCloseBtn.addEventListener('click', closeOnboard);

// generic "continuar" forward
document.querySelectorAll('.ob-next').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    nextStep();
  });
});

// step 1 · motivação (single select)
document.querySelectorAll('.ob-slide[data-step="1"] .ob-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ob-slide[data-step="1"] .ob-card').forEach((c) => c.classList.remove('is-on'));
    card.classList.add('is-on');
    document.querySelector('.ob-slide[data-step="1"] .ob-next').disabled = false;
    hap(8);
  });
});

// step 4 · toggle H/M
document.querySelectorAll('.ob-toggle').forEach((group) => {
  group.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      hap(6);
    });
  });
});

// step 5 · chips (multi)
document.querySelectorAll('.ob-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('is-on');
    hap(4);
  });
});

// step 6 · sentido (single)
document.querySelectorAll('.ob-slide[data-step="6"] .ob-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ob-slide[data-step="6"] .ob-card').forEach((c) => c.classList.remove('is-on'));
    card.classList.add('is-on');
    document.querySelector('.ob-slide[data-step="6"] .ob-next').disabled = false;
    hap(8);
  });
});

// step 8 · finish
const obFinish = document.getElementById('ob-finish');
if (obFinish) {
  obFinish.addEventListener('click', () => {
    closeOnboard();
    goTo('mood'); // primeiro check-in
  });
}

// trigger: top menu na home abre onboarding (pra demo)
document.querySelectorAll('.screen--home .top__menu').forEach((m) => {
  m.addEventListener('click', openOnboard);
});

// ───── onboarding wheel (step 2) ─────
const OB_AREAS = AREAS.map((a) => ({ ...a })); // clone
let obWheelReady = false;

function renderObWheel() {
  if (obWheelReady) return;
  obWheelReady = true;

  const obSvg       = document.getElementById('ob-wheel');
  const obSpokes    = document.getElementById('ob-wheel-spokes');
  const obHandles   = document.getElementById('ob-wheel-handles');
  const obLabels    = document.getElementById('ob-wheel-labels');
  const obShape     = document.getElementById('ob-wheel-shape');

  obSpokes.innerHTML = OB_AREAS.map((_, i) => {
    const a = angleFor(i);
    const x2 = Math.cos(a) * R_MAX;
    const y2 = Math.sin(a) * R_MAX;
    return `<line class="wheel__spoke" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');

  obLabels.innerHTML = OB_AREAS.map((area, i) => {
    const p = labelPointFor(i);
    return `<text class="wheel__label" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${area.label}</text>`;
  }).join('');

  function updateObShape() {
    const pts = OB_AREAS.map((a, i) => {
      const p = pointFor(i, a.value);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    obShape.setAttribute('points', pts);

    obHandles.innerHTML = OB_AREAS.map((a, i) => {
      const p = pointFor(i, a.value);
      return `
        <g data-i="${i}">
          <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" data-i="${i}"/>
          <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
        </g>
      `;
    }).join('');

    obHandles.querySelectorAll('.wheel__handle').forEach(bindObDrag);
  }

  function bindObDrag(handle) {
    let dragging = false;
    const i = parseInt(handle.dataset.i, 10);

    const start = (ev) => {
      ev.preventDefault();
      dragging = true;
      hap(6);
    };
    const move = (ev) => {
      if (!dragging) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const pt = obSvg.createSVGPoint();
      pt.x = t.clientX; pt.y = t.clientY;
      const ctm = obSvg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      const a = angleFor(i);
      const proj = p.x * Math.cos(a) + p.y * Math.sin(a);
      const r = Math.max(R_MIN, Math.min(R_MAX, proj));
      const v = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 10);
      if (v !== OB_AREAS[i].value) {
        OB_AREAS[i].value = v;
        updateObShape();
        hap(3);
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

  updateObShape();
}

// ───── onboarding goal wheel (step 3) ─────
const OB_GOAL = OB_AREAS.map((a) => ({ ...a, value: Math.min(10, a.value + 2) })); // +2 default
let obGoalReady = false;

function renderObGoalWheel() {
  if (obGoalReady) return;
  obGoalReady = true;

  const gSvg     = document.getElementById('ob-wheel-goal');
  const gSpokes  = document.getElementById('ob-wheel-goal-spokes');
  const gHandles = document.getElementById('ob-wheel-goal-handles');
  const gLabels  = document.getElementById('ob-wheel-goal-labels');
  const gShape   = document.getElementById('ob-wheel-goal-shape');
  const ghost    = document.getElementById('ob-wheel-ghost');

  gSpokes.innerHTML = OB_GOAL.map((_, i) => {
    const a = angleFor(i);
    const x2 = Math.cos(a) * R_MAX;
    const y2 = Math.sin(a) * R_MAX;
    return `<line class="wheel__spoke" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join('');

  gLabels.innerHTML = OB_GOAL.map((area, i) => {
    const p = labelPointFor(i);
    return `<text class="wheel__label" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}">${area.label}</text>`;
  }).join('');

  // ghost = onde ele está hoje (OB_AREAS)
  const ghostPts = OB_AREAS.map((a, i) => {
    const p = pointFor(i, a.value);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  ghost.setAttribute('points', ghostPts);

  function updateGoalShape() {
    const pts = OB_GOAL.map((a, i) => {
      const p = pointFor(i, a.value);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    gShape.setAttribute('points', pts);

    gHandles.innerHTML = OB_GOAL.map((a, i) => {
      const p = pointFor(i, a.value);
      return `
        <g data-i="${i}">
          <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" data-i="${i}"/>
          <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
        </g>
      `;
    }).join('');

    gHandles.querySelectorAll('.wheel__handle').forEach(bindGoalDrag);
  }

  function bindGoalDrag(handle) {
    let dragging = false;
    const i = parseInt(handle.dataset.i, 10);

    const start = (ev) => {
      ev.preventDefault();
      dragging = true;
      hap(6);
    };
    const move = (ev) => {
      if (!dragging) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const pt = gSvg.createSVGPoint();
      pt.x = t.clientX; pt.y = t.clientY;
      const ctm = gSvg.getScreenCTM();
      if (!ctm) return;
      const p = pt.matrixTransform(ctm.inverse());
      const a = angleFor(i);
      const proj = p.x * Math.cos(a) + p.y * Math.sin(a);
      const r = Math.max(R_MIN, Math.min(R_MAX, proj));
      const v = Math.round(((r - R_MIN) / (R_MAX - R_MIN)) * 10);
      // meta precisa ser >= atual
      const min = OB_AREAS[i].value;
      const clamped = Math.max(min, v);
      if (clamped !== OB_GOAL[i].value) {
        OB_GOAL[i].value = clamped;
        updateGoalShape();
        hap(3);
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

  updateGoalShape();
}
