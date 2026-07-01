import { centsBetween } from "./note.js";

export const DEFAULT_TUNER_THRESHOLDS = {
  inTuneCents: 8,
  actionCents: 12,
  maxMatchCents: 120
};

export function matchTuningString(frequencyHz, tuningStrings, options = {}) {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return null;
  }

  const maxCents = options.maxCents ?? options.maxMatchCents ?? DEFAULT_TUNER_THRESHOLDS.maxMatchCents;
  let best = null;

  for (const string of tuningStrings) {
    const cents = centsBetween(frequencyHz, string.frequencyHz);
    const distance = Math.abs(cents);
    if (distance <= maxCents && (!best || distance < best.distanceCents)) {
      best = {
        string,
        cents,
        distanceCents: distance,
        status: classifyTuning(cents)
      };
    }
  }

  return best;
}

export function classifyTuning(cents) {
  return classifyTuningWithThresholds(cents);
}

export function classifyTuningWithThresholds(cents, options = {}) {
  if (!Number.isFinite(cents)) {
    return "unknown";
  }

  const inTuneCents = options.inTuneCents ?? DEFAULT_TUNER_THRESHOLDS.inTuneCents;
  const actionCents = options.actionCents ?? DEFAULT_TUNER_THRESHOLDS.actionCents;
  const abs = Math.abs(cents);
  if (abs <= inTuneCents) {
    return "in-tune";
  }
  if (abs <= actionCents) {
    return "close";
  }
  return cents < 0 ? "flat" : "sharp";
}

export function createTunerFrameFromFrequency(frequencyHz, tuningStrings, options = {}) {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0 || !Array.isArray(tuningStrings) || !tuningStrings.length) {
    return null;
  }

  const matched = matchTuningString(frequencyHz, tuningStrings, options);
  const target = options.targetString ?? tuningStrings[options.targetIndex] ?? matched?.string ?? tuningStrings[0];
  if (!target || !Number.isFinite(target.frequencyHz) || target.frequencyHz <= 0) {
    return null;
  }

  const cents = centsBetween(frequencyHz, target.frequencyHz);
  if (!Number.isFinite(cents)) {
    return null;
  }

  return {
    source: options.source ?? "detected",
    timestampMs: options.timestampMs ?? Date.now(),
    target,
    matchedString: matched?.string ?? null,
    detectedFrequencyHz: frequencyHz,
    cents,
    confidence: options.confidence ?? matched?.confidence ?? confidenceFromCents(cents),
    status: classifyTuningWithThresholds(cents, options),
    distanceCents: Math.abs(cents)
  };
}

export function medianCents(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function confidenceFromCents(cents) {
  const distance = Math.abs(cents);
  if (distance <= DEFAULT_TUNER_THRESHOLDS.inTuneCents) return 0.96;
  if (distance <= DEFAULT_TUNER_THRESHOLDS.actionCents) return 0.88;
  return 0.72;
}
