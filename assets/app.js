'use strict';

// ─── Config ───────────────────────────────────────────────────
const APP_VERSION = '0.0.1';

// ─── Keys ─────────────────────────────────────────────────────
const KEYS = {
  esercizi: 'tr_esercizi',
  schede:   'tr_schede',
  todo:     'tr_todo_today',
  sessioni: 'tr_sessioni',
  profilo:  'tr_profilo',
  settings: 'tr_settings',
  dieta:    'tr_dieta_today',
};

// ─── Utils ────────────────────────────────────────────────────
function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

const GIORNI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MESI   = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                 'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function dayLabel() {
  return GIORNI[new Date().getDay()].toUpperCase();
}

function dateLabel() {
  const d = new Date();
  return `${d.getDate()} ${MESI[d.getMonth()]}`;
}

function weekLabel() {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `Settimana ${week}`;
}

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;
}

// ─── Storage ──────────────────────────────────────────────────
function store(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Data Access ──────────────────────────────────────────────
function getEsercizi()  { return load(KEYS.esercizi, []); }
function getSchede()    { return load(KEYS.schede, []); }
function getTodo()      { return load(KEYS.todo, { data: '', tipo: 'gym', completati: [] }); }
function getSessioni()  { return load(KEYS.sessioni, []); }
function getProfilo()   { return load(KEYS.profilo, { nome: '' }); }
function getSettings()  { return load(KEYS.settings, { tipo: 'gym' }); }
function getDieta()     { return load(KEYS.dieta, { data: '', acqua: 0, proteine: 0, calorie: 0, note: '' }); }
function saveDieta(obj) { store(KEYS.dieta, obj); }

function saveEserciziStore(arr) { store(KEYS.esercizi, arr); }
function saveSchede(arr)        { store(KEYS.schede, arr); }
function saveTodo(obj)          { store(KEYS.todo, obj); }
function saveSessioni(arr)      { store(KEYS.sessioni, arr); }
function saveProfilo(obj)       { store(KEYS.profilo, obj); }
function saveSettings(obj)      { store(KEYS.settings, obj); }

// ─── Defaults ─────────────────────────────────────────────────
function initDefaults() {
  if (getEsercizi().length > 0) return;

  const esercizi = [
    { id:'e_pull',     nome:'Pull-ups',           descrizione:'Trazioni alla sbarra',                serie:3, ripetizioni:'Massime',      note:'Fino a esaurimento tecnico (quando la forma peggiora, fermati)', focus:'Larghezza schiena e bicipiti', tempo:null,                   timer_sec:null, peso:null, youtube:null, difficolta:'intermedio' },
    { id:'e_dips',     nome:'Dips',               descrizione:'Affondi alle parallele o su panca',   serie:3, ripetizioni:'8-12',          note:'Mantieni il busto leggermente inclinato in avanti',              focus:'Tricipiti e pettorali',        tempo:'2s discesa, 1s salita', timer_sec:null, peso:null, youtube:null, difficolta:'intermedio' },
    { id:'e_push',     nome:'Push-ups',            descrizione:'Piegamenti a terra',                  serie:3, ripetizioni:'12-15',         note:'Corpo dritto come una tavola, gomiti non troppo larghi',          focus:'Forza di spinta e core',       tempo:null,                   timer_sec:null, peso:null, youtube:null, difficolta:'base' },
    { id:'e_lunge',    nome:'Walking Lunges',      descrizione:'Affondi camminati',                   serie:3, ripetizioni:'12 per gamba',  note:'Passo ampio per attivare bene i glutei',                         focus:'Gambe e glutei',               tempo:null,                   timer_sec:null, peso:null, youtube:null, difficolta:'base' },
    { id:'e_hollow',   nome:'Hollow Body Hold',    descrizione:'Tenuta a barchetta',                  serie:4, ripetizioni:null,            note:'Schiaccia la zona lombare contro il pavimento',                   focus:'Addome profondo (six-pack)',    tempo:'30-45 secondi',        timer_sec:30,   peso:null, youtube:null, difficolta:'intermedio' },
    { id:'e_deadbug',  nome:'Dead Bug',            descrizione:'Insetto morto',                       serie:3, ripetizioni:'10 per lato',   note:'Movimento controllato e lento coordinando braccia e gambe',      focus:'Core e protezione schiena',    tempo:'Esecuzione lenta',     timer_sec:null, peso:null, youtube:null, difficolta:'base' },
    { id:'e_legraise', nome:'Leg Raises',          descrizione:'Sollevamento gambe appeso alla sbarra',serie:3, ripetizioni:'10-12',         note:'Evita di dondolare con il corpo',                                focus:'Addominali bassi',             tempo:null,                   timer_sec:null, peso:null, youtube:null, difficolta:'intermedio' },
  ];

  const schede = [
    { id:'s_gym_a',  nome:'Scheda A', tipo:'gym',  attiva:true,  ordine:['e_pull','e_dips','e_push','e_lunge','e_hollow','e_deadbug','e_legraise'] },
    { id:'s_home_a', nome:'Casa Base',tipo:'home', attiva:true,  ordine:['e_push','e_lunge','e_hollow','e_deadbug'] },
  ];

  saveEserciziStore(esercizi);
  saveSchede(schede);
}

// ─── Midnight Reset ───────────────────────────────────────────
function checkMidnightReset() {
  const today = getToday();
  const todo  = getTodo();
  if (todo.data !== today) {
    saveTodo({ data: today, tipo: todo.tipo || 'gym', completati: [] });
  }
  const dieta = getDieta();
  if (dieta.data !== today) {
    saveDieta({ data: today, acqua: 0, proteine: 0, calorie: 0, note: '' });
  }
}

// ─── Navigation ───────────────────────────────────────────────
function goTo(page) {
  document.body.style.opacity = '0';
  setTimeout(() => {
    const map = { home: '../index.html', schede: 'schede.html', progressi: 'progressi.html', profilo: 'profilo.html', calendario: 'calendario.html' };
    const fromPages = ['schede', 'progressi', 'profilo', 'calendario'];
    const onPage = fromPages.some(p => window.location.pathname.includes(p + '.html'));
    if (page === 'home') {
      window.location.href = onPage ? '../index.html' : 'index.html';
    } else {
      window.location.href = onPage ? map[page] : `pages/${page}.html`;
    }
  }, 80);
}

function goBack() { window.history.back(); }

function initNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.page));
  });
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Timer ────────────────────────────────────────────────────
const timer = {
  active: false, paused: false,
  sec: 0, total: 0, name: '',
  interval: null,
};

