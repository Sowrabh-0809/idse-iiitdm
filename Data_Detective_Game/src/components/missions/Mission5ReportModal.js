import confetti from 'canvas-confetti';
import { gameState } from '../../state/gameState.js';
import { MISSIONS_DATA } from '../../state/clues.js';
import { soundManager } from '../../audio/soundManager.js';

export class Mission5ReportModal {
  constructor(containerEl, onReturnToMap) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
  }

  show(results) {
    const meta = MISSIONS_DATA.m5;
    const { score, accuracy, precision, recall } = results;

    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch (e) {
      // test safe
    }

    gameState.completeMission(
      'm5',
      score,
      `Central CampusSync incident resolved! Tuned diagnostic classifier to ${(accuracy * 100).toFixed(1)}% accuracy. Pinpointed root cause: broken database cron sync batch SYNC-CYCLE-492.`
    );

    const totalScore = gameState.getTotalScore();
    const detective = gameState.getState().detective;

    this.container.innerHTML = `
      <div class="mission-report-overlay" id="mission5-report-modal">
        <div class="mission-report-card" style="max-width: 720px;">
          <header class="report-header">
            <div class="report-badge-strip">
              <span class="report-badge success" style="font-size: 13px; padding: 4px 12px;">🏆 CASE CLOSED • MYSTERY SOLVED</span>
              <span class="report-date">${new Date().toLocaleDateString()}</span>
            </div>
            <h2 class="report-title">FINAL VERDICT: CAMPUS DATA INTEGRITY RESTORED</h2>
            <div class="report-loc">Target Facility: Central Administration Block [ADM-CENTRAL]</div>
          </header>

          <div class="report-score-banner" style="background: linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(0, 229, 255, 0.15)); border-color: var(--accent-green);">
            <div class="score-display">
              <span class="score-label">OVERALL DETECTIVE SCORE</span>
              <span class="score-number">${totalScore} <span class="score-max">/ 500 PTS</span></span>
            </div>
            <div class="rank-award">
              <span class="award-label">FINAL PROMOTION AWARDED</span>
              <span class="award-rank" style="color: var(--accent-green); font-size: 16px;">⭐ ${detective.rank}</span>
            </div>
          </div>

          <!-- UNLOCKED CLUE CARD (ROOT CAUSE DISCOVERY) -->
          <div class="unlocked-clue-card" style="border-color: var(--accent-green); background: rgba(0, 230, 118, 0.05);">
            <div class="clue-card-top">
              <span class="clue-icon">🎖️</span>
              <span class="clue-tag" style="color: var(--accent-green);">ROOT CAUSE CONFIRMED • INCIDENT RESOLVED</span>
            </div>
            <h3 class="clue-title">${meta.clueDiscovered.title}</h3>
            <p class="clue-summary">${meta.clueDiscovered.summary}</p>
            <div class="clue-detail">
              <strong>Forensic Synthesis:</strong> ${meta.clueDiscovered.detail}
            </div>
          </div>

          <!-- SUMMARY OF DATA SCIENCE TECHNIQUES -->
          <div class="report-concepts-breakdown">
            <h4 class="breakdown-title">DATA SCIENCE INVESTIGATIVE METHODOLOGY SUMMARY</h4>
            <div class="concepts-grid">
              <div class="concept-stat-box">
                <span class="stat-name">Classification Metrics</span>
                <span class="stat-flow">Acc: ${(accuracy * 100).toFixed(1)}% | Prec: ${(precision * 100).toFixed(0)}%</span>
                <p class="stat-desc">Calibrated decision threshold to balance false alarms against missed corruptions.</p>
              </div>
              <div class="concept-stat-box">
                <span class="stat-name">Multi-Site Evidence</span>
                <span class="stat-flow">4 Playable Sites Connected</span>
                <p class="stat-desc">Proved that separate department anomalies originated from one single batch cron job.</p>
              </div>
            </div>
          </div>

          <footer class="report-footer-actions" style="margin-top: 20px; flex-wrap: wrap; gap: 10px;">
            <button class="terminal-btn accent glow-gold" id="btn-m5-open-epilogue" style="background: linear-gradient(135deg, #ffb300, #ff8f00); color: #000; font-weight: 700; border: none; padding: 10px 18px; box-shadow: 0 0 15px rgba(255, 179, 0, 0.4);">
              <span>🏆 PROCEED TO EPILOGUE & CERTIFICATE OF APPRECIATION ➔</span>
            </button>
            <button class="terminal-btn" id="btn-print-certificate">
              <span>📄 CASE AUDIT SUMMARY</span>
            </button>
            <button class="terminal-btn" id="btn-m5-return-map">
              <span>CAMPUS MAP (FREE ROAM)</span>
            </button>
          </footer>
        </div>
      </div>

      <!-- CERTIFICATE MODAL SLOT -->
      <div id="certificate-modal-slot"></div>
    `;

    this.container.querySelector('#btn-m5-open-epilogue').addEventListener('click', () => {
      this.close();
      window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'restoration' } }));
    });

    this.container.querySelector('#btn-m5-return-map').addEventListener('click', () => {
      this.close();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-print-certificate').addEventListener('click', () => {
      this.openCertificateModal();
    });
  }

  openCertificateModal() {
    const certSlot = this.container.querySelector('#certificate-modal-slot');
    if (!certSlot) return;

    const totalScore = gameState.getTotalScore();
    const detective = gameState.getState().detective;

    certSlot.innerHTML = `
      <div class="mission-report-overlay" id="printable-certificate-overlay">
        <div class="mission-report-card" style="max-width: 760px; background: #fff; color: #1a202c; border: 8px double #2b6cb0; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); position: relative;">
          
          <div style="text-align: center; border-bottom: 2px solid #cbd5e0; padding-bottom: 20px; margin-bottom: 25px;">
            <div style="font-size: 13px; font-weight: 700; letter-spacing: 2px; color: #4a5568; text-transform: uppercase;">
              Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram
            </div>
            <div style="font-size: 11px; color: #718096; margin-top: 4px;">DEPARTMENT OF DATA SCIENCE & ENGINEERING • IDSe COURSEWORK</div>
            <h1 style="font-size: 26px; font-family: 'Cinzel', Georgia, serif; color: #1a365d; margin-top: 15px; letter-spacing: 1px;">
              DATA DETECTIVE CASE AUDIT CERTIFICATE
            </h1>
          </div>

          <div style="text-align: center; font-size: 15px; line-height: 1.8; color: #2d3748; margin-bottom: 25px;">
            This document certifies that Detective <strong style="font-size: 18px; color: #2b6cb0;">${detective.name}</strong> (${detective.badge})<br>
            has successfully resolved the central <strong>CampusSync Forensic Incident</strong> across IIITDM Kancheepuram,<br>
            achieving the distinction of <strong style="color: #276749;">${detective.rank}</strong> with an aggregate score of <strong>${totalScore} / 500 PTS</strong>.
          </div>

          <div style="background: #edf2f7; border-radius: 6px; padding: 15px; margin-bottom: 25px; font-size: 13px;">
            <div style="font-weight: 700; color: #2b6cb0; margin-bottom: 8px;">VERIFIED STATISTICAL & FORENSIC TECHNIQUES DEMONSTRATED:</div>
            <ul style="list-style: square; padding-left: 20px; line-height: 1.6; color: #4a5568;">
              <li><strong>Mission 1 (Academic Block):</strong> Missing value imputation, outlier detection, and empirical verification of Mean sensitivity vs. Median robustness.</li>
              <li><strong>Mission 2 (Lab Terminal):</strong> Dual-axis time-series alignment, Pearson correlation (r), and refutation of correlation-as-causation.</li>
              <li><strong>Mission 3 (Arjuna Sports):</strong> Ordinary Least Squares (OLS) regression calibration, residual analysis (e = y - ŷ), and MAE minimization.</li>
              <li><strong>Mission 4 (Parking Area):</strong> Monte Carlo probability trials, binomial distributions, and hardware debounce event filtering.</li>
              <li><strong>Mission 5 (Admin Block):</strong> Logistic regression classification threshold tuning, confusion matrix metrics (TP, FP, TN, FN), and decision tree root-cause diagnosis.</li>
            </ul>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <div>
              <div>Case ID: <strong>IDSE-SYNC-492-AUDIT</strong></div>
              <div>Date of Certification: <strong>${new Date().toLocaleDateString()}</strong></div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: cursive; font-size: 18px; color: #2b6cb0;">CampusSync Forensics Unit</div>
              <div style="border-top: 1px solid #a0aec0; width: 180px; margin-top: 4px;">Authorizing Signature</div>
            </div>
          </div>

          <div style="margin-top: 25px; display: flex; justify-content: flex-end; gap: 12px; flex-wrap: wrap;" class="no-print">
            <button class="terminal-btn" id="btn-cert-to-dossier" style="background: linear-gradient(135deg, #b8860b, #d4af37); color: #000; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 700;">
              🎖️ View Faculty Certificate of Appreciation
            </button>
            <button class="terminal-btn accent" id="btn-browser-print" style="background: #2b6cb0; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
            <button class="terminal-btn" id="btn-close-cert" style="background: #e2e8f0; color: #2d3748; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    certSlot.querySelector('#btn-cert-to-dossier').addEventListener('click', () => {
      this.close();
      window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'certificate' } }));
    });

    certSlot.querySelector('#btn-close-cert').addEventListener('click', () => {
      certSlot.innerHTML = '';
    });

    certSlot.querySelector('#btn-browser-print').addEventListener('click', () => {
      window.print();
    });
  }

  close() {
    this.container.innerHTML = '';
  }
}
