import { setAudioModeAsync } from "expo-audio";

export type BeatSoundKind = "accent" | "light";

type WebAudioGlobal = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let webAudioContext: AudioContext | null = null;

export async function preparePracticeBeatAudio(): Promise<"ready" | "web-ready" | "unavailable"> {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true
    });
  } catch {
    // Web Audio below can still work even when the native audio session is unavailable.
  }

  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) {
    return "unavailable";
  }

  if (!webAudioContext) {
    webAudioContext = new AudioContextClass();
  }

  const context = webAudioContext;
  if (context.state === "suspended") {
    await context.resume();
  }

  return "web-ready";
}

export async function playPracticeBeatClick(kind: BeatSoundKind): Promise<void> {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return;

  if (!webAudioContext) {
    webAudioContext = new AudioContextClass();
  }

  const context = webAudioContext;
  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const isAccent = kind === "accent";

  oscillator.type = isAccent ? "triangle" : "sine";
  oscillator.frequency.value = isAccent ? 1320 : 880;
  gain.gain.setValueAtTime(isAccent ? 0.28 : 0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isAccent ? 0.075 : 0.055));

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (isAccent ? 0.08 : 0.06));
}

function getAudioContextClass() {
  const audioGlobal = globalThis as WebAudioGlobal;
  return audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
}
