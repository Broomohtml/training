'use strict';

// ─── Config ───────────────────────────────────────────────────
const APP_VERSION = '0.0.9';

// ─── Keys ─────────────────────────────────────────────────────
const KEYS = {
  esercizi:       'tr_esercizi',
  schede:         'tr_schede',
  todo:           'tr_todo_today',
  sessioni:       'tr_sessioni',
  profilo:        'tr_profilo',
  settings:       'tr_settings',
  dieta:          'tr_dieta_today',   // legacy — solo acqua/note ora
  dieta_piano:    'tr_dieta_piano',
  dieta_settimana:'tr_dieta_settimana',
  ex_history:     'tr_ex_history',
};

const RATING_MENSA = {
  SS: { kcal: 700, prot: 50, label: 'Insalata Pollo / Bresaola' },
  S:  { kcal: 700, prot: 40, label: 'Riso Bianco + Proteina magra' },
  A:  { kcal: 700, prot: 35, label: 'Riso Venere Salmone e Zucchine' },
  B:  { kcal: 700, prot: 20, label: 'Pasta al pomodoro semplice' },
  C:  { kcal: 700, prot: 25, label: 'Secondi elaborati / Carne Rossa' },
  F:  { kcal: 700, prot: 15, label: 'Fritture / Lasagne / Pizza' },
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
function getDieta()            { return load(KEYS.dieta, { data: '', acqua: 0, proteine: 0, calorie: 0, note: '' }); }
function saveDieta(obj)        { store(KEYS.dieta, obj); }
function getDietaPiano()       { return load(KEYS.dieta_piano, null); }
function saveDietaPiano(arr)   { store(KEYS.dieta_piano, arr); }
function getDietaSettimana()   { return load(KEYS.dieta_settimana, { settimana_start: '', giorni: {} }); }
function saveDietaSettimana(o) { store(KEYS.dieta_settimana, o); }
function getExHistory()        { return load(KEYS.ex_history, {}); }
function saveExHistory(h)      { store(KEYS.ex_history, h); }

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

  if (!getDietaPiano()) {
    saveDietaPiano([
      {
        id: 'colazione', nome: 'Colazione', ora: '07:30', tipo: 'rotazione', opzione_attiva: 'dolce',
        opzioni: [
          { id: 'dolce', nome: 'Dolce', giorni: [
            { alimento: 'Yogurt greco, avena e miele',       grammi: '200g+50g+10g',          kcal: 350, prot: 20 },
            { alimento: 'Pancake proteici alla banana',      grammi: '1 uovo+50g+1 banana',   kcal: 380, prot: 22 },
            { alimento: "Porridge d'avena e mela",           grammi: '50g+150ml+10g',          kcal: 340, prot: 12 },
            { alimento: 'Yogurt greco e frutti rossi',       grammi: '200g+100g+15g',          kcal: 330, prot: 22 },
            { alimento: "Pancake con burro d'arachidi",      grammi: '1 uovo+50g+15g',         kcal: 390, prot: 18 },
            { alimento: 'Bowl di frutta e yogurt',           grammi: '200g+150g+15g',          kcal: 310, prot: 18 },
            { alimento: 'Pancake con gocce di cioccolato',   grammi: '2 uova+50g+10g',         kcal: 420, prot: 24 },
          ]},
          { id: 'salata', nome: 'Salata', giorni: [
            { alimento: 'Toast integrale con fesa di tacchino', grammi: '2 fette (60g)+60g',            kcal: 320, prot: 28 },
            { alimento: 'Omelette di soli albumi e spinaci',    grammi: '3 albumi+1 uovo+100g',         kcal: 310, prot: 32 },
            { alimento: 'Pane integrale con uovo in camicia',   grammi: '2 fette (60g)+1 uovo',         kcal: 330, prot: 18 },
            { alimento: 'Toast con tonno al naturale',          grammi: '2 fette (60g)+80g',            kcal: 300, prot: 30 },
            { alimento: '2 Uova sode e pane tostato',           grammi: '1 fetta (30g)+2 uova',         kcal: 340, prot: 20 },
            { alimento: 'Omelette uovo intero e formaggio',     grammi: '1 uovo+30g',                   kcal: 280, prot: 22 },
            { alimento: 'Uova strapazzate e avocado toast',     grammi: '50g avocado+1 fetta+2 uova',   kcal: 450, prot: 24 },
          ]},
        ],
      },
      {
        id: 'spuntino_mattina', nome: 'Spuntino Mattina', ora: '10:30', tipo: 'scelta', opzione_attiva: 'mandorle',
        opzioni: [
          { id: 'mandorle', nome: 'Mandorle',      alimento: 'Mandorle',      grammi: '20g',   kcal: 120, prot: 4 },
          { id: 'frutta',   nome: 'Frutta Fresca', alimento: 'Frutta Fresca', grammi: '150g',  kcal: 80,  prot: 1 },
        ],
      },
      {
        id: 'pranzo', nome: 'Pranzo (Mensa)', ora: '12:30', tipo: 'mensa',
        rating_suggerito: ['SS', 'S', 'A', 'SS', 'S', null, null],
      },
      {
        id: 'spuntino_pm', nome: 'Spuntino PM', ora: '16:30', tipo: 'scelta', opzione_attiva: 'bresaola',
        opzioni: [
          { id: 'bresaola', nome: 'Bresaola',       alimento: 'Bresaola',       grammi: '50g', kcal: 120, prot: 20 },
          { id: 'shake',    nome: 'Shake Proteico', alimento: 'Shake Proteico', grammi: '30g', kcal: 130, prot: 24 },
        ],
      },
      {
        id: 'cena', nome: 'Cena', ora: '20:00', tipo: 'rotazione', opzione_attiva: 'standard',
        opzioni: [
          { id: 'standard', nome: 'Standard', giorni: [
            { alimento: 'Pollo e Broccoli',                   grammi: '150g+200g+50g', kcal: 550, prot: 45 },
            { alimento: 'Coscia di Pollo e Insalata',         grammi: '180g+150g',     kcal: 500, prot: 40 },
            { alimento: 'Tacchino e Zucchine',                grammi: '150g+200g+60g', kcal: 580, prot: 42 },
            { alimento: 'Arista di maiale, Insalata e Pane',  grammi: '150g+200g+50g', kcal: 520, prot: 38 },
            { alimento: 'Bistecca magra e Insalata',          grammi: '150g+200g',     kcal: 600, prot: 48 },
            { alimento: 'Cena libera',                        grammi: '-',             kcal: null, prot: null },
            { alimento: 'Tacchino e Zucchine',                grammi: '150g+250g',     kcal: 400, prot: 38 },
          ]},
        ],
      },
    ]);
  }
}

