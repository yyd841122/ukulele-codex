/**
 * @param {{
 *   expectedMidi: number;
 *   detectedMidi: number | null;
 *   cents?: number | null;
 *   confidence?: number;
 *   timingOffsetMs?: number | null;
 * }} event
 */
export function scorePitchEvent({
  expectedMidi,
  detectedMidi,
  cents = null,
  confidence = 0,
  timingOffsetMs = null
}) {
  if (detectedMidi == null || confidence < 0.35) {
    return {
      result: "miss",
      pitchScore: 0,
      rhythmScore: timingOffsetMs == null ? null : scoreTiming(timingOffsetMs)
    };
  }

  const noteDistance = Math.abs(expectedMidi - detectedMidi);
  const centsPenalty = cents == null ? 0 : Math.min(1, Math.abs(cents) / 35);
  const pitchScore = noteDistance === 0 ? Math.round((1 - centsPenalty) * 100) : 0;
  const rhythmScore = timingOffsetMs == null ? null : scoreTiming(timingOffsetMs);

  return {
    result: pitchScore >= 65 && (rhythmScore == null || rhythmScore >= 50) ? "hit" : "miss",
    pitchScore,
    rhythmScore
  };
}

export function scoreTiming(offsetMs) {
  const abs = Math.abs(offsetMs);
  if (abs <= 60) {
    return 100;
  }
  if (abs <= 120) {
    return Math.round(100 - ((abs - 60) / 60) * 50);
  }
  return Math.max(0, Math.round(50 - Math.min(50, (abs - 120) / 3)));
}

export function summarizePracticeEvents(events) {
  if (!events.length) {
    return {
      accuracy: 0,
      averagePitchScore: 0,
      averageRhythmScore: 0,
      completedTargets: 0,
      totalTargets: 0
    };
  }

  const hits = events.filter((event) => event.result === "hit").length;
  const pitchScores = events.map((event) => event.pitchScore ?? 0);
  const rhythmScores = events
    .map((event) => event.rhythmScore)
    .filter((score) => score != null);

  return {
    accuracy: Math.round((hits / events.length) * 100),
    averagePitchScore: average(pitchScores),
    averageRhythmScore: average(rhythmScores),
    completedTargets: hits,
    totalTargets: events.length
  };
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
