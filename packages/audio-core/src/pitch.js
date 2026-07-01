import { nearestNote } from "./note.js";
import { calculateRms, removeDcOffset } from "./signal.js";

const DEFAULT_OPTIONS = {
  minFrequencyHz: 70,
  maxFrequencyHz: 1200,
  silenceRms: 0.01,
  threshold: 0.15
};

export function detectPitch(samples, sampleRate, options = {}) {
  const mpm = detectPitchMpm(samples, sampleRate, options);
  if (mpm.frequencyHz != null && mpm.confidence >= 0.78) {
    return mpm;
  }

  const yin = detectPitchYin(samples, sampleRate, options);
  return yin.frequencyHz != null ? yin : mpm;
}

export function detectPitchMpm(samples, sampleRate, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const rms = calculateRms(samples);
  if (rms < config.silenceRms) {
    return emptyPitch("mpm", rms);
  }

  const clean = removeDcOffset(samples);
  const tauMin = Math.max(2, Math.floor(sampleRate / config.maxFrequencyHz));
  const tauMax = Math.min(clean.length - 1, Math.ceil(sampleRate / config.minFrequencyHz));
  const nsdf = new Float32Array(tauMax + 1);

  for (let tau = 0; tau <= tauMax; tau += 1) {
    let acf = 0;
    let divisor = 0;
    for (let i = 0; i < clean.length - tau; i += 1) {
      const x = clean[i];
      const y = clean[i + tau];
      acf += x * y;
      divisor += x * x + y * y;
    }
    nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
  }

  const peaks = [];
  for (let tau = tauMin + 1; tau < tauMax - 1; tau += 1) {
    const isPeak = nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1];
    if (isPeak && nsdf[tau] > config.threshold) {
      peaks.push({ tau, value: nsdf[tau] });
    }
  }

  if (!peaks.length) {
    return emptyPitch("mpm", rms);
  }

  const highestValue = Math.max(...peaks.map((peak) => peak.value));
  const cutoff = Math.max(config.threshold, highestValue * 0.9);
  const bestPeak = peaks.find((peak) => peak.value >= cutoff) ?? peaks[0];
  const bestTau = bestPeak.tau;
  const bestValue = bestPeak.value;
  const refinedTau = parabolicPeak(nsdf, bestTau);
  return formatPitch(sampleRate / refinedTau, Math.max(0, Math.min(1, bestValue)), "mpm", rms);
}

export function detectPitchYin(samples, sampleRate, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const rms = calculateRms(samples);
  if (rms < config.silenceRms) {
    return emptyPitch("yin", rms);
  }

  const clean = removeDcOffset(samples);
  const tauMin = Math.max(2, Math.floor(sampleRate / config.maxFrequencyHz));
  const tauMax = Math.min(clean.length - 1, Math.ceil(sampleRate / config.minFrequencyHz));
  const difference = new Float32Array(tauMax + 1);
  const cmndf = new Float32Array(tauMax + 1);

  for (let tau = 1; tau <= tauMax; tau += 1) {
    let sum = 0;
    for (let i = 0; i < clean.length - tau; i += 1) {
      const delta = clean[i] - clean[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau += 1) {
    runningSum += difference[tau];
    cmndf[tau] = runningSum === 0 ? 1 : (difference[tau] * tau) / runningSum;
  }

  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau += 1) {
    if (cmndf[tau] < config.threshold) {
      while (tau + 1 <= tauMax && cmndf[tau + 1] < cmndf[tau]) {
        tau += 1;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate < 0) {
    return emptyPitch("yin", rms);
  }

  const refinedTau = parabolicValley(cmndf, tauEstimate);
  const confidence = 1 - cmndf[tauEstimate];
  return formatPitch(sampleRate / refinedTau, Math.max(0, Math.min(1, confidence)), "yin", rms);
}

function parabolicPeak(values, index) {
  if (index <= 0 || index >= values.length - 1) {
    return index;
  }

  const left = values[index - 1];
  const center = values[index];
  const right = values[index + 1];
  const denominator = left - 2 * center + right;
  if (Math.abs(denominator) < 1e-12) {
    return index;
  }

  return index + 0.5 * (left - right) / denominator;
}

function parabolicValley(values, index) {
  if (index <= 0 || index >= values.length - 1) {
    return index;
  }

  const left = values[index - 1];
  const center = values[index];
  const right = values[index + 1];
  const denominator = left - 2 * center + right;
  if (Math.abs(denominator) < 1e-12) {
    return index;
  }

  return index - 0.5 * (left - right) / denominator;
}

function formatPitch(frequencyHz, confidence, algorithm, rms) {
  const note = nearestNote(frequencyHz);
  return {
    frequencyHz,
    confidence,
    algorithm,
    rms,
    ...note
  };
}

function emptyPitch(algorithm, rms) {
  return {
    frequencyHz: null,
    confidence: 0,
    algorithm,
    rms,
    midi: null,
    noteName: null,
    targetFrequencyHz: null,
    cents: null
  };
}
