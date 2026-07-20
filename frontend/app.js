const el = (id) => document.getElementById(id);

async function runTriage() {
  const res = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: el('name').value.trim(),
      age: el('age').value,
      incident: el('incident').value,
      distance: el('distance').value,
      chest: el('chest').checked,
      breath: el('breath').checked,
      bleed: el('bleed').checked,
      unconscious: el('unconscious').checked,
      strokeSigns: el('strokeSigns').checked,
      pregnant: el('pregnant').checked,
      symptoms: el('symptoms').value.trim(),
    }),
  });

  const out = await res.json();

  el('urgencyText').innerText = out.urgency;
  el('urgencySub').innerText =
    out.urgency === 'Critical'
      ? 'Immediate ambulance dispatch and hospital pre-alert'
      : out.urgency === 'High'
      ? 'Urgent ambulance + hospital notification'
      : out.urgency === 'Moderate'
      ? 'Fast teleconsult and escalation watch'
      : 'Self-care guidance and monitoring';

  el('confidenceText').innerText = out.confidence + '%';
  el('etaText').innerText = out.eta + ' min';
  el('etaSub').innerText = `Based on ${Number(el('distance').value || 0).toFixed(1)} km and priority level`;
  el('facilityText').innerText = out.facility;
  el('facilitySub').innerText = out.facilitySub;
  el('badge').innerText = out.urgency.toUpperCase() + ' PRIORITY';
  el('badge').className = 'badge ' + out.badge;
  el('ltSigns').innerText = String(out.signals.length);
  el('modeText').innerText = out.mode;
  el('escalationText').innerText = out.escalation;
  el('priorityLane').innerText = out.priorityLane;
  el('bar').style.width = Math.min(100, out.score) + '%';
  el('mapLabel').innerText = 'Nearest route: ' + out.mapLabel;
  el('statusText').innerText = out.urgency + ' response';

  el('recommendation').innerHTML = out.recs.map((x) => `<li>${x}</li>`).join('');
  el('debug').innerText = `Score model:
- Matched signals: ${out.signals.length}
- Signals: ${out.signals.join(', ') || 'None'}
- Age: ${el('age').value || 'n/a'}
- Distance: ${Number(el('distance').value || 0).toFixed(1)} km
- Incident type: ${out.incident}
- Output: ${out.urgency} (${out.score} points)
- Recommended facility: ${out.facility}
- Dispatch ETA: ${out.eta} min`;

  el('hospitalList').innerHTML = out.hospitalList.map((h, idx) => `
    <div class="hospital">
      <div><strong>${h.name}</strong><span>${h.details}</span></div>
      <span class="badge ${idx === 0 ? out.badge : 'low'}">${h.rank}</span>
    </div>
  `).join('');

  const hist = el('history');
  const row = document.createElement('div');
  row.className = 'hospital';
  row.innerHTML = `<div><strong>${out.incident} case — ${out.urgency}</strong><span>${out.urgency === 'Critical' ? 'Emergency team pre-alerted, highest priority route selected' : out.urgency === 'High' ? 'Ambulance dispatched with hospital summary' : out.urgency === 'Moderate' ? 'Teleconsult alert generated with monitoring' : 'Advice and follow-up generated'}</span></div><span class="badge ${out.badge}">${out.eta}m</span>`;
  hist.prepend(row);
  while (hist.children.length > 4) hist.removeChild(hist.lastElementChild);
}

function loadCase(kind) {
  const cases = {
    cardiac: { name: 'Ananya', age: 58, incident: 'cardiac', distance: 6.8, chest: true, breath: true, bleed: false, unconscious: false, strokeSigns: false, pregnant: false, symptoms: 'Sudden chest pain, sweating, dizziness and shortness of breath for the last 20 minutes.' },
    stroke: { name: 'Suresh', age: 71, incident: 'stroke', distance: 4.2, chest: false, breath: false, bleed: false, unconscious: false, strokeSigns: true, pregnant: false, symptoms: 'Slurred speech, facial droop, one-sided weakness and confusion started 35 minutes ago.' },
    accident: { name: 'Rahul', age: 26, incident: 'accident', distance: 9.6, chest: false, breath: true, bleed: true, unconscious: false, strokeSigns: false, pregnant: false, symptoms: 'Road traffic accident, open bleeding on leg, possible fracture and severe pain.' },
    breathing: { name: 'Maya', age: 33, incident: 'breathing', distance: 7.4, chest: false, breath: true, bleed: false, unconscious: false, strokeSigns: false, pregnant: false, symptoms: 'Severe wheezing, fast breathing and trouble speaking full sentences.' },
    fever: { name: 'Kabir', age: 8, incident: 'fever', distance: 5.1, chest: false, breath: false, bleed: false, unconscious: false, strokeSigns: false, pregnant: false, symptoms: 'High fever, dehydration, weakness and poor oral intake since morning.' },
  };
  const c = cases[kind];
  if (!c) return;
  el('name').value = c.name;
  el('age').value = c.age;
  el('incident').value = c.incident;
  el('distance').value = c.distance;
  el('chest').checked = c.chest;
  el('breath').checked = c.breath;
  el('bleed').checked = c.bleed;
  el('unconscious').checked = c.unconscious;
  el('strokeSigns').checked = c.strokeSigns;
  el('pregnant').checked = c.pregnant;
  el('symptoms').value = c.symptoms;
  runTriage();
}

let liveTimer = null;
function demoLoop() {
  if (liveTimer) {
    clearInterval(liveTimer);
    liveTimer = null;
    el('statusText').innerText = 'Prototype';
    return;
  }
  const kinds = ['cardiac', 'stroke', 'accident', 'breathing', 'fever'];
  let i = 0;
  liveTimer = setInterval(() => {
    loadCase(kinds[i % kinds.length]);
    i++;
    if (i >= 5) {
      clearInterval(liveTimer);
      liveTimer = null;
      el('statusText').innerText = 'Prototype';
    }
  }, 2600);
  el('statusText').innerText = 'Running demo loop';
}

function bind() {
  el('triageBtn').addEventListener('click', runTriage);
  el('cardiacBtn').addEventListener('click', () => loadCase('cardiac'));
  el('strokeBtn').addEventListener('click', () => loadCase('stroke'));
  el('accidentBtn').addEventListener('click', () => loadCase('accident'));
  el('caseCardiac').addEventListener('click', () => loadCase('cardiac'));
  el('caseStroke').addEventListener('click', () => loadCase('stroke'));
  el('caseAccident').addEventListener('click', () => loadCase('accident'));
  el('caseBreathing').addEventListener('click', () => loadCase('breathing'));
  el('caseFever').addEventListener('click', () => loadCase('fever'));
  el('demoLoop').addEventListener('click', demoLoop);
}

bind();
loadCase('cardiac');
runTriage();
