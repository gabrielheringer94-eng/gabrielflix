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
const heroLink = document.getElementById('hero-link-more');
if (heroLink) {
  heroLink.addEventListener('click', () => {
    openSheet('sheet-score');
    renderWow();
    hap(8);
  });
}

// ───── lab card click ─────
const labOpen = document.getElementById('lab-open');
if (labOpen) {
  labOpen.addEventListener('click', () => openSheet('sheet-lab'));
}

// ───── suplementos & medicamentos ─────
// catálogo: nome curto + dose padrão + horário sugerido
const SUPPS_CATALOG = {
  creatina:    { nome: 'creatina',         dose: '5g',        timing: 'qualquer hora' },
  whey:        { nome: 'whey protein',     dose: '30g',       timing: 'pós-treino' },
  vitD:        { nome: 'vitamina D',       dose: '4000 UI',   timing: 'manhã com gordura' },
  b12:         { nome: 'vitamina B12',     dose: '1000 mcg',  timing: 'manhã' },
  omega3:      { nome: 'ômega 3',          dose: '2g',        timing: 'almoço' },
  magnesio:    { nome: 'magnésio',         dose: '300mg',     timing: 'antes de dormir' },
  multi:       { nome: 'multivitamínico',  dose: '1 cápsula', timing: 'manhã' },
  folato:      { nome: 'folato',           dose: '400 mcg',   timing: 'manhã' },
  anticonc:    { nome: 'anticoncepcional', dose: '1 comp.',   timing: 'mesma hora todo dia' },
  antialerg:   { nome: 'antialérgico',     dose: '1 comp.',   timing: 'manhã' },
  antihiper:   { nome: 'anti-hipertensivo',dose: '1 comp.',   timing: 'mesma hora todo dia' },
  antidepres:  { nome: 'antidepressivo',   dose: '1 comp.',   timing: 'mesma hora todo dia' },
  cafeina:     { nome: 'pre-treino',       dose: '1 dose',    timing: 'antes do treino' },
};

// estado: lista de keys que o usuário toma + status (true=tomou hoje)
let userSupps = ['creatina', 'whey', 'vitD']; // mock inicial
let suppsTaken = { whey: true }; // mock: whey já tomado hoje

// persistência
try {
  const savedSupps  = localStorage.getItem('circa_supps');
  const savedTaken  = localStorage.getItem('circa_supps_taken');
  if (savedSupps)  userSupps  = JSON.parse(savedSupps);
  if (savedTaken)  suppsTaken = JSON.parse(savedTaken);
} catch (e) {}

function saveSuppsState() {
  try {
    localStorage.setItem('circa_supps', JSON.stringify(userSupps));
    localStorage.setItem('circa_supps_taken', JSON.stringify(suppsTaken));
  } catch (e) {}
}

function renderSuppsHomeCard() {
  const list  = document.getElementById('supps-list');
  const count = document.getElementById('supps-count');
  if (!list || !count) return;

  if (!userSupps.length) {
    list.innerHTML = '<li class="supps-empty">nenhum suplemento configurado · toque pra adicionar</li>';
    count.textContent = '';
    return;
  }

  // mostra até 3 no card da home; resto fica no sheet
  const visible = userSupps.slice(0, 3);
  list.innerHTML = visible.map((key) => {
    const s = SUPPS_CATALOG[key];
    if (!s) return '';
    const taken = !!suppsTaken[key];
    return `
      <li class="supps-item ${taken ? 'is-taken' : ''}">
        <i class="supps-bullet"></i>
        <span class="supps-name">${s.nome}</span>
        <span class="supps-meta">${s.dose} · ${s.timing}</span>
      </li>
    `;
  }).join('');

  const taken = userSupps.filter((k) => suppsTaken[k]).length;
  count.textContent = taken + ' / ' + userSupps.length;
}

function renderSuppsSheet() {
  const tasks = document.getElementById('supps-tasks');
  const ad    = document.getElementById('supps-adherence');
  const ssCount = document.getElementById('supps-sheet-count');
  const ssTotal = document.getElementById('supps-sheet-total');

  if (tasks) {
    tasks.innerHTML = userSupps.map((key) => {
      const s = SUPPS_CATALOG[key];
      if (!s) return '';
      const taken = !!suppsTaken[key];
      return `
        <li class="supps-task ${taken ? 'is-taken' : ''}" data-key="${key}">
          <button class="supps-task__toggle" aria-label="marcar tomado">
            <i class="supps-bullet supps-bullet--lg"></i>
          </button>
          <div class="supps-task__body">
            <strong>${s.nome}</strong>
            <span>${s.dose} · ${s.timing}</span>
          </div>
          <span class="supps-task__status">${taken ? '✓ feito' : 'pendente'}</span>
        </li>
      `;
    }).join('');

    tasks.querySelectorAll('.supps-task').forEach((row) => {
      row.addEventListener('click', () => {
        const key = row.dataset.key;
        suppsTaken[key] = !suppsTaken[key];
        saveSuppsState();
        renderSuppsSheet();
        renderSuppsHomeCard();
        hap(12);
      });
    });
  }

  if (ssCount) ssCount.textContent = userSupps.filter((k) => suppsTaken[k]).length;
  if (ssTotal) ssTotal.textContent = userSupps.length;

  // aderência mockada (14 cells: cada uma = 1 dia, % do dia)
  if (ad) {
    const sample = [100,100,67,100,100,100,33,100,67,100,100,100,67,33];
    ad.innerHTML = sample.map((pct, i) => {
      const cls = pct === 100 ? 'is-full' : pct >= 50 ? 'is-half' : 'is-low';
      return `<i class="adh-cell ${cls}" title="${pct}%"></i>`;
    }).join('');
  }
}

renderSuppsHomeCard();

const suppsOpen = document.getElementById('supps-open');
if (suppsOpen) {
  suppsOpen.addEventListener('click', () => {
    openSheet('sheet-supps');
    renderSuppsSheet();
  });
}

// ───── onboarding step 18 · seleção de suplementos ─────
document.querySelectorAll('#supp-chips .ob-chip').forEach((chip) => {
  // marca os que já estão em userSupps
  if (userSupps.includes(chip.dataset.supp)) chip.classList.add('is-on');
  chip.addEventListener('click', () => {
    const key = chip.dataset.supp;
    chip.classList.toggle('is-on');
    if (chip.classList.contains('is-on')) {
      if (!userSupps.includes(key)) userSupps.push(key);
    } else {
      userSupps = userSupps.filter((k) => k !== key);
    }
    saveSuppsState();
    renderSuppsHomeCard();
    hap(6);
  });
});

// ───── idade biológica (estilo Centeni) ─────
// série: idade biológica ao longo dos últimos 12 meses (por exame)
const BIOAGE_HISTORY = [34.2, 34.0, 33.5, 33.1, 32.8, 32.5, 32.9, 32.5, 31.8, 31.4, 31.0, 30.8];

function renderBioAgeChart() {
  const line = document.getElementById('body-line');
  const area = document.getElementById('body-area');
  const dot  = document.getElementById('body-dot');
  if (!line) return;
  const p = pathFromSeries(BIOAGE_HISTORY);
  line.setAttribute('d', p.line);
  area.setAttribute('d', p.area);
  if (dot) { dot.setAttribute('cx', p.lastPt[0]); dot.setAttribute('cy', p.lastPt[1]); }
}

