import { gameState } from '../state/gameState.js';
import { soundManager } from '../audio/soundManager.js';
import confetti from 'canvas-confetti';

export class CampusEpilogueModal {
  constructor(containerEl, onCloseCallback) {
    this.container = containerEl;
    this.onCloseCallback = onCloseCallback;
    this.activeTab = 'restoration'; // 'restoration' | 'assembly' | 'certificate'
    this.isOpen = false;
    this.studentName = gameState.getState().detective.name || 'Analyst Cadet';
    this.studentRoll = gameState.getState().detective.badge || 'IDSE-2026-BTECH';
  }

  mount() {
    this.render();
  }

  show(tab = 'restoration') {
    this.activeTab = tab === 'dossier' ? 'certificate' : tab;
    this.isOpen = true;
    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 }
      });
    } catch (e) {
      // test safe
    }
    this.render();
  }

  hide() {
    this.isOpen = false;
    this.render();
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    soundManager.playClick();
    this.render();
  }

  printCertificate() {
    this.activeTab = 'certificate';
    this.render();
    setTimeout(() => {
      window.print();
    }, 150);
  }

  render() {
    if (!this.isOpen) {
      this.container.innerHTML = '';
      return;
    }

    const state = gameState.getState();
    const totalScore = gameState.getTotalScore();
    const completedCount = Object.values(state.missions).filter(m => m.isCompleted).length;

    this.container.innerHTML = `
      <div class="epilogue-overlay" id="epilogue-modal-overlay">
        <div class="epilogue-card">
          <!-- TOP HEADER -->
          <header class="epilogue-header">
            <div class="epilogue-title-group">
              <div class="epilogue-trophy-badge">🏆</div>
              <div>
                <h2 class="epilogue-main-title">CAMPUSSYNC EPILOGUE & FACULTY COMMENDATION</h2>
                <div class="epilogue-sub-title">IIITDM Kancheepuram • Data Forensics Commission • Incident Closed</div>
              </div>
            </div>
            <button class="epilogue-close-btn" id="btn-close-epilogue" title="Close Epilogue">✕</button>
          </header>

          <!-- NAVIGATION TABS -->
          <nav class="epilogue-tabs-bar">
            <button class="epilogue-tab-btn ${this.activeTab === 'restoration' ? 'active' : ''}" data-tab="restoration">
              <span>🖥️</span>
              <span>1. MAINFRAME RESTORATION</span>
            </button>
            <button class="epilogue-tab-btn ${this.activeTab === 'assembly' ? 'active' : ''}" data-tab="assembly">
              <span>👥</span>
              <span>2. NPC VICTORY ASSEMBLY</span>
            </button>
            <button class="epilogue-tab-btn cert-tab ${this.activeTab === 'certificate' ? 'active' : ''}" data-tab="certificate">
              <span>🎖️</span>
              <span>3. CERTIFICATE OF APPRECIATION</span>
            </button>
          </nav>

          <!-- TAB CONTENT BODY -->
          <div class="epilogue-body">
            ${this.renderActiveTabContent(state, totalScore, completedCount)}
          </div>

          <!-- FOOTER ACTIONS -->
          <footer class="epilogue-footer">
            <div class="epilogue-footer-left">
              <span>Detective: <strong>${this.studentName}</strong> (${this.studentRoll})</span>
              <span>• Rank: <strong style="color: var(--accent-green);">${state.detective.rank}</strong></span>
            </div>
            <div class="epilogue-footer-right">
              ${this.activeTab === 'certificate' ? `
                <button class="terminal-btn accent" id="btn-print-certificate" style="background: linear-gradient(135deg, #b8860b, #d4af37); border-color: #d4af37; color: #000; font-weight: 700;">
                  <span>🖨️ PRINT / SAVE CERTIFICATE (PDF)</span>
                </button>
              ` : `
                <button class="terminal-btn accent" id="btn-goto-certificate">
                  <span>VIEW CERTIFICATE OF APPRECIATION ➔</span>
                </button>
              `}
              <button class="terminal-btn" id="btn-return-map-epilogue">
                <span>CAMPUS MAP</span>
              </button>
            </div>
          </footer>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderActiveTabContent(state, totalScore, completedCount) {
    if (this.activeTab === 'restoration') {
      return this.renderRestorationTab(totalScore, completedCount);
    } else if (this.activeTab === 'assembly') {
      return this.renderAssemblyTab();
    } else if (this.activeTab === 'certificate') {
      return this.renderCertificateTab(state, totalScore);
    }
    return '';
  }

  renderRestorationTab(totalScore, completedCount) {
    return `
      <div class="epilogue-tab-content">
        <!-- MAINFRAME BANNER -->
        <div class="restoration-banner">
          <div class="restoration-banner-left">
            <span class="banner-pulse-dot"></span>
            <div>
              <div class="banner-title">CENTRAL CAMPUSSYNC STATUS: 100% OPERATIONAL & SECURE</div>
              <div class="banner-desc">Temporal synchronization cron job SYNC-CYCLE-492 neutralized. All cross-campus telemetry re-aligned.</div>
            </div>
          </div>
          <div class="banner-badge-score">
            <span>AUDIT SCORE: <strong>${totalScore} / 500 PTS</strong></span>
          </div>
        </div>

        <!-- SECTOR FORENSIC RECOVERY CARDS (ACROSS STRICTLY 4 PLAYABLE HUBS + CENTRAL ADMIN) -->
        <div class="sector-restoration-grid">
          <!-- Sector 1 -->
          <div class="sector-status-card">
            <div class="sector-card-top">
              <span class="sector-name">SECTOR 1: ACADEMIC COMPLEX [AB-101]</span>
              <span class="sector-badge">RESOLVED</span>
            </div>
            <div class="sector-mission-title">Mission 1: The Corrupted Records</div>
            <div class="sector-metric-row">
              <div class="metric-pre">PRE-AUDIT: Mean = 85.4% | Outlier Skew: High (+4 clones)</div>
              <div class="metric-post">POST-AUDIT: Mean = 81.3% | Median = 80.0% (Reconciled)</div>
            </div>
            <p class="sector-resolution-desc">
              Demonstrated median resilience against rogue 100% duplicate entries. Repaired student biometric logs and purged clone hashes.
            </p>
          </div>

          <!-- Sector 2 -->
          <div class="sector-status-card">
            <div class="sector-card-top">
              <span class="sector-name">SECTOR 2: COMPUTATIONAL LAB [AB-LAB]</span>
              <span class="sector-badge">RESOLVED</span>
            </div>
            <div class="sector-mission-title">Mission 2: The Hidden Pattern</div>
            <div class="sector-metric-row">
              <div class="metric-pre">PRE-AUDIT: Spurious Correlation r = 0.88 (0h offset)</div>
              <div class="metric-post">POST-AUDIT: Calibrated r = 0.12 (+48h lag identified)</div>
            </div>
            <p class="sector-resolution-desc">
              Dual-axis time-series alignment disproved false correlation-as-causation. True load traced to air conditioning compressors.
            </p>
          </div>

          <!-- Sector 3 -->
          <div class="sector-status-card">
            <div class="sector-card-top">
              <span class="sector-name">SECTOR 3: ARJUNA SPORTS COMPLEX [ASC]</span>
              <span class="sector-badge">RESOLVED</span>
            </div>
            <div class="sector-mission-title">Mission 3: Predict the Champion</div>
            <div class="sector-metric-row">
              <div class="metric-pre">PRE-AUDIT: MAE = 4.12s | High Regression Residuals</div>
              <div class="metric-post">POST-AUDIT: MAE = 0.38s | y = -0.42x + 15.8 (Fit)</div>
            </div>
            <p class="sector-resolution-desc">
              Quarantined contaminated off-season athletic batch. Minimized residual drop lines and restored accurate varsity sprint selections.
            </p>
          </div>

          <!-- Sector 4 -->
          <div class="sector-status-card">
            <div class="sector-card-top">
              <span class="sector-name">SECTOR 4: PARKING AREA [PKG-MAIN]</span>
              <span class="sector-badge">RESOLVED</span>
            </div>
            <div class="sector-mission-title">Mission 4: The Parking Pattern</div>
            <div class="sector-metric-row">
              <div class="metric-pre">PRE-AUDIT: 98% False Alarm Surge | RFID Double-Pulsing</div>
              <div class="metric-post">POST-AUDIT: P(Surge) = 0.42 (Monte Carlo N=1,000 Matched)</div>
            </div>
            <p class="sector-resolution-desc">
              Implemented 1500ms sensor debounce filter. Validated empirical vehicle arrivals against theoretical binomial distribution.
            </p>
          </div>

          <!-- Sector 5 -->
          <div class="sector-status-card" style="grid-column: 1 / -1; border-color: var(--accent-green);">
            <div class="sector-card-top">
              <span class="sector-name">SECTOR 5: CENTRAL ADMINISTRATION BLOCK [ADM-CENTRAL]</span>
              <span class="sector-badge" style="background: rgba(0, 230, 118, 0.25); color: #fff;">ROOT CAUSE ELIMINATED</span>
            </div>
            <div class="sector-mission-title">Mission 5: The Final Verdict</div>
            <div class="sector-metric-row">
              <div class="metric-pre">PRE-AUDIT: Multi-department database drift & unhandled async cron retry</div>
              <div class="metric-post">POST-AUDIT: Classifier Tuned (θ = 0.50, Acc = 94.2%, Prec = 92.3%, Rec = 88.9%)</div>
            </div>
            <p class="sector-resolution-desc">
              Synthesized clues across all 4 sectors. Constructed inductive decision tree and permanently isolated rogue script <strong>SYNC-CYCLE-492</strong>.
            </p>
          </div>
        </div>

        <!-- LIVE TELEMETRY CONSOLE STREAM -->
        <div class="system-console-wrapper">
          <div class="console-title">
            <span>⚡</span>
            <span>CAMPUSSYNC DIAGNOSTIC TELEMETRY LOG</span>
          </div>
          <div class="console-lines">
            <div>[00:00:01] INITIATING CENTRAL HEALTH CHECK ACROSS IIITDM KANCHEEPURAM NODES...</div>
            <div class="console-line-green">[00:00:02] NODE AB-101 (Academic Block): Attendance checksum verified. 0 outliers remaining.</div>
            <div class="console-line-green">[00:00:03] NODE AB-LAB (Computational Lab): Phase delay +48h mapped. Sensor baseline stable.</div>
            <div class="console-line-green">[00:00:04] NODE ASC-SPORTS (Arjuna Sports): OLS model residuals within ±0.45s tolerance.</div>
            <div class="console-line-green">[00:00:05] NODE PKG-MAIN (Lot P-29 Gate): RFID debounce active (1500ms). Queue depth: Normal.</div>
            <div class="console-line-green">[00:00:06] CENTRAL MAINFRAME: Cron batch SYNC-CYCLE-492 quarantined to /var/quarantine/cron.</div>
            <div style="color: var(--accent-cyan); margin-top: 4px;">✔ SYSTEM STATUS: GREEN. ALL DATA INTEGRITY ASSURANCES CERTIFIED.</div>
          </div>
        </div>
      </div>
    `;
  }

  renderAssemblyTab() {
    return `
      <div class="epilogue-tab-content">
        <div class="npc-assembly-intro">
          <strong>The IIITDM Campus Assembly:</strong> Following the successful diagnosis of CampusSync, the institute faculty, sports directors, security heads, and system administrators gathered to commend your data-driven methodology.
        </div>

        <div class="npc-dialogue-stack">
          <!-- NPC 1: Dr. Sundaram -->
          <div class="npc-dialogue-card">
            <div class="npc-avatar-box">👨‍🏫</div>
            <div class="npc-dialogue-main">
              <div class="npc-header-row">
                <span class="npc-name">Dr. Sundaram</span>
                <span class="npc-role">Academic Registrar • Academic Complex (AB-101)</span>
              </div>
              <p class="npc-quote">
                “Detective, you averted a bureaucratic crisis. When the corrupted attendance records arrived with severe outliers and duplicated 100% figures, our automated senate scripts nearly debarred several innocent students. Your empirical demonstration of median robustness and swift purge of clone hashes restored mathematical fairness to our academic portal.”
              </p>
              <span class="npc-forensic-takeaway">Forensic Insight: Median maintains 50% breakdown point against extreme outliers.</span>
            </div>
          </div>

          <!-- NPC 2: Priya -->
          <div class="npc-dialogue-card">
            <div class="npc-avatar-box">👩‍💻</div>
            <div class="npc-dialogue-main">
              <div class="npc-header-row">
                <span class="npc-name">Priya</span>
                <span class="npc-role">Computational Lab Coordinator • Academic Lab Terminal</span>
              </div>
              <p class="npc-quote">
                “Our research lab was on the verge of slashing student computing access! The preliminary report showed a strong correlation (r = 0.88) between student attendance and power surges. Your temporal shift analysis proved that correlation does not imply causation — the true spike was an offset air-conditioning chiller cycle. Brilliant analytical rigor!”
              </p>
              <span class="npc-forensic-takeaway">Forensic Insight: Correlation ≠ Causation; time-lagged cross-correlation unmasks spurious relationships.</span>
            </div>
          </div>

          <!-- NPC 3: Coach Raghu -->
          <div class="npc-dialogue-card">
            <div class="npc-avatar-box">🏃‍♂️</div>
            <div class="npc-dialogue-main">
              <div class="npc-header-row">
                <span class="npc-name">Coach Raghu</span>
                <span class="npc-role">Head of Physical Education • Arjuna Sports Complex (ASC)</span>
              </div>
              <p class="npc-quote">
                “The Inter-IIIT athletic trials were in disarray. The regression predictor had an MAE of over 4 seconds, predicting impossible 100m sprint times for our varsity team. You inspected the residual drop lines, caught the contaminated off-season training batch, and calibrated the line to an MAE of 0.38 seconds. Our true champions are headed to the podium!”
              </p>
              <span class="npc-forensic-takeaway">Forensic Insight: Residual analysis (e = y - ŷ) isolates contaminated sub-populations in OLS models.</span>
            </div>
          </div>

          <!-- NPC 4: Inspector Murugan -->
          <div class="npc-dialogue-card">
            <div class="npc-avatar-box">👮‍♂️</div>
            <div class="npc-dialogue-main">
              <div class="npc-header-row">
                <span class="npc-name">Inspector Murugan</span>
                <span class="npc-role">Chief of Campus Security • Main Gate & Parking (PKG-MAIN)</span>
              </div>
              <p class="npc-quote">
                “My security team was overwhelmed by constant 98% occupancy alarms at Lot P-29. We almost blocked campus visitor access! Your Monte Carlo simulation of arrival probabilities proved our real influx was completely within theoretical binomial bounds. Pinpointing the RFID sensor bounce saved the institute tens of thousands in needless barrier gate replacements.”
              </p>
              <span class="npc-forensic-takeaway">Forensic Insight: Monte Carlo trials and binomial modeling expose hardware pulse debounce defects.</span>
            </div>
          </div>

          <!-- NPC 5: Karthik -->
          <div class="npc-dialogue-card">
            <div class="npc-avatar-box">👨‍💻</div>
            <div class="npc-dialogue-main">
              <div class="npc-header-row">
                <span class="npc-name">Karthik</span>
                <span class="npc-role">CampusSync Infrastructure Admin • Administration Block (ADM)</span>
              </div>
              <p class="npc-quote">
                “You connected the evidence from all four campus sectors and proved that these weren't five separate gremlins, but one cascading synchronization failure: cron job SYNC-CYCLE-492. By tuning our diagnostic classifier threshold and constructing the decision tree, you restored data integrity to the entire institute without losing a single valid student record!”
              </p>
              <span class="npc-forensic-takeaway">Forensic Insight: Supervised classification thresholds and decision trees resolve complex multi-system telemetry failures.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCertificateTab(state, totalScore) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const certId = `IIITDM-APPR-2026-${totalScore || 500}`;

    return `
      <div class="epilogue-tab-content active-certificate-print">
        
        <!-- TOP CUSTOMIZER BAR (SCREEN ONLY) -->
        <div class="cert-customizer-bar no-print">
          <div class="customizer-title">
            <span>✏️</span>
            <span>CUSTOMIZE CERTIFICATE RECIPIENT:</span>
          </div>
          <div class="customizer-inputs">
            <input type="text" class="cert-input-field" id="input-cert-name" value="${this.studentName}" placeholder="Enter Recipient / Student Name" />
            <input type="text" class="cert-input-field" id="input-cert-roll" value="${this.studentRoll}" placeholder="Enter Roll Number / Badge ID" />
          </div>
        </div>

        <!-- OFFICIAL CERTIFICATE DOCUMENT -->
        <div class="certificate-document" id="printable-certificate-card">
          <div class="certificate-frame">
            
            <!-- HEADER -->
            <div class="cert-header">
              <div class="cert-crest">🏛️</div>
              <div class="cert-inst-name">INDIAN INSTITUTE OF INFORMATION TECHNOLOGY, DESIGN AND MANUFACTURING, KANCHEEPURAM</div>
              <div class="cert-inst-sub">(An Institute of National Importance established by the Ministry of Education, Government of India)</div>
              <div class="cert-dept">CENTRAL CAMPUSSYNC SYSTEMS & DATA SCIENCE COMMENDATION COUNCIL</div>
            </div>

            <!-- TITLE BLOCK -->
            <div class="cert-title-block">
              <div class="cert-badge-strip">★ SPECIAL FACULTY COMMENDATION ★</div>
              <h1 class="cert-main-heading">CERTIFICATE OF APPRECIATION</h1>
              <div class="cert-sub-heading">FOR EXEMPLARY FORENSIC DATA SCIENCE & TELEMETRY RESOLUTION</div>
            </div>

            <!-- RECIPIENT BLOCK -->
            <div class="cert-recipient-block">
              <div class="cert-presented-text">This Certificate of Appreciation is proudly conferred upon</div>
              <div class="cert-recipient-name" id="display-cert-name">${this.studentName}</div>
              <div class="cert-recipient-badge">ROLL / IDENTIFIER: <span id="display-cert-roll">${this.studentRoll}</span></div>
            </div>

            <!-- FACULTY SATISFACTION STATEMENT -->
            <div class="cert-satisfaction-callout">
              ✔ <strong>FACULTY COMMENDATION CITATION:</strong> The Faculty, Department of Data Science & Engineering, and Institute Administration of IIITDM Kancheepuram express their highest satisfaction with the investigator's exceptional scientific rigor, statistical acuity, and analytical persistence in diagnosing and completely resolving the central CampusSync telemetry failure across all four campus sectors.
            </div>

            <!-- FORENSIC CITATION BODY -->
            <div class="cert-body-citation">
              In recognition of demonstrated proficiency across key data science disciplines, restoring complete mathematical and operational integrity to the institute:
            </div>

            <!-- ACCOMPLISHMENTS GRID -->
            <div class="cert-accomplishments-grid">
              <div class="cert-acc-item">
                <strong>1. Academic Records Integrity:</strong>
                Reconciled attendance distribution by proving Median robustness against gross outliers and purging duplicate synchronization hashes.
              </div>
              <div class="cert-acc-item">
                <strong>2. Computing Lab Telemetry:</strong>
                Identified a 48-hour temporal phase shift in lab power logs, definitively refuting spurious correlation-as-causation claims.
              </div>
              <div class="cert-acc-item">
                <strong>3. Athletic Model Calibration:</strong>
                Quarantined contaminated off-season sprint batches, minimizing regression residuals and optimizing athlete selection models.
              </div>
              <div class="cert-acc-item">
                <strong>4. Security Sensor Debiasing:</strong>
                Debounced gate barrier RFID pulses and empirically validated vehicular arrival probabilities against theoretical binomial limits.
              </div>
            </div>

            <!-- SIGNATURES & GOLD MEDALLION STRIP -->
            <div class="cert-sign-strip">
              <!-- Signatory 1 -->
              <div class="cert-sig-box">
                <div class="cert-sig-line">Dr. Sundaram</div>
                <div class="cert-sig-title">Academic Registrar & Dean</div>
                <div style="font-size: 9.5px; color: #a0aec0;">Academic Affairs, IIITDM</div>
              </div>

              <!-- Center Gold Medallion -->
              <div class="cert-gold-seal">
                <span class="seal-icon">★</span>
                <span class="seal-text-top">IIITDM</span>
                <span class="seal-text-main">SEAL OF MERIT</span>
                <span class="seal-text-sub">EXCELLENCE</span>
              </div>

              <!-- Signatory 2 -->
              <div class="cert-sig-box">
                <div class="cert-sig-line">Prof. K. Ramesh</div>
                <div class="cert-sig-title">Head of Department</div>
                <div style="font-size: 9.5px; color: #a0aec0;">Data Science & Engineering</div>
              </div>

              <!-- Signatory 3 -->
              <div class="cert-sig-box">
                <div class="cert-sig-line">Karthik S.</div>
                <div class="cert-sig-title">Chief Systems Admin</div>
                <div style="font-size: 9.5px; color: #a0aec0;">Campus Information Network</div>
              </div>
            </div>

            <!-- VERIFICATION METADATA FOOTER -->
            <div class="cert-verify-strip">
              <div>Certificate ID: <strong>${certId}</strong></div>
              <div>Distinction: <strong style="color: #276749;">Grade S (Outstanding • ${totalScore}/500 PTS)</strong></div>
              <div>Issued at: <strong>IIITDM Kancheepuram • ${today}</strong></div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // Close button
    const closeBtn = this.container.querySelector('#btn-close-epilogue');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Return to map button in footer
    const returnMapBtn = this.container.querySelector('#btn-return-map-epilogue');
    if (returnMapBtn) {
      returnMapBtn.addEventListener('click', () => this.hide());
    }

    // Tabs switching
    const tabBtns = this.container.querySelectorAll('.epilogue-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Go to certificate button from other tabs
    const gotoCertBtn = this.container.querySelector('#btn-goto-certificate');
    if (gotoCertBtn) {
      gotoCertBtn.addEventListener('click', () => this.switchTab('certificate'));
    }

    // Print certificate button
    const printBtn = this.container.querySelector('#btn-print-certificate');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printCertificate());
    }

    // Live binding for editable recipient fields
    const inputName = this.container.querySelector('#input-cert-name');
    if (inputName) {
      inputName.addEventListener('input', (e) => {
        this.studentName = e.target.value.trim() || 'Analyst Cadet';
        gameState.getState().detective.name = this.studentName;
        gameState.saveToStorage();
        const displayName = this.container.querySelector('#display-cert-name');
        if (displayName) displayName.textContent = this.studentName;
      });
    }

    const inputRoll = this.container.querySelector('#input-cert-roll');
    if (inputRoll) {
      inputRoll.addEventListener('input', (e) => {
        this.studentRoll = e.target.value.trim() || 'IDSE-2026-BTECH';
        gameState.getState().detective.badge = this.studentRoll;
        gameState.saveToStorage();
        const displayRoll = this.container.querySelector('#display-cert-roll');
        if (displayRoll) displayRoll.textContent = this.studentRoll;
      });
    }
  }
}
