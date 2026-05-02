/* ───── Circa prototype interactions ───── */

// ═════════════════════════════════════════
// FAILSAFE · força apple-mode no body imediatamente
// previne flash do design v0 caso a classe não tenha sido aplicada no HTML
// ═════════════════════════════════════════
(function () {
  if (document.body && !document.body.classList.contains('apple-mode')) {
    document.body.classList.add('apple-mode');
  }
})();

// ═════════════════════════════════════════
// DATA RESET · zera todos os dados uma vez nesta versão
// pra começar do zero e medir da linha de base
// ═════════════════════════════════════════
(function () {
  const RESET_VERSION = 'v5-2026-05-02-a';
  try {
    const current = localStorage.getItem('circa_data_version');
    if (current !== RESET_VERSION) {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith('circa_')) localStorage.removeItem(k);
      });
      localStorage.setItem('circa_data_version', RESET_VERSION);
    }
  } catch (e) {}
})();

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
  ter: { day: 'ter', label: 'terça', type: 'musculação', subtitle: 'ombros & trapézio · 60min', status: 'done',
         exercises: [
           { name: 'desenvolvimento',    meta: '4 × 8 · 24kg' },
           { name: 'elevação lateral',   meta: '4 × 12 · 10kg' },
           { name: 'elevação frontal',   meta: '3 × 12 · 10kg' },
           { name: 'encolhimento',       meta: '4 × 10 · 30kg' },
           { name: 'face pull',          meta: '3 × 15 · 20kg' },
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
  sab: { day: 'sab', label: 'sábado', type: 'musculação', subtitle: 'abdome & core + cardio leve · 45min · hoje', status: 'today',
         exercises: [
           { name: 'abdominal reto',     meta: '4 × 20' },
           { name: 'prancha',            meta: '3 × 60s' },
           { name: 'elevação de pernas', meta: '4 × 15' },
           { name: 'prancha lateral',    meta: '3 × 40s cada lado' },
           { name: 'esteira leve',       meta: '20 min · pace 6:30' },
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
  saude:    { title: 'saúde',         goal: 9, last: 'treino hoje · musculação 60min',           suggest: 'mantenha cadência. 3 treinos matinais essa semana.' },
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
  { key: 'saude',   label: 'saúde',    value: 7 },
  { key: 'familia', label: 'família',  value: 6 },
  { key: 'relac',   label: 'relações', value: 5 },
  { key: 'lazer',   label: 'lazer',    value: 4 },
  { key: 'espirit', label: 'espírito', value: 7 },
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
//   modo 'full'    → 3 telas (respira → frases → confirmação) → onboarding
//   modo 'breathe' → só respira personalizada com nome → app
// ═════════════════════════════════════════
const welcomeEl = document.getElementById('welcome');

// saudação baseada na hora local
function saudacaoCirca() {
  const h = new Date().getHours();
  if (h < 5)  return 'boa madrugada';
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
}

// textos da tela 1 (respira) — alterna entre full e breathe
const WLC_TEXTS = {
  full: {
    eye:  'antes de começar',
    lead: 'o circa não é mais um app de metas.<br/>é o único que te conhece de verdade.',
    cta:  'estou pronto',
  },
  breathe: {
    eye:  () => saudacaoCirca() + ', ' + (USER_NAME || 'gabriel').toLowerCase(),
    lead: 'um instante,<br/>antes de continuar.',
    cta:  'continuar',
  },
};

function aplicarTextosWlc(mode) {
  const t = WLC_TEXTS[mode] || WLC_TEXTS.full;
  const tela1 = welcomeEl.querySelector('.wlc-tela[data-wlc="1"]');
  if (!tela1) return;
  const eye  = tela1.querySelector('.wlc-eye');
  const lead = tela1.querySelector('.lead');
  const cta  = tela1.querySelector('.wlc-cta');
  if (eye)  eye.textContent  = (typeof t.eye  === 'function') ? t.eye()  : t.eye;
  if (lead) lead.innerHTML   = (typeof t.lead === 'function') ? t.lead() : t.lead;
  if (cta)  cta.textContent  = (typeof t.cta  === 'function') ? t.cta()  : t.cta;
}

function openWelcome(opts) {
  if (!welcomeEl) return;
  const mode = (opts && opts.mode) || 'full';
  welcomeEl.classList.toggle('is-breathe-only', mode === 'breathe');
  welcomeEl.classList.add('is-open');
  welcomeEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // textos personalizados conforme o modo
  aplicarTextosWlc(mode);
  // sempre começa na tela 1 ao abrir
  wlcIrPara(1);
  // liga o fundo vivo global
  if (typeof startWlcFundo === 'function') startWlcFundo();
}
function closeWelcome() {
  if (!welcomeEl) return;
  welcomeEl.classList.remove('is-open');
  welcomeEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  try { localStorage.setItem('circa_welcome_seen', '1'); } catch (e) {}
  // só desliga se onboarding também não estiver aberto
  if (typeof maybeStopWlcFundo === 'function') maybeStopWlcFundo();
}

// ═════════════════════════════════════════
// FUNDO VIVO DO WELCOME · 4 blobs em champanhe Circa
// ═════════════════════════════════════════
let wlcFundoRAF = null;
let wlcFundoT   = 0;

function fundoFlowAtivo() {
  // ativo se welcome OU onboarding estiverem abertos
  const w = welcomeEl && welcomeEl.classList.contains('is-open');
  const o = document.getElementById('onboard');
  const oOpen = o && o.classList.contains('is-open');
  return w || oOpen;
}

function maybeStopWlcFundo() {
  // só para se nem welcome nem onboarding estiverem abertos
  if (!fundoFlowAtivo() && typeof stopWlcFundo === 'function') {
    stopWlcFundo();
  }
}

function startWlcFundo() {
  const canvas = document.getElementById('wlc-fundo');
  if (!canvas) return;
  // marca body.fundo-on pra revelar canvas + dar bg de fallback aos overlays
  document.body.classList.add('fundo-on');
  if (wlcFundoRAF) return; // já rodando
  const ctx = canvas.getContext('2d');
  // força reflow pra garantir dimensões corretas após o display:block
  void canvas.offsetWidth;

  // 7 blobs · paleta verde-mata + dourado champanhe (mar/vento/natureza)
  //   verde sage   #6C8A7A → 108,138,122
  //   verde mato   #4A6B5A → 74,107,90
  //   verde musgo  #5A7864 → 90,120,100
  //   verde-oliva  #8C9A6E → 140,154,110 (transição p/ ouro)
  //   ouro champ   #D4B896 → 212,184,150
  //   ouro warm    #E8C9A0 → 232,201,160
  //   creme glow   #F5EEE6 → 245,238,230
  const BLOBS = [
    // 3 verdes (presença principal · opacidade alta)
    { rx: 0.18, ry: 0.25, baseR: 0.72, px: 0.0, py: 0.5,  spx: 0.42, spy: 0.32, cor: '108,138,122', op: 0.36 },
    { rx: 0.78, ry: 0.18, baseR: 0.58, px: 1.4, py: 1.7,  spx: 0.38, spy: 0.41, cor: '74,107,90',   op: 0.34 },
    { rx: 0.55, ry: 0.82, baseR: 0.65, px: 2.3, py: 0.9,  spx: 0.46, spy: 0.30, cor: '90,120,100',  op: 0.30 },
    // 1 verde-oliva (ponte verde→ouro)
    { rx: 0.32, ry: 0.62, baseR: 0.50, px: 0.8, py: 2.1,  spx: 0.40, spy: 0.36, cor: '140,154,110', op: 0.22 },
    // 2 douradas (acentos · vento que cruza)
    { rx: 0.85, ry: 0.45, baseR: 0.52, px: 1.9, py: 1.2,  spx: 0.52, spy: 0.28, cor: '212,184,150', op: 0.20 },
    { rx: 0.10, ry: 0.85, baseR: 0.42, px: 2.6, py: 0.4,  spx: 0.44, spy: 0.36, cor: '232,201,160', op: 0.16 },
    // 1 creme tênue (luz refletindo · respira lento)
    { rx: 0.50, ry: 0.30, baseR: 0.36, px: 1.1, py: 2.6,  spx: 0.26, spy: 0.46, cor: '245,238,230', op: 0.10 },
  ];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, rect.width  * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    canvas.dataset.dpr = String(dpr);
  }

  function frame() {
    if (!fundoFlowAtivo()) {
      wlcFundoRAF = null;
      return;
    }
    // tempo principal · ritmo natural (perceptível mas calmo)
    wlcFundoT += 0.0035;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // BASE TINT · verde profundo subtilíssimo lavando todo o canvas
    //   dá presença ambiente · evita que blobs sumam contra o bg quase preto
    const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
    baseGrad.addColorStop(0,   'rgba(40, 60, 50, 0.18)');
    baseGrad.addColorStop(0.5, 'rgba(50, 72, 60, 0.10)');
    baseGrad.addColorStop(1,   'rgba(38, 52, 44, 0.20)');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // VENTO GLOBAL · drift horizontal/vertical aplicado sobre todos os blobs
    //   vento1: período longo (perceptível), vento2: harmônica média pra micro-deriva
    const ventoX = Math.sin(wlcFundoT * 0.55) * 0.045 + Math.sin(wlcFundoT * 1.7) * 0.012;
    const ventoY = Math.cos(wlcFundoT * 0.41) * 0.034 + Math.sin(wlcFundoT * 1.1) * 0.010;

    BLOBS.forEach((b, i) => {
      // ONDA: composição de 2 frequências dá movimento orgânico (mar)
      //   amplitude maior pra ser perceptível · frequência base + harmônica dessincronizada
      const ondaX = Math.sin(wlcFundoT * b.spx + b.px) * 0.14
                  + Math.sin(wlcFundoT * b.spx * 2.7 + b.px * 1.3) * 0.045;
      const ondaY = Math.cos(wlcFundoT * b.spy + b.py) * 0.12
                  + Math.cos(wlcFundoT * b.spy * 2.3 + b.py * 1.7) * 0.038;

      // raio respira (escala 1 ± 6%) — pulsação lenta + harmônica sutil
      const pulse = 1
        + 0.06 * Math.sin(wlcFundoT * 0.55 + b.px)
        + 0.02 * Math.sin(wlcFundoT * 1.6 + b.py * 0.8);
      const r = Math.min(W, H) * b.baseR * pulse;

      // posição final = base + onda própria + vento global (compartilhado)
      const cx = W * (b.rx + ondaX + ventoX);
      const cy = H * (b.ry + ondaY + ventoY);

      // gradient com 4 stops · centro mais denso · borda dissolve suavemente
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,    `rgba(${b.cor},${b.op})`);
      grad.addColorStop(0.35, `rgba(${b.cor},${b.op * 0.7})`);
      grad.addColorStop(0.7,  `rgba(${b.cor},${b.op * 0.3})`);
      grad.addColorStop(1,    `rgba(${b.cor},0)`);

      // elipse com proporções vivas (sopro vertical) + rotação muito lenta
      ctx.beginPath();
      ctx.ellipse(
        cx, cy, r,
        r * (0.72 + 0.24 * Math.sin(wlcFundoT * 0.5 + b.py)),
        wlcFundoT * 0.05 + i * 0.25,
        0, Math.PI * 2
      );
      ctx.fillStyle = grad;
      ctx.fill();
    });

    wlcFundoRAF = requestAnimationFrame(frame);
  }

  resize();
  // resize listener (limpo ao parar)
  if (!canvas.dataset.resizeBound) {
    window.addEventListener('resize', () => {
      if (fundoFlowAtivo()) resize();
    });
    canvas.dataset.resizeBound = '1';
  }
  // RAF inicial · primeiro frame em ~16ms · enquanto isso o bg de fallback
  // do .onboard (rgba 8,5,2,0.4 + radial sutil champanhe) cobre a tela escura
  wlcFundoRAF = requestAnimationFrame(frame);
}

function stopWlcFundo() {
  if (wlcFundoRAF) {
    cancelAnimationFrame(wlcFundoRAF);
    wlcFundoRAF = null;
  }
  document.body.classList.remove('fundo-on');
}

// ───── WELCOME FLOW · 3 telas (respira → frases → confirmação) ─────
let wlcTelaAtual = 1;

function wlcIrPara(n) {
  const telas = welcomeEl ? welcomeEl.querySelectorAll('.wlc-tela') : [];
  if (!telas.length) return;
  const atual = welcomeEl.querySelector(`.wlc-tela[data-wlc="${wlcTelaAtual}"]`);
  const prox  = welcomeEl.querySelector(`.wlc-tela[data-wlc="${n}"]`);
  if (!atual || !prox) return;
  if (atual === prox) return;

  atual.classList.remove('is-active');
  atual.classList.add('is-leaving');
  setTimeout(() => atual.classList.remove('is-leaving'), 700);
  prox.classList.add('is-active');
  wlcTelaAtual = n;

  // header: progresso + step
  const fill = document.getElementById('wlc-prog-fill');
  const step = document.getElementById('wlc-step');
  const map = { 1: ['33%', '1 / 3'], 2: ['66%', '2 / 3'], 3: ['100%', '3 / 3'] };
  if (map[n]) {
    if (fill) fill.style.width = map[n][0];
    if (step) step.textContent = map[n][1];
  }
  try { hap(8); } catch (e) {}
}

// botões "estou pronto" / "voltar"
document.querySelectorAll('[data-wlc-go]').forEach((b) => {
  b.addEventListener('click', () => {
    // breathe mode: CTA "continuar" só fecha welcome, não avança
    if (welcomeEl && welcomeEl.classList.contains('is-breathe-only')) {
      closeWelcome();
      return;
    }
    const n = parseInt(b.dataset.wlcGo, 10);
    if (!isNaN(n)) wlcIrPara(n);
  });
});

// seleção de frase na tela 2 → preenche tela 3 e avança
document.querySelectorAll('.wlc-frase').forEach((card) => {
  card.addEventListener('click', () => {
    const frase = card.dataset.frase || '';
    const dim   = card.dataset.dim || '';
    document.querySelectorAll('.wlc-frase').forEach((c) => {
      c.classList.remove('is-sel');
      c.classList.add('is-faded');
    });
    card.classList.remove('is-faded');
    card.classList.add('is-sel');

    const eco = document.getElementById('wlc-confirm-eco');
    const dimEl = document.getElementById('wlc-confirm-dim');
    if (eco)  eco.textContent = '"' + frase + '"';
    if (dimEl) dimEl.textContent = dim;

    // salva escolha
    try {
      localStorage.setItem('circa_welcome_frase', frase);
      localStorage.setItem('circa_welcome_dim', dim);
    } catch (e) {}

    try { hap(12); } catch (e) {}
    setTimeout(() => wlcIrPara(3), 550);
  });
});

// "entrar na circa" → fecha welcome + abre onboarding
const wlcEntrar = document.getElementById('wlc-entrar');
if (wlcEntrar) wlcEntrar.addEventListener('click', () => {
  closeWelcome();
  setTimeout(() => {
    if (typeof openOnboard === 'function') openOnboard();
  }, 250);
  try { hap(15); } catch (e) {}
});

// trigger de abertura
//   primeira visita     → modo 'full' (3 telas + onboarding)
//   visitas seguintes   → modo 'breathe' (só respira com saudação + nome)
try {
  const seen = localStorage.getItem('circa_welcome_seen');
  setTimeout(() => openWelcome({ mode: seen ? 'breathe' : 'full' }), 400);
} catch (e) {
  setTimeout(() => openWelcome({ mode: 'full' }), 400);
}

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
  treinoIntensidade = null;
  document.querySelectorAll('#sheet-log-treino .sensacao').forEach((s) => s.classList.remove('is-on'));
  document.querySelectorAll('#log-t-intensidade .log-dot').forEach((x) => x.classList.remove('is-active'));
  const notaEl = document.getElementById('log-t-nota');
  if (notaEl) notaEl.value = '';

  // auto-captura horário · início = 1h atrás, fim = agora, só sugestão
  const now = new Date();
  const past = new Date(now.getTime() - 60 * 60 * 1000);
  const fmt = (d) => String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  const inicio = document.getElementById('log-t-inicio');
  const fim = document.getElementById('log-t-fim');
  if (inicio) inicio.value = fmt(past);
  if (fim)    fim.value    = fmt(now);

  openSheet('sheet-log-treino');
}

let treinoIntensidade = null;
const INTENSIDADE_HINTS = [
  '',
  'leve · mal subiu o pulso',
  'moderado · conseguia conversar',
  'forte · fala picada',
  'muito forte · falar travou',
  'máximo · tudo no limite',
];
document.querySelectorAll('#log-t-intensidade .log-dot').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#log-t-intensidade .log-dot').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active');
    treinoIntensidade = parseInt(b.dataset.v, 10);
    const hint = document.getElementById('log-t-intensidade-hint');
    if (hint) hint.textContent = INTENSIDADE_HINTS[treinoIntensidade] || '';
    try { hap(6); } catch (e) {}
  });
});

// botão "pular, só marcar feito"
const logPular = document.getElementById('log-t-pular');
if (logPular) logPular.addEventListener('click', () => {
  try {
    const hist = JSON.parse(localStorage.getItem('circa_workout_log') || '[]');
    hist.push({
      esporte: esporteSel || 'musculacao',
      sensacao: null,
      intensidade: null,
      data: new Date().toISOString(),
      skipped: true,
    });
    localStorage.setItem('circa_workout_log', JSON.stringify(hist));
  } catch (e) {}
  closeSheet();
  setTimeout(() => {
    const t = document.getElementById('log-ok-title');
    const s = document.getElementById('log-ok-sub');
    if (t) t.textContent = 'marcado como feito.';
    if (s) s.textContent = 'sem detalhes, vale o compromisso';
    openSheet('sheet-log-ok');
  }, 220);
  try { hap(10); } catch (e) {}
});

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
  // captura início/fim + calcula duração
  const inicioEl = document.getElementById('log-t-inicio');
  const fimEl = document.getElementById('log-t-fim');
  let durMin = null;
  if (inicioEl && fimEl && inicioEl.value && fimEl.value) {
    const [ih, im] = inicioEl.value.split(':').map(Number);
    const [fh, fm] = fimEl.value.split(':').map(Number);
    let iMin = ih * 60 + im;
    let fMin = fh * 60 + fm;
    if (fMin < iMin) fMin += 24 * 60; // atravessou meia-noite
    durMin = fMin - iMin;
  }
  const dados = {
    esporte: esporteSel,
    sensacao: sensSel,
    intensidade: treinoIntensidade,
    inicio: inicioEl ? inicioEl.value : null,
    fim: fimEl ? fimEl.value : null,
    duracaoMin: durMin,
    data: new Date().toISOString(),
  };
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
// HOME · deck de logs swipeable
// 5 cards: humor · sono · treino · água · refeição
// Swipe esquerda, próximo, swipe direita, anterior.
// ═════════════════════════════════════════
function buildActionCards() {
  const name = USER_NAME || 'você';
  return [
    {
      key: 'humor',
      eye: 'agora',
      title: `Como tá agora, ${name}?`,
      body: 'um check-in rápido. sem drama, só honesto.',
      meta: '',
      iconSvg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      ctaPrimary: { label: 'check-in', action: 'mood' },
      ctaGhost: null,
    },
    {
      key: 'sono',
      eye: 'agora',
      title: `Como você dormiu, ${name}?`,
      body: 'conta em 10 segundos. o Circa cruza com teu treino e tua cabeça.',
      meta: '',
      iconSvg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      ctaPrimary: { label: 'registrar sono', action: 'sleep' },
      ctaGhost: null,
    },
    {
      key: 'treino',
      eye: 'agora',
      title: 'Treinou? Conta aí.',
      body: 'o que tu fez hoje, ou vai fazer, pro teu corpo?',
      meta: '',
      iconSvg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="6"/><path d="M5 3v9M19 3v9"/></svg>',
      ctaPrimary: { label: 'registrar treino', action: 'workout' },
      ctaGhost: null,
    },
    {
      key: 'agua',
      eye: 'agora',
      title: 'Faltam 1L de água.',
      body: 'teu corpo ainda tá pedindo. dá tempo de recuperar a meta.',
      meta: '',
      iconSvg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5s6 7 6 11.5a6 6 0 0 1-12 0c0-4.5 6-11.5 6-11.5z"/></svg>',
      ctaPrimary: { label: '+ 500 ml', action: 'water500' },
      ctaGhost:   { label: '+ 200 ml', action: 'water200' },
    },
    {
      key: 'refeicao',
      eye: 'próxima refeição',
      title: 'Almoça agora.',
      body: 'frango grelhado, arroz, legumes. <strong>~650 kcal</strong>.',
      meta: 'você treinou hoje. faltam 400 kcal pra fechar o dia.',
      iconSvg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v7a4 4 0 0 0 4 4h0v7M7 3v7M15 3c-1 2-2 4-2 7 0 2 1 3 2 3v8"/></svg>',
      ctaPrimary: { label: 'comi', action: 'ateMeal' },
      ctaGhost:   { label: 'troca', action: 'swapMeal' },
    },
  ];
}

// índice inicial por hora do dia (contextual)
function pickInitialCardIndex() {
  const h = new Date().getHours();
  // manhã cedo, sono; manhã, água; almoço, refeição; tarde, água; fim de tarde, treino; noite, humor; madrugada, sono
  if (h >= 5  && h < 10) return 1; // sono
  if (h >= 10 && h < 12) return 3; // agua
  if (h >= 12 && h < 14) return 4; // refeicao
  if (h >= 14 && h < 17) return 3; // agua
  if (h >= 17 && h < 19) return 2; // treino
  if (h >= 19 && h < 22) return 0; // humor
  return 1; // madrugada, sono
}

let ACTION_CARDS = [];
let ACTION_INDEX = 0;