const bodyOpen = document.getElementById('body-open');
if (bodyOpen) {
  bodyOpen.addEventListener('click', () => {
    openSheet('sheet-body');
    renderBioAgeChart();
  });
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
    tglLabel.textContent = d.status === 'done' ? '✓ feito, desfazer' : 'marcar feito';
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
  desenv:   { title: 'desenvolvimento', goal: 8, last: 'leu 20min ontem',                suggest: 'continua no mesmo livro, consistência > volume.' },
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
        <circle class="wheel__hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="20" data-i="${i}"/>
        <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="11" data-i="${i}"/>
        <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
      </g>
    `;
  }).join('');

  handlesEl.querySelectorAll('.wheel__grp').forEach(attachHandle);
}

let wheelEditing = false;

function attachHandle(grp) {
  let dragging = false;
  let moved = false;
  let startPt = null;
  const i = parseInt(grp.dataset.i, 10);

  const start = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
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
      if (Math.hypot(dx, dy) > 8) moved = true;
    }
    // LOCKED: só detecta se moveu (pra distinguir tap de drag), mas não altera valor
    if (!wheelEditing) return;
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

  grp.addEventListener('mousedown', start);
  grp.addEventListener('touchstart', start, { passive: false });
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

// nome do usuário (persistido, com fallback)
let USER_NAME = 'Gabriel';
try {
  const savedName = localStorage.getItem('circa_name');
  if (savedName && typeof savedName === 'string' && savedName.trim()) USER_NAME = savedName.trim();
} catch (e) {}

function setUserName(name) {
  if (!name || !name.trim()) return;
  USER_NAME = name.trim();
  try { localStorage.setItem('circa_name', USER_NAME); } catch (e) {}
  refreshNameDependents();
}

function refreshNameDependents() {
  // saudação do topo
  const greet = document.querySelector('.screen--home .top__greet');
  if (greet) greet.textContent = 'boa tarde, ' + USER_NAME;
  // título do humor
  const moodTitle = document.querySelector('.screen--mood .mood-intro .display');
  if (moodTitle) moodTitle.innerHTML = USER_NAME + ',<br/>como você<br/>está hoje?';
  // re-render hero (pra puxar o novo prefixo)
  if (typeof updateHeroScore === 'function') updateHeroScore();
}

function stateWord(score) {
  if (score >= 90) return 'voando';
  if (score >= 80) return 'firme';
  if (score >= 70) return 'em ritmo';
  if (score >= 60) return 'aquecendo';
  if (score >= 45) return 'atenção';
  return 'precisa descanso';
}

function narrativePrefix(score, name) {
  // templates com nome no começo. "Parabéns" só aparece em scores altos.
  if (score >= 90) return `${name}, parabéns, você tá <em id="hero-state-inline">voando</em>.`;
  if (score >= 80) return `${name}, parabéns, você tá <em id="hero-state-inline">constante</em>.`;
  if (score >= 70) return `${name}, você tá <em id="hero-state-inline">em ritmo</em>.`;
  if (score >= 60) return `${name}, hoje tá <em id="hero-state-inline">aquecendo</em>.`;
  if (score >= 45) return `${name}, dia pedindo <em id="hero-state-inline">atenção</em>.`;
  return `${name}, você precisa de <em id="hero-state-inline">descanso</em>.`;
}

function narrativeLine(score, humorContrib) {
  const h = humorContrib;
  if (h >= 26) return 'humor alto puxou o dia. sono curto ainda pesa.';
  if (h >= 22) return 'dia em ritmo. treino ajudou, sono puxou.';
  if (h >= 16) return 'dia truncado. amanhã começa zerado.';
  return 'humor baixo pesou. respira, amanhã refaz.';
}

// ───── afirmações por faixa de score (6 buckets × 5 variações) ─────
const AFFIRMATIONS = [
  // 0-44 · precisa descanso (nurturing, zero cobrança)
  [
    'tudo bem não estar bem.',
    'se cuide agora, recupera depois.',
    'corpo pede descanso. ouça.',
    'liga pra alguém. toma água. dorme cedo.',
    'amanhã você cuida. hoje só passa.',
    'dia difícil, não dia ruim.',
  ],
  // 45-59 · atenção (acolhedor + convite à pausa)
  [
    'respira, amanhã refaz.',
    'tá pedindo uma pausa. ouve.',
    'nem todo dia é alto. faz parte do ritmo.',
    'amanhã começa sem culpa.',
    'reconhece o que pesou. sem drama.',
    'desacelera. sem pressa de virar o jogo.',
  ],
  // 60-69 · aquecendo (realista, acolhedor)
  [
    'amanhã começa em branco.',
    'hoje foi hoje, descansa.',
    'dia na média também é progresso.',
    'não tá perfeito, tá dentro.',
    'amanhã tem espaço pra crescer.',
    'uma engrenagem de cada vez.',
  ],
  // 70-79 · em ritmo (afirmativo, sem exagero)
  [
    'fluindo, sem drama.',
    'tá no caminho. mantém.',
    'pequenos ajustes e vira ótimo.',
    'sem grandes desvios, bom sinal.',
    'o ritmo tá teu.',
    'constância é o truque.',
  ],
  // 80-89 · firme (reconhecimento + sustentabilidade)
  [
    'confia no processo.',
    'pequenos passos, grande caminho.',
    'tá no teu jogo.',
    'sólido, e sustentável.',
    'dia redondo. guarda essa sensação.',
    'o que tu faz de novo hoje, amanhã é hábito.',
  ],
  // 90+ · voando (celebrativo, lembra que é mérito)
  [
    'tu tá em casa hoje.',
    'esse ritmo é teu. guarda.',
    'dia de pico. aproveita o impulso.',
    'quando funciona, funciona.',
    'consistência premiada.',
    'corpo e mente alinhados, saboreia.',
  ],
];

function dayHash() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function affirmationFor(score) {
  let bucket = 0;
  if (score >= 90)      bucket = 5;
  else if (score >= 80) bucket = 4;
  else if (score >= 70) bucket = 3;
  else if (score >= 60) bucket = 2;
  else if (score >= 45) bucket = 1;
  else                  bucket = 0;
  const list = AFFIRMATIONS[bucket];
  const idx = (dayHash() + bucket * 7) % list.length;
  return list[idx];
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

  // glow também no número
  const heroVal = document.querySelector('.hero__value');
  if (heroVal) {
    heroVal.style.textShadow = `0 0 ${(14 + t * 30).toFixed(0)}px rgba(${r},${g},${b},${(strength * 0.4).toFixed(2)})`;
  }
  // glow na palavra de estado dentro da narrativa
  const stateInline = document.getElementById('hero-state-inline');
  if (stateInline) {
    stateInline.style.textShadow = `0 0 ${(10 + t * 18).toFixed(0)}px rgba(${r},${g},${b},${(strength * 0.5).toFixed(2)})`;
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

  // narrativa protagonista: "{nome}, você tá X. [afirmação contextual]"
  const prefix = narrativePrefix(total, USER_NAME);
  const affirm = affirmationFor(total);
  const affirmCap = affirm.charAt(0).toUpperCase() + affirm.slice(1);
  const nar = document.getElementById('hero-narrative');
  if (nar) nar.innerHTML = `${prefix} ${affirmCap}`;

  // delta (linha de texto sutil)
  const deltaEl  = document.getElementById('hero-delta-line');
  const deltaVal = document.getElementById('delta-val');
  const deltaArr = deltaEl && deltaEl.querySelector('.delta-arrow');
  const deltaText= deltaEl && deltaEl.querySelector('span:last-child');
  const diff = total - YESTERDAY_SCORE;
  if (deltaEl && deltaVal && deltaArr) {
    deltaEl.classList.remove('is-down', 'is-flat');
    if (diff > 0) {
      deltaArr.textContent = '▲'; deltaVal.textContent = diff;
      if (deltaText) deltaText.textContent = ' pontos acima de ontem';
    } else if (diff < 0) {
      deltaArr.textContent = '▼'; deltaVal.textContent = Math.abs(diff);
      if (deltaText) deltaText.textContent = ' pontos abaixo de ontem';
      deltaEl.classList.add('is-down');
    } else {
      deltaArr.textContent = '─'; deltaVal.textContent = 0;
      if (deltaText) deltaText.textContent = ' igual a ontem';
      deltaEl.classList.add('is-flat');
    }
  }

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
      { desc: 'disposto. sobra pra fazer o extra, treino sério, foco prolongado, decisões difíceis.' },
      { desc: 'transbordando. dia com capacidade de alto rendimento em qualquer coisa que escolher.' },
    ]
  },
  mood: {
    title: 'humor',
    hint:  'como você tá se sentindo emocionalmente agora.',
    levels: [
      { desc: 'tristeza forte ou irritação difícil de controlar. dia pedindo cuidado extra, conversa, descanso, apoio.' },
      { desc: 'pra baixo, apagado. nada empolga muito. dia tá pesando.' },
      { desc: 'oscilando. alguns momentos bons, outros pesam. sensível a gatilho.' },
      { desc: 'estável. nem pra cima nem pra baixo. neutro funcional.' },
      { desc: 'satisfeito. dia com mais momentos bons que ruins. sensação de tá no lugar certo.' },
      { desc: 'animado, leve, conectado. dia redondo emocionalmente, aproveita.' },
    ]
  },
  anx: {
    title: 'ansiedade',
    hint:  'quanto ruído mental tá atrapalhando o presente. aqui, menos é melhor.',
    levels: [
      { desc: 'presente, relaxado. mente sem ruído de fundo. estado ideal.' },
      { desc: 'um alerta de fundo, mas sob controle. normal em dia de tarefa importante.' },
      { desc: 'preocupação existe mas não atrapalha o que precisa ser feito.' },
      { desc: 'começa a interferir, em decisões, sono, foco. atenção aqui.' },
      { desc: 'corpo tenso, ruminação constante. custa executar tarefa básica. dia pesado.' },
      { desc: 'sintomas físicos, pensamento acelerado, paralisia. procure apoio, não tem que passar sozinho.' },
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

// ═════════════════════════════════════════
// WELCOME · primeira visita (pré-onboarding)
// ═════════════════════════════════════════
const welcomeEl = document.getElementById('welcome');
const welcomeStart = document.getElementById('welcome-start');
const welcomeSkip  = document.getElementById('welcome-skip');

function openWelcome() {
  if (!welcomeEl) return;
  welcomeEl.classList.add('is-open');
  welcomeEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeWelcome() {
  if (!welcomeEl) return;
  welcomeEl.classList.remove('is-open');
  welcomeEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  try { localStorage.setItem('circa_welcome_seen', '1'); } catch (e) {}
}

if (welcomeStart) welcomeStart.addEventListener('click', () => { closeWelcome(); openOnboard(); hap(15); });
if (welcomeSkip)  welcomeSkip.addEventListener('click', () => { closeWelcome(); hap(8); });

try {
  if (!localStorage.getItem('circa_welcome_seen')) {
    setTimeout(openWelcome, 400);
  }
} catch (e) {}

// ═════════════════════════════════════════
// LOG DE TREINO · esporte picker + log adaptativo + confirmação
// ═════════════════════════════════════════
const MODALIDADES = {
  musculacao: {
    nome: 'Musculação', icon: '🏋️',
    campos: [
      { id: 'duracao',  label: 'duração',      unit: 'min',     placeholder: '60' },
      { id: 'series',   label: 'séries totais',unit: 'séries',  placeholder: '20' },
      { id: 'carga',    label: 'carga média',  unit: 'kg',      placeholder: '40' },
    ],
    msg: 'carga registrada. o Circa tá mapeando teu padrão de recuperação.',
    insights: [
      'treinos acima de 45min têm retorno decrescente, intensidade bate duração.',
      'você treina melhor em dias com mais de 7h de sono.',
      'consistência semanal gera mais resultado que volume por sessão.',
    ]
  },
  corrida: {
    nome: 'Corrida', icon: '🏃',
    campos: [
      { id: 'distancia', label: 'distância', unit: 'km',      placeholder: '5' },
      { id: 'duracao',   label: 'tempo',     unit: 'min',     placeholder: '30' },
      { id: 'pace',      label: 'pace médio',unit: 'min/km',  placeholder: '6.0' },
    ],
    msg: 'km registrados. continua por 7 dias e os insights começam a aparecer.',
    insights: [
      'corredores que registram pace melhoram 12% mais rápido.',
      'hidratação antes do treino impacta diretamente no teu pace.',
      'teu melhor desempenho tende a ser em dias de humor acima de 4.',
    ]
  },
  futebol: {
    nome: 'Futebol', icon: '⚽',
    campos: [
      { id: 'duracao',     label: 'duração',     unit: 'min', placeholder: '60' },
      { id: 'intensidade', label: 'intensidade', unit: '/10', placeholder: '7' },
    ],
    msg: 'pelada registrada. futebol conta, e muito, pro teu Circa Score.',
    insights: [
      'futebol de alta intensidade equivale a 2× o gasto de uma academia.',
      'hidratação pós-jogo é crítica, repor em até 30 minutos.',
      'futebol tem alto impacto nas articulações, atenção ao descanso.',
    ]
  },
  pilates: {
    nome: 'Pilates', icon: '🧘',
    campos: [
      { id: 'duracao', label: 'duração', unit: 'min', placeholder: '50' },
      { id: 'foco',    label: 'foco',    unit: '',    placeholder: 'core / mobilidade / força' },
    ],
    msg: 'pilates registrado. consistência aqui é o que gera transformação real.',
    insights: [
      'pilates regular reduz dores lombares em até 36% em 8 semanas.',
      'combinar pilates com musculação maximiza mobilidade e força.',
      'consistência semanal é mais importante que duração da sessão.',
    ]
  },
  ciclismo: {
    nome: 'Ciclismo', icon: '🚴',
    campos: [
      { id: 'distancia', label: 'distância', unit: 'km',  placeholder: '20' },
      { id: 'duracao',   label: 'tempo',     unit: 'min', placeholder: '60' },
      { id: 'elevacao',  label: 'elevação',  unit: 'm',   placeholder: '200' },
    ],
    msg: 'pedal registrado. distância e elevação alimentam teu perfil fisiológico.',
    insights: [
      'ciclismo é excelente pra saúde cardiovascular com baixo impacto articular.',
      'pedalar em jejum acelera queima de gordura em treinos leves.',
      'consistência semanal gera adaptação cardiovascular em 3-4 semanas.',
    ]
  },
  beach_tennis: {
    nome: 'Beach Tennis', icon: '🎾',
    campos: [
      { id: 'duracao', label: 'duração',     unit: 'min',  placeholder: '90' },
      { id: 'sets',    label: 'sets jogados',unit: 'sets', placeholder: '3' },
    ],
    msg: 'jogo registrado. beach tennis combina cardio + coordenação numa sessão.',
    insights: [
      'beach tennis combina cardio, coordenação e força em uma sessão.',
      'a areia aumenta em até 30% o gasto calórico vs quadra dura.',
      'alta exposição solar, vitamina D e protetor são aliados.',
    ]
  },
  yoga: {
    nome: 'Yoga', icon: '🌿',
    campos: [
      { id: 'duracao', label: 'duração',     unit: 'min', placeholder: '60' },
      { id: 'tipo',    label: 'tipo',        unit: '',    placeholder: 'hatha / vinyasa / yin' },
    ],
    msg: 'prática registrada. yoga é a dimensão que mais influencia o Espírito.',
    insights: [
      'yoga regular reduz cortisol e melhora qualidade do sono.',
      'prática noturna de yin yoga é especialmente eficaz pra recuperação.',
      'combinar yoga com treino de força maximiza mobilidade.',
    ]
  },
  natacao: {
    nome: 'Natação', icon: '🏊',
    campos: [
      { id: 'metros',  label: 'metros nadados', unit: 'm',   placeholder: '1000' },
      { id: 'duracao', label: 'tempo na água',  unit: 'min', placeholder: '40' },
    ],
    msg: 'treino registrado. natação é ótima pra recuperação ativa.',
    insights: [
      'natação é o esporte com menor impacto e maior benefício cardiovascular.',
      'treinar técnica em baixa velocidade gera mais resultado que volume.',
      'hidratação é essencial mesmo na natação.',
    ]
  },
  crossfit: {
    nome: 'Crossfit', icon: '⚡',
    campos: [
      { id: 'duracao', label: 'duração do WOD', unit: 'min', placeholder: '45' },
      { id: 'wod',     label: 'nome do WOD',   unit: '',    placeholder: 'Fran / Murph / custom' },
    ],
    msg: 'WOD registrado. descansa bem, teu corpo tá trabalhando agora.',
    insights: [
      'crossfit de alta intensidade exige 48-72h de recuperação real.',
      'monitorar frequência cardíaca evita overtraining.',
      'nutrição pré e pós-treino é crítica pra performance.',
    ]
  },
  caminhada: {
    nome: 'Caminhada', icon: '🚶',
    campos: [
      { id: 'distancia', label: 'distância', unit: 'km',  placeholder: '3' },
      { id: 'duracao',   label: 'duração',   unit: 'min', placeholder: '40' },
    ],
    msg: 'caminhada registrada. movimento consistente é o maior preditor de saúde.',
    insights: [
      '8.000 passos por dia reduz mortalidade cardiovascular em 51%.',
      'caminhada pós-refeição melhora glicemia e digestão.',
      'consistência diária supera treinos intensos esporádicos.',
    ]
  },
  outro: {
    nome: 'Outro esporte', icon: '✦',
    campos: [
      { id: 'duracao',     label: 'duração',     unit: 'min', placeholder: '60' },
      { id: 'intensidade', label: 'intensidade', unit: '/10', placeholder: '7' },
    ],
    msg: 'treino registrado. continua e o Circa aprende o que funciona pra ti.',
    insights: [
      'qualquer movimento conta, o mais importante é a consistência.',
      'variar modalidades reduz risco de lesão por repetição.',
      'registrar ajuda a identificar o que funciona melhor pra você.',
    ]
  },
  descanso: {
    nome: 'Dia de descanso', icon: '💤',
    campos: [
      { id: 'sono',         label: 'horas de sono',            unit: 'h',   placeholder: '8' },
      { id: 'recuperacao',  label: 'sensação de recuperação', unit: '/10', placeholder: '7' },
    ],
    msg: 'descanso registrado. recuperação é metade do resultado.',
    insights: [
      'descanso ativo é parte da performance, não o oposto dela.',
      'dias de descanso com boa recuperação geram adaptação muscular.',
      'sono profundo produz 70% do GH, o hormônio de recuperação.',
    ]
  }
};

let esporteSel = null;
let sensSel = null;

function openEsportePicker() {
  openSheet('sheet-esporte');
  // pre-seleciona o último esporte se salvo
  const last = (() => { try { return localStorage.getItem('circa_last_sport'); } catch (e) { return null; } })();
  document.querySelectorAll('#esporte-grid .esporte').forEach((b) => b.classList.remove('is-on'));
  if (last) {
    const btn = document.querySelector(`#esporte-grid .esporte[data-sport="${last}"]`);
    if (btn) { btn.classList.add('is-on'); esporteSel = last; }
  } else {
    esporteSel = null;
  }
  const cont = document.getElementById('esporte-continuar');
  if (cont) cont.disabled = !esporteSel;
  const outro = document.getElementById('esporte-outro');
  if (outro) outro.style.display = esporteSel === 'outro' ? '' : 'none';
}

