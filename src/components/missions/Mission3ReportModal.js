import confetti from 'canvas-confetti';
import { gameState } from '../../state/gameState.js';
import { MISSIONS_DATA } from '../../state/clues.js';
import { soundManager } from '../../audio/soundManager.js';

export class Mission3ReportModal {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;
  }

  show(results) {
    const meta = MISSIONS_DATA.m3;
    const { score, initialMae, finalMae, quarantinedCount } = results;

    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // test safe
    }

    gameState.completeMission(
      'm3',
      score,
      `Calibrated sprint prediction model. MAE dropped from ${initialMae.toFixed(2)}s to ${finalMae.toFixed(2)}s after isolating ${quarantinedCount} off-season batches merged by SYNC-CYCLE-492.`
    );

    this.container.innerHTML = `
      <div class="mission-report-overlay" id="mission3-report-modal">
        <div class="mission-report-card">
          <header class="report-header">
            <div class="report-badge-strip">
              <span class="report-badge success">CASE SOLVED</span>
              <span class="report-date">${new Date().toLocaleDateString()}</span>
            </div>
            <h2 class="report-title">MISSION 03 CALIBRATION REPORT</h2>
            <div class="report-loc">Target Facility: Arjuna Sports Complex [ASC-SPORTS]</div>
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
              <span class="clue-tag">KEY EVIDENCE COLLECTED • CLUE #3</span>
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
                <span class="stat-name">Residuals & MAE</span>
                <span class="stat-flow">MAE: ${initialMae.toFixed(2)}s → ${finalMae.toFixed(2)}s</span>
                <p class="stat-desc">Residuals (e = y - ŷ) measure distance from prediction. An off-season outlier exerts high leverage, pulling the entire regression line off track.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Batch Contamination</span>
                <span class="stat-flow">${quarantinedCount} Off-Season Records Quarantined</span>
                <p class="stat-desc">Linear regression models assume training and prediction data come from the same population distribution. Cross-season batch leakage severely degrades accuracy.</p>
              </div>
            </div>
          </div>

          <footer class="report-footer-actions">
            <button class="terminal-btn" id="btn-m3-return-map">
              <span>CAMPUS MAP</span>
            </button>
            <button class="terminal-btn accent" id="btn-m3-proceed-next">
              <span>PROCEED TO MISSION 04: THE PARKING PATTERN ➔</span>
            </button>
          </footer>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-m3-return-map').addEventListener('click', () => {
      this.close();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-m3-proceed-next').addEventListener('click', () => {
      this.close();
      this.onNextMission();
    });
  }

  close() {
    this.container.innerHTML = '';
  }
}