function renderActionDeck() {
  const track = document.getElementById('action-track');
  const dots  = document.getElementById('action-dots');
  if (!track || !dots) return;

  ACTION_CARDS = buildActionCards();
  ACTION_INDEX = pickInitialCardIndex();

  // monta cards
  track.innerHTML = '';
  ACTION_CARDS.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card card--action';
    card.dataset.key = c.key;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `log de ${c.key}`);

    const head = document.createElement('div');
    head.className = 'action-head';
    head.innerHTML = `<span class="action-icon" aria-hidden="true">${c.iconSvg}</span><span class="eyebrow">${c.eye}</span>`;
    card.appendChild(head);

    const title = document.createElement('h2');
    title.className = 'card__title';
    title.textContent = c.title;
    card.appendChild(title);

    if (c.body) {
      const body = document.createElement('p');
      body.className = 'card__body';
      body.innerHTML = c.body;
      card.appendChild(body);
    }
    if (c.meta) {
      const meta = document.createElement('p');
      meta.className = 'card__meta';
      meta.textContent = c.meta;
      card.appendChild(meta);
    }

    const cta = document.createElement('div');
    cta.className = 'card__cta';
    if (c.ctaPrimary) {
      const b = document.createElement('button');
      b.className = 'btn btn--primary';
      b.textContent = c.ctaPrimary.label;
      b.addEventListener('click', () => runAction(c.ctaPrimary.action));
      cta.appendChild(b);
    }
    if (c.ctaGhost) {
      const b = document.createElement('button');
      b.className = 'btn btn--ghost';
      b.textContent = c.ctaGhost.label;
      b.addEventListener('click', () => runAction(c.ctaGhost.action));
      cta.appendChild(b);
    }
    card.appendChild(cta);
    track.appendChild(card);
  });

  // monta dots
  dots.innerHTML = '';
  ACTION_CARDS.forEach((c, i) => {
    const d = document.createElement('button');
    d.className = 'action-dot';
    d.setAttribute('aria-label', `ir pro card ${c.key}`);
    d.addEventListener('click', () => goToActionIndex(i));
    dots.appendChild(d);
  });

  applyActionIndex(false);
  setupActionSwipe();
}

function applyActionIndex(animate) {
  const track = document.getElementById('action-track');
  const dots  = document.getElementById('action-dots');
  if (!track || !dots) return;
  if (animate === false) track.classList.add('is-dragging');
  track.style.transform = `translateX(-${ACTION_INDEX * 100}%)`;
  if (animate === false) {
    // força reflow e remove a classe, pra próxima mudança ter transição
    void track.offsetWidth;
    track.classList.remove('is-dragging');
  }
  [...dots.children].forEach((d, i) => {
    d.classList.toggle('is-active', i === ACTION_INDEX);
  });
}

function goToActionIndex(i) {
  const n = ACTION_CARDS.length;
  if (!n) return;
  ACTION_INDEX = Math.max(0, Math.min(n - 1, i));
  applyActionIndex(true);
  hap(8);
}

// swipe horizontal no deck
let _actDragging = false;
let _actStartX = 0;
let _actStartY = 0;
let _actDx = 0;
let _actLocked = null; // 'x' | 'y' | null

function setupActionSwipe() {
  const deck = document.getElementById('action-deck');
  const track = document.getElementById('action-track');
  if (!deck || !track || deck.dataset.swipeBound === '1') return;
  deck.dataset.swipeBound = '1';

  deck.addEventListener('touchstart', (e) => {
    if (!e.touches[0]) return;
    _actDragging = true;
    _actStartX = e.touches[0].clientX;
    _actStartY = e.touches[0].clientY;
    _actDx = 0;
    _actLocked = null;
    track.classList.add('is-dragging');
  }, { passive: true });

  deck.addEventListener('touchmove', (e) => {
    if (!_actDragging || !e.touches[0]) return;
    const dx = e.touches[0].clientX - _actStartX;
    const dy = e.touches[0].clientY - _actStartY;
    if (_actLocked === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        _actLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
    }
    if (_actLocked !== 'x') return;
    _actDx = dx;
    const w = deck.clientWidth || 1;
    let pct = -ACTION_INDEX * 100 + (dx / w) * 100;
    // resistência nas bordas
    if (ACTION_INDEX === 0 && dx > 0) pct = -ACTION_INDEX * 100 + (dx / w) * 40;
    if (ACTION_INDEX === ACTION_CARDS.length - 1 && dx < 0) pct = -ACTION_INDEX * 100 + (dx / w) * 40;
    track.style.transform = `translateX(${pct}%)`;
  }, { passive: true });

  deck.addEventListener('touchend', () => {
    if (!_actDragging) return;
    _actDragging = false;
    track.classList.remove('is-dragging');
    const w = deck.clientWidth || 1;
    const threshold = Math.min(70, w * 0.18);
    if (_actLocked === 'x') {
      if (_actDx < -threshold && ACTION_INDEX < ACTION_CARDS.length - 1) {
        ACTION_INDEX++;
        hap(10);
      } else if (_actDx > threshold && ACTION_INDEX > 0) {
        ACTION_INDEX--;
        hap(10);
      }
    }
    _actDx = 0;
    _actLocked = null;
    applyActionIndex(true);
  }, { passive: true });

  deck.addEventListener('touchcancel', () => {
    _actDragging = false;
    _actLocked = null;
    _actDx = 0;
    track.classList.remove('is-dragging');
    applyActionIndex(true);
  }, { passive: true });

  // ═════ DESKTOP · drag com mouse ═════
  const onMouseDown = (e) => {
    // ignora clique em botão, deixa o click normal funcionar
    if (e.target.closest('button')) return;
    _actDragging = true;
    _actStartX = e.clientX;
    _actStartY = e.clientY;
    _actDx = 0;
    _actLocked = null;
    track.classList.add('is-dragging');
    deck.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!_actDragging) return;
    const dx = e.clientX - _actStartX;
    const dy = e.clientY - _actStartY;
    if (_actLocked === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        _actLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
    }
    if (_actLocked !== 'x') return;
    _actDx = dx;
    const w = deck.clientWidth || 1;
    let pct = -ACTION_INDEX * 100 + (dx / w) * 100;
    if (ACTION_INDEX === 0 && dx > 0) pct = -ACTION_INDEX * 100 + (dx / w) * 40;
    if (ACTION_INDEX === ACTION_CARDS.length - 1 && dx < 0) pct = -ACTION_INDEX * 100 + (dx / w) * 40;
    track.style.transform = `translateX(${pct}%)`;
  };

  const onMouseUp = () => {
    if (!_actDragging) return;
    _actDragging = false;
    track.classList.remove('is-dragging');
    deck.style.cursor = '';
    const w = deck.clientWidth || 1;
    const threshold = Math.min(70, w * 0.18);
    if (_actLocked === 'x') {
      if (_actDx < -threshold && ACTION_INDEX < ACTION_CARDS.length - 1) {
        ACTION_INDEX++;
      } else if (_actDx > threshold && ACTION_INDEX > 0) {
        ACTION_INDEX--;
      }
    }
    _actDx = 0;
    _actLocked = null;
    applyActionIndex(true);
  };

  deck.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // cursor indicativo de drag
  deck.style.cursor = 'grab';

  // setas do teclado, bonus
  deck.setAttribute('tabindex', '0');
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'  && ACTION_INDEX > 0) { goToActionIndex(ACTION_INDEX - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight' && ACTION_INDEX < ACTION_CARDS.length - 1) { goToActionIndex(ACTION_INDEX + 1); e.preventDefault(); }
  });
}

function runAction(kind) {
  hap(10);
  if (kind === 'mood')     goTo('mood');
  if (kind === 'sleep')    goTo('mood');
  if (kind === 'workout')  openEsportePicker();
  if (kind === 'water200') { const m = document.querySelector('[data-add="200"]'); if (m) m.click(); }
  if (kind === 'water500') { const m = document.querySelector('[data-add="500"]'); if (m) m.click(); }
  if (kind === 'ateMeal')  {
    // persiste registro de refeição com data · alimenta histórico no log + comparações semanais
    try {
      const arr = JSON.parse(localStorage.getItem('circa_log_refeicao') || '[]');
      const now = new Date();
      const h = now.getHours();
      let tipo = 'lanche';
      if (h >= 5 && h < 11) tipo = 'café';
      else if (h >= 11 && h < 15) tipo = 'almoço';
      else if (h >= 15 && h < 18) tipo = 'lanche';
      else if (h >= 18 && h < 23) tipo = 'jantar';
      const card = ACTION_CARDS[ACTION_INDEX] || {};
      const desc = (card.body || '').replace(/<[^>]+>/g, '').trim() || 'refeição';
      arr.push({ ts: now.toISOString(), tipo, desc });
      // limita o array a 90 dias pra não inchar o localStorage
      const ms90 = 90 * 86400000;
      const cutoff = Date.now() - ms90;
      const trimmed = arr.filter((r) => new Date(r.ts).getTime() >= cutoff);
      localStorage.setItem('circa_log_refeicao', JSON.stringify(trimmed));
    } catch (e) {}
    const track = document.getElementById('action-track');
    const active = track && track.children[ACTION_INDEX];
    if (active) active.style.opacity = '0.55';
  }
  if (kind === 'swapMeal') { alert('troca de refeição, vem em breve'); }
}

// mantém compat, pickDailyAction e renderHomeAction ainda existem pra não quebrar chamadas antigas
function pickDailyAction() {
  const i = pickInitialCardIndex();
  const cards = buildActionCards();
  return cards[i] || cards[0];
}
function renderHomeAction() { renderActionDeck(); }

// renderiza ao carregar · também chamado quando o nome muda
renderActionDeck();
const _refreshOrig = refreshNameDependents;
refreshNameDependents = function() { _refreshOrig(); renderActionDeck(); };

// ═════════════════════════════════════════
// HOME · gesto swipe-up + handle abre o drawer
// ═════════════════════════════════════════
const homePull = document.getElementById('home-pull');
if (homePull) homePull.addEventListener('click', () => { openQd(); hap(10); });

