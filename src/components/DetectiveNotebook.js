import { gameState } from '../state/gameState.js';
import { MISSIONS_DATA } from '../state/clues.js';
import { soundManager } from '../audio/soundManager.js';

export class DetectiveNotebook {
  constructor(containerEl) {
    this.container = containerEl;
    this.isOpen = false;
    this.unsubscribe = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.unsubscribe = gameState.subscribe(() => {
      this.updateContent();
    });

    window.addEventListener('toggle-notebook', () => {
      this.toggle();
    });
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  toggle(force = null) {
    this.isOpen = force !== null ? force : !this.isOpen;
    const drawer = this.container.querySelector('#detective-notebook-drawer');
    const overlay = this.container.querySelector('#notebook-backdrop');
    if (drawer && overlay) {
      if (this.isOpen) {
        drawer.classList.add('open');
        overlay.classList.remove('hidden');
        soundManager.playClick();
      } else {
        drawer.classList.remove('open');
        overlay.classList.add('hidden');
        soundManager.playClick();
      }
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="notebook-backdrop hidden" id="notebook-backdrop"></div>
      <aside class="detective-notebook-drawer" id="detective-notebook-drawer">
        <div class="notebook-inner">
          <!-- NOTEBOOK HEADER -->
          <div class="notebook-header">
            <div class="notebook-title-group">
              <span class="notebook-badge">CONFIDENTIAL</span>
              <h2>DETECTIVE CASE LOG</h2>
              <span class="notebook-case-id">OPERATION: CAMPUSSYNC RESTORE</span>
            </div>
            <button class="notebook-close-btn" id="btn-close-notebook">✕</button>
          </div>

          <!-- DETECTIVE DOSSIER STRIP -->
          <div class="notebook-profile-strip" id="notebook-profile-strip">
            <!-- Dynamic profile content -->
          </div>

          <!-- EVIDENCE CLUES SECTION -->
          <div class="notebook-section">
            <h3 class="section-title">
              <span>DISCOVERED CASE CLUES</span>
              <span class="clue-counter" id="clue-count-badge">0 / 5</span>
            </h3>
            <div class="clues-stack" id="clues-stack-container">
              <!-- Dynamic clues list -->
            </div>
          </div>

          <!-- MISSION AUDIT REPORT -->
          <div class="notebook-section">
            <h3 class="section-title">FIELD MISSION LOG</h3>
            <div class="missions-audit-list" id="missions-audit-list">
              <!-- Dynamic mission states -->
            </div>
          </div>
        </div>
      </aside>
    `;

    this.updateContent();
  }

  attachEvents() {
    const btnClose = this.container.querySelector('#btn-close-notebook');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.toggle(false));
    }

    const backdrop = this.container.querySelector('#notebook-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.toggle(false));
    }
  }

  updateContent() {
    const state = gameState.getState();

    // 1. Profile Strip
    const profileEl = this.container.querySelector('#notebook-profile-strip');
    if (profileEl) {
      profileEl.innerHTML = `
        <div class="profile-card">
          <div class="profile-avatar">🕵️</div>
          <div class="profile-info">
            <div class="profile-name">${state.detective.name}</div>
            <div class="profile-meta">
              <span>Badge: ${state.detective.badge}</span> • 
              <span class="rank-tag">${state.detective.rank}</span>
            </div>
          </div>
          <div class="profile-score">
            <span class="score-label">SCORE</span>
            <span class="score-num">${gameState.getTotalScore()}</span>
          </div>
        </div>
        ${state.collectedClues.length >= 5 ? `
          <button class="terminal-btn accent" id="btn-notebook-dossier" style="width: 100%; margin-top: 10px; background: rgba(255, 179, 0, 0.2); border-color: var(--accent-amber); color: var(--accent-amber); font-weight: 700; padding: 8px 12px; font-size: 12px;">
            <span>🏆 VIEW EPILOGUE & FACULTY CERTIFICATE</span>
          </button>
        ` : ''}
      `;

      const btnDossier = profileEl.querySelector('#btn-notebook-dossier');
      if (btnDossier) {
        btnDossier.addEventListener('click', () => {
          this.toggle(false);
          window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'certificate' } }));
        });
      }
    }

    // 2. Clues Count
    const clueCount = this.container.querySelector('#clue-count-badge');
    if (clueCount) {
      clueCount.textContent = `${state.collectedClues.length} / 5`;
    }

    // 3. Clues Stack
    const cluesStack = this.container.querySelector('#clues-stack-container');
    if (cluesStack) {
      if (state.collectedClues.length === 0) {
        cluesStack.innerHTML = `
          <div class="empty-clues-placeholder">
            <div class="empty-icon">🔍</div>
            <p>No verified evidence collected yet.</p>
            <p class="empty-sub">Deploy to the Academic Block to begin Mission 1 and uncover your first clue.</p>
          </div>
        `;
      } else {
        cluesStack.innerHTML = state.collectedClues.map((clue) => `
          <div class="clue-record-card">
            <div class="clue-record-top">
              <span class="clue-tag">CLUE #${clue.missionNumber}</span>
              <span class="clue-time">${clue.foundAt || 'Verified'}</span>
            </div>
            <h4 class="clue-record-title">${clue.title}</h4>
            <p class="clue-record-summary">${clue.summary}</p>
            <div class="clue-record-detail">${clue.detail}</div>
          </div>
        `).join('');
      }
    }

    // 4. Mission Log
    const missionsAudit = this.container.querySelector('#missions-audit-list');
    if (missionsAudit) {
      missionsAudit.innerHTML = Object.keys(MISSIONS_DATA).map((mKey) => {
        const meta = MISSIONS_DATA[mKey];
        const mState = state.missions[mKey];
        const isCompleted = mState?.isCompleted;
        const isUnlocked = gameState.isMissionUnlocked(mKey);

        let badge = '<span class="status-chip locked">🔒 Locked</span>';
        if (isCompleted) {
          badge = `<span class="status-chip completed">✓ Solved (${mState.score} pts)</span>`;
        } else if (isUnlocked) {
          badge = '<span class="status-chip active">⚡ Active</span>';
        }

        return `
          <div class="mission-audit-row ${isCompleted ? 'done' : isUnlocked ? 'active' : 'locked'}">
            <div class="audit-col-num">0${meta.number}</div>
            <div class="audit-col-title">
              <div class="title-text">${meta.title}</div>
              <div class="location-text">📍 ${meta.locationName}</div>
            </div>
            <div class="audit-col-status">${badge}</div>
          </div>
        `;
      }).join('');
    }
  }
}