document.querySelectorAll('#esporte-grid .esporte').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#esporte-grid .esporte').forEach((b) => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    esporteSel = btn.dataset.sport;
    document.getElementById('esporte-outro').style.display = esporteSel === 'outro' ? '' : 'none';
    document.getElementById('esporte-continuar').disabled = false;
    try { localStorage.setItem('circa_last_sport', esporteSel); } catch (e) {}
    hap(8);
  });
});

const esporteContinuar = document.getElementById('esporte-continuar');
if (esporteContinuar) esporteContinuar.addEventListener('click', () => {
  if (!esporteSel) return;
  closeSheet();
  setTimeout(() => openLogTreino(esporteSel), 260);
});

function openLogTreino(sportKey) {
  const m = MODALIDADES[sportKey];
  if (!m) return;
  const nomeFinal = sportKey === 'outro'
    ? (document.getElementById('esporte-outro-input').value || 'Outro esporte')
    : m.nome;
  document.getElementById('log-t-eye').textContent = 'treino · hoje';
  document.getElementById('log-t-nome').innerHTML = `${m.icon} ${nomeFinal}`;
  document.getElementById('log-t-data').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const wrap = document.getElementById('log-t-campos');
  wrap.innerHTML = m.campos.map((c) => `
    <label class="ob-field">
      <span>${c.label}${c.unit ? ' · ' + c.unit : ''}</span>
      <input type="${c.unit === '' ? 'text' : 'number'}" step="0.1" placeholder="${c.placeholder}" data-campo="${c.id}" />
    </label>
  `).join('');

  // reset sensação e nota
  sensSel = null;
  document.querySelectorAll('.sensacao').forEach((s) => s.classList.remove('is-on'));
  const notaEl = document.getElementById('log-t-nota');
  if (notaEl) notaEl.value = '';

  openSheet('sheet-log-treino');
}

document.querySelectorAll('.sensacao').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.sensacao').forEach((x) => x.classList.remove('is-on'));
    b.classList.add('is-on');
    sensSel = parseInt(b.dataset.sens, 10);
    hap(8);
  });
});

function salvarLogTreino() {
  if (!esporteSel) return;
  const m = MODALIDADES[esporteSel];
  const dados = { esporte: esporteSel, sensacao: sensSel, data: new Date().toISOString() };
  document.querySelectorAll('#log-t-campos [data-campo]').forEach((el) => { dados[el.dataset.campo] = el.value; });
  dados.nota = document.getElementById('log-t-nota').value;
  try {
    const hist = JSON.parse(localStorage.getItem('circa_workout_log') || '[]');
    hist.push(dados);
    localStorage.setItem('circa_workout_log', JSON.stringify(hist));
  } catch (e) {}

  // score simulado com base na sensação
  const base = sensSel ? sensSel * 16 : 70;
  const corpo    = Math.min(100, base + Math.floor(Math.random() * 12));
  const mente    = Math.min(100, base - 5 + Math.floor(Math.random() * 15));
  const espirito = Math.min(100, base + 2 + Math.floor(Math.random() * 10));
  const total    = Math.round(corpo * 0.4 + mente * 0.35 + espirito * 0.25);

  document.getElementById('log-ok-title').textContent = esporteSel === 'descanso' ? 'descansado.' : 'registrado.';
  document.getElementById('log-ok-sub').textContent = m.msg;
  document.getElementById('log-ok-num').textContent = total;

  const dimsEl = document.getElementById('log-ok-dims');
  dimsEl.innerHTML = [
    ['#7B8BB8', 'corpo ' + corpo],
    ['#E8A87C', 'mente ' + mente],
    ['#A88AE8', 'espírito ' + espirito],
  ].map(([c, txt]) => `<span class="dim-chip"><i style="background:${c}"></i>${txt}</span>`).join('');

  const insight = m.insights[Math.floor(Math.random() * m.insights.length)];
  document.getElementById('log-ok-insight').textContent = insight;

  closeSheet();
  setTimeout(() => openSheet('sheet-log-ok'), 260);
  hap(18);
}

const logSalvar = document.getElementById('log-t-salvar');
if (logSalvar) logSalvar.addEventListener('click', salvarLogTreino);

// ═════════════════════════════════════════
// HOME · ação dinâmica por hora do dia
// Uma pergunta por tela, um número por momento.
// ═════════════════════════════════════════
function pickDailyAction() {
  const h = new Date().getHours();
  const name = USER_NAME || 'você';

  // manhã cedo · 5-10h, como dormiu?
  if (h >= 5 && h < 10) return {
    eye: 'agora',
    title: `Como você dormiu, ${name}?`,
    body: 'conta em 10 segundos. o Circa cruza com teu treino e tua cabeça.',
    meta: '',
    ctaPrimary: { label: 'registrar sono', action: 'mood' },
    ctaGhost: null,
  };

  // meio da manhã · 10-12h, hidratar
  if (h >= 10 && h < 12) return {
    eye: 'agora',
    title: 'Hidrata antes do almoço.',
    body: 'teu corpo ainda tá pedindo água, uns 800ml pra alcançar a meta.',
    meta: '',
    ctaPrimary: { label: '+ 500 ml', action: 'water500' },
    ctaGhost: { label: '+ 200 ml', action: 'water200' },
  };

  // almoço · 12-14h
  if (h >= 12 && h < 14) return {
    eye: 'próxima refeição',
    title: 'Almoça agora.',
    body: 'frango grelhado, arroz, legumes. <strong>~650 kcal</strong>.',
    meta: 'você jogou bola 2h. faltam 400 kcal pra fechar o dia.',
    ctaPrimary: { label: 'comi', action: 'ateMeal' },
    ctaGhost: { label: 'troca', action: 'swapMeal' },
  };

  // tarde · 14-17h, hidratar de novo
  if (h >= 14 && h < 17) return {
    eye: 'agora',
    title: 'Faltam 1L de água.',
    body: 'teu corpo ainda tá pedindo. até 17h dá tempo de recuperar a meta.',
    meta: '',
    ctaPrimary: { label: '+ 500 ml', action: 'water500' },
    ctaGhost: { label: '+ 200 ml', action: 'water200' },
  };

  // fim da tarde · 17-19h, treino ou check-in
  if (h >= 17 && h < 19) return {
    eye: 'agora',
    title: 'Treinou? Conta aí.',
    body: 'o que tu fez hoje, ou vai fazer, pro teu corpo?',
    meta: '',
    ctaPrimary: { label: 'registrar treino', action: 'workout' },
    ctaGhost: null,
  };

  // noite · 19-22h, como foi o dia
  if (h >= 19 && h < 22) return {
    eye: 'agora',
    title: `Como tá agora, ${name}?`,
    body: 'um check-in rápido fecha o dia. sem drama, só honesto.',
    meta: '',
    ctaPrimary: { label: 'check-in', action: 'mood' },
    ctaGhost: null,
  };

  // madrugada · 22+ ou antes das 5
  return {
    eye: 'agora',
    title: 'Hora de desacelerar.',
    body: 'teu corpo produz hormônio de recuperação nas próximas horas. protege esse tempo.',
    meta: '',
    ctaPrimary: { label: 'registrar sono', action: 'mood' },
    ctaGhost: null,
  };
}