// swipe up na home pra abrir o drawer · ESTREITADO pra não interferir no scroll-to-top
// só ativa nos últimos 12% da tela (zona muito perto do bottom edge)
// e exige um movimento mais consistente
let suStartY = 0, suStartX = 0, suStartT = 0, suTrack = false;
window.addEventListener('touchstart', (e) => {
  if (!e.touches[0]) return;
  const homeActive = document.querySelector('.screen--home.is-active');
  if (!homeActive) return;
  const qdEl = document.getElementById('qd');
  const drawerOpen = qdEl && qdEl.classList.contains('is-open');
  const anySheetOpen = document.querySelector('.sheet.is-open');
  const jornadaOpen = document.querySelector('.jornada.is-open');
  if (drawerOpen || anySheetOpen || jornadaOpen) return;
  // só ativa nos últimos 12% (antes era 35%) · evita conflito com scroll normal
  const y = e.touches[0].clientY;
  if (y < window.innerHeight * 0.88) return;
  // só pega 1 dedo
  if (e.touches.length > 1) return;
  suStartY = y;
  suStartX = e.touches[0].clientX;
  suStartT = Date.now();
  suTrack = true;
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!suTrack || !e.touches[0]) return;
  const dy = e.touches[0].clientY - suStartY;
  const dx = Math.abs(e.touches[0].clientX - suStartX);
  const dt = Date.now() - suStartT;
  // exige swipe mais decisivo: 80px em até 350ms (gesto deliberado, não scroll)
  if (dy < -80 && dx < 30 && dt < 350) {
    suTrack = false;
    openQd();
    hap(12);
  }
  // se passou de 400ms sem atingir, desiste · libera o scroll
  if (dt > 400) suTrack = false;
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

// ═════════════════════════════════════════
// DETECÇÃO DE SINAIS · palavras-chave por nível de risco
// Para proteger o usuário sem moralizar.
// ═════════════════════════════════════════
const SINAIS = {
  risco_elevado: [
    'não quero mais estar aqui', 'quero sumir', 'seria melhor se eu sumisse',
    'não quero mais viver', 'quero morrer', 'pensei em me machucar',
    'vou me machucar', 'me machucar', 'suicídio', 'me matar',
    'acabar com tudo', 'não tenho mais saída', 'não tem mais jeito pra mim',
  ],
  risco_moderado: [
    'não vejo sentido', 'tô no limite', 'não aguento mais',
    'parece que nada vai mudar', 'me sinto inútil', 'tô desaparecendo',
    'ninguém perceberia', 'não importo pra ninguém', 'tô me perdendo',
    'me sinto um fardo', 'tô quebrando', 'não consigo mais',
    'tô em colapso', 'me sinto vazio', 'não sinto mais nada',
  ],
  sofrimento_emocional: [
    'não sou bom o suficiente', 'não sou bom assim', 'não presto',
    'as pessoas não gostam de mim', 'ninguém me quer', 'ninguém me entende',
    'me sinto sozinho', 'tô me sentindo um peso', 'tô esgotado',
    'tô destruído', 'dia horrível', 'dia difícil', 'tô mal',
    'tô sofrendo', 'tô chorando', 'não tô conseguindo',
    'tô travado', 'me sinto perdido', 'não sei mais o que fazer',
    'tô ansioso demais', 'tô com ansiedade', 'tô com medo',
    'tô com raiva', 'tô frustrado', 'tô me sentindo mal',
    'preciso desabafar', 'preciso falar', 'quero desabafar',
    'tô deprimido', 'me sinto deprimido', 'tô triste',
    'bullying', 'me xingaram', 'me humilharam', 'me zoaram',
  ],
  burnout: [
    'não aguento o trabalho', 'odeio meu trabalho', 'tô esgotado no trabalho',
    'trabalho tá me destruindo', 'síndrome de burnout', 'burnout',
    'não consigo mais trabalhar', 'tô exausto', 'estressado demais',
  ],
};

function detectarNivelRisco(texto) {
  const t = texto.toLowerCase();
  for (const s of SINAIS.risco_elevado)       if (t.includes(s)) return 'elevado';
  for (const s of SINAIS.risco_moderado)      if (t.includes(s)) return 'moderado';
  for (const s of SINAIS.burnout)             if (t.includes(s)) return 'burnout';
  for (const s of SINAIS.sofrimento_emocional) if (t.includes(s)) return 'emocional';
  return 'neutro';
}

function detectarSinalComportamental() {
  const c = userContext();
  // sinais derivados dos dados (não das palavras)
  if (c.score_hoje < 50) return 'score_baixo';
  // aqui entraria check de sono critico, isolamento, etc. quando tivermos dados reais
  return null;
}

// system prompt da Circa com protocolos por nível de risco
// (usado na API real quando virar Expo; mock atual roteia por keyword)
function buildCircaSystemPrompt(nivelRisco) {
  const c = userContext();
  const protocoloBase = `QUEM VOCÊ É, A CIRCA:
Você é a Circa, uma IA de saúde e bem-estar com personalidade humana, calorosa e direta.
Fala como uma amiga próxima que estudou medicina mas nunca perdeu o jeito humano.
Usa "você" sempre. Nunca usa jargão clínico. É direta e cuidadosa.
Jamais diagnostica. Jamais minimiza o que a pessoa sente.
Nunca diz "vai passar", "podia ser pior", "tenta ser mais positivo".
Respostas curtas, máximo 3 parágrafos. Uma pergunta por vez, no máximo.
Texto corrido. Sem bullets, sem markdown, sem emojis.

REGRA DE OURO, ABERTURA SEM AGENDA:
Você nunca abre a conversa com dados ou insights.
Você abre com presença pura: "estou aqui. quer conversar?"
Os dados entram depois, como resposta ao que a pessoa trouxe, nunca como pauta.`;

  const empatia = `COMO RESPONDER COM EMPATIA:
Primeiro, reconheça o que a pessoa está sentindo.
Segundo, valide. Diga que faz sentido sentir isso, que não é fraqueza.
Terceiro, só depois de acolher, pergunte ou sugira algo.
Nunca pule direto para soluções. Nunca ofereça menu de opções quando alguém está sofrendo.`;

  const contexto = `QUEM É ${c.nome.toUpperCase()}:
- Score hoje: ${c.score_hoje} (ontem ${c.score_ontem})
- Sono médio: ${c.sono_media} (meta ${c.sono_meta}), abaixo há semanas
- Hidratação hoje: ${c.agua_hoje} de ${c.agua_meta}
- Último esporte: ${c.ultimo_esporte || 'não registrado'}
- Suplementos: ${c.suplementos.length ? c.suplementos.join(', ') : 'nenhum'}
- Exames em atenção: homocisteína ${c.homocisteina}, ferritina ${c.ferritina}
- Insight recente: ${c.insight_atual}
- Padrão de queda: ${c.padrao_queda}`;

  let protocoloRisco = '';
  if (nivelRisco === 'elevado') {
    protocoloRisco = `PROTOCOLO, RISCO ELEVADO:
A pessoa expressou algo que pode indicar risco sério.
Nunca ignore, mude de assunto ou trate como metáfora.
Pergunte diretamente com cuidado: "você está pensando em se machucar?"
Seja calmo, presente, humano. Inclua o CVV 188 no fim.`;
  } else if (nivelRisco === 'moderado') {
    protocoloRisco = `PROTOCOLO, SOFRIMENTO MODERADO:
Acolha completamente primeiro, valide o peso.
Não ofereça soluções ainda. Só presença.
Depois de 1-2 trocas, pergunte se tem com quem conversar.
Sugira profissional como cuidado, não descarte.`;
  } else if (nivelRisco === 'burnout') {
    protocoloRisco = `PROTOCOLO, BURNOUT:
Acolha sem minimizar. Valide que corpo e mente têm limite.
Use os dados com cuidado. Explore o que pesa mais.
Se persistir, sugira avaliação médica.`;
  } else if (nivelRisco === 'emocional') {
    protocoloRisco = `PROTOCOLO, SOFRIMENTO EMOCIONAL:
PRIMEIRA resposta: só acolhimento. Nenhum dado, nenhuma solução.
Valide. Diga que faz sentido. Ouça.
Nunca: "quer que a gente foque em sono, treino ou humor?"`;
  }

  return `${protocoloBase}\n\n${empatia}\n\n${contexto}\n\n${protocoloRisco}`;
}

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

// abertura com PRESENÇA PURA, sem agenda, sem dados.
// Os dados entram depois, só quando fizer sentido.
function aberturaPersonalizada() {
  const c = userContext();
  const aberturas = [
    { texto: `estou aqui, ${c.nome}. quer conversar?`, ctx: null },
    { texto: `oi, ${c.nome}. como você tá?`,           ctx: null },
    { texto: `${c.nome}, pode falar. estou ouvindo.`,   ctx: null },
  ];
  return aberturas[Math.floor(Math.random() * aberturas.length)];
}

// opções iniciais focadas em acolhimento, não em tarefa
const CHAT_OPCOES = [
  'tô bem, só queria registrar algo',
  'preciso desabafar',
  'tive um dia difícil',
  'quero entender meus dados',
  'tô me sentindo mal',
];

// ═════════════════════════════════════════
// CIRCA ORBE · canvas animado orgânico
// ═════════════════════════════════════════
const ORBE_ESTADOS = {
  idle:        { label: 'presente',       speed: 0.4,  amplitude: 0.018, complexity: 3, colorSpeed: 0.003, opacity: 0.85 },
  ouvindo:     { label: 'ouvindo…',       speed: 0.9,  amplitude: 0.032, complexity: 5, colorSpeed: 0.008, opacity: 0.92 },
  pensando:    { label: 'pensando…',      speed: 1.6,  amplitude: 0.055, complexity: 8, colorSpeed: 0.018, opacity: 0.96 },
  respondendo: { label: 'falando…',       speed: 2.2,  amplitude: 0.042, complexity: 6, colorSpeed: 0.012, opacity: 1.0  },
  acolhendo:   { label: 'aqui contigo…',  speed: 0.6,  amplitude: 0.028, complexity: 4, colorSpeed: 0.005, opacity: 0.94 },
};

const ORBE_CORES = [
  [201, 168,  76], // champagne
  [232, 168, 124], // salmon
  [237, 208, 104], // light champagne
  [245, 232, 192], // pale champagne
  [138,  94,  24], // dark champagne
];

let orbeEstado = 'idle';
let orbeT = 0;
let orbeInputPulse = 0;
let orbeRaf = null;

function lerpOrbe(a, b, t) { return a + (b - a) * t; }

function drawOrbeOn(canvas, isMain) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cfg = ORBE_ESTADOS[orbeEstado];
  const cx = size / 2, cy = size / 2;
  const baseR = size * 0.36;

  ctx.clearRect(0, 0, size, size);

  // glow externo
  const glowR = baseR * (1.35 + Math.sin(orbeT * cfg.speed * 0.5) * 0.04);
  const glow = ctx.createRadialGradient(cx, cy, baseR * 0.6, cx, cy, glowR);
  glow.addColorStop(0, `rgba(201,168,76,${isMain ? 0.12 : 0.08})`);
  glow.addColorStop(1, `rgba(201,168,76,0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // forma orgânica
  const pts = isMain ? 120 : 60;
  const amp = cfg.amplitude + orbeInputPulse * 0.02;

  function buildShape() {
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const angle = (i / pts) * Math.PI * 2;
      let r = baseR;
      for (let h = 1; h <= cfg.complexity; h++) {
        const freq = h * 0.7;
        const phase = orbeT * cfg.speed * (h % 2 === 0 ? 1 : -0.7) + h * 1.3;
        r += baseR * amp * Math.sin(angle * freq + phase) / h;
      }
      if (orbeInputPulse > 0) r += baseR * orbeInputPulse * 0.03 * Math.sin(angle * 4 + orbeT * 3);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // gradiente interno girando
  buildShape();
  const gradAngle = orbeT * cfg.colorSpeed * Math.PI * 2;
  const gx1 = cx + Math.cos(gradAngle) * baseR * 0.6;
  const gy1 = cy + Math.sin(gradAngle) * baseR * 0.6;
  const gx2 = cx + Math.cos(gradAngle + Math.PI) * baseR * 0.6;
  const gy2 = cy + Math.sin(gradAngle + Math.PI) * baseR * 0.6;
  const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);

  const ci  = Math.floor((orbeT * cfg.colorSpeed * 0.3) % ORBE_CORES.length);
  const ci2 = (ci + 1) % ORBE_CORES.length;
  const ci3 = (ci + 2) % ORBE_CORES.length;
  const blend = (orbeT * cfg.colorSpeed * 0.3) % 1;

  const c1 = ORBE_CORES[ci].map((v, i) => Math.round(lerpOrbe(v, ORBE_CORES[ci2][i], blend)));
  const c2 = ORBE_CORES[ci2].map((v, i) => Math.round(lerpOrbe(v, ORBE_CORES[ci3][i], blend)));
  const c3 = ORBE_CORES[ci3];

  grad.addColorStop(0,    `rgba(${c1[0]},${c1[1]},${c1[2]},${cfg.opacity})`);
  grad.addColorStop(0.45, `rgba(${c2[0]},${c2[1]},${c2[2]},${cfg.opacity * 0.9})`);
  grad.addColorStop(1,    `rgba(${c3[0]},${c3[1]},${c3[2]},${cfg.opacity * 0.7})`);

  ctx.fillStyle = grad;
  ctx.fill();

  // brilho interno
  buildShape();
  const shine = ctx.createRadialGradient(
    cx - baseR * 0.25, cy - baseR * 0.3, 0,
    cx, cy, baseR * 0.9
  );
  const shineOpacity = 0.22 + Math.sin(orbeT * cfg.speed * 0.3) * 0.08;
  shine.addColorStop(0,   `rgba(255,248,220,${shineOpacity})`);
  shine.addColorStop(0.4, `rgba(237,208,104,${shineOpacity * 0.3})`);
  shine.addColorStop(1,   `rgba(255,248,220,0)`);
  ctx.fillStyle = shine;
  ctx.fill();

  // partícula girando (só no grande)
  if (isMain) {
    const pAngle = orbeT * cfg.speed * 0.4;
    const pR = baseR * (0.85 + Math.sin(orbeT * cfg.speed * 0.6) * 0.08);
    const px = cx + pR * Math.cos(pAngle);
    const py = cy + pR * Math.sin(pAngle);
    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, baseR * 0.12);
    pGrad.addColorStop(0, 'rgba(255,248,220,0.7)');
    pGrad.addColorStop(1, 'rgba(255,248,220,0)');
    ctx.beginPath();
    ctx.arc(px, py, baseR * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = pGrad;
    ctx.fill();
  }
}

function orbeLoop() {
  orbeT += 0.016;
  if (orbeInputPulse > 0) orbeInputPulse *= 0.88;

  const main = document.getElementById('orbe-main');
  const mini = document.getElementById('orbe-mini');
  // só redesenha main quando o chat tá aberto (economia)
  const chatIsOpen = document.getElementById('chat')?.classList.contains('is-open');
  if (chatIsOpen && main) drawOrbeOn(main, true);
  if (mini) drawOrbeOn(mini, false);

  orbeRaf = requestAnimationFrame(orbeLoop);
}

function setOrbeEstado(estado) {
  orbeEstado = estado;
  const label = document.getElementById('orbe-estado');
  if (label) {
    label.style.opacity = '0';
    setTimeout(() => {
      label.textContent = ORBE_ESTADOS[estado].label;
      label.style.opacity = '1';
    }, 200);
  }
}

// inicia o loop quando DOM tá pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', orbeLoop);
} else {
  orbeLoop();
}

// AudioContext global, criado uma vez no primeiro gesto do usuário
let _circaAudioCtx = null;

// toca o chime completo (3 notas · reverb) a partir de um contexto já ACORDADO
function _playCircaChime(ctx) {
  try {
    const now = ctx.currentTime;

    // nota 1 · base quente (Mi3)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(329.63, now);
    osc1.frequency.exponentialRampToValueAtTime(340, now + 0.6);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + 0.9);

    // nota 2 · harmônico ouro (Si3)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(493.88, now + 0.08);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.16);
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
    gain3.gain.linearRampToValueAtTime(0.14, now + 0.26);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc3.connect(gain3); gain3.connect(ctx.destination);
    osc3.start(now + 0.18); osc3.stop(now + 0.75);

    // reverb leve (convolver com decay expoential)
    const reverb = ctx.createConvolver();
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.22;
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
  } catch (e) { console.warn('circa chime erro:', e); }
}

// som de assinatura da Circa · aguarda resume antes de agendar as notas
function tocarSomCirca() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  // cria apenas na primeira chamada (que está dentro de um user gesture)
  if (!_circaAudioCtx) {
    try { _circaAudioCtx = new AC(); } catch (e) { return; }
  }

  const ctx = _circaAudioCtx;

  // se o ctx nasceu suspenso (iOS/Chrome autoplay policy), aguarda
  // o resume() resolver ANTES de agendar os osciladores
  if (ctx.state === 'suspended') {
    ctx.resume()
      .then(() => _playCircaChime(ctx))
      .catch((e) => console.warn('circa resume falhou:', e));
  } else {
    _playCircaChime(ctx);
  }
}

function openChat() {
  if (!chatEl) return;
  tocarSomCirca();
  chatEl.classList.add('is-open');
  chatEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  chatOpened = true;

  setOrbeEstado('ouvindo');

  if (chatHistory.length === 0) {
    setTimeout(() => {
      const a = aberturaPersonalizada();
      addCircaMsg(a.texto, a.ctx, true);
      setOrbeEstado('idle');
    }, 600);
  } else {
    setTimeout(() => setOrbeEstado('idle'), 1200);
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
  setOrbeEstado('idle');
  hap(6);
}

if (circaFab)  circaFab.addEventListener('click', openChat);
if (chatClose) chatClose.addEventListener('click', closeChat);

// rendering helpers
function addCircaMsg(texto, ctx, withOpcoes, recurso) {
  const div = document.createElement('div');
  div.className = 'msg msg--circa';
  div.innerHTML = `
    <span class="msg__label">circa</span>
    <div class="msg__bubble">
      <p class="msg__text">${texto}</p>
      ${ctx ? `<p class="msg__ctx">${ctx}</p>` : ''}
      ${recurso ? `
        <div class="msg__recurso">
          <span class="msg__recurso-label">apoio disponível</span>
          <p class="msg__recurso-text">${recurso}</p>
        </div>` : ''}
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

// ───── motor mock de respostas · keyword router com risco + contexto ─────
function mockCircaResponse(userText, nivelRisco) {
  const c = userContext();
  const t = userText.toLowerCase();

  // RISCO ELEVADO · acolher + perguntar diretamente + CVV
  if (nivelRisco === 'elevado') {
    const opts = [
      `isso que você disse me tocou, ${c.nome}. quero entender melhor. você está bem agora? tem alguém por perto?`,
      `obrigada por confiar em mim com isso. você está pensando em se machucar agora? eu tô aqui, mas esse momento merece uma voz humana de verdade também.`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // RISCO MODERADO · só acolher, sem soluções, sem perguntas funcionais
  if (nivelRisco === 'moderado') {
    const opts = [
      `tô aqui, ${c.nome}. o que você tá descrevendo é pesado e faz sentido estar pesado. não precisa ter resposta agora.`,
      `fico com você nesse momento. respira. o que você tá sentindo é real e é muito. não precisa explicar.`,
      `${c.nome}, eu ouvi. isso que você tá carregando não é pouca coisa. você tem com quem conversar sobre isso na sua vida?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // BURNOUT · validar limites + explorar sem presumir
  if (nivelRisco === 'burnout') {
    return `burnout é real, ${c.nome}. corpo e mente têm limite, e o teu tá avisando. o que tá pesando mais no trabalho agora, as pessoas, o volume, a falta de sentido?`;
  }

  // SOFRIMENTO EMOCIONAL · primeira resposta é SÓ acolhimento
  if (nivelRisco === 'emocional') {
    const opts = [
      `tô ouvindo, ${c.nome}. o que você tá sentindo faz sentido, não é fraqueza. conta mais se quiser, sem pressa.`,
      `que bom que você falou. isso que tá passando tem peso. tô aqui.`,
      `obrigada por trazer isso. a gente não precisa ir pra lugar nenhum, só ficar aqui um pouco. o que aconteceu?`,
    ];
    return opts[Math.floor(Math.random() * opts.length)];
  }

  // NEUTRO · keyword router contextualizado (fluxo existente)

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
  if (t.match(/\b(treino|exerc|corri|correr|academ|muscul|yoga|serie|carga)\b/)) {
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
  const clean = texto.trim();
  addUserMsg(clean);
  showTyping();

  const nivel = detectarNivelRisco(clean);
  // acolher visualmente em sofrimento, pensar em casos neutros
  if (nivel === 'elevado' || nivel === 'moderado' || nivel === 'emocional' || nivel === 'burnout') {
    setOrbeEstado('acolhendo');
  } else {
    setOrbeEstado('pensando');
  }

  const delay = 900 + Math.random() * 1200;
  setTimeout(() => {
    hideTyping();
    setOrbeEstado('respondendo');

    // só em risco ELEVADO mostramos o card de CVV abaixo da resposta
    const recurso = nivel === 'elevado'
      ? `<strong>CVV, Centro de Valorização da Vida</strong><br/>ligue <strong>188</strong>, 24h, gratuito · cvv.org.br`
      : null;

    const resp = mockCircaResponse(clean, nivel);
    addCircaMsg(resp, null, false, recurso);
    setTimeout(() => setOrbeEstado('idle'), 1800);
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

    // pulso visual + estado "ouvindo" enquanto digita
    orbeInputPulse = Math.min(orbeInputPulse + 0.3, 1);
    if (orbeEstado === 'idle') setOrbeEstado('ouvindo');
    clearTimeout(window._orbeTypingTimer);
    window._orbeTypingTimer = setTimeout(() => {
      if (orbeEstado === 'ouvindo') setOrbeEstado('idle');
    }, 1200);
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
  // mantém o fundo vivo rodando durante todo o onboarding
  if (typeof startWlcFundo === 'function') startWlcFundo();
}

function closeOnboard() {
  onboard.classList.remove('is-open');
  onboard.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // só desliga o fundo se welcome também não estiver aberto
  if (typeof maybeStopWlcFundo === 'function') maybeStopWlcFundo();
  // ao fechar onboarding, abre a jornada pra entrar direto na experiência
  setTimeout(() => {
    if (typeof window.openJornada === 'function') window.openJornada();
  }, 320);
}

function renderObStep() {
  const flow = obFlowFiltered();
  const currentIdx = flow.indexOf(obStep);
  obSlides.forEach((s) => {
    const step = parseInt(s.dataset.step, 10);
    const stepIdx = flow.indexOf(step);
    s.classList.remove('is-active', 'is-above', 'is-below');
    if (stepIdx === currentIdx)             s.classList.add('is-active');
    else if (stepIdx >= 0 && stepIdx < currentIdx) s.classList.add('is-above');
    // demais (> currentIdx ou fora do flow) ficam em translateY(100%) pelo default
  });
  // progress bar baseada no flow atual
  const total = flow.length;
  const pos = currentIdx >= 0 ? currentIdx : 0;
  if (obProgressFill) obProgressFill.style.width = (pos / Math.max(1, total - 1) * 100).toFixed(1) + '%';
  if (obProgressLbl)  obProgressLbl.textContent = (pos + 1) + ' / ' + total;
  obBackBtn.disabled = pos === 0;

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

// fluxo explícito pra permitir branching por gênero
// insere 31 (gênero), 32 (homem), 33 (mulher) entre step 1 e step 2
// SUBSTITUI o quiz antigo (12-20) pelo flow do temperamento (41-47):
// 5 cenários (41-45) + processando (46) + revelação (47)
// step 51 · nível de atividade · pílula dourada com 3 figs · após gênero, antes do temperamento
const OB_FLOW = [1, 31, 32, 33, 51, 41, 42, 43, 44, 45, 46, 47, 21, 22, 23, 24, 25, 26];

function obCurrentGender() {
  try { return localStorage.getItem('circa_gender') || null; } catch (e) { return null; }
}

function obFlowFiltered() {
  const g = obCurrentGender();
  return OB_FLOW.filter((s) => {
    if (s === 32 && g !== 'man')   return false;
    if (s === 33 && g !== 'woman') return false;
    return true;
  });
}

function obFlowIndex(step) {
  const f = obFlowFiltered();
  const i = f.indexOf(step);
  return i >= 0 ? i : 0;
}

function nextStep() {
  const flow = obFlowFiltered();
  const idx = flow.indexOf(obStep);
  if (idx >= 0 && idx < flow.length - 1) {
    const newStep = flow[idx + 1];
    // fisio quiz (steps 5-11) removido do onboarding · trilha não é mais necessária
    obStep = newStep;
    renderObStep();
    hap(6);
  }
}
function prevStep() {
  const flow = obFlowFiltered();
  const idx = flow.indexOf(obStep);
  if (idx > 0) {
    obStep = flow[idx - 1];
    renderObStep();
    hap(4);
  }
}

obBackBtn && obBackBtn.addEventListener('click', prevStep);
obCloseBtn && obCloseBtn.addEventListener('click', closeOnboard);

// seleção de gênero · step 31
(function () {
  const slide = document.querySelector('.ob-slide[data-step="31"]');
  if (!slide) return;
  const cards = slide.querySelectorAll('.ob-gender__card');
  const next = slide.querySelector('.ob-next');

  // pré-seleciona se já salvou antes
  try {
    const g = localStorage.getItem('circa_gender');
    if (g) {
      cards.forEach((c) => c.classList.toggle('is-sel', c.dataset.gender === g));
      if (next) next.disabled = false;
    }
  } catch (e) {}

  cards.forEach((c) => {
    c.addEventListener('click', () => {
      cards.forEach((x) => x.classList.toggle('is-sel', x === c));
      try { localStorage.setItem('circa_gender', c.dataset.gender); } catch (e) {}
      if (next) next.disabled = false;
      try { hap(8); } catch (e) {}
    });
  });
})();

// cards genéricos dos steps 32 e 33 (perguntas de perfil por gênero)
// usa is-on (consistente com step 1, step 23 e .ob-swiper__card.is-on no CSS)
document.querySelectorAll('.ob-slide[data-step="32"] .ob-card, .ob-slide[data-step="33"] .ob-card').forEach((card) => {
  card.addEventListener('click', () => {
    const slide = card.closest('.ob-slide');
    slide.querySelectorAll('.ob-card').forEach((c) => c.classList.remove('is-on'));
    card.classList.add('is-on');
    const next = slide.querySelector('.ob-next');
    if (next) next.disabled = false;
    // salva perfil específico
    try {
      const step = slide.dataset.step;
      const key = step === '32' ? 'circa_perfil_man' : 'circa_perfil_woman';
      localStorage.setItem(key, card.dataset.val);
    } catch (e) {}
    try { hap(8); } catch (e) {}
  });
});

// ═══════════════════════════════════════════
// OB-SWIPER engine · dots dinâmicos + sync scroll + click-to-scroll
// detecta qualquer .ob-swiper na DOM (steps 32, 33, 23) e wira tudo
// ═══════════════════════════════════════════
(function () {
  const swipers = document.querySelectorAll('.ob-swiper');
  if (!swipers.length) return;

  swipers.forEach((swiper) => {
    const track = swiper.querySelector('.ob-swiper__track');
    const dotsWrap = swiper.querySelector('.ob-swiper__dots');
    if (!track || !dotsWrap) return;

    const cards = Array.from(track.querySelectorAll('.ob-swiper__card'));
    if (!cards.length) return;

    // gera dots conforme o nº de cards
    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'ob-swiper__dot' + (i === 0 ? ' is-on' : '');
      d.setAttribute('aria-label', 'opção ' + (i + 1));
      d.dataset.idx = String(i);
      d.addEventListener('click', () => scrollToCard(i));
      dotsWrap.appendChild(d);
    });

    function scrollToCard(idx) {
      const card = cards[idx];
      if (!card) return;
      const trackRect = track.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = cardRect.left - trackRect.left
                   - (trackRect.width / 2)
                   + (cardRect.width / 2)
                   + track.scrollLeft;
      track.scrollTo({ left: offset, behavior: 'smooth' });
    }

    function updateActiveDot() {
      // qual card está mais próximo do centro do track?
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closestIdx = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      });
      dotsWrap.querySelectorAll('.ob-swiper__dot').forEach((d, i) => {
        d.classList.toggle('is-on', i === closestIdx);
      });
    }

    // efeito wheel · cada card ganha rotateY + scale + translateZ + opacity em função da
    // distância do centro do track · cards laterais "viram a cara" pro centro como se a
    // pessoa estivesse girando uma roda virtual de cards
    function applyWheelTransforms() {
      const tRect = track.getBoundingClientRect();
      const tCenter = tRect.left + tRect.width / 2;
      const half = tRect.width / 2;
      cards.forEach((card) => {
        const cRect = card.getBoundingClientRect();
        const cCenter = cRect.left + cRect.width / 2;
        const offset = cCenter - tCenter;
        // ratio: 0 no centro, ±1 quando o card está a meia-largura do track de distância
        const ratio = offset / (half * 0.62);
        const clamped = Math.max(-1.6, Math.min(1.6, ratio));
        const absR = Math.abs(clamped);
        // scale: 1.0 no centro, 0.7 nas pontas
        const scale  = 1 - Math.min(0.30, absR * 0.22);
        // rotateY: 0 no centro, ±36° nas pontas (faces voltadas pro centro)
        const rotate = clamped * -34;
        // translateZ: cards laterais recuam no eixo Z (efeito de profundidade)
        const tz     = -absR * 90;
        // opacity: 1 no centro, ~0.4 nas pontas
        const op     = 1 - Math.min(0.55, absR * 0.4);
        card.style.setProperty('--wheel-scale',  scale.toFixed(3));
        card.style.setProperty('--wheel-rotate', rotate.toFixed(2) + 'deg');
        card.style.setProperty('--wheel-z',      tz.toFixed(1) + 'px');
        card.style.opacity = op.toFixed(3);
      });
    }

    // sync no scroll (rAF-throttled pra performance)
    let raf = null;
    track.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        updateActiveDot();
        applyWheelTransforms();
        raf = null;
      });
    });
    // aplica também no resize (largura do track muda)
    window.addEventListener('resize', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        applyWheelTransforms();
        raf = null;
      });
    });

    // primeira aplicação · garante o estado inicial
    requestAnimationFrame(applyWheelTransforms);

    // recalcula quando o slide do swiper fica visível (display:none → flex)
    // observa mudanças de visibilidade do .ob-slide pai
    const slide = swiper.closest('.ob-slide');
    if (slide && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.classList.contains('is-active')) {
            // garante dot 0 ativo + scroll no início + wheel transform recalculado
            track.scrollTo({ left: 0, behavior: 'auto' });
            requestAnimationFrame(() => {
              updateActiveDot();
              applyWheelTransforms();
            });
          }
        });
      }, { threshold: 0.5 });
      io.observe(slide);
    }
  });
})();

// generic "continuar" forward
document.querySelectorAll('.ob-next').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    nextStep();
  });
});

// step 1 · foco principal (single select) · 3 cards visuais com PNGs
document.querySelectorAll('.ob-slide[data-step="1"] .ob-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ob-slide[data-step="1"] .ob-card').forEach((c) => c.classList.remove('is-on'));
    card.classList.add('is-on');
    document.querySelector('.ob-slide[data-step="1"] .ob-next').disabled = false;
    try { localStorage.setItem('circa_foco', card.dataset.val || ''); } catch (e) {}
    hap(8);
  });
});

// step 51 · nível de atividade · pílula dourada · clicar em fig troca o ativo
(function () {
  const wrap = document.querySelector('.ob-slide[data-step="51"] .ativ-pill-wrap');
  if (!wrap) return;
  // restaura último valor (default 2 = moderado)
  let stored = 2;
  try { stored = parseInt(localStorage.getItem('circa_atividade') || '2', 10); } catch (e) {}
  if (![1,2,3].includes(stored)) stored = 2;
  setActiv(stored);

  function setActiv(lvl) {
    wrap.dataset.active = String(lvl);
    const pos = lvl === 1 ? '17%' : lvl === 3 ? '83%' : '50%';
    const thumb = wrap.querySelector('.ativ-thumb');
    const glow  = wrap.querySelector('.ativ-pill__glow');
    if (thumb) thumb.style.setProperty('--thumb-pos', pos);
    if (glow)  glow.style.setProperty('--glow-pos', pos);
    try { localStorage.setItem('circa_atividade', String(lvl)); } catch (e) {}
  }

  wrap.querySelectorAll('.ativ-fig').forEach((fig) => {
    fig.addEventListener('click', (e) => {
      e.preventDefault();
      const lvl = parseInt(fig.dataset.lvl, 10);
      if ([1,2,3].includes(lvl)) {
        setActiv(lvl);
        hap(6);
      }
    });
  });
})();

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

  // cria handles uma vez só e depois reaproveita · evita destruir listeners
  let handlesBuilt = false;
  function updateObShape() {
    const pts = OB_AREAS.map((a, i) => {
      const p = pointFor(i, a.value);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    obShape.setAttribute('points', pts);

    if (!handlesBuilt) {
      obHandles.innerHTML = OB_AREAS.map((a, i) => {
        const p = pointFor(i, a.value);
        return `
          <g data-i="${i}">
            <circle class="wheel__hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="22" data-i="${i}" fill="transparent" stroke="none"/>
            <circle class="wheel__handle" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="9" data-i="${i}"/>
            <text class="wheel__val" x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}">${a.value}</text>
          </g>
        `;
      }).join('');
      // liga drag uma vez · usa hit area invisível maior + o handle visível
      obHandles.querySelectorAll('.wheel__hit, .wheel__handle').forEach(bindObDrag);
      handlesBuilt = true;
    } else {
      // só atualiza posições · mantém listeners intactos
      OB_AREAS.forEach((a, i) => {
        const p = pointFor(i, a.value);
        const g = obHandles.querySelector(`g[data-i="${i}"]`);
        if (!g) return;
        g.querySelectorAll('.wheel__hit, .wheel__handle').forEach((c) => {
          c.setAttribute('cx', p.x.toFixed(1));
          c.setAttribute('cy', p.y.toFixed(1));
        });
        const text = g.querySelector('.wheel__val');
        if (text) {
          text.setAttribute('x', p.x.toFixed(1));
          text.setAttribute('y', (p.y + 3).toFixed(1));
          text.textContent = a.value;
        }
      });
    }
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

// ═════════════════════════════════════════════════════════
// JORNADA · 9 seções, scroll ancorado, pausa, roda, fundo vivo
// ═════════════════════════════════════════════════════════
(function () {
  const SCORE_J = 78;
  const MSGS_PAUSA = [
    'você está carregando mais do que o normal esta semana. o sono sabe disso antes de você.',
    'corpo em 82, mente em 71. o que está pesando?',
    '78 pontos hoje. mas o número não conta o que você sentiu.',
    'espírito em alta. corpo pedindo atenção. a Circa viu os dois.',
    'você voltou. quem volta está evoluindo, mesmo quando parece que não.',
  ];

  // paleta do fundo vivo · adaptada pra champanhe
  function getPaletaScore(score) {
    if (score >= 80) return { c1:[212,184,150,0.07], c2:[232,201,160,0.04], c3:[184,149,114,0.03], spd:0.003, amp:0.018, nb:3 };
    if (score >= 65) return { c1:[212,184,150,0.05], c2:[184,149,114,0.03], c3:[232,201,160,0.02], spd:0.002, amp:0.012, nb:2 };
    if (score >= 50) return { c1:[123,139,184,0.04], c2:[212,184,150,0.02], c3:[123,139,184,0.02], spd:0.0015, amp:0.008, nb:2 };
    return                 { c1:[123,139,184,0.03], c2:[74,62,40,0.02],     c3:[123,139,184,0.01], spd:0.001,  amp:0.005, nb:1 };
  }

  // ═══ fundo vivo ═══
  let fundoT = 0;
  let fundoRAF = null;
  let fundoAtivo = false;
  function initFundoJ() {
    const c = document.getElementById('jornada-bg');
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width  = window.innerWidth  * dpr;
    c.height = window.innerHeight * dpr;
    c.style.width  = window.innerWidth  + 'px';
    c.style.height = window.innerHeight + 'px';
  }
  function loopFundoJ() {
    if (!fundoAtivo) return;
    const c = document.getElementById('jornada-bg');
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    const p = getPaletaScore(SCORE_J);
    ctx.clearRect(0, 0, W, H);
    const blobs = [
      { x:W*0.2, y:H*0.25, r:Math.min(W,H)*0.4,  px:0,   py:0.5 },
      { x:W*0.8, y:H*0.65, r:Math.min(W,H)*0.35, px:1.2, py:1.8 },
      { x:W*0.5, y:H*0.5,  r:Math.min(W,H)*0.5,  px:2.1, py:0.3 },
    ];
    blobs.slice(0, p.nb).forEach((b, bi) => {
      const rx = b.r * (1 + p.amp * Math.sin(fundoT * p.spd * 60 + b.px));
      const ry = b.r * (1 + p.amp * Math.cos(fundoT * p.spd * 60 + b.py));
      const cx = b.x + Math.sin(fundoT * p.spd * 30 + b.px) * W * 0.04;
      const cy = b.y + Math.cos(fundoT * p.spd * 25 + b.py) * H * 0.04;
      const cor = bi === 0 ? p.c1 : bi === 1 ? p.c2 : p.c3;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, `rgba(${cor[0]},${cor[1]},${cor[2]},${cor[3]})`);
      g.addColorStop(1, `rgba(${cor[0]},${cor[1]},${cor[2]},0)`);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, fundoT * p.spd * 15, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
    fundoT++;
    fundoRAF = requestAnimationFrame(loopFundoJ);
  }

  // ═══ orbe da pausa ═══
  let orbeT = 0, orbePausaAtivo = false, orbeRAF = null;
  function loopOrbePausaJ() {
    const c = document.getElementById('j-pausa-orbe');
    if (!c) return;
    const ctx = c.getContext('2d');
    const size = c.width;
    const cx = size/2, cy = size/2, baseR = size * 0.34;
    ctx.clearRect(0, 0, size, size);
    const glow = ctx.createRadialGradient(cx, cy, baseR*0.5, cx, cy, baseR*1.4);
    glow.addColorStop(0, 'rgba(212,184,150,0.14)');
    glow.addColorStop(1, 'rgba(212,184,150,0)');
    ctx.beginPath(); ctx.arc(cx, cy, baseR*1.4, 0, Math.PI*2); ctx.fillStyle = glow; ctx.fill();
    const pts = 80, amp = 0.022, spd = orbePausaAtivo ? 0.6 : 0.3;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i/pts) * Math.PI * 2;
      let r = baseR;
      for (let h = 1; h <= 4; h++) {
        r += baseR * amp * Math.sin(a * h * 0.7 + orbeT * spd * (h % 2 === 0 ? 1 : -0.7) + h * 1.3) / h;
      }
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const ga = orbeT * 0.004 * Math.PI * 2;
    const grad = ctx.createLinearGradient(
      cx + Math.cos(ga) * baseR * 0.5,       cy + Math.sin(ga) * baseR * 0.5,
      cx + Math.cos(ga + Math.PI) * baseR * 0.5, cy + Math.sin(ga + Math.PI) * baseR * 0.5
    );
    grad.addColorStop(0,   'rgba(232,201,160,0.95)');
    grad.addColorStop(0.4, 'rgba(212,184,150,0.85)');
    grad.addColorStop(1,   'rgba(122,90,56,0.7)');
    ctx.fillStyle = grad; ctx.fill();
    const shine = ctx.createRadialGradient(cx - baseR*0.25, cy - baseR*0.3, 0, cx, cy, baseR*0.85);
    shine.addColorStop(0, `rgba(245,238,230,${0.18 + Math.sin(orbeT * 0.02) * 0.06})`);
    shine.addColorStop(1, 'rgba(245,238,230,0)');
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i/pts) * Math.PI * 2;
      let r = baseR;
      for (let h = 1; h <= 4; h++) r += baseR * amp * Math.sin(a * h * 0.7 + orbeT * spd * (h % 2 === 0 ? 1 : -0.7) + h * 1.3) / h;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = shine; ctx.fill();
    orbeT++;
    orbeRAF = requestAnimationFrame(loopOrbePausaJ);
  }

  // ═══ sons de transição ═══
  // 11 notas pra 11 seções (score/ritual/corpo/mente/pausa/espírito/insights/exames/roda/club/30d)
  const NOTAS_J = [329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33, 622.25, 659.25, 739.99, 698.46];
  function tocarNotaJ(idx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const actx = new AC();
      const freq = NOTAS_J[idx] || 440;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 1.002, actx.currentTime + 0.3);
      g.gain.setValueAtTime(0, actx.currentTime);
      g.gain.linearRampToValueAtTime(0.07, actx.currentTime + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.55);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.55);
    } catch (e) {}
  }

  // ═══ nav entre seções ═══
  const sectionsEl = document.getElementById('jornada-sections');
  if (!sectionsEl) return;
  const secs = sectionsEl.querySelectorAll('.jsec');
  const TOTAL = secs.length;
  let current = 0;
  let isAnim = false;
  let pausaTimeout = null;
  let touchStartY = 0, touchStartX = 0;

  function applySections() {
    secs.forEach((s, i) => {
      s.classList.remove('is-active', 'is-above', 'is-below');
      if (i === current)      s.classList.add('is-active');
      else if (i < current)   s.classList.add('is-above');
      else                    s.classList.add('is-below');
    });
  }

  function updateDots() {
    document.querySelectorAll('.jornada__dots .j-dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
    });
    updateJornadaNav();
  }

  function updateJornadaNav() {
    // section index → índice do botão na nav
    // nav: [hoje(0), insights(1), circa-som(2), exames(3), roda(4), club(5), 30d(6)]
    const navMap = { 0: 0, 6: 1, 7: 3, 8: 4, 9: 5, 10: 6 };
    const navIdx = navMap[current];
    document.querySelectorAll('.j-nav-item').forEach((b, i) => {
      b.classList.toggle('is-active', i === navIdx);
    });
  }

  function buildDots() {
    const c = document.getElementById('jornada-dots');
    if (!c) return;
    c.innerHTML = '';
    secs.forEach((s, i) => {
      const d = document.createElement('button');
      d.className = 'j-dot' + (i === 0 ? ' is-active' : '');
      if (s.dataset.pausa === 'true') d.classList.add('is-pausa');
      d.setAttribute('aria-label', `ir pra ${s.dataset.label || i}`);
      d.addEventListener('click', () => goToSec(i));
      c.appendChild(d);
    });
  }

  function goToSec(idx) {
    if (isAnim || idx === current || idx < 0 || idx >= TOTAL) return;
    const tgt = secs[idx];
    const isPausa = tgt?.dataset.pausa === 'true';
    isAnim = true;
    current = idx;
    applySections();
    tocarNotaJ(idx);
    updateDots();
    drawRodaIfVisible();
    setTimeout(() => {
      isAnim = false;
      if (isPausa) {
        orbePausaAtivo = true;
        const prog = document.getElementById('j-pausa-fill');
        if (prog) {
          prog.classList.remove('is-running');
          void prog.offsetWidth;
          prog.classList.add('is-running');
        }
        pausaTimeout = setTimeout(() => {
          orbePausaAtivo = false;
          pausaTimeout = null;
          goToSec(current + 1);
        }, 3200);
      }
    }, 580);
  }

  function nextSec() {
    if (pausaTimeout) return;
    goToSec(current + 1);
  }
  function prevSec() {
    if (pausaTimeout) {
      clearTimeout(pausaTimeout);
      pausaTimeout = null;
      orbePausaAtivo = false;
    }
    goToSec(current - 1);
  }

  // helper: o gesto começou num input/botão/card interativo? se sim, ignora swipe
  function gestoEmElementoInterativo(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(
      'input, textarea, select, button, .j-log, .j-mood__item, .j-area, .j-lab-card, .j-card, .j-antes-box, .j-roda-item, canvas#j-roda, .j-nav-item, .j-nav-circa, .j-dot, .jornada__close'
    );
  }

  // touch · com detecção de velocidade pra fluidez
  let touchStartTarget = null;
  let touchStartTime = 0;
  let touchLastY = 0;
  let touchLastTime = 0;
  sectionsEl.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchLastY = touchStartY;
    touchLastTime = Date.now();
    touchStartTarget = e.target;
    touchStartTime = touchLastTime;
  }, { passive: true });

  sectionsEl.addEventListener('touchmove', (e) => {
    touchLastY = e.touches[0].clientY;
    touchLastTime = Date.now();
  }, { passive: true });

  sectionsEl.addEventListener('touchend', (e) => {
    if (pausaTimeout) return;
    if (gestoEmElementoInterativo(touchStartTarget)) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;
    const duration = Date.now() - touchStartTime;
    if (duration < 100) return; // tap, não swipe

    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const dy = touchStartY - endY;
    const dx = Math.abs(touchStartX - endX);

    // velocidade média (px/ms) · flick rápido tem threshold menor
    const velocity = Math.abs(dy) / Math.max(duration, 1);
    const isFlick = velocity > 0.4; // flick: mais de 0.4 px/ms

    // threshold dinâmico: swipe lento precisa 55px, flick rápido só precisa 25px
    const minDy = isFlick ? 25 : 55;

    if (Math.abs(dy) > minDy && Math.abs(dy) > dx * 1.2) {
      dy > 0 ? nextSec() : prevSec();
    }
  }, { passive: true });

  // wheel · detecta in\u00e9rcia por magnitude decrescente de deltaY
  let wheelTimer = null;
  let wheelLastTime = 0;
  let wheelLastDelta = 0;
  let wheelInertialCount = 0;
  sectionsEl.addEventListener('wheel', (e) => {
    if (!document.getElementById('jornada').classList.contains('is-open')) return;
    e.preventDefault();
    if (pausaTimeout) return;
    if (gestoEmElementoInterativo(e.target)) return;
    if (document.activeElement && document.activeElement.matches('input, textarea')) return;

    const now = Date.now();
    const absDelta = Math.abs(e.deltaY);
    const hadRecentWheel = wheelTimer !== null;

    // renova timer a cada evento pra prender in\u00e9rcia
    if (wheelTimer) clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelTimer = null;
      wheelInertialCount = 0;
    }, 380);

    // se já tinha timer, é in\u00e9rcia, incrementa contador
    if (hadRecentWheel) {
      wheelInertialCount++;
      return;
    }

    // debounce mínimo entre gestos intencionais (420ms)
    if (now - wheelLastTime < 420) return;

    // flick forte (delta grande) avança imediatamente
    // scroll pequeno/lento precisa acumular
    if (absDelta < 8 && wheelInertialCount === 0) return;

    wheelLastTime = now;
    wheelLastDelta = e.deltaY;
    wheelInertialCount = 0;

    e.deltaY > 0 ? nextSec() : prevSec();
  }, { passive: false });

  // teclado
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('jornada').classList.contains('is-open')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextSec();
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  prevSec();
    if (e.key === 'Escape') closeJornada();
  });

  // ═══ ritual ═══
  const ritualBtn = document.getElementById('j-ritual-btn');
  if (ritualBtn) ritualBtn.addEventListener('click', () => {
    const inp = document.getElementById('j-ritual-input');
    if (!inp || !inp.value.trim()) return;
    document.getElementById('j-ritual-content').style.display = 'none';
    document.getElementById('j-ritual-done').classList.add('is-visible');
  });

  // ═══ mood · click pra selecionar ═══
  document.querySelectorAll('.j-mood__item').forEach((m) => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.j-mood__item').forEach((x) => x.classList.remove('is-active'));
      m.classList.add('is-active');
    });
  });

  // ═══ areas espírito · toggle ═══
  document.querySelectorAll('.j-area').forEach((a) => {
    a.addEventListener('click', () => a.classList.toggle('is-on'));
  });

  // ═══ RODA DA VIDA ═══
  // sincronizada com as 8 dimensões da roda principal do Circa (AREAS global)
  // cor + mensagem por key, valor puxado direto do AREAS pra ficar sempre em dia
  const RODA_META = {
    saude:    { lbl:'saúde',      cor:'#7B8BB8', msg:'treino e consistência funcionam. corpo respondendo.' },
    carreira: { lbl:'carreira',   cor:'#E8C9A0', msg:'sólida. atenção ao equilíbrio com descanso.' },
    familia:  { lbl:'família',    cor:'#8FA87C', msg:'vínculos próximos em dia. presença consistente.' },
    relac:    { lbl:'relações',   cor:'#C09090', msg:'pedindo atenção. última conexão há 9 dias.' },
    lazer:    { lbl:'lazer',      cor:'#E8A87C', msg:'abaixo do ideal. teu corpo pede mais pausa.' },
    desenv:   { lbl:'desenvolv.', cor:'#D4B896', msg:'ritmo estável. curiosidade acesa.' },
    espirit:  { lbl:'espírito',   cor:'#A89CC8', msg:'fé e propósito alimentando o score.' },
    financas: { lbl:'finanças',   cor:'#B8A878', msg:'previsível. sem sobressaltos no mês.' },
  };
  function buildRodaFromAreas() {
    const src = (typeof AREAS !== 'undefined' && Array.isArray(AREAS)) ? AREAS : [];
    if (!src.length) {
      // fallback com valores sensatos caso AREAS ainda não tenha carregado
      return Object.entries(RODA_META).map(([k, m]) => ({ key:k, lbl:m.lbl, cor:m.cor, msg:m.msg, val:6 }));
    }
    return src.map((a) => {
      const m = RODA_META[a.key] || { lbl:a.label, cor:'var(--accent)', msg:'' };
      return { key:a.key, lbl:m.lbl, cor:m.cor, msg:m.msg, val:a.value };
    });
  }
  let RODA = buildRodaFromAreas();
  let rodaVals = RODA.map(() => 0);
  let rodaAnims = RODA.map(() => 0);
  let rodaPulsoT = 0;
  let rodaAreaAtiva = -1;
  let rodaDrawn = false;
  let rodaRAF = null;
  let ttTimer = null;

  function drawRodaIfVisible() {
    // seção 8 é a roda (depois do exames na 7)
    if (current !== 8 || rodaDrawn) return;
    rodaDrawn = true;
    animarRoda();
    buildLegenda();
    initRodaTouch();
  }

  function animarRoda() {
    const start = performance.now();
    const dur = 1600;
    function frame(now) {
      const prog = Math.min((now - start) / dur, 1);
      RODA.forEach((a, i) => {
        const delay = (i / RODA.length) * 0.5;
        const p = Math.max(0, Math.min((prog - delay) / (1 - delay), 1));
        const e = 1 - Math.pow(1 - p, 2.5);
        rodaVals[i] = a.val * e;
        if (p > 0.85 && rodaAnims[i] === 0) {
          rodaAnims[i] = 1;
          tocarNotaArea(i);
        }
      });
      drawRodaFrame();
      if (prog < 1) requestAnimationFrame(frame);
      else { rodaVals = RODA.map(a => a.val); loopRodaPulso(); }
    }
    requestAnimationFrame(frame);
  }

  function loopRodaPulso() {
    rodaPulsoT += 0.02;
    drawRodaFrame();
    rodaRAF = requestAnimationFrame(loopRodaPulso);
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawRodaFrame() {
    const canvas = document.getElementById('j-roda');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    const maxR = Math.min(W, H) * 0.40;
    const n = RODA.length;
    ctx.clearRect(0, 0, W, H);
    // grades
    for (let r = 1; r <= 10; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * r/10, 0, Math.PI*2);
      ctx.strokeStyle = r === 10 ? 'rgba(212,184,150,0.2)' : r % 2 === 0 ? 'rgba(212,184,150,0.07)' : 'rgba(212,184,150,0.03)';
      ctx.lineWidth = r === 10 ? 1.5 : 1;
      ctx.stroke();
    }
    // divisórias
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.strokeStyle = 'rgba(212,184,150,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // fatias
    RODA.forEach((a, i) => {
      const aStart = (i / n) * Math.PI * 2 - Math.PI/2;
      const aEnd   = ((i+1) / n) * Math.PI * 2 - Math.PI/2;
      const v = rodaVals[i];
      const isAtiva = i === rodaAreaAtiva;
      const off = isAtiva ? 0.15 : 0.04;
      const pulso = 1 + off * Math.sin(rodaPulsoT + i * 0.8);
      const r = maxR * (v / 10) * pulso;
      const alpha = v >= 7 ? 0.22 : v >= 5 ? 0.14 : 0.08;
      const alphaS = v >= 7 ? 0.7 : v >= 5 ? 0.5 : 0.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, aStart, aEnd);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(a.cor, isAtiva ? alpha * 1.8 : alpha);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(a.cor, isAtiva ? alphaS * 1.3 : alphaS * 0.6);
      ctx.lineWidth = isAtiva ? 1.5 : 1;
      ctx.stroke();
    });
    // polígono de valores
    ctx.beginPath();
    RODA.forEach((a, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const v = rodaVals[i];
      const pulso = 1 + 0.025 * Math.sin(rodaPulsoT + i * 0.8);
      const r = maxR * (v / 10) * pulso;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(212,184,150,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(212,184,150,0.05)';
    ctx.fill();
    // pontos
    RODA.forEach((a, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const v = rodaVals[i];
      const pulso = 1 + 0.025 * Math.sin(rodaPulsoT + i * 0.8);
      const r = maxR * (v / 10) * pulso;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      const isAtiva = i === rodaAreaAtiva;
      if (isAtiva || v >= 7) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, isAtiva ? 18 : 12);
        glow.addColorStop(0, hexToRgba(a.cor, isAtiva ? 0.4 : 0.2));
        glow.addColorStop(1, hexToRgba(a.cor, 0));
        ctx.beginPath();
        ctx.arc(x, y, isAtiva ? 18 : 12, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, isAtiva ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = a.cor;
      ctx.fill();
      if (isAtiva) {
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(a.cor, 0.5);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  function tocarNotaArea(idx) {
    try {
      const notas = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const actx = new AC();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(notas[idx] || 440, actx.currentTime);
      g.gain.setValueAtTime(0, actx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, actx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.4);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.4);
    } catch (e) {}
  }

  function mostrarTooltip(idx) {
    const a = RODA[idx];
    const tt = document.getElementById('j-roda-tt');
    document.getElementById('j-roda-tt-lbl').textContent = a.lbl;
    document.getElementById('j-roda-tt-val').innerHTML = `${a.val} <span>/10</span>`;
    document.getElementById('j-roda-tt-msg').textContent = a.msg;
    tt.style.borderLeftColor = a.cor;
    tt.classList.add('is-visible');
    clearTimeout(ttTimer);
    ttTimer = setTimeout(() => {
      rodaAreaAtiva = -1;
      tt.classList.remove('is-visible');
    }, 3000);
  }

  function initRodaTouch() {
    const c = document.getElementById('j-roda');
    if (!c || c.dataset.touchBound === '1') return;
    c.dataset.touchBound = '1';
    const handle = (cx, cy) => {
      const rect = c.getBoundingClientRect();
      const sx = c.width / rect.width, sy = c.height / rect.height;
      const x = (cx - rect.left) * sx, y = (cy - rect.top) * sy;
      const ccx = c.width/2, ccy = c.height/2;
      const maxR = Math.min(c.width, c.height) * 0.40;
      const dx = x - ccx, dy = y - ccy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > maxR * 1.15) {
        rodaAreaAtiva = -1;
        document.getElementById('j-roda-tt').classList.remove('is-visible');
        return;
      }
      let angle = Math.atan2(dy, dx) + Math.PI/2;
      if (angle < 0) angle += Math.PI * 2;
      const idx = Math.floor(angle / (Math.PI * 2) * RODA.length) % RODA.length;
      rodaAreaAtiva = idx;
      tocarNotaArea(idx);
      mostrarTooltip(idx);
    };
    c.addEventListener('click', (e) => handle(e.clientX, e.clientY));
    c.addEventListener('touchstart', (e) => { e.preventDefault(); handle(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  }

  function buildLegenda() {
    const l = document.getElementById('j-roda-legenda');
    if (!l) return;
    l.innerHTML = '';
    RODA.forEach((a, i) => {
      const it = document.createElement('div');
      it.className = 'j-roda-item';
      it.innerHTML = `<i style="background:${a.cor}"></i><span>${a.lbl}</span><b style="color:${a.cor}">${a.val}</b>`;
      it.addEventListener('click', () => {
        rodaAreaAtiva = i;
        tocarNotaArea(i);
        mostrarTooltip(i);
      });
      l.appendChild(it);
    });
    setTimeout(() => l.classList.add('is-visible'), 100);
  }

  // ═══ abrir / fechar ═══
  window.openJornada = function () {
    const el = document.getElementById('jornada');
    if (!el) return;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    // reset
    current = 0;
    applySections();
    updateDots();
    // rebuild RODA com valores atuais do AREAS global
    RODA = buildRodaFromAreas();
    rodaDrawn = false;
    rodaVals = RODA.map(() => 0);
    rodaAnims = RODA.map(() => 0);
    // mensagem aleatória da pausa
    const m = document.getElementById('j-pausa-msg');
    if (m) m.textContent = MSGS_PAUSA[Math.floor(Math.random() * MSGS_PAUSA.length)];
    // fundo vivo
    initFundoJ();
    fundoAtivo = true;
    loopFundoJ();
    // orbe da pausa em loop
    orbeT = 0;
    loopOrbePausaJ();
    try { hap(12); } catch (e) {}
  };

  window.closeJornada = function () {
    const el = document.getElementById('jornada');
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    fundoAtivo = false;
    if (fundoRAF) cancelAnimationFrame(fundoRAF);
    if (orbeRAF)  cancelAnimationFrame(orbeRAF);
    if (rodaRAF)  cancelAnimationFrame(rodaRAF);
    if (pausaTimeout) { clearTimeout(pausaTimeout); pausaTimeout = null; }
    orbePausaAtivo = false;
  };

  const closeBtn = document.getElementById('jornada-close');
  if (closeBtn) closeBtn.addEventListener('click', () => window.closeJornada());

  // refazer onboarding, fecha jornada e abre o fluxo de perguntas
  const jRefazer = document.getElementById('j-refazer-onb');
  if (jRefazer) jRefazer.addEventListener('click', () => {
    try { hap(10); } catch (e) {}
    if (typeof window.closeJornada === 'function') window.closeJornada();
    // espera o fade completo da jornada (400ms transition + 50ms buffer) antes de abrir
    setTimeout(() => {
      if (typeof openOnboard === 'function') openOnboard();
    }, 480);
  });

  // cards de exames · abrem os sheets existentes do Circa
  const jLabCard = document.getElementById('j-lab-open');
  if (jLabCard) jLabCard.addEventListener('click', () => {
    if (typeof openSheet === 'function') openSheet('sheet-lab');
  });
  const jBodyCard = document.getElementById('j-body-open');
  if (jBodyCard) jBodyCard.addEventListener('click', () => {
    if (typeof openSheet === 'function') openSheet('sheet-body');
  });

  // blocos de temas do log rápido no ritual · abrem sheets dedicados POR CIMA da jornada
  // (jornada fica aberta no fundo, sheet sobrepõe via z-index 250)
  document.querySelectorAll('.j-log[data-log]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const kind = tile.dataset.log;
      try { hap(8); } catch (e) {}
      if (kind === 'humor') {
        if (typeof abrirLogHumor === 'function') abrirLogHumor();
      } else if (kind === 'sono') {
        if (typeof abrirLogSono === 'function') abrirLogSono();
      } else if (kind === 'treino') {
        if (typeof abrirLogTreinoSemana === 'function') abrirLogTreinoSemana();
      } else if (kind === 'agua') {
        if (typeof abrirLogAgua === 'function') abrirLogAgua();
      } else if (kind === 'refeicao') {
        if (typeof abrirLogRefeicao === 'function') abrirLogRefeicao();
      }
    });
  });

  // nav inferior da jornada, pulo pra seção
  document.querySelectorAll('.j-nav-item[data-j-goto]').forEach((b) => {
    b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.jGoto, 10);
      if (!isNaN(idx)) goToSec(idx);
    });
  });

  // botão circa no meio da nav, toca o chime da Circa
  const jCirca = document.getElementById('j-nav-circa');
  if (jCirca) jCirca.addEventListener('click', () => {
    if (typeof tocarSomCirca === 'function') tocarSomCirca();
    else if (typeof window.tocarSomCirca === 'function') window.tocarSomCirca();
  });

  buildDots();
  applySections();
  updateDots();

  window.addEventListener('resize', () => {
    if (document.getElementById('jornada').classList.contains('is-open')) initFundoJ();
  });
})();

// ═════════════════════════════════════════════════════════
// ENTRY POINT · jornada é a experiência primária do "hoje"
// Auto-abre ao carregar, ao tocar na aba hoje, e ao clicar em score/saber mais
// ═════════════════════════════════════════════════════════
(function () {
  // memória de sessão, pra não re-abrir sozinho se o user fechou
  let jornadaFechadaManual = false;
  const _closeOrig = window.closeJornada;
  window.closeJornada = function () {
    jornadaFechadaManual = true;
    if (typeof _closeOrig === 'function') _closeOrig();
  };

  function abrirJornadaSafe() {
    if (typeof window.openJornada !== 'function') return;
    // respeita onboarding: só abre se não tiver overlay de welcome/onboarding ativo
    const welcome = document.getElementById('welcome');
    const onboard = document.getElementById('onboard');
    if (welcome && welcome.classList.contains('is-open')) return;
    if (onboard && onboard.classList.contains('is-open')) return;
    window.openJornada();
  }

  // 1. "Saber mais" abre a jornada
  const link = document.getElementById('hero-link-more');
  if (link) {
    const fresh = link.cloneNode(true);
    link.parentNode.replaceChild(fresh, link);
    fresh.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      jornadaFechadaManual = false;
      try { hap(10); } catch (er) {}
      abrirJornadaSafe();
    });
  }

  // 2. tocar na aba "hoje" re-abre a jornada
  document.querySelectorAll('.tab[data-target="home"]').forEach((t) => {
    t.addEventListener('click', () => {
      jornadaFechadaManual = false;
      setTimeout(abrirJornadaSafe, 80);
    });
  });

  // 3. auto-abre ao carregar a primeira vez (esperando splash fechar)
  function autoOpen() {
    if (jornadaFechadaManual) return;
    abrirJornadaSafe();
  }
  function agendarAutoOpen() {
    // splash abre primeiro (~1.6s), depois auto-open
    setTimeout(autoOpen, 1750);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', agendarAutoOpen);
  } else {
    agendarAutoOpen();
  }
})();

// ═════════════════════════════════════════════════════════
// SPLASH · controla o fade out do logo inicial
// ═════════════════════════════════════════════════════════
(function () {
  const splash = document.getElementById('splash');
  if (!splash) return;

  function esconderSplash() {
    splash.classList.add('is-done');
    splash.setAttribute('aria-hidden', 'true');
  }

  function iniciarSplash() {
    // mostra por 1500ms (tempo pra animação respiratória + grão) e faz fade
    setTimeout(esconderSplash, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSplash);
  } else {
    iniciarSplash();
  }

  // segurança: clique em qualquer lugar fecha antes
  splash.addEventListener('click', esconderSplash);
})();

// ═════════════════════════════════════════════════════════
// LOG SHEETS · sono, água, treino-semana
// tudo persistido em localStorage, correlacionado com o app
// ═════════════════════════════════════════════════════════

// ───── helpers compartilhados ─────
function diaAtualKey() {
  // retorna key (seg/ter/qua/qui/sex/sab/dom) do dia de hoje
  const map = ['dom','seg','ter','qua','qui','sex','sab'];
  return map[new Date().getDay()];
}
function diaOntemKey() {
  const map = ['dom','seg','ter','qua','qui','sex','sab'];
  return map[(new Date().getDay() + 6) % 7];
}

// ───── LOG DE SONO ─────
let sonoDaySel = null;
let sonoSens = null;
let sonoQualidade = null;
let sonoInterrupcoes = 'nao';
let sonoCafeina = 'nao';
let sonoAlcool = 'nao';

function abrirLogSono() {
  // reset diário: dia padrão é ontem (noite que passou), todos valores limpos
  sonoDaySel = diaOntemKey();
  sonoSens = null;
  sonoQualidade = null;
  sonoInterrupcoes = 'nao';
  sonoCafeina = 'nao';
  sonoAlcool = 'nao';

  const chips = document.querySelectorAll('#sono-day-chips .log-day-chip');
  chips.forEach((c) => c.classList.toggle('is-active', c.dataset.day === sonoDaySel));

  // horários padrão 23:00 / 07:00 · NÃO reutiliza o último, é um novo dia
  const bedInp = document.getElementById('sono-bedtime');
  const wakeInp = document.getElementById('sono-waketime');
  if (bedInp)  bedInp.value  = '23:00';
  if (wakeInp) wakeInp.value = '07:00';

  document.querySelectorAll('#sheet-log-sono .sensacao').forEach((s) => s.classList.remove('is-on'));
  document.querySelectorAll('#sono-qualidade .log-dot').forEach((x) => x.classList.remove('is-active'));
  document.querySelectorAll('[data-sono-interr]').forEach((x) => x.classList.toggle('is-active', x.dataset.sonoInterr === 'nao'));
  document.querySelectorAll('[data-sono-cafe]').forEach((x) => x.classList.toggle('is-active', x.dataset.sonoCafe === 'nao'));
  document.querySelectorAll('[data-sono-alc]').forEach((x) => x.classList.toggle('is-active', x.dataset.sonoAlc === 'nao'));
  const nota = document.getElementById('sono-nota');
  if (nota) nota.value = '';

  calcularDuracaoSono();
  renderResumoSemanaSono();
  if (typeof openSheet === 'function') openSheet('sheet-log-sono');
}

// resumo semanal + insights automáticos
function renderResumoSemanaSono() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem('circa_log_sono') || '[]'); } catch (e) {}
  const wrap = document.getElementById('sono-semana-wrap');
  if (!wrap) return;

  // filtra últimos 7 registros
  const ultimos = arr.slice(-7);
  if (ultimos.length < 2) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  // helpers: dur em minutos
  const durStr2Min = (s) => {
    const m = s && s.match(/(\d+)h\s*(\d+)min/);
    if (!m) return 0;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  };
  const fmtDur = (min) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2,'0')}`;
  const minToTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const dursMin = ultimos.map(r => durStr2Min(r.dur)).filter(n => n > 0);
  const mediaMin = dursMin.reduce((a,b) => a+b, 0) / dursMin.length;

  // consistência = desvio padrão dos horários de dormir (menor = mais consistente)
  const bedMins = ultimos.map(r => minToTime(r.bed)).filter(n => n !== null);
  const avgBed = bedMins.reduce((a,b) => a+b, 0) / bedMins.length;
  const variance = bedMins.reduce((a,b) => a + Math.pow(b - avgBed, 2), 0) / bedMins.length;
  const sdMin = Math.round(Math.sqrt(variance));

  // % dias na meta (7h-9h)
  const naMeta = dursMin.filter(m => m >= 420 && m <= 540).length;
  const pctMeta = Math.round((naMeta / dursMin.length) * 100);

  document.getElementById('sono-media').textContent = fmtDur(Math.round(mediaMin));
  document.getElementById('sono-consist').textContent = sdMin + 'min';
  document.getElementById('sono-meta').textContent = pctMeta + '%';

  // gera insights automáticos
  const insights = [];
  if (mediaMin >= 420 && mediaMin <= 540) {
    insights.push(`média na meta. seu corpo tá recuperando bem.`);
  } else if (mediaMin < 420) {
    const deficit = Math.round((420 - mediaMin) / 60 * 10) / 10;
    insights.push(`${deficit}h abaixo da meta na semana. acumula cansaço.`);
  } else {
    insights.push(`dormindo acima da meta, vale investigar se é recovery ou excesso.`);
  }

  if (sdMin < 30) {
    insights.push(`consistência alta, horário estável (${sdMin}min de variação).`);
  } else if (sdMin > 60) {
    insights.push(`horário oscilou ${sdMin}min. regularidade melhora qualidade.`);
  }

  // correlação cafeína
  const comCafe = ultimos.filter(r => r.cafeina === 'sim');
  const semCafe = ultimos.filter(r => r.cafeina === 'nao');
  if (comCafe.length > 0 && semCafe.length > 0) {
    const mediaComCafe = comCafe.map(r => durStr2Min(r.dur)).reduce((a,b) => a+b, 0) / comCafe.length;
    const mediaSemCafe = semCafe.map(r => durStr2Min(r.dur)).reduce((a,b) => a+b, 0) / semCafe.length;
    if (mediaSemCafe - mediaComCafe > 20) {
      insights.push(`sono ${Math.round(mediaSemCafe - mediaComCafe)}min maior nos dias sem cafeína tarde.`);
    }
  }

  // comparação com semana anterior (se houver 14 registros)
  if (arr.length >= 14) {
    const semanaAnt = arr.slice(-14, -7);
    const durAnt = semanaAnt.map(r => durStr2Min(r.dur)).filter(n => n > 0);
    if (durAnt.length > 0) {
      const mediaAnt = durAnt.reduce((a,b) => a+b, 0) / durAnt.length;
      const diff = Math.round(mediaMin - mediaAnt);
      if (Math.abs(diff) > 10) {
        insights.push(diff > 0
          ? `média subiu ${diff}min vs semana passada.`
          : `média caiu ${Math.abs(diff)}min vs semana passada.`);
      }
    }
  }

  const ul = document.getElementById('sono-insights');
  if (ul) {
    ul.innerHTML = '';
    insights.slice(0, 3).forEach(txt => {
      const li = document.createElement('li');
      li.textContent = txt;
      ul.appendChild(li);
    });
  }
}

function calcularDuracaoSono() {
  const bed = document.getElementById('sono-bedtime');
  const wake = document.getElementById('sono-waketime');
  const out = document.getElementById('sono-dur');
  const hint = document.getElementById('sono-hint');
  if (!bed || !wake || !out || !hint) return;

  const [bh, bm] = bed.value.split(':').map(Number);
  const [wh, wm] = wake.value.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  // se acordou antes de dormir no clock, atravessou a meia-noite
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  const totalMin = wakeMin - bedMin;
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  out.textContent = `${hh}h ${String(mm).padStart(2,'0')}min`;

  // hint qualitativo
  hint.classList.remove('is-low', 'is-good');
  if (totalMin < 6 * 60) {
    hint.textContent = 'abaixo da meta · 7-9h recomendadas';
    hint.classList.add('is-low');
  } else if (totalMin >= 7 * 60 && totalMin <= 9 * 60 + 30) {
    hint.textContent = 'dentro da meta · 7-9h';
    hint.classList.add('is-good');
  } else if (totalMin > 9 * 60 + 30) {
    hint.textContent = 'mais longo que o usual';
  } else {
    hint.textContent = 'próximo da meta · 7-9h';
  }
}

// wiring do sono
(function () {
  const chips = document.querySelectorAll('#sono-day-chips .log-day-chip');
  chips.forEach((c) => c.addEventListener('click', () => {
    sonoDaySel = c.dataset.day;
    chips.forEach((x) => x.classList.toggle('is-active', x === c));
    try { hap(6); } catch (e) {}
  }));

  const bed = document.getElementById('sono-bedtime');
  const wake = document.getElementById('sono-waketime');
  if (bed) bed.addEventListener('input', calcularDuracaoSono);
  if (wake) wake.addEventListener('input', calcularDuracaoSono);

  document.querySelectorAll('#sheet-log-sono .sensacao').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#sheet-log-sono .sensacao').forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      sonoSens = parseInt(b.dataset.sonoSens, 10);
      try { hap(6); } catch (e) {}
    });
  });

  // qualidade 1-5
  document.querySelectorAll('#sono-qualidade .log-dot').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#sono-qualidade .log-dot').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      sonoQualidade = parseInt(b.dataset.v, 10);
      try { hap(4); } catch (e) {}
    });
  });

  // sim/não, 3 perguntas
  function setupYN(attr, setter) {
    document.querySelectorAll(`[data-${attr}]`).forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll(`[data-${attr}]`).forEach((x) => x.classList.remove('is-active'));
        b.classList.add('is-active');
        setter(b.dataset[attr.replace(/-([a-z])/g, (_, l) => l.toUpperCase())]);
        try { hap(4); } catch (e) {}
      });
    });
  }
  setupYN('sono-interr', (v) => { sonoInterrupcoes = v; });
  setupYN('sono-cafe',   (v) => { sonoCafeina = v; });
  setupYN('sono-alc',    (v) => { sonoAlcool = v; });

  const salvar = document.getElementById('sono-salvar');
  if (salvar) salvar.addEventListener('click', () => {
    const bed = document.getElementById('sono-bedtime').value;
    const wake = document.getElementById('sono-waketime').value;
    const dur = document.getElementById('sono-dur').textContent;
    const nota = document.getElementById('sono-nota')?.value || '';
    const registro = {
      day: sonoDaySel,
      bed, wake, dur,
      sens: sonoSens,
      qualidade: sonoQualidade,
      interrupcoes: sonoInterrupcoes,
      cafeina: sonoCafeina,
      alcool: sonoAlcool,
      nota,
      ts: Date.now(),
    };
    try {
      const arr = JSON.parse(localStorage.getItem('circa_log_sono') || '[]');
      arr.push(registro);
      localStorage.setItem('circa_log_sono', JSON.stringify(arr));
      localStorage.setItem('circa_log_sono_last', JSON.stringify(registro));
    } catch (e) {}
    try { hap(14); } catch (e) {}
    if (typeof closeSheet === 'function') closeSheet();
    setTimeout(() => {
      const t = document.getElementById('log-ok-title');
      const s = document.getElementById('log-ok-sub');
      if (t) t.textContent = 'sono registrado.';
      const partes = [dur, sonoDaySel || 'hoje'];
      if (sonoQualidade) partes.push(`qualidade ${sonoQualidade}/5`);
      if (s) s.textContent = partes.join(' · ');
      if (typeof openSheet === 'function') openSheet('sheet-log-ok');
    }, 200);
  });
})();

