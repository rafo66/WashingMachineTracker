/* WashingMachineTracker — POC front-end
   Lit tous les fichiers data/data_TIME.json, affiche l'état des 8 machines
   et un historique de vibration sous forme de graphique simple. */

const MACHINES = [
  { key: "machine_laver_1", label: "Laveuse 1", type: "laveur" },
  { key: "machine_laver_2", label: "Laveuse 2", type: "laveur" },
  { key: "machine_laver_3", label: "Laveuse 3", type: "laveur" },
  { key: "machine_laver_4", label: "Laveuse 4", type: "laveur" },
  { key: "machine_seche_linge_1", label: "Sèche-linge 1", type: "sechoir" },
  { key: "machine_seche_linge_2", label: "Sèche-linge 2", type: "sechoir" },
  { key: "machine_seche_linge_3", label: "Sèche-linge 3", type: "sechoir" },
  { key: "machine_seche_linge_4", label: "Sèche-linge 4", type: "sechoir" },
];

// Seuil simple pour décider "en cours" vs "libre" à partir de la dernière valeur.
// Provisoire : la vraie logique de détection sera affinée plus tard (cf cahier des charges).
const BUSY_THRESHOLD = 0.2;

// Une couleur distincte par machine pour le graphique
const SIGNAL_COLORS = [
  "#3c6e66", "#b0522f", "#4a7ab5", "#9c6b2f",
  "#7a4a9c", "#2f8f5b", "#c2445c", "#5c5c5c",
];

const state = {
  // liste triée par time_sent croissant, chaque entrée = { time: Date, locals: {...} }
  history: [],
  visibleSignals: new Set(MACHINES.map((m) => m.key)),
};

const icons = {
  laveur: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="36" height="40" rx="4" stroke="currentColor" stroke-width="2.2"/>
    <circle cx="24" cy="26" r="12" stroke="currentColor" stroke-width="2.2"/>
    <circle cx="24" cy="26" r="6" stroke="currentColor" stroke-width="1.6"/>
    <circle cx="12" cy="10" r="1.6" fill="currentColor"/>
    <circle cx="17" cy="10" r="1.6" fill="currentColor"/>
  </svg>`,
  sechoir: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="36" height="40" rx="4" stroke="currentColor" stroke-width="2.2"/>
    <circle cx="24" cy="27" r="12" stroke="currentColor" stroke-width="2.2"/>
    <path d="M19 27c0-3 2-5 5-5s5 2 5 5-2 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="12" cy="10" r="1.6" fill="currentColor"/>
    <circle cx="17" cy="10" r="1.6" fill="currentColor"/>
  </svg>`,
};

init();

async function init() {
  await loadAllData();
  renderMachineCards();
  renderSignalPicker();
  renderChart();
  updateLastUpdateLabel();
}

/* ---------- Chargement des données ---------- */

async function loadAllData() {
  // En local (sans backend), on liste les fichiers via un manifest généré à côté.
  // Pour un vrai déploiement, remplacer par un appel à un endpoint qui liste data/.
  let filenames = [];
  try {
    const res = await fetch("data/manifest.json");
    if (res.ok) filenames = await res.json();
  } catch (e) {
    console.warn("Impossible de charger data/manifest.json", e);
  }

  const entries = await Promise.all(
    filenames.map(async (fname) => {
      try {
        const res = await fetch(`data/${fname}`);
        if (!res.ok) return null;
        const json = await res.json();
        return {
          time: new Date(json.time_sent),
          locals: json.locals || {},
        };
      } catch (e) {
        console.warn(`Fichier illisible : ${fname}`, e);
        return null;
      }
    })
  );

  state.history = entries
    .filter((e) => e && !isNaN(e.time.getTime()))
    .sort((a, b) => a.time - b.time);
}

function latestLocals() {
  if (state.history.length === 0) return {};
  return state.history[state.history.length - 1].locals;
}

/* ---------- Cartes machines ---------- */

