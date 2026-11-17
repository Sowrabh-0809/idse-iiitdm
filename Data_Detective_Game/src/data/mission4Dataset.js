/**
 * Mission 4 Dataset Generator: The Parking Pattern (Campus Parking Area)
 * 
 * Simulates parking barrier RFID telemetry and Monte Carlo probability trials:
 * - Lot Capacity: 120 spaces
 * - True Arrival Probability: p = 0.32 per 5-minute interval
 * - Theoretical expected occupancy: 120 × 0.32 = 38.4 vehicles (32%)
 * - Hardware Defect: the simulation models rapid RFID retry pulses by increasing
 *   the reported probability to 0.32 × 2.05 = 0.656, giving an expected
 *   reported occupancy of 120 × 0.656 = 78.72 vehicles (65.6%).
 */

export function generateMission4Dataset() {
  const lotCapacity = 120;
  const trueP = 0.32;

  // 40 recent gate transit events
  const logs = [];
  const startHour = 14;
  let minute = 0;

  for (let i = 1; i <= 35; i++) {
    const timeStr = `${startHour}:${minute.toString().padStart(2, '0')}`;
    const tagId = `RFID-TN-${(1000 + i * 17) % 9000}`;
    const vehicleType = i % 4 === 0 ? 'Faculty Sedan' : i % 3 === 0 ? 'Delivery Van' : 'Student Hatchback';

    logs.push({
      eventId: `EVT-${i.toString().padStart(3, '0')}`,
      timeStr,
      tagId,
      vehicleType,
      pulseIntervalMs: 12000,
      isDoublePulse: false
    });

    // Inject double pulses due to unhandled sensor retry loop
    if (i === 4 || i === 9 || i === 15 || i === 22 || i === 28) {
      logs.push({
        eventId: `EVT-${i.toString().padStart(3, '0')}-RETRY`,
        timeStr: `${startHour}:${minute.toString().padStart(2, '0')} + 280ms`,
        tagId,
        vehicleType,
        pulseIntervalMs: 280, // < 500ms debounce window
        isDoublePulse: true,
        defectNote: 'Sensor retry pulse logged within 280ms without barrier checkout decrement.'
      });
    }

    minute += 3;
    if (minute >= 60) {
      minute -= 60;
    }
  }

  return {
    lotCapacity,
    trueP,
    logs
  };
}
