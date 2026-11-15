# INSTRUCTIONS FOR CODEX / AI AGENT: DATA DETECTIVE (IIITDM CAMPUS MYSTERY)

This file is a developer and AI agent handover guide for **Data Detective: The IIITDM Campus Mystery**, a browser-based educational Data Science game designed for **IIITDM Kancheepuram (Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram)**.

---

## 🚨 CORE ARCHITECTURAL DIRECTIVES FOR ANY AI AGENT

1. **DO NOT TURN THIS INTO A QUIZ GAME.**
   - Never ask textbook trivia (e.g., *"What is linear regression?"*, *"Define correlation"*).
   - Players must learn concepts strictly through hands-on interaction with campus telemetry (repairing corrupted records, correlating variables, fitting regression lines, running arrival probability trials, and tuning classifiers).
2. **STRICTLY FOUR (4) PLAYABLE LOCATIONS ON CAMPUS**:
   - `Academic Block`: Houses **Mission 1** (*The Corrupted Records*) & **Mission 2** (*The Hidden Pattern*).
   - `Arjuna Sports Complex`: Houses **Mission 3** (*Predict the Champion*).
   - `Parking Area`: Houses **Mission 4** (*The Parking Pattern*).
   - `Administration Block`: Houses **Mission 5** (*The Final Verdict*).
   - All other campus landmarks (hostels, dining, lake, gate) are background scenery on the interactive map.
3. **STORYLINE & OVERARCHING MYSTERY**:
   - The campus data system **CampusSync** is malfunctioning.
   - Each mission awards an evidence clue.
   - The final mystery reveals an automated database cron synchronization error (`SYNC-CYCLE-492`) that mixed records from different batches.
4. **LOCAL REPRODUCIBILITY & TECH STACK**:
   - Built with **Vite, Vanilla JS (ES Modules), HTML5, CSS3, Vitest, Plotly.js, Canvas Confetti**.
   - Procedural Web Audio API sound synthesizer (no external audio files needed).
   - All progress is saved to `localStorage` via `src/utils/storage.js`.

---

## 🏃 HOW TO RUN & VERIFY

### 1. Install & Start Development Server
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in a web browser.

### 2. Run Automated Verification Tests
```bash
npm run test
```

### 3. Production Build Check
```bash
npm run build
```

---

## 📂 CODEBASE LAYOUT

```
AKHIL_IDSE_PROJECT/
├── index.html                           # App entry HTML
├── vite.config.js                       # Vite & Vitest configuration
├── package.json                         # Dependencies & scripts
├── README.md                            # General project overview & syllabus mapping
├── FOR_AGENT.md                         # This file: handover guide for coding agents
├── src/
│   ├── main.js                          # View router & application lifecycle
│   ├── audio/
│   │   └── soundManager.js              # Pure Web Audio sound effect engine
│   ├── assets/
│   │   └── campus_map_illustrated.png   # The cropped, upright IIITDM campus map
│   ├── data/
│   │   └── mission1Dataset.js           # 100 synthetic student records with reproducible seed
│   ├── state/
│   │   ├── clues.js                     # Locations, missions, and clues schema
│   │   └── gameState.js                 # Central state manager, ranks, localStorage persistence
│   ├── utils/
│   │   ├── mathUtils.js                 # Tested mathematical algorithms (Mean, Median, Regression, etc.)
│   │   └── storage.js                   # Safe storage wrapper with memory fallback
│   ├── styles/
│   │   ├── main.css                     # Dark navy/charcoal detective aesthetic & CRT scanlines
│   │   ├── menu.css                     # Main menu radar animation, settings modal
│   │   ├── map.css                      # 2D campus map, detective marker, building popups
│   │   ├── notebook.css                 # Slide-out case file drawer & field handbook
│   │   └── mission1.css                 # Academic terminal, live histogram, records table
│   ├── components/
│   │   ├── MainMenu.js                  # Start, Continue, Handbook, Audio settings
│   │   ├── CampusMap.js                 # Interactive map with 4 playable buildings & avatar movement
│   │   ├── DetectiveNotebook.js         # Slide-out evidence drawer
│   │   ├── HowToPlayModal.js            # Detective handbook modal
│   │   ├── MissionBriefModal.js         # Pre-mission dispatch modal
│   │   └── missions/
│   │       ├── Mission1CorruptedRecords.js # Full playable Mission 1 terminal
│   │       └── Mission1ReportModal.js      # Mission 1 completion report & clue unlock
│   └── tests/
│       └── mathAndState.test.js         # Vitest unit test suite (11 passing tests)
```

---

## 🗺️ WHAT IS CURRENTLY IMPLEMENTED

1. **Phase 1: Foundation (COMPLETE)**:
   - Full main menu with radar scanning sweep and settings.
   - Interactive 2D illustrated campus map with the real IIITDM Kancheepuram layout.
   - Smooth detective navigation between the 4 buildings.
   - Sequential mission unlock locks (M1 unlocked; M2–M5 locked until prerequisites are cleared).
   - Case file drawer (Detective Notebook) tracking clues, score, and rank.
   - Procedural Web Audio API sound effects.
2. **Phase 2: Mission 1 — The Corrupted Records (COMPLETE)**:
   - 100 student records terminal.
   - Interactive live histogram distribution showing outlier skew.
   - Real-time Mean vs. Median comparison (Mean shifts from 85.4% to 81.3%; Median stays robust at 80%).
   - Tools: Inspect, Flag, Verify Source (biometric logs), Correct Record, Purge Clone.
   - Discovers `Clue #1: Suspicious Timestamp Clustering [SYNC-CYCLE-492]`.
   - Completion report modal awards score (up to 100 pts) and unlocks Mission 2.

---

## 🚀 ROADMAP FOR SUBSEQUENT PHASES (FOR YOU TO BUILD)

### Phase 3: Data Investigation Missions
- **Mission 2: The Hidden Pattern (Location: Academic Block — Lab Terminal)**:
  - Concepts: Data visualization, correlation coefficient ($r$), correlation strength, correlation vs. causation.
  - Interactive scatter plots & Plotly time series comparing equipment power draw vs. student lab attendance.
  - Final Clue: Records were associated with shifted date indices.
- **Mission 3: Predict the Champion (Location: Arjuna Sports Complex)**:
  - Concepts: Linear regression, residuals, Mean Absolute Error (MAE), prediction lines.
  - Interactive training hours vs. sprint time scatter plot with draggable/calibrated regression line.
  - Final Clue: An athlete record was mistakenly merged from an off-season training batch.

### Phase 4: Final Missions
- **Mission 4: The Parking Pattern (Location: Parking Area)**:
  - Concepts: Experimental vs. theoretical probability, Monte Carlo simulations, random variation.
  - Top-down vehicle entry/departure gate simulation showing double-counted RFID sensor pulses.
- **Mission 5: The Final Verdict (Location: Administration Block)**:
  - Concepts: Logistic regression, decision trees, confusion matrix (TP, FP, TN, FN), classification threshold tuning.
  - Evidence board connecting clues 1 to 4 to reveal the central CampusSync synchronization failure.

### Phase 5: Polish & Final Review
- End-to-end playtesting, sound balancing, and responsiveness check.
- Keep all unit tests passing (`npm run test`).