function renderHomeAction() {
  const a = pickDailyAction();
  const eye   = document.getElementById('action-eye');
  const title = document.getElementById('action-title');
  const body  = document.getElementById('action-body');
  const meta  = document.getElementById('action-meta');
  const cta   = document.getElementById('action-cta');
  if (!eye || !title || !body || !meta || !cta) return;

  eye.textContent   = a.eye;
  title.textContent = a.title;
  body.innerHTML    = a.body || '';
  meta.textContent  = a.meta || '';
  body.style.display = a.body ? '' : 'none';
  meta.style.display = a.meta ? '' : 'none';

  // re-render CTA
  cta.innerHTML = '';
  if (a.ctaPrimary) {
    const b = document.createElement('button');
    b.className = 'btn btn--primary';
    b.textContent = a.ctaPrimary.label;
    b.addEventListener('click', () => runAction(a.ctaPrimary.action));
    cta.appendChild(b);
  }
  if (a.ctaGhost) {
    const b = document.createElement('button');
    b.className = 'btn btn--ghost';
    b.textContent = a.ctaGhost.label;
    b.addEventListener('click', () => runAction(a.ctaGhost.action));
    cta.appendChild(b);
  }
}

function runAction(kind) {
  hap(10);
  if (kind === 'mood')     goTo('mood');
  if (kind === 'workout')  openEsportePicker();
  if (kind === 'water200') { const m = document.querySelector('[data-add="200"]'); if (m) m.click(); }
  if (kind === 'water500') { const m = document.querySelector('[data-add="500"]'); if (m) m.click(); }
  if (kind === 'ateMeal')  { const card = document.getElementById('home-action'); if (card) card.style.opacity = '0.55'; }
  if (kind === 'swapMeal') { alert('troca de refeição, vem em breve'); }
}

// renderiza ao carregar · também chamado quando o nome muda
renderHomeAction();
const _refreshOrig = refreshNameDependents;
refreshNameDependents = function() { _refreshOrig(); renderHomeAction(); };

// ═════════════════════════════════════════
// HOME · gesto swipe-up + handle abre o drawer
// ═════════════════════════════════════════
const homePull = document.getElementById('home-pull');
if (homePull) homePull.addEventListener('click', () => { openQd(); hap(10); });

// swipe up na metade inferior da home abre o drawer
let suStartY = 0, suStartX = 0, suTrack = false;
window.addEventListener('touchstart', (e) => {
  if (!e.touches[0]) return;
  const homeActive = document.querySelector('.screen--home.is-active');
  if (!homeActive) return;
  const drawerOpen = document.getElementById('qd').classList.contains('is-open');
  const anySheetOpen = document.querySelector('.sheet.is-open');
  if (drawerOpen || anySheetOpen) return;
  const y = e.touches[0].clientY;
  // só ativa no terço inferior da tela
  if (y < window.innerHeight * 0.65) return;
  suStartY = y;
  suStartX = e.touches[0].clientX;
  suTrack = true;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!suTrack || !e.touches[0]) return;
  const dy = e.touches[0].clientY - suStartY;
  const dx = Math.abs(e.touches[0].clientX - suStartX);
  if (dy < -60 && dx < 40) {
    suTrack = false;
    openQd();
    hap(12);
  }
}, { passive: true });

window.addEventListener('touchend', () => { suTrack = false; }, { passive: true });

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
      if (type === 'workout') { goTo('home'); setTimeout(openEsportePicker, 120); }
      if (type === 'meal')    goTo('home');
      if (type === 'sleep')   goTo('home');
      if (type === 'spirit')  openArea('espirit');
      if (type === 'moment')  openSheet('sheet-moment');
    }, 120);
  });
});

// ───── PIN FAB · momento (DEPRECATED · momento agora via drawer) ─────
const pinFab = document.getElementById('pin-fab');
if (pinFab) pinFab.addEventListener('click', () => openSheet('sheet-moment'));

// ═════════════════════════════════════════
// CIRCA CHAT · conversa contextual com a Circa
// Motor mock com keyword router (Claude API real vem no Expo)
// ═════════════════════════════════════════
const chatEl       = document.getElementById('chat');
const chatMsgsEl   = document.getElementById('chat-msgs');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');
const chatClose    = document.getElementById('chat-close');
const circaFab     = document.getElementById('circa-fab');

let chatHistory = [];
let chatOpened  = false;

// contexto do usuário que a Circa "conhece" (pra respostas personalizadas)
function userContext() {
  return {
    nome: USER_NAME || 'você',
    score_hoje: computeScore(),
    score_ontem: YESTERDAY_SCORE,
    meta_3m: META_3M,
    perfil: window.CIRCA_PROFILE || null,
    fisio: window.CIRCA_FISIO || null,
    sono_media: '5h42',
    sono_meta: '7h',
    agua_hoje: (waterMl / 1000).toFixed(1) + 'L',
    agua_meta: '2.8L',
    suplementos: (function() { try { return JSON.parse(localStorage.getItem('circa_supps') || '[]'); } catch (e) { return []; } })(),
    homocisteina: '28 µmol/L (alto)',
    ferritina: '484 ng/mL (alto)',
    insight_atual: 'humor sobe 1.8 pts quando treina antes das 10h',
    padrao_queda: 'ansiedade sobe 3 dias após noites <6h',
    ultimo_esporte: (function() { try { return localStorage.getItem('circa_last_sport'); } catch (e) { return null; } })(),
  };
}

// abertura personalizada baseada em hora + contexto
function aberturaPersonalizada() {
  const c = userContext();
  const h = new Date().getHours();
  const periodo = h < 12 ? 'manhã' : h < 18 ? 'tarde' : 'noite';

  const aberturas = [
    {
      texto: `quer conversar, ${c.nome}?`,
      ctx: `score ${c.score_hoje} hoje · sono abaixo da meta essa semana`
    },
    {
      texto: `${c.nome}, tô vendo que teu sono tá pesado essa semana. quer falar sobre isso?`,
      ctx: `média ${c.sono_media}, bem abaixo das ${c.sono_meta} de meta`
    },
    {
      texto: `boa ${periodo}, ${c.nome}. como tá a cabeça hoje?`,
      ctx: `mente costuma ser a dimensão que mais oscila no teu perfil`
    },
    {
      texto: `o que tá passando pela tua cabeça, ${c.nome}?`,
      ctx: `sem julgamento. tô aqui pra ouvir e cruzar com o que a gente já sabe de ti`
    },
  ];
  return aberturas[Math.floor(Math.random() * aberturas.length)];
}

// opções rápidas pra primeira conversa
const CHAT_OPCOES = [
  'tô bem, só queria registrar algo',
  'preciso falar sobre meu sono',
  'tô me sentindo sobrecarregado',
  'tive um dia bom hoje',
  'quero entender meus exames',
];

// som de assinatura da Circa · 3 notas com reverb leve
function tocarSomCirca() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // nota 1 · base quente (Mi3)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(329.63, now);
    osc1.frequency.exponentialRampToValueAtTime(340, now + 0.6);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.9);

    // nota 2 · harmônico ouro (Si3)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(493.88, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.09, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(now + 0.08); osc2.stop(now + 0.85);

    // nota 3 · brilho cristal (Mi4)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(659.25, now + 0.18);
    osc3.frequency.exponentialRampToValueAtTime(670, now + 0.55);
    gain3.gain.setValueAtTime(0, now + 0.18);
    gain3.gain.linearRampToValueAtTime(0.07, now + 0.26);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc3.connect(gain3); gain3.connect(ctx.destination);
    osc3.start(now + 0.18); osc3.stop(now + 0.75);

    // reverb leve
    const reverb = ctx.createConvolver();
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.18;
    const reverbBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.4, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = reverbBuffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
      }
    }
    reverb.buffer = reverbBuffer;
    gain1.connect(reverb); gain2.connect(reverb); gain3.connect(reverb);
    reverb.connect(reverbGain); reverbGain.connect(ctx.destination);
  } catch (e) { /* silencia sem quebrar */ }
}

function openChat() {
  if (!chatEl) return;
  tocarSomCirca();
  chatEl.classList.add('is-open');
  chatEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (circaFab) circaFab.classList.remove('is-pulsing');
  chatOpened = true;

  if (chatHistory.length === 0) {
    setTimeout(() => {
      const a = aberturaPersonalizada();
      addCircaMsg(a.texto, a.ctx, true);
    }, 360);
  }
  setTimeout(() => { chatInput && chatInput.focus(); }, 500);
  hap(12);
}

function closeChat() {
  if (!chatEl) return;
  chatEl.classList.remove('is-open');
  chatEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  chatOpened = false;
  setTimeout(() => { if (circaFab) circaFab.classList.add('is-pulsing'); }, 700);
  hap(6);
}

if (circaFab)  circaFab.addEventListener('click', openChat);
if (chatClose) chatClose.addEventListener('click', closeChat);

// rendering helpers
function addCircaMsg(texto, ctx, withOpcoes) {
  const div = document.createElement('div');
  div.className = 'msg msg--circa';
  div.innerHTML = `
    <span class="msg__label">circa</span>
    <div class="msg__bubble">
      <p class="msg__text">${texto}</p>
      ${ctx ? `<p class="msg__ctx">${ctx}</p>` : ''}
    </div>
  `;
  chatMsgsEl.appendChild(div);
  chatHistory.push({ role: 'circa', text: texto });

  if (withOpcoes && chatHistory.length === 1) {
    const opts = document.createElement('div');
    opts.className = 'chat-opts';
    CHAT_OPCOES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'chat-opt';
      b.textContent = t;
      b.addEventListener('click', () => {
        opts.remove();
        sendUserText(t);
      });
      opts.appendChild(b);
    });
    chatMsgsEl.appendChild(opts);
  }
  scrollChatBottom();
}

