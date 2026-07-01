const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToFrequency(midi, concertA = 440) {
  return concertA * 2 ** ((midi - 69) / 12);
}

export function frequencyToMidi(frequencyHz, concertA = 440) {
  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    return null;
  }

  return 69 + 12 * Math.log2(frequencyHz / concertA);
}

export function midiToNoteName(midi) {
  if (!Number.isFinite(midi)) {
    return null;
  }

  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  const note = NOTE_NAMES[((rounded % 12) + 12) % 12];
  return `${note}${octave}`;
}

export function noteNameToMidi(noteName) {
  const match = /^([A-G])(#|b)?(-?\d+)$/.exec(noteName);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const [, letter, accidental = "", octaveText] = match;
  const normalized = `${letter}${accidental}`;
  const semitone = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11
  }[normalized];

  if (semitone === undefined) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  return (Number(octaveText) + 1) * 12 + semitone;
}

export function centsBetween(frequencyHz, targetFrequencyHz) {
  if (frequencyHz <= 0 || targetFrequencyHz <= 0) {
    return null;
  }

  return 1200 * Math.log2(frequencyHz / targetFrequencyHz);
}

export function nearestNote(frequencyHz, concertA = 440) {
  const midi = frequencyToMidi(frequencyHz, concertA);
  if (midi == null) {
    return {
      midi: null,
      noteName: null,
      targetFrequencyHz: null,
      cents: null
    };
  }

  const roundedMidi = Math.round(midi);
  const targetFrequencyHz = midiToFrequency(roundedMidi, concertA);
  return {
    midi: roundedMidi,
    noteName: midiToNoteName(roundedMidi),
    targetFrequencyHz,
    cents: centsBetween(frequencyHz, targetFrequencyHz)
  };
}
