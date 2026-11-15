import confetti from 'canvas-confetti';
import { gameState } from '../../state/gameState.js';
import { MISSIONS_DATA } from '../../state/clues.js';
import { soundManager } from '../../audio/soundManager.js';

export class Mission1ReportModal {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;
  }

  show(results) {
    const meta = MISSIONS_DATA.m1;
    const { score, initialMean, finalMean, initialMedian, finalMedian, duplicatesRemoved, outliersFixed, missingImputed } = results;

    // Trigger victory fanfare and confetti
    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore in headless / test environments
    }

    // Save completion to central gameState
    gameState.completeMission('m1', score, `Cleaned 100 student records. Mean stabilized from ${initialMean.toFixed(1)}% to ${finalMean.toFixed(1)}%. Identified SYNC-CYCLE-492 duplicate pattern.`);

    this.container.innerHTML = `
      <div class="mission-report-overlay" id="mission1-report-modal">
        <div class="mission-report-card">
          <!-- REPORT HEADER -->
          <header class="report-header">
            <div class="report-badge-strip">
              <span class="report-badge success">CASE SOLVED</span>
              <span class="report-date">${new Date().toLocaleDateString()}</span>
            </div>
            <h2 class="report-title">MISSION 01 AUDIT REPORT</h2>
            <div class="report-loc">Target Facility: Academic Block Terminal [AB-101]</div>
          </header>

          <!-- SCORE & RANK BANNER -->
          <div class="report-score-banner">
            <div class="score-display">
              <span class="score-label">FORENSIC SCORE</span>
              <span class="score-number">${score} <span class="score-max">/ 100 PTS</span></span>
            </div>
            <div class="rank-award">
              <span class="award-label">DETECTIVE RANK PROMOTION</span>
              <span class="award-rank">${gameState.getState().detective.rank}</span>
            </div>
          </div>

          <!-- UNLOCKED CLUE CARD (THE CENTRAL MYSTERY THREAD) -->
          <div class="unlocked-clue-card">
            <div class="clue-card-top">
              <span class="clue-icon">🔑</span>
              <span class="clue-tag">KEY EVIDENCE COLLECTED • CLUE #1</span>
            </div>
            <h3 class="clue-title">${meta.clueDiscovered.title}</h3>
            <p class="clue-summary">${meta.clueDiscovered.summary}</p>
            <div class="clue-detail">
              <strong>Forensic Note:</strong> ${meta.clueDiscovered.detail}
            </div>
          </div>

          <!-- DATA SCIENCE CONCEPTS DISCOVERED & COMPARISON -->
          <div class="report-concepts-breakdown">
            <h4 class="breakdown-title">WHAT THE DATA TAUGHT US</h4>
            <div class="concepts-grid">
              <div class="concept-stat-box">
                <span class="stat-name">Mean Sensitivity</span>
                <span class="stat-flow">${initialMean.toFixed(1)}% → ${finalMean.toFixed(1)}%</span>
                <p class="stat-desc">A single 450% sensor overflow pulled the overall institute mean upward by over 4%. Mean is highly sensitive to outliers.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Median Robustness</span>
                <span class="stat-flow">${initialMedian}% → ${finalMedian}%</span>
                <p class="stat-desc">Despite wild anomalies (450%, -45%), the middle rank remained unchanged at 80%. The median is resistant to extreme skew.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Data Hygiene</span>
                <span class="stat-flow">${duplicatesRemoved + outliersFixed + missingImputed} Anomalies Resolved</span>
                <p class="stat-desc">Purged 3 duplicate sync clones, clamped 3 sensor bit-overflows, and cross-verified missing packets against ground-truth logs.</p>
              </div>
            </div>
          </div>

          <!-- FOOTER ACTIONS -->
          <footer class="report-footer">
            <button class="report-btn secondary" id="btn-report-map">
              <span>← RETURN TO CAMPUS MAP</span>
            </button>
            <button class="report-btn primary" id="btn-report-next">
              <span>CONTINUE TO MISSION 02: THE HIDDEN PATTERN →</span>
            </button>
          </footer>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-report-map').addEventListener('click', () => {
      soundManager.playClick();
      this.close();
      if (this.onReturnToMap) this.onReturnToMap();
    });

    this.container.querySelector('#btn-report-next').addEventListener('click', () => {
      soundManager.playClick();
      this.close();
      if (this.onNextMission) this.onNextMission();
    });
  }

  close() {
    this.container.innerHTML = '';
  }
}