function addUserMsg(texto) {
  const div = document.createElement('div');
  div.className = 'msg msg--user';
  div.innerHTML = `<div class="msg__bubble"><p class="msg__text">${texto}</p></div>`;
  chatMsgsEl.appendChild(div);
  chatHistory.push({ role: 'user', text: texto });
  scrollChatBottom();
}

function showTyping() {
  const div = document.createElement('div');
  div.id = 'chat-typing';
  div.className = 'typing';
  div.innerHTML = '<span class="typing__dot"></span><span class="typing__dot"></span><span class="typing__dot"></span>';
  chatMsgsEl.appendChild(div);
  scrollChatBottom();
}
function hideTyping() {
  const el = document.getElementById('chat-typing');
  if (el) el.remove();
}
function scrollChatBottom() {
  setTimeout(() => { chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight; }, 80);
}

// ───── motor mock de respostas · keyword router com contexto ─────
function mockCircaResponse(userText) {
  const c = userContext();
  const t = userText.toLowerCase();

  // SONO
  if (t.match(/\b(sono|dormir|dormindo|acordo|acordei|insôn|insom)\b/)) {
    return `teu sono tá em ${c.sono_media} de média essa semana, ${c.nome}. é a coisa que mais tá puxando teu score pra baixo agora. que tá te tirando do sono, trabalho na cabeça, ansiedade, escolha de dormir tarde?`;
  }

  // ANSIEDADE / SOBRECARGA
  if (t.match(/\b(ansios|sobrecarreg|estress|nervos|cansad|exaust|pesad)\b/)) {
    return `sobrecarga é dado, não fraqueza. vejo um padrão no teu perfil: ${c.padrao_queda}. hoje tu dormiu bem? ou a cabeça já começou acelerada?`;
  }

  // TRISTEZA / DESANIMO
  if (t.match(/\b(triste|desanim|mal|ruim|baixo|deprim|chorar|sem for)\b/)) {
    return `obrigada por contar, ${c.nome}. dia ruim não precisa ser consertado agora, só atravessado. se tá ficando difícil por muitos dias seguidos, vale conversar com um psicólogo. tu tem com quem falar próximo?`;
  }

  // TREINO
  if (t.match(/\b(treino|exerc|corri|correr|bola|academ|muscul|yoga)\b/)) {
    const last = c.ultimo_esporte ? `teu último log foi de ${c.ultimo_esporte}.` : '';
    return `${last} e um detalhe que eu mapeei: ${c.insight_atual}. quer registrar o de hoje?`;
  }

  // ÁGUA
  if (t.match(/\b(água|agua|hidrat|sede)\b/)) {
    return `tu tá em ${c.agua_hoje} de ${c.agua_meta} hoje. nos dias de atividade tu tem média ainda mais baixa. quer que eu te lembre de 2 em 2 horas?`;
  }

  // EXAMES
  if (t.match(/\b(exam|sangue|homo|ferrit|vitamin|colest|tireoid)\b/)) {
    return `dois marcadores pediram atenção no teu último: homocisteína ${c.homocisteina} e ferritina ${c.ferritina}. nenhum é drama imediato, mas ambos pedem conversa com médico. querendo, posso te mostrar o que costuma baixar cada um.`;
  }

  // HUMOR / DIA BOM
  if (t.match(/\b(bom dia|dia bom|feliz|alegr|bem|ótimo|otimo|tranqu)\b/)) {
    return `bom de ouvir isso. dias bons não são acaso, tu acumulou consistência nas últimas semanas. quer registrar o humor pra eu aprender com esse padrão?`;
  }

  // SUPLEMENTO / MEDICAÇÃO
  if (t.match(/\b(suplement|creat|whey|vitamin|remed|medic|pílula)\b/)) {
    const supps = c.suplementos.length ? c.suplementos.join(', ') : 'nenhum';
    return `hoje tu tá com: ${supps}. tem alguma coisa nova que tu quer incluir ou alguma dose que tá te deixando na dúvida?`;
  }

  // REGISTRAR
  if (t.match(/\b(registrar|log|anotar|marcar|salvar)\b/)) {
    return `pode me contar o que tu quer registrar? treino, refeição, humor, momento que te moveu, eu anoto e cruzo com o resto.`;
  }

  // AJUDA / COMO FUNCIONA
  if (t.match(/\b(ajuda|como funcion|o que tu faz|pra que|pode fazer)\b/)) {
    return `eu cruzo tudo que tu registra, sono, treino, humor, exames, e mostro padrões que tu sozinho não consegue ver. também converso sempre que tu precisar. me pergunta qualquer coisa sobre ti.`;
  }

  // OI / SAUDAÇÃO
  if (t.match(/^(oi|olá|ola|hey|e aí|eai)\b/)) {
    return `oi ${c.nome}. tô aqui. o que tá passando contigo hoje?`;
  }

  // FALLBACK contextual
  const fallbacks = [
    `me conta mais, ${c.nome}. tô aqui.`,
    `entendi. quer que a gente foque em sono, treino, humor ou algo específico?`,
    `tá valendo. conta com mais detalhe?`,
    `guardei. tem mais alguma coisa que quer soltar?`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function sendUserText(texto) {
  if (!texto || !texto.trim()) return;
  addUserMsg(texto.trim());
  showTyping();

  // delay simulado tipo API real
  const delay = 900 + Math.random() * 1200;
  setTimeout(() => {
    hideTyping();
    const resp = mockCircaResponse(texto);
    addCircaMsg(resp);
  }, delay);
}

function sendFromInput() {
  const v = chatInput.value.trim();
  if (!v) return;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  if (chatSend) chatSend.disabled = true;
  sendUserText(v);
}

if (chatSend) chatSend.addEventListener('click', sendFromInput);

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFromInput();
    }
  });
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    if (chatSend) chatSend.disabled = !chatInput.value.trim();
  });
}

// esc fecha o chat
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatOpened) closeChat();
});

// tap no card de próxima ação da home também abre o chat
const homeAction = document.getElementById('home-action');
if (homeAction) {
  homeAction.addEventListener('click', (e) => {
    // não dispara se o clique foi em um botão (CTA)
    if (e.target.closest('button')) return;
    openChat();
  });
}

// moment modal, chip multi-select (dentro de cada grupo)
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

// ───── Roda · toggle lock/edit mode ─────
const wheelEl        = document.getElementById('wheel');
const wheelEditBtn   = document.getElementById('wheel-edit-btn');
const wheelEditTop   = document.getElementById('wheel-edit-toggle');
const wheelModeLabel = document.getElementById('wheel-mode-label');

function setWheelEditMode(editing) {
  wheelEditing = editing;
  if (wheelEl) wheelEl.classList.toggle('is-locked', !editing);
  if (wheelEditBtn) {
    wheelEditBtn.textContent = editing ? 'concluir edição' : 'editar roda';
    wheelEditBtn.classList.toggle('btn--ghost', editing);
    wheelEditBtn.classList.toggle('btn--primary', !editing);
  }
  if (wheelEditTop) wheelEditTop.classList.toggle('is-active', editing);
  if (wheelModeLabel) wheelModeLabel.textContent = editing
    ? 'arraste cada área pra ajustar · toque pra detalhes'
    : 'toque nas áreas pra ver detalhes';
  hap(10);
}

if (wheelEditBtn) wheelEditBtn.addEventListener('click', () => setWheelEditMode(!wheelEditing));
if (wheelEditTop) wheelEditTop.addEventListener('click', () => setWheelEditMode(!wheelEditing));

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
const TOTAL_STEPS = 26;
let obStep = 1;
const onboard       = document.getElementById('onboard');
const obSlides      = document.querySelectorAll('.ob-slide');
const obProgress    = document.getElementById('ob-progress');
const obProgressFill= document.getElementById('ob-progress-fill');
const obProgressLbl = document.getElementById('ob-progress-label');
const obBackBtn     = document.getElementById('ob-back');
const obCloseBtn    = document.getElementById('ob-close');

// ───── PERFIL QUIZ · dados ─────
const QUIZ_QUESTIONS = [
  {
    texto: 'Você decide mudar sua alimentação. O que acontece na primeira semana?',
    opcoes: [
      { texto: 'Sigo à risca, pesquiso tudo, monto planilha, zero desvio.', perfis: ['arquiteto', 'inabalavel'] },
      { texto: 'Começo intenso, mas no quarto dia já escapei duas vezes.', perfis: ['ignitor', 'relampago'] },
      { texto: 'Vai bem se meu humor estiver em dia. Se não, ignoro tudo.', perfis: ['flutuante'] },
      { texto: 'Adapto conforme a semana, não sigo rígido, mas não abandono.', perfis: ['navegador'] }
    ]
  },
  {
    texto: 'Você treinou pesado três dias seguidos. Corpo pede descanso. O que faz?',
    opcoes: [
      { texto: 'Descanso, o dado manda. Corpo falou, eu ouço.', perfis: ['arquiteto', 'navegador'] },
      { texto: 'Treino mesmo assim. Descanso parece preguiça.', perfis: ['inabalavel'] },
      { texto: 'Depende de como estou me sentindo emocionalmente.', perfis: ['flutuante'] },
      { texto: 'Faço um treino leve, não consigo parar completamente.', perfis: ['ignitor', 'relampago'] }
    ]
  },
  {
    texto: 'Você errou a dieta num fim de semana. Na segunda-feira, como está?',
    opcoes: [
      { texto: 'Retomo como se nada tivesse acontecido. Erro faz parte.', perfis: ['navegador', 'inabalavel'] },
      { texto: 'Me culpo muito e compenso exagerando nos treinos.', perfis: ['ignitor'] },
      { texto: 'Fico desmotivado por dias. Preciso de tempo pra voltar.', perfis: ['flutuante'] },
      { texto: 'Analiso o que errei e ajusto o plano.', perfis: ['arquiteto'] }
    ]
  },
  {
    texto: 'Como você reage quando os resultados demoram a aparecer?',
    opcoes: [
      { texto: 'Perco o interesse. Preciso ver resultado rápido.', perfis: ['relampago', 'ignitor'] },
      { texto: 'Reviso o método, talvez esteja fazendo errado.', perfis: ['arquiteto'] },
      { texto: 'Continuo. Confio que tá funcionando mesmo sem ver.', perfis: ['navegador', 'inabalavel'] },
      { texto: 'Depende do meu estado emocional, se não tô bem, abandono.', perfis: ['flutuante'] }
    ]
  },
  {
    texto: 'Você descobre um novo protocolo de treino. O que acontece?',
    opcoes: [
      { texto: 'Pesquiso tudo antes de começar. Só começo quando entender 100%.', perfis: ['arquiteto'] },
      { texto: 'Começo amanhã mesmo. Parece incrível.', perfis: ['ignitor', 'relampago'] },
      { texto: 'Vejo se faz sentido agora. Talvez em outro momento.', perfis: ['flutuante', 'navegador'] },
      { texto: 'Avalio se encaixa na rotina atual. Se sim, incluo com ajuste.', perfis: ['inabalavel'] }
    ]
  },
  {
    texto: 'O que mais te tira de uma rotina de saúde?',
    opcoes: [
      { texto: 'Estresse emocional ou relacionamentos em crise.', perfis: ['flutuante'] },
      { texto: 'Falta de resultado visível rápido.', perfis: ['relampago', 'ignitor'] },
      { texto: 'Mudança de rotina, viagem, evento, imprevisto.', perfis: ['arquiteto'] },
      { texto: 'Quase nada. Sigo mesmo quando tá difícil.', perfis: ['inabalavel', 'navegador'] }
    ]
  },
  {
    texto: 'Como você prefere acompanhar tua evolução?',
    opcoes: [
      { texto: 'Números detalhados, peso, medidas, percentual de gordura.', perfis: ['arquiteto'] },
      { texto: 'Como estou me sentindo no dia a dia.', perfis: ['flutuante', 'navegador'] },
      { texto: 'Comparando fotos e resultados a cada 30 dias.', perfis: ['relampago', 'ignitor'] },
      { texto: 'Sequências e streaks, consistência no calendário.', perfis: ['inabalavel'] }
    ]
  },
  {
    texto: 'Tu tá no melhor momento da tua rotina. O que provavelmente acontece em 60 dias?',
    opcoes: [
      { texto: 'Vou estar ainda melhor, mantenho e evoluo devagar.', perfis: ['navegador', 'inabalavel'] },
      { texto: 'Provavelmente terá oscilado bastante, altos e baixos.', perfis: ['flutuante'] },
      { texto: 'Já terá passado, durto intenso, depois pausa.', perfis: ['ignitor'] },
      { texto: 'Estarei num novo protocolo mais otimizado.', perfis: ['arquiteto', 'relampago'] }
    ]
  }
];