function startTimer(sec, name) {
  if (timer.interval) clearInterval(timer.interval);
  timer.active = true;
  timer.paused = false;
  timer.sec    = sec;
  timer.total  = sec;
  timer.name   = name;
  updateTimerUI();
  const widget = document.getElementById('timerWidget');
  if (widget) widget.classList.add('active');
  timer.interval = setInterval(timerTick, 1000);
}

function timerTick() {
  if (timer.paused) return;
  timer.sec--;
  updateTimerUI();
  if (timer.sec <= 0) {
    clearInterval(timer.interval);
    timer.active = false;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast('⏱ Tempo scaduto!');
    setTimeout(() => {
      const widget = document.getElementById('timerWidget');
      if (widget) widget.classList.remove('active');
    }, 1500);
  }
}

function pauseTimer() {
  timer.paused = !timer.paused;
  const btn = document.getElementById('timerPlayPause');
  if (btn) {
    btn.querySelector('.material-symbols-outlined').textContent = timer.paused ? 'play_arrow' : 'pause';
  }
}

function stopTimer() {
  clearInterval(timer.interval);
  timer.active = false;
  timer.paused = false;
  const widget = document.getElementById('timerWidget');
  if (widget) widget.classList.remove('active');
}

function updateTimerUI() {
  const cd = document.getElementById('timerCountdown');
  const bar = document.getElementById('timerBarFill');
  const name = document.getElementById('timerName');
  if (!cd) return;
  const m = Math.floor(timer.sec / 60).toString().padStart(2, '0');
  const s = (timer.sec % 60).toString().padStart(2, '0');
  cd.textContent = `${m}:${s}`;
  if (bar) {
    const pct = timer.total > 0 ? (timer.sec / timer.total) * 100 : 0;
    bar.style.width = `${pct}%`;
  }
  if (name) name.textContent = timer.name;
}

// ─── HOME PAGE ────────────────────────────────────────────────
function initHome() {
  // Hero
  const dayEl  = document.getElementById('heroDay');
  const dateEl = document.getElementById('heroDate');
  if (dayEl)  dayEl.textContent  = dayLabel();
  if (dateEl) dateEl.textContent = `${dateLabel()} · ${weekLabel()}`;

  // Streak mini
  const streakEl = document.getElementById('heroStreak');
  if (streakEl) {
    const s = calcStreak('all');
    if (s > 0) {
      streakEl.style.display = 'inline-flex';
      streakEl.querySelector('.streak-num').textContent = `${s} giorni di fila`;
    } else {
      streakEl.style.display = 'none';
    }
  }

  // Toggle gym/home
  const settings = getSettings();
  let currentTipo = settings.tipo || 'gym';
  setToggleActive(currentTipo);

  document.querySelectorAll('.scheda-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTipo = btn.dataset.tipo;
      setToggleActive(currentTipo);
      const s = getSettings();
      s.tipo = currentTipo;
      saveSettings(s);
      const todo = getTodo();
      todo.tipo = currentTipo;
      saveTodo(todo);
      renderExerciseList(currentTipo);
    });
  });

  renderExerciseList(currentTipo);

  // Complete workout button
  const completeBtn = document.getElementById('completeWorkoutBtn');
  if (completeBtn) {
    completeBtn.addEventListener('click', completeWorkout);
  }

  // Timer widget controls
  const playPauseBtn = document.getElementById('timerPlayPause');
  const stopBtn      = document.getElementById('timerStop');
  if (playPauseBtn) playPauseBtn.addEventListener('click', pauseTimer);
  if (stopBtn)      stopBtn.addEventListener('click', stopTimer);

  // Fulmine → calendario
  document.getElementById('headerCalBtn')?.addEventListener('click', () => goTo('calendario'));

  // Profile avatar → go to profilo
  const avatar = document.getElementById('headerAvatar');
  if (avatar) avatar.addEventListener('click', () => goTo('profilo'));

  // Update profile initial
  const profilo = getProfilo();
  if (avatar && profilo.nome) {
    avatar.textContent = profilo.nome.charAt(0).toUpperCase();
  }
}

