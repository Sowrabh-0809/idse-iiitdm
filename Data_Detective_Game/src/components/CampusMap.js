import { CAMPUS_LOCATIONS, MISSIONS_DATA } from '../state/clues.js';
import { gameState } from '../state/gameState.js';
import { soundManager } from '../audio/soundManager.js';
import campusMapImg from '../assets/campus_map_illustrated.jpg';

export class CampusMap {
  constructor(containerEl, onSelectMission) {
    this.container = containerEl;
    this.onSelectMission = onSelectMission;
    this.selectedBuildingId = null;
    this.isMovingDetective = false;
    this.mapMode = 'illustrated'; // 'illustrated' (default from user image) | 'blueprint'
    this.unsubscribe = null;
  }

  mount() {
    this.render();
    this.attachEvents();
    this.unsubscribe = gameState.subscribe(() => {
      this.updateStatusBadges();
      this.updateDetectivePosition();
    });
  }

  unmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  render() {
    const state = gameState.getState();
    const currentLoc = state.detective.currentLocation;

    this.container.innerHTML = `
      <div class="campus-map-wrapper">
        <!-- TOP HUD BAR -->
        <header class="map-hud-header">
          <div class="hud-left">
            <div class="hud-badge pulse-dot">
              <span class="live-indicator"></span>
              <span class="hud-title">CAMPUSSYNC ACTIVE SURVEILLANCE</span>
            </div>
            <div class="hud-sub">IIITDM Kancheepuram • Melakottaiyur Campus Network</div>
          </div>
          <div class="hud-center">
            <div class="hud-stat-pill">
              <span class="label">LOCATION:</span>
              <span class="value" id="hud-location-name">${CAMPUS_LOCATIONS[currentLoc]?.shortName || 'Main Grounds'}</span>
            </div>
            <div class="hud-stat-pill">
              <span class="label">CASE STATUS:</span>
              <span class="value accent" id="hud-case-status">${this.getOverallProgressText()}</span>
            </div>
            <button class="hud-mode-pill" id="btn-toggle-map-mode" title="Switch between Illustrated Campus Map and Tactical Blueprint">
              <span class="mode-icon">🔄</span>
              <span class="mode-label" id="map-mode-label">${this.mapMode === 'illustrated' ? 'VIEW: ILLUSTRATED' : 'VIEW: BLUEPRINT'}</span>
            </button>
          </div>
          <div class="hud-right">
            ${Object.values(state.missions).every(m => m.isCompleted) ? `
              <button class="hud-btn victory-badge-btn" id="btn-map-open-epilogue" title="View Campus Epilogue & Faculty Certificate" style="background: rgba(255, 179, 0, 0.2); border: 1.5px solid var(--accent-amber); color: var(--accent-amber); font-weight: 700;">
                <span class="icon">🏆</span>
                <span>EPILOGUE & CERTIFICATE</span>
              </button>
            ` : ''}
            <button class="hud-btn" id="btn-toggle-notebook" title="Open Case Notebook">
              <span class="icon">📁</span>
              <span>CASE FILE (${state.collectedClues.length}/5)</span>
            </button>
            <button class="hud-btn secondary" id="btn-map-menu" title="Back to Main Menu">
              <span class="icon">⌂</span>
              <span>MENU</span>
            </button>
          </div>
        </header>

        <!-- MAP VIEWPORT -->
        <div class="map-viewport-container" id="map-viewport">
          <div class="map-canvas-container" id="map-canvas-area">
            
            <!-- LAYER 1: ILLUSTRATED CAMPUS MAP (From user reference photo, frame removed) -->
            <div class="map-layer-illustrated ${this.mapMode === 'illustrated' ? 'active' : 'hidden'}" id="layer-illustrated">
              <img src="${campusMapImg}" alt="IIITDM Kancheepuram Campus Map" class="campus-raster-map" />
              <div class="map-raster-vignette"></div>
              <div class="map-raster-grid"></div>
            </div>

            <!-- LAYER 2: TACTICAL VECTOR BLUEPRINT -->
            <div class="map-layer-blueprint ${this.mapMode === 'blueprint' ? 'active' : 'hidden'}" id="layer-blueprint">
              ${this.getCampusSvgTemplate()}
            </div>

            <!-- LAYER 3: INTERACTIVE TACTICAL MARKERS OVERLAY (STRICTLY 4 PLAYABLE LOCATIONS) -->
            <div class="map-interactive-layer">
              ${this.renderBuildingMarkers()}
            </div>

            <!-- LAYER 4: DETECTIVE AVATAR PIN -->
            <div class="detective-pin" id="detective-avatar">
              <div class="detective-radar-ring"></div>
              <div class="detective-sprite">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                  <circle cx="15.5" cy="5.5" r="1.5" fill="#ffb300"></circle>
                  <path d="M17 7l3 3" stroke="#ffb300"></path>
                </svg>
              </div>
              <div class="detective-tag">YOU (DETECTOR)</div>
            </div>
          </div>

          <!-- BUILDING INVESTIGATION DRAWER / CARD -->
          <div class="building-card-overlay hidden" id="building-card-overlay">
            <div class="building-card" id="building-card-content">
              <!-- Populated dynamically upon clicking building -->
            </div>
          </div>
        </div>

        <!-- BOTTOM CONTROLS & LEGEND -->
        <footer class="map-legend-footer">
          <div class="legend-items">
            <span class="legend-chip"><span class="chip-color playable"></span> 4 Playable Sites</span>
            <span class="legend-chip"><span class="chip-color completed"></span> Verified Clue</span>
            <span class="legend-chip"><span class="chip-color locked"></span> Restricted Area</span>
            <span class="legend-chip"><span class="chip-color background"></span> Campus Landmarks (Ashwatha, Jasmine, etc.)</span>
          </div>
          <div class="legend-instructions">
            <span>💡 Click any active building to dispatch your detective and inspect anomalies.</span>
          </div>
        </footer>
      </div>
    `;

    this.positionDetectiveAvatar(currentLoc, false);
  }

