import { gameState } from './state/gameState.js';
import { soundManager } from './audio/soundManager.js';
import { MainMenu } from './components/MainMenu.js';
import { CampusMap } from './components/CampusMap.js';
import { DetectiveNotebook } from './components/DetectiveNotebook.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { MissionBriefModal } from './components/MissionBriefModal.js';
import { Mission1CorruptedRecords } from './components/missions/Mission1CorruptedRecords.js';
import { Mission2HiddenPattern } from './components/missions/Mission2HiddenPattern.js';
import { Mission3PredictChampion } from './components/missions/Mission3PredictChampion.js';
import { Mission4ParkingPattern } from './components/missions/Mission4ParkingPattern.js';
import { Mission5FinalVerdict } from './components/missions/Mission5FinalVerdict.js';
import { CampusEpilogueModal } from './components/CampusEpilogueModal.js';

class App {
  constructor() {
    this.currentView = 'menu'; // 'menu' | 'map' | 'mission1' .. 'mission5'
    this.viewContainer = document.getElementById('view-container');
    this.notebookContainer = document.getElementById('notebook-container');
    this.handbookContainer = document.getElementById('handbook-container');
    this.briefingContainer = document.getElementById('briefing-container');
    this.epilogueContainer = document.getElementById('epilogue-container');

    this.activeComponent = null;
    this.notebookComponent = null;
    this.handbookComponent = null;
    this.briefingComponent = null;
    this.epilogueComponent = null;
  }

  init() {
    // Mount persistent overlays
    this.notebookComponent = new DetectiveNotebook(this.notebookContainer);
    this.notebookComponent.mount();

    this.handbookComponent = new HowToPlayModal(this.handbookContainer);
    this.handbookComponent.mount();

    this.briefingComponent = new MissionBriefModal(this.briefingContainer, (missionId) => {
      this.handleLaunchMission(missionId);
    });
    this.briefingComponent.mount();

    this.epilogueComponent = new CampusEpilogueModal(this.epilogueContainer, () => {
      if (this.currentView !== 'menu' && this.currentView !== 'map') {
        this.switchView('map');
      }
    });
    this.epilogueComponent.mount();

    // Listen to global navigation events
    window.addEventListener('nav-main-menu', () => {
      this.switchView('menu');
    });

    window.addEventListener('nav-campus-map', () => {
      this.switchView('map');
    });

    window.addEventListener('open-epilogue', (e) => {
      const tab = e.detail?.tab || 'restoration';
      this.epilogueComponent.show(tab);
    });

    // Default start view: Menu
    this.switchView('menu');
  }

  switchView(viewName) {
    if (this.activeComponent && this.activeComponent.unmount) {
      this.activeComponent.unmount();
    }
    this.viewContainer.innerHTML = '';
    this.currentView = viewName;

    if (viewName === 'menu') {
      this.activeComponent = new MainMenu(
        this.viewContainer,
        () => this.handleStartGame(),
        () => this.handleContinueGame(),
        () => this.handbookComponent.open()
      );
      this.activeComponent.mount();
    } else if (viewName === 'map') {
      this.activeComponent = new CampusMap(
        this.viewContainer,
        (missionId) => this.handleSelectMission(missionId)
      );
      this.activeComponent.mount();
    } else if (viewName === 'mission1') {
      this.activeComponent = new Mission1CorruptedRecords(
        this.viewContainer,
        () => this.switchView('map'),
        () => this.switchView('mission2')
      );
      this.activeComponent.mount();
    } else if (viewName === 'mission2') {
      this.activeComponent = new Mission2HiddenPattern(
        this.viewContainer,
        () => this.switchView('map'),
        () => this.switchView('mission3')
      );
      this.activeComponent.mount();
    } else if (viewName === 'mission3') {
      this.activeComponent = new Mission3PredictChampion(
        this.viewContainer,
        () => this.switchView('map'),
        () => this.switchView('mission4')
      );
      this.activeComponent.mount();
    } else if (viewName === 'mission4') {
      this.activeComponent = new Mission4ParkingPattern(
        this.viewContainer,
        () => this.switchView('map'),
        () => this.switchView('mission5')
      );
      this.activeComponent.mount();
    } else if (viewName === 'mission5') {
      this.activeComponent = new Mission5FinalVerdict(
        this.viewContainer,
        () => this.switchView('map')
      );
      this.activeComponent.mount();
    }
  }

  handleStartGame() {
    this.switchView('map');
    // If starting fresh or Mission 1 is active, automatically open the dispatch brief for Mission 1
    const m1 = gameState.getMission('m1');
    if (!m1 || !m1.isCompleted) {
      setTimeout(() => {
        this.handleSelectMission('m1');
      }, 350);
    }
  }

  handleContinueGame() {
    this.switchView('map');
  }

  handleSelectMission(missionId) {
    this.briefingComponent.show(missionId);
  }

  handleLaunchMission(missionId) {
    const meta = gameState.getMissionMeta(missionId);
    if (!meta) return;

    if (missionId === 'm1') {
      this.switchView('mission1');
    } else if (missionId === 'm2') {
      this.switchView('mission2');
    } else if (missionId === 'm3') {
      this.switchView('mission3');
    } else if (missionId === 'm4') {
      this.switchView('mission4');
    } else if (missionId === 'm5') {
      this.switchView('mission5');
    }
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
