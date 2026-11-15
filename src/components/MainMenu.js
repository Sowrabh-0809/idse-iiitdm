import { gameState } from '../state/gameState.js';
import { soundManager } from '../audio/soundManager.js';

export class MainMenu {
  constructor(containerEl, onStartGame, onContinueGame, onOpenHowToPlay) {
    this.container = containerEl;
    this.onStartGame = onStartGame;
    this.onContinueGame = onContinueGame;
    this.onOpenHowToPlay = onOpenHowToPlay;
    this.unsubscribe = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.unsubscribe = gameState.subscribe(() => {
      this.updateContinueButton();
    });
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  hasSavedProgress() {
    const state = gameState.getState();
    const completed = Object.values(state.missions).filter(m => m.isCompleted).length;
    return completed > 0 || state.collectedClues.length > 0;
  }

  render() {
    const state = gameState.getState();
    const hasProgress = this.hasSavedProgress();
    const completedCount = Object.values(state.missions).filter(m => m.isCompleted).length;
    const totalScore = gameState.getTotalScore();

    this.container.innerHTML = `
      <div class="main-menu-wrapper">
        <!-- BACKGROUND AMBIENT SCANLINES & RADAR EFFECT -->
        <div class="menu-radar-bg">
          <div class="radar-sweep"></div>
          <div class="radar-circle c1"></div>
          <div class="radar-circle c2"></div>
          <div class="radar-circle c3"></div>
          <div class="radar-grid"></div>
        </div>

        <div class="menu-content-card">
          <!-- TOP BADGE -->
          <div class="menu-agency-badge">
            <span class="badge-icon">🏛️</span>
            <span class="badge-text">IIITDM KANCHEEPURAM • ACADEMIC DATA FORENSICS DEPT</span>
          </div>

          <!-- GAME TITLE & TAGLINE -->
          <div class="menu-header">
            <h1 class="game-main-title">
              <span class="title-detective">DATA DETECTIVE</span>
              <span class="title-sub">THE IIITDM CAMPUS MYSTERY</span>
            </h1>
            <p class="game-tagline">
              <span class="tagline-quote">“</span>Every clue tells a story. Every pattern reveals the truth.<span class="tagline-quote">”</span>
            </p>
          </div>

          <!-- DOSSIER CHIP -->
          <div class="dossier-status-bar">
            <div class="dossier-stat">
              <span class="label">LEAD DETECTIVE</span>
              <span class="val">${state.detective.name} [${state.detective.badge}]</span>
            </div>
            <div class="dossier-stat">
              <span class="label">CURRENT RANK</span>
              <span class="val accent">${state.detective.rank}</span>
            </div>
            <div class="dossier-stat">
              <span class="label">SOLVED CASES</span>
              <span class="val">${completedCount} / 5</span>
            </div>
            <div class="dossier-stat">
              <span class="label">TOTAL SCORE</span>
              <span class="val score-val">${totalScore} PTS</span>
            </div>
          </div>

          <!-- PRIMARY ACTION BUTTONS -->
          <div class="menu-actions-stack">
            ${completedCount === 5 ? `
              <button class="menu-btn victory-btn" id="btn-menu-epilogue" style="background: linear-gradient(135deg, rgba(255, 179, 0, 0.25), rgba(0, 230, 118, 0.2)); border: 1.5px solid var(--accent-amber); box-shadow: 0 0 15px rgba(255, 179, 0, 0.35);">
                <span class="btn-icon">🏆</span>
                <div class="btn-content">
                  <span class="btn-label" style="color: var(--accent-amber); font-weight: 700;">EPILOGUE & CERTIFICATE OF APPRECIATION</span>
                  <span class="btn-sub">View NPC testimonies & print IIITDM Faculty Certificate of Appreciation</span>
                </div>
              </button>
            ` : ''}

            ${hasProgress ? `
              <button class="menu-btn primary pulse" id="btn-menu-continue">
                <span class="btn-icon">▶</span>
                <div class="btn-content">
                  <span class="btn-label">RESUME INVESTIGATION</span>
                  <span class="btn-sub">Continue case progress (${completedCount}/5 complete)</span>
                </div>
              </button>
            ` : ''}

            <button class="menu-btn ${!hasProgress ? 'primary pulse' : 'secondary'}" id="btn-menu-start">
              <span class="btn-icon">⚡</span>
              <div class="btn-content">
                <span class="btn-label">${hasProgress ? 'NEW INVESTIGATION (RESET CASE)' : 'BEGIN INVESTIGATION'}</span>
                <span class="btn-sub">Access CampusSync terminals at Academic Block</span>
              </div>
            </button>

            <button class="menu-btn secondary" id="btn-menu-howtoplay">
              <span class="btn-icon">📖</span>
              <div class="btn-content">
                <span class="btn-label">DETECTIVE HANDBOOK</span>
                <span class="btn-sub">Investigation protocols, scoring & data tools guide</span>
              </div>
            </button>

            <div class="menu-aux-row">
              <button class="menu-aux-btn" id="btn-menu-audio">
                <span class="aux-icon" id="audio-icon">${state.soundEnabled ? '🔊' : '🔇'}</span>
                <span class="aux-label" id="audio-label">SOUND: ${state.soundEnabled ? 'ON' : 'MUTED'}</span>
              </button>

              <button class="menu-aux-btn" id="btn-menu-settings">
                <span class="aux-icon">⚙️</span>
                <span class="aux-label">SETTINGS & RESET</span>
              </button>

              <button class="menu-aux-btn" id="btn-menu-about">
                <span class="aux-icon">ℹ️</span>
                <span class="aux-label">CAMPUS DOSSIER</span>
              </button>
            </div>
          </div>

          <!-- FOOTER NOTICE -->
          <div class="menu-footer">
            <span class="disclaimer-note">
              Simulated academic investigation for Data Science course • Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram
            </span>
          </div>
        </div>

        <!-- SETTINGS MODAL (HIDDEN BY DEFAULT) -->
        <div class="menu-modal-overlay hidden" id="settings-modal-overlay">
          <div class="menu-modal-card">
            <div class="modal-header">
              <h3>SYSTEM CONFIGURATION & SAVE DATA</h3>
              <button class="modal-close" id="btn-close-settings">✕</button>
            </div>
            <div class="modal-body">
              <div class="setting-item">
                <label>Audio Synthesizer Sound Effects</label>
                <div class="toggle-control">
                  <button class="toggle-btn ${state.soundEnabled ? 'active' : ''}" id="toggle-sound-btn">
                    ${state.soundEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
              <div class="setting-item">
                <label>Master Sound Volume: <span id="vol-display">${Math.round(state.masterVolume * 100)}%</span></label>
                <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${state.masterVolume}" />
              </div>
              <hr class="modal-divider" />
              <div class="setting-item danger-zone">
                <div>
                  <label class="danger-title">Erase Detective Evidence & Save Data</label>
                  <p class="danger-desc">Clears all solved mission checkpoints and resets localStorage.</p>
                </div>
                <button class="danger-btn" id="btn-reset-save">Reset Case</button>
              </div>
            </div>
          </div>
        </div>

        <!-- CAMPUS DOSSIER MODAL (HIDDEN BY DEFAULT) -->
        <div class="menu-modal-overlay hidden" id="dossier-modal-overlay">
          <div class="menu-modal-card">
            <div class="modal-header">
              <h3>CAMPUS DOSSIER: IIITDM KANCHEEPURAM</h3>
              <button class="modal-close" id="btn-close-dossier">✕</button>
            </div>
            <div class="modal-body">
              <p class="dossier-p">
                <strong>Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram (IIITDM Kancheepuram)</strong> is an Institute of National Importance established by the Ministry of Education, Govt. of India.
              </p>
              <div class="dossier-grid">
                <div class="dossier-box">
                  <h4>📍 Geographical Layout</h4>
                  <p>Spans over 51 pristine acres in Melakottaiyur along the Vandalur-Kelambakkam expressway in Chennai outskirts.</p>
                </div>
                <div class="dossier-box">
                  <h4>🔬 Core Playable Sites</h4>
                  <p>Academic Complex (M1/M2), Arjuna Sports Complex (M3), Parking Area (M4), and Central Administration Block (M5).</p>
                </div>
                <div class="dossier-box">
                  <h4>🧩 Educational Mission</h4>
                  <p>No textbook quizzes. Players master data cleaning, correlation, linear regression, probability distributions, and classification by diagnosing simulated campus sync anomalies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // Epilogue & Coursework Dossier button (when all 5 completed)
    const btnEpilogue = this.container.querySelector('#btn-menu-epilogue');
    if (btnEpilogue) {
      btnEpilogue.addEventListener('click', () => {
        soundManager.playClick();
        window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'restoration' } }));
      });
    }

    // Continue
    const btnContinue = this.container.querySelector('#btn-menu-continue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        soundManager.playClick();
        if (this.onContinueGame) this.onContinueGame();
      });
    }

    // Start / New
    const btnStart = this.container.querySelector('#btn-menu-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        soundManager.playClick();
        if (this.hasSavedProgress()) {
          const confirmReset = confirm("Start a new case? This will reset current mission checkpoints.");
          if (!confirmReset) return;
          gameState.resetProgress();
        }
        if (this.onStartGame) this.onStartGame();
      });
    }

    // How to Play
    const btnHowToPlay = this.container.querySelector('#btn-menu-howtoplay');
    if (btnHowToPlay) {
      btnHowToPlay.addEventListener('click', () => {
        soundManager.playClick();
        if (this.onOpenHowToPlay) this.onOpenHowToPlay();
      });
    }

    // Audio Toggle quick button
    const btnAudio = this.container.querySelector('#btn-menu-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const next = gameState.toggleSound();
        soundManager.playClick();
        const icon = this.container.querySelector('#audio-icon');
        const label = this.container.querySelector('#audio-label');
        if (icon) icon.textContent = next ? '🔊' : '🔇';
        if (label) label.textContent = `SOUND: ${next ? 'ON' : 'MUTED'}`;
      });
    }

    // Settings Modal
    const settingsModal = this.container.querySelector('#settings-modal-overlay');
    const btnSettings = this.container.querySelector('#btn-menu-settings');
    const btnCloseSettings = this.container.querySelector('#btn-close-settings');
    if (btnSettings && settingsModal) {
      btnSettings.addEventListener('click', () => {
        soundManager.playClick();
        settingsModal.classList.remove('hidden');
      });
    }
    if (btnCloseSettings && settingsModal) {
      btnCloseSettings.addEventListener('click', () => {
        soundManager.playClick();
        settingsModal.classList.add('hidden');
      });
    }

    // Settings sound controls
    const toggleSoundBtn = this.container.querySelector('#toggle-sound-btn');
    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener('click', () => {
        const next = gameState.toggleSound();
        toggleSoundBtn.classList.toggle('active', next);
        toggleSoundBtn.textContent = next ? 'ENABLED' : 'DISABLED';
      });
    }

    const volumeSlider = this.container.querySelector('#volume-slider');
    const volDisplay = this.container.querySelector('#vol-display');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        gameState.setVolume(val);
        if (volDisplay) volDisplay.textContent = `${Math.round(val * 100)}%`;
      });
    }

    const btnResetSave = this.container.querySelector('#btn-reset-save');
    if (btnResetSave) {
      btnResetSave.addEventListener('click', () => {
        if (confirm('Are you certain you wish to wipe case progress and start fresh?')) {
          gameState.resetProgress();
          soundManager.playError();
          settingsModal.classList.add('hidden');
          this.render();
          this.attachEvents();
        }
      });
    }

    // Campus Dossier Modal
    const dossierModal = this.container.querySelector('#dossier-modal-overlay');
    const btnAbout = this.container.querySelector('#btn-menu-about');
    const btnCloseDossier = this.container.querySelector('#btn-close-dossier');
    if (btnAbout && dossierModal) {
      btnAbout.addEventListener('click', () => {
        soundManager.playClick();
        dossierModal.classList.remove('hidden');
      });
    }
    if (btnCloseDossier && dossierModal) {
      btnCloseDossier.addEventListener('click', () => {
        soundManager.playClick();
        dossierModal.classList.add('hidden');
      });
    }
  }

  updateContinueButton() {
    // When state changes, refresh continue button state
    this.render();
    this.attachEvents();
  }
}

