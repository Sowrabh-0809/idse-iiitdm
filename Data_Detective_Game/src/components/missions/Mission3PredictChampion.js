import { generateMission3Dataset } from '../../data/mission3Dataset.js';
import { calculateLinearRegression, calculateMean } from '../../utils/mathUtils.js';
import { soundManager } from '../../audio/soundManager.js';
import { Mission3ReportModal } from './Mission3ReportModal.js';

export class Mission3PredictChampion {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;

    this.athletes = generateMission3Dataset();
    
    // Initial regression model (skewed by contaminated off-season records)
    const initX = this.athletes.map(a => a.hours);
    const initY = this.athletes.map(a => a.sprintSec);
    const initOLS = calculateLinearRegression(initX, initY);

    this.slope = Number(initOLS.slope.toFixed(2));
    this.intercept = Number(initOLS.intercept.toFixed(2));
    this.initialMae = initOLS.mae;

    this.reportModal = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.reportModal = new Mission3ReportModal(
      this.container.querySelector('#report-modal-slot-m3'),
      () => this.onReturnToMap(),
      () => this.onNextMission()
    );
  }

  unmount() {
    // cleanup
  }

  getActiveAthletes() {
    return this.athletes.filter(a => !a.isQuarantined);
  }

  predict(hours) {
    return this.slope * hours + this.intercept;
  }

  computeCurrentMae() {
    const active = this.getActiveAthletes();
    if (active.length === 0) return 0;
    let totalAbs = 0;
    for (const a of active) {
      totalAbs += Math.abs(a.sprintSec - this.predict(a.hours));
    }
    return totalAbs / active.length;
  }

  render() {
    const active = this.getActiveAthletes();
    const currentMae = this.computeCurrentMae();
    const isCalibrated = currentMae < 0.6 && this.athletes.filter(a => a.isAnomalous && !a.isQuarantined).length === 0;

    this.container.innerHTML = `
      <div class="mission-terminal-container">
        <!-- TOP HUD BAR -->
        <header class="terminal-topbar">
          <div class="terminal-title-group">
            <span class="terminal-badge" style="border-color: var(--accent-amber); color: var(--accent-amber);">ASC-SPORTS TERMINAL</span>
            <div class="terminal-heading">MISSION 03: PREDICT THE CHAMPION (LINEAR REGRESSION & RESIDUALS)</div>
          </div>
          <div class="terminal-actions-right">
            <button class="terminal-btn accent" id="btn-toggle-notebook-m3" title="Open Case Notebook">
              <span>📁 CASE NOTES</span>
            </button>
            <button class="terminal-btn" id="btn-exit-terminal-m3">
              <span>✕ RETURN TO CAMPUS</span>
            </button>
            <button class="terminal-btn submit-report" id="btn-submit-m3" ${!isCalibrated ? 'disabled' : ''}>
              <span>SUBMIT MODEL (MAE: ${currentMae.toFixed(2)}s)</span>
            </button>
          </div>
        </header>

        <!-- MAIN TERMINAL CONTENT -->
        <div class="terminal-main-layout" style="overflow-y: auto; padding: 20px;">
          <!-- SLIDER CONTROLS BAR -->
          <div class="regression-controls-bar">
            <div class="param-slider-group">
              <span class="param-slider-label">Slope (m):</span>
              <input type="range" class="param-slider" id="slider-slope" min="-0.60" max="0.10" step="0.01" value="${this.slope}" />
              <span class="param-val-readout" id="readout-slope">${this.slope.toFixed(2)}</span>
            </div>

            <div class="param-slider-group">
              <span class="param-slider-label">Intercept (c):</span>
              <input type="range" class="param-slider" id="slider-intercept" min="8.0" max="25.0" step="0.1" value="${this.intercept}" />
              <span class="param-val-readout" id="readout-intercept">${this.intercept.toFixed(1)}s</span>
            </div>

            <button class="terminal-btn" id="btn-auto-ols" style="font-size: 11px; padding: 6px 12px;">
              ⚡ Auto-Fit Least Squares
            </button>

            <div class="mae-display-box">
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">MODEL ERROR:</span>
              <span class="mae-value ${currentMae < 0.6 ? 'good' : 'bad'}" id="readout-mae">
                MAE = ${currentMae.toFixed(2)} sec
              </span>
            </div>
          </div>

          <!-- DASHBOARD GRID: SCATTER PLOT & ATHLETE ROSTER -->
          <div class="m3-dashboard-grid">
            <!-- 1. SCATTER PLOT WITH RESIDUALS -->
            <div class="m3-card">
              <div class="m3-card-header">
                <span class="m3-card-title">🏃 REGRESSION FIT: TRAINING HOURS VS. 100M SPRINT</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                  Target: MAE < 0.60s (Residual vectors in red/green)
                </span>
              </div>
              <div style="width: 100%; height: 290px;" id="scatter-regression-slot">
                ${this.renderRegressionSvg(active)}
              </div>
            </div>

            <!-- 2. ATHLETE ROSTER & OUTLIER QUARANTINE -->
            <div class="m3-card">
              <div class="m3-card-header">
                <span class="m3-card-title">📋 ATHLETE DATA ROSTER (25 VARSITY RECORDS)</span>
                <span style="font-size: 11px; color: var(--accent-amber); font-family: var(--font-mono);">
                  Isolate Batch Mismatches
                </span>
              </div>
              <div class="athlete-table-wrapper">
                <table class="records-table" style="font-size: 12px; width: 100%;">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Athlete</th>
                      <th>Hours</th>
                      <th>Sprint Time</th>
                      <th>Residual (y - ŷ)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.athletes.map(a => {
                      const yHat = this.predict(a.hours);
                      const res = a.sprintSec - yHat;
                      const isHighResidual = Math.abs(res) > 3.0;

                      return `
                        <tr class="athlete-row ${a.isQuarantined ? 'quarantined' : ''} ${isHighResidual ? 'anomaly-row' : ''}">
                          <td><strong>${a.id}</strong></td>
                          <td>${a.name} ${a.isAnomalous ? '⚠️' : ''}</td>
                          <td>${a.hours} hrs</td>
                          <td><strong style="color: ${a.isAnomalous ? 'var(--accent-red)' : 'var(--accent-cyan)'};">${a.sprintSec}s</strong></td>
                          <td><span style="color: ${Math.abs(res) > 1.5 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-family: var(--font-mono);">${res >= 0 ? '+' : ''}${res.toFixed(2)}s</span></td>
                          <td>
                            ${a.isQuarantined ? `
                              <button class="quarantine-btn restore" data-id="${a.id}">Restore</button>
                            ` : `
                              <button class="quarantine-btn" data-id="${a.id}" title="${a.batchNote || 'Quarantine record'}">Quarantine</button>
                            `}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- REPORT MODAL SLOT -->
        <div id="report-modal-slot-m3"></div>
      </div>
    `;
  }

  attachEvents() {
    this.container.querySelector('#btn-exit-terminal-m3').addEventListener('click', () => {
      soundManager.playClick();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-toggle-notebook-m3').addEventListener('click', () => {
      soundManager.playClick();
      window.dispatchEvent(new CustomEvent('toggle-notebook'));
    });

    // Sliders
    const slopeSlider = this.container.querySelector('#slider-slope');
    const interceptSlider = this.container.querySelector('#slider-intercept');

    const updateFromSliders = () => {
      this.slope = parseFloat(slopeSlider.value);
      this.intercept = parseFloat(interceptSlider.value);
      this.render();
      this.attachEvents();
    };

    if (slopeSlider && interceptSlider) {
      slopeSlider.addEventListener('input', updateFromSliders);
      interceptSlider.addEventListener('input', updateFromSliders);
    }

    // Auto OLS
    const btnOls = this.container.querySelector('#btn-auto-ols');
    if (btnOls) {
      btnOls.addEventListener('click', () => {
        soundManager.playUnlock();
        const active = this.getActiveAthletes();
        const fit = calculateLinearRegression(active.map(a => a.hours), active.map(a => a.sprintSec));
        this.slope = Number(fit.slope.toFixed(2));
        this.intercept = Number(fit.intercept.toFixed(2));
        this.render();
        this.attachEvents();
      });
    }

    // Quarantine buttons
    this.container.querySelectorAll('.quarantine-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const athlete = this.athletes.find(a => a.id === id);
        if (!athlete) return;

        soundManager.playClick();
        athlete.isQuarantined = !athlete.isQuarantined;

        if (athlete.isQuarantined && athlete.isAnomalous) {
          alert(`[FORENSIC EVIDENCE ACQUIRED]\n\nQuarantined ${athlete.name} (${athlete.id}).\n\nAudit Note: ${athlete.batchNote}`);
        }

        this.render();
        this.attachEvents();
      });
    });

    // Submit report
    const submitBtn = this.container.querySelector('#btn-submit-m3');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const currentMae = this.computeCurrentMae();
        const quarantinedCount = this.athletes.filter(a => a.isQuarantined).length;

        this.reportModal.show({
          score: 100,
          initialMae: this.initialMae,
          finalMae: currentMae,
          quarantinedCount
        });
      });
    }
  }

  renderRegressionSvg(athletes) {
    const width = 480;
    const height = 280;
    const pad = 40;

    const minX = 0, maxX = 45;
    const minY = 8, maxY = 28;

    const scaleX = (x) => pad + (x / maxX) * (width - pad * 2);
    const scaleY = (y) => height - pad - ((y - minY) / (maxY - minY)) * (height - pad * 2);

    // Regression line points
    const x1 = 0;
    const y1 = this.predict(x1);
    const x2 = 45;
    const y2 = this.predict(x2);

    const lineX1 = scaleX(x1);
    const lineY1 = scaleY(Math.max(minY, Math.min(maxY, y1)));
    const lineX2 = scaleX(x2);
    const lineY2 = scaleY(Math.max(minY, Math.min(maxY, y2)));

    // Points and residual droplines
    const elementsSvg = athletes.map(a => {
      const cx = scaleX(a.hours);
      const cy = scaleY(a.sprintSec);
      const yHat = this.predict(a.hours);
      const cyHat = scaleY(Math.max(minY, Math.min(maxY, yHat)));

      const res = Math.abs(a.sprintSec - yHat);
      const resColor = res > 2.0 ? '#ff5252' : '#00e676';

      return `
        <!-- RESIDUAL DROP LINE -->
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cyHat}" stroke="${resColor}" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.75" />
        <!-- DATA POINT -->
        <circle cx="${cx}" cy="${cy}" r="5" fill="${a.isAnomalous ? '#ff5252' : '#00e5ff'}" opacity="0.9" />
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
        <!-- AXES -->
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />

        <!-- LABELS -->
        <text x="${width / 2}" y="${height - 10}" fill="#8ca0b3" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Weekly Training Hours (x)</text>
        <text x="14" y="${height / 2}" fill="#8ca0b3" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle" transform="rotate(-90 14 ${height / 2})">100m Sprint Time (sec)</text>

        <!-- TICKS -->
        <text x="${pad}" y="${height - pad + 15}" fill="#5c7080" font-size="9">0h</text>
        <text x="${scaleX(20)}" y="${height - pad + 15}" fill="#5c7080" font-size="9">20h</text>
        <text x="${scaleX(40)}" y="${height - pad + 15}" fill="#5c7080" font-size="9">40h</text>
        <text x="${pad - 8}" y="${scaleY(10)}" fill="#5c7080" font-size="9" text-anchor="end">10s</text>
        <text x="${pad - 8}" y="${scaleY(15)}" fill="#5c7080" font-size="9" text-anchor="end">15s</text>
        <text x="${pad - 8}" y="${scaleY(25)}" fill="#5c7080" font-size="9" text-anchor="end">25s</text>

        <!-- REGRESSION FIT LINE -->
        <line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="#ffb300" stroke-width="2.5" />

        <!-- RESIDUALS & POINTS -->
        ${elementsSvg}
      </svg>
    `;
  }
}
