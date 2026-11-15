/**
 * Mission 5 Dataset Generator: The Final Verdict (Administration Block)
 * 
 * Simulates 100 CampusSync server telemetry logs for classification:
 * - Features: Error Rate, Batch ID, Offset Seconds, Retry Count
 * - Model Probability (Logistic Regression P_hat from 0.00 to 1.00)
 * - Actual Corruption Ground Truth (1 = Corrupted by SYNC-CYCLE-492, 0 = Clean)
 */

export function generateMission5Dataset() {
  const records = [];
  let seed = 12345;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = 1; i <= 100; i++) {
    const isCorrupt = (i <= 32) || (i >= 85 && i <= 92); // ~40% true corruptions
    const isClueBatch = isCorrupt ? (rnd() > 0.15) : (rnd() < 0.08);

    // Probability predicted by logistic regression model
    let logitProb;
    if (isCorrupt) {
      logitProb = 0.55 + rnd() * 0.42; // mostly high (0.55 - 0.97)
    } else {
      logitProb = 0.05 + rnd() * 0.45; // mostly low (0.05 - 0.50)
    }

    records.push({
      id: `SRV-LOG-${i.toString().padStart(3, '0')}`,
      service: i % 4 === 0 ? 'AcademicDB' : i % 3 === 0 ? 'SportsTelemetry' : i % 2 === 0 ? 'ParkingRFID' : 'AdminCore',
      batchId: isClueBatch ? 'SYNC-CYCLE-492' : `SYNC-CYCLE-${300 + (i % 50)}`,
      predictedProb: Number(logitProb.toFixed(2)),
      actualCorrupted: isCorrupt ? 1 : 0
    });
  }

  return records;
}
