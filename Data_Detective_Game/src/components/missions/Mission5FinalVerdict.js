import { generateMission5Dataset } from '../../data/mission5Dataset.js';
import { calculateConfusionMatrix } from '../../utils/mathUtils.js';
import { soundManager } from '../../audio/soundManager.js';
import { gameState } from '../../state/gameState.js';
import { Mission5ReportModal } from './Mission5ReportModal.js';

export class Mission5FinalVerdict {
  constructor(containerEl, onReturnToMap) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;

    this.logs = generateMission5Dataset();
    this.threshold = 0.50;
    this.treeStep = 0; // 0: Start, 1: Batch Filter, 2: Timezone Check, 3: Cron Isolated
    this.isEvidenceSynthesized = false;

    this.reportModal = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.reportModal = new Mission5ReportModal(
      this.container.querySelector('#report-modal-slot-m5'),
      () => this.onReturnToMap()
    );
  }

  unmount() {
    // cleanup
  }

  getMetrics() {
    const actuals = this.logs.map(l => l.actualCorrupted);
    const predictions = this.logs.map(l => l.predictedProb >= this.threshold ? 1 : 0);
    return calculateConfusionMatrix(actuals, predictions);
  }

  render() {
    const cm = this.getMetrics();
    const collectedClues = gameState.getState().collectedClues;
    const isReadyToSubmit = this.treeStep >= 3 && cm.accuracy > 0.85;

    this.container.innerHTML = `
      <div class="mission-terminal-container">
        <!-- TOP HUD BAR -->
        <header class="terminal-topbar">
          <div class="terminal-title-group">
            <span class="terminal-badge" style="border-color: var(--accent-green); color: var(--accent-green);">ADM-CENTRAL MAINFRAME</span>
            <div class="terminal-heading">MISSION 05: THE FINAL VERDICT (CLASSIFICATION & ROOT CAUSE)</div>
          </div>
          <div class="terminal-actions-right">
            <button class="terminal-btn accent" id="btn-toggle-notebook-m5" title="Open Case Notebook">
              <span>📁 CASE NOTES</span>
            </button>
            <button class="terminal-btn" id="btn-exit-terminal-m5">
              <span>✕ RETURN TO CAMPUS</span>
            </button>
            <button class="terminal-btn submit-report" id="btn-submit-m5" ${!isReadyToSubmit ? 'disabled' : ''}>
              <span>SUBMIT FINAL VERDICT (${(cm.accuracy * 100).toFixed(0)}% ACCURACY)</span>
            </button>
          </div>
        </header>

        <!-- MAIN TERMINAL CONTENT -->
        <div class="terminal-main-layout" style="overflow-y: auto; padding: 20px;">
          <!-- 1. EVIDENCE SYNTHESIS CORKBOARD -->
          <div class="m5-card">
            <div class="m5-card-header">
              <span class="m5-card-title">📌 CROSS-CAMPUS EVIDENCE SYNTHESIS</span>
              <button class="terminal-btn ${this.isEvidenceSynthesized ? 'accent' : ''}" id="btn-synthesize-clues" style="font-size: 11px; padding: 4px 10px;">
                ${this.isEvidenceSynthesized ? '✓ All Clues Linked to SYNC-CYCLE-492' : '🔗 Link All 4 Mission Clues'}
              </button>
            </div>
            <div class="corkboard-grid">
              <div class="corkboard-clue-card" style="${this.isEvidenceSynthesized ? 'border-color: var(--accent-cyan);' : ''}">
                <span class="pin-icon">📍</span>
                <span class="cork-clue-num">CLUE #1 • ACADEMIC BLOCK</span>
                <div class="cork-clue-title">Timestamp Clustering</div>
                <div class="cork-clue-text">100 attendance records corrupted with cloned future timestamps: <strong>SYNC-CYCLE-492</strong>.</div>
              </div>
              <div class="corkboard-clue-card" style="${this.isEvidenceSynthesized ? 'border-color: var(--accent-cyan);' : ''}">
                <span class="pin-icon">📍</span>
                <span class="cork-clue-num">CLUE #2 • LAB TERMINAL</span>
                <div class="cork-clue-title">Misaligned Date Indices</div>
                <div class="cork-clue-text">Spurious correlation (r=0.88) caused by an automated +48h table join offset.</div>
              </div>
              <div class="corkboard-clue-card" style="${this.isEvidenceSynthesized ? 'border-color: var(--accent-cyan);' : ''}">
                <span class="pin-icon">📍</span>
                <span class="cork-clue-num">CLUE #3 • ARJUNA SPORTS</span>
                <div class="cork-clue-title">Period Mismatch</div>
                <div class="cork-clue-text">Off-season recreational data merged into varsity sprint training roster.</div>
              </div>
              <div class="corkboard-clue-card" style="${this.isEvidenceSynthesized ? 'border-color: var(--accent-cyan);' : ''}">
                <span class="pin-icon">📍</span>
                <span class="cork-clue-num">CLUE #4 • PARKING AREA</span>
                <div class="cork-clue-title">RFID Retry Double-Counting</div>
                <div class="cork-clue-text">Hardware timeout loop logged duplicate vehicle pulses under Gate B boom barrier.</div>
              </div>
            </div>
          </div>

          <!-- 2. DIAGNOSTIC CLASSIFIER & CONFUSION MATRIX -->
          <div class="m5-dashboard-grid" style="margin-top: 16px;">
            <!-- CONFUSION MATRIX CARD -->
            <div class="m5-card">
              <div class="m5-card-header">
                <span class="m5-card-title">🧮 LOGISTIC REGRESSION: 2x2 CONFUSION MATRIX</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">N = 100 Logs</span>
              </div>

              <!-- THRESHOLD SLIDER -->
              <div class="threshold-slider-group" style="margin-bottom: 12px;">
                <span style="color: var(--text-muted);">Threshold (τ):</span>
                <input type="range" class="threshold-slider" id="threshold-slider" min="0.10" max="0.90" step="0.05" value="${this.threshold}" />
                <strong style="color: var(--accent-green); min-width: 40px;" id="threshold-readout">${this.threshold.toFixed(2)}</strong>
              </div>

              <!-- 2x2 MATRIX -->
              <div class="confusion-matrix-grid">
                <div></div>
                <div class="cm-header">Pred: Corrupt</div>
                <div class="cm-header">Pred: Clean</div>

                <div class="cm-header">Act: Corrupt</div>
                <div class="cm-cell tp">
                  <span class="cm-val tp-val">${cm.tp}</span>
                  <span>True Pos (TP)</span>
                </div>
                <div class="cm-cell fn">
                  <span class="cm-val fn-val">${cm.fn}</span>
                  <span>False Neg (FN)</span>
                </div>

                <div class="cm-header">Act: Clean</div>
                <div class="cm-cell fp">
                  <span class="cm-val fp-val">${cm.fp}</span>
                  <span>False Pos (FP)</span>
                </div>
                <div class="cm-cell tn">
                  <span class="cm-val tn-val">${cm.tn}</span>
                  <span>True Neg (TN)</span>
                </div>
              </div>

              <!-- METRICS STRIP -->
              <div class="metrics-strip">
                <div class="metric-pill">
                  <span class="metric-pill-label">Accuracy</span>
                  <span class="metric-pill-val" style="color: var(--accent-green);">${(cm.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div class="metric-pill">
                  <span class="metric-pill-label">Precision</span>
                  <span class="metric-pill-val" style="color: var(--accent-cyan);">${(cm.precision * 100).toFixed(0)}%</span>
                </div>
                <div class="metric-pill">
                  <span class="metric-pill-label">Recall</span>
                  <span class="metric-pill-val" style="color: var(--accent-amber);">${(cm.recall * 100).toFixed(0)}%</span>
                </div>
                <div class="metric-pill">
                  <span class="metric-pill-label">F1-Score</span>
                  <span class="metric-pill-val">${cm.f1.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- DECISION TREE ROOT CAUSE ISOLATOR -->
            <div class="m5-card">
              <div class="m5-card-header">
                <span class="m5-card-title">🌳 DECISION TREE: ROOT CAUSE DIAGNOSIS</span>
                <span style="font-size: 11px; color: var(--accent-amber); font-family: var(--font-mono);">
                  Step ${this.treeStep + 1} of 4
                </span>
              </div>
              
              <div class="decision-tree-container">
                <div class="tree-node-box" style="border-color: var(--accent-green);">
                  <span>Root: Is Batch ID == SYNC-CYCLE-492?</span>
                  <strong style="color: var(--accent-green);">YES</strong>
                </div>
                
                ${this.treeStep >= 1 ? `
                  <div class="tree-connector"></div>
                  <div class="tree-node-box" style="border-color: var(--accent-cyan);">
                    <span>Branch 1: Table Join Offset > 24 Hours?</span>
                    <strong style="color: var(--accent-cyan);">YES (+48h)</strong>
                  </div>
                ` : ''}

                ${this.treeStep >= 2 ? `
                  <div class="tree-connector"></div>
                  <div class="tree-node-box" style="border-color: var(--accent-amber);">
                    <span>Branch 2: Unhandled Retry Loop Detected?</span>
                    <strong style="color: var(--accent-amber);">YES (Gate & DB)</strong>
                  </div>
                ` : ''}

                ${this.treeStep >= 3 ? `
                  <div class="tree-connector"></div>
                  <div class="tree-node-box" style="background: rgba(0, 230, 118, 0.15); border-color: var(--accent-green);">
                    <span>Leaf: Isolated Defective Service</span>
                    <strong style="color: var(--accent-green);">/etc/cron.d/campussync-sync.sh</strong>
                  </div>
                ` : ''}
              </div>

              <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
                ${this.treeStep < 3 ? `
                  <button class="terminal-btn accent" id="btn-advance-tree" style="font-size: 11px;">
                    Execute Next Decision Tree Split ➔
                  </button>
                ` : `
                  <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-green); font-weight: 700;">
                    ✓ CRON DAEMON ISOLATED & READY FOR PATCH
                  </span>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- REPORT MODAL SLOT -->
        <div id="report-modal-slot-m5"></div>
      </div>
    `;
  }

  attachEvents() {
    this.container.querySelector('#btn-exit-terminal-m5').addEventListener('click', () => {
      soundManager.playClick();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-toggle-notebook-m5').addEventListener('click', () => {
      soundManager.playClick();
      window.dispatchEvent(new CustomEvent('toggle-notebook'));
    });

    // Synthesize clues button
    const clueBtn = this.container.querySelector('#btn-synthesize-clues');
    if (clueBtn) {
      clueBtn.addEventListener('click', () => {
        soundManager.playUnlock();
        this.isEvidenceSynthesized = true;
        this.render();
        this.attachEvents();
      });
    }

    // Threshold slider
    const slider = this.container.querySelector('#threshold-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.threshold = parseFloat(e.target.value);
        this.render();
        this.attachEvents();
      });
    }

    // Advance tree button
    const treeBtn = this.container.querySelector('#btn-advance-tree');
    if (treeBtn) {
      treeBtn.addEventListener('click', () => {
        soundManager.playTerminal();
        this.treeStep++;
        this.render();
        this.attachEvents();
      });
    }

    // Submit report
    const submitBtn = this.container.querySelector('#btn-submit-m5');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const cm = this.getMetrics();
        this.reportModal.show({
          score: 100,
          accuracy: cm.accuracy,
          precision: cm.precision,
          recall: cm.recall
        });
      });
    }
  }
}
