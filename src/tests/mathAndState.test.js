import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMean,
  calculateMedian,
  calculateMode,
  calculateVariance,
  calculateStdDev,
  calculateCorrelation,
  calculateLinearRegression,
  calculateConfusionMatrix
} from '../utils/mathUtils.js';
import { gameState } from '../state/gameState.js';
import { MISSIONS_DATA, CAMPUS_LOCATIONS } from '../state/clues.js';
import { generateMission2Dataset } from '../data/mission2Dataset.js';
import { generateMission3Dataset } from '../data/mission3Dataset.js';
import { generateMission4Dataset } from '../data/mission4Dataset.js';
import { generateMission5Dataset } from '../data/mission5Dataset.js';

describe('Statistical Utilities Verification', () => {
  it('correctly calculates arithmetic mean', () => {
    expect(calculateMean([10, 20, 30, 40])).toBe(25);
    expect(calculateMean([0, 100])).toBe(50);
    expect(calculateMean([])).toBe(0);
    // Outlier sensitivity test
    const normal = [70, 75, 80, 85, 90];
    const withOutlier = [70, 75, 80, 85, 90, 500]; // 500 is outlier
    expect(calculateMean(normal)).toBe(80);
    expect(calculateMean(withOutlier)).toBe(150);
  });

  it('correctly calculates median (robust to outliers)', () => {
    // Odd length
    expect(calculateMedian([10, 20, 30, 40, 50])).toBe(30);
    // Even length
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    // Unordered array
    expect(calculateMedian([50, 10, 40, 20, 30])).toBe(30);
    // Outlier robustness: Median barely moves compared to Mean
    const withOutlier = [70, 75, 80, 85, 90, 500];
    expect(calculateMedian(withOutlier)).toBe(82.5);
  });

  it('correctly calculates mode', () => {
    expect(calculateMode([1, 2, 2, 3, 4])).toEqual([2]);
    expect(calculateMode([5, 5, 8, 8, 9])).toEqual([5, 8]);
    expect(calculateMode([])).toEqual([]);
  });

  it('correctly calculates variance and standard deviation', () => {
    const data = [2, 4, 4, 4, 5, 5, 7, 9];
    // Mean = 5, variance = 4, stdDev = 2
    expect(calculateMean(data)).toBe(5);
    expect(calculateVariance(data)).toBe(4);
    expect(calculateStdDev(data)).toBe(2);
  });

  it('correctly calculates Pearson correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const yPerf = [2, 4, 6, 8, 10]; // Perfect positive
    const yNeg = [10, 8, 6, 4, 2]; // Perfect negative
    expect(calculateCorrelation(x, yPerf)).toBeCloseTo(1.0, 5);
    expect(calculateCorrelation(x, yNeg)).toBeCloseTo(-1.0, 5);
  });

  it('correctly calculates Ordinary Least Squares Linear Regression', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11]; // y = 2x + 1
    const reg = calculateLinearRegression(x, y);

    expect(reg.slope).toBeCloseTo(2.0, 4);
    expect(reg.intercept).toBeCloseTo(1.0, 4);
    expect(reg.rSquared).toBeCloseTo(1.0, 4);
    expect(reg.mae).toBeCloseTo(0.0, 4);
    expect(reg.predict(6)).toBeCloseTo(13.0, 4);
  });

  it('correctly calculates Confusion Matrix metrics', () => {
    const actuals = [1, 1, 0, 0, 1, 0, 1, 0];
    const preds   = [1, 0, 0, 0, 1, 1, 1, 0];
    // Actual 1s: 4, Actual 0s: 4
    // TP: [idx 0, 4, 6] = 3
    // FN: [idx 1] = 1
    // FP: [idx 5] = 1
    // TN: [idx 2, 3, 7] = 3
    const matrix = calculateConfusionMatrix(actuals, preds);
    expect(matrix.tp).toBe(3);
    expect(matrix.fp).toBe(1);
    expect(matrix.tn).toBe(3);
    expect(matrix.fn).toBe(1);
    expect(matrix.accuracy).toBe(6 / 8); // 0.75
    expect(matrix.precision).toBe(3 / 4); // 0.75
    expect(matrix.recall).toBe(3 / 4); // 0.75
    expect(matrix.f1).toBeCloseTo(0.75, 4);
  });
});

