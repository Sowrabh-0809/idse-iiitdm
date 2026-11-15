import { generateMission1Dataset } from '../../data/mission1Dataset.js';
import { calculateMean, calculateMedian, calculateMode } from '../../utils/mathUtils.js';
import { soundManager } from '../../audio/soundManager.js';
import { Mission1ReportModal } from './Mission1ReportModal.js';

export class Mission1CorruptedRecords {
  constructor(containerEl, onReturnToMap, onNextMission) {
    this.container = containerEl;
    this.onReturnToMap = onReturnToMap;
    this.onNextMission = onNextMission;

    // Load fresh or saved dataset
    this.records = generateMission1Dataset();
    this.activeFilter = 'all'; // 'all' | 'anomalies' | 'duplicates' | 'missing' | 'outliers' | 'cleaned'
    this.searchQuery = '';
    this.inspectedRecord = null;

    // Initial statistics snapshot for before/after comparison
    const initialValid = this.records.map(r => r.attendance).filter(v => v !== null);
    this.initialStats = {
      mean: calculateMean(initialValid),
      median: calculateMedian(initialValid),
      mode: calculateMode(initialValid)
    };

    // Metrics for score calculation
    this.actionsHistory = {
      verifiedCount: 0,
      outliersFixed: 0,
      missingImputed: 0,
      duplicatesRemoved: 0,
      clueDiscovered: false
    };

    this.reportModal = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.reportModal = new Mission1ReportModal(
      this.container.querySelector('#report-modal-slot'),
      () => this.onReturnToMap(),
      () => this.onNextMission()
    );
  }

  unmount() {
    // cleanup
  }

  getValidAttendances() {
    return this.records
      .map(r => r.attendance)
      .filter(v => v !== null && !isNaN(v));
  }

  getLiveStats() {
    const valid = this.getValidAttendances();
    return {
      count: this.records.length,
      mean: calculateMean(valid),
      median: calculateMedian(valid),
      mode: calculateMode(valid),
      anomaliesRemaining: this.records.filter(r => !r.isCleaned).length
    };
  }