  getOverallProgressText() {
    const state = gameState.getState();
    const completed = Object.values(state.missions).filter(m => m.isCompleted).length;
    return `${completed}/5 MISSIONS SOLVED`;
  }

  renderBuildingMarkers() {
    const state = gameState.getState();
    return Object.keys(CAMPUS_LOCATIONS).map((locId) => {
      const loc = CAMPUS_LOCATIONS[locId];
      const missions = loc.missionIds.map(id => state.missions[id]);
      const isAnyUnlocked = missions.some(m => m && (m.isUnlocked || !MISSIONS_DATA[m.id].prereqMissionId));
      const areAllCompleted = missions.every(m => m && m.isCompleted);
      const isCurrent = state.detective.currentLocation === locId;

      let statusClass = 'locked';
      let statusIcon = '🔒';
      if (areAllCompleted) {
        statusClass = 'completed';
        statusIcon = '✓';
      } else if (isAnyUnlocked) {
        statusClass = 'active pulse';
        statusIcon = '🔍';
      }

      return `
        <div class="campus-node ${statusClass} ${isCurrent ? 'current-location' : ''}" 
             id="node-${locId}"
             data-location="${locId}"
             style="left: ${loc.coordinates.x}%; top: ${loc.coordinates.y}%;">
          <div class="node-pulse-glow"></div>
          <div class="node-target-reticle"></div>
          <div class="node-box" title="${loc.name}">
            <div class="node-icon">${statusIcon}</div>
            <div class="node-label">
              <span class="node-code">${loc.code}</span>
              <span class="node-name">${loc.shortName}</span>
            </div>
          </div>
          <div class="node-badge-count">${loc.missionIds.length} Case${loc.missionIds.length > 1 ? 's' : ''}</div>
        </div>
      `;
    }).join('');
  }

