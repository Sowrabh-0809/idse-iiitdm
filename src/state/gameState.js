import { storage } from '../utils/storage.js';
import { MISSIONS_DATA, CAMPUS_LOCATIONS } from './clues.js';
import { soundManager } from '../audio/soundManager.js';

const STATE_STORAGE_KEY = 'GAME_STATE_DATA';

class GameState {
  constructor() {
    this.listeners = new Set();
    this.state = this.getDefaultState();
    this.loadFromStorage();
  }

  getDefaultState() {
    const missions = {};
    Object.keys(MISSIONS_DATA).forEach((mKey) => {
      const def = MISSIONS_DATA[mKey];
      missions[mKey] = {
        id: def.id,
        number: def.number,
        isUnlocked: def.prereqMissionId === null, // M1 unlocked by default
        isCompleted: false,
        score: 0,
        stars: 0,
        clueFound: null,
        evidenceReport: null,
        timeCompleted: null
      };
    });

    return {
      detective: {
        name: 'Analyst Cadet',
        badge: 'IDSE-2026',
        rank: 'Junior Data Sleuth',
        currentLocation: 'academic' // 'academic' | 'sports' | 'parking' | 'admin'
      },
      currentMissionId: null, // null when on campus map
      missions,
      collectedClues: [],
      soundEnabled: true,
      masterVolume: 0.5,
      mapViewMode: 'blueprint', // 'blueprint' or 'custom'
      customMapImage: null,
      lastSaved: null
    };
  }

  loadFromStorage() {
    const saved = storage.get(STATE_STORAGE_KEY, null);
    if (saved) {
      // Merge with defaults in case of schema updates
      this.state = {
        ...this.state,
        ...saved,
        detective: { ...this.state.detective, ...(saved.detective || {}) },
        missions: { ...this.state.missions, ...(saved.missions || {}) }
      };
    }
    soundManager.setEnabled(this.state.soundEnabled);
    soundManager.setVolume(this.state.masterVolume);
  }

  saveToStorage() {
    this.state.lastSaved = new Date().toISOString();
    storage.set(STATE_STORAGE_KEY, this.state);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (e) {
        console.error('GameState listener error:', e);
      }
    });
  }

  getState() {
    return this.state;
  }

  getMission(missionId) {
    return this.state.missions[missionId] || null;
  }

  getMissionMeta(missionId) {
    return MISSIONS_DATA[missionId] || null;
  }

  isMissionUnlocked(missionId) {
    const meta = MISSIONS_DATA[missionId];
    if (!meta) return false;
    if (!meta.prereqMissionId) return true;
    const prereq = this.state.missions[meta.prereqMissionId];
    return prereq && prereq.isCompleted;
  }

  moveToLocation(locationId) {
    if (!CAMPUS_LOCATIONS[locationId]) return;
    this.state.detective.currentLocation = locationId;
    soundManager.playStep();
    this.saveToStorage();
  }

  selectMission(missionId) {
    if (!missionId) {
      this.state.currentMissionId = null;
      this.saveToStorage();
      return;
    }
    if (!this.isMissionUnlocked(missionId)) {
      soundManager.playError();
      return false;
    }
    const meta = MISSIONS_DATA[missionId];
    if (meta && meta.locationId) {
      this.state.detective.currentLocation = meta.locationId;
    }
    this.state.currentMissionId = missionId;
    soundManager.playClick();
    this.saveToStorage();
    return true;
  }

  returnToMap() {
    this.state.currentMissionId = null;
    soundManager.playClick();
    this.saveToStorage();
  }

  completeMission(missionId, score = 100, evidenceSummary = '') {
    const mission = this.state.missions[missionId];
    const meta = MISSIONS_DATA[missionId];
    if (!mission || !meta) return;

    mission.isCompleted = true;
    mission.score = Math.max(mission.score || 0, score);
    mission.timeCompleted = new Date().toISOString();
    mission.evidenceReport = evidenceSummary;

    // Collect clue
    if (meta.clueDiscovered && !this.state.collectedClues.some(c => c.id === meta.clueDiscovered.id)) {
      this.state.collectedClues.push({
        ...meta.clueDiscovered,
        missionNumber: meta.number,
        foundAt: new Date().toLocaleTimeString()
      });
      mission.clueFound = meta.clueDiscovered.id;
    }

    // Unlock subsequent missions sequentially
    Object.keys(MISSIONS_DATA).forEach((mKey) => {
      const otherMeta = MISSIONS_DATA[mKey];
      if (otherMeta.prereqMissionId === missionId) {
        this.state.missions[mKey].isUnlocked = true;
      }
    });

    this.updateRank();
    soundManager.playSuccess();
    this.saveToStorage();
  }

  updateRank() {
    const completedCount = Object.values(this.state.missions).filter(m => m.isCompleted).length;
    const totalScore = this.getTotalScore();

    if (completedCount >= 5) {
      this.state.detective.rank = 'Senior Campus Forensics Lead';
    } else if (completedCount >= 3) {
      this.state.detective.rank = 'Senior Data Detective';
    } else if (completedCount >= 1) {
      this.state.detective.rank = 'Investigative Data Analyst';
    } else {
      this.state.detective.rank = 'Cadet Data Investigator';
    }
  }

  getTotalScore() {
    return Object.values(this.state.missions).reduce((sum, m) => sum + (m.score || 0), 0);
  }

  toggleSound(enable = null) {
    const nextVal = enable !== null ? enable : !this.state.soundEnabled;
    this.state.soundEnabled = nextVal;
    soundManager.setEnabled(nextVal);
    this.saveToStorage();
    return nextVal;
  }

  setVolume(vol) {
    this.state.masterVolume = vol;
    soundManager.setVolume(vol);
    this.saveToStorage();
  }

  setCustomMapImage(dataUrl) {
    this.state.customMapImage = dataUrl;
    this.saveToStorage();
  }

  resetProgress() {
    storage.remove(STATE_STORAGE_KEY);
    this.state = this.getDefaultState();
    soundManager.setEnabled(this.state.soundEnabled);
    this.saveToStorage();
  }
}

export const gameState = new GameState();