const PROFILES_DATA = {
  ignitor: {
    nome: 'O Ignitor',
    label: 'perfil 01',
    desc: 'Você começa com intensidade máxima e vive de picos. Quando está on, está completamente on. O desafio é criar estruturas que sustentam o movimento quando a chama diminui.',
    forca: 'Motivação explosiva',
    cego: 'Consistência zero',
    plano: 'Metas de 7 dias, não de meses. Ritmo curto com recompensa imediata. Evite ciclos longos sem feedback visível, eles apagam sua chama.',
    tags: ['alto começo', 'recaída rápida', 'precisa de âncora']
  },
  arquiteto: {
    nome: 'O Arquiteto',
    label: 'perfil 02',
    desc: 'Você precisa entender o porquê antes de agir, e quando age, age com precisão. Seu maior inimigo é a paralisia: a análise infinita que atrasa a execução. O plano perfeito que nunca começa.',
    forca: 'Disciplina estruturada',
    cego: 'Paralisia por análise',
    plano: 'Dashboard com métricas claras, mas prazo pra agir mesmo sem certeza total. O dado bom o suficiente vale mais que o perfeito que demora.',
    tags: ['orientado a dados', 'sobre planeja', 'execução tardia']
  },
  flutuante: {
    nome: 'O Flutuante',
    label: 'perfil 03',
    desc: 'Você é intuitivo e profundamente conectado com seu estado interno. Vai extraordinariamente bem quando está bem, e isso é raro. O trabalho é criar âncoras mínimas que funcionem mesmo nos dias difíceis.',
    forca: 'Autoconhecimento alto',
    cego: 'Abandona em crises',
    plano: 'Rotinas mínimas de 5 min que existem mesmo nos piores dias. O objetivo não é o ótimo, é o mínimo que mantém o fio.',
    tags: ['humor como motor', 'volátil', 'autoconsciente']
  },
  relampago: {
    nome: 'O Relâmpago',
    label: 'perfil 04',
    desc: 'Você produz resultados expressivos em ciclos curtos e tem capacidade de foco intenso quando motivado. Sem retorno visível rápido, o interesse some. Não é inconstância, é sprint, não maratona.',
    forca: 'Resultados imediatos',
    cego: 'Perde o fôlego',
    plano: 'Sprints mensais com marcos claros. Conectar cada ação de hoje com impacto futuro visível, transformar o longo prazo em vários curtos prazos.',
    tags: ['sprint mentalidade', 'foco intenso', 'precisa de marco']
  },
  navegador: {
    nome: 'O Navegador',
    label: 'perfil 05',
    desc: 'Você é o mais resiliente dos seis. Adaptável, consistente, raramente para completamente. A evolução é lenta mas real, o problema é que pode ficar tanto tempo na zona de conforto que para de crescer.',
    forca: 'Consistência total',
    cego: 'Zona de conforto crônica',
    plano: 'Desafios progressivos inseridos na rotina pra quebrar platô. Comparativos históricos pra tornar a evolução invisível visível.',
    tags: ['longo prazo', 'resiliente', 'estagna sem estímulo']
  },
  inabalavel: {
    nome: 'O Inabalável',
    label: 'perfil 06',
    desc: 'Disciplina de ferro. Você segue a rotina independente de como está, e isso é uma força que poucos têm. O perigo é não saber quando parar: ignorar sinais do corpo até que eles gritem.',
    forca: 'Consistência máxima',
    cego: 'Ignora sinais do corpo',
    plano: 'Aprender a ler o cansaço como dado, não como fraqueza. Descanso ativo é parte da performance, não o oposto dela.',
    tags: ['ferro na rotina', 'risco de burnout', 'alta disciplina']
  }
};

let quizVotes = {};
window.CIRCA_PROFILE = null;
try {
  const saved = localStorage.getItem('circa_profile');
  if (saved && typeof saved === 'string') window.CIRCA_PROFILE = saved;
} catch (e) {}

function renderQuizQuestion(slideEl) {
  const qindex = parseInt(slideEl.dataset.qindex, 10);
  const q = QUIZ_QUESTIONS[qindex];
  const letras = ['a', 'b', 'c', 'd'];
  slideEl.innerHTML = `
    <span class="eyebrow">pergunta ${String(qindex + 1).padStart(2, '0')} · perfil</span>
    <h1 class="display quiz-text">${q.texto}</h1>
    <div class="quiz-options">
      ${q.opcoes.map((op, i) => `
        <button class="quiz-opt" data-profiles='${JSON.stringify(op.perfis)}'>
          <span class="quiz-letter">${letras[i]}.</span>
          <span class="quiz-opt__text">${op.texto}</span>
        </button>
      `).join('')}
    </div>
  `;
  slideEl.querySelectorAll('.quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const perfis = JSON.parse(btn.dataset.profiles);
      perfis.forEach((p) => { quizVotes[p] = (quizVotes[p] || 0) + 1; });
      slideEl.querySelectorAll('.quiz-opt').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      hap(10);
      setTimeout(() => nextStep(), 380);
    });
  });
}