  getCampusSvgTemplate() {
    return `
      <svg class="campus-svg-blueprint" viewBox="0 0 1200 762" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#141c24" />
            <stop offset="100%" stop-color="#0c1218" />
          </linearGradient>
          <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1f2c38" />
            <stop offset="100%" stop-color="#131c24" />
          </linearGradient>
          <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.04)" stroke-width="1" />
          </pattern>
        </defs>

        <rect width="1200" height="762" fill="url(#groundGrad)" />
        <rect width="1200" height="762" fill="url(#tacticalGrid)" />

        <!-- NATURAL LAKE / RESERVOIR (Right quadrant, matching reference photo) -->
        <path d="M 680 430 Q 820 400 1150 420 L 1150 630 Q 920 620 720 560 Z" fill="#0d2538" stroke="#174566" stroke-width="2" opacity="0.8" />
        <text x="940" y="520" fill="#2979ff" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle" opacity="0.6">CAMPUS RESERVOIR / LAKE</text>

        <!-- ROADS (Matching Gate B/A to Academic & Arjuna Sports) -->
        <g stroke="#26384a" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M 120 730 L 270 590 L 360 480 L 460 380 L 720 310" />
          <path d="M 460 380 L 760 260 L 980 260" />
          <path d="M 270 590 L 480 730" />
        </g>
        <g stroke="rgba(255, 234, 0, 0.25)" stroke-width="2" stroke-dasharray="10 14" fill="none">
          <path d="M 120 730 L 270 590 L 360 480 L 460 380 L 720 310" />
          <path d="M 460 380 L 760 260 L 980 260" />
        </g>

        <!-- ATHLETIC ARENA & CRICKET GROUND (Upper right) -->
        <ellipse cx="540" cy="180" rx="90" ry="45" fill="#132b1e" stroke="#255e3e" stroke-width="2" />
        <text x="540" y="185" fill="#38a169" font-size="10" font-family="monospace" text-anchor="middle">CRICKET GROUND</text>
        <ellipse cx="780" cy="210" rx="105" ry="55" fill="#1a2e22" stroke="#e53e3e" stroke-width="3" />
        <ellipse cx="780" cy="210" rx="75" ry="35" fill="#143320" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.4" />
        <text x="780" y="215" fill="#e53e3e" font-size="10" font-family="monospace" text-anchor="middle">ATHLETIC TRACK</text>

        <!-- HOSTELS CLUSTER (Top right) -->
        <g opacity="0.6">
          <rect x="940" y="80" width="180" height="130" rx="6" fill="#19222c" stroke="#314354" stroke-width="2" />
          <text x="1030" y="150" fill="#718096" font-size="11" font-family="sans-serif" text-anchor="middle">HOSTELS COMPLEX</text>
          <text x="1030" y="165" fill="#4a5568" font-size="9" font-family="monospace" text-anchor="middle">(Ashwatha, Ashoka, Jasmine)</text>
        </g>

        <!-- 4 PLAYABLE LOCATIONS OUTLINES IN BLUEPRINT -->
        <rect x="350" y="240" width="160" height="110" rx="6" fill="#142433" stroke="#00e5ff" stroke-width="2.5" />
        <text x="430" y="300" fill="#00e5ff" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">ACADEMIC BLOCK</text>

        <rect x="730" y="190" width="130" height="90" rx="6" fill="#241d13" stroke="#ff9100" stroke-width="2.5" />
        <text x="795" y="240" fill="#ff9100" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">ARJUNA SPORTS</text>

        <polygon points="410,510 530,620 400,650" fill="#242312" stroke="#ffea00" stroke-width="2.5" />
        <text x="445" y="580" fill="#ffea00" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">PARKING</text>

        <rect x="230" y="340" width="120" height="85" rx="6" fill="#12241b" stroke="#00e676" stroke-width="2.5" />
        <text x="290" y="388" fill="#00e676" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">ADMIN BLOCK</text>
      </svg>
    `;
  }