describe('Campus Blueprint & Sequential Game State Verification', () => {
  beforeEach(() => {
    gameState.resetProgress();
  });

  it('contains strictly 4 playable locations', () => {
    const locKeys = Object.keys(CAMPUS_LOCATIONS);
    expect(locKeys.length).toBe(4);
    expect(locKeys).toEqual(['academic', 'sports', 'parking', 'admin']);
  });

  it('has Mission 1 unlocked by default, and Missions 2-5 locked', () => {
    expect(gameState.isMissionUnlocked('m1')).toBe(true);
    expect(gameState.isMissionUnlocked('m2')).toBe(false);
    expect(gameState.isMissionUnlocked('m3')).toBe(false);
    expect(gameState.isMissionUnlocked('m4')).toBe(false);
    expect(gameState.isMissionUnlocked('m5')).toBe(false);
  });

  it('unlocks Mission 2 upon completing Mission 1', () => {
    gameState.completeMission('m1', 95, 'Student records normalized; timestamp #492 detected');
    expect(gameState.getMission('m1').isCompleted).toBe(true);
    expect(gameState.getMission('m1').score).toBe(95);

    // M2 should now be unlocked!
    expect(gameState.isMissionUnlocked('m2')).toBe(true);
    expect(gameState.isMissionUnlocked('m3')).toBe(false);

    // Clue #1 was collected
    const state = gameState.getState();
    expect(state.collectedClues.length).toBe(1);
    expect(state.collectedClues[0].id).toBe('clue-1');
  });

  it('progresses sequentially through all 5 missions and updates detective rank', () => {
    // Complete M1
    gameState.completeMission('m1', 100);
    expect(gameState.getState().detective.rank).toBe('Investigative Data Analyst');

    // Complete M2
    gameState.completeMission('m2', 90);
    expect(gameState.isMissionUnlocked('m3')).toBe(true);

    // Complete M3
    gameState.completeMission('m3', 85);
    expect(gameState.getState().detective.rank).toBe('Senior Data Detective');
    expect(gameState.isMissionUnlocked('m4')).toBe(true);

    // Complete M4
    gameState.completeMission('m4', 90);
    expect(gameState.isMissionUnlocked('m5')).toBe(true);

    // Complete M5
    gameState.completeMission('m5', 100);
    expect(gameState.getState().detective.rank).toBe('Senior Campus Forensics Lead');
    expect(gameState.getTotalScore()).toBe(465);
    expect(gameState.getState().collectedClues.length).toBe(5);
  });
});

describe('Missions 2-5 Dataset Forensics Verification', () => {
  it('verifies Mission 2 date shift affects Pearson r', () => {
    const data = generateMission2Dataset();
    expect(data.length).toBe(60);

    // Shifted correlation (+24 slots = +48 hours)
    const shiftedX = data.map(d => d.shiftedAttendance);
    const y = data.map(d => d.powerDrawKW);
    const shiftedR = calculateCorrelation(shiftedX, y);
    expect(Math.abs(shiftedR)).toBeGreaterThan(0.5);

    // Synchronized (0h) correlation
    const trueX = data.map(d => d.trueAttendance);
    const syncR = calculateCorrelation(trueX, y);
    expect(Math.abs(syncR)).toBeLessThan(0.4);
  });

  it('verifies Mission 3 outlier quarantine minimizes MAE', () => {
    const athletes = generateMission3Dataset();
    expect(athletes.length).toBe(25);

    // Raw model with anomalies
    const rawX = athletes.map(a => a.hours);
    const rawY = athletes.map(a => a.sprintSec);
    const rawFit = calculateLinearRegression(rawX, rawY);
    expect(rawFit.mae).toBeGreaterThan(1.0);

    // Cleaned model with anomalies removed
    const clean = athletes.filter(a => !a.isAnomalous);
    const cleanFit = calculateLinearRegression(clean.map(a => a.hours), clean.map(a => a.sprintSec));
    expect(cleanFit.mae).toBeLessThan(0.5);
  });

  it('verifies Mission 4 RFID double-pulse detection', () => {
    const { lotCapacity, logs } = generateMission4Dataset();
    expect(lotCapacity).toBe(120);
    const doublePulses = logs.filter(l => l.isDoublePulse);
    expect(doublePulses.length).toBeGreaterThan(0);
    expect(doublePulses.every(p => p.pulseIntervalMs < 500)).toBe(true);
  });

  it('verifies Mission 5 classification logs', () => {
    const logs = generateMission5Dataset();
    expect(logs.length).toBe(100);
    const actuals = logs.map(l => l.actualCorrupted);
    const preds = logs.map(l => l.predictedProb >= 0.5 ? 1 : 0);
    const cm = calculateConfusionMatrix(actuals, preds);
    expect(cm.accuracy).toBeGreaterThan(0.8);
  });

  it('verifies 5-Mission completion unlocks Epilogue and S-Grade rank', () => {
    // Complete all 5 missions with 100 pts each
    Object.keys(MISSIONS_DATA).forEach((mKey) => {
      gameState.completeMission(mKey, 100, `Completed ${mKey}`);
    });

    const state = gameState.getState();
    const allCompleted = Object.values(state.missions).every(m => m.isCompleted);
    expect(allCompleted).toBe(true);
    expect(gameState.getTotalScore()).toBe(500);
    expect(state.detective.rank).toBe('Senior Campus Forensics Lead');
    expect(state.collectedClues.length).toBe(5);

    // Verify Certificate of Appreciation award conditions
    expect(state.detective.badge).toBeDefined();
    expect(state.detective.name).toBeDefined();
    // 500 PTS represents full 100% mastery for faculty commendation
    expect(gameState.getTotalScore()).toBe(500);
  });
});