// ───── CALIBRAÇÃO FISIOLÓGICA (steps 15-22) ─────
const TRILHAS_FISIO = {
  masculina: {
    nome: 'corpo masculino',
    cor: '#7B8BB8',
    perguntas: [
      {
        texto: 'Como está sua disposição ao longo do dia?',
        contexto: 'baixa energia pode indicar desequilíbrio de testosterona ou cortisol elevado.',
        opcoes: [
          { texto: 'Constante, me sinto bem do início ao fim',            score: { equilbrio: 2 } },
          { texto: 'Queda forte após o almoço, difícil de ignorar',        score: { cortisol: 2 } },
          { texto: 'Manhã fraca, melhoro à tarde',                         score: { testosterona: 2 } },
          { texto: 'Instável, varia muito sem padrão claro',              score: { variavel: 2 } }
        ]
      },
      {
        texto: 'Como é sua recuperação após treinos intensos?',
        contexto: 'recuperação lenta pode indicar cortisol elevado, sono fragmentado ou déficit de testosterona.',
        opcoes: [
          { texto: 'Ótima, 24h e estou pronto novamente',                 score: { equilbrio: 2 } },
          { texto: 'Preciso de 48-72h para me sentir recuperado',          score: { cortisol: 1, testosterona: 1 } },
          { texto: 'Demoro mais de 3 dias, dores persistentes',           score: { cortisol: 2 } },
          { texto: 'Treino sem descanso, não costumo esperar recuperar',  score: { inabalavel: 2 } }
        ]
      },
      {
        texto: 'Como está sua qualidade de sono nos últimos 30 dias?',
        contexto: 'sono fragmentado reduz testosterona em até 15% e eleva cortisol cronicamente.',
        opcoes: [
          { texto: 'Durmo bem, 7 a 8h sem interrupção',                   score: { equilbrio: 2 } },
          { texto: 'Adormeço fácil mas acordo no meio da noite',           score: { cortisol: 2 } },
          { texto: 'Dificuldade para adormecer, mente acelerada',          score: { stress: 2 } },
          { texto: 'Durmo pouco por escolha, menos de 6h',                score: { privacao: 2 } }
        ]
      },
      {
        texto: 'Nos últimos 3 meses, como está sua libido?',
        contexto: 'libido reduzida é um dos primeiros sinais de queda de testosterona livre.',
        opcoes: [
          { texto: 'Normal para mim, sem mudança',                        score: { equilbrio: 2 } },
          { texto: 'Percebo uma queda progressiva',                        score: { testosterona: 2 } },
          { texto: 'Queda acentuada, diferente do que era antes',         score: { testosterona: 3 } },
          { texto: 'Nunca prestei atenção nisso',                          score: { desconhecido: 1 } }
        ]
      },
      {
        texto: 'Você já fez exame de testosterona total?',
        contexto: 'saber os níveis basais é o ponto de partida para calibração hormonal.',
        opcoes: [
          { texto: 'Sim, recentemente, dentro do esperado',               score: { consciente: 2 } },
          { texto: 'Fiz, mas estava abaixo do ideal',                      score: { testosterona: 2, consciente: 1 } },
          { texto: 'Nunca fiz',                                            score: { desconhecido: 2 } },
          { texto: 'Faço acompanhamento regular com médico',               score: { consciente: 3 } }
        ]
      },
      {
        texto: 'Como é sua relação com estresse?',
        contexto: 'cortisol cronicamente elevado é o maior inibidor de testosterona e recuperação muscular.',
        opcoes: [
          { texto: 'Gerenciável, consigo descomprimir',                   score: { equilbrio: 2 } },
          { texto: 'Alto, mas funciono bem sob pressão',                   score: { cortisol: 1 } },
          { texto: 'Elevado e sinto impacto no corpo',                     score: { cortisol: 3 } },
          { texto: 'Extremo, raramente desconecto',                       score: { cortisol: 3, stress: 2 } }
        ]
      }
    ]
  },
  feminina: {
    nome: 'corpo feminino com ciclo',
    cor: '#D99D85',
    perguntas: [
      {
        texto: 'Seu ciclo menstrual é regular?',
        contexto: 'irregularidade pode indicar desequilíbrio estrogênio/progesterona ou SOP.',
        opcoes: [
          { texto: 'Regular, 28 a 32 dias com pouca variação',            score: { equilbrio: 2 } },
          { texto: 'Irregular, varia mais de 5 dias entre ciclos',        score: { irregular: 2 } },
          { texto: 'Uso anticoncepcional hormonal, ciclo induzido',       score: { anticoncepcional: 2 } },
          { texto: 'Ciclo ausente ou muito espaçado',                      score: { ausente: 3 } }
        ]
      },
      {
        texto: 'Como sua performance física varia ao longo do mês?',
        contexto: 'fase folicular (1-14) estrogênio alto = melhor performance. fase lútea (15-28) fadiga sobe.',
        opcoes: [
          { texto: 'Noto diferença clara, semanas melhores e piores',     score: { cicloConsciente: 3 } },
          { texto: 'Percebo queda de energia antes da menstruação',        score: { lutea: 2 } },
          { texto: 'Não noto variação, me sinto igual o mês todo',        score: { neutro: 2 } },
          { texto: 'Nunca prestei atenção nisso',                          score: { desconhecido: 2 } }
        ]
      },
      {
        texto: 'Como é a intensidade da sua TPM?',
        contexto: 'TPM intensa pode indicar dominância de estrogênio ou déficit de progesterona.',
        opcoes: [
          { texto: 'Leve, quase não sinto',                               score: { equilbrio: 2 } },
          { texto: 'Moderada, irritabilidade e retenção',                 score: { tpm: 1 } },
          { texto: 'Intensa, impacta trabalho e relacionamentos',         score: { tpm: 3 } },
          { texto: 'Não tenho TPM ou uso anticoncepcional',                score: { neutro: 1 } }
        ]
      },
      {
        texto: 'Como está sua energia nos dias 5-10 do ciclo?',
        contexto: 'esse é o pico de estrogênio, deveria ser o maior período de energia e força.',
        opcoes: [
          { texto: 'Me sinto ótima, mais disposta e forte',               score: { estrogenoBom: 2 } },
          { texto: 'Melhora um pouco, mas não é expressiva',               score: { estrogenoBaixo: 1 } },
          { texto: 'Continuo cansada mesmo nesse período',                 score: { fadiga: 2 } },
          { texto: 'Não noto diferença entre as fases',                    score: { neutro: 2 } }
        ]
      },
      {
        texto: 'Sente compulsão alimentar antes da menstruação?',
        contexto: 'compulsão por carboidratos na fase lútea é resposta à queda de serotonina.',
        opcoes: [
          { texto: 'Sim, compulsão clara, especialmente por doces',       score: { serotonina: 2 } },
          { texto: 'Apetite aumenta mas consigo controlar',                score: { serotonina: 1 } },
          { texto: 'Não noto mudança no apetite',                          score: { equilbrio: 1 } },
          { texto: 'Perco o apetite antes da menstruação',                 score: { stress: 1 } }
        ]
      },
      {
        texto: 'Você mapeia o ciclo e adapta treino/alimentação?',
        contexto: 'treinar conforme as fases pode aumentar performance em até 25% e reduzir lesões.',
        opcoes: [
          { texto: 'Sim, faço isso ativamente',                           score: { cicloConsciente: 3 } },
          { texto: 'Sei que deveria mas não faço',                         score: { conhecimento: 1 } },
          { texto: 'Não sabia que isso era possível',                      score: { desconhecido: 2 } },
          { texto: 'Uso anticoncepcional, ciclo suprimido',               score: { anticoncepcional: 2 } }
        ]
      }
    ]
  },
  transicao: {
    nome: 'transição hormonal',
    cor: '#D4B896',
    perguntas: [
      {
        texto: 'Qual melhor descreve seu momento hormonal?',
        contexto: 'perimenopausa pode começar até 10 anos antes da menopausa. andropausa tipicamente 40-55 anos.',
        opcoes: [
          { texto: 'Perimenopausa, ciclos irregulares, ainda menstruo',   score: { peri: 3 } },
          { texto: 'Menopausa, sem menstruação há mais de 12 meses',      score: { meno: 3 } },
          { texto: 'Andropausa, queda progressiva de testosterona',       score: { andro: 3 } },
          { texto: 'Suspeito que estou nessa fase mas não confirmei',      score: { suspeita: 2 } }
        ]
      },
      {
        texto: 'Como estão seus fogachos ou ondas de calor?',
        contexto: 'frequência e intensidade indicam velocidade da queda de estrogênio.',
        opcoes: [
          { texto: 'Ausentes ou muito leves',                              score: { leve: 2 } },
          { texto: 'Moderados, algumas vezes ao dia',                     score: { moderado: 2 } },
          { texto: 'Intensos, impactam sono e trabalho',                  score: { intenso: 3 } },
          { texto: 'Não tenho esse sintoma',                               score: { ausente: 1 } }
        ]
      },
      {
        texto: 'Como está sua qualidade de sono?',
        contexto: 'queda de estrogênio e progesterona fragmenta o sono profundo.',
        opcoes: [
          { texto: 'Durmo bem, 7h sem grandes interrupções',              score: { equilbrio: 2 } },
          { texto: 'Acordo 1-2x por noite mas volto a dormir',             score: { fragmentado: 2 } },
          { texto: 'Sono muito fragmentado, acordo cansado',              score: { privacao: 3 } },
          { texto: 'Insônia, difícil adormecer ou manter o sono',         score: { insonia: 3 } }
        ]
      },
      {
        texto: 'Você faz ou já fez terapia de reposição hormonal?',
        contexto: 'TRH bem conduzida pode reverter a maioria dos sintomas e proteger coração e ossos.',
        opcoes: [
          { texto: 'Sim, acompanhamento atual com médico',                 score: { trh: 3 } },
          { texto: 'Já fiz mas parei',                                     score: { trh: 1 } },
          { texto: 'Nunca fiz, não me sinto informado o suficiente',      score: { desinformado: 2 } },
          { texto: 'Prefiro não fazer, busco alternativas naturais',      score: { natural: 2 } }
        ]
      },
      {
        texto: 'Como está sua composição corporal nos últimos 12 meses?',
        contexto: 'ganho de gordura visceral e perda muscular aceleram na transição, mesmo sem mudança de hábitos.',
        opcoes: [
          { texto: 'Estável, não sinto mudança significativa',            score: { equilbrio: 2 } },
          { texto: 'Ganho de gordura abdominal mesmo com dieta',           score: { gordura: 3 } },
          { texto: 'Perda muscular perceptível apesar do treino',          score: { muscular: 3 } },
          { texto: 'Ambos, gordura subindo e músculo diminuindo',         score: { gordura: 2, muscular: 2 } }
        ]
      },
      {
        texto: 'Qual é seu maior desafio de saúde hoje?',
        contexto: 'identificar a prioridade permite plano mais focado e efetivo.',
        opcoes: [
          { texto: 'Energia e disposição ao longo do dia',                 score: { energia: 3 } },
          { texto: 'Sono e recuperação',                                   score: { sono: 3 } },
          { texto: 'Composição corporal e peso',                           score: { composicao: 3 } },
          { texto: 'Humor, ansiedade ou cognição',                         score: { humor: 3 } }
        ]
      }
    ]
  }
};

const RESULTADOS_FISIO = {
  masculina: {
    equilibrado: {
      nome: 'perfil equilibrado',
      label: 'masculina · equilibrado',
      desc: 'tua fisiologia tá em boa sincronia. testosterona e cortisol operando em equilíbrio, o terreno ideal pra evoluir com consistência.',
      insight: 'teu corpo responde bem ao estímulo atual. o foco agora é periodização inteligente e prevenção de platô.',
      prioridade: 'manutenção + sobrecarga progressiva',
      atencao: 'monitorar cortisol em períodos de alta demanda',
      acoes: ['exame semestral de testosterona total e livre', 'protocolo de descanso ativo 1-2x/semana', 'creatina 5g/dia como suporte de base']
    },
    altoStress: {
      nome: 'cortisol elevado',
      label: 'masculina · cortisol alto',
      desc: 'sinais de estresse crônico impactando recuperação e possivelmente testosterona. teu corpo tá em modo de alerta constante.',
      insight: 'cortisol e testosterona competem pelos mesmos precursores. reduzir cortisol é o caminho mais rápido pra melhorar composição.',
      prioridade: 'redução de carga de estresse',
      atencao: 'evitar treinos de alta intensidade em sequência',
      acoes: ['dosar cortisol salivar matinal', 'janela de descompressão de 30min antes de dormir', 'reduzir treinos de alta intensidade pra 2x/semana']
    },
    baixaTestosterona: {
      nome: 'sinal de baixa T',
      label: 'masculina · baixa testosterona',
      desc: 'padrões sugerem queda de testosterona, libido caindo, recuperação lenta e energia baixa pela manhã são sinais clássicos.',
      insight: 'testosterona baixa afeta composição, humor e cognição, não só performance física. vale investigar com exame.',
      prioridade: 'investigação hormonal com médico',
      atencao: 'suplementação sem exame pode mascarar causa real',
      acoes: ['agendar painel hormonal completo (T total, T livre, LH, FSH)', 'priorizar sono 7-8h, produção de T é noturna', 'zinco + vitamina D como suporte enquanto aguarda exame']
    }
  },
  feminina: {
    cicloConsciente: {
      nome: 'ciclicamente consciente',
      label: 'feminina · ciclo consciente',
      desc: 'tu já percebe as variações do teu ciclo, isso é um ativo enorme. a calibração vai traduzir esse autoconhecimento em protocolo prático.',
      insight: 'mulheres que treinam conforme as fases do ciclo relatam até 25% mais performance e menos lesões.',
      prioridade: 'periodização baseada no ciclo',
      atencao: 'fase lútea pede redução de intensidade',
      acoes: ['mapear ciclo por 2 meses pra identificar padrões', 'treino de força na fase folicular (dias 1-14)', 'yoga/pilates na fase lútea (dias 15-28)']
    },
    desequilibrio: {
      nome: 'desequilíbrio hormonal',
      label: 'feminina · desequilíbrio',
      desc: 'sinais de dominância estrogênica ou déficit de progesterona, TPM intensa, ciclo irregular e fadiga persistente.',
      insight: 'dominância de estrogênio é comum e tratável. alimentação, exercício e suplementação específica fazem diferença real.',
      prioridade: 'avaliação com ginecologista/endócrino',
      atencao: 'anticoncepcional pode mascarar sintomas',
      acoes: ['exame de estrogênio, progesterona e FSH na fase lútea (dia 21)', 'reduzir disruptores endócrinos: plásticos, álcool, ultraprocessados', 'magnésio 300mg à noite, reduz TPM em estudos clínicos']
    },
    neutro: {
      nome: 'perfil a descobrir',
      label: 'feminina · descobrir',
      desc: 'tu ainda não mapeou as variações do teu ciclo, oportunidade enorme de ganhar performance e qualidade de vida.',
      insight: 'a maioria das mulheres desconhece como o ciclo afeta o corpo. essa calibração é o primeiro passo.',
      prioridade: 'mapeamento do ciclo por 60 dias',
      atencao: 'não subestimar o impacto da fase lútea',
      acoes: ['usar o circa pra registrar energia e humor diários', 'marcar início e fim de cada fase no calendário', 'consulta com ginecologista pra painel hormonal base']
    }
  },
  transicao: {
    ativa: {
      nome: 'transição ativa',
      label: 'transição · ativa',
      desc: 'tu tá no processo com sintomas presentes. com o protocolo certo, a maioria dos sintomas é reversível ou manejável.',
      insight: 'a transição hormonal não precisa ser declínio, com intervenção adequada, muitos vivem os melhores anos depois dela.',
      prioridade: 'acompanhamento médico especializado',
      atencao: 'massa muscular e óssea precisam de proteção ativa',
      acoes: ['consulta com endocrinologista pra avaliação de TRH', 'treino de força 3x/semana, essencial pra preservar massa', 'vitamina D3 + K2 + magnésio como base de suporte']
    },
    gerenciada: {
      nome: 'transição gerenciada',
      label: 'transição · gerenciada',
      desc: 'tu já tá em acompanhamento ou tem clareza do momento. o foco agora é otimizar o protocolo e monitorar evolução.',
      insight: 'quem faz TRH bem conduzida tem menor risco cardiovascular, ósseo e cognitivo a longo prazo.',
      prioridade: 'otimização do protocolo atual',
      atencao: 'revisão anual dos níveis hormonais',
      acoes: ['revisão de exames a cada 6 meses com médico', 'adicionar proteína na dieta, 1.8g por kg de peso', 'registrar sintomas no circa pra identificar padrões']
    },
    inicial: {
      nome: 'início de transição',
      label: 'transição · inicial',
      desc: 'primeiros sinais de transição, o momento ideal pra agir preventivamente antes que os sintomas se intensifiquem.',
      insight: 'intervir cedo tem impacto muito maior do que intervir depois dos sintomas instalados.',
      prioridade: 'investigação e prevenção',
      atencao: 'não normalizar sintomas como envelhecimento inevitável',
      acoes: ['exame completo: hormônios, densidade óssea, perfil lipídico', 'iniciar treino de força se ainda não faz', 'consulta preventiva com endocrinologista']
    }
  }
};

