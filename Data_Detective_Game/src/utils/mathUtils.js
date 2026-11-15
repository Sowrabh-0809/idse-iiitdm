/**
 * Statistically verified calculation utilities for Data Detective.
 * Tested against standard mathematical definitions.
 */

/**
 * Calculates the arithmetic mean of an array of numbers.
 * @param {number[]} numbers
 * @returns {number}
 */
export function calculateMean(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return sum / numbers.length;
}

/**
 * Calculates the median of an array of numbers.
 * @param {number[]} numbers
 * @returns {number}
 */
export function calculateMedian(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const sorted = [...numbers].map(Number).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculates the mode(s) of an array of numbers.
 * Returns the array of most frequent values, or the first value if unique.
 * @param {number[]} numbers
 * @returns {number[]}
 */
export function calculateMode(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return [];
  const freqMap = new Map();
  let maxFreq = 0;

  for (const n of numbers) {
    const val = Number(n);
    const count = (freqMap.get(val) || 0) + 1;
    freqMap.set(val, count);
    if (count > maxFreq) {
      maxFreq = count;
    }
  }

  const modes = [];
  freqMap.forEach((count, val) => {
    if (count === maxFreq) {
      modes.push(val);
    }
  });

  return modes.sort((a, b) => a - b);
}

/**
 * Calculates population variance.
 * @param {number[]} numbers
 * @returns {number}
 */
export function calculateVariance(numbers) {
  if (!Array.isArray(numbers) || numbers.length < 2) return 0;
  const mean = calculateMean(numbers);
  const sumSquaredDiff = numbers.reduce((acc, val) => acc + Math.pow(Number(val) - mean, 2), 0);
  return sumSquaredDiff / numbers.length;
}

/**
 * Calculates standard deviation.
 * @param {number[]} numbers
 * @returns {number}
 */
export function calculateStdDev(numbers) {
  return Math.sqrt(calculateVariance(numbers));
}

/**
 * Calculates Pearson Correlation Coefficient (r) between two series.
 * @param {number[]} x
 * @param {number[]} y
 * @returns {number} r in range [-1, 1]
 */
export function calculateCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    return 0;
  }
  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = Number(x[i]) - meanX;
    const dy = Number(y[i]) - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculates Simple Ordinary Least Squares Linear Regression: y = m*x + c
 * @param {number[]} x
 * @param {number[]} y
 * @returns {{ slope: number, intercept: number, rValue: number, rSquared: number, mae: number, predict: (xi: number) => number }}
 */
export function calculateLinearRegression(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    return {
      slope: 0,
      intercept: 0,
      rValue: 0,
      rSquared: 0,
      mae: 0,
      predict: () => 0
    };
  }

  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = Number(x[i]) - meanX;
    const dy = Number(y[i]) - meanY;
    num += dx * dy;
    den += dx * dx;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const rValue = calculateCorrelation(x, y);
  const rSquared = Math.pow(rValue, 2);

  const predict = (xi) => slope * xi + intercept;

  let totalAbsErr = 0;
  for (let i = 0; i < n; i++) {
    const yHat = predict(Number(x[i]));
    totalAbsErr += Math.abs(Number(y[i]) - yHat);
  }
  const mae = totalAbsErr / n;

  return {
    slope,
    intercept,
    rValue,
    rSquared,
    mae,
    predict
  };
}

/**
 * Calculates Confusion Matrix and Classification Metrics for binary predictions.
 * @param {number[]} actuals - 1 or 0
 * @param {number[]} predictions - 1 or 0
 * @returns {{ tp: number, fp: number, tn: number, fn: number, accuracy: number, precision: number, recall: number, f1: number }}
 */
export function calculateConfusionMatrix(actuals, predictions) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < actuals.length; i++) {
    const act = Number(actuals[i]);
    const pred = Number(predictions[i]);

    if (act === 1 && pred === 1) tp++;
    else if (act === 0 && pred === 1) fp++;
    else if (act === 0 && pred === 0) tn++;
    else if (act === 1 && pred === 0) fn++;
  }

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { tp, fp, tn, fn, accuracy, precision, recall, f1 };
}

