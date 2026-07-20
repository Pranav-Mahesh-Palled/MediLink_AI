const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const root = path.join(__dirname, '..');
const frontendDir = path.join(root, 'frontend');

app.use(express.static(frontendDir));

const hospitals = {
  cardiac: [
    ["St. Mary’s Emergency & Cardiac Care", "Cardiac • ICU • 24x7 ER"],
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
  ],
  stroke: [
    ["NeuroLife Institute", "Stroke unit • CT • ICU"],
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
  ],
  accident: [
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
    ["St. Mary’s Emergency & Cardiac Care", "Cardiac • ICU • 24x7 ER"],
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
  ],
  breathing: [
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
    ["St. Mary’s Emergency & Cardiac Care", "Cardiac • ICU • 24x7 ER"],
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
  ],
  fever: [
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
    ["St. Mary’s Emergency & Cardiac Care", "Cardiac • ICU • 24x7 ER"],
  ],
  other: [
    ["Metro Health Center", "Emergency medicine • Teleconsult"],
    ["City General Multi-Specialty Hospital", "Trauma • ICU • Diagnostics"],
    ["St. Mary’s Emergency & Cardiac Care", "Cardiac • ICU • 24x7 ER"],
  ],
};

function scoreCase(data) {
  const text = String(data.symptoms || '').toLowerCase();
  let score = 0;
  const signals = [];

  const add = (pts, reason) => {
    score += pts;
    signals.push(reason);
  };

  const has = (...words) => words.some((w) => text.includes(w));

  if (data.chest || has('chest pain', 'pressure', 'tightness')) add(30, 'Chest pain / pressure');
  if (data.breath || has('shortness of breath', 'breathing trouble', 'wheezing', 'cannot breathe', 'breath')) add(30, 'Breathing difficulty');
  if (data.bleed || has('bleed', 'hemorrhage', 'blood')) add(35, 'Severe bleeding / trauma');
  if (data.unconscious || has('unconscious', 'passed out', 'collapse', 'unresponsive')) add(40, 'Unconscious / collapse');
  if (data.strokeSigns || has('stroke', 'slurred speech', 'facial droop', 'one-sided weakness', 'weakness')) add(35, 'Stroke indicators');
  if (has('seizure', 'convulsion', 'fits')) add(35, 'Seizure signs');
  if (has('fever', 'temperature', 'dehydration')) add(10, 'Fever / dehydration');
  if (has('pregnant', 'pregnancy', 'labor')) add(18, 'Pregnancy-related risk');

  const age = Number(data.age) || 0;
  if (age < 5) { score += 10; signals.push('Pediatric risk'); }
  if (age >= 65) { score += 12; signals.push('Older adult risk'); }

  const dist = Number(data.distance) || 0;
  if (dist > 12) score += 6;
  else if (dist > 8) score += 4;
  else if (dist > 4) score += 2;

  let urgency = 'Low';
  let badge = 'low';
  let level = 1;
  if (score >= 80) { urgency = 'Critical'; badge = 'critical'; level = 4; }
  else if (score >= 55) { urgency = 'High'; badge = 'high'; level = 3; }
  else if (score >= 28) { urgency = 'Moderate'; badge = 'moderate'; level = 2; }

  const confidence = Math.max(61, Math.min(97, 70 + Math.min(18, signals.length * 3) + (level * 3)));
  let eta = Math.max(4, Math.round(7 + dist * 1.3 - level * 1.1));
  if (urgency === 'Critical') eta = Math.max(3, Math.round(5 + dist * 0.8));
  else if (urgency === 'High') eta = Math.max(5, Math.round(6 + dist * 1.0));
  else if (urgency === 'Moderate') eta = Math.max(8, Math.round(8 + dist * 1.2));
  else eta = Math.max(12, Math.round(10 + dist * 1.0));

  const incident = String(data.incident || 'other');
  let facility = 'Emergency Medicine';
  let facilitySub = 'Nearest suitable care center';
  let mode = 'Ambulance';
  let escalation = 'ER';
  let recs = [];

  if (urgency === 'Critical') {
    recs = [
      'Dispatch the nearest ambulance immediately.',
      'Pre-alert the emergency department and share the triage summary.',
      'Prepare ECG / oxygen / stroke or trauma pathway before arrival.'
    ];
  } else if (urgency === 'High') {
    recs = [
      'Assign ambulance support and notify the closest relevant hospital.',
      'Share patient summary with the receiving unit.',
      'Keep the patient under continuous monitoring during transit.'
    ];
  } else if (urgency === 'Moderate') {
    recs = [
      'Recommend urgent clinic / telemedicine evaluation.',
      'Escalate to ambulance if symptoms worsen or new red flags appear.',
      'Use continuous updates and follow-up reminders.'
    ];
    mode = 'Teleconsult + watch';
    escalation = 'Doctor review';
  } else {
    recs = [
      'Provide self-care guidance and symptom monitoring.',
      'Escalate if red-flag symptoms appear.',
      'Use the case log for follow-up tracking.'
    ];
    mode = 'Guidance';
    escalation = 'Follow-up';
  }

  if (incident === 'stroke') { facility = 'Stroke Unit'; facilitySub = 'CT / Neurology / ICU ready'; }
  else if (incident === 'cardiac') { facility = 'Cardiac Center'; facilitySub = 'ECG / Cath lab / ICU ready'; }
  else if (incident === 'accident') { facility = 'Trauma Center'; facilitySub = 'Emergency surgery / ICU ready'; }
  else if (incident === 'breathing') { facility = 'Pulmonary Emergency'; facilitySub = 'Ventilation / oxygen support ready'; }
  else if (incident === 'fever') { facility = 'Emergency Medicine'; facilitySub = 'Pediatric / general emergency ready'; }

  return {
    score,
    urgency,
    badge,
    confidence,
    eta,
    facility,
    facilitySub,
    mode,
    escalation,
    recs,
    priorityLane: urgency === 'Critical' || urgency === 'High' ? 'Yes' : 'No',
    signals,
    incident,
  };
}

app.post('/api/triage', (req, res) => {
  try {
    const result = scoreCase(req.body || {});
    const dist = Number(req.body?.distance || 0);
    const list = hospitals[result.incident] || hospitals.other;

    const hospitalList = list.map((h, idx) => ({
      name: h[0],
      details: `${h[1]} • ${(dist + idx * 2.4).toFixed(1)} km`,
      rank: idx === 0 ? 'best match' : idx === 1 ? 'backup' : 'secondary',
    }));

    res.json({
      ...result,
      hospitalList,
      mapLabel: `${result.facility} — ${dist.toFixed(1)} km`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process triage request.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'MediLink AI' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MediLink AI running on http://localhost:${PORT}`);
});
