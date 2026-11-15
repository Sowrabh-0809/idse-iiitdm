import { MISSIONS_DATA } from '../state/clues.js';
import { gameState } from '../state/gameState.js';
import { soundManager } from '../audio/soundManager.js';

export class MissionBriefModal {
  constructor(containerEl, onLaunchMission) {
    this.container = containerEl;
    this.onLaunchMission = onLaunchMission;
    this.currentMissionId = null;
  }

  mount() {
    this.render();
    this.attachEvents();
  }

  show(missionId) {
    this.currentMissionId = missionId;
    const meta = MISSIONS_DATA[missionId];
    if (!meta) return;

    const overlay = this.container.querySelector('#mission-brief-modal');
    const content = this.container.querySelector('#mission-brief-content');
    if (!overlay || !content) return;

    soundManager.playClick();

    const isUnlocked = gameState.isMissionUnlocked(missionId);
    const mission = gameState.getMission(missionId);
    const conceptsPills = meta.concepts.map(c => `<span class="brief-concept-pill">${c}</span>`).join(' ');

    const witnessBriefs = {
      m1: {
        witness: 'Dr. Sundaram • Academic Registrar',
        quote: '“The semester attendance database failed its automated integrity checksum. Multiple impossible sensor overflows and duplicate records have contaminated the academic portal.”',
        task: 'Inspect 100 student records at the Academic Terminal, purge clones, and observe how Mean vs. Median respond to outliers.'
      },
      m2: {
        witness: 'Priya • Computational Lab Coordinator',
        quote: '“Our high-performance lab is showing strange power spikes. Initial reports claim student attendance causes the surge with r = 0.88, but I suspect our date timestamps are misaligned.”',
        task: 'Calibrate the timeline shift slider, analyze the dual-axis time series, and determine if correlation truly implies causation.'
      },
      m3: {
        witness: 'Coach Raghu • Head of Physical Education',
        quote: '“The varsity sprint prediction line at Arjuna Sports is wildly inaccurate. Our Mean Absolute Error is over 4 seconds, putting our inter-institute athletic selections in jeopardy.”',
        task: 'Adjust the regression line slope/intercept, inspect residual drop lines, and quarantine contaminated off-season records.'
      },
      m4: {
        witness: 'Inspector Murugan • Campus Chief of Security',
        quote: '“Lot P-29 boom barrier triggers critical 98% occupancy alarms every afternoon, but when officers look outside, the lot is half empty. Where are these phantom vehicles coming from?”',
        task: 'Run Monte Carlo arrival simulations, compare theoretical vs. experimental distributions, and filter the RFID sensor retry bounce.'
      },
      m5: {
        witness: 'Karthik • CampusSync Infrastructure Admin',
        quote: '“The central server is throwing alerts across all four campus sectors. We need you to synthesize all evidence, calibrate our diagnostic classifier, and pinpoint the rogue cron daemon.”',
        task: 'Link collected clues on the evidence board, tune the classification decision threshold, and execute the final decision tree diagnosis.'
      }
    };

    const brief = witnessBriefs[missionId] || {
      witness: 'Campus Security Dispatch',
      quote: meta.tagline,
      task: 'Investigate telemetry anomalies.'
    };

    content.innerHTML = `
      <div class="brief-card-inner">
        <header class="brief-header">
          <div class="brief-badge">${isUnlocked ? (mission?.isCompleted ? 'CASE COMPLETED (RE-ENTER)' : 'ACTIVE INCIDENT DISPATCH') : 'LOCKED CASE FILE'}</div>
          <button class="brief-close-btn" id="btn-close-brief">✕</button>
        </header>

        <div class="brief-headline">
          <span class="brief-num">CASE FILE 0${meta.number}</span>
          <h2 class="brief-title">${meta.title}</h2>
          <div class="brief-loc">📍 Location: <strong>${meta.locationName}</strong></div>
        </div>

        <div class="brief-body">
          <div class="brief-section" style="background: rgba(0, 229, 255, 0.05); border-left: 3px solid var(--accent-cyan); padding: 10px 14px; border-radius: 4px; margin-bottom: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase;">WITNESS TESTIMONY: ${brief.witness}</div>
            <div style="font-style: italic; font-size: 13px; color: var(--text-main); margin-top: 4px;">${brief.quote}</div>
          </div>

          <div class="brief-section">
            <h4 class="section-heading">FORENSIC OBJECTIVE</h4>
            <p class="brief-story">${brief.task}</p>
          </div>

          <div class="brief-section">
            <h4 class="section-heading">DATA SCIENCE CONCEPTS APPLIED</h4>
            <div class="brief-concepts-row">${conceptsPills}</div>
          </div>

          ${isUnlocked ? `
            <div class="brief-callout active-callout">
              <div class="callout-icon">⚡</div>
              <div class="callout-text">
                <strong>Terminal Ready:</strong> Authorization granted. Click below to enter the terminal and begin investigation.
              </div>
            </div>
          ` : `
            <div class="brief-callout">
              <div class="callout-icon">🔒</div>
              <div class="callout-text">
                <strong>Prerequisite Incomplete:</strong> Clear previous mission to unlock this campus terminal.
              </div>
            </div>
          `}
        </div>

        <footer class="brief-footer">
          <button class="brief-cancel-btn" id="btn-cancel-brief">Cancel / Return to Map</button>
          <button class="brief-confirm-btn" id="btn-confirm-launch" ${!isUnlocked ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <span>ENTER TERMINAL</span>
            <span class="arrow">→</span>
          </button>
        </footer>
      </div>
    `;

    overlay.classList.remove('hidden');

    content.querySelector('#btn-close-brief').addEventListener('click', () => this.hide());
    content.querySelector('#btn-cancel-brief').addEventListener('click', () => this.hide());
    
    if (isUnlocked) {
      content.querySelector('#btn-confirm-launch').addEventListener('click', () => {
        const targetMissionId = this.currentMissionId;
        this.hide();
        if (this.onLaunchMission && targetMissionId) {
          this.onLaunchMission(targetMissionId);
        }
      });
    }
  }

  hide() {
    const overlay = this.container.querySelector('#mission-brief-modal');
    if (overlay) overlay.classList.add('hidden');
    this.currentMissionId = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="mission-brief-overlay hidden" id="mission-brief-modal">
        <div class="mission-brief-card" id="mission-brief-content"></div>
      </div>
    `;
  }

  attachEvents() {
    const overlay = this.container.querySelector('#mission-brief-modal');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hide();
        }
      });
    }
  }
}
