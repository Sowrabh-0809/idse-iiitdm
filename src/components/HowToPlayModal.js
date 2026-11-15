import { soundManager } from '../audio/soundManager.js';

export class HowToPlayModal {
  constructor(containerEl) {
    this.container = containerEl;
  }

  mount() {
    this.render();
    this.attachEvents();
  }

  open() {
    const modal = this.container.querySelector('#how-to-play-modal');
    if (modal) {
      modal.classList.remove('hidden');
      soundManager.playClick();
    }
  }

  close() {
    const modal = this.container.querySelector('#how-to-play-modal');
    if (modal) {
      modal.classList.add('hidden');
      soundManager.playClick();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="how-to-play-overlay hidden" id="how-to-play-modal">
        <div class="handbook-card">
          <header class="handbook-header">
            <div class="handbook-title-area">
              <span class="handbook-badge">CADET BRIEFING MANUAL</span>
              <h2>DATA DETECTIVE FIELD PROTOCOLS</h2>
              <p class="handbook-sub">IIITDM Kancheepuram Campus Data Forensics Guidelines</p>
            </div>
            <button class="handbook-close-btn" id="btn-close-handbook">✕</button>
          </header>

          <div class="handbook-body">
            <!-- RULE #1: NOT A QUIZ -->
            <div class="handbook-section highlight-box">
              <div class="section-icon">💡</div>
              <div class="section-text">
                <h3>Core Detective Rule: No Textbook Quizzes</h3>
                <p>
                  You will never be asked definitions like <em>"What is linear regression?"</em> or <em>"Define correlation"</em>. 
                  Instead, you will interact with real campus telemetry: repairing corrupted student attendance logs, tuning sports regression lines, running arrival simulations, and configuring central classification models to save the campus network.
                </p>
              </div>
            </div>

            <!-- INVESTIGATION PHASES -->
            <div class="handbook-section">
              <h3>The 4 Playable Sites & 5 Connected Missions</h3>
              <div class="guide-grid">
                <div class="guide-col">
                  <div class="site-tag academic">📍 1. Academic Block</div>
                  <ul>
                    <li><strong>Mission 1: The Corrupted Records</strong> — Inspect dirty student datasets, eliminate duplicate synchronizations, resolve outliers, and see how mean vs. median behave.</li>
                    <li><strong>Mission 2: The Hidden Pattern</strong> — Contrast lab attendance against instrument power logs. Chart correlations and expose misleading causation.</li>
                  </ul>
                </div>

                <div class="guide-col">
                  <div class="site-tag sports">📍 2. Arjuna Sports Complex</div>
                  <ul>
                    <li><strong>Mission 3: Predict the Champion</strong> — Calibrate an athletic sprint prediction line, inspect residuals & MAE, and spot an out-of-season data spillover.</li>
                  </ul>
                </div>

                <div class="guide-col">
                  <div class="site-tag parking">📍 3. Parking Area</div>
                  <ul>
                    <li><strong>Mission 4: The Parking Pattern</strong> — Run empirical Monte Carlo vehicle arrival trials, compare experimental vs theoretical probability, and diagnose phantom traffic surges.</li>
                  </ul>
                </div>

                <div class="guide-col">
                  <div class="site-tag admin">📍 4. Administration Block</div>
                  <ul>
                    <li><strong>Mission 5: The Final Verdict</strong> — Mount the central CampusSync diagnostic classifier, adjust logistic decision thresholds, construct the decision tree, and solve the institute mystery.</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- SCORING SYSTEM -->
            <div class="handbook-section">
              <h3>Scoring & Performance Evaluation (100 Pts / Mission)</h3>
              <div class="scoring-breakdown">
                <div class="score-tier">
                  <span class="pts">20 PTS</span>
                  <span class="tier-label">Evidence Uncovered</span>
                  <span class="tier-desc">Finding corrupted timestamps & data anomalies</span>
                </div>
                <div class="score-tier">
                  <span class="pts">30 PTS</span>
                  <span class="tier-label">Tool Proficiency</span>
                  <span class="tier-desc">Proper usage of inspection, regression & filtering tools</span>
                </div>
                <div class="score-tier">
                  <span class="pts">30 PTS</span>
                  <span class="tier-label">Reasoned Decisions</span>
                  <span class="tier-desc">Selecting statistically sound repairs over guesswork</span>
                </div>
                <div class="score-tier">
                  <span class="pts">20 PTS</span>
                  <span class="tier-label">Mission Clearance</span>
                  <span class="tier-desc">Generating verified audit report for the Dean</span>
                </div>
              </div>
            </div>

            <!-- SAVING & PLAYTHROUGH -->
            <div class="handbook-section">
              <h3>Progress & Local Persistence</h3>
              <p>
                Your detective badge and unlocked mission clues are automatically saved to your browser's local storage. You can freely leave to explore the campus map and resume anytime.
              </p>
            </div>
          </div>

          <footer class="handbook-footer">
            <button class="handbook-ack-btn" id="btn-ack-handbook">ACKNOWLEDGE & RETURN TO HQ</button>
          </footer>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const btnClose = this.container.querySelector('#btn-close-handbook');
    const btnAck = this.container.querySelector('#btn-ack-handbook');
    const overlay = this.container.querySelector('#how-to-play-modal');

    if (btnClose) btnClose.addEventListener('click', () => this.close());
    if (btnAck) btnAck.addEventListener('click', () => this.close());
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }
  }
}

