# AI Photo Analyzer

Upload any photo and get instant AI-powered insights — food calories, plant health, receipt data, room scores, math solutions, car damage estimates, and waste classification.

**Live demo:** *(coming soon)*

---

## Features

| Module | What it does |
|--------|-------------|
| 🍽️ Food Calorie Counter | Identifies dishes, estimates calories, macros (protein/carbs/fat), and per-item breakdown |
| 🌿 Plant Health Detector | Identifies species via PlantNet AI, diagnoses diseases, gives care tips |
| 🧾 Receipt Scanner | Extracts merchant, itemized list, taxes, totals, and payment details |
| 🛋️ Room Interior Estimator | Assesses style, design score, estimated item values, improvement suggestions |
| 📐 Math Problem Solver | Reads handwritten or printed equations and solves step-by-step |
| 🚗 Car Damage Estimator | Assesses damage severity, repair cost range (USD & PHP), nearby shop tips |
| ♻️ Waste Classifier | Identifies waste type (recyclable, biodegradable, hazardous) with disposal guidance |

**No sign-up. No credit card. Always free.**

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Lucide React icons
- react-dropzone (drag & drop + camera capture)

**Backend**
- Node.js + Express 5
- Anthropic SDK (`claude-sonnet-4-6` / `claude-haiku-4-5`)
- Multer (file uploads)
- express-rate-limit (abuse protection)
- In-memory result cache (SHA-256 hash deduplication)

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repo

```bash
git clone https://github.com/CeddDasma-14/ai-photo-analyzer.git
cd ai-photo-analyzer
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
ai-photo-analyzer/
├── backend/
│   ├── src/
│   │   ├── analyzers/       # One file per AI module
│   │   │   ├── food.js
│   │   │   ├── plant.js
│   │   │   ├── receipt.js
│   │   │   ├── room.js
│   │   │   ├── math.js
│   │   │   ├── car_damage.js
│   │   │   └── waste.js
│   │   ├── routes/
│   │   │   └── analyze.js   # Main API route
│   │   ├── lib/
│   │   │   └── cache.js     # Result cache
│   │   └── index.js         # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── PhotoUploader.jsx
│   │   │   ├── ResultsPanel.jsx
│   │   │   └── HistoryPanel.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── useHistory.js
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## API

### `POST /api/analyze`

Accepts a multipart form upload with a single `image` field.

**Response:**
```json
{
  "category": "food",
  "confidence": 0.94,
  "from_cache": false,
  "result": { ... }
}
```

Each module returns a different `result` shape — structured data specific to that category (calories, steps, line items, etc.).

---

## Built by

**Cedd Dasma** — [cedd.dasma@gmail.com](mailto:cedd.dasma@gmail.com) · [GitHub](https://github.com/CeddDasma-14)