function setToggleActive(tipo) {
  document.querySelectorAll('.scheda-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === tipo);
  });
}

function renderExerciseList(tipo) {
  const list = document.getElementById('exerciseList');
  const completeBtn = document.getElementById('completeWorkoutBtn');
  if (!list) return;

  const schede   = getSchede();
  const scheda   = schede.find(s => s.tipo === tipo && s.attiva);
  const todo     = getTodo();

  if (!scheda) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">fitness_center</span>
        <div class="empty-state-title">Nessuna scheda attiva</div>
        <div class="empty-state-sub">Vai su Schede per configurarne una.</div>
        <button class="empty-state-btn" onclick="goTo('schede')">Gestisci schede</button>
      </div>`;
    return;
  }

  const esercizi = getEsercizi();
  const completati = todo.completati || [];

  if (scheda.ordine.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined">add_circle</span>
        <div class="empty-state-title">Scheda vuota</div>
        <div class="empty-state-sub">Aggiungi esercizi dalla sezione Schede.</div>
        <button class="empty-state-btn" onclick="goTo('schede')">Aggiungi esercizi</button>
      </div>`;
    return;
  }

  const html = scheda.ordine.map(id => {
    const ex = esercizi.find(e => e.id === id);
    if (!ex) return '';
    return buildExerciseCard(ex, completati.includes(id));
  }).join('');

  list.innerHTML = html;

  // Attach events
  list.querySelectorAll('.exercise-check').forEach(btn => {
    btn.addEventListener('click', () => handleCheck(btn.dataset.id, tipo));
  });

  list.querySelectorAll('.exercise-timer-btn').forEach(btn => {
    const exId = btn.dataset.id;
    const ex   = esercizi.find(e => e.id === exId);
    if (ex && ex.timer_sec) {
      btn.addEventListener('click', () => startTimer(ex.timer_sec, ex.nome));
    }
  });

  updateCompleteBtn(completeBtn, scheda, completati);
}

function buildExerciseCard(ex, done) {
  const reps = ex.ripetizioni ?? (ex.timer_sec ? `${ex.timer_sec}s` : '—');
  const repsLabel = `${ex.serie} × ${reps}`;
  const diff = ex.difficolta || 'base';
  const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);

  const timerBtn = ex.timer_sec
    ? `<button class="exercise-timer-btn" data-id="${ex.id}">
         <span class="material-symbols-outlined">timer</span>
         ${ex.timer_sec}s
       </button>`
    : '';

  return `
    <div class="exercise-card ${done ? 'done' : ''}" data-id="${ex.id}">
      <button class="exercise-check" data-id="${ex.id}" aria-label="Completa">
        <span class="material-symbols-outlined">check</span>
      </button>
      <div class="exercise-info">
        <div class="exercise-name">${ex.nome}</div>
        ${ex.descrizione ? `<div class="exercise-desc">${ex.descrizione}</div>` : ''}
        <div class="exercise-badges">
          <span class="badge badge--reps">${repsLabel}</span>
          ${ex.focus ? `<span class="badge badge--focus">${ex.focus.split(' ')[0]}</span>` : ''}
          <span class="badge badge--${diff}">${diffLabel}</span>
        </div>
      </div>
      ${timerBtn}
    </div>`;
}

function handleCheck(exId, tipo) {
  const todo = getTodo();
  if (!todo.completati) todo.completati = [];
  const idx = todo.completati.indexOf(exId);
  if (idx === -1) todo.completati.push(exId);
  else todo.completati.splice(idx, 1);
  saveTodo(todo);
  renderExerciseList(tipo || getSettings().tipo);
}

function updateCompleteBtn(btn, scheda, completati) {
  if (!btn) return;
  const total = scheda.ordine.length;
  const done  = scheda.ordine.filter(id => completati.includes(id)).length;
  const ready = done > 0;
  btn.classList.toggle('ready', ready);
  btn.querySelector('.btn-label').textContent = done === total && total > 0
    ? 'Sessione completata!'
    : `Salva (${done}/${total})`;
}