function renderMachineCards() {
  const rowLaveurs = document.getElementById("row-laveurs");
  const rowSechoirs = document.getElementById("row-sechoirs");
  rowLaveurs.innerHTML = "";
  rowSechoirs.innerHTML = "";

  const latest = latestLocals();

  MACHINES.forEach((machine) => {
    const value = latest[machine.key];
    const isBusy = typeof value === "number" && value >= BUSY_THRESHOLD;
    const durationLabel = isBusy
      ? `EN COURS DEPUIS ${estimateDurationMinutes(machine.key)} MIN`
      : "LIBRE";

    const card = document.createElement("article");
    card.className = `machine-card ${isBusy ? "is-busy" : "is-free"}`;
    card.innerHTML = `
      <div class="machine-icon">${icons[machine.type]}</div>
      <div class="machine-name">${machine.label}</div>
      <div class="machine-status ${isBusy ? "is-busy" : "is-free"}">
        ${isBusy ? "EN COURS" : "LIBRE"}
      </div>
      <div class="machine-duration">
        ${isBusy ? `depuis ${estimateDurationMinutes(machine.key)} min` : "&nbsp;"}
      </div>
    `;

    (machine.type === "laveur" ? rowLaveurs : rowSechoirs).appendChild(card);
  });
}

// Estimation simple : on remonte l'historique tant que la valeur reste au-dessus du seuil.
function estimateDurationMinutes(key) {
  let minutes = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const v = state.history[i].locals[key];
    if (typeof v === "number" && v >= BUSY_THRESHOLD) {
      minutes++;
    } else {
      break;
    }
  }
  return minutes;
}

/* ---------- Sélecteur de signaux (checkboxes) ---------- */

function renderSignalPicker() {
  const container = document.getElementById("signal-picker");
  // On garde le <legend> existant, on ajoute les options après
  const legend = container.querySelector("legend");
  container.innerHTML = "";
  container.appendChild(legend);

  MACHINES.forEach((machine, i) => {
    const id = `chk-${machine.key}`;
    const label = document.createElement("label");
    label.className = "signal-option";
    label.setAttribute("for", id);
    label.innerHTML = `
      <input type="checkbox" id="${id}" data-key="${machine.key}" ${
      state.visibleSignals.has(machine.key) ? "checked" : ""
    }>
      <span class="signal-swatch" style="background:${SIGNAL_COLORS[i]}"></span>
      ${machine.label}
    `;
    container.appendChild(label);

    label.querySelector("input").addEventListener("change", (e) => {
      const key = e.target.dataset.key;
      if (e.target.checked) state.visibleSignals.add(key);
      else state.visibleSignals.delete(key);
      renderChart();
    });
  });
}

/* ---------- Graphique (canvas natif) ---------- */

function renderChart() {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const padding = { top: 16, right: 16, bottom: 28, left: 40 };

  ctx.clearRect(0, 0, W, H);

  if (state.history.length === 0) {
    ctx.fillStyle = "#5c6b64";
    ctx.font = "14px sans-serif";
    ctx.fillText("Aucune donnée disponible.", padding.left, H / 2);
    return;
  }

  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  const times = state.history.map((e) => e.time.getTime());
  const tMin = times[0];
  const tMax = times[times.length - 1];
  const tSpan = Math.max(tMax - tMin, 1);

  const yMax = 1; // vibration bornée [0,1] dans les données du POC
  const yMin = 0;

  // Grille horizontale + axe Y
  ctx.strokeStyle = "#dde1dc";
  ctx.fillStyle = "#5c6b64";
  ctx.font = "11px sans-serif";
  ctx.lineWidth = 1;
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const yVal = yMin + ((yMax - yMin) * i) / ySteps;
    const y = padding.top + plotH - (yVal / yMax) * plotH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(W - padding.right, y);
    ctx.stroke();
    ctx.fillText(yVal.toFixed(1), 6, y + 3);
  }

  // Axe X : quelques labels d'heure
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const t = tMin + (tSpan * i) / xTicks;
    const x = padding.left + (plotW * i) / xTicks;
    const d = new Date(t);
    const label = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(label, x - 14, H - 8);
  }

  // Courbes
  MACHINES.forEach((machine, i) => {
    if (!state.visibleSignals.has(machine.key)) return;

    ctx.strokeStyle = SIGNAL_COLORS[i];
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    let started = false;
    state.history.forEach((entry) => {
      const v = entry.locals[machine.key];
      if (typeof v !== "number") return;
      const x = padding.left + ((entry.time.getTime() - tMin) / tSpan) * plotW;
      const y = padding.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  });
}

function updateLastUpdateLabel() {
  const el = document.getElementById("last-update");
  if (state.history.length === 0) {
    el.textContent = "Aucune donnée";
    return;
  }
  const last = state.history[state.history.length - 1].time;
  el.textContent = `Dernière donnée : ${last.toLocaleString("fr-FR")}`;
}
