/**
 * Master Registry of Locations, Missions, and Unlocked Clues.
 * Adheres strictly to the 4 Playable Campus Locations and 5 Missions.
 * Coordinates are mapped to the IIITDM Kancheepuram campus layout.
 */

export const CAMPUS_LOCATIONS = {
  academic: {
    id: 'academic',
    name: 'Academic Complex',
    shortName: 'Academic Block',
    code: 'AB-101',
    description: 'Central teaching blocks, lecture halls, and computational labs. Hub of student attendance & lab logs.',
    missionIds: ['m1', 'm2'],
    coordinates: { x: 34, y: 35 }, // Center of Academic & Lab blocks (06, 07, 08, 09)
    color: '#00e5ff',
    icon: 'school'
  },
  sports: {
    id: 'sports',
    name: 'Arjuna Sports Complex',
    shortName: 'Arjuna Sports',
    code: 'ASC-SPORTS',
    description: 'Indoor stadium, athletic tracks, and sports training facilities where athletic telemetry is logged.',
    missionIds: ['m3'],
    coordinates: { x: 65, y: 28 }, // Arjuna Indoor Stadium & Athletic Field (20, 21, 22)
    color: '#ff9100',
    icon: 'sports_tennis'
  },
  parking: {
    id: 'parking',
    name: 'Campus Parking Area',
    shortName: 'Parking Area',
    code: 'PKG-MAIN',
    description: 'Main automated barrier gate and faculty/student vehicular parking bays.',
    missionIds: ['m4'],
    coordinates: { x: 40, y: 74 }, // Triangular parking lot P-29 near Gate B/A
    color: '#ffea00',
    icon: 'local_parking'
  },
  admin: {
    id: 'admin',
    name: 'Administration Block',
    shortName: 'Admin Block',
    code: 'ADM-CENTRAL',
    description: 'Institute administrative headquarters housing the central CampusSync server mainframe.',
    missionIds: ['m5'],
    coordinates: { x: 23, y: 49 }, // Admin block 04 near entrance axis
    color: '#00e676',
    icon: 'account_balance'
  }
};

export const MISSIONS_DATA = {
  m1: {
    id: 'm1',
    number: 1,
    title: 'The Corrupted Records',
    tagline: 'Student attendance reports contain suspicious anomalies and statistical distortions.',
    locationId: 'academic',
    locationName: 'Academic Block',
    prereqMissionId: null, // First mission is unlocked by default
    concepts: ['Data Cleaning', 'Missing Values', 'Outliers', 'Mean', 'Median', 'Mode'],
    targetScore: 100,
    clueDiscovered: {
      id: 'clue-1',
      title: 'Suspicious Timestamp Clustering',
      summary: 'A cluster of duplicate student records was synced with a future timestamp hash [SYNC-CYCLE #492].',
      detail: 'The attendance anomaly was not caused by human entry error, but by automated record duplication from an offset batch synchronization.'
    }
  },
  m2: {
    id: 'm2',
    number: 2,
    title: 'The Hidden Pattern',
    tagline: 'Equipment usage logs and attendance metrics shifted together. Is it correlation or causation?',
    locationId: 'academic',
    locationName: 'Academic Block — Lab Terminal',
    prereqMissionId: 'm1',
    concepts: ['Data Visualization', 'Correlation', 'Correlation Strength', 'Correlation vs Causation'],
    targetScore: 100,
    clueDiscovered: {
      id: 'clue-2',
      title: 'Misaligned Date Associations',
      summary: 'High equipment utilization artificially correlated with attendance only because of shifted date indices.',
      detail: 'Records from Tuesday afternoon were incorrectly paired with Thursday morning logs during cross-departmental aggregation.'
    }
  },
  m3: {
    id: 'm3',
    number: 3,
    title: 'Predict the Champion',
    tagline: 'Athletic sprint time predictions are failing. Calibrate the regression line and uncover residuals.',
    locationId: 'sports',
    locationName: 'Arjuna Sports Complex',
    prereqMissionId: 'm2',
    concepts: ['Linear Regression', 'Prediction', 'Residuals', 'Mean Absolute Error (MAE)'],
    targetScore: 100,
    clueDiscovered: {
      id: 'clue-3',
      title: 'Period Mismatch in Athlete Logs',
      summary: 'Anomalous athlete sprint measurements originated from an entirely different training season.',
      detail: 'The linear regression model broke because high-intensity off-season sprint times were silently merged into regular endurance season data.'
    }
  },
  m4: {
    id: 'm4',
    number: 4,
    title: 'The Parking Pattern',
    tagline: 'Unprecedented vehicle occupancy alarms triggered at the security gate. Is it true surge or statistical illusion?',
    locationId: 'parking',
    locationName: 'Parking Area',
    prereqMissionId: 'm3',
    concepts: ['Probability', 'Experimental vs Theoretical Probability', 'Random Variation', 'Distributions'],
    targetScore: 100,
    clueDiscovered: {
      id: 'clue-4',
      title: 'Double-Counted RFID Gate Events',
      summary: 'RFID barrier sensor pulses were logged twice following an unhandled retry loop during network sync dropouts.',
      detail: 'Simulated occupancy probability diverged sharply from theoretical limits because vehicle checkout events failed to decrement.'
    }
  },
  m5: {
    id: 'm5',
    number: 5,
    title: 'The Final Verdict',
    tagline: 'Confront the central CampusSync server. Synthesize all evidence, build the decision tree, and tune the classifier.',
    locationId: 'admin',
    locationName: 'Administration Block',
    prereqMissionId: 'm4',
    concepts: ['Logistic Regression', 'Decision Trees', 'Confusion Matrix', 'Classification Thresholds', 'Precision & Recall'],
    targetScore: 100,
    clueDiscovered: {
      id: 'clue-5',
      title: 'Root Cause: CampusSync Temporal Desynchronization',
      summary: 'The incidents were not independent malfunctions. A broken database sync cron job mixed historical and live batches.',
      detail: 'By calibrating the diagnostic classifier and constructing the decision tree, the detective definitively pinpoints the broken cron script and restores data integrity across IIITDM Kancheepuram.'
    }
  }
};