function completeWorkout() {
  const todo    = getTodo();
  const tipo    = todo.tipo || 'gym';
  const schede  = getSchede();
  const scheda  = schede.find(s => s.tipo === tipo && s.attiva);
  if (!scheda) return;

  const completati = todo.completati || [];
  if (completati.length === 0) { showToast('Completa almeno un esercizio!'); return; }

  const sessioni = getSessioni();
  const today    = getToday();

  // Avoid double-saving same day/tipo
  const alreadySaved = sessioni.some(s => s.data === today && s.tipo === tipo);
  if (alreadySaved) { showToast('Sessione già salvata oggi!'); return; }

  sessioni.push({ id: uuid(), data: today, tipo, completati: [...completati] });
  saveSessioni(sessioni);
  showToast(completati.length === scheda.ordine.length ? '🔥 Allenamento completato!' : '✓ Sessione salvata!');
}

// ─── SCHEDE PAGE ──────────────────────────────────────────────
let _currentSchedaId = null;

function initSchede() {
  renderSchede();

  // Add scheda card
  document.getElementById('addGymScheda')?.addEventListener('click', () => openAddSchedaModal('gym'));
  document.getElementById('addHomeScheda')?.addEventListener('click', () => openAddSchedaModal('home'));

  // Modals
  initModalClose('schedeDetailOverlay',  'schedeDetailClose',  closeSchedaDetail);
  initModalClose('poolPickerOverlay',    'poolPickerClose',    closePoolPicker);
  initModalClose('esercizioFormOverlay', 'esercizioFormClose', closeEsercizioForm);
  initModalClose('addSchedaOverlay',     'addSchedaClose',     closeAddSchedaModal);

  document.getElementById('addEsercizioBtn')?.addEventListener('click', () => openPoolPicker(_currentSchedaId));
  document.getElementById('createNewEsercizioBtn')?.addEventListener('click', () => {
    closePoolPicker();
    openEsercizioForm(null, _currentSchedaId);
  });
  document.getElementById('esercizioFormSubmit')?.addEventListener('click', handleEsercizioFormSubmit);
  document.getElementById('addSchedaSubmit')?.addEventListener('click', handleAddSchedaSubmit);
  document.getElementById('schedeDetailSetActive')?.addEventListener('click', () => {
    if (_currentSchedaId) setSchedaAttiva(_currentSchedaId);
  });
  document.getElementById('schedeDetailDelete')?.addEventListener('click', () => {
    if (_currentSchedaId) deleteSchedaConfirm(_currentSchedaId);
  });

  // Pool search
  document.getElementById('poolSearchInput')?.addEventListener('input', e => {
    renderPoolPicker(_currentSchedaId, e.target.value);
  });
}

function renderSchede() {
  const schede = getSchede();
  renderSchedeSection('gymList', schede.filter(s => s.tipo === 'gym'));
  renderSchedeSection('homeList', schede.filter(s => s.tipo === 'home'));
}

function renderSchedeSection(containerId, list) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = list.map(s => `
    <div class="scheda-card ${s.attiva ? 'attiva' : ''}" data-id="${s.id}">
      <div class="scheda-icon">
        <span class="material-symbols-outlined">${s.tipo === 'gym' ? 'fitness_center' : 'home'}</span>
      </div>
      <div class="scheda-info">
        <div class="scheda-name">${s.nome}</div>
        <div class="scheda-sub">${s.ordine.length} esercizi</div>
      </div>
      ${s.attiva ? '<span class="scheda-active-badge">Attiva</span>' : ''}
    </div>
  `).join('');
  el.querySelectorAll('.scheda-card').forEach(card => {
    card.addEventListener('click', () => openSchedaDetail(card.dataset.id));
  });
}

function openSchedaDetail(schedaId) {
  _currentSchedaId = schedaId;
  const schede  = getSchede();
  const scheda  = schede.find(s => s.id === schedaId);
  if (!scheda) return;

  document.getElementById('schedeDetailTitle').textContent = scheda.nome;
  const setActiveBtn = document.getElementById('schedeDetailSetActive');
  if (setActiveBtn) {
    setActiveBtn.textContent = scheda.attiva ? 'Già attiva' : 'Imposta attiva';
    setActiveBtn.disabled    = scheda.attiva;
  }
  renderDetailExercises(scheda);
  openModal('schedeDetailOverlay');
}

function closeSchedaDetail() { closeModal('schedeDetailOverlay'); }

