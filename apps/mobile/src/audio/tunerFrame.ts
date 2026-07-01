import { createTunerFrameFromFrequency } from "@ukulele/audio-core";

export type TuningString = {
  index: number;
  name: string;
  note: string;
  midi: number;
  frequencyHz: number;
};

export type TunerFrameStatus = "in-tune" | "close" | "flat" | "sharp" | "unknown";

export type TunerFrameSource = "mock" | "detected";

export type TunerFrame = {
  source: TunerFrameSource;
  timestampMs: number;
  target: TuningString;
  matchedString: TuningString | null;
  detectedFrequencyHz: number;
  cents: number;
  confidence: number;
  status: TunerFrameStatus;
  distanceCents: number;
};

export type DetectedPitchInput = {
  frequencyHz: number | null;
  confidence?: number;
  timestampMs?: number;
};

export function createDetectedTunerFrame(
  tuningStrings: TuningString[],
  selectedIndex: number,
  input: DetectedPitchInput,
  source: TunerFrameSource = "detected"
): TunerFrame | null {
  if (input.frequencyHz == null) {
    return null;
  }

  return createTunerFrameFromFrequency(input.frequencyHz, tuningStrings, {
    confidence: input.confidence,
    source,
    targetIndex: selectedIndex,
    timestampMs: input.timestampMs
  }) as TunerFrame | null;
}