// ───── LOG DE ÁGUA ─────
let aguaHojeMl = 1800;
let aguaMetaMl = 2800;
let aguaCustomVal = 0;

function formatLitros(ml) { return (ml / 1000).toFixed(1); }

function refreshAguaUI() {
  const big = document.getElementById('agua-hoje');
  if (big) big.textContent = formatLitros(aguaHojeMl);
  const todayBar = document.getElementById('lww-today-bar');
  const todayVal = document.getElementById('lww-today-val');
  if (todayBar) todayBar.style.setProperty('--h', Math.min(100, (aguaHojeMl / aguaMetaMl) * 100) + '%');
  if (todayVal) todayVal.textContent = formatLitros(aguaHojeMl);
  // sync com qualquer #water-big do sheet-water existente
  const wbig = document.getElementById('water-big');
  if (wbig) wbig.textContent = formatLitros(aguaHojeMl);
}

function abrirLogAgua() {
  // carrega valor persistido
  try {
    const saved = localStorage.getItem('circa_agua_hoje');
    if (saved) aguaHojeMl = parseInt(saved, 10);
  } catch (e) {}
  aguaCustomVal = 0;
  const inp = document.getElementById('agua-custom');
  if (inp) inp.value = '';
  document.querySelectorAll('.log-agua-chip').forEach((c) => c.classList.remove('is-active'));
  refreshAguaUI();
  if (typeof openSheet === 'function') openSheet('sheet-log-agua');
}

