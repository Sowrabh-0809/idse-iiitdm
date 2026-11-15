/**
 * Mission 3 Dataset Generator: Predict the Champion (Arjuna Sports Complex)
 * 
 * Simulates 30 varsity athlete training records:
 * - Weekly Training Hours (x)
 * - 100m Sprint Time in seconds (y)
 * 
 * True linear relationship: y ≈ 13.8 - 0.28x + noise
 * 
 * Contains 2 contaminated off-season records merged by SYNC-CYCLE-492:
 * - Athlete #14: 42 hrs, 25.8s (Recreational off-season fun-run)
 * - Athlete #24: 2 hrs, 8.8s (Stopwatch millisecond entry corruption)
 */

export function generateMission3Dataset() {
  const athletes = [
    { id: 'ATH-01', name: 'Rohan Sharma', hours: 14, sprintSec: 10.1, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-02', name: 'Ananya Iyer', hours: 10, sprintSec: 11.2, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-03', name: 'Karthik Raja', hours: 8, sprintSec: 11.7, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-04', name: 'Sneha Reddy', hours: 12, sprintSec: 10.6, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-05', name: 'Vikram Das', hours: 16, sprintSec: 9.8, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-06', name: 'Pooja Nair', hours: 6, sprintSec: 12.3, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-07', name: 'Aditya Verma', hours: 11, sprintSec: 10.9, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-08', name: 'Meera Menon', hours: 9, sprintSec: 11.4, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-09', name: 'Rahul Bose', hours: 15, sprintSec: 9.9, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-10', name: 'Divya Pillai', hours: 7, sprintSec: 11.9, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-11', name: 'Siddharth Rao', hours: 13, sprintSec: 10.4, event: '100m Dash', isAnomalous: false },
    // CORRUPTED OFF-SEASON RECORD 1
    {
      id: 'ATH-12',
      name: 'Harish Kumar',
      hours: 42,
      sprintSec: 25.8,
      event: 'Recreational Fun Run',
      isAnomalous: true,
      batchNote: 'Off-Season Winter Carnival log merged by SYNC-CYCLE-492. Measured in casual footwear on muddy terrain.'
    },
    { id: 'ATH-13', name: 'Tanvi Joshi', hours: 12, sprintSec: 10.7, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-14', name: 'Manoj Patel', hours: 10, sprintSec: 11.1, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-15', name: 'Deepa Krishnan', hours: 14, sprintSec: 10.2, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-16', name: 'Arjun Sen', hours: 5, sprintSec: 12.5, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-17', name: 'Ritu Gupta', hours: 11, sprintSec: 10.8, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-18', name: 'Naveen Kumar', hours: 8, sprintSec: 11.6, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-19', name: 'Swati Balan', hours: 15, sprintSec: 10.0, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-20', name: 'Gautam Nambiar', hours: 7, sprintSec: 12.0, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-21', name: 'Shreya Roy', hours: 13, sprintSec: 10.3, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-22', name: 'Abhishek Roy', hours: 9, sprintSec: 11.5, event: '100m Dash', isAnomalous: false },
    { id: 'ATH-23', name: 'Pavithra S', hours: 16, sprintSec: 9.7, event: '100m Dash', isAnomalous: false },
    // CORRUPTED RECORD 2 (IMPOSSIBLE RECORD)
    {
      id: 'ATH-24',
      name: 'Varun Teja',
      hours: 2,
      sprintSec: 8.8,
      event: 'Varsity 100m Dash',
      isAnomalous: true,
      batchNote: 'Impossible human time (faster than world record 9.58s). Optical timing gate misread false start pulse.'
    },
    { id: 'ATH-25', name: 'Bhavna K', hours: 10, sprintSec: 11.0, event: '100m Dash', isAnomalous: false }
  ];

  return athletes.map(a => ({
    ...a,
    isQuarantined: false
  }));
}
