// WebApp principal - checklist machines
// Comportements :
// - Génère UUID à la première ouverture
// - Demande le nom du technicien (stocké en localStorage)
// - Sauvegarde automatique du rapport en cours dans localStorage
// - Téléchargement des checklists depuis un dépôt GitHub (fichier JSON raw)
// - Synchronisation quotidienne des statistiques vers un endpoint serveur
// - Offline via Service Worker (service-worker.js) et cache de l'app

// ---------- Config ----------
const CONFIG = {
  // URL publique RAW où sont stockées les checklists (json). Adapter à ton repo.
  CHECKLISTS_URL: 'https://raw.githubusercontent.com/OWNER/REPO/main/checklists.json',
  // Endpoint backend pour la synchronisation (doit être implémenté côté serveur)
  SYNC_ENDPOINT: 'https://your-sync-server.example.com/sync',
  APP_VERSION: '1.0.0',
  DAILY_SYNC_MS: 24 * 60 * 60 * 1000
};

// ---------- Helpers ----------
function log(...args){ console.log('[app]', ...args) }
function uuidv4(){
  // Use crypto.randomUUID when available
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
function nowISO(){ return new Date().toISOString() }

// ---------- DOM ----------
const el = {
  uuid: document.getElementById('uuid'),
  technician: document.getElementById('technician'),
  resetProfile: document.getElementById('resetProfile'),
  machineType: document.getElementById('machineType'),
  newReport: document.getElementById('newReport'),
  downloadChecklists: document.getElementById('downloadChecklists'),
  checklist: document.getElementById('checklist'),
  reportTitle: document.getElementById('reportTitle'),
  saveReport: document.getElementById('saveReport'),
  clearReport: document.getElementById('clearReport'),
  saveStatus: document.getElementById('saveStatus'),
  itemTemplate: document.getElementById('itemTemplate')
};

// ---------- State ----------
let state = {
  uuid: localStorage.getItem('app_uuid') || null,
  technician: localStorage.getItem('technician_name') || null,
  checklists: {}, // loaded from remote or default
  currentReport: null, // {id, machineType, createdAt, items: []}
  autosaveTimer: null
};

// ---------- Init ----------
async function init(){
  // Register service worker
  if ('serviceWorker' in navigator){
    try{
      await navigator.serviceWorker.register('/service-worker.js');
      log('Service Worker enregistré');
    }catch(e){ console.warn('Erreur SW', e) }
  }

  // UUID and technician
  if(!state.uuid){
    state.uuid = uuidv4();
    localStorage.setItem('app_uuid', state.uuid);
  }
  el.uuid.textContent = 'UUID:' + state.uuid;

  if(!state.technician){
    await askTechnicianName();
  } else {
    el.technician.textContent = 'Tech: ' + state.technician;
  }

  // Load checklists from localStorage (fallback)
  const saved = localStorage.getItem('checklists_v1');
  if(saved) state.checklists = JSON.parse(saved);

  // Populate machine select from loaded checklists or defaults
  populateMachineSelect();

  // Try to fetch remote checklists
  try { await fetchRemoteChecklists(); }
  catch(e){ log('fetchRemoteChecklists failed', e) }

  // Restore an in-progress report if present
  const inprogress = localStorage.getItem('current_report_v1');
  if(inprogress){
    state.currentReport = JSON.parse(inprogress);
    renderReport();
  }

  // Event handlers
  el.newReport.addEventListener('click', newReport);
  el.machineType.addEventListener('change', ()=> {
    if(state.currentReport) state.currentReport.machineType = el.machineType.value || null;
    renderReport();
  });
  el.saveReport.addEventListener('click', () => { saveReport(true) });
  el.clearReport.addEventListener('click', () => { clearReport(); });
  el.downloadChecklists.addEventListener('click', fetchRemoteChecklists);
  el.resetProfile.addEventListener('click', resetProfile);

  // Auto-sync daily if online
  window.addEventListener('online', tryDailySync);
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') tryDailySync();
  });

  // Save before unload (safeguard for Safari crash)
  window.addEventListener('beforeunload', () => {
    saveReport();
  });

  // Try register periodic sync (if supported)
  tryRegisterPeriodicSync();

  // Try daily sync on load
  tryDailySync();
}

