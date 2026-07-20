# MediLink AI — Connected Ambulance Triage

A hackathon-ready, deployable prototype for emergency response.  
The app performs AI-assisted triage, suggests urgency, recommends the nearest suitable hospital type, and simulates ambulance dispatch.

## Folder structure

```text
mediLink_repo/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   └── server.js
├── package.json
├── .env.example
└── README.md
```

## Features

- AI-assisted symptom triage
- Urgency classification: Low / Moderate / High / Critical
- Ambulance ETA estimation
- Nearest hospital recommendation
- Dispatch timeline and case history
- Demo presets for cardiac, stroke, trauma, breathing distress, and fever

## Tech stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Deployment: Render / Railway / VPS / any Node hosting

## Run locally

1. Install Node.js 18+.
2. From the repo root:

```bash
npm install
npm start
```

3. Open:

```text
http://localhost:3000
```

## API

### POST `/api/triage`

Request body:

```json
{
  "name": "Ananya",
  "age": 58,
  "incident": "cardiac",
  "distance": 6.8,
  "chest": true,
  "breath": true,
  "bleed": false,
  "unconscious": false,
  "strokeSigns": false,
  "pregnant": false,
  "symptoms": "Sudden chest pain..."
}
```

Response includes:
- urgency
- confidence
- ETA
- recommended facility
- risk signals
- action recommendations

## Deployment

### Option 1: Render
- Create a new **Web Service**
- Connect this GitHub repo
- Build command: `npm install`
- Start command: `npm start`

### Option 2: Railway
- Connect the repo
- Use the same start command