  render() {
    const stats = this.getLiveStats();

    this.container.innerHTML = `
      <div class="mission-terminal-container">
        <!-- TOP HUD BAR -->
        <header class="terminal-topbar">
          <div class="terminal-title-group">
            <span class="terminal-badge">AB-101 TERMINAL</span>
            <div class="terminal-heading">MISSION 01: THE CORRUPTED RECORDS</div>
          </div>
          <div class="terminal-actions-right">
            <button class="terminal-btn" id="btn-toggle-stats-panel" title="Toggle Stats & Distribution Panel">
              <span id="stats-panel-btn-text">📊 Hide Stats</span>
            </button>
            <button class="terminal-btn accent" id="btn-toggle-notebook-m1" title="Open Case Notebook">
              <span>📁 CASE NOTES</span>
            </button>
            <button class="terminal-btn" id="btn-exit-terminal">
              <span>✕ RETURN TO CAMPUS</span>
            </button>
            <button class="terminal-btn submit-report" id="btn-submit-audit" ${stats.anomaliesRemaining > 0 ? 'disabled' : ''}>
              <span>SUBMIT AUDIT REPORT (${stats.anomaliesRemaining === 0 ? 'READY' : `${stats.anomaliesRemaining} UNRESOLVED`})</span>
            </button>
          </div>
        </header>

        <!-- MAIN TERMINAL LAYOUT -->
        <div class="terminal-main-layout">
          <!-- STATS & INSIGHT OVERVIEW (TOP) -->
          <div class="terminal-stats-overview" id="terminal-stats-panel">
            <!-- 1. NUMERIC CARDS -->
            <div class="stats-card-metrics">
              <div class="metric-box">
                <span class="metric-label">MEAN ATTENDANCE</span>
                <span class="metric-value" id="stat-mean">${stats.mean.toFixed(1)}%</span>
                <span class="metric-sub" id="stat-mean-delta">Initial: ${this.initialStats.mean.toFixed(1)}%</span>
              </div>
              <div class="metric-box median-box">
                <span class="metric-label">MEDIAN ATTENDANCE</span>
                <span class="metric-value" id="stat-median">${stats.median}%</span>
                <span class="metric-sub">Robust midpoint</span>
              </div>
              <div class="metric-box mode-box">
                <span class="metric-label">MODE ATTENDANCE</span>
                <span class="metric-value" id="stat-mode">${stats.mode.slice(0, 2).join(', ')}%</span>
                <span class="metric-sub">Most frequent value</span>
              </div>
              <div class="metric-box anomalies-box">
                <span class="metric-label">ACTIVE ANOMALIES</span>
                <span class="metric-value" id="stat-anomalies">${stats.anomaliesRemaining}</span>
                <span class="metric-sub">Target: 0 remaining</span>
              </div>
            </div>

            <!-- 2. LIVE HISTOGRAM SVG CHART -->
            <div class="stats-card-histogram">
              <div class="histogram-header">
                <span class="histogram-title">ATTENDANCE DISTRIBUTION & SKEW (0% – 100%+)</span>
                <div class="histogram-legend">
                  <span><span class="legend-dot mean-dot"></span>Mean (${stats.mean.toFixed(1)}%)</span>
                  <span><span class="legend-dot median-dot"></span>Median (${stats.median}%)</span>
                  <span><span class="legend-dot outlier-dot"></span>Outlier Spike</span>
                </div>
              </div>
              <div class="histogram-canvas-wrapper" id="histogram-container">
                ${this.renderHistogramSvg(stats.mean, stats.median)}
              </div>
            </div>

            <!-- 3. EDUCATIONAL STATISTICAL INSIGHT -->
            <div class="stats-card-insight">
              <div class="insight-header">
                <span>💡</span>
                <span>DATA SCIENCE FORENSIC INSIGHT</span>
              </div>
              <div class="insight-body" id="insight-text">
                ${this.getDynamicInsightText(stats.mean, stats.median)}
              </div>
              <span class="insight-badge" id="insight-badge">
                ${stats.anomaliesRemaining > 0 ? 'STATUS: STATISTICALLY SKEWED' : 'STATUS: DATASET NORMALIZED'}
              </span>
            </div>
          </div>

          <!-- TOOLBAR: FILTERS & SEARCH -->
          <div class="terminal-toolbar">
            <div class="filter-tabs">
              <button class="tab-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
                All Records (${this.records.length})
              </button>
              <button class="tab-btn ${this.activeFilter === 'anomalies' ? 'active' : ''}" data-filter="anomalies">
                ⚠️ Suspect Anomalies (${this.records.filter(r => !r.isCleaned).length})
              </button>
              <button class="tab-btn ${this.activeFilter === 'outliers' ? 'active' : ''}" data-filter="outliers">
                Sensor Overflows (${this.records.filter(r => r.anomalyType === 'outlier' && !r.isCleaned).length})
              </button>
              <button class="tab-btn ${this.activeFilter === 'missing' ? 'active' : ''}" data-filter="missing">
                Missing Values (${this.records.filter(r => r.anomalyType === 'missing' && !r.isCleaned).length})
              </button>
              <button class="tab-btn ${this.activeFilter === 'duplicates' ? 'active' : ''}" data-filter="duplicates">
                Duplicate Syncs (${this.records.filter(r => r.anomalyType === 'duplicate').length})
              </button>
              <button class="tab-btn ${this.activeFilter === 'cleaned' ? 'active' : ''}" data-filter="cleaned">
                ✓ Verified Clean (${this.records.filter(r => r.isCleaned).length})
              </button>
            </div>

            <div class="search-group">
              <span class="search-icon">🔍</span>
              <input type="text" class="search-input" id="search-records-input" placeholder="Search Roll No or Student..." value="${this.searchQuery}" />
            </div>
          </div>

          <!-- 100 RECORDS TABLE -->
          <div class="terminal-table-container">
            <table class="records-table">
              <thead>
                <tr>
                  <th style="width: 110px;">ROLL NO</th>
                  <th>STUDENT NAME</th>
                  <th>COURSE</th>
                  <th style="width: 130px;">ATTENDANCE</th>
                  <th>SYNC HASH</th>
                  <th>TELEMETRY STATUS</th>
                  <th style="width: 280px; text-align: right;">DETECTIVE ACTIONS</th>
                </tr>
              </thead>
              <tbody id="records-tbody">
                ${this.renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>

        <!-- INSPECT RECORD MODAL SLOT -->
        <div class="inspect-modal-overlay hidden" id="inspect-modal-overlay"></div>

        <!-- REPORT MODAL SLOT -->
        <div id="report-modal-slot"></div>
      </div>
    `;
  }