(function () {
  // chips rápidos
  document.querySelectorAll('.log-agua-chip').forEach((c) => {
    c.addEventListener('click', () => {
      const ml = parseInt(c.dataset.ml, 10);
      aguaCustomVal = ml;
      document.querySelectorAll('.log-agua-chip').forEach((x) => x.classList.toggle('is-active', x === c));
      const inp = document.getElementById('agua-custom');
      if (inp) inp.value = ml;
      try { hap(6); } catch (e) {}
    });
  });

  const inp = document.getElementById('agua-custom');
  if (inp) inp.addEventListener('input', () => {
    aguaCustomVal = parseInt(inp.value, 10) || 0;
    document.querySelectorAll('.log-agua-chip').forEach((x) => x.classList.remove('is-active'));
  });

  const salvar = document.getElementById('agua-salvar');
  if (salvar) salvar.addEventListener('click', () => {
    if (!aguaCustomVal || aguaCustomVal <= 0) {
      try { hap(4); } catch (e) {}
      return;
    }
    aguaHojeMl += aguaCustomVal;
    try { localStorage.setItem('circa_agua_hoje', String(aguaHojeMl)); } catch (e) {}
    try { hap(12); } catch (e) {}
    refreshAguaUI();
    // reset input pro próximo add
    aguaCustomVal = 0;
    if (inp) inp.value = '';
    document.querySelectorAll('.log-agua-chip').forEach((x) => x.classList.remove('is-active'));
    // feedback
    if (typeof closeSheet === 'function') closeSheet();
    setTimeout(() => {
      const t = document.getElementById('log-ok-title');
      const s = document.getElementById('log-ok-sub');
      if (t) t.textContent = 'água registrada.';
      if (s) s.textContent = `total hoje: ${formatLitros(aguaHojeMl)} L / ${formatLitros(aguaMetaMl)} L`;
      if (typeof openSheet === 'function') openSheet('sheet-log-ok');
    }, 180);
  });
})();

// ───── LOG DE TREINO · semana ─────
// ───── status de treino por dia (persistido) ─────
function getTreinoStatusSemana() {
  try {
    const raw = localStorage.getItem('circa_treino_semana_status');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function setTreinoStatusSemana(obj) {
  try { localStorage.setItem('circa_treino_semana_status', JSON.stringify(obj)); } catch (e) {}
}

function abrirLogTreinoSemana() {
  const list = document.getElementById('treino-semana-list');
  if (!list || typeof WEEK_WORKOUTS === 'undefined') return;
  const ordem = ['seg','ter','qua','qui','sex','sab','dom'];
  const hoje = diaAtualKey();
  const status = getTreinoStatusSemana();
  list.innerHTML = '';

  // header com progresso da semana
  const ativosSemana = ordem.filter(k => WEEK_WORKOUTS[k]?.status !== 'rest');
  const feitosSemana = ativosSemana.filter(k => status[k]).length;
  const totalAtivo = ativosSemana.length;
  const pctSemana = Math.round((feitosSemana / totalAtivo) * 100);
  const prog = document.createElement('div');
  prog.className = 'ref-prog';
  prog.innerHTML = `
    <div class="ref-prog__top">
      <span>${feitosSemana} de ${totalAtivo} treinos da semana</span>
      <b>${pctSemana}%</b>
    </div>
    <div class="ref-prog__bar"><i style="width:${pctSemana}%"></i></div>
  `;
  list.appendChild(prog);

  ordem.forEach((k) => {
    const w = WEEK_WORKOUTS[k];
    if (!w) return;
    const isToday = k === hoje;
    const isDone = !!status[k];
    const isRest = w.status === 'rest';
    const cls = [
      isToday ? 'is-today' : '',
      isDone  ? 'is-done'  : '',
      isRest  ? 'is-rest'  : ''
    ].filter(Boolean).join(' ');
    const badgeTxt = isRest ? 'descanso' : isDone ? 'feito' : isToday ? 'hoje' : '';
    const badgeCls = isRest ? 'tsi-badge--rest' : isDone ? 'tsi-badge--done' : isToday ? 'tsi-badge--today' : '';
    const item = document.createElement('div');
    item.className = 'treino-semana-item ' + cls;
    item.innerHTML = `
      <button class="ref-check tsi-check" data-day="${k}" aria-label="marcar ${w.label}"${isRest ? ' disabled' : ''}></button>
      <span class="tsi-day">${w.label}</span>
      <span class="tsi-info">
        <strong>${w.type}</strong>
        <span>${w.subtitle.replace(' · hoje','')}</span>
      </span>
      ${badgeTxt ? `<span class="tsi-badge ${badgeCls}">${badgeTxt}</span>` : ''}
    `;
    // check toggle
    const checkBtn = item.querySelector('.tsi-check');
    if (checkBtn) checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isRest) return;
      const st = getTreinoStatusSemana();
      st[k] = st[k] ? 0 : Date.now();
      setTreinoStatusSemana(st);
      try { hap(10); } catch (er) {}
      abrirLogTreinoSemana(); // re-render pra atualizar progress
    });
    // click na linha abre o detalhe (exceto no check)
    item.addEventListener('click', () => {
      if (isRest) { try { hap(4); } catch (e) {} return; }
      try { hap(8); } catch (e) {}
      if (typeof closeSheet === 'function') closeSheet();
      setTimeout(() => { if (typeof openDay === 'function') openDay(k); }, 200);
    });
    list.appendChild(item);
  });

  if (typeof openSheet === 'function') openSheet('sheet-log-treino-semana');
}

