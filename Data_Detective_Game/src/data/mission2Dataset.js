/**
 * Mission 2 Dataset Generator: The Hidden Pattern (Academic Block - Lab Terminal)
 * 
 * Simulates 60 hourly telemetry intervals across Monday through Friday.
 * Features:
 * - Equipment Power Draw (kW)
 * - Actual Student Attendance in the Lab (%)
 * - Shifted Attendance (+48h date index mismatch from SYNC-CYCLE-492)
 * 
 * Demonstrates:
 * - When misaligned by +48h, r ≈ 0.88 (Spurious correlation).
 * - When correctly aligned (0h offset), r ≈ 0.10 (Real correlation is virtually zero).
 */

export function generateMission2Dataset() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayWeights = [0.75, 1.15, 1.35, 0.65, 0.80];
  const records = [];

  // Seeded reproducible random helper
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const trueAttendances = [];
  let idCounter = 1;

  for (let d = 0; d < days.length; d++) {
    const day = days[d];
    const weight = dayWeights[d];
    for (let hour = 9; hour <= 20; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      
      const baseCurve = 18 + 48 * Math.sin(((hour - 9) / 11) * Math.PI);
      const trueAttendance = Math.round(Math.max(10, Math.min(95, baseCurve * weight + (pseudoRandom() * 10 - 5))));
      trueAttendances.push(trueAttendance);

      records.push({
        id: `LAB-${idCounter.toString().padStart(3, '0')}`,
        index: idCounter - 1,
        day,
        hour,
        timeStr: `${day} ${timeStr}`,
        trueAttendance,
        powerDrawKW: 0,
        isShifted: true
      });

      idCounter++;
    }
  }

  // The power draw was an independent server cycle that happened to align with the +24 slot (+48h) shifted records:
  const n = records.length;
  const offset = 24;
  for (let i = 0; i < n; i++) {
    const shiftedIdx = (i + offset) % n;
    const target = trueAttendances[shiftedIdx];
    records[i].shiftedAttendance = target;
    records[i].powerDrawKW = Number((14 + 0.38 * target + (pseudoRandom() * 6 - 3)).toFixed(2));
  }

  return records;
}