// ─── Week/Date helpers ────────────────────────────────────────
function getWeekStart(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function dayIndex(isoDate) {
  return (new Date(isoDate + 'T00:00:00').getDay() + 6) % 7; // 0=Lun…6=Dom
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ─── Midnight Reset ───────────────────────────────────────────
function checkMidnightReset() {
  const today = getToday();
  const todo  = getTodo();
  if (todo.data !== today) {
    saveTodo({ data: today, tipo: todo.tipo || 'gym', completati: [] });
  }
  const ws = getWeekStart(today);
  const settimana = getDietaSettimana();
  if (settimana.settimana_start !== ws) {
    saveDietaSettimana({ settimana_start: ws, giorni: {} });
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

// ─── EXERCISE DETAIL ──────────────────────────────────────────
function openExerciseDetail(exId, tipo) {
  const ex = getEsercizi().find(e => e.id === exId);
  if (!ex) return;

  document.getElementById('exDetailName').textContent = ex.nome;

  const diff      = ex.difficolta || 'base';
  const reps      = ex.ripetizioni ?? (ex.timer_sec ? `${ex.timer_sec}s` : '—');
  const repsLabel = `${ex.serie} × ${reps}`;

  const body = document.getElementById('exDetailBody');
  const footer = document.getElementById('exDetailFooter');

  body.innerHTML = `
    <div class="ex-detail-badges">
      <span class="badge badge--reps">${repsLabel}</span>
      ${ex.focus ? `<span class="badge badge--focus">${ex.focus}</span>` : ''}
      <span class="badge badge--${diff}">${diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
    </div>

    ${ex.descrizione ? `
    <div class="ex-detail-section">
      <div class="ex-detail-section-label">Descrizione</div>
      <div class="ex-detail-text">${ex.descrizione}</div>
    </div>` : ''}

    ${ex.note ? `
    <div class="ex-detail-section">
      <div class="ex-detail-section-label">Note sulla forma</div>
      <div class="ex-detail-text">${ex.note}</div>
    </div>` : ''}

    ${ex.tempo ? `
    <div class="ex-detail-section">
      <div class="ex-detail-section-label">Tempo / Cadenza</div>
      <div class="ex-detail-text">${ex.tempo}</div>
    </div>` : ''}

    ${ex.youtube ? `
    <div class="ex-detail-section">
      <a href="${ex.youtube}" target="_blank" rel="noopener" class="ex-yt-btn">
        <span class="material-symbols-outlined">play_circle</span>
        Guarda su YouTube
      </a>
    </div>` : ''}

    <div class="ex-detail-section">
      <div class="ex-detail-section-label">Aggiorna progressi</div>
      <div class="ex-progress-row">
        <div class="ex-progress-field">
          <label>Serie</label>
          <input type="number" id="exEditSerie" class="form-input" value="${ex.serie || ''}" min="1" placeholder="3" />
        </div>
        <div class="ex-progress-field">
          <label>Ripetizioni</label>
          <input type="text" id="exEditReps" class="form-input" value="${ex.ripetizioni || ''}" placeholder="8-12" />
        </div>
      </div>
      <div class="ex-progress-row" style="padding-top:10px">
        <div class="ex-progress-field">
          <label>Peso (kg)</label>
          <input type="number" id="exEditPeso" class="form-input" value="${ex.peso || ''}" step="0.5" min="0" placeholder="0" />
        </div>
        <div class="ex-progress-field">
          <label>Timer (sec)</label>
          <input type="number" id="exEditTimer" class="form-input" value="${ex.timer_sec || ''}" min="1" placeholder="30" />
        </div>
      </div>
    </div>`;

  footer.innerHTML = `
    <button class="submit-btn" id="exDetailSave">
      <span class="material-symbols-outlined">save</span>
      Salva progressi
    </button>`;

  document.getElementById('exDetailSave').addEventListener('click', () => {
    saveExerciseProgress(exId, tipo);
  });

  openModal('exDetailOverlay');
}

function saveExerciseProgress(exId, tipo) {
  const esercizi = getEsercizi();
  const idx      = esercizi.findIndex(e => e.id === exId);
  if (idx === -1) return;

  const serie    = parseInt(document.getElementById('exEditSerie').value) || esercizi[idx].serie;
  const rips     = document.getElementById('exEditReps').value.trim() || esercizi[idx].ripetizioni;
  const peso     = parseFloat(document.getElementById('exEditPeso').value) || null;
  const timerSec = parseInt(document.getElementById('exEditTimer').value) || null;

  // Log to history before overwriting
  const hist = getExHistory();
  if (!hist[exId]) hist[exId] = [];
  hist[exId].push({ data: getToday(), serie, ripetizioni: rips, peso, timer_sec: timerSec });
  if (hist[exId].length > 20) hist[exId] = hist[exId].slice(-20);
  saveExHistory(hist);

  esercizi[idx] = { ...esercizi[idx], serie, ripetizioni: rips, peso, timer_sec: timerSec };
  saveEserciziStore(esercizi);

  closeModal('exDetailOverlay');
  renderExerciseList(tipo || getSettings().tipo);
  showToast('Progressi salvati ✓');
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

  // Exercise detail modal
  document.getElementById('exDetailClose')?.addEventListener('click', () => closeModal('exDetailOverlay'));
  document.getElementById('exDetailOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('exDetailOverlay')) closeModal('exDetailOverlay');
  });

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
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleCheck(btn.dataset.id, tipo);
    });
  });

  list.querySelectorAll('.exercise-timer-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const ex = esercizi.find(e => e.id === btn.dataset.id);
      if (ex && ex.timer_sec) startTimer(ex.timer_sec, ex.nome);
    });
  });

  list.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', () => openExerciseDetail(card.dataset.id, tipo));
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
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
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
  renderIncrements();
  renderSessioniRecenti();

  document.getElementById('corsaBtn')?.addEventListener('click', handleCorsa);
}