// ───── ALTERAR TREINO · substitutos por grupo muscular ─────
const SUBSTITUTOS_POR_GRUPO = {
  peito: [
    { nome: 'supino reto', meta: '4 × 8 · barra', por: 'mesmo padrão de empurrar · base' },
    { nome: 'supino inclinado', meta: '3 × 10 · halteres', por: 'foca parte superior, mesma cadeia' },
    { nome: 'crucifixo', meta: '3 × 12 · halteres', por: 'isola o peitoral, menos ombro' },
    { nome: 'flexão de braço', meta: '4 × max · corpo', por: 'sem equipamento, recruta core' },
  ],
  costas: [
    { nome: 'puxada frontal', meta: '4 × 10 · polia', por: 'vertical, dorsal amplo' },
    { nome: 'remada curvada', meta: '4 × 8 · barra', por: 'horizontal, mid-back' },
    { nome: 'remada baixa', meta: '3 × 10 · polia', por: 'mesmo padrão de puxar' },
    { nome: 'barra fixa', meta: '4 × max · corpo', por: 'clássico, pega toda cadeia' },
  ],
  pernas: [
    { nome: 'agachamento livre', meta: '5 × 6 · barra', por: 'padrão composto completo' },
    { nome: 'leg press', meta: '4 × 10 · máquina', por: 'volume sem carga axial' },
    { nome: 'stiff', meta: '4 × 10 · barra', por: 'posterior + glúteo' },
    { nome: 'afundo', meta: '3 × 12 cada lado', por: 'unilateral, corrige assimetria' },
  ],
  ombro: [
    { nome: 'desenvolvimento', meta: '4 × 8 · halteres', por: 'empurrar vertical, deltóide' },
    { nome: 'elevação lateral', meta: '4 × 12 · halteres', por: 'isola deltóide médio' },
    { nome: 'elevação frontal', meta: '3 × 12 · halteres', por: 'deltóide anterior' },
    { nome: 'face pull', meta: '3 × 15 · polia', por: 'postural, deltóide posterior' },
  ],
  biceps: [
    { nome: 'rosca direta', meta: '4 × 10 · barra', por: 'foco na cabeça longa' },
    { nome: 'rosca martelo', meta: '3 × 12 · halteres', por: 'pega neutra, braquial' },
    { nome: 'rosca scott', meta: '3 × 10 · banco', por: 'isola, tira impulso' },
    { nome: 'rosca inversa', meta: '3 × 12 · barra', por: 'antebraço + braquiorradial' },
  ],
  triceps: [
    { nome: 'tríceps corda', meta: '4 × 12 · polia', por: 'isola cabeça lateral' },
    { nome: 'tríceps francês', meta: '3 × 10 · halter', por: 'alonga cabeça longa' },
    { nome: 'paralela', meta: '3 × max · corpo', por: 'composto, peito + tríceps' },
    { nome: 'supino fechado', meta: '4 × 8 · barra', por: 'pega fechada, foca tríceps' },
  ],
  core: [
    { nome: 'prancha', meta: '3 × 60s', por: 'isométrica, core profundo' },
    { nome: 'abdominal reto', meta: '4 × 20', por: 'reto abdominal direto' },
    { nome: 'elevação de pernas', meta: '4 × 15', por: 'parte inferior do reto' },
    { nome: 'prancha lateral', meta: '3 × 40s cada', por: 'oblíquos + estabilidade' },
  ],
  cardio: [
    { nome: 'corrida', meta: '30min · pace 6:00', por: 'aeróbico contínuo, impacto' },
    { nome: 'bike', meta: '40min · moderado', por: 'aeróbico sem impacto' },
    { nome: 'hiit', meta: '20min · 30/30', por: 'anaeróbico intenso, queima alta' },
    { nome: 'caminhada rápida', meta: '45min · incline', por: 'baixa intensidade, recovery' },
  ],
};

let trocarGrupoSel = null;

function abrirTrocarTreino() {
  trocarGrupoSel = null;
  document.getElementById('tr-step-grupo').style.display = '';
  document.getElementById('tr-step-subs').style.display = 'none';
  document.querySelectorAll('.tr-grupo').forEach((g) => g.classList.remove('is-active'));
  if (typeof openSheet === 'function') openSheet('sheet-trocar-treino');
}

function renderTrocarSubs(grupo) {
  trocarGrupoSel = grupo;
  const list = document.getElementById('tr-subs-list');
  const eye = document.getElementById('tr-subs-eye');
  if (!list) return;
  const subs = SUBSTITUTOS_POR_GRUPO[grupo] || [];
  eye.textContent = `substitutos · ${grupo}`;
  list.innerHTML = '';
  subs.forEach((s) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'tr-sub';
    btn.innerHTML = `
      <strong>${s.nome}</strong>
      <span class="tr-sub-meta">${s.meta}</span>
      <em>por quê: ${s.por}</em>
    `;
    btn.addEventListener('click', () => {
      try {
        const hist = JSON.parse(localStorage.getItem('circa_troca_exercicio') || '[]');
        hist.push({ grupo, substituto: s.nome, meta: s.meta, ts: Date.now(), dia: currentDayKey });
        localStorage.setItem('circa_troca_exercicio', JSON.stringify(hist));
      } catch (e) {}
      try { hap(14); } catch (e) {}
      if (typeof closeSheet === 'function') closeSheet();
      setTimeout(() => {
        const t = document.getElementById('log-ok-title');
        const sb = document.getElementById('log-ok-sub');
        if (t) t.textContent = 'treino ajustado.';
        if (sb) sb.textContent = `${grupo}: ${s.nome} · ${s.meta}`;
        if (typeof openSheet === 'function') openSheet('sheet-log-ok');
      }, 220);
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  document.getElementById('tr-step-grupo').style.display = 'none';
  document.getElementById('tr-step-subs').style.display = '';
}

(function () {
  document.querySelectorAll('.tr-grupo').forEach((g) => {
    g.addEventListener('click', () => {
      try { hap(8); } catch (e) {}
      renderTrocarSubs(g.dataset.grupo);
    });
  });
  const voltar = document.getElementById('tr-voltar');
  if (voltar) voltar.addEventListener('click', () => {
    document.getElementById('tr-step-grupo').style.display = '';
    document.getElementById('tr-step-subs').style.display = 'none';
    trocarGrupoSel = null;
  });
})();

// hook o botão "trocar" existente dentro do sheet-day pra abrir o novo flow
(function () {
  const btn = document.getElementById('day-swap-btn');
  if (!btn) return;
  // substitui listener antigo (que mostrava os 5 templates) pelo novo flow granular
  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener('click', () => {
    try { hap(10); } catch (e) {}
    if (typeof closeSheet === 'function') closeSheet();
    setTimeout(() => abrirTrocarTreino(), 220);
  });
})();

// ───── LOG DE HUMOR ─────
let humorSens = null;
let humorEnergia = null;
let humorFoco = null;

function abrirLogHumor() {
  // reset diário: todo novo dia começa limpo
  humorSens = null;
  humorEnergia = null;
  humorFoco = null;
  document.querySelectorAll('#sheet-log-humor .sensacao').forEach((x) => x.classList.remove('is-on'));
  document.querySelectorAll('#humor-energia .log-dot').forEach((x) => x.classList.remove('is-active'));
  document.querySelectorAll('#humor-foco .log-dot').forEach((x) => x.classList.remove('is-active'));
  const nota = document.getElementById('humor-nota');
  if (nota) nota.value = '';
  renderHumorHistorico();
  if (typeof openSheet === 'function') openSheet('sheet-log-humor');
}

function renderHumorHistorico() {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem('circa_log_humor') || '[]'); } catch (e) {}
  const wrap = document.getElementById('humor-hist-wrap');
  const ul = document.getElementById('humor-hist');
  if (!wrap || !ul) return;
  if (!arr.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  ul.innerHTML = '';
  const labelMap = { 1:'muito mal', 2:'mal', 3:'ok', 4:'bem', 5:'incrível' };
  // últimos 5, mais recentes primeiro
  arr.slice(-5).reverse().forEach((h) => {
    const d = new Date(h.ts);
    const dia = d.toLocaleDateString('pt-BR', { day:'numeric', month:'short' });
    const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    const partes = [];
    if (h.sens) partes.push(labelMap[h.sens] || '');
    if (h.energia) partes.push(`energia ${h.energia}/5`);
    if (h.foco)    partes.push(`foco ${h.foco}/5`);
    const li = document.createElement('li');
    li.className = 'log-hist-item';
    li.innerHTML = `
      <div class="log-hist-dot" data-v="${h.sens || 3}"></div>
      <div class="log-hist-info">
        <strong>${partes.join(' · ') || '—'}</strong>
        ${h.nota ? `<em>"${h.nota.slice(0, 80)}${h.nota.length > 80 ? '…' : ''}"</em>` : ''}
      </div>
      <span class="log-hist-data">${dia} · ${hora}</span>
    `;
    ul.appendChild(li);
  });
}

(function () {
  document.querySelectorAll('#sheet-log-humor .sensacao').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#sheet-log-humor .sensacao').forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      humorSens = parseInt(b.dataset.humorSens, 10);
      try { hap(6); } catch (e) {}
    });
  });
  document.querySelectorAll('#humor-energia .log-dot').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#humor-energia .log-dot').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      humorEnergia = parseInt(b.dataset.v, 10);
      try { hap(4); } catch (e) {}
    });
  });
  document.querySelectorAll('#humor-foco .log-dot').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#humor-foco .log-dot').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
      humorFoco = parseInt(b.dataset.v, 10);
      try { hap(4); } catch (e) {}
    });
  });

  const salvar = document.getElementById('humor-salvar');
  if (salvar) salvar.addEventListener('click', () => {
    const nota = document.getElementById('humor-nota')?.value || '';
    const registro = {
      sens: humorSens,
      energia: humorEnergia,
      foco: humorFoco,
      nota,
      ts: Date.now(),
    };
    try {
      const arr = JSON.parse(localStorage.getItem('circa_log_humor') || '[]');
      arr.push(registro);
      localStorage.setItem('circa_log_humor', JSON.stringify(arr));
    } catch (e) {}
    try { hap(14); } catch (e) {}
    if (typeof closeSheet === 'function') closeSheet();
    setTimeout(() => {
      const t = document.getElementById('log-ok-title');
      const s = document.getElementById('log-ok-sub');
      if (t) t.textContent = 'humor registrado.';
      const label = ['', 'muito mal', 'mal', 'ok', 'bem', 'incrível'][humorSens || 3];
      if (s) s.textContent = `sensação: ${label}${humorEnergia ? ' · energia ' + humorEnergia + '/5' : ''}${humorFoco ? ' · foco ' + humorFoco + '/5' : ''}`;
      if (typeof openSheet === 'function') openSheet('sheet-log-ok');
    }, 200);
  });
})();

// ───── LOG DE REFEIÇÃO ─────
let refMeal = null;
let refSens = null;

// ───── LOG DE REFEIÇÃO · plano de dieta do dia com check ─────
// plano diário de 4 refeições (modelo v0, pode ser customizado por dieta)
const REF_PLANO_HOJE = [
  { id: 'cafe',   hora: '07:30', nome: 'café da manhã', prato: 'ovos mexidos + aveia + frutas vermelhas', kcal: 420 },
  { id: 'almoco', hora: '13:00', nome: 'almoço',        prato: 'frango grelhado + arroz integral + legumes', kcal: 650 },
  { id: 'lanche', hora: '16:30', nome: 'lanche',        prato: 'iogurte natural + castanhas + banana', kcal: 280 },
  { id: 'jantar', hora: '20:00', nome: 'jantar',        prato: 'salmão + batata-doce + salada verde', kcal: 580 },
];

function chaveDoDia() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getRefStatusDoDia() {
  try {
    const raw = localStorage.getItem('circa_ref_dia_' + chaveDoDia());
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function setRefStatusDoDia(obj) {
  try { localStorage.setItem('circa_ref_dia_' + chaveDoDia(), JSON.stringify(obj)); } catch (e) {}
}

function renderRefPlano() {
  const ul = document.getElementById('ref-plano');
  if (!ul) return;
  const status = getRefStatusDoDia();
  ul.innerHTML = '';
  REF_PLANO_HOJE.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'ref-item' + (status[m.id] ? ' is-done' : '');
    li.innerHTML = `
      <button class="ref-check" aria-label="marcar como feito"></button>
      <div class="ref-info">
        <div class="ref-top">
          <span class="ref-hora">${m.hora}</span>
          <span class="ref-nome">${m.nome}</span>
        </div>
        <div class="ref-prato">${m.prato}</div>
        <div class="ref-kcal">~${m.kcal} kcal</div>
      </div>
    `;
    li.querySelector('.ref-check').addEventListener('click', () => {
      const st = getRefStatusDoDia();
      st[m.id] = st[m.id] ? 0 : Date.now();
      setRefStatusDoDia(st);
      li.classList.toggle('is-done', !!st[m.id]);
      try { hap(8); } catch (e) {}
      renderRefProgresso();
    });
    ul.appendChild(li);
  });
  renderRefProgresso();
}

function renderRefProgresso() {
  const ul = document.getElementById('ref-plano');
  if (!ul) return;
  const status = getRefStatusDoDia();
  const feitos = REF_PLANO_HOJE.filter(m => status[m.id]).length;
  // injeta/atualiza um header de progresso acima da lista
  let head = document.getElementById('ref-prog');
  if (!head) {
    head = document.createElement('div');
    head.id = 'ref-prog';
    head.className = 'ref-prog';
    ul.parentElement.insertBefore(head, ul);
  }
  const pct = Math.round((feitos / REF_PLANO_HOJE.length) * 100);
  head.innerHTML = `
    <div class="ref-prog__top">
      <span>${feitos} de ${REF_PLANO_HOJE.length} refeições</span>
      <b>${pct}%</b>
    </div>
    <div class="ref-prog__bar"><i style="width:${pct}%"></i></div>
  `;
}

function abrirLogRefeicao() {
  renderRefPlano();
  const nota = document.getElementById('ref-nota');
  if (nota) nota.value = '';
  if (typeof openSheet === 'function') openSheet('sheet-log-refeicao');
}

// ═════════════════════════════════════════════════════════
// ENGINE DE SCORE/INSIGHTS DINÂMICOS · lê logs salvos e gera análise
// ═════════════════════════════════════════════════════════
function _getLogs() {
  const read = (k) => {
    try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; }
  };
  return {
    sono: read('circa_log_sono'),
    humor: read('circa_log_humor'),
    treino: read('circa_workout_log'),
    refeicao: read('circa_log_refeicao'),
    aguaHoje: parseInt(localStorage.getItem('circa_agua_hoje') || '1800', 10),
    aguaMeta: 2800,
  };
}

function calcularScoreDinamico() {
  const d = _getLogs();

  let corpo = 50;
  const lastSono = d.sono[d.sono.length - 1];
  if (lastSono && lastSono.dur) {
    const m = lastSono.dur.match(/(\d+)h/);
    const h = m ? parseInt(m[1], 10) : 0;
    if (h >= 7 && h <= 9) corpo += 18;
    else if (h >= 6) corpo += 8;
    else corpo -= 5;
    if (lastSono.qualidade) corpo += (lastSono.qualidade - 3) * 4;
  }
  const treinosHoje = d.treino.filter(t => new Date(t.data).toDateString() === new Date().toDateString());
  if (treinosHoje.length) corpo += 15;
  const pctAgua = Math.min(1, d.aguaHoje / d.aguaMeta);
  corpo += Math.round(pctAgua * 12);

  let mente = 50;
  const lastHumor = d.humor[d.humor.length - 1];
  if (lastHumor) {
    mente += ((lastHumor.sens || 3) - 3) * 8;
    if (lastHumor.energia) mente += (lastHumor.energia - 3) * 3;
    if (lastHumor.foco)    mente += (lastHumor.foco - 3) * 3;
  }

  let espirito = 60;
  try {
    const profile = JSON.parse(localStorage.getItem('circa_profile') || '{}');
    if (profile && Object.keys(profile).length) espirito += 10;
  } catch (e) {}
  if (lastSono && lastSono.sens >= 4) espirito += 8;
  if (treinosHoje.length && treinosHoje[treinosHoje.length - 1].sensacao >= 4) espirito += 8;

  corpo    = Math.max(0, Math.min(100, Math.round(corpo)));
  mente    = Math.max(0, Math.min(100, Math.round(mente)));
  espirito = Math.max(0, Math.min(100, Math.round(espirito)));
  const total = Math.round(corpo * 0.4 + mente * 0.35 + espirito * 0.25);

  return { total, corpo, mente, espirito, logs: d };
}

function gerarInsightsDinamicos() {
  const s = calcularScoreDinamico();
  const d = s.logs;
  const ins = [];

  const lastSono = d.sono[d.sono.length - 1];
  if (lastSono) {
    const m = lastSono.dur && lastSono.dur.match(/(\d+)h\s*(\d+)min/);
    const totalMin = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0;
    if (totalMin > 0 && totalMin < 420) {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `dormiu ${lastSono.dur}, abaixo da meta. teu corpo tá pedindo 7h.` });
    } else if (totalMin >= 420 && totalMin <= 540) {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `${lastSono.dur} de sono, dentro da meta. recuperação ok.` });
    }
    if (lastSono.cafeina === 'sim') {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `cafeína após 14h ontem. sono costuma ficar mais fragmentado.` });
    }
  } else {
    ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `registra teu sono pro circa começar a cruzar padrões.` });
  }

  const lastHumor = d.humor[d.humor.length - 1];
  if (lastHumor && lastHumor.sens) {
    if (lastHumor.sens <= 2) {
      ins.push({ tag: 'mente', cor: '#E8A87C', txt: `humor baixo no último check-in. movimento e sol costumam ajudar.` });
    } else if (lastHumor.sens >= 4) {
      ins.push({ tag: 'mente', cor: '#E8A87C', txt: `humor alto no último check-in. observa o que tá puxando.` });
    }
  } else {
    ins.push({ tag: 'mente', cor: '#E8A87C', txt: `check-in rápido de humor ajuda o circa a cruzar com teu dia.` });
  }

  const treinosHoje = d.treino.filter(t => new Date(t.data).toDateString() === new Date().toDateString());
  if (treinosHoje.length) {
    const t = treinosHoje[treinosHoje.length - 1];
    if (t.intensidade >= 4) {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `treino intenso hoje. hidrata mais e cuida do sono à noite.` });
    } else if (t.intensidade) {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `treino moderado hoje. consistência vale mais que intensidade.` });
    }
  } else if (d.treino.length) {
    const last = d.treino[d.treino.length - 1];
    const diasAtras = Math.floor((Date.now() - new Date(last.data).getTime()) / (24 * 60 * 60 * 1000));
    if (diasAtras >= 2) {
      ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `último treino há ${diasAtras} dias. corpo pedindo movimento.` });
    }
  }

  const pctAgua = (d.aguaHoje / d.aguaMeta) * 100;
  if (pctAgua < 60) {
    ins.push({ tag: 'corpo', cor: '#7B8BB8', txt: `${Math.round(pctAgua)}% da meta de água. mira 500ml nas próximas horas.` });
  }

  const refHoje = d.refeicao.filter(r => new Date(r.ts).toDateString() === new Date().toDateString());
  if (!refHoje.length) {
    ins.push({ tag: 'mente', cor: '#E8A87C', txt: `nenhuma refeição registrada hoje. alimentação afeta humor direto.` });
  }

  return { score: s, insights: ins };
}

function atualizarJornadaComLogs() {
  const r = gerarInsightsDinamicos();
  const s = r.score;

  // título do ritual e greet personalizados com o nome
  const nomeUser = (typeof USER_NAME === 'string' && USER_NAME && USER_NAME.toLowerCase() !== 'você')
    ? USER_NAME.split(' ')[0]
    : 'você';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'bom dia' : hora < 18 ? 'boa tarde' : 'boa noite';

  const ritTitulo = document.getElementById('j-ritual-titulo');
  if (ritTitulo) {
    ritTitulo.textContent = nomeUser === 'você' ? 'como foi seu dia?' : `como foi seu dia, ${nomeUser}?`;
  }
  const jGreet = document.getElementById('j-greet');
  if (jGreet) {
    jGreet.textContent = nomeUser === 'você' ? saudacao : `${saudacao}, ${nomeUser}`;
  }

  const heroVal = document.getElementById('j-hero-value');
  const ringFill = document.getElementById('j-ring-fill');
  if (heroVal) heroVal.textContent = s.total;
  if (ringFill) ringFill.setAttribute('stroke-dasharray', `${s.total} 100`);

  const tripe = document.querySelectorAll('.jsec-tripe .jt b');
  if (tripe[0]) tripe[0].textContent = s.corpo;
  if (tripe[1]) tripe[1].textContent = s.mente;
  if (tripe[2]) tripe[2].textContent = s.espirito;

  const updates = [
    { val: 'j-score-corpo',    ring: 'j-ring-corpo',    v: s.corpo },
    { val: 'j-score-mente',    ring: 'j-ring-mente',    v: s.mente },
    { val: 'j-score-espirito', ring: 'j-ring-espirito', v: s.espirito },
  ];
  updates.forEach(u => {
    const el = document.getElementById(u.val);
    const ring = document.getElementById(u.ring);
    if (el) el.textContent = u.v;
    if (ring) ring.setAttribute('stroke-dasharray', `${u.v} 100`);
  });

  const list = document.querySelector('.j-insights-list');
  if (list) {
    list.innerHTML = '';
    r.insights.slice(0, 5).forEach(ins => {
      const div = document.createElement('div');
      div.className = 'j-insight';
      div.style.borderLeftColor = ins.cor;
      div.innerHTML = `<p class="j-insight-lbl" style="color:${ins.cor}"><i class="j-ins-dot" style="background:${ins.cor}"></i>${ins.tag}</p><p class="j-insight-text">${ins.txt}</p>`;
      list.appendChild(div);
    });
  }
}

