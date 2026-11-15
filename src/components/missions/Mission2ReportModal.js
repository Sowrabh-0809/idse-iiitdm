import confetti from 'canvas-confetti';
import { gameState } from '../../state/gameState.js';
import { MISSIONS_DATA } from '../../state/clues.js';
import { soundManager } from '../../audio/soundManager.js';

export class Mission2ReportModal {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;
  }

  show(results) {
    const meta = MISSIONS_DATA.m2;
    const { score, initialR, finalR, verifiedSpurious } = results;

    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // test environment safety
    }

    gameState.completeMission(
      'm2',
      score,
      `Exposed spurious correlation: apparent r = ${initialR.toFixed(2)} collapsed to r = ${finalR.toFixed(2)} when the +48h date shift was eliminated. Uncovered SYNC-CYCLE-492 date-index mismatch.`
    );

    this.container.innerHTML = `
      <div class="mission-report-overlay" id="mission2-report-modal">
        <div class="mission-report-card">
          <header class="report-header">
            <div class="report-badge-strip">
              <span class="report-badge success">CASE SOLVED</span>
              <span class="report-date">${new Date().toLocaleDateString()}</span>
            </div>
            <h2 class="report-title">MISSION 02 FORENSIC REPORT</h2>
            <div class="report-loc">Target Facility: Academic Block — Lab Terminal [AB-LAB]</div>
          </header>

          <div class="report-score-banner">
            <div class="score-display">
              <span class="score-label">FORENSIC SCORE</span>
              <span class="score-number">${score} <span class="score-max">/ 100 PTS</span></span>
            </div>
            <div class="rank-award">
              <span class="award-label">CURRENT DETECTIVE RANK</span>
              <span class="award-rank">${gameState.getState().detective.rank}</span>
            </div>
          </div>

          <div class="unlocked-clue-card">
            <div class="clue-card-top">
              <span class="clue-icon">🔑</span>
              <span class="clue-tag">KEY EVIDENCE COLLECTED • CLUE #2</span>
            </div>
            <h3 class="clue-title">${meta.clueDiscovered.title}</h3>
            <p class="clue-summary">${meta.clueDiscovered.summary}</p>
            <div class="clue-detail">
              <strong>Forensic Note:</strong> ${meta.clueDiscovered.detail}
            </div>
          </div>

          <div class="report-concepts-breakdown">
            <h4 class="breakdown-title">WHAT THE DATA TAUGHT US</h4>
            <div class="concepts-grid">
              <div class="concept-stat-box">
                <span class="stat-name">Correlation vs. Causation</span>
                <span class="stat-flow">r = +${initialR.toFixed(2)} → r = +${finalR.toFixed(2)}</span>
                <p class="stat-desc">Just because two variables rise together does NOT mean one causes the other. High correlation can be an illusion created by confounding variables or misaligned timelines.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Temporal Integrity</span>
                <span class="stat-flow">+48h Offset Eliminated</span>
                <p class="stat-desc">Cross-table joins in distributed data warehouses must verify timestamp keys. Joining Tuesday attendance with Thursday power telemetry produced false conclusions.</p>
              </div>
            </div>
          </div>

          <footer class="report-footer-actions">
            <button class="terminal-btn" id="btn-m2-return-map">
              <span>CAMPUS MAP</span>
            </button>
            <button class="terminal-btn accent" id="btn-m2-proceed-next">
              <span>PROCEED TO MISSION 03: PREDICT THE CHAMPION ➔</span>
            </button>
          </footer>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-m2-return-map').addEventListener('click', () => {
      this.close();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-m2-proceed-next').addEventListener('click', () => {
      this.close();
      this.onNextMission();
    });
  }

  close() {
    this.container.innerHTML = '';
  }
}
