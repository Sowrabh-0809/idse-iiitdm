import { generateMission2Dataset } from '../../data/mission2Dataset.js';
import { calculateCorrelation, calculateMean } from '../../utils/mathUtils.js';
import { soundManager } from '../../audio/soundManager.js';
import { Mission2ReportModal } from './Mission2ReportModal.js';

export class Mission2HiddenPattern {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;

    this.rawRecords = generateMission2Dataset();
    this.currentOffsetHours = 48; // Default corrupted offset (+48 hours)
    this.selectedDeduction = null;
    this.inspectedRecord = null;
    this.hasInspectedCronSpike = false;

    this.initialR = this.computeCorrelationForOffset(48);
    this.reportModal = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.reportModal = new Mission2ReportModal(
      this.container.querySelector('#report-modal-slot-m2'),
      () => this.onReturnToMap(),
      () => this.onNextMission()
    );
  }

  unmount() {
    // cleanup
  }

  computeCorrelationForOffset(offsetHours) {
    // 1 hour = 1 interval in our 12-hour/day records
    // offsetHours in terms of record slots
    const shiftSlots = Math.round(offsetHours / 2);
    const n = this.rawRecords.length;

    const xVals = [];
    const yVals = [];

    for (let i = 0; i < n; i++) {
      const shiftedIdx = (i + shiftSlots + n * 10) % n;
      xVals.push(this.rawRecords[shiftedIdx].trueAttendance);
      yVals.push(this.rawRecords[i].powerDrawKW);
    }

    return calculateCorrelation(xVals, yVals);
  }

  getDatasetForCurrentOffset() {
    const shiftSlots = Math.round(this.currentOffsetHours / 2);
    const n = this.rawRecords.length;

    return this.rawRecords.map((r, i) => {
      const shiftedIdx = (i + shiftSlots + n * 10) % n;
      return {
        ...r,
        currentAttendance: this.rawRecords[shiftedIdx].trueAttendance,
        powerKW: r.powerDrawKW
      };
    });
  }

  render() {
    const activeData = this.getDatasetForCurrentOffset();
    const xVals = activeData.map(d => d.currentAttendance);
    const yVals = activeData.map(d => d.powerKW);
    const rVal = calculateCorrelation(xVals, yVals);

    const isStrong = Math.abs(rVal) > 0.6;
    const isZeroShift = this.currentOffsetHours === 0;

    this.container.innerHTML = `
      <div class="mission-terminal-container">
        <!-- TOP HUD BAR -->
        <header class="terminal-topbar">
          <div class="terminal-title-group">
            <span class="terminal-badge">AB-LAB COMPUTATIONAL TERMINAL</span>
            <div class="terminal-heading">MISSION 02: THE HIDDEN PATTERN (CORRELATION & CAUSATION)</div>
          </div>
          <div class="terminal-actions-right">
            <button class="terminal-btn accent" id="btn-toggle-notebook-m2" title="Open Case Notebook">
              <span>📁 CASE NOTES</span>
            </button>
            <button class="terminal-btn" id="btn-exit-terminal-m2">
              <span>✕ RETURN TO CAMPUS</span>
            </button>
            <button class="terminal-btn submit-report" id="btn-submit-m2" ${(!isZeroShift || !this.selectedDeduction) ? 'disabled' : ''}>
              <span>SUBMIT FORENSIC AUDIT</span>
            </button>
          </div>
        </header>

        <!-- MAIN TERMINAL CONTENT -->
        <div class="terminal-main-layout" style="overflow-y: auto; padding: 20px;">
          <!-- TIME SHIFT FORENSIC TOOLBAR -->
          <div class="time-shift-control-bar">
            <div class="shift-info-label">
              <span class="shift-label-title">⚡ FORENSIC DATE-ALIGNMENT CALIBRATOR</span>
              <span class="shift-label-desc">
                Investigate whether CampusSync table joins shifted lab attendance relative to electrical telemetry.
              </span>
            </div>
            <div class="shift-buttons-group">
              <button class="shift-btn ${this.currentOffsetHours === 48 ? 'active' : ''}" data-offset="48">
                +48h (Corrupted Sync)
              </button>
              <button class="shift-btn ${this.currentOffsetHours === 24 ? 'active' : ''}" data-offset="24">
                +24h Offset
              </button>
              <button class="shift-btn corrected ${this.currentOffsetHours === 0 ? 'active' : ''}" data-offset="0">
                ✓ 0h (Synchronized True Time)
              </button>
              <button class="shift-btn ${this.currentOffsetHours === -24 ? 'active' : ''}" data-offset="-24">
                -24h Offset
              </button>
              <button class="shift-btn ${this.currentOffsetHours === -48 ? 'active' : ''}" data-offset="-48">
                -48h Offset
              </button>
            </div>
          </div>

          <!-- DUAL DASHBOARD: SCATTER PLOT & TIME-SERIES -->
          <div class="m2-dashboard-grid">
            <!-- 1. SCATTER PLOT WITH PEARSON R -->
            <div class="m2-card">
              <div class="m2-card-header">
                <span class="m2-card-title">📊 SCATTER PLOT: ATTENDANCE VS. POWER CONSUMPTION</span>
                <div class="correlation-badge-container">
                  <span class="r-value-display" id="r-display">r = ${rVal >= 0 ? '+' : ''}${rVal.toFixed(2)}</span>
                  <span class="r-strength-tag ${Math.abs(rVal) < 0.3 ? 'weak' : ''}" id="r-tag">
                    ${Math.abs(rVal) > 0.7 ? 'Strong Positive' : Math.abs(rVal) > 0.3 ? 'Moderate' : 'No / Weak Correlation'}
                  </span>
                </div>
              </div>
              <div style="width: 100%; height: 240px;" id="scatter-plot-slot">
                ${this.renderScatterPlotSvg(xVals, yVals, rVal)}
              </div>
            </div>

            <!-- 2. TIME SERIES DUAL-AXIS -->
            <div class="m2-card">
              <div class="m2-card-header">
                <span class="m2-card-title">📈 DUAL-AXIS TIMELINE: MON – FRI TELEMETRY</span>
                <div style="font-size: 11px; display: flex; gap: 12px; font-family: var(--font-mono);">
                  <span style="color: var(--accent-cyan);">● Attendance (%)</span>
                  <span style="color: var(--accent-amber);">● Power Draw (kW)</span>
                </div>
              </div>
              <div style="width: 100%; height: 240px;" id="timeline-plot-slot">
                ${this.renderTimelineSvg(activeData)}
              </div>
            </div>
          </div>

          <!-- FORENSIC SERVER LOGS & DEDUCTION MATRIX -->
          <div class="m2-dashboard-grid" style="margin-top: 16px;">
            <!-- TELEMETRY SAMPLES -->
            <div class="m2-card">
              <div class="m2-card-header">
                <span class="m2-card-title">🔍 SERVER TELEMETRY SAMPLES (CLICK TO AUDIT)</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                  Inspect Friday 15:00 Spike
                </span>
              </div>
              <div style="max-height: 220px; overflow-y: auto;">
                <table class="records-table" style="font-size: 12px; width: 100%;">
                  <thead>
                    <tr>
                      <th>Time / Day</th>
                      <th>Attendance</th>
                      <th>Power (kW)</th>
                      <th>Hardware Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeData.slice(36, 48).map(d => {
                      const isSpike = d.powerKW > 40;
                      return `
                        <tr class="${isSpike ? 'anomaly-row' : ''}" style="cursor: pointer;" data-time="${d.timeStr}">
                          <td><strong>${d.timeStr}</strong></td>
                          <td><span style="color: var(--accent-cyan);">${d.currentAttendance}%</span></td>
                          <td><span style="color: ${isSpike ? 'var(--accent-red)' : 'var(--accent-amber)'}; font-weight: 700;">${d.powerKW} kW</span></td>
                          <td>${isSpike ? '<span class="status-badge" style="background: rgba(255,82,82,0.2); color: #ff5252;">HVAC SERVER CRON</span>' : '<span style="color: var(--text-dim);">Normal</span>'}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- DEDUCTION MATRIX -->
            <div class="m2-card">
              <div class="m2-card-header">
                <span class="m2-card-title">⚖️ DETECTIVE HYPOTHESIS DEDUCTION</span>
                <span style="font-size: 11px; color: var(--accent-amber);">Evaluate Causation</span>
              </div>
              <div class="deduction-options-list">
                <label class="deduction-choice ${this.selectedDeduction === 'a' ? 'selected' : ''}" data-choice="a">
                  <input type="radio" name="deduction" class="choice-radio" value="a" ${this.selectedDeduction === 'a' ? 'checked' : ''} />
                  <div class="choice-content">
                    <span class="choice-title">Hypothesis A: High attendance causes grid overload.</span>
                    <span class="choice-explanation">Since r = 0.88, students logging in at the lab directly draw massive power surges.</span>
                  </div>
                </label>

                <label class="deduction-choice ${this.selectedDeduction === 'b' ? 'selected' : ''}" data-choice="b">
                  <input type="radio" name="deduction" class="choice-radio" value="b" ${this.selectedDeduction === 'b' ? 'checked' : ''} />
                  <div class="choice-content">
                    <span class="choice-title">Hypothesis B: Spurious correlation caused by a +48h table join offset.</span>
                    <span class="choice-explanation">When synchronized to 0h, correlation collapses (r ≈ 0.10). The power spike is an independent scheduled Friday cron cycle, not student usage.</span>
                  </div>
                </label>

                <label class="deduction-choice ${this.selectedDeduction === 'c' ? 'selected' : ''}" data-choice="c">
                  <input type="radio" name="deduction" class="choice-radio" value="c" ${this.selectedDeduction === 'c' ? 'checked' : ''} />
                  <div class="choice-content">
                    <span class="choice-title">Hypothesis C: Sensors are completely broken and contain random white noise.</span>
                    <span class="choice-explanation">No systematic pattern exists in either attendance or electrical power logs.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- REPORT MODAL SLOT -->
        <div id="report-modal-slot-m2"></div>
      </div>
    `;
  }

  attachEvents() {
    // Exit terminal
    this.container.querySelector('#btn-exit-terminal-m2').addEventListener('click', () => {
      soundManager.playClick();
      this.onReturnToMap();
    });

    // Open Case Notes
    this.container.querySelector('#btn-toggle-notebook-m2').addEventListener('click', () => {
      soundManager.playClick();
      window.dispatchEvent(new CustomEvent('toggle-notebook'));
    });

    // Time Shift Buttons
    this.container.querySelectorAll('.shift-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const offset = parseInt(e.target.dataset.offset, 10);
        soundManager.playTerminal();
        this.currentOffsetHours = offset;
        this.render();
        this.attachEvents();
      });
    });

    // Deduction choices
    this.container.querySelectorAll('.deduction-choice').forEach(choice => {
      choice.addEventListener('click', (e) => {
        const choiceVal = choice.dataset.choice;
        this.selectedDeduction = choiceVal;
        soundManager.playClick();
        this.render();
        this.attachEvents();
      });
    });

    // Submit audit button
    const submitBtn = this.container.querySelector('#btn-submit-m2');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.handleSubmit();
      });
    }
  }

  handleSubmit() {
    if (this.currentOffsetHours !== 0) {
      soundManager.playError();
      alert('Forensic Warning: You must synchronize the date alignment to 0h (Synchronized True Time) before submitting your audit.');
      return;
    }

    if (this.selectedDeduction !== 'b') {
      soundManager.playError();
      alert('Forensic Inconsistency: Review your deduction hypothesis. Remember: correlation does NOT prove causation when an uncorrected time shift exists!');
      return;
    }

    const finalR = this.computeCorrelationForOffset(0);

    // Score calculation (100 pts)
    this.reportModal.show({
      score: 100,
      initialR: this.initialR,
      finalR,
      verifiedSpurious: true
    });
  }

  renderScatterPlotSvg(xVals, yVals, rVal) {
    const width = 440;
    const height = 220;
    const pad = 35;

    const minX = 0, maxX = 100;
    const minY = 0, maxY = 60;

    const scaleX = (x) => pad + (x / maxX) * (width - pad * 2);
    const scaleY = (y) => height - pad - (y / maxY) * (height - pad * 2);

    // Trendline calculation (OLS)
    const meanX = calculateMean(xVals);
    const meanY = calculateMean(yVals);
    let num = 0, den = 0;
    for (let i = 0; i < xVals.length; i++) {
      num += (xVals[i] - meanX) * (yVals[i] - meanY);
      den += (xVals[i] - meanX) * (xVals[i] - meanX);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    const lineX1 = scaleX(10);
    const lineY1 = scaleY(slope * 10 + intercept);
    const lineX2 = scaleX(90);
    const lineY2 = scaleY(slope * 90 + intercept);

    const pointsSvg = xVals.map((x, i) => {
      const cx = scaleX(x);
      const cy = scaleY(yVals[i]);
      return `<circle cx="${cx}" cy="${cy}" r="4" fill="#00e5ff" opacity="0.75" />`;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
        <!-- AXES -->
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />

        <!-- LABELS -->
        <text x="${width / 2}" y="${height - 8}" fill="#8ca0b3" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle">Attendance (%)</text>
        <text x="12" y="${height / 2}" fill="#8ca0b3" font-size="10" font-family="'JetBrains Mono', monospace" text-anchor="middle" transform="rotate(-90 12 ${height / 2})">Power (kW)</text>

        <!-- GRID TICKS -->
        <text x="${pad}" y="${height - pad + 15}" fill="#5c7080" font-size="9" text-anchor="middle">0%</text>
        <text x="${width - pad}" y="${height - pad + 15}" fill="#5c7080" font-size="9" text-anchor="middle">100%</text>
        <text x="${pad - 8}" y="${height - pad}" fill="#5c7080" font-size="9" text-anchor="end">0</text>
        <text x="${pad - 8}" y="${pad + 10}" fill="#5c7080" font-size="9" text-anchor="end">60kW</text>

        <!-- TRENDLINE -->
        <line x1="${lineX1}" y1="${lineY1}" x2="${lineX2}" y2="${lineY2}" stroke="${Math.abs(rVal) > 0.6 ? '#ffb300' : '#00e676'}" stroke-width="2.5" stroke-dasharray="${Math.abs(rVal) < 0.3 ? '4 4' : 'none'}" />

        <!-- POINTS -->
        ${pointsSvg}
      </svg>
    `;
  }

  renderTimelineSvg(data) {
    const width = 440;
    const height = 220;
    const pad = 35;

    const n = data.length;
    const stepX = (width - pad * 2) / (n - 1);

    const maxPower = 60;
    const maxAtt = 100;

    let pathAtt = '';
    let pathPower = '';

    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const yAtt = height - pad - (d.currentAttendance / maxAtt) * (height - pad * 2);
      const yPow = height - pad - (d.powerKW / maxPower) * (height - pad * 2);

      if (i === 0) {
        pathAtt = `M ${x} ${yAtt}`;
        pathPower = `M ${x} ${yPow}`;
      } else {
        pathAtt += ` L ${x} ${yAtt}`;
        pathPower += ` L ${x} ${yPow}`;
      }
    });

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
        <!-- AXES -->
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />

        <!-- TICKS -->
        <text x="${pad}" y="${height - pad + 15}" fill="#5c7080" font-size="9">Mon</text>
        <text x="${pad + stepX * 12}" y="${height - pad + 15}" fill="#5c7080" font-size="9">Tue</text>
        <text x="${pad + stepX * 24}" y="${height - pad + 15}" fill="#5c7080" font-size="9">Wed</text>
        <text x="${pad + stepX * 36}" y="${height - pad + 15}" fill="#5c7080" font-size="9">Thu</text>
        <text x="${pad + stepX * 48}" y="${height - pad + 15}" fill="#5c7080" font-size="9">Fri</text>

        <!-- ATTENDANCE CURVE (CYAN) -->
        <path d="${pathAtt}" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.85" />

        <!-- POWER CURVE (AMBER) -->
        <path d="${pathPower}" fill="none" stroke="#ffb300" stroke-width="2" opacity="0.85" />
      </svg>
    `;
  }
}