function abrirScoreBreakdown() {
  const r = gerarInsightsDinamicos();
  const s = r.score;
  const d = s.logs;

  document.getElementById('sbd-total').textContent = s.total;

  const partes = [];
  if (d.sono.length) partes.push('sono');
  if (d.humor.length) partes.push('humor');
  if (d.treino.length) partes.push('treino');
  if (d.refeicao.length) partes.push('refeição');
  partes.push('água');
  document.getElementById('sbd-resumo').textContent = partes.length > 1
    ? `cruzando ${partes.join(', ')}.`
    : `comece a registrar pra ficar mais preciso.`;

  const ul = document.getElementById('sbd-composicao');
  ul.innerHTML = '';
  const comp = [
    { lbl: 'corpo',    val: s.corpo,    peso: '40%', cor: '#7B8BB8' },
    { lbl: 'mente',    val: s.mente,    peso: '35%', cor: '#E8A87C' },
    { lbl: 'espírito', val: s.espirito, peso: '25%', cor: '#A89CC8' },
  ];
  comp.forEach(c => {
    const li = document.createElement('li');
    li.className = 'sbd-item';
    li.style.setProperty('--c', c.cor);
    li.innerHTML = `
      <span class="sbd-item__dot" style="background:${c.cor}"></span>
      <span class="sbd-item__lbl">${c.lbl}</span>
      <span class="sbd-item__val">${c.val}</span>
      <span class="sbd-item__sub">${c.peso}</span>
    `;
    ul.appendChild(li);
  });

  const motivos = document.getElementById('sbd-motivos');
  motivos.innerHTML = '';
  r.insights.slice(0, 4).forEach(ins => {
    const li = document.createElement('li');
    li.textContent = ins.txt;
    motivos.appendChild(li);
  });

  if (typeof openSheet === 'function') openSheet('sheet-score-breakdown');
}

(function () {
  const btn = document.getElementById('j-hero-btn');
  if (btn) btn.addEventListener('click', (e) => {
    e.preventDefault();
    try { hap(10); } catch (er) {}
    abrirScoreBreakdown();
  });
})();

function abrirDimDetalhes(dim) {
  const r = gerarInsightsDinamicos();
  const s = r.score;
  const d = s.logs;
  const cores = { corpo: '#7B8BB8', mente: '#E8A87C', espirito: '#A89CC8' };
  const titulos = { corpo: 'corpo', mente: 'mente', espirito: 'espírito' };
  const subs = {
    corpo: 'sono, treino, hidratação e suplementação.',
    mente: 'humor, energia, foco.',
    espirito: 'propósito, conexões, rituais.',
  };

  document.getElementById('dim-eye').textContent = 'dimensão';
  const t = document.getElementById('dim-title');
  t.textContent = titulos[dim] || dim;
  t.style.color = cores[dim] || 'var(--fg)';
  document.getElementById('dim-sub').textContent = subs[dim] || '';

  const bd = document.getElementById('dim-breakdown');
  bd.innerHTML = '';

  if (dim === 'corpo') {
    const lastSono = d.sono[d.sono.length - 1];
    const treinosHoje = d.treino.filter(t => new Date(t.data).toDateString() === new Date().toDateString());
    const metrics = [
      { lbl: 'sono',    val: lastSono ? lastSono.dur : '—',           desc: lastSono ? `qualidade ${lastSono.qualidade || '—'}/5` : 'não registrado' },
      { lbl: 'água',    val: `${(d.aguaHoje/1000).toFixed(1)}L`,       desc: `meta ${(d.aguaMeta/1000).toFixed(1)}L · ${Math.round(d.aguaHoje/d.aguaMeta*100)}%` },
      { lbl: 'treino',  val: treinosHoje.length ? (treinosHoje[0].duracaoMin ? `${treinosHoje[0].duracaoMin}min` : 'feito') : '—', desc: treinosHoje.length ? `intensidade ${treinosHoje[0].intensidade || '—'}/5` : 'sem treino hoje' },
      { lbl: 'suplementos', val: '1/3', desc: 'creatina · 2 pendentes' },
    ];
    bd.innerHTML = `<div class="j-metrics">${metrics.map(m => `
      <div class="j-card"><p class="j-card-lbl">${m.lbl}</p><p class="j-card-val">${m.val}</p><p class="j-card-desc">${m.desc}</p></div>
    `).join('')}</div>`;
  }

  if (dim === 'mente') {
    const lastHumor = d.humor[d.humor.length - 1];
    const emojiMap = { 1:'😩', 2:'😕', 3:'😐', 4:'🙂', 5:'🔥' };
    const labelMap = { 1:'muito mal', 2:'mal', 3:'ok', 4:'bem', 5:'incrível' };
    bd.innerHTML = `
      <div class="j-metrics">
        <div class="j-card"><p class="j-card-lbl">humor</p><p class="j-card-val">${lastHumor?.sens ? emojiMap[lastHumor.sens] : '—'}</p><p class="j-card-desc">${lastHumor?.sens ? labelMap[lastHumor.sens] : 'não registrado'}</p></div>
        <div class="j-card"><p class="j-card-lbl">energia</p><p class="j-card-val">${lastHumor?.energia || '—'}<span>/5</span></p><p class="j-card-desc">último check-in</p></div>
        <div class="j-card"><p class="j-card-lbl">foco</p><p class="j-card-val">${lastHumor?.foco || '—'}<span>/5</span></p><p class="j-card-desc">último check-in</p></div>
        <div class="j-card"><p class="j-card-lbl">registros</p><p class="j-card-val">${d.humor.length}</p><p class="j-card-desc">total de check-ins</p></div>
      </div>`;
  }

  if (dim === 'espirito') {
    bd.innerHTML = `
      <p class="j-small" style="margin-top:0">o que tocou você hoje?</p>
      <div class="j-areas">
        <div class="j-area is-on">fé</div>
        <div class="j-area">silêncio</div>
        <div class="j-area">natureza</div>
        <div class="j-area">conexão</div>
        <div class="j-area">propósito</div>
        <div class="j-area">gratidão</div>
      </div>`;
    bd.querySelectorAll('.j-area').forEach((a) => {
      a.addEventListener('click', () => a.classList.toggle('is-on'));
    });
  }

  const ul = document.getElementById('dim-insights');
  ul.innerHTML = '';
  r.insights.filter(i => i.tag === dim).slice(0, 3).forEach(ins => {
    const li = document.createElement('li');
    li.textContent = ins.txt;
    ul.appendChild(li);
  });
  if (!ul.children.length) {
    const li = document.createElement('li');
    li.textContent = 'registra mais logs pra circa começar a cruzar padrões.';
    ul.appendChild(li);
  }

  if (typeof openSheet === 'function') openSheet('sheet-dim-detalhes');
}

(function () {
  document.querySelectorAll('.j-dim-btn, .j-ver-detalhes').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const dim = btn.dataset.dim;
      if (!dim) return;
      try { hap(8); } catch (er) {}
      abrirDimDetalhes(dim);
    });
  });
})();

// botão C da nav abre o chat
(function () {
  const jCirca = document.getElementById('j-nav-circa');
  if (!jCirca) return;
  const fresh = jCirca.cloneNode(true);
  jCirca.parentNode.replaceChild(fresh, jCirca);
  fresh.addEventListener('click', () => {
    try { hap(10); } catch (e) {}
    if (typeof tocarSomCirca === 'function') tocarSomCirca();
    if (typeof openChat === 'function') setTimeout(() => openChat(), 120);
  });
})();

// perfil consolidado
function renderPerfilMental() {
  let profile = {};
  try { profile = JSON.parse(localStorage.getItem('circa_profile') || '{}'); } catch (e) {}
  const humorArr = (() => { try { return JSON.parse(localStorage.getItem('circa_log_humor') || '[]'); } catch (e) { return []; } })();
  const lastHumor = humorArr[humorArr.length - 1];
  const pane = document.getElementById('perfil-mental');
  if (!pane) return;
  pane.innerHTML = `
    <div class="perfil-group">
      <p class="perfil-group__head">perfil de motivação</p>
      <div class="perfil-row"><span class="perfil-row__lbl">arquétipo</span><span class="perfil-row__val">${profile.nome || profile.label || profile.perfil || 'em construção'}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">energia média</span><span class="perfil-row__val">${lastHumor?.energia ? lastHumor.energia + '/5' : '—'}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">foco médio</span><span class="perfil-row__val">${lastHumor?.foco ? lastHumor.foco + '/5' : '—'}</span></div>
    </div>
    <div class="perfil-group">
      <p class="perfil-group__head">humor recente</p>
      ${(!humorArr.length
        ? '<div class="perfil-row"><span class="perfil-row__lbl">sem registros ainda</span></div>'
        : humorArr.slice(-5).reverse().map(h => {
            const emoji = { 1:'😩', 2:'😕', 3:'😐', 4:'🙂', 5:'🔥' }[h.sens] || '—';
            const quando = new Date(h.ts).toLocaleDateString('pt-BR', { day:'numeric', month:'short' });
            return `<div class="perfil-row"><span class="perfil-row__lbl">${quando}</span><span class="perfil-row__val">${emoji}</span></div>`;
          }).join(''))}
    </div>
  `;
}

function renderPerfilSaude() {
  let fisio = {};
  try { fisio = JSON.parse(localStorage.getItem('circa_fisio') || '{}'); } catch (e) {}
  const sonoArr = (() => { try { return JSON.parse(localStorage.getItem('circa_log_sono') || '[]'); } catch (e) { return []; } })();
  const mediaDuMin = (() => {
    if (!sonoArr.length) return null;
    const mins = sonoArr.slice(-7).map(s => {
      const m = s.dur && s.dur.match(/(\d+)h\s*(\d+)min/);
      return m ? parseInt(m[1],10)*60 + parseInt(m[2],10) : 0;
    }).filter(n => n > 0);
    if (!mins.length) return null;
    return Math.round(mins.reduce((a,b) => a+b, 0) / mins.length);
  })();

  const pane = document.getElementById('perfil-saude');
  if (!pane) return;
  pane.innerHTML = `
    <div class="perfil-group">
      <p class="perfil-group__head">exames (último)</p>
      <div class="perfil-row"><span class="perfil-row__lbl">homocisteína</span><span class="perfil-row__val">28 µmol/L</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">ferritina</span><span class="perfil-row__val">484 ng/mL</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">idade biológica</span><span class="perfil-row__val">30.8 anos</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">marcadores ok</span><span class="perfil-row__val">45/47</span></div>
    </div>
    <div class="perfil-group">
      <p class="perfil-group__head">sono (últimos 7 dias)</p>
      <div class="perfil-row"><span class="perfil-row__lbl">média</span><span class="perfil-row__val">${mediaDuMin ? `${Math.floor(mediaDuMin/60)}h${String(mediaDuMin%60).padStart(2,'0')}` : '—'}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">registros</span><span class="perfil-row__val">${sonoArr.length}</span></div>
    </div>
    <div class="perfil-group">
      <p class="perfil-group__head">fisio (onboarding)</p>
      <div class="perfil-row"><span class="perfil-row__lbl">trilha</span><span class="perfil-row__val">${fisio.trilha || '—'}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">pontuação</span><span class="perfil-row__val">${fisio.score != null ? fisio.score + '/30' : '—'}</span></div>
    </div>
  `;
}

function renderPerfilFisico() {
  let profile = {};
  try { profile = JSON.parse(localStorage.getItem('circa_profile') || '{}'); } catch (e) {}
  const treinoArr = (() => { try { return JSON.parse(localStorage.getItem('circa_workout_log') || '[]'); } catch (e) { return []; } })();
  const ultimoTreino = treinoArr[treinoArr.length - 1];
  const treinosSemana = treinoArr.filter(t => (Date.now() - new Date(t.data).getTime()) < 7 * 24 * 60 * 60 * 1000);

  const pane = document.getElementById('perfil-fisico');
  if (!pane) return;
  pane.innerHTML = `
    <div class="perfil-group">
      <p class="perfil-group__head">composição corporal</p>
      <div class="perfil-row"><span class="perfil-row__lbl">idade real</span><span class="perfil-row__val">${profile.idade || '32'} anos</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">altura</span><span class="perfil-row__val">${profile.altura || '1.80'} m</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">peso</span><span class="perfil-row__val">${profile.peso || '78'} kg</span></div>
    </div>
    <div class="perfil-group">
      <p class="perfil-group__head">atividade</p>
      <div class="perfil-row"><span class="perfil-row__lbl">último treino</span><span class="perfil-row__val">${ultimoTreino ? new Date(ultimoTreino.data).toLocaleDateString('pt-BR', { day:'numeric', month:'short' }) : '—'}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">treinos semana</span><span class="perfil-row__val">${treinosSemana.length}</span></div>
      <div class="perfil-row"><span class="perfil-row__lbl">total registrados</span><span class="perfil-row__val">${treinoArr.length}</span></div>
    </div>
  `;
}

function abrirPerfil() {
  renderPerfilMental();
  renderPerfilSaude();
  renderPerfilFisico();
  if (typeof openSheet === 'function') openSheet('sheet-perfil');
}

(function () {
  document.querySelectorAll('.perfil-tab').forEach((t) => {
    t.addEventListener('click', () => {
      const tab = t.dataset.perfilTab;
      document.querySelectorAll('.perfil-tab').forEach(x => x.classList.toggle('is-on', x === t));
      document.querySelectorAll('.perfil-pane').forEach(p => p.classList.toggle('is-on', p.dataset.perfilPane === tab));
      try { hap(4); } catch (e) {}
    });
  });
  const btn = document.getElementById('j-abrir-perfil');
  if (btn) btn.addEventListener('click', () => {
    try { hap(10); } catch (e) {}
    abrirPerfil();
  });
})();

// hook: toda vez que abrir a jornada, atualiza com dados frescos
(function () {
  const _origOpen = window.openJornada;
  if (typeof _origOpen !== 'function') return;
  window.openJornada = function () {
    _origOpen();
    setTimeout(() => {
      try { atualizarJornadaComLogs(); } catch (e) {}
      try { clubDesenharMiniRodas(); } catch (e) {}
    }, 80);
  };
})();

// ═════════════════════════════════════════════════════════
// CLUB CIRCA · tabs, filtros, modal, toast, mini rodas
// ═════════════════════════════════════════════════════════
(function () {
  // tabs
  document.querySelectorAll('#j-club .club-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const kind = tab.dataset.clubTab;
      document.querySelectorAll('#j-club .club-tab').forEach((t) => t.classList.toggle('is-on', t === tab));
      document.querySelectorAll('#j-club .club-pane').forEach((p) => p.classList.toggle('is-on', p.dataset.clubPane === kind));
      try { hap(6); } catch (e) {}
      // redesenha mini rodas quando volta pro feed
      if (kind === 'feed') setTimeout(clubDesenharMiniRodas, 80);
    });
  });

  // filtros de selo
  document.querySelectorAll('#j-club .club-filtro').forEach((f) => {
    f.addEventListener('click', () => {
      const tipo = f.dataset.clubFiltro;
      document.querySelectorAll('#j-club .club-filtro').forEach((x) => x.classList.toggle('is-on', x === f));
      document.querySelectorAll('#j-club .club-post').forEach((p) => {
        p.style.display = (tipo === 'todos' || p.dataset.selo === tipo) ? '' : 'none';
      });
      try { hap(4); } catch (e) {}
    });
  });

  // mensagem a portador
  document.querySelectorAll('[data-club-msg]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nome = btn.dataset.clubMsg;
      const sub = btn.dataset.clubSub || '';
      document.getElementById('club-modal-titulo').textContent = 'mensagem para ' + nome;
      document.getElementById('club-modal-sub').textContent = sub;
      document.getElementById('club-modal-input').value = '';
      document.getElementById('club-modal').classList.add('is-open');
      document.getElementById('club-modal').setAttribute('aria-hidden', 'false');
      try { hap(8); } catch (er) {}
    });
  });

  // fechar modal
  document.querySelectorAll('[data-club-close]').forEach((el) => {
    el.addEventListener('click', () => {
      document.getElementById('club-modal').classList.remove('is-open');
      document.getElementById('club-modal').setAttribute('aria-hidden', 'true');
    });
  });

  // enviar mensagem
  const sendBtn = document.getElementById('club-modal-send');
  if (sendBtn) sendBtn.addEventListener('click', () => {
    const txt = document.getElementById('club-modal-input').value.trim();
    if (!txt) { clubToast('✕', 'escreva algo antes de enviar'); return; }
    document.getElementById('club-modal').classList.remove('is-open');
    document.getElementById('club-modal').setAttribute('aria-hidden', 'true');
    try { hap(14); } catch (e) {}
    clubToast('💬', 'mensagem enviada');
  });

  // gestos (plantar, salvar, confirmar presença, etc)
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-club-gesto]');
    if (!g) return;
    // ignora se está dentro do modal fechado ou não visível
    if (!document.getElementById('j-club')) return;
    e.stopPropagation();
    const icon = g.dataset.clubGesto || '';
    const alvo = g.dataset.clubAlvo || '';
    const splitAt = icon.indexOf(' ');
    const emoji = splitAt > 0 ? icon.slice(0, splitAt) : icon;
    const texto = alvo || (splitAt > 0 ? icon.slice(splitAt + 1) : '');
    try { hap(8); } catch (er) {}
    clubToast(emoji, texto);
  });

  function clubToast(icon, texto) {
    const t = document.getElementById('club-toast');
    if (!t) return;
    t.textContent = `${icon}  ${texto}`;
    t.classList.add('is-on');
    clearTimeout(clubToast._t);
    clubToast._t = setTimeout(() => { t.classList.remove('is-on'); }, 2800);
  }
})();

// mini rodas nos cards do club (canvas 70x70)
function clubDesenharMiniRodas() {
  const configs = [
    { dims: [94, 91, 90, 88, 86], cor: '#D4B896' }, // portador · champanhe
    { dims: [91, 88, 82, 87, 85], cor: '#8FA87C' }, // enraizado · verde
    { dims: [92, 89, 84, 79, 76], cor: '#A89CC8' }, // cultivado · lavanda
  ];
  document.querySelectorAll('#j-club canvas[data-club-roda]').forEach((canvas) => {
    const idx = parseInt(canvas.dataset.clubRoda, 10);
    const cfg = configs[idx];
    if (!cfg) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const maxR = W * 0.38;
    const n = cfg.dims.length;
    ctx.clearRect(0, 0, W, H);
    // anéis de grade
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * r / 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,184,150,0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    // polígono
    ctx.beginPath();
    cfg.dims.forEach((v, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = maxR * (v / 100);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    const cor = cfg.cor;
    const r2 = parseInt(cor.slice(1, 3), 16);
    const g2 = parseInt(cor.slice(3, 5), 16);
    const b2 = parseInt(cor.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r2},${g2},${b2},0.14)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${r2},${g2},${b2},0.6)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // pontos
    cfg.dims.forEach((v, i) => {
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r = maxR * (v / 100);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = cor;
      ctx.fill();
    });
  });
}

// desenha também quando a seção club fica visível (via IntersectionObserver)
(function () {
  const club = document.getElementById('j-club');
  if (!club) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) clubDesenharMiniRodas(); });
  }, { threshold: 0.2 });
  obs.observe(club);
})();

// ═════════════════════════════════════════════════════════
// APPLE MODE · 3 anéis concêntricos no hero (Apple Activity)
// gold (overall) · blue (sono) · orange (treino)
// ═════════════════════════════════════════════════════════
(function () {
  if (!document.body.classList.contains('apple-mode')) return;

  const RINGS = [
    // {color, percent, radius, stroke, gradId}
    { id: 'rGold',   pct: 78, r: 108, w: 16, c1: '#E8C9A0', c2: '#B89572' }, // overall
    { id: 'rBlue',   pct: 65, r: 84,  w: 14, c1: '#9BAAD4', c2: '#7B8BB8' }, // sono
    { id: 'rOrange', pct: 84, r: 60,  w: 13, c1: '#F4BE94', c2: '#E8A87C' }, // treino
  ];

  function buildAppleRings(svg) {
    if (!svg || svg.dataset.appleRings === '1') return;
    svg.dataset.appleRings = '1';

    // pega/cria <defs>
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    // adiciona gradientes únicos pros 3 anéis (ids únicos por svg)
    const uid = Math.random().toString(36).slice(2, 8);
    RINGS.forEach((ring, i) => {
      const gradId = `${ring.id}-${uid}`;
      ring._gradId = gradId;
      // se já existe (re-render), pula
      if (defs.querySelector('#' + gradId)) return;
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
      grad.innerHTML = `
        <stop offset="0%" stop-color="${ring.c1}"/>
        <stop offset="100%" stop-color="${ring.c2}"/>
      `;
      defs.appendChild(grad);
    });

    // grupo dos anéis com rotate -90 (começa às 12h)
    let group = svg.querySelector('.apple-rings-group');
    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'apple-rings-group');
      group.setAttribute('transform', 'rotate(-90 120 120)');
      svg.appendChild(group);
    }

    RINGS.forEach((ring, i) => {
      const C = 2 * Math.PI * ring.r;
      const dash = (ring.pct / 100) * C;

      // track (background do anel)
      const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      track.setAttribute('class', 'arc-track');
      track.setAttribute('cx', '120'); track.setAttribute('cy', '120');
      track.setAttribute('r', String(ring.r));
      track.setAttribute('stroke', `url(#${ring._gradId})`);
      track.setAttribute('stroke-width', String(ring.w));
      group.appendChild(track);

      // fill (preenchimento animado)
      const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      fill.setAttribute('class', 'arc-fill');
      fill.setAttribute('cx', '120'); fill.setAttribute('cy', '120');
      fill.setAttribute('r', String(ring.r));
      fill.setAttribute('stroke', `url(#${ring._gradId})`);
      fill.setAttribute('stroke-width', String(ring.w));
      fill.setAttribute('stroke-dasharray', `${dash.toFixed(1)} ${C.toFixed(1)}`);
      fill.setAttribute('data-ring', String(i));
      // cor pro drop-shadow do CSS via currentColor
      fill.style.color = ring.c1;
      group.appendChild(fill);
    });

    // marca o hero pra esconder o ring v1
    const hero = svg.closest('.hero');
    if (hero) hero.classList.add('has-apple-rings');
  }

  function aplicarAneisApple() {
    document.querySelectorAll('.hero .ring').forEach((oldRing) => {
      const svg = oldRing.cloneNode(false);
      svg.removeAttribute('class');
      svg.setAttribute('class', 'ring-apple');
      svg.setAttribute('viewBox', '0 0 240 240');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      // injeta dentro do mesmo .hero (irmão do .ring antigo)
      const hero = oldRing.closest('.hero');
      if (!hero || hero.querySelector('.ring-apple')) return;
      // insere antes do ring antigo
      hero.insertBefore(svg, oldRing);
      buildAppleRings(svg);
    });
  }

  // tenta agora · roda de novo quando jornada abre (hero novo)
  aplicarAneisApple();
  const _origOpen2 = window.openJornada;
  if (typeof _origOpen2 === 'function') {
    window.openJornada = function () {
      _origOpen2();
      setTimeout(aplicarAneisApple, 100);
    };
  }
})();