// ---------- Technician prompt ----------
async function askTechnicianName(){
  // simple prompt (could be replaced by nicer modal)
  let name = '';
  while(!name){
    name = prompt('Nom du technicien (sera stocké localement) :');
    if(name === null) { name = ''; break; } // user cancelled: set blank but store nothing
    name = name.trim();
  }
  if(name){
    state.technician = name;
    localStorage.setItem('technician_name', name);
    el.technician.textContent = 'Tech: ' + name;
  } else {
    el.technician.textContent = 'Tech: (non renseigné)';
  }
}

// ---------- Profile reset ----------
function resetProfile(){
  if(confirm('Réinitialiser UUID et nom du technicien ?')){
    localStorage.removeItem('app_uuid');
    localStorage.removeItem('technician_name');
    localStorage.removeItem('current_report_v1');
    state.uuid = null; state.technician = null; state.currentReport = null;
    location.reload();
  }
}

// ---------- Checklists loading ----------
function populateMachineSelect(){
  // From state.checklists keys
  const keys = Object.keys(state.checklists);
  el.machineType.innerHTML = '';
  if(keys.length === 0){
    // Default list
    ['C100','T700','R515','Autre'].forEach(k=>{
      const opt = document.createElement('option'); opt.value = k; opt.textContent = k;
      el.machineType.append(opt);
    });
    return;
  }
  keys.forEach(k=>{
    const opt = document.createElement('option'); opt.value = k; opt.textContent = k;
    el.machineType.append(opt);
  });
}

async function fetchRemoteChecklists(){
  el.downloadChecklists.disabled = true;
  el.downloadChecklists.textContent = 'Téléchargement...';
  try{
    const resp = await fetch(CONFIG.CHECKLISTS_URL, {cache:'no-store'});
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    // Expect structure: { "C100": [...items], "T700": [...], ... }
    state.checklists = json;
    localStorage.setItem('checklists_v1', JSON.stringify(json));
    populateMachineSelect();
    alert('Checklists téléchargées');
  }catch(e){
    console.error('Erreur fetch checklists', e);
    alert('Impossible de télécharger les checklists : ' + e.message);
  } finally {
    el.downloadChecklists.disabled = false;
    el.downloadChecklists.textContent = 'Télécharger checklists';
  }
}

// ---------- Report functions ----------
function newReport(){
  const machineType = el.machineType.value || null;
  const createdAt = nowISO();
  const id = `${state.uuid}_${Date.now()}`;
  // Load default items from checklists for selected machine
  const itemsTemplate = (state.checklists[machineType] || defaultChecklist()).map((it,idx) => {
    return {
      label: it.label || `Item ${idx+1}`,
      icon: it.icon || '🔧',
      checked: false,
      subitems: (it.subitems || []).map(s => ({label: s.label, icon: s.icon || '🔹', checked: false}))
    };
  });
  state.currentReport = { id, machineType, createdAt, items: itemsTemplate };
  renderReport();
  saveReport(true);
}

function defaultChecklist(){
  // Exemple minimal si pas de checklists externes
  return [
    {label: 'Inspection visuelle', icon: '👀', subitems: [{label:'Capots'}, {label:'Connecteurs'}]},
    {label: 'Test électrique', icon:'⚡', subitems: [{label:'Alimentation'}, {label:'Masse'}]},
  ];
}

function renderReport(){
  if(!state.currentReport){
    el.reportTitle.textContent = 'Aucun rapport';
    el.checklist.innerHTML = '<p>Créer un nouveau rapport.</p>';
    return;
  }
  el.reportTitle.textContent = `Rapport: ${state.currentReport.machineType || 'Inconnu'} — ${new Date(state.currentReport.createdAt).toLocaleString()}`;
  // Set machine select
  el.machineType.value = state.currentReport.machineType || '';
  el.checklist.innerHTML = '';
  state.currentReport.items.forEach((it, i) => {
    const tpl = el.itemTemplate.content.cloneNode(true);
    const itemNode = tpl.querySelector('.item');
    const checkbox = tpl.querySelector('input[type=checkbox]');
    const label = tpl.querySelector('.label');
    const icon = tpl.querySelector('.icon');
    const subitemsDiv = tpl.querySelector('.subitems');

    checkbox.checked = !!it.checked;
    label.textContent = it.label;
    icon.textContent = it.icon || '🔧';

    checkbox.addEventListener('change', (e) => {
      it.checked = e.target.checked;
      // If parent toggled, optionally toggle subitems
      if(it.subitems && it.subitems.length){
        it.subitems.forEach(s => s.checked = it.checked);
      }
      renderReport(); // re-render to update subitems
      scheduleAutosave();
    });

    // Render subitems
    if(it.subitems && it.subitems.length){
      it.subitems.forEach((s, si) => {
        const div = document.createElement('div'); div.className = 'sub';
        const cb = document.createElement('input'); cb.type='checkbox';
        cb.checked = !!s.checked;
        cb.addEventListener('change', (e) => {
          s.checked = e.target.checked;
          // If any sub unchecked, unset parent
          if(!s.checked) it.checked = false;
          else {
            // If all subs checked, set parent
            if(it.subitems.every(x=>x.checked)) it.checked = true;
          }
          renderReport();
          scheduleAutosave();
        });
        const ic = document.createElement('span'); ic.className='icon'; ic.textContent = s.icon || '🔹';
        const lbl = document.createElement('span'); lbl.textContent = s.label;
        div.append(cb, ic, lbl);
        subitemsDiv.appendChild(div);
      });
    }

    el.checklist.appendChild(itemNode);
  });
}