  attachEvents() {
    // Mode toggle (Illustrated map vs Blueprint)
    const btnMode = this.container.querySelector('#btn-toggle-map-mode');
    if (btnMode) {
      btnMode.addEventListener('click', () => {
        soundManager.playClick();
        this.mapMode = this.mapMode === 'illustrated' ? 'blueprint' : 'illustrated';
        const layerIll = this.container.querySelector('#layer-illustrated');
        const layerBp = this.container.querySelector('#layer-blueprint');
        const label = this.container.querySelector('#map-mode-label');

        if (this.mapMode === 'illustrated') {
          layerIll?.classList.remove('hidden');
          layerIll?.classList.add('active');
          layerBp?.classList.add('hidden');
          layerBp?.classList.remove('active');
          if (label) label.textContent = 'VIEW: ILLUSTRATED';
        } else {
          layerBp?.classList.remove('hidden');
          layerBp?.classList.add('active');
          layerIll?.classList.add('hidden');
          layerIll?.classList.remove('active');
          if (label) label.textContent = 'VIEW: BLUEPRINT';
        }
      });
    }

    // Click on interactive nodes on the map
    this.container.querySelectorAll('.campus-node').forEach((node) => {
      node.addEventListener('click', () => {
        const locId = node.dataset.location;
        this.handleSelectLocation(locId);
      });
    });

    // Close building card overlay when clicking outside
    const overlay = this.container.querySelector('#building-card-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideBuildingCard();
      }
    });

    // Back to Menu button
    const btnMenu = this.container.querySelector('#btn-map-menu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        soundManager.playClick();
        window.dispatchEvent(new CustomEvent('nav-main-menu'));
      });
    }

    // Toggle Notebook button
    const btnNotebook = this.container.querySelector('#btn-toggle-notebook');
    if (btnNotebook) {
      btnNotebook.addEventListener('click', () => {
        soundManager.playClick();
        window.dispatchEvent(new CustomEvent('toggle-notebook'));
      });
    }

    // Epilogue & Dossier button
    const btnEpilogue = this.container.querySelector('#btn-map-open-epilogue');
    if (btnEpilogue) {
      btnEpilogue.addEventListener('click', () => {
        soundManager.playClick();
        window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'restoration' } }));
      });
    }
  }

  handleSelectLocation(locId) {
    if (this.isMovingDetective) return;
    const loc = CAMPUS_LOCATIONS[locId];
    if (!loc) return;

    soundManager.playClick();
    this.selectedBuildingId = locId;

    // Smoothly animate detective marker to this location
    this.isMovingDetective = true;
    gameState.moveToLocation(locId);
    this.positionDetectiveAvatar(locId, true);

    // Update HUD location name
    const hudLoc = this.container.querySelector('#hud-location-name');
    if (hudLoc) hudLoc.textContent = loc.shortName;

    // Show building tactical dossier after short movement
    setTimeout(() => {
      this.isMovingDetective = false;
      this.showBuildingCard(locId);
    }, 450);
  }

  positionDetectiveAvatar(locId, animate = false) {
    const avatar = this.container.querySelector('#detective-avatar');
    const loc = CAMPUS_LOCATIONS[locId];
    if (!avatar || !loc) return;

    if (animate) {
      avatar.style.transition = 'left 0.45s cubic-bezier(0.25, 1, 0.5, 1), top 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    } else {
      avatar.style.transition = 'none';
    }

    // Offset slightly so avatar hovers above the building
    avatar.style.left = `${loc.coordinates.x}%`;
    avatar.style.top = `${loc.coordinates.y - 4}%`;
  }

  showBuildingCard(locId) {
    const loc = CAMPUS_LOCATIONS[locId];
    const overlay = this.container.querySelector('#building-card-overlay');
    const content = this.container.querySelector('#building-card-content');
    if (!loc || !overlay || !content) return;

    const state = gameState.getState();

    const missionCardsHtml = loc.missionIds.map((mId) => {
      const meta = MISSIONS_DATA[mId];
      const missionState = state.missions[mId];
      const isUnlocked = gameState.isMissionUnlocked(mId);
      const isCompleted = missionState?.isCompleted;

      let statusBadge = '<span class="mission-tag-status locked">🔒 LOCKED</span>';
      let buttonHtml = `<button class="mission-action-btn disabled" disabled>Prerequisite Incomplete</button>`;

      if (isCompleted) {
        statusBadge = `<span class="mission-tag-status completed">✓ SOLVED (${missionState.score} PTS)</span>`;
        buttonHtml = `<button class="mission-action-btn replay" data-mission="${mId}">Re-inspect Terminal</button>`;
      } else if (isUnlocked) {
        statusBadge = '<span class="mission-tag-status active">⚡ ACTIVE INVESTIGATION</span>';
        buttonHtml = `<button class="mission-action-btn launch" data-mission="${mId}">Deploy to Case Site →</button>`;
      } else {
        const prereqMeta = MISSIONS_DATA[meta.prereqMissionId];
        buttonHtml = `
          <div class="prereq-note">
            <span class="icon">🔒</span> Requires completing <strong>Mission ${prereqMeta?.number}: ${prereqMeta?.title}</strong>
          </div>
        `;
      }

      const conceptsTags = meta.concepts.map(c => `<span class="concept-tag">${c}</span>`).join(' ');

      return `
        <div class="mission-dossier-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}">
          <div class="mission-card-header">
            <span class="mission-number">MISSION 0${meta.number}</span>
            ${statusBadge}
          </div>
          <h4 class="mission-title">${meta.title}</h4>
          <p class="mission-tagline">${meta.tagline}</p>
          
          <div class="mission-concepts-section">
            <span class="concepts-label">CONCEPTS:</span>
            <div class="concepts-list">${conceptsTags}</div>
          </div>

          <div class="mission-card-footer">
            ${buttonHtml}
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="building-card-inner">
        <button class="card-close-btn" id="btn-close-building-card">✕</button>
        <div class="building-header" style="border-left: 4px solid ${loc.color};">
          <div class="building-meta">
            <span class="site-code">${loc.code}</span>
            <span class="site-type">PRIMARY INCIDENT LOCATION</span>
          </div>
          <h2 class="building-name">${loc.name}</h2>
          <p class="building-desc">${loc.description}</p>
        </div>

        <div class="building-missions-list">
          ${(locId === 'admin' && Object.values(state.missions).every(m => m.isCompleted)) ? `
            <div style="background: rgba(255, 179, 0, 0.12); border: 1.5px solid var(--accent-amber); border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <div>
                <div style="font-weight: 700; color: var(--accent-amber); font-size: 13px;">🏆 CAMPUSSYNC FULLY RESTORED</div>
                <div style="font-size: 11.5px; color: var(--text-muted);">View NPC assembly & print Faculty Certificate of Appreciation.</div>
              </div>
              <button class="terminal-btn accent" id="btn-admin-view-epilogue" style="background: var(--accent-amber); color: #000; font-weight: 700; white-space: nowrap;">
                VIEW CERTIFICATE ➔
              </button>
            </div>
          ` : ''}
          <h3 class="missions-section-heading">SURVEILLANCE & INVESTIGATION CASES</h3>
          ${missionCardsHtml}
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');

    const btnAdminEpilogue = content.querySelector('#btn-admin-view-epilogue');
    if (btnAdminEpilogue) {
      btnAdminEpilogue.addEventListener('click', () => {
        this.hideBuildingCard();
        window.dispatchEvent(new CustomEvent('open-epilogue', { detail: { tab: 'restoration' } }));
      });
    }

    content.querySelector('#btn-close-building-card').addEventListener('click', () => {
      this.hideBuildingCard();
    });

    content.querySelectorAll('.mission-action-btn:not(.disabled)').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const mId = btn.dataset.mission;
        this.hideBuildingCard();
        if (this.onSelectMission) {
          this.onSelectMission(mId);
        }
      });
    });
  }

  hideBuildingCard() {
    const overlay = this.container.querySelector('#building-card-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  updateStatusBadges() {
    const state = gameState.getState();
    Object.keys(CAMPUS_LOCATIONS).forEach((locId) => {
      const node = this.container.querySelector(`#node-${locId}`);
      if (!node) return;

      const loc = CAMPUS_LOCATIONS[locId];
      const missions = loc.missionIds.map(id => state.missions[id]);
      const isAnyUnlocked = missions.some(m => m && (m.isUnlocked || !MISSIONS_DATA[m.id].prereqMissionId));
      const areAllCompleted = missions.every(m => m && m.isCompleted);
      const isCurrent = state.detective.currentLocation === locId;

      node.classList.remove('locked', 'completed', 'active', 'pulse', 'current-location');
      const iconEl = node.querySelector('.node-icon');

      if (areAllCompleted) {
        node.classList.add('completed');
        if (iconEl) iconEl.textContent = '✓';
      } else if (isAnyUnlocked) {
        node.classList.add('active', 'pulse');
        if (iconEl) iconEl.textContent = '🔍';
      } else {
        node.classList.add('locked');
        if (iconEl) iconEl.textContent = '🔒';
      }

      if (isCurrent) {
        node.classList.add('current-location');
      }
    });

    const statusEl = this.container.querySelector('#hud-case-status');
    if (statusEl) {
      statusEl.textContent = this.getOverallProgressText();
    }
  }

  updateDetectivePosition() {
    const state = gameState.getState();
    this.positionDetectiveAvatar(state.detective.currentLocation, true);
  }
}