function renderDetailExercises(scheda) {
  const list     = document.getElementById('schedeDetailExercises');
  if (!list) return;
  const esercizi = getEsercizi();

  if (scheda.ordine.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">add_circle</span><div class="empty-state-title">Nessun esercizio</div></div>';
    return;
  }

  list.innerHTML = scheda.ordine.map((id, i) => {
    const ex = esercizi.find(e => e.id === id);
    if (!ex) return '';
    const reps = ex.ripetizioni ?? (ex.timer_sec ? `${ex.timer_sec}s` : '—');
    return `
      <div class="detail-exercise-row" data-id="${ex.id}">
        <div class="detail-exercise-info">
          <div class="detail-exercise-name">${ex.nome}</div>
          <div class="detail-exercise-sub">${ex.serie} × ${reps} · ${ex.difficolta || 'base'}</div>
        </div>
        <div class="detail-row-actions">
          <button class="icon-btn-sm" data-action="up" data-id="${ex.id}" ${i === 0 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">keyboard_arrow_up</span>
          </button>
          <button class="icon-btn-sm" data-action="down" data-id="${ex.id}" ${i === scheda.ordine.length - 1 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <button class="icon-btn-sm danger" data-action="remove" data-id="${ex.id}">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (action === 'up')     moveExercise(_currentSchedaId, id, -1);
      if (action === 'down')   moveExercise(_currentSchedaId, id, 1);
      if (action === 'remove') removeFromScheda(_currentSchedaId, id);
    });
  });
}

function moveExercise(schedaId, exId, dir) {
  const schede = getSchede();
  const scheda = schede.find(s => s.id === schedaId);
  if (!scheda) return;
  const idx = scheda.ordine.indexOf(exId);
  if (idx === -1) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= scheda.ordine.length) return;
  scheda.ordine.splice(idx, 1);
  scheda.ordine.splice(newIdx, 0, exId);
  saveSchede(schede);
  renderDetailExercises(scheda);
}

function removeFromScheda(schedaId, exId) {
  const schede = getSchede();
  const scheda = schede.find(s => s.id === schedaId);
  if (!scheda) return;
  scheda.ordine = scheda.ordine.filter(id => id !== exId);
  saveSchede(schede);
  renderDetailExercises(scheda);
}

function setSchedaAttiva(schedaId) {
  const schede = getSchede();
  const target = schede.find(s => s.id === schedaId);
  if (!target) return;
  schede.forEach(s => { if (s.tipo === target.tipo) s.attiva = false; });
  target.attiva = true;
  saveSchede(schede);
  renderSchede();
  const btn = document.getElementById('schedeDetailSetActive');
  if (btn) { btn.textContent = 'Già attiva'; btn.disabled = true; }
  showToast(`"${target.nome}" impostata come attiva`);
}

function deleteSchedaConfirm(schedaId) {
  const schede = getSchede();
  const scheda = schede.find(s => s.id === schedaId);
  if (!scheda) return;
  if (!confirm(`Eliminare la scheda "${scheda.nome}"?`)) return;
  const updated = schede.filter(s => s.id !== schedaId);
  saveSchede(updated);
  closeSchedaDetail();
  renderSchede();
  showToast('Scheda eliminata');
}

// Pool Picker
function openPoolPicker(schedaId) {
  renderPoolPicker(schedaId, '');
  document.getElementById('poolSearchInput').value = '';
  openModal('poolPickerOverlay');
}

function closePoolPicker() { closeModal('poolPickerOverlay'); }

function renderPoolPicker(schedaId, query) {
  const schede   = getSchede();
  const scheda   = schede.find(s => s.id === schedaId);
  const esercizi = getEsercizi();
  const existing = scheda ? scheda.ordine : [];
  const list     = document.getElementById('poolPickerList');
  if (!list) return;

  const filtered = esercizi.filter(e => {
    const q = (query || '').toLowerCase();
    return !existing.includes(e.id) &&
           (e.nome.toLowerCase().includes(q) || (e.descrizione || '').toLowerCase().includes(q));
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-title">Nessun esercizio trovato</div></div>';
    return;
  }

  list.innerHTML = filtered.map(e => `
    <div class="pool-exercise-row" data-id="${e.id}">
      <div class="pool-add-icon"><span class="material-symbols-outlined">add</span></div>
      <div>
        <div class="pool-exercise-name">${e.nome}</div>
        <div class="pool-exercise-sub">${e.serie} × ${e.ripetizioni || e.timer_sec + 's' || '—'} · ${e.difficolta}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.pool-exercise-row').forEach(row => {
    row.addEventListener('click', () => {
      addToScheda(schedaId, row.dataset.id);
      closePoolPicker();
    });
  });
}

function addToScheda(schedaId, exId) {
  const schede = getSchede();
  const scheda = schede.find(s => s.id === schedaId);
  if (!scheda || scheda.ordine.includes(exId)) return;
  scheda.ordine.push(exId);
  saveSchede(schede);
  renderDetailExercises(scheda);
  showToast('Esercizio aggiunto');
}