// ---------- Save / Autosave ----------
function scheduleAutosave(){
  if(state.autosaveTimer) clearTimeout(state.autosaveTimer);
  state.autosaveTimer = setTimeout(()=> saveReport(), 700);
  // immediate local visual cue
  el.saveStatus.textContent = 'Modifications non enregistrées...';
}

function saveReport(manual=false){
  if(!state.currentReport) return;
  // persist in localStorage
  localStorage.setItem('current_report_v1', JSON.stringify(state.currentReport));
  el.saveStatus.textContent = 'Enregistré localement ' + new Date().toLocaleTimeString();
  // optionally send small usage stat to server (non-blocking)
  if(manual) tryDailySync(true); // force attempt on manual save
}

// Clear current
function clearReport(){
  if(!state.currentReport) return;
  if(confirm('Effacer le rapport courant ?')) {
    state.currentReport = null;
    localStorage.removeItem('current_report_v1');
    renderReport();
  }
}

// ---------- Synchronisation des statistiques ----------
async function tryDailySync(force=false){
  // If offline, skip
  if(!navigator.onLine) { log('Offline, sync postponed'); return; }
  const lastSync = localStorage.getItem('last_stats_sync_v1');
  const last = lastSync ? new Date(lastSync).getTime() : 0;
  const now = Date.now();
  if(!force && (now - last) < CONFIG.DAILY_SYNC_MS){
    log('Sync non nécessaire (déjà fait aujourd\'hui)');
    return;
  }
  // Build payload
  const payload = {
    uuid: state.uuid,
    technician: state.technician,
    timestamp: nowISO(),
    appVersion: CONFIG.APP_VERSION,
    devicePlatform: navigator.userAgent,
    reportSummary: summarizeReport(state.currentReport) // small summary
  };

  try{
    // Send to your server that will commit to GitHub (secure)
    const resp = await fetch(CONFIG.SYNC_ENDPOINT, {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    localStorage.setItem('last_stats_sync_v1', new Date().toISOString());
    log('Sync successful');
  }catch(e){
    console.warn('Sync failed', e);
    // If fails, leave last_stats_sync_v1 unchanged -> retry next time
  }
}

function summarizeReport(report){
  if(!report) return { present:false };
  return {
    present: true,
    id: report.id,
    machineType: report.machineType,
    createdAt: report.createdAt,
    doneCount: report.items.reduce((acc,it) => acc + (it.checked?1:0) + (it.subitems? it.subitems.filter(s=>s.checked).length:0), 0),
    totalCount: report.items.reduce((acc,it) => acc + 1 + (it.subitems?it.subitems.length:0), 0)
  };
}

// ---------- Periodic Sync registration (if supported) ----------
async function tryRegisterPeriodicSync(){
  if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker){
    try{
      const reg = await navigator.serviceWorker.ready;
      // Request permission
      const status = await navigator.permissions.query({name:'periodic-background-sync'});
      if(status.state === 'granted'){
        // register a daily periodic sync
        await reg.periodicSync.register('daily-stats-sync', {minInterval: CONFIG.DAILY_SYNC_MS});
        log('Periodic Sync enregistré');
      } else {
        log('Periodic Sync non autorisé:', status.state);
      }
    }catch(e){ log('Erreur registerPeriodicSync', e) }
  } else {
    log('Periodic Sync non supporté');
  }
}

// ---------- On load ----------
window.addEventListener('load', init);
