/**
 * Mission 4 Dataset Generator: The Parking Pattern (Campus Parking Area)
 * 
 * Simulates parking barrier RFID telemetry and Monte Carlo probability trials:
 * - Lot Capacity: 120 spaces
 * - True Arrival Probability: p = 0.32 per 5-minute interval
 * - Theoretical expected occupancy: 52 vehicles (43.3%)
 * - Hardware Defect: RFID sensor retry timeout produces double pulses (< 400ms)
 *   inflating experimental occupancy to 104 vehicles (86.7% - near critical capacity).
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
