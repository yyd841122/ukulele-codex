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

export function expectedBeatTimeMs({ startedAtMs, bpm, beatIndex }) {
  return startedAtMs + beatIndex * (60000 / bpm);
}

export function calculateTimingOffsetMs({ eventTimeMs, startedAtMs, bpm, beatIndex }) {
  return eventTimeMs - expectedBeatTimeMs({ startedAtMs, bpm, beatIndex });
}

export function scoreRhythmEvent({ eventTimeMs, startedAtMs, bpm, beatIndex }) {
  const expectedTimeMs = expectedBeatTimeMs({ startedAtMs, bpm, beatIndex });
  const timingOffsetMs = eventTimeMs - expectedTimeMs;
  const rhythmScore = scoreTiming(timingOffsetMs);

  return {
    eventTimeMs,
    expectedTimeMs,
    timingOffsetMs,
    rhythmScore,
    timingStatus: classifyTimingOffset(timingOffsetMs)
  };
}

export function summarizeRhythmEvents(events) {
  if (!events.length) {
    return {
      averageRhythmScore: 0,
      earlyCount: 0,
      lateCount: 0,
      onTimeCount: 0,
      suggestion: "Start practicing to build a rhythm baseline."
    };
  }

  const scoredEvents = events.map((event) => {
    const rhythmScore = event.rhythmScore ?? scoreTiming(event.timingOffsetMs);
    const timingStatus = event.timingStatus ?? classifyTimingOffset(event.timingOffsetMs);
    return { rhythmScore, timingStatus };
  });

  const earlyCount = scoredEvents.filter((event) => event.timingStatus === "early").length;
  const lateCount = scoredEvents.filter((event) => event.timingStatus === "late").length;
  const onTimeCount = scoredEvents.filter((event) => event.timingStatus === "on-time").length;

  return {
    averageRhythmScore: average(scoredEvents.map((event) => event.rhythmScore)),
    earlyCount,
    lateCount,
    onTimeCount,
    suggestion: rhythmSuggestion({ earlyCount, lateCount, onTimeCount })
  };
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

function classifyTimingOffset(offsetMs) {
  if (offsetMs < -60) {
    return "early";
  }
  if (offsetMs > 60) {
    return "late";
  }
  return "on-time";
}

function rhythmSuggestion({ earlyCount, lateCount, onTimeCount }) {
  if (onTimeCount >= earlyCount + lateCount) {
    return "Timing is steady. Keep locking into the beat.";
  }
  if (earlyCount > lateCount) {
    return "You tend to play early. Wait a little longer before finishing the beat.";
  }
  if (lateCount > earlyCount) {
    return "You tend to play late. Prepare the next beat a little sooner.";
  }
  return "Rhythm is mixed. Slow the tempo down and aim for consistent beat placement.";
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
