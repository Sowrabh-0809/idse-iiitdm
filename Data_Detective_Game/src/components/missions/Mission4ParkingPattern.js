import { generateMission4Dataset } from '../../data/mission4Dataset.js';
import { soundManager } from '../../audio/soundManager.js';
import { Mission4ReportModal } from './Mission4ReportModal.js';

export class Mission4ParkingPattern {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;

    this.dataset = generateMission4Dataset();
    this.trialCount = 500;
    this.isDebounceActive = false;

    // Simulation results
    this.runSimulation();

    this.reportModal = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.reportModal = new Mission4ReportModal(
      this.container.querySelector('#report-modal-slot-m4'),
      () => this.onReturnToMap(),
      () => this.onNextMission()
    );
  }

  unmount() {
    // cleanup
  }

  runSimulation() {
    const { lotCapacity, trueP } = this.dataset;
    let totalArrivals = 0;

    // Monte Carlo simulation using random Bernoulli trials
    for (let t = 0; t < this.trialCount; t++) {
      let activeCars = 0;
      for (let slot = 0; slot < lotCapacity; slot++) {
        let prob = trueP;
        if (!this.isDebounceActive) {
          // Double pulse sensor defect roughly doubles reported occupancy
          prob = Math.min(0.95, trueP * 2.05);
        }
        if (Math.random() < prob) {
          activeCars++;
        }
      }
      totalArrivals += activeCars;
    }

    this.meanOccupancy = Math.round(totalArrivals / this.trialCount);
    this.occupancyPercent = Math.round((this.meanOccupancy / lotCapacity) * 100);
  }

  render() {
    const { lotCapacity } = this.dataset;
    const isFixed = this.isDebounceActive;

    this.container.innerHTML = `
      <div class="mission-terminal-container">
        <!-- TOP HUD BAR -->
        <header class="terminal-topbar">
          <div class="terminal-title-group">
            <span class="terminal-badge" style="border-color: #ffea00; color: #ffea00;">PKG-MAIN SECURITY TERMINAL</span>
            <div class="terminal-heading">MISSION 04: THE PARKING PATTERN (PROBABILITY & MONTE CARLO)</div>
          </div>
          <div class="terminal-actions-right">
            <button class="terminal-btn accent" id="btn-toggle-notebook-m4" title="Open Case Notebook">
              <span>📁 CASE NOTES</span>
            </button>
            <button class="terminal-btn" id="btn-exit-terminal-m4">
              <span>✕ RETURN TO CAMPUS</span>
            </button>
            <button class="terminal-btn submit-report" id="btn-submit-m4" ${!isFixed ? 'disabled' : ''}>
              <span>SUBMIT SENSOR AUDIT (${this.occupancyPercent}% OCCUPANCY)</span>
            </button>
          </div>
        </header>

        <!-- MAIN TERMINAL CONTENT -->
        <div class="terminal-main-layout" style="overflow-y: auto; padding: 20px;">
          <!-- MONTE CARLO TRIAL BAR -->
          <div class="monte-carlo-bar">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-family: var(--font-mono); font-size: 12px; color: #ffea00; font-weight: 600;">🎲 MONTE CARLO TRIALS:</span>
              <div class="trial-buttons-group">
                <button class="trial-btn ${this.trialCount === 50 ? 'active' : ''}" data-trials="50">50 Trials</button>
                <button class="trial-btn ${this.trialCount === 500 ? 'active' : ''}" data-trials="500">500 Trials</button>
                <button class="trial-btn ${this.trialCount === 2500 ? 'active' : ''}" data-trials="2500">2,500 Trials</button>
              </div>
            </div>

            <!-- DEBOUNCE FILTER TOGGLE -->
            <button class="debounce-toggle-btn ${this.isDebounceActive ? 'active' : ''}" id="btn-toggle-debounce">
              <span>${this.isDebounceActive ? '✓ DEBOUNCE FILTER ACTIVE (<500ms)' : '⚙️ APPLY SENSOR DEBOUNCE FILTER'}</span>
            </button>

            <!-- LIVE OCCUPANCY DISPLAY -->
            <div style="font-family: var(--font-mono); font-size: 13px;">
              <span>OCCUPANCY: </span>
              <strong style="color: ${this.occupancyPercent > 75 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size: 18px;">
                ${this.meanOccupancy} / ${lotCapacity} (${this.occupancyPercent}%)
              </strong>
            </div>
          </div>

          <!-- DASHBOARD GRID: VISUAL LOT & THEORETICAL PROBABILITY -->
          <div class="m4-dashboard-grid">
            <!-- 1. LIVE PARKING GRID & GATE STATUS -->
            <div class="m4-card">
              <div class="m4-card-header">
                <span class="m4-card-title">🚗 LOT P-29 SENSOR SIMULATION (120 BAYS)</span>
                <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                  Theoretical p = 0.32
                </span>
              </div>
              <div class="parking-lot-grid">
                ${Array.from({ length: 120 }).map((_, i) => {
                  const isOcc = i < this.meanOccupancy;
                  return `<div class="parking-slot-indicator ${isOcc ? 'occupied' : ''}" title="Bay ${i + 1}: ${isOcc ? 'Occupied' : 'Vacant'}"></div>`;
                }).join('')}
              </div>
              <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">
                <span>■ Green: Vacant Bay</span>
                <span>■ Red: Sensor-Reported Occupied</span>
              </div>
            </div>

            <!-- 2. THEORETICAL VS EXPERIMENTAL PROBABILITY SVG -->
            <div class="m4-card">
              <div class="m4-card-header">
                <span class="m4-card-title">📊 PROBABILITY DENSITY: THEORETICAL VS. EXPERIMENTAL</span>
                <div style="font-size: 11px; display: flex; gap: 10px; font-family: var(--font-mono);">
                  <span style="color: var(--accent-cyan);">● Theoretical (p=0.32)</span>
                  <span style="color: ${this.isDebounceActive ? 'var(--accent-green)' : 'var(--accent-red)'};">● Experimental</span>
                </div>
              </div>
              <div style="width: 100%; height: 200px;">
                ${this.renderProbabilitySvg()}
              </div>
            </div>
          </div>

          <!-- RECENT GATE LOGS TABLE -->
          <div class="m4-card" style="margin-top: 16px;">
            <div class="m4-card-header">
              <span class="m4-card-title">📡 RFID BARRIER TELEMETRY LOGS (GATE B)</span>
              <span style="font-size: 11px; color: #ffea00; font-family: var(--font-mono);">
                Inspect Consecutive Rapid Pulses (< 500ms)
              </span>
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              <table class="records-table" style="font-size: 12px; width: 100%;">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Timestamp</th>
                    <th>RFID Tag</th>
                    <th>Vehicle</th>
                    <th>Pulse Interval</th>
                    <th>Telemetry Diagnostic</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.dataset.logs.map(log => {
                    const isFiltered = this.isDebounceActive && log.isDoublePulse;
                    return `
                      <tr class="${log.isDoublePulse ? 'anomaly-row' : ''}" style="${isFiltered ? 'opacity: 0.35; text-decoration: line-through;' : ''}">
                        <td><strong>${log.eventId}</strong></td>
                        <td>${log.timeStr}</td>
                        <td><span class="hash-badge">${log.tagId}</span></td>
                        <td>${log.vehicleType}</td>
                        <td><span style="color: ${log.isDoublePulse ? 'var(--accent-red)' : 'var(--text-muted)'}; font-family: var(--font-mono);">${log.pulseIntervalMs} ms</span></td>
                        <td>${log.isDoublePulse ? `<span style="color: var(--accent-red); font-weight: 600;">⚠️ DOUBLE-COUNT RETRY LOOP</span>` : '<span style="color: var(--accent-green);">Valid Entry</span>'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- REPORT MODAL SLOT -->
        <div id="report-modal-slot-m4"></div>
      </div>
    `;
  }

  attachEvents() {
    this.container.querySelector('#btn-exit-terminal-m4').addEventListener('click', () => {
      soundManager.playClick();
      this.onReturnToMap();
    });

    this.container.querySelector('#btn-toggle-notebook-m4').addEventListener('click', () => {
      soundManager.playClick();
      window.dispatchEvent(new CustomEvent('toggle-notebook'));
    });

    // Trials buttons
    this.container.querySelectorAll('.trial-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        soundManager.playClick();
        this.trialCount = parseInt(e.target.dataset.trials, 10);
        this.runSimulation();
        this.render();
        this.attachEvents();
      });
    });

    // Debounce toggle
    const debounceBtn = this.container.querySelector('#btn-toggle-debounce');
    if (debounceBtn) {
      debounceBtn.addEventListener('click', () => {
        soundManager.playUnlock();
        this.isDebounceActive = !this.isDebounceActive;
        this.runSimulation();
        this.render();
        this.attachEvents();
      });
    }

    // Submit audit
    const submitBtn = this.container.querySelector('#btn-submit-m4');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const { lotCapacity, trueP } = this.dataset;
        const faultyP = Math.min(0.95, trueP * 2.05);
        this.reportModal.show({
          score: 100,
          rawOccupancy: Math.round(faultyP * 100),
          theoreticalOccupancy: Math.round(trueP * 100),
          expectedVehicles: (lotCapacity * trueP).toFixed(1),
          filteredOccupancy: this.occupancyPercent
        });
      });
    }
  }

  renderProbabilitySvg() {
    const width = 460;
    const height = 180;
    const pad = 30;

    // Theoretical binomial mean: E(X) = n × p
    const { lotCapacity, trueP } = this.dataset;
    const theoreticalOccupancy = lotCapacity * trueP;
    const theoMeanX = pad + (theoreticalOccupancy / lotCapacity) * (width - pad * 2);
    const expMeanX = pad + (this.meanOccupancy / lotCapacity) * (width - pad * 2);

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
        <!-- AXES -->
        <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#253545" stroke-width="1.5" />

        <!-- LABELS -->
        <text x="${width / 2}" y="${height - 6}" fill="#8ca0b3" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">Occupied Vehicles (0 to 120 slots)</text>
        
        <!-- TICKS -->
        <text x="${pad}" y="${height - pad + 14}" fill="#5c7080" font-size="8">0</text>
        <text x="${pad + (width - pad * 2) * 0.5}" y="${height - pad + 14}" fill="#5c7080" font-size="8">60</text>
        <text x="${width - pad}" y="${height - pad + 14}" fill="#5c7080" font-size="8">120 (Max)</text>

        <!-- THEORETICAL CURVE (CYAN) -->
        <path d="M ${theoMeanX - 70} ${height - pad} Q ${theoMeanX} ${pad + 20} ${theoMeanX + 70} ${height - pad}" fill="rgba(0, 229, 255, 0.15)" stroke="#00e5ff" stroke-width="2" />
        <line x1="${theoMeanX}" y1="${pad + 15}" x2="${theoMeanX}" y2="${height - pad}" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="3 3" />
        <text x="${theoMeanX}" y="${pad + 10}" fill="#00e5ff" font-size="9" text-anchor="middle">Expected (${theoreticalOccupancy.toFixed(1)})</text>

        <!-- EXPERIMENTAL CURVE -->
        <path d="M ${expMeanX - 60} ${height - pad} Q ${expMeanX} ${pad + 40} ${expMeanX + 60} ${height - pad}" fill="${this.isDebounceActive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)'}" stroke="${this.isDebounceActive ? '#00e676' : '#ff5252'}" stroke-width="2" />
        <line x1="${expMeanX}" y1="${pad + 35}" x2="${expMeanX}" y2="${height - pad}" stroke="${this.isDebounceActive ? '#00e676' : '#ff5252'}" stroke-width="1.5" />
        <text x="${expMeanX}" y="${pad + 30}" fill="${this.isDebounceActive ? '#00e676' : '#ff5252'}" font-size="9" text-anchor="middle">Observed (${this.meanOccupancy})</text>
      </svg>
    `;
  }
}