// Esercizio Form
function openEsercizioForm(exId, schedaId) {
  const form = document.getElementById('esercizioForm');
  if (!form) return;
  form.reset();
  form.dataset.schedaId = schedaId || '';
  form.dataset.exId     = exId || '';

  const title = document.getElementById('esercizioFormTitle');
  if (exId) {
    const ex = getEsercizi().find(e => e.id === exId);
    if (ex) {
      if (title) title.textContent = 'Modifica esercizio';
      form.querySelector('[name="nome"]').value         = ex.nome || '';
      form.querySelector('[name="descrizione"]').value  = ex.descrizione || '';
      form.querySelector('[name="serie"]').value        = ex.serie || '';
      form.querySelector('[name="ripetizioni"]').value  = ex.ripetizioni || '';
      form.querySelector('[name="note"]').value         = ex.note || '';
      form.querySelector('[name="focus"]').value        = ex.focus || '';
      form.querySelector('[name="tempo"]').value        = ex.tempo || '';
      form.querySelector('[name="timer_sec"]').value    = ex.timer_sec || '';
      form.querySelector('[name="peso"]').value         = ex.peso || '';
      form.querySelector('[name="youtube"]').value      = ex.youtube || '';
      form.querySelector('[name="difficolta"]').value   = ex.difficolta || 'base';
    }
  } else {
    if (title) title.textContent = 'Nuovo esercizio';
  }

  openModal('esercizioFormOverlay');
}

function closeEsercizioForm() { closeModal('esercizioFormOverlay'); }

function handleEsercizioFormSubmit() {
  const form     = document.getElementById('esercizioForm');
  if (!form) return;
  const schedaId = form.dataset.schedaId;
  const exId     = form.dataset.exId;

  const nome = form.querySelector('[name="nome"]').value.trim();
  if (!nome) { showToast('Inserisci il nome dell\'esercizio'); return; }

  const data = {
    nome,
    descrizione: form.querySelector('[name="descrizione"]').value.trim() || null,
    serie:       parseInt(form.querySelector('[name="serie"]').value) || 3,
    ripetizioni: form.querySelector('[name="ripetizioni"]').value.trim() || null,
    note:        form.querySelector('[name="note"]').value.trim() || null,
    focus:       form.querySelector('[name="focus"]').value.trim() || null,
    tempo:       form.querySelector('[name="tempo"]').value.trim() || null,
    timer_sec:   parseInt(form.querySelector('[name="timer_sec"]').value) || null,
    peso:        parseFloat(form.querySelector('[name="peso"]').value) || null,
    youtube:     form.querySelector('[name="youtube"]').value.trim() || null,
    difficolta:  form.querySelector('[name="difficolta"]').value || 'base',
  };

  const esercizi = getEsercizi();

  if (exId) {
    const idx = esercizi.findIndex(e => e.id === exId);
    if (idx !== -1) esercizi[idx] = { ...esercizi[idx], ...data };
  } else {
    const newEx = { id: uuid(), ...data };
    esercizi.push(newEx);
    if (schedaId) addToScheda(schedaId, newEx.id);
  }

  saveEserciziStore(esercizi);
  closeEsercizioForm();

  const schede = getSchede();
  const scheda = schede.find(s => s.id === schedaId);
  if (scheda) renderDetailExercises(scheda);
  showToast(exId ? 'Esercizio aggiornato' : 'Esercizio creato');
}

// Add Scheda Modal
function openAddSchedaModal(tipo) {
  const typeInput = document.getElementById('newSchedaTipo');
  if (typeInput) typeInput.value = tipo;
  const label = document.getElementById('newSchedaTipoLabel');
  if (label) label.textContent = tipo === 'gym' ? '🏋️ Palestra' : '🏠 Casa';
  document.getElementById('newSchedaNome').value = '';
  openModal('addSchedaOverlay');
}

function closeAddSchedaModal() { closeModal('addSchedaOverlay'); }

function handleAddSchedaSubmit() {
  const nome = document.getElementById('newSchedaNome').value.trim();
  const tipo = document.getElementById('newSchedaTipo').value;
  if (!nome) { showToast('Inserisci il nome della scheda'); return; }

  const schede = getSchede();
  schede.push({ id: uuid(), nome, tipo, attiva: false, ordine: [] });
  saveSchede(schede);
  closeAddSchedaModal();
  renderSchede();
  showToast('Scheda creata');
}

// Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  // Only restore overflow if no other modal open
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

function initModalClose(overlayId, closeBtnId, closeFn) {
  const overlay  = document.getElementById(overlayId);
  const closeBtn = document.getElementById(closeBtnId);
  if (overlay)  overlay.addEventListener('click', e => { if (e.target === overlay) closeFn(); });
  if (closeBtn) closeBtn.addEventListener('click', closeFn);
}