let fisioTrilha = null;
let fisioScores = {};
window.CIRCA_FISIO = null;

// restaurar do localStorage
try {
  const savedFisio = localStorage.getItem('circa_fisio');
  if (savedFisio) window.CIRCA_FISIO = JSON.parse(savedFisio);
} catch (e) {}

function renderFisioTrilhas(slideEl) {
  slideEl.querySelectorAll('.fisio-chips .ob-chip').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      slideEl.querySelectorAll('.fisio-chips .ob-chip').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      fisioTrilha = btn.dataset.trilha;
      fisioScores = {};
      hap(10);
      setTimeout(() => nextStep(), 380);
    });
  });
}

function renderFisioQuestion(slideEl) {
  if (!fisioTrilha) return; // guard
  const qindex = parseInt(slideEl.dataset.fqindex, 10);
  const trilha = TRILHAS_FISIO[fisioTrilha];
  const q = trilha.perguntas[qindex];
  const letras = ['a', 'b', 'c', 'd'];

  slideEl.innerHTML = `
    <span class="eyebrow">pergunta ${String(qindex + 1).padStart(2, '0')} · ${trilha.nome}</span>
    <h1 class="display quiz-text">${q.texto}</h1>
    <p class="fisio-ctx">${q.contexto}</p>
    <div class="quiz-options">
      ${q.opcoes.map((op, i) => `
        <button class="quiz-opt" data-score='${JSON.stringify(op.score)}'>
          <span class="quiz-letter">${letras[i]}.</span>
          <span class="quiz-opt__text">${op.texto}</span>
        </button>
      `).join('')}
    </div>
  `;

  slideEl.querySelectorAll('.quiz-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scr = JSON.parse(btn.dataset.score);
      Object.keys(scr).forEach((k) => { fisioScores[k] = (fisioScores[k] || 0) + scr[k]; });
      slideEl.querySelectorAll('.quiz-opt').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      hap(10);
      setTimeout(() => nextStep(), 380);
    });
  });
}

function computeFisioResult() {
  const s = fisioScores;
  if (fisioTrilha === 'masculina') {
    if ((s.cortisol || 0) >= 4 || (s.stress || 0) >= 2) return RESULTADOS_FISIO.masculina.altoStress;
    if ((s.testosterona || 0) >= 3) return RESULTADOS_FISIO.masculina.baixaTestosterona;
    return RESULTADOS_FISIO.masculina.equilibrado;
  }
  if (fisioTrilha === 'feminina') {
    if ((s.cicloConsciente || 0) >= 3) return RESULTADOS_FISIO.feminina.cicloConsciente;
    if ((s.tpm || 0) >= 2 || (s.irregular || 0) >= 2) return RESULTADOS_FISIO.feminina.desequilibrio;
    return RESULTADOS_FISIO.feminina.neutro;
  }
  if (fisioTrilha === 'transicao') {
    if ((s.trh || 0) >= 2) return RESULTADOS_FISIO.transicao.gerenciada;
    if ((s.intenso || 0) >= 2 || (s.privacao || 0) >= 2) return RESULTADOS_FISIO.transicao.ativa;
    return RESULTADOS_FISIO.transicao.inicial;
  }
  return null;
}

function renderFisioResult(slideEl) {
  const res = computeFisioResult();
  if (!res) {
    slideEl.innerHTML = '<p class="lead">não foi possível calcular, refaz a calibração.</p>';
    return;
  }
  window.CIRCA_FISIO = { trilha: fisioTrilha, resultado: res.label };
  try { localStorage.setItem('circa_fisio', JSON.stringify(window.CIRCA_FISIO)); } catch (e) {}

  slideEl.innerHTML = `
    <span class="eyebrow">${res.label} · calibração concluída</span>
    <h1 class="display quiz-result__name">${res.nome}</h1>
    <p class="lead">${res.desc}</p>

    <div class="fisio-insight">
      <span class="eyebrow">insight fisiológico</span>
      <p>${res.insight}</p>
    </div>

    <div class="profile-cards">
      <div class="profile-card">
        <span class="eyebrow">prioridade agora</span>
        <strong>${res.prioridade}</strong>
      </div>
      <div class="profile-card">
        <span class="eyebrow">atenção</span>
        <strong>${res.atencao}</strong>
      </div>
    </div>

    <div class="profile-plan">
      <span class="eyebrow">3 ações pra esta semana</span>
      <ul class="sugg" style="margin-top:6px;">
        ${res.acoes.map((a) => `<li><i class="s-dot"></i>${a}</li>`).join('')}
      </ul>
    </div>

    <button class="btn btn--primary btn--full ob-next">continuar</button>
  `;
  slideEl.querySelector('.ob-next').addEventListener('click', () => nextStep());
}

function renderQuizResult(slideEl) {
  const keys = Object.keys(quizVotes);
  const winner = keys.length
    ? keys.reduce((a, b) => (quizVotes[a] > quizVotes[b] ? a : b))
    : 'navegador';
  const p = PROFILES_DATA[winner];
  window.CIRCA_PROFILE = winner;
  try { localStorage.setItem('circa_profile', winner); } catch (e) {}

  slideEl.innerHTML = `
    <span class="eyebrow">${p.label} · seu perfil circa</span>
    <h1 class="display quiz-result__name">${p.nome}</h1>
    <p class="lead">${p.desc}</p>

    <div class="profile-cards">
      <div class="profile-card">
        <span class="eyebrow">força</span>
        <strong>${p.forca}</strong>
      </div>
      <div class="profile-card">
        <span class="eyebrow">ponto cego</span>
        <strong>${p.cego}</strong>
      </div>
    </div>

    <div class="profile-plan">
      <span class="eyebrow">plano de ação</span>
      <p>${p.plano}</p>
    </div>

    <div class="profile-tags">
      ${p.tags.map((t) => `<span class="profile-tag">${t}</span>`).join('')}
    </div>

    <button class="btn btn--primary btn--full ob-next">continuar setup</button>
  `;
  // o novo botão precisa re-hookar o ob-next (listeners não migram com innerHTML)
  slideEl.querySelector('.ob-next').addEventListener('click', () => nextStep());
}

function openOnboard() {
  obStep = 1;
  quizVotes = {};
  fisioTrilha = null;
  fisioScores = {};
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
  // progress bar contínua
  if (obProgressFill) obProgressFill.style.width = ((obStep - 1) / (TOTAL_STEPS - 1) * 100).toFixed(1) + '%';
  if (obProgressLbl)  obProgressLbl.textContent = obStep + ' / ' + TOTAL_STEPS;
  obBackBtn.disabled = obStep === 1;

  // rodas: steps 2 (hoje) e 3 (meta)
  if (obStep === 2) renderObWheel();
  if (obStep === 3) renderObGoalWheel();

  // calibração fisiológica · seletor (step 4)
  if (obStep === 4) {
    const slide = document.querySelector('.ob-slide[data-step="4"]');
    if (slide) renderFisioTrilhas(slide);
  }
  // perguntas fisiológicas · steps 5-10
  if (obStep >= 5 && obStep <= 10) {
    const slide = document.querySelector('.ob-slide[data-step="' + obStep + '"]');
    if (slide) renderFisioQuestion(slide);
  }
  // resultado fisiológico · step 11
  if (obStep === 11) {
    const slide = document.querySelector('.ob-slide[data-step="11"]');
    if (slide) renderFisioResult(slide);
  }

  // quiz perfil comportamental: steps 12-19
  if (obStep >= 12 && obStep <= 19) {
    const slide = document.querySelector('.ob-slide[data-step="' + obStep + '"]');
    if (slide) renderQuizQuestion(slide);
  }
  // resultado perfil: step 20
  if (obStep === 20) {
    const slide = document.querySelector('.ob-slide[data-step="20"]');
    if (slide) renderQuizResult(slide);
  }
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

// step 14 · input de nome
const obNameInput = document.getElementById('ob-name');
if (obNameInput) {
  // pre-popula se já tiver salvo
  if (USER_NAME && USER_NAME !== 'Gabriel') obNameInput.value = USER_NAME;
  obNameInput.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (v) setUserName(v);
  });
  obNameInput.addEventListener('blur', (e) => {
    const v = e.target.value.trim();
    if (v) setUserName(v);
  });
}

// aplica nome em todos os dependentes na inicialização
refreshNameDependents();

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

// step 23 · sentido (single)
document.querySelectorAll('.ob-slide[data-step="23"] .ob-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ob-slide[data-step="23"] .ob-card').forEach((c) => c.classList.remove('is-on'));
    card.classList.add('is-on');
    document.querySelector('.ob-slide[data-step="23"] .ob-next').disabled = false;
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
