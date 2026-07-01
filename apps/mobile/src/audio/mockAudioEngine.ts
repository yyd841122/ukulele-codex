import { createDetectedTunerFrame, type TunerFrame, type TuningString } from "./tunerFrame";

export const defaultMockTuningOffsets = [-8.4, 0.8, -2.6, 3.1];

export function createMockTunerFrame(
  tuningStrings: TuningString[],
  selectedIndex: number,
  offsets = defaultMockTuningOffsets
): TunerFrame {
  const target = tuningStrings[selectedIndex] ?? tuningStrings[0];
  const offset = offsets[selectedIndex] ?? 0;
  const detectedFrequencyHz = frequencyFromCents(target.frequencyHz, offset);
  const frame = createDetectedTunerFrame(tuningStrings, selectedIndex, {
    frequencyHz: detectedFrequencyHz
  }, "mock");

  if (!frame) {
    throw new Error(`Unable to create mock tuner frame for ${target.note}`);
  }

  return frame;
}

export function frequencyFromCents(targetHz: number, cents: number) {
  return targetHz * 2 ** (cents / 1200);
}
