import confetti from 'canvas-confetti';
import { gameState } from '../../state/gameState.js';
import { MISSIONS_DATA } from '../../state/clues.js';
import { soundManager } from '../../audio/soundManager.js';

export class Mission4ReportModal {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;
  }

  show(results) {
    const meta = MISSIONS_DATA.m4;
    const { score, rawOccupancy, theoreticalOccupancy, filteredOccupancy } = results;

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
      'm4',
      score,
      `Resolved parking occupancy anomaly. Filtered sensor bounce debounce loop, lowering occupancy from ${rawOccupancy}% down to ${filteredOccupancy}% (matching theoretical expected ${theoreticalOccupancy}%).`
    );

    this.container.innerHTML = `
      <div class="mission-report-overlay" id="mission4-report-modal">
        <div class="mission-report-card">
          <header class="report-header">
            <div class="report-badge-strip">
              <span class="report-badge success">CASE SOLVED</span>
              <span class="report-date">${new Date().toLocaleDateString()}</span>
            </div>
            <h2 class="report-title">MISSION 04 AUDIT REPORT</h2>
            <div class="report-loc">Target Facility: Campus Parking Area [PKG-MAIN]</div>
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
              <span class="clue-tag">KEY EVIDENCE COLLECTED • CLUE #4</span>
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
                <span class="stat-name">Theoretical vs. Experimental</span>
                <span class="stat-flow">Experimental 86% → Filtered 43%</span>
                <p class="stat-desc">Monte Carlo trials prove that over large sample sizes, experimental frequencies converge toward theoretical probability. Divergence flags hardware sensor duplicate bugs.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Hardware Debounce</span>
                <span class="stat-flow">< 500ms Filter Active</span>
                <p class="stat-desc">Network timeouts caused the Gate B RFID barrier to re-transmit unacknowledged packets without waiting for checkout events, duplicating vehicle occupancy.</p>
              </div>
            </div>
          </div>

          <footer class="report-footer-actions">
            <button class="terminal-btn" id="btn-m4-return-map">
              <span>CAMPUS MAP</span>
            </button>
            <button class="terminal-btn accent" id="btn-m4-proceed-next">
              <span>PROCEED TO MISSION 05: THE FINAL VERDICT ➔</span>
            </button>
          </footer>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-m4-return-map').addEventListener('click', () => {
      this.close();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-m4-proceed-next').addEventListener('click', () => {
      this.close();
      this.onNextMission();
    });
  }

  close() {
    this.container.innerHTML = '';
  }
}
