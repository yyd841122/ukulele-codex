export function calculateRms(samples) {
  if (!samples.length) {
    return 0;
  }

  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / samples.length);
}

export function estimateNoiseFloor(rmsValues, percentile = 0.2) {
  const values = Array.from(rmsValues)
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.max(0, value))
    .sort((a, b) => a - b);

  if (!values.length) {
    return 0;
  }

  const clampedPercentile = Math.min(1, Math.max(0, percentile));
  const rawIndex = (values.length - 1) * clampedPercentile;
  const lowerIndex = Math.floor(rawIndex);
  const upperIndex = Math.ceil(rawIndex);

  if (lowerIndex === upperIndex) {
    return values[lowerIndex];
  }

  const weight = rawIndex - lowerIndex;
  return values[lowerIndex] * (1 - weight) + values[upperIndex] * weight;
}

export function classifyOnsetFrame({
  rms,
  previousRms = 0,
  noiseFloor = 0,
  thresholdRatio = 3,
  minRms = 0.01
}) {
  const safeRms = Number.isFinite(rms) ? Math.max(0, rms) : 0;
  const safePreviousRms = Number.isFinite(previousRms) ? Math.max(0, previousRms) : 0;
  const safeNoiseFloor = Number.isFinite(noiseFloor) ? Math.max(0, noiseFloor) : 0;
  const safeThresholdRatio = Number.isFinite(thresholdRatio)
    ? Math.max(1, thresholdRatio)
    : 3;
  const safeMinRms = Number.isFinite(minRms) ? Math.max(0, minRms) : 0.01;
  const thresholdRms = Math.max(safeMinRms, safeNoiseFloor * safeThresholdRatio);
  const energyRatio = safeNoiseFloor > 0 ? safeRms / safeNoiseFloor : Infinity;
  const previousWasBelowThreshold = safePreviousRms < thresholdRms;
  const isOnset = safeRms >= thresholdRms && previousWasBelowThreshold;

  return {
    rms: safeRms,
    previousRms: safePreviousRms,
    noiseFloor: safeNoiseFloor,
    thresholdRms,
    energyRatio,
    isOnset
  };
}

export function detectEnergyOnset({
  rms,
  previousRms = 0,
  noiseFloor = 0,
  thresholdRatio = 3,
  minRms = 0.01
}) {
  return classifyOnsetFrame({
    rms,
    previousRms,
    noiseFloor,
    thresholdRatio,
    minRms
  }).isOnset;
}

export function removeDcOffset(samples) {
  if (!samples.length) {
    return new Float32Array();
  }

  let mean = 0;
  for (const sample of samples) {
    mean += sample;
  }
  mean /= samples.length;

  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = samples[i] - mean;
  }
  return out;
}

export function generateSineWave({
  frequencyHz,
  sampleRate = 44100,
  durationSec = 0.12,
  amplitude = 0.8
}) {
  const total = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(total);
  for (let i = 0; i < total; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
  }
  return samples;
}
