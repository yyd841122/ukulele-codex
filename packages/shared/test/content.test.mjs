import assert from "node:assert/strict";
import test from "node:test";
import {
  agentRoles,
  beginnerChords,
  chordLoopPractice,
  designTokens,
  m0AgentTasks,
  ukuleleInstrument
} from "../src/index.js";

test("standard ukulele tuning has four strings", () => {
  assert.deepEqual(
    ukuleleInstrument.tunings[0].strings.map((string) => string.note),
    ["G4", "C4", "E4", "A4"]
  );
});

test("MVP chord loop uses beginner chords", () => {
  const chordNames = new Set(beginnerChords.map((chord) => chord.name));
  for (const target of chordLoopPractice.targets) {
    assert.ok(chordNames.has(target.chord));
  }
});

test("M0 agent backlog has pending microphone integration", () => {
  assert.ok(agentRoles.some((role) => role.id === "audio-dsp"));
  assert.ok(m0AgentTasks.some((task) => task.id === "M0-004" && task.status === "pending"));
});

test("design tokens define accessible touch target minimum", () => {
  assert.equal(designTokens.component.touchTarget.minSize, 44);
});
