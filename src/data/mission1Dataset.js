/**
 * Mission 1: The Corrupted Records Dataset Generator.
 * Synthesizes 100 realistic student records for IIITDM Kancheepuram with reproducible anomalies.
 * Anomalies include:
 * - 3 Duplicate records (sharing sync hash SYNC-492)
 * - 3 Extreme outliers (bitwise sensor overflows like 450%, 380%, -45%)
 * - 3 Missing values (null / NaN)
 * - 2 Inconsistent status / semester mismatches
 */

// Simple seeded pseudo-random number generator (LCG) for reproducibility
function createPrng(seed = 10101) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavna', 'Chetan', 'Deepa',
  'Dev', 'Divya', 'Gautam', 'Hari', 'Isha', 'Kavya', 'Madhav', 'Meera',
  'Nikhil', 'Pooja', 'Pranav', 'Rahul', 'Rhea', 'Rohan', 'Sai', 'Sanjay',
  'Sneha', 'Suresh', 'Tarun', 'Varun', 'Veda', 'Vikram'
];

const LAST_NAMES = [
  'Iyer', 'Sharma', 'Reddy', 'Nair', 'Verma', 'Patel', 'Sundaram', 'Kumar',
  'Rao', 'Menon', 'Gupta', 'Pillai', 'Krishnan', 'Bhatt', 'Joshi', 'Chari'
];

const COURSES = [
  { code: 'CS201', name: 'Data Structures & Algorithms' },
  { code: 'DS101', name: 'Intro to Data Science' },
  { code: 'EC204', name: 'Digital Logic Design' },
  { code: 'ME102', name: 'Engineering Graphics' }
];

export function generateMission1Dataset() {
  const prng = createPrng(42069);
  const records = [];

  // Generate 92 clean baseline records
  for (let i = 1; i <= 92; i++) {
    const rollNum = `2024BCS${String(i).padStart(3, '0')}`;
    const firstName = FIRST_NAMES[Math.floor(prng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(prng() * LAST_NAMES.length)];
    const course = COURSES[Math.floor(prng() * COURSES.length)];
    
    // Normal attendance between 68% and 94%
    const baseAttendance = Math.round(70 + prng() * 24);

    records.push({
      id: `REC-${String(i).padStart(3, '0')}`,
      rollNo: rollNum,
      studentName: `${firstName} ${lastName}`,
      courseCode: course.code,
      courseName: course.name,
      attendance: baseAttendance,
      originalAttendance: baseAttendance,
      verifiedBiometric: baseAttendance,
      syncHash: `SYNC-REG-${1000 + i}`,
      timestamp: '2026-10-24 09:00:00',
      status: 'Normal',
      anomalyType: null,
      isFlagged: false,
      isCleaned: true
    });
  }

  // 1. Inject 3 Extreme Outliers (bit-shift/overflow sensor anomalies)
  const outlierIndices = [14, 38, 71];
  const outlierValues = [450, 380, -45]; // Impossible percentages
  const trueOutlierValues = [82, 76, 79];

  outlierIndices.forEach((idx, i) => {
    records[idx].attendance = outlierValues[i];
    records[idx].originalAttendance = outlierValues[i];
    records[idx].verifiedBiometric = trueOutlierValues[i];
    records[idx].syncHash = 'SYNC-ERR-OVERFLOW';
    records[idx].status = 'Sensor Overflow';
    records[idx].anomalyType = 'outlier';
    records[idx].isCleaned = false;
    records[idx].anomalyNote = `Recorded value ${outlierValues[i]}% is physically impossible. Physical biometric scanner indicates ${trueOutlierValues[i]}%.`;
  });

  // 2. Inject 3 Missing Values (null/missing packets)
  const missingIndices = [22, 53, 85];
  const trueMissingValues = [84, 78, 88];

  missingIndices.forEach((idx, i) => {
    records[idx].attendance = null;
    records[idx].originalAttendance = null;
    records[idx].verifiedBiometric = trueMissingValues[i];
    records[idx].syncHash = 'SYNC-NULL-PACKET';
    records[idx].status = 'Missing Value';
    records[idx].anomalyType = 'missing';
    records[idx].isCleaned = false;
    records[idx].anomalyNote = `Attendance field is empty/null due to dropped UDP packet. Ground truth biometric log confirms ${trueMissingValues[i]}%.`;
  });

  // 3. Inject 2 Inconsistent Status Records
  const inconsistentIndices = [31, 64];
  inconsistentIndices.forEach((idx) => {
    records[idx].attendance = 0;
    records[idx].originalAttendance = 0;
    records[idx].verifiedBiometric = 85;
    records[idx].syncHash = 'SYNC-STATUS-MISMATCH';
    records[idx].status = 'Recorded Absent (Erroneous)';
    records[idx].anomalyType = 'inconsistent';
    records[idx].isCleaned = false;
    records[idx].anomalyNote = 'Student was physically present, but system marked 0% due to terminal timeout.';
  });

  // 4. Inject 3 Duplicate Records (Sync batch #492)
  // Duplicates of students at indices 5, 29, 62
  const dupSources = [5, 29, 62];
  dupSources.forEach((srcIdx, i) => {
    const src = records[srcIdx];
    records.push({
      id: `REC-DUP-${i + 1}`,
      rollNo: src.rollNo,
      studentName: src.studentName,
      courseCode: src.courseCode,
      courseName: src.courseName,
      attendance: src.attendance,
      originalAttendance: src.attendance,
      verifiedBiometric: src.verifiedBiometric,
      syncHash: 'SYNC-CYCLE-492', // Shared clue hash!
      timestamp: '2026-10-24 09:42:15 [DUPLICATE SYNC]',
      status: 'Duplicate Synchronization',
      anomalyType: 'duplicate',
      isFlagged: false,
      isCleaned: false,
      anomalyNote: 'Redundant clone spawned by batch SYNC-CYCLE-492. Safe to remove.'
    });
  });

  // Total initial count: 92 original + 3 dups + 5 other modified = 95 original + 3 dups = 95+? Wait, let's verify total:
  // We started with 92 records in loop (index 0..91).
  // Plus 3 duplicate records appended = 95 records.
  // Let's add 5 more records so it is exactly 100 records!
  for (let i = 93; i <= 97; i++) {
    const rollNum = `2024BCS${String(i).padStart(3, '0')}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const course = COURSES[i % COURSES.length];
    const baseAttendance = Math.round(72 + (i % 18));

    records.splice(i, 0, {
      id: `REC-${String(i).padStart(3, '0')}`,
      rollNo: rollNum,
      studentName: `${firstName} ${lastName}`,
      courseCode: course.code,
      courseName: course.name,
      attendance: baseAttendance,
      originalAttendance: baseAttendance,
      verifiedBiometric: baseAttendance,
      syncHash: `SYNC-REG-${1000 + i}`,
      timestamp: '2026-10-24 09:00:00',
      status: 'Normal',
      anomalyType: null,
      isFlagged: false,
      isCleaned: true
    });
  }

  // Ensure total length is exactly 100 records
  return records.slice(0, 100);
}