// ─── PROGRESSI PAGE ───────────────────────────────────────────
function initProgressi() {
  renderStreaks();
  renderSessioniRecenti();

  document.getElementById('corsaBtn')?.addEventListener('click', handleCorsa);
}

function calcStreak(tipo) {
  const sessioni = getSessioni();
  const today    = getToday();
  let current    = new Date(today);
  let streak     = 0;

  while (true) {
    const iso  = current.toISOString().slice(0, 10);
    const hasSessione = sessioni.some(s => {
      if (s.data !== iso) return false;
      if (tipo === 'all')  return true;
      return s.tipo === tipo;
    });
    if (!hasSessione) break;
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

function renderStreaks() {
  const gym    = calcStreak('gym');
  const home   = calcStreak('home');
  const all    = calcStreak('all');
  const corsa  = getSessioni().filter(s => s.tipo === 'corsa').length;

  setStreakVal('streakGym',   gym);
  setStreakVal('streakHome',  home);
  setStreakVal('streakAll',   all);
  setStreakVal('streakCorsa', corsa);
}

function setStreakVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function handleCorsa() {
  const today    = getToday();
  const sessioni = getSessioni();
  const already  = sessioni.some(s => s.data === today && s.tipo === 'corsa');
  if (already) { showToast('Corsa già registrata oggi!'); return; }
  sessioni.push({ id: uuid(), data: today, tipo: 'corsa', completati: [] });
  saveSessioni(sessioni);
  renderStreaks();
  renderSessioniRecenti();
  showToast('🏃 Corsa registrata!');
}

function renderSessioniRecenti() {
  const list     = document.getElementById('sessioniList');
  if (!list) return;
  const sessioni = getSessioni().slice().reverse().slice(0, 20);

  if (sessioni.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">directions_run</span><div class="empty-state-title">Nessuna sessione ancora</div></div>';
    return;
  }

  const tipoLabel = { gym: '🏋️ Palestra', home: '🏠 Casa', corsa: '🏃 Corsa' };
  list.innerHTML = sessioni.map(s => `
    <div class="sessione-row">
      <div class="sessione-dot ${s.tipo}"></div>
      <div class="sessione-info">
        <div class="sessione-tipo">${tipoLabel[s.tipo] || s.tipo}</div>
        <div class="sessione-data">${formatDateShort(s.data)}</div>
      </div>
      ${s.completati?.length ? `<div class="sessione-badge">${s.completati.length} esercizi</div>` : ''}
    </div>
  `).join('');
}

// ─── PROFILO PAGE ─────────────────────────────────────────────
function initProfilo() {
  const profilo = getProfilo();
  const nomeEl  = document.getElementById('profileNomeInput');
  const dispEl  = document.getElementById('profileNameDisplay');
  const avatarEl = document.getElementById('profileAvatarLarge');

  if (nomeEl)   nomeEl.value = profilo.nome || '';
  if (dispEl)   dispEl.textContent = profilo.nome || 'Il tuo profilo';
  if (avatarEl) avatarEl.textContent = profilo.nome ? profilo.nome.charAt(0).toUpperCase() : '?';

  document.getElementById('saveProfiloBtn')?.addEventListener('click', () => {
    const nome = nomeEl?.value.trim() || '';
    saveProfilo({ ...getProfilo(), nome });
    if (dispEl)  dispEl.textContent  = nome || 'Il tuo profilo';
    if (avatarEl) avatarEl.textContent = nome ? nome.charAt(0).toUpperCase() : '?';
    showToast('Profilo salvato');
  });

  document.querySelectorAll('#versionEl, #versionDisplay').forEach(el => {
    el.textContent = APP_VERSION;
  });

  document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (!confirm('Cancellare tutti i dati? L\'operazione non è reversibile.')) return;
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    showToast('Dati eliminati. Riavvio...');
    setTimeout(() => window.location.reload(), 1000);
  });
}

// ─── CALENDARIO PAGE ──────────────────────────────────────────
const MESI_FULL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                   'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

let _calYear  = new Date().getFullYear();
let _calMonth = new Date().getMonth();
let _calSelectedDay = null;

function initCalendario() {
  renderCalendario();

  document.getElementById('calPrev')?.addEventListener('click', () => {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    renderCalendario();
  });

  document.getElementById('calNext')?.addEventListener('click', () => {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    renderCalendario();
  });

  // Tab switching
  document.getElementById('calTabs')?.querySelectorAll('.filter-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#calTabs .filter-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('panelCalendario').classList.toggle('hidden', tab !== 'calendario');
      document.getElementById('panelDieta').classList.toggle('hidden', tab !== 'dieta');
      const titleEl = document.getElementById('calPageTitle');
      if (titleEl) titleEl.textContent = tab === 'dieta' ? 'Dieta' : 'Calendario';
    });
  });

  initDieta();
}