  getFilteredRecords() {
    return this.records.filter((rec) => {
      // Filter tab
      if (this.activeFilter === 'anomalies' && rec.isCleaned) return false;
      if (this.activeFilter === 'outliers' && (rec.anomalyType !== 'outlier' || rec.isCleaned)) return false;
      if (this.activeFilter === 'missing' && (rec.anomalyType !== 'missing' || rec.isCleaned)) return false;
      if (this.activeFilter === 'duplicates' && rec.anomalyType !== 'duplicate') return false;
      if (this.activeFilter === 'cleaned' && !rec.isCleaned) return false;

      // Search query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchesRoll = rec.rollNo.toLowerCase().includes(q);
        const matchesName = rec.studentName.toLowerCase().includes(q);
        const matchesHash = rec.syncHash.toLowerCase().includes(q);
        return matchesRoll || matchesName || matchesHash;
      }

      return true;
    });
  }

  renderTableRows() {
    const list = this.getFilteredRecords();
    if (list.length === 0) {
      return `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-dim);">No student records match this filter.</td></tr>`;
    }

    return list.map((rec) => {
      let attBadge = '';
      if (rec.attendance === null) {
        attBadge = `<span class="attendance-badge missing">NULL (MISSING)</span>`;
      } else if (rec.attendance > 100 || rec.attendance < 0) {
        attBadge = `<span class="attendance-badge outlier">${rec.attendance}% (OUTLIER)</span>`;
      } else {
        attBadge = `<span class="attendance-badge normal">${rec.attendance}%</span>`;
      }

      const isClueHash = rec.syncHash === 'SYNC-CYCLE-492';
      const hashBadge = `<span class="hash-badge ${isClueHash ? 'clue-hash' : ''}">${rec.syncHash}</span>`;

      return `
        <tr class="${rec.isFlagged ? 'flagged' : ''} ${!rec.isCleaned ? 'anomaly-row' : ''}" data-id="${rec.id}">
          <td><strong>${rec.rollNo}</strong></td>
          <td>${rec.studentName}</td>
          <td><span style="color: var(--text-dim);">${rec.courseCode}</span> ${rec.courseName}</td>
          <td>${attBadge}</td>
          <td>${hashBadge}</td>
          <td><span style="color: ${!rec.isCleaned ? 'var(--accent-amber)' : 'var(--text-muted)'};">${rec.status}</span></td>
          <td style="text-align: right;">
            <div class="action-buttons-cell" style="justify-content: flex-end;">
              <button class="action-btn" data-action="inspect" data-id="${rec.id}" title="Inspect full telemetry">🔍 Inspect</button>
              <button class="action-btn ${rec.isFlagged ? 'flagged-btn' : ''}" data-action="flag" data-id="${rec.id}" title="Flag/unflag for review">🏷️</button>
              <button class="action-btn verify-btn" data-action="verify" data-id="${rec.id}" title="Cross-check physical biometric log">📡 Verify</button>
              ${!rec.isCleaned && rec.anomalyType !== 'duplicate' ? `
                <button class="action-btn fix-btn" data-action="fix" data-id="${rec.id}" title="Correct record with ground truth">✏️ Correct</button>
              ` : ''}
              ${rec.anomalyType === 'duplicate' ? `
                <button class="action-btn delete-btn" data-action="delete" data-id="${rec.id}" title="Delete duplicate record">🧹 Purge Clone</button>
              ` : `
                <button class="action-btn" data-action="delete" data-id="${rec.id}" title="Delete record" style="opacity: 0.4;">🗑️</button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderHistogramSvg(mean, median) {
    const valid = this.getValidAttendances();
    // Bins: 0-50, 50-60, 60-70, 70-80, 80-90, 90-100, >100 (Outliers)
    const bins = [
      { label: '<60', count: 0, isOutlier: false },
      { label: '60-70', count: 0, isOutlier: false },
      { label: '70-80', count: 0, isOutlier: false },
      { label: '80-90', count: 0, isOutlier: false },
      { label: '90-100', count: 0, isOutlier: false },
      { label: '>100 (Outlier)', count: 0, isOutlier: true }
    ];

    valid.forEach(v => {
      if (v < 60) bins[0].count++;
      else if (v < 70) bins[1].count++;
      else if (v < 80) bins[2].count++;
      else if (v < 90) bins[3].count++;
      else if (v <= 100) bins[4].count++;
      else bins[5].count++;
    });

    const maxCount = Math.max(...bins.map(b => b.count), 1);
    const width = 480;
    const height = 90;
    const barWidth = 55;
    const gap = 16;
    const offsetX = 24;

    const barsSvg = bins.map((bin, i) => {
      const barHeight = (bin.count / maxCount) * 60;
      const x = offsetX + i * (barWidth + gap);
      const y = height - 20 - barHeight;
      const fill = bin.isOutlier && bin.count > 0 ? '#ff5252' : '#00e5ff';
      const opacity = bin.count > 0 ? (bin.isOutlier ? '0.85' : '0.65') : '0.15';

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${fill}" opacity="${opacity}" rx="2" />
        <text x="${x + barWidth / 2}" y="${y - 4}" fill="#fff" font-size="9" font-family="'JetBrains Mono', monospace" text-anchor="middle">${bin.count}</text>
        <text x="${x + barWidth / 2}" y="${height - 6}" fill="#627588" font-size="8" font-family="'JetBrains Mono', monospace" text-anchor="middle">${bin.label}</text>
      `;
    }).join('');

    // Mean and Median indicator lines
    // Map 60-100% to x coordinates
    const scaleX = (val) => {
      const clamped = Math.max(50, Math.min(105, val));
      return offsetX + ((clamped - 50) / 55) * (bins.length * (barWidth + gap) - gap);
    };

    const meanX = scaleX(mean);
    const medianX = scaleX(median);

    return `
      <svg class="histogram-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <!-- BASELINE -->
        <line x1="10" y1="${height - 20}" x2="${width - 10}" y2="${height - 20}" stroke="#253545" stroke-width="1" />
        ${barsSvg}
        <!-- MEAN LINE (CYAN) -->
        <line x1="${meanX}" y1="10" x2="${meanX}" y2="${height - 20}" stroke="#00e5ff" stroke-width="2" stroke-dasharray="3 3" />
        <!-- MEDIAN LINE (AMBER) -->
        <line x1="${medianX}" y1="10" x2="${medianX}" y2="${height - 20}" stroke="#ffb300" stroke-width="2" />
      </svg>
    `;
  }

  getDynamicInsightText(mean, median) {
    const diff = Math.abs(mean - median);
    const remainingOutliers = this.records.filter(r => r.anomalyType === 'outlier' && !r.isCleaned).length;

    if (remainingOutliers > 0) {
      return `Notice how the <strong>Mean (${mean.toFixed(1)}%)</strong> is pulled away from the <strong>Median (${median}%)</strong> by extreme sensor values (like 450%). While the mean sums every value, the median only tracks the middle rank.`;
    } else if (this.records.some(r => r.anomalyType === 'duplicate')) {
      return `Sensor outliers resolved! Notice how the <strong>Mean stabilized down to ~81%</strong>, aligning closely with the Median. Now inspect the duplicate sync records sharing timestamp hash <strong>SYNC-CYCLE-492</strong>.`;
    } else {
      return `Excellent data hygiene! Both <strong>Mean (${mean.toFixed(1)}%)</strong> and <strong>Median (${median}%)</strong> are synchronized. All 100 student records reflect physical biometric ground truth.`;
    }
  }

  attachEvents() {
    // Return to map button
    const btnExit = this.container.querySelector('#btn-exit-terminal');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        soundManager.playClick();
        if (this.onReturnToMap) this.onReturnToMap();
      });
    }

    // Toggle Notebook button
    const btnNotebook = this.container.querySelector('#btn-toggle-notebook-m1');
    if (btnNotebook) {
      btnNotebook.addEventListener('click', () => {
        soundManager.playClick();
        window.dispatchEvent(new CustomEvent('toggle-notebook'));
      });
    }

    // Toggle Stats Panel button
    const btnToggleStats = this.container.querySelector('#btn-toggle-stats-panel');
    const statsOverview = this.container.querySelector('#terminal-stats-panel');
    if (btnToggleStats && statsOverview) {
      btnToggleStats.addEventListener('click', () => {
        soundManager.playClick();
        const isHidden = statsOverview.classList.toggle('hidden');
        const textSpan = btnToggleStats.querySelector('#stats-panel-btn-text');
        if (textSpan) {
          textSpan.textContent = isHidden ? '📊 Show Stats' : '📊 Hide Stats';
        }
      });
    }

    // Search filter input
    const searchInput = this.container.querySelector('#search-records-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.updateTableOnly();
      });
    }

    // Filter tab buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundManager.playClick();
        this.activeFilter = btn.dataset.filter;
        this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateTableOnly();
      });
    });

    // Delegate table action buttons
    const tbody = this.container.querySelector('#records-tbody');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        const recId = btn.dataset.id;
        this.handleRecordAction(action, recId);
      });
    }

    // Submit Audit button
    const btnSubmit = this.container.querySelector('#btn-submit-audit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        this.handleSubmitAudit();
      });
    }
  }

  handleRecordAction(action, recId) {
    const record = this.records.find(r => r.id === recId);
    if (!record) return;

    if (action === 'inspect') {
      soundManager.playClick();
      this.openInspectModal(record);
    } else if (action === 'flag') {
      soundManager.playClick();
      record.isFlagged = !record.isFlagged;
      this.updateTableOnly();
    } else if (action === 'verify') {
      soundManager.playTerminal();
      this.actionsHistory.verifiedCount++;
      alert(
        `[BIOMETRIC HARDWARE QUERY]\n\n` +
        `Student: ${record.studentName} (${record.rollNo})\n` +
        `Classroom Scanner: Melakottaiyur AB-101 Hardware Node\n\n` +
        `Ground Truth Verified Attendance: ${record.verifiedBiometric}%\n` +
        `Current Terminal Value: ${record.attendance !== null ? record.attendance + '%' : 'NULL'}\n\n` +
        `Audit Log Note: ${record.anomalyNote || 'Record matches physical biometric scanner.'}`
      );
    } else if (action === 'fix') {
      soundManager.playUnlock();
      record.attendance = record.verifiedBiometric;
      record.status = 'Verified & Restored';
      record.isCleaned = true;
      if (record.anomalyType === 'outlier') this.actionsHistory.outliersFixed++;
      if (record.anomalyType === 'missing') this.actionsHistory.missingImputed++;
      this.refreshFullView();
    } else if (action === 'delete') {
      if (record.anomalyType === 'duplicate') {
        soundManager.playClick();
        // Remove duplicate record
        this.records = this.records.filter(r => r.id !== recId);
        this.actionsHistory.duplicatesRemoved++;
        this.actionsHistory.clueDiscovered = true;
        alert(
          `[DUPLICATE SYNCHRONIZATION PURGED]\n\n` +
          `Successfully eliminated redundant clone for ${record.studentName}.\n\n` +
          `KEY CLUE DISCOVERED: This clone was generated by sync batch [SYNC-CYCLE-492]!\n` +
          `All anomalous clones share this identical cycle hash.`
        );
        this.refreshFullView();
      } else {
        soundManager.playError();
        alert(
          `[DATA INTEGRITY GUARD]\n\n` +
          `Cannot delete legitimate student record ${record.rollNo} (${record.studentName}).\n` +
          `Data cleaning rules require repairing or verifying corrupted attributes, not deleting actual registered students!`
        );
      }
    }
  }

  openInspectModal(record) {
    const overlay = this.container.querySelector('#inspect-modal-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="inspect-modal-card">
        <header class="modal-header">
          <h3>RAW TELEMETRY: ${record.rollNo}</h3>
          <button class="modal-close" id="btn-close-inspect">✕</button>
        </header>

        <div class="telemetry-grid">
          <div class="telemetry-item">
            <span class="telemetry-label">STUDENT NAME</span>
            <div class="telemetry-val">${record.studentName}</div>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">COURSE</span>
            <div class="telemetry-val">${record.courseCode}</div>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">RECORDED ATTENDANCE</span>
            <div class="telemetry-val" style="color: ${record.attendance > 100 || record.attendance < 0 ? 'var(--accent-red)' : 'var(--accent-cyan)'};">
              ${record.attendance !== null ? record.attendance + '%' : 'NULL'}
            </div>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">SYNC BATCH HASH</span>
            <div class="telemetry-val" style="color: var(--accent-amber);">${record.syncHash}</div>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">BATCH TIMESTAMP</span>
            <div class="telemetry-val">${record.timestamp}</div>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">INTEGRITY STATUS</span>
            <div class="telemetry-val">${record.status}</div>
          </div>
        </div>

        <div class="biometric-truth-box">
          <div>Classroom Biometric Ground Truth: <strong>${record.verifiedBiometric}% Attendance</strong></div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            ${record.anomalyNote || 'Telemetry consistent with physical classroom optical scanner.'}
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
          ${!record.isCleaned && record.anomalyType !== 'duplicate' ? `
            <button class="terminal-btn accent" id="btn-inspect-apply-fix">Apply Biometric Ground Truth</button>
          ` : ''}
          <button class="terminal-btn" id="btn-inspect-close">Done</button>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');

    const close = () => overlay.classList.add('hidden');
    overlay.querySelector('#btn-close-inspect').addEventListener('click', close);
    overlay.querySelector('#btn-inspect-close').addEventListener('click', close);

    const fixBtn = overlay.querySelector('#btn-inspect-apply-fix');
    if (fixBtn) {
      fixBtn.addEventListener('click', () => {
        close();
        this.handleRecordAction('fix', record.id);
      });
    }
  }

  updateTableOnly() {
    const tbody = this.container.querySelector('#records-tbody');
    if (tbody) {
      tbody.innerHTML = this.renderTableRows();
    }
  }

  refreshFullView() {
    const stats = this.getLiveStats();

    // Update stats cards
    const meanEl = this.container.querySelector('#stat-mean');
    const medianEl = this.container.querySelector('#stat-median');
    const modeEl = this.container.querySelector('#stat-mode');
    const anomEl = this.container.querySelector('#stat-anomalies');
    const submitBtn = this.container.querySelector('#btn-submit-audit');

    if (meanEl) meanEl.textContent = `${stats.mean.toFixed(1)}%`;
    if (medianEl) medianEl.textContent = `${stats.median}%`;
    if (modeEl) modeEl.textContent = `${stats.mode.slice(0, 2).join(', ')}%`;
    if (anomEl) anomEl.textContent = stats.anomaliesRemaining;

    // Update histogram
    const histEl = this.container.querySelector('#histogram-container');
    if (histEl) histEl.innerHTML = this.renderHistogramSvg(stats.mean, stats.median);

    // Update insight text
    const insightText = this.container.querySelector('#insight-text');
    const insightBadge = this.container.querySelector('#insight-badge');
    if (insightText) insightText.innerHTML = this.getDynamicInsightText(stats.mean, stats.median);
    if (insightBadge) {
      insightBadge.textContent = stats.anomaliesRemaining > 0 ? 'STATUS: STATISTICALLY SKEWED' : 'STATUS: DATASET NORMALIZED';
    }

    // Submit button state
    if (submitBtn) {
      submitBtn.disabled = stats.anomaliesRemaining > 0;
      submitBtn.querySelector('span').textContent = `SUBMIT AUDIT REPORT (${stats.anomaliesRemaining === 0 ? 'READY' : `${stats.anomaliesRemaining} UNRESOLVED`})`;
    }

    // Refresh tabs counts
    this.updateTabCounts();

    // Refresh table
    this.updateTableOnly();
  }

  updateTabCounts() {
    const allCount = this.records.length;
    const anomCount = this.records.filter(r => !r.isCleaned).length;
    const outlierCount = this.records.filter(r => r.anomalyType === 'outlier' && !r.isCleaned).length;
    const missingCount = this.records.filter(r => r.anomalyType === 'missing' && !r.isCleaned).length;
    const dupCount = this.records.filter(r => r.anomalyType === 'duplicate').length;
    const cleanCount = this.records.filter(r => r.isCleaned).length;

    const updateBtn = (filter, text) => {
      const btn = this.container.querySelector(`.tab-btn[data-filter="${filter}"]`);
      if (btn) btn.textContent = text;
    };

    updateBtn('all', `All Records (${allCount})`);
    updateBtn('anomalies', `⚠️ Suspect Anomalies (${anomCount})`);
    updateBtn('outliers', `Sensor Overflows (${outlierCount})`);
    updateBtn('missing', `Missing Values (${missingCount})`);
    updateBtn('duplicates', `Duplicate Syncs (${dupCount})`);
    updateBtn('cleaned', `✓ Verified Clean (${cleanCount})`);
  }

  handleSubmitAudit() {
    const stats = this.getLiveStats();
    if (stats.anomaliesRemaining > 0) {
      soundManager.playError();
      alert(`Cannot submit audit yet. ${stats.anomaliesRemaining} unverified anomalies remain.`);
      return;
    }

    // Calculate score (out of 100)
    let score = 20; // 20 pts for clue discovery
    score += Math.min(30, this.actionsHistory.verifiedCount * 5 + 10); // tool usage
    score += 30; // 30 pts for statistically sound decisions
    score += 20; // 20 pts for full completion
    score = Math.min(100, score);

    // Show report modal
    this.reportModal.show({
      score,
      initialMean: this.initialStats.mean,
      finalMean: stats.mean,
      initialMedian: this.initialStats.median,
      finalMedian: stats.median,
      duplicatesRemoved: this.actionsHistory.duplicatesRemoved,
      outliersFixed: this.actionsHistory.outliersFixed,
      missingImputed: this.actionsHistory.missingImputed
    });
  }
}