function parseReps(rips) {
  if (!rips) return null;
  const m = String(rips).match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function calcIncrements() {
  const hist = getExHistory();
  const esercizi = getEsercizi();
  const increments = [];

  Object.entries(hist).forEach(([exId, entries]) => {
    if (entries.length < 2) return;
    const prev = entries[entries.length - 2];
    const curr = entries[entries.length - 1];
    const ex = esercizi.find(e => e.id === exId);
    if (!ex) return;

    const deltas = [];
    const prevReps = parseReps(prev.ripetizioni);
    const currReps = parseReps(curr.ripetizioni);
    if (prevReps !== null && currReps !== null && currReps !== prevReps) {
      deltas.push({ type: 'rip', diff: currReps - prevReps, prev: prev.ripetizioni, curr: curr.ripetizioni });
    }
    if (prev.peso != null && curr.peso != null && curr.peso !== prev.peso) {
      const diff = Math.round((curr.peso - prev.peso) * 10) / 10;
      deltas.push({ type: 'kg', diff, prev: prev.peso, curr: curr.peso });
    }
    if (prev.serie && curr.serie && curr.serie !== prev.serie) {
      deltas.push({ type: 'serie', diff: curr.serie - prev.serie, prev: prev.serie, curr: curr.serie });
    }

    if (deltas.length > 0) {
      increments.push({ nome: ex.nome, deltas, data: curr.data });
    }
  });

  increments.sort((a, b) => b.data.localeCompare(a.data));
  return increments;
}

function renderIncrements() {
  const grid = document.getElementById('incrementiGrid');
  if (!grid) return;
  const increments = calcIncrements();

  if (increments.length === 0) {
    grid.innerHTML = '<div class="incrementi-empty">Nessun incremento ancora.<br>Salva i progressi di un esercizio per vederli qui.</div>';
    return;
  }

  const unitLabel = { rip: ' rip', kg: ' kg', serie: ' ser' };
  const detailLabel = {
    rip:   d => `${d.prev} → ${d.curr} ripetizioni`,
    kg:    d => `${d.prev} → ${d.curr} kg`,
    serie: d => `${d.prev} → ${d.curr} serie`,
  };

  grid.innerHTML = increments.slice(0, 8).map(inc => {
    const d = inc.deltas[0];
    const sign = d.diff > 0 ? '+' : '';
    const positive = d.diff > 0;
    return `
      <div class="incremento-card ${positive ? 'positivo' : 'negativo'}">
        <div class="incremento-delta">${sign}${d.diff}${unitLabel[d.type]}</div>
        <div class="incremento-nome">${inc.nome}</div>
        <div class="incremento-detail">${detailLabel[d.type](d)}</div>
        <div class="incremento-date">${formatDateShort(inc.data)}</div>
      </div>`;
  }).join('');
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
  const detail  = document.getElementById('calDayDetail');
  const dateEl  = document.getElementById('calDetailDate');
  const itemsEl = document.getElementById('calDetailItems');
  if (!detail) return;

  const d        = new Date(iso + 'T00:00:00');
  const sessioni = getSessioni().filter(s => s.data === iso);

  dateEl.textContent = `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;

  if (sessioni.length === 0) {
    itemsEl.innerHTML = '<div style="font-size:13px;color:var(--text-3)">Nessuna attività registrata</div>';
  } else {
    itemsEl.innerHTML = sessioni.map(s => `
      <div class="cal-detail-item">
        <div class="cal-detail-dot" style="background:${TIPO_COLOR[s.tipo]}"></div>
        <span style="flex:1">${TIPO_LABEL[s.tipo] || s.tipo}</span>
        <button class="cal-delete-btn" data-id="${s.id}" aria-label="Elimina">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`).join('');

    itemsEl.querySelectorAll('.cal-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteSessione(btn.dataset.id, iso));
    });
  }

  detail.style.display = 'block';

  document.querySelectorAll('.cal-cell').forEach(c => {
    c.classList.toggle('selected', c.dataset.iso === iso);
  });
}

function deleteSessione(sessionId, iso) {
  const sessioni = getSessioni().filter(s => s.id !== sessionId);
  saveSessioni(sessioni);
  showToast('Attività eliminata');
  renderCalendario();
  // rebuild activityMap and re-show detail (or hide if empty)
  const remaining = sessioni.filter(s => s.data === iso);
  if (remaining.length === 0) {
    hideDayDetail();
  } else {
    const activityMap = {};
    sessioni.forEach(s => {
      if (!activityMap[s.data]) activityMap[s.data] = [];
      if (!activityMap[s.data].includes(s.tipo)) activityMap[s.data].push(s.tipo);
    });
    showDayDetail(iso, activityMap);
  }
}

function hideDayDetail() {
  _calSelectedDay = null;
  const detail = document.getElementById('calDayDetail');
  if (detail) detail.style.display = 'none';
}

// ─── DIETA v2 ─────────────────────────────────────────────────
let _dietaCurrentDay = getToday();

function getDayRecord(isoDate) {
  const s = getDietaSettimana();
  return s.giorni[isoDate] || { acqua: 0, note: '', pasti: {} };
}

function saveDayRecord(isoDate, rec) {
  const s = getDietaSettimana();
  s.giorni[isoDate] = rec;
  saveDietaSettimana(s);
}

function getMealData(slot, isoDate) {
  const di = dayIndex(isoDate);
  if (slot.tipo === 'scelta') {
    return slot.opzioni.find(o => o.id === slot.opzione_attiva) || slot.opzioni[0];
  }
  if (slot.tipo === 'rotazione') {
    const opt = slot.opzioni.find(o => o.id === slot.opzione_attiva) || slot.opzioni[0];
    if (!opt) return null;
    const giorno = opt.giorni[di] || {};
    return { ...giorno, _opt_nome: opt.nome };
  }
  if (slot.tipo === 'mensa' && (di === 5 || di === 6)) {
    return di === 5
      ? { alimento: 'Insalatona con Bresaola', grammi: '500g', kcal: 440, prot: 30 }
      : { alimento: 'Pranzo libero', grammi: '-', kcal: null, prot: null };
  }
  return null; // mensa handled separately
}

function initDieta() {
  // Sub-tab switching
  document.querySelectorAll('.dieta-subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dieta-subtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.subtab;
      document.getElementById('dietaPanelOggi').classList.toggle('hidden', tab !== 'oggi');
      document.getElementById('dietaPanelPiano').classList.toggle('hidden', tab !== 'piano');
      if (tab === 'piano') renderPianoSlots();
    });
  });

  // Day navigation
  _dietaCurrentDay = getToday();
  document.getElementById('dietaDayPrev')?.addEventListener('click', () => {
    const ws = getWeekStart(getToday());
    if (_dietaCurrentDay > ws) {
      _dietaCurrentDay = addDays(_dietaCurrentDay, -1);
      renderOggi();
    }
  });
  document.getElementById('dietaDayNext')?.addEventListener('click', () => {
    const today = getToday();
    if (_dietaCurrentDay < today) {
      _dietaCurrentDay = addDays(_dietaCurrentDay, 1);
      renderOggi();
    }
  });

  // Acqua
  document.getElementById('acquaMinus')?.addEventListener('click', () => adjustAcqua(-1));
  document.getElementById('acquaPlus')?.addEventListener('click',  () => adjustAcqua(1));

  // Note
  document.getElementById('dietaNoteInput')?.addEventListener('input', e => {
    const rec = getDayRecord(_dietaCurrentDay);
    rec.note = e.target.value;
    saveDayRecord(_dietaCurrentDay, rec);
  });

  // Piano modals
  initModalClose('addOpzioneOverlay',    'addOpzioneClose',    () => closeModal('addOpzioneOverlay'));
  initModalClose('editRotazioneOverlay', 'editRotazioneClose', () => closeModal('editRotazioneOverlay'));
  document.getElementById('addOpzioneSubmit')?.addEventListener('click', handleAddOpzioneSubmit);
  document.getElementById('editRotazioneSave')?.addEventListener('click', handleEditRotazioneSave);

  renderOggi();
}

function adjustAcqua(delta) {
  const rec = getDayRecord(_dietaCurrentDay);
  rec.acqua = Math.max(0, (rec.acqua || 0) + delta);
  saveDayRecord(_dietaCurrentDay, rec);
  const el = document.getElementById('valAcqua');
  if (el) el.textContent = rec.acqua;
}

function renderOggi() {
  const today = getToday();
  const ws    = getWeekStart(today);
  const isToday = _dietaCurrentDay === today;
  const isReadOnly = _dietaCurrentDay !== today;

  // Day label
  const labelEl = document.getElementById('dietaDayLabel');
  if (labelEl) {
    const d = new Date(_dietaCurrentDay + 'T00:00:00');
    const dayName = GIORNI[d.getDay()];
    const dateStr = `${d.getDate()} ${MESI[d.getMonth()]}`;
    labelEl.innerHTML = isToday
      ? `Oggi<small>${dateStr}</small>`
      : `${dayName}<small>${dateStr}</small>`;
  }

  // Nav buttons
  const prevBtn = document.getElementById('dietaDayPrev');
  const nextBtn = document.getElementById('dietaDayNext');
  if (prevBtn) prevBtn.disabled = _dietaCurrentDay <= ws;
  if (nextBtn) nextBtn.disabled = _dietaCurrentDay >= today;

  // Acqua + note
  const rec = getDayRecord(_dietaCurrentDay);
  const acquaEl = document.getElementById('valAcqua');
  if (acquaEl) acquaEl.textContent = rec.acqua || 0;
  const noteEl = document.getElementById('dietaNoteInput');
  if (noteEl) {
    noteEl.value = rec.note || '';
    noteEl.disabled = isReadOnly;
  }

  // Meal cards
  renderMealCards(isReadOnly);

  // Macro bar
  updateMacroBar();
}

function renderMealCards(readOnly) {
  const container = document.getElementById('dietaMealCards');
  if (!container) return;
  const piano = getDietaPiano();
  if (!piano) return;
  const rec = getDayRecord(_dietaCurrentDay);
  const pasti = rec.pasti || {};

  container.innerHTML = piano.map(slot => {
    if (slot.tipo === 'mensa') return buildMensaCard(slot, pasti[slot.id], readOnly);
    return buildPastoCard(slot, pasti[slot.id], readOnly);
  }).join('');

  // Attach events
  container.querySelectorAll('.pasto-check-btn').forEach(btn => {
    btn.addEventListener('click', () => togglePasto(btn.dataset.slot));
  });
  container.querySelectorAll('.mensa-rating-btn').forEach(btn => {
    btn.addEventListener('click', () => selectRating(btn.dataset.slot, btn.dataset.rating));
  });
}

function buildPastoCard(slot, pastoRec, readOnly) {
  const meal = getMealData(slot, _dietaCurrentDay);
  if (!meal) return '';
  const mangiato = pastoRec?.mangiato || false;
  const kcal = meal.kcal ?? '—';
  const prot = meal.prot ?? '—';

  return `
    <div class="pasto-card ${mangiato ? 'mangiato' : ''}" data-slot="${slot.id}">
      <div class="pasto-card-top">
        <button class="pasto-check-btn ${readOnly ? 'disabled' : ''}" data-slot="${slot.id}" ${readOnly ? 'disabled' : ''}>
          <span class="material-symbols-outlined">check</span>
        </button>
        <div class="pasto-info">
          <div class="pasto-ora">${slot.ora}</div>
          <div class="pasto-nome">${slot.nome}</div>
          <div class="pasto-alimento">${meal.alimento || '—'}</div>
        </div>
        <div class="pasto-macros">
          <span class="pasto-kcal">${kcal !== null && kcal !== '—' ? kcal + ' kcal' : '—'}</span>
          <span class="pasto-prot">${prot !== null && prot !== '—' ? prot + 'g prot' : ''}</span>
        </div>
      </div>
    </div>`;
}

function buildMensaCard(slot, pastoRec, readOnly) {
  const di = dayIndex(_dietaCurrentDay);

  // Weekend: no mensa, render as regular pasto card
  if (di === 5 || di === 6) {
    const meal = getMealData(slot, _dietaCurrentDay);
    const mangiato = pastoRec?.mangiato || false;
    return `
      <div class="pasto-card ${mangiato ? 'mangiato' : ''}" data-slot="${slot.id}">
        <div class="pasto-card-top">
          <button class="pasto-check-btn ${readOnly ? 'disabled' : ''}" data-slot="${slot.id}" ${readOnly ? 'disabled' : ''}>
            <span class="material-symbols-outlined">check</span>
          </button>
          <div class="pasto-info">
            <div class="pasto-ora">${slot.ora}</div>
            <div class="pasto-nome">Pranzo</div>
            <div class="pasto-alimento">${meal.alimento}</div>
          </div>
          <div class="pasto-macros">
            <span class="pasto-kcal">${meal.kcal !== null ? meal.kcal + ' kcal' : '—'}</span>
            <span class="pasto-prot">${meal.prot !== null ? meal.prot + 'g prot' : ''}</span>
          </div>
        </div>
      </div>`;
  }

  const selectedRating = pastoRec?.rating || null;
  const suggerito = slot.rating_suggerito?.[di] || null;

  const btnHtml = Object.keys(RATING_MENSA).map(r => {
    const sel = selectedRating === r;
    return `<button class="mensa-rating-btn ${sel ? 'selected-' + r : ''}" data-slot="${slot.id}" data-rating="${r}" ${readOnly && !sel ? 'disabled' : ''}>${r}<small>${RATING_MENSA[r].prot}g</small></button>`;
  }).join('');

  const infoHtml = selectedRating ? `
    <div class="mensa-selected-info">
      ${RATING_MENSA[selectedRating].label} · ${RATING_MENSA[selectedRating].kcal} kcal · ${RATING_MENSA[selectedRating].prot}g prot
    </div>` : (suggerito ? `<div class="mensa-selected-info" style="opacity:.5">Suggerito oggi: ${suggerito}</div>` : '');

  return `
    <div class="pasto-card ${selectedRating ? 'mangiato' : ''}" data-slot="${slot.id}">
      <div class="pasto-card-top">
        <div class="pasto-info">
          <div class="pasto-ora">${slot.ora}</div>
          <div class="pasto-nome">${slot.nome}</div>
        </div>
        ${selectedRating ? `<div class="pasto-macros"><span class="pasto-kcal">${RATING_MENSA[selectedRating].kcal} kcal</span><span class="pasto-prot">${RATING_MENSA[selectedRating].prot}g prot</span></div>` : ''}
      </div>
      <div class="mensa-rating-wrap">
        <div class="mensa-rating-btns">${btnHtml}</div>
        ${infoHtml}
      </div>
    </div>`;
}

function togglePasto(slotId) {
  const rec = getDayRecord(_dietaCurrentDay);
  if (!rec.pasti) rec.pasti = {};
  const cur = rec.pasti[slotId] || {};
  cur.mangiato = !cur.mangiato;
  rec.pasti[slotId] = cur;
  saveDayRecord(_dietaCurrentDay, rec);
  renderMealCards(false);
  updateMacroBar();
}

function selectRating(slotId, rating) {
  const rec = getDayRecord(_dietaCurrentDay);
  if (!rec.pasti) rec.pasti = {};
  const cur = rec.pasti[slotId] || {};
  cur.rating = cur.rating === rating ? null : rating; // toggle off if same
  cur.mangiato = !!cur.rating;
  rec.pasti[slotId] = cur;
  saveDayRecord(_dietaCurrentDay, rec);
  renderMealCards(false);
  updateMacroBar();
}

function updateMacroBar() {
  const piano = getDietaPiano();
  if (!piano) return;
  const rec = getDayRecord(_dietaCurrentDay);
  const pasti = rec.pasti || {};
  const profilo = getProfilo();
  const kcalTarget = profilo.kcal_target || 1810;
  const protTarget = profilo.prot_target || 140;

  let totalKcal = 0, totalProt = 0;

  piano.forEach(slot => {
    const p = pasti[slot.id];
    if (!p?.mangiato) return;
    if (slot.tipo === 'mensa') {
      const di = dayIndex(_dietaCurrentDay);
      if (di === 5 || di === 6) {
        const meal = getMealData(slot, _dietaCurrentDay);
        if (meal?.kcal) totalKcal += meal.kcal;
        if (meal?.prot) totalProt += meal.prot;
      } else {
        const r = RATING_MENSA[p.rating];
        if (r) { totalKcal += r.kcal; totalProt += r.prot; }
      }
    } else {
      const meal = getMealData(slot, _dietaCurrentDay);
      if (meal?.kcal) totalKcal += meal.kcal;
      if (meal?.prot) totalProt += meal.prot;
    }
  });

  const pctKcal = Math.min(100, Math.round((totalKcal / kcalTarget) * 100));
  const pctProt = Math.min(100, Math.round((totalProt / protTarget) * 100));

  const kFill = document.getElementById('macroKcalFill');
  const pFill = document.getElementById('macroPRotFill');
  const kVal  = document.getElementById('macroKcalVal');
  const pVal  = document.getElementById('macroPRotVal');

  if (kFill) kFill.style.width = pctKcal + '%';
  if (pFill) pFill.style.width = pctProt + '%';
  if (kVal)  kVal.textContent  = `${totalKcal} / ${kcalTarget}`;
  if (pVal)  pVal.textContent  = `${totalProt}g / ${protTarget}g`;
}

// ─── PIANO TAB ────────────────────────────────────────────────
function renderPianoSlots() {
  const container = document.getElementById('dietaPianoSlots');
  if (!container) return;
  const piano = getDietaPiano();
  if (!piano) return;
  const today = getToday();
  const di = dayIndex(today);

  container.innerHTML = piano.map(slot => {
    if (slot.tipo === 'mensa') return buildMensaPianoSlot(slot);
    return buildPianoSlot(slot, di);
  }).join('');

  // Option select events
  container.querySelectorAll('.piano-option').forEach(el => {
    el.addEventListener('click', () => {
      const slotId = el.dataset.slot;
      const optId  = el.dataset.opt;
      setOpzioneAttiva(slotId, optId);
    });
  });

  // Add option
  container.querySelectorAll('.piano-add-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddOpzione(btn.dataset.slot));
  });

  // Edit rotazione
  container.querySelectorAll('.rot-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEditRotazione(btn.dataset.slot, btn.dataset.opt);
    });
  });
}

function buildPianoSlot(slot, di) {
  const optsHtml = slot.opzioni.map(opt => {
    const isActive = opt.id === slot.opzione_attiva;
    let sub = '';
    if (slot.tipo === 'rotazione') {
      const g = opt.giorni[di];
      sub = g ? `${g.alimento}` : '';
    } else {
      sub = opt.alimento || '';
    }
    const macros = slot.tipo === 'rotazione'
      ? (opt.giorni[di]?.kcal ? `${opt.giorni[di].kcal} kcal` : '')
      : (opt.kcal ? `${opt.kcal} kcal` : '');

    const editBtn = slot.tipo === 'rotazione'
      ? `<button class="rot-edit-btn" data-slot="${slot.id}" data-opt="${opt.id}"><span class="material-symbols-outlined">edit</span></button>`
      : '';

    return `
      <div class="piano-option ${isActive ? 'active' : ''}" data-slot="${slot.id}" data-opt="${opt.id}">
        <span class="piano-opt-check"><span class="material-symbols-outlined">check</span></span>
        <div class="piano-opt-info">
          <div class="piano-opt-nome">${opt.nome}</div>
          ${sub ? `<div class="piano-opt-sub">${sub}</div>` : ''}
        </div>
        <span class="piano-opt-macros">${macros}</span>
        ${editBtn}
      </div>`;
  }).join('');

  return `
    <div class="piano-slot">
      <div class="piano-slot-header">
        <span class="piano-slot-nome">${slot.nome}</span>
        <span class="piano-slot-ora">${slot.ora}</span>
      </div>
      ${optsHtml}
      <button class="piano-add-btn" data-slot="${slot.id}">
        <span class="material-symbols-outlined">add</span>
        Aggiungi opzione
      </button>
    </div>`;
}

function buildMensaPianoSlot(slot) {
  const di = dayIndex(getToday());
  const sug = slot.rating_suggerito?.[di];
  return `
    <div class="piano-slot">
      <div class="piano-slot-header">
        <span class="piano-slot-nome">${slot.nome}</span>
        <span class="piano-slot-ora">${slot.ora}</span>
      </div>
      <div style="padding:10px 14px;font-size:13px;color:var(--text-2)">
        Sistema a rating SS → F. ${sug ? `Oggi suggerito: <strong>${sug}</strong>` : 'Seleziona il rating dal tab Oggi.'}
      </div>
    </div>`;
}

function setOpzioneAttiva(slotId, optId) {
  const piano = getDietaPiano();
  const slot  = piano.find(s => s.id === slotId);
  if (!slot || slot.opzione_attiva === optId) return;
  slot.opzione_attiva = optId;
  saveDietaPiano(piano);
  renderPianoSlots();
  renderMealCards(false);
  updateMacroBar();
  showToast('Opzione aggiornata');
}

function openAddOpzione(slotId) {
  const piano = getDietaPiano();
  const slot  = piano.find(s => s.id === slotId);
  if (!slot) return;
  const titleEl = document.getElementById('addOpzioneTitle');
  if (titleEl) titleEl.textContent = `Nuova opzione — ${slot.nome}`;
  document.getElementById('addOpzioneForm').dataset.slotId = slotId;
  document.getElementById('addOpzioneForm').reset();
  openModal('addOpzioneOverlay');
}

function handleAddOpzioneSubmit() {
  const form   = document.getElementById('addOpzioneForm');
  const slotId = form.dataset.slotId;
  const nome   = form.querySelector('[name="nome"]').value.trim();
  if (!nome) { showToast('Inserisci un nome'); return; }

  const piano = getDietaPiano();
  const slot  = piano.find(s => s.id === slotId);
  if (!slot) return;

  const kcal = parseInt(form.querySelector('[name="kcal"]').value) || null;
  const prot = parseInt(form.querySelector('[name="prot"]').value) || null;
  const alim = form.querySelector('[name="alimento"]').value.trim();
  const gram = form.querySelector('[name="grammi"]').value.trim();

  const newId = slotId + '_' + uuid();

  if (slot.tipo === 'rotazione') {
    // New rotazione option: same data for all 7 days
    slot.opzioni.push({
      id: newId, nome,
      giorni: Array(7).fill(null).map(() => ({ alimento: alim, grammi: gram, kcal, prot })),
    });
  } else {
    slot.opzioni.push({ id: newId, nome, alimento: alim, grammi: gram, kcal, prot });
  }

  saveDietaPiano(piano);
  closeModal('addOpzioneOverlay');
  renderPianoSlots();
  showToast('Opzione aggiunta');
}

function openEditRotazione(slotId, optId) {
  const piano = getDietaPiano();
  const slot  = piano.find(s => s.id === slotId);
  const opt   = slot?.opzioni.find(o => o.id === optId);
  if (!opt) return;

  const titleEl = document.getElementById('editRotazioneTitle');
  if (titleEl) titleEl.textContent = `${slot.nome} — ${opt.nome}`;
  const body = document.getElementById('editRotazioneBody');
  body.dataset.slotId = slotId;
  body.dataset.optId  = optId;

  const daysShort = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  body.innerHTML = opt.giorni.map((g, i) => `
    <div class="rot-day-row" data-day="${i}">
      <span class="rot-day-label">${daysShort[i]}</span>
      <div class="rot-day-fields">
        <input type="text" class="form-input" style="font-size:13px;padding:8px 10px" data-field="alimento" value="${g?.alimento || ''}" placeholder="Alimento" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px">
          <input type="text" class="form-input" style="font-size:12px;padding:7px 8px" data-field="grammi" value="${g?.grammi || ''}" placeholder="Grammi" />
          <input type="number" class="form-input" style="font-size:12px;padding:7px 8px" data-field="kcal" value="${g?.kcal || ''}" placeholder="Kcal" />
        </div>
        <div style="display:grid;grid-template-columns:1fr;margin-top:4px">
          <input type="number" class="form-input" style="font-size:12px;padding:7px 8px" data-field="prot" value="${g?.prot || ''}" placeholder="Prot (g)" />
        </div>
      </div>
    </div>`).join('');

  openModal('editRotazioneOverlay');
}

function handleEditRotazioneSave() {
  const body   = document.getElementById('editRotazioneBody');
  const slotId = body.dataset.slotId;
  const optId  = body.dataset.optId;
  const piano  = getDietaPiano();
  const slot   = piano.find(s => s.id === slotId);
  const opt    = slot?.opzioni.find(o => o.id === optId);
  if (!opt) return;

  body.querySelectorAll('.rot-day-row').forEach(row => {
    const i = parseInt(row.dataset.day);
    opt.giorni[i] = {
      alimento: row.querySelector('[data-field="alimento"]').value.trim(),
      grammi:   row.querySelector('[data-field="grammi"]').value.trim(),
      kcal:     parseInt(row.querySelector('[data-field="kcal"]').value) || null,
      prot:     parseInt(row.querySelector('[data-field="prot"]').value) || null,
    };
  });

  saveDietaPiano(piano);
  closeModal('editRotazioneOverlay');
  renderPianoSlots();
  renderMealCards(false);
  updateMacroBar();
  showToast('Rotazione salvata');
}

// ─── DOMContentLoaded ─────────────────────────────────────────
window.addEventListener('pageshow', () => {
  document.body.style.opacity = '1';
});

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