function renderCalendario() {
  const labelEl = document.getElementById('calMonthLabel');
  if (labelEl) labelEl.textContent = `${MESI_FULL[_calMonth]} ${_calYear}`;

  const sessioni    = getSessioni();
  const activityMap = {};
  sessioni.forEach(s => {
    if (!activityMap[s.data]) activityMap[s.data] = [];
    if (!activityMap[s.data].includes(s.tipo)) activityMap[s.data].push(s.tipo);
  });

  const grid  = document.getElementById('calGrid');
  if (!grid) return;

  const today    = getToday();
  const firstDay = new Date(_calYear, _calMonth, 1);
  const lastDay  = new Date(_calYear, _calMonth + 1, 0);

  // Mon=0 … Sun=6 (shift from Sun=0)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  let html = '';

  // Empty cells before month start
  for (let i = 0; i < startDow; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const iso      = `${_calYear}-${String(_calMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday  = iso === today;
    const isSelected = iso === _calSelectedDay;
    const types    = activityMap[iso] || [];

    const dots = types.map(t => `<div class="cal-dot ${t}"></div>`).join('');

    html += `
      <div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-iso="${iso}">
        <div class="cal-cell-num">${d}</div>
        <div class="cal-dots">${dots}</div>
      </div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => showDayDetail(cell.dataset.iso, activityMap));
  });

  // Re-show detail if selected day still visible
  if (_calSelectedDay) {
    const parts = _calSelectedDay.split('-');
    if (parseInt(parts[1]) - 1 === _calMonth && parseInt(parts[0]) === _calYear) {
      showDayDetail(_calSelectedDay, activityMap);
    } else {
      hideDayDetail();
    }
  }
}

const TIPO_LABEL = { gym: '🏋️ Palestra', home: '🏠 Casa', corsa: '🏃 Corsa' };
const TIPO_COLOR = { gym: '#FF5E5E', home: 'var(--green)', corsa: '#4B8BFF' };

function showDayDetail(iso, activityMap) {
  _calSelectedDay = iso;
  const detail    = document.getElementById('calDayDetail');
  const dateEl    = document.getElementById('calDetailDate');
  const itemsEl   = document.getElementById('calDetailItems');
  if (!detail) return;

  const d    = new Date(iso + 'T00:00:00');
  const types = activityMap[iso] || [];

  dateEl.textContent = `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;

  if (types.length === 0) {
    itemsEl.innerHTML = '<div style="font-size:13px;color:var(--text-3)">Nessuna attività registrata</div>';
  } else {
    itemsEl.innerHTML = types.map(t => `
      <div class="cal-detail-item">
        <div class="cal-detail-dot" style="background:${TIPO_COLOR[t]}"></div>
        ${TIPO_LABEL[t] || t}
      </div>`).join('');
  }

  detail.style.display = 'block';

  // Update selected state in grid
  document.querySelectorAll('.cal-cell').forEach(c => {
    c.classList.toggle('selected', c.dataset.iso === iso);
  });
}

function hideDayDetail() {
  _calSelectedDay = null;
  const detail = document.getElementById('calDayDetail');
  if (detail) detail.style.display = 'none';
}

// ─── DIETA ────────────────────────────────────────────────────
function initDieta() {
  const dieta   = getDieta();
  const labelEl = document.getElementById('dietaTodayLabel');
  if (labelEl) labelEl.textContent = `Oggi — ${dateLabel()}`;

  updateDietaUI(dieta);

  document.querySelectorAll('[data-field][data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const delta = parseInt(btn.dataset.delta);
      const d     = getDieta();
      d[field]    = Math.max(0, (d[field] || 0) + delta);
      saveDieta(d);
      updateDietaUI(d);
    });
  });

  const noteInput = document.getElementById('dietaNoteInput');
  if (noteInput) {
    noteInput.value = dieta.note || '';
    noteInput.addEventListener('input', () => {
      const d  = getDieta();
      d.note   = noteInput.value;
      saveDieta(d);
    });
  }
}

function updateDietaUI(dieta) {
  const acquaEl   = document.getElementById('valAcqua');
  const protEl    = document.getElementById('valProteine');
  const calEl     = document.getElementById('valCalorie');

  if (acquaEl) acquaEl.innerHTML = `${dieta.acqua || 0}`;
  if (protEl)  protEl.innerHTML  = `${dieta.proteine || 0}<span style="font-size:11px;opacity:.6">g</span>`;
  if (calEl)   calEl.innerHTML   = `${dieta.calorie || 0}<span style="font-size:11px;opacity:.6">kcal</span>`;
}

// ─── DOMContentLoaded ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  checkMidnightReset();
  initNav();

  const page = document.body.dataset.page;
  switch (page) {
    case 'home':       initHome();       break;
    case 'schede':     initSchede();     break;
    case 'progressi':  initProgressi();  break;
    case 'profilo':    initProfilo();    break;
    case 'calendario': initCalendario(); break;
  }
});