// ═════════════════════════════════════════════════════════
// TEMPERAMENTO · 5 cenários + processando + revelação
// substitui o quiz antigo de perfil (steps 12-20) com algo mais elegante
// ═════════════════════════════════════════════════════════
const TEMPERAMENTOS = {
  corrente: {
    nome: 'corrente',
    cor:  '232,201,160', // E8C9A0
    manifesto: 'você é o que se move,<br/>o que conecta,<br/>o que abre caminho onde havia parede.',
    detalhes: [
      { n: 'I',   t: 'sua <strong>energia vem do encontro</strong>. você se acende com gente, com novidade, com o mundo.' },
      { n: 'II',  t: 'no esforço, você precisa de <strong>variedade</strong>. mesma rotina te apaga. mudança te acende.' },
      { n: 'III', t: 'no espírito, é o <strong>convívio</strong> que te toca. uma conversa boa vale uma meditação.' },
    ],
    chamado: '"vou te lembrar, sempre, que parar também é movimento."',
  },
  brasa: {
    nome: 'brasa',
    cor:  '232,168,124', // E8A87C
    manifesto: 'você é o que arde,<br/>o que constrói,<br/>o que transforma intenção em forma.',
    detalhes: [
      { n: 'I',   t: 'sua <strong>energia vem do propósito</strong>. você se move pelo que precisa existir, não pelo que é fácil.' },
      { n: 'II',  t: 'na frustração, você <strong>age</strong>. transforma dor em produção, refaz com mais força.' },
      { n: 'III', t: 'no espírito, é a <strong>conquista</strong> que te toca. realizar algo difícil é seu sagrado.' },
    ],
    chamado: '"vou te lembrar, sempre, que o que não é construído também tem valor."',
  },
  raiz: {
    nome: 'raiz',
    cor:  '168,156,200', // A89CC8
    manifesto: 'você é o que aprofunda,<br/>o que sente,<br/>o que entende antes de agir.',
    detalhes: [
      { n: 'I',   t: 'sua <strong>energia vem do silêncio</strong>. você se restaura no recolhimento, não no estímulo.' },
      { n: 'II',  t: 'na frustração, você <strong>processa antes de mover</strong>. precisa sentir pra entender, e entender pra agir.' },
      { n: 'III', t: 'no espírito, é a <strong>contemplação</strong> que te toca. um pôr do sol, um silêncio profundo.' },
    ],
    chamado: '"vou te lembrar, sempre, que sentir não precisa custar tanto."',
  },
  mare: {
    nome: 'maré',
    cor:  '123,139,184', // 7B8BB8
    manifesto: 'você é o que volta,<br/>o que sustenta,<br/>o que dura quando outros se cansam.',
    detalhes: [
      { n: 'I',   t: 'sua <strong>energia vem do ritmo</strong>. você sustenta o que outros começam e abandonam.' },
      { n: 'II',  t: 'na frustração, você <strong>contém e segue</strong>. evita confronto, mas não desiste do plano.' },
      { n: 'III', t: 'no espírito, é a <strong>presença</strong> que te toca. uma rotina simples cumprida em paz.' },
    ],
    chamado: '"vou te lembrar, sempre, que mover também é cuidar."',
  },
};

const temprScore = { corrente: 0, brasa: 0, raiz: 0, mare: 0 };
let temprProcRAF = null;
let temprRevRAF  = null;

(function () {
  // memória da seleção atual por cenário · permite trocar de opção sem inflar score
  const temprSelByCen = {};   // { 1: 'brasa', 2: 'corrente', ... }

  // wiring das opções dos 5 cenários · agora SEM auto-advance
  // (cards portrait num swiper precisam ser navegáveis · usuário clica em "continuar" pra avançar)
  document.querySelectorAll('.tempr-opcao[data-temp]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cen  = parseInt(btn.dataset.cen, 10);
      const temp = btn.dataset.temp;

      // primeiro cenário · primeiro click: reseta tudo
      if (cen === 1 && !temprSelByCen[1]) {
        Object.keys(temprScore).forEach((k) => { temprScore[k] = 0; });
      }

      // se já havia uma seleção pra este cenário, remove o ponto antigo
      const prev = temprSelByCen[cen];
      if (prev) {
        temprScore[prev] = Math.max(0, (temprScore[prev] || 0) - 1);
      }

      // visual: marca selecionada (single-select dentro do slide)
      const slide = btn.closest('.tempr-slide');
      if (slide) slide.querySelectorAll('.tempr-opcao').forEach((o) => o.classList.remove('is-on', 'is-sel'));
      btn.classList.add('is-on');

      // pontua novo
      temprScore[temp] = (temprScore[temp] || 0) + 1;
      temprSelByCen[cen] = temp;

      // habilita continuar
      if (slide) {
        const next = slide.querySelector('.ob-next');
        if (next) next.disabled = false;
      }
      try { hap(8); } catch (e) {}
    });
  });

  // dispatch das telas processing (46) e reveal (47) · roda depois que o std .ob-next
  // handler chamou nextStep · timeout pequeno pra ordem das ações no event loop
  document.querySelectorAll('.tempr-slide .ob-next').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      setTimeout(() => {
        if (typeof obStep === 'undefined') return;
        if (obStep === 46) setTimeout(temprStartProc, 100);
        if (obStep === 47) setTimeout(temprRender, 200);
      }, 30);
    });
  });

  // botão final (continuar) na tela de revelação
  const continuar = document.getElementById('tempr-rev-continuar');
  if (continuar) continuar.addEventListener('click', () => {
    // para o RAF antes de sair
    if (temprRevRAF) cancelAnimationFrame(temprRevRAF);
    if (typeof nextStep === 'function') nextStep();
  });
})();

// processando · 3 anéis girando + núcleo pulsante
function temprStartProc() {
  const canvas = document.getElementById('tempr-proc-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  let t = 0;

  function draw() {
    t += 0.03;
    ctx.clearRect(0, 0, W, H);
    // 3 anéis
    for (let i = 0; i < 3; i++) {
      const r = 28 + i * 10;
      const phase = t + i * 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, phase, phase + Math.PI * 0.7);
      ctx.strokeStyle = `rgba(212, 184, 150, ${0.5 - i * 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    // núcleo pulsante
    const pulse = 1 + Math.sin(t * 1.5) * 0.18;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * pulse);
    grad.addColorStop(0, 'rgba(232, 201, 160, 0.7)');
    grad.addColorStop(1, 'rgba(232, 201, 160, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    temprProcRAF = requestAnimationFrame(draw);
  }
  draw();

  // status rotating
  const statusEl = document.getElementById('tempr-proc-status');
  const statuses = ['compondo o retrato', 'cruzando os sinais', 'lendo o ritmo', 'revelando'];
  let idx = 0;
  const it = setInterval(() => {
    idx++;
    if (idx >= statuses.length || !statusEl) { clearInterval(it); return; }
    statusEl.innerHTML = statuses[idx] + '<span class="tempr-dot">.</span><span class="tempr-dot">.</span><span class="tempr-dot">.</span>';
  }, 800);

  // auto avança após 3.5s
  setTimeout(() => {
    if (temprProcRAF) cancelAnimationFrame(temprProcRAF);
    temprProcRAF = null;
    if (typeof nextStep === 'function') nextStep();
  }, 3500);
}

// revelação · monta UI + anima canvas conforme temperamento dominante
function temprRender() {
  if (temprRevRAF) cancelAnimationFrame(temprRevRAF);

  // determinar dominante e secundário
  const ord = Object.entries(temprScore).sort((a, b) => b[1] - a[1]);
  const dom = ord[0][0];
  const sec = ord[1][0];

  const T  = TEMPERAMENTOS[dom];
  const Ts = TEMPERAMENTOS[sec];

  // salva no localStorage
  try {
    localStorage.setItem('circa_temperamento', dom);
    localStorage.setItem('circa_temperamento_secundario', sec);
    localStorage.setItem('circa_temperamento_score', JSON.stringify(temprScore));
  } catch (e) {}

  // popula UI
  const nome = document.getElementById('tempr-rev-nome');
  if (nome) nome.textContent = T.nome;
  const man = document.getElementById('tempr-rev-manifesto');
  if (man) man.innerHTML = T.manifesto;
  const secNome = document.getElementById('tempr-rev-sec-nome');
  if (secNome) secNome.textContent = Ts.nome;
  const secDot = document.getElementById('tempr-rev-sec-dot');
  if (secDot) secDot.className = 'tempr-rev-sec-dot ' + sec;
  const cham = document.getElementById('tempr-rev-chamado-txt');
  if (cham) cham.textContent = T.chamado;
  const det = document.getElementById('tempr-rev-detalhes');
  if (det) {
    det.innerHTML = T.detalhes.map((d) => `
      <div class="tempr-rev-traco">
        <span class="tempr-rev-traco-icon">${d.n}</span>
        <p class="tempr-rev-traco-txt">${d.t}</p>
      </div>
    `).join('');
  }

  // anima canvas conforme tipo
  temprDrawElemento(dom, T.cor);
}

function temprDrawElemento(tipo, cor) {
  const canvas = document.getElementById('tempr-rev-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  let t = 0;

  function frame() {
    t += 0.012;
    ctx.clearRect(0, 0, W, H);

    // glow base universal
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 75);
    glow.addColorStop(0, `rgba(${cor},0.22)`);
    glow.addColorStop(1, `rgba(${cor},0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    if (tipo === 'corrente') {
      // ondas concêntricas expandindo
      for (let i = 0; i < 4; i++) {
        const offset = (t * 0.4 + i * 0.6) % 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + offset * 48, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cor},${0.6 * (1 - offset)})`;
        ctx.lineWidth = 1.6 - offset * 0.8;
        ctx.stroke();
      }
    } else if (tipo === 'brasa') {
      // blob orgânico pulsante
      const pulso = 1 + Math.sin(t * 1.5) * 0.08;
      ctx.beginPath();
      for (let k = 0; k <= 80; k++) {
        const ang = (k / 80) * Math.PI * 2;
        let r = 40 * pulso;
        for (let h = 1; h <= 3; h++) {
          r += 40 * 0.05 * Math.sin(ang * h * 0.8 + t * 1.2 * (h % 2 === 0 ? 1 : -0.6)) / h;
        }
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 44);
      grad.addColorStop(0, `rgba(${cor},0.85)`);
      grad.addColorStop(1, `rgba(${cor},0.25)`);
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (tipo === 'raiz') {
      // núcleo denso + raios sutis
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy - 12, 5, cx, cy, 40);
      grad.addColorStop(0, `rgba(${cor},0.7)`);
      grad.addColorStop(1, `rgba(${cor},0.2)`);
      ctx.fillStyle = grad;
      ctx.fill();
      // núcleo pulsante
      ctx.beginPath();
      ctx.arc(cx, cy, 12 + Math.sin(t * 0.6) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cor},0.95)`;
      ctx.fill();
      // raios
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + t * 0.08;
        const len = 14 + Math.sin(t + i) * 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 42, cy + Math.sin(ang) * 42);
        ctx.lineTo(cx + Math.cos(ang) * (42 + len), cy + Math.sin(ang) * (42 + len));
        ctx.strokeStyle = `rgba(${cor},0.4)`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    } else if (tipo === 'mare') {
      // ondas senoidais paralelas
      ctx.lineWidth = 1.6;
      for (let off = -2; off <= 2; off++) {
        ctx.beginPath();
        for (let x = cx - 56; x <= cx + 56; x += 2) {
          const y = cy + off * 9 + Math.sin((x - cx) * 0.13 + t * 1.2 + off * 0.4) * 6;
          x === cx - 56 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 1 - Math.abs(off) * 0.3;
        ctx.strokeStyle = `rgba(${cor},0.7)`;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    temprRevRAF = requestAnimationFrame(frame);
  }
  frame();
}

// trigger via click handlers já fica no IIFE acima · sem necessidade de monkey-patch

// ═════════════════════════════════════════════════════════════════════════
// MEU CICLO · screen menstrual gated p/ circa_gender = woman
// estado em localStorage.circa_cycle: { inicio, cycle, period }
// ═════════════════════════════════════════════════════════════════════════
(function cycleModule() {
  const ESTADO = { inicio: null, cycle: 28, period: 5, mesView: null };
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const MESES_ABV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const DOW = ['D','S','T','Q','Q','S','S'];
  const MS_DIA = 86400000;

  function loadState() {
    try {
      const raw = localStorage.getItem('circa_cycle');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.inicio) ESTADO.inicio = new Date(d.inicio);
        if (d.cycle) ESTADO.cycle = d.cycle;
        if (d.period) ESTADO.period = d.period;
      }
    } catch (e) {}
    if (!ESTADO.inicio) {
      const d = new Date(); d.setDate(d.getDate() - 14); d.setHours(0,0,0,0);
      ESTADO.inicio = d;
    }
    const m = new Date(); m.setDate(1); m.setHours(0,0,0,0);
    ESTADO.mesView = m;
  }

  function saveState() {
    try {
      localStorage.setItem('circa_cycle', JSON.stringify({
        inicio: ESTADO.inicio.toISOString(),
        cycle: ESTADO.cycle,
        period: ESTADO.period,
      }));
    } catch (e) {}
  }

  function diff(a, b) { return Math.floor((b - a) / MS_DIA); }

  function diaCiclo(data) {
    let d = diff(ESTADO.inicio, data);
    while (d < 0) d += ESTADO.cycle;
    return d % ESTADO.cycle;
  }

  function classify(data) {
    const d = diaCiclo(data);
    const ovu = ESTADO.cycle - 14;
    if (d < ESTADO.period) return 'm';
    if (d === ovu) return 'o';
    if (d >= ovu - 5 && d <= ovu + 1) return 'f';
    return null;
  }

  function fase() {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const d = diaCiclo(hoje);
    const ovu = ESTADO.cycle - 14;
    if (d < ESTADO.period) return { id: 'menstruacao', nome: 'menstruação' };
    if (d === ovu) return { id: 'ovulacao', nome: 'ovulação' };
    if (d >= ovu - 5 && d <= ovu + 1) return { id: 'fertil', nome: 'janela fértil' };
    if (d < ovu) return { id: 'folicular', nome: 'fase folicular' };
    return { id: 'lutea', nome: 'fase lútea' };
  }

  function diasProx() {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const d = diaCiclo(hoje);
    if (d < ESTADO.period) return ESTADO.period - d;
    return ESTADO.cycle - d;
  }

  function proximos(n) {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const out = [];
    const p = new Date(ESTADO.inicio);
    while (p <= hoje) p.setDate(p.getDate() + ESTADO.cycle);
    for (let i = 0; i < n; i++) {
      out.push(new Date(p));
      p.setDate(p.getDate() + ESTADO.cycle);
    }
    return out;
  }

  function render() {
    const numEl = document.getElementById('cyc-numero');
    if (!numEl) return;

    const f = fase();
    document.getElementById('cyc-fase-eyebrow').textContent = f.nome;
    const d = diasProx();
    numEl.textContent = d;
    document.getElementById('cyc-legenda').textContent = f.id === 'menstruacao'
      ? (d === 1 ? 'último dia da menstruação' : `${d} dias até o fim`)
      : (d === 1 ? 'dia até a próxima menstruação' : 'dias até a próxima menstruação');

    const mes = ESTADO.mesView;
    document.getElementById('cyc-mes-nome').textContent = `${MESES[mes.getMonth()]} ${mes.getFullYear()}`;
    const grid = document.getElementById('cyc-grid');
    grid.innerHTML = '';
    DOW.forEach((d) => {
      const el = document.createElement('div');
      el.className = 'cyc-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const ultimo = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const offset = primeiro.getDay();
    const total = ultimo.getDate();
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const mesAnt = new Date(mes.getFullYear(), mes.getMonth(), 0).getDate();

    for (let i = offset - 1; i >= 0; i--) {
      const el = document.createElement('div');
      el.className = 'cyc-dia is-out';
      el.textContent = mesAnt - i;
      grid.appendChild(el);
    }
    for (let day = 1; day <= total; day++) {
      const dt = new Date(mes.getFullYear(), mes.getMonth(), day); dt.setHours(0,0,0,0);
      const c = classify(dt);
      const isHoje = dt.getTime() === hoje.getTime();
      const el = document.createElement('div');
      let cls = 'cyc-dia';
      if (c === 'm') cls += ' is-m';
      else if (c === 'f') cls += ' is-f';
      else if (c === 'o') cls += ' is-o';
      if (isHoje) cls += ' is-today';
      el.className = cls;
      el.textContent = day;
      grid.appendChild(el);
    }
    const sobra = (7 - ((offset + total) % 7)) % 7;
    for (let i = 1; i <= sobra; i++) {
      const el = document.createElement('div');
      el.className = 'cyc-dia is-out';
      el.textContent = i;
      grid.appendChild(el);
    }

    const prox = proximos(3);
    document.getElementById('cyc-prox').innerHTML = prox.map((p) => `
      <div class="cyc-prox-card">
        <div class="cyc-prox-mes">${MESES_ABV[p.getMonth()]}</div>
        <div class="cyc-prox-dia">${p.getDate()}</div>
      </div>
    `).join('');

    const dataEl = document.getElementById('cyc-data');
    const yyyy = ESTADO.inicio.getFullYear();
    const mm = String(ESTADO.inicio.getMonth() + 1).padStart(2, '0');
    const dd = String(ESTADO.inicio.getDate()).padStart(2, '0');
    dataEl.value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('cyc-cycle-val').textContent = ESTADO.cycle;
    document.getElementById('cyc-period-val').textContent = ESTADO.period;
  }

  function init() {
    const tab = document.querySelector('[data-target="cycle"]');
    if (!tab) return;
    let isWoman = false;
    try { isWoman = localStorage.getItem('circa_gender') === 'woman'; } catch (e) {}
    if (!isWoman) return;

    document.body.classList.add('is-woman');
    const tabbar = document.querySelector('.tabbar');
    if (tabbar) {
      tabbar.classList.remove('tabbar--5');
      tabbar.classList.add('tabbar--6');
    }

    loadState();
    render();

    document.querySelectorAll('[data-cyc-nav]').forEach((b) => {
      b.addEventListener('click', () => {
        const dir = parseInt(b.dataset.cycNav, 10);
        ESTADO.mesView.setMonth(ESTADO.mesView.getMonth() + dir);
        render();
        if (typeof hap === 'function') hap(6);
      });
    });
    document.querySelectorAll('[data-cyc-stp]').forEach((b) => {
      b.addEventListener('click', () => {
        const [field, deltaStr] = b.dataset.cycStp.split(':');
        const delta = parseInt(deltaStr, 10);
        if (field === 'cycle') {
          const v = ESTADO.cycle + delta;
          if (v < 21 || v > 40) return;
          ESTADO.cycle = v;
        } else {
          const v = ESTADO.period + delta;
          if (v < 2 || v > 10) return;
          ESTADO.period = v;
        }
        saveState();
        render();
        if (typeof hap === 'function') hap(6);
      });
    });
    const dataInput = document.getElementById('cyc-data');
    if (dataInput) {
      dataInput.addEventListener('change', () => {
        if (!dataInput.value) return;
        const [y, m, d] = dataInput.value.split('-').map(Number);
        const dt = new Date(y, m - 1, d); dt.setHours(0,0,0,0);
        ESTADO.inicio = dt;
        saveState();
        render();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ═════════════════════════════════════════════════════════════════════════
// LOG · sheet com abas em standby (insights, club) + meu histórico
// (sono, treino, humor, comida, água) por data
// ═════════════════════════════════════════════════════════════════════════
(function logSheetModule() {
  function readArr(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
  }

  function fmtDataHora(iso) {
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth() + 1).padStart(2,'0');
      const hh = String(d.getHours()).padStart(2,'0');
      const mi = String(d.getMinutes()).padStart(2,'0');
      return `${dd}/${mm} · ${hh}:${mi}`;
    } catch (e) { return '—'; }
  }

  function renderHist() {
    const el = document.getElementById('log-hist');
    if (!el) return;

    const sono     = readArr('circa_log_sono');
    const treino   = readArr('circa_workout_log');
    const humor    = readArr('circa_log_humor');
    const refeicao = readArr('circa_log_refeicao');

    const items = [];
    sono.slice(-5).reverse().forEach((r) => items.push({
      cor: '#7B8BB8',
      lbl: 'sono',
      meta: r.horas != null ? `${r.horas}h` : (r.qualidade || '—'),
      ts: r.ts || r.data || r.date || null,
    }));
    treino.slice(-5).reverse().forEach((r) => items.push({
      cor: '#E8A87C',
      lbl: 'treino',
      meta: (r.tipo || r.modalidade || r.esporte || '—') + (r.duracao ? ` · ${r.duracao}min` : ''),
      ts: r.ts || r.data || r.date || null,
    }));
    humor.slice(-5).reverse().forEach((r) => items.push({
      cor: '#D4B896',
      lbl: 'humor',
      meta: r.valor != null ? `${r.valor}/10` : (r.label || '—'),
      ts: r.ts || r.data || r.date || null,
    }));
    refeicao.slice(-5).reverse().forEach((r) => items.push({
      cor: '#8FA87C',
      lbl: 'comida',
      meta: r.tipo || '—',
      ts: r.ts || r.data || r.date || null,
    }));

    if (items.length === 0) {
      el.innerHTML = `<div class="log-hist-empty">nada registrado ainda. registre teu primeiro item no card 'hoje' e ele aparece aqui.</div>`;
      return;
    }

    items.sort((a, b) => {
      const ta = a.ts ? new Date(a.ts).getTime() : 0;
      const tb = b.ts ? new Date(b.ts).getTime() : 0;
      return tb - ta;
    });

    el.innerHTML = items.slice(0, 12).map((it) => `
      <div class="log-hist-item">
        <span class="log-hist-item__lbl"><i style="background:${it.cor}"></i>${it.lbl}</span>
        <span class="log-hist-item__meta"><strong>${it.meta}</strong><br>${fmtDataHora(it.ts)}</span>
      </div>
    `).join('');
  }

  function openLogSheet() {
    if (typeof openSheet === 'function') openSheet('sheet-log');
    renderHist();
  }

  function init() {
    const btn = document.getElementById('j-nav-log');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openLogSheet();
        if (typeof hap === 'function') hap(8);
      });
    }
    // os 'log-row' navegam pra views da jornada (insights = 6, club = 9)
    document.querySelectorAll('[data-log-goto]').forEach((row) => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.logGoto, 10);
        if (typeof closeSheet === 'function') closeSheet();
        if (typeof window.openJornada === 'function') {
          window.openJornada();
          setTimeout(() => {
            const target = document.querySelector(`.j-nav-item[data-j-goto="${idx}"]`);
            if (target) target.click();
          }, 100);
        }
        if (typeof hap === 'function') hap(8);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
