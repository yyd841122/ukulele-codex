import { useCallback, useRef, useState } from "react";
import { detectPitch } from "@ukulele/audio-core";
import { useAudioStream, type AudioStreamBuffer } from "expo-audio";
import { ensureMicrophoneAccess, type MicrophoneAccessState } from "./expoAudioEngine";
import { createDetectedTunerFrame, type TunerFrame, type TuningString } from "./tunerFrame";

export type RealtimeTunerStream = {
  frame: TunerFrame | null;
  level: number;
  isStreaming: boolean;
  isBusy: boolean;
  error: string | null;
  access: MicrophoneAccessState | null;
  start: () => Promise<MicrophoneAccessState | null>;
  stop: () => void;
};

const streamOptions = {
  sampleRate: 44100,
  channels: 1,
  encoding: "float32" as const
};

export function useRealtimeTunerStream(
  tuningStrings: TuningString[],
  selectedIndex: number
): RealtimeTunerStream {
  const [frame, setFrame] = useState<TunerFrame | null>(null);
  const [level, setLevel] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<MicrophoneAccessState | null>(null);
  const lastProcessedAtRef = useRef(0);

  const handleBuffer = useCallback(
    (buffer: AudioStreamBuffer) => {
      if (buffer.timestamp - lastProcessedAtRef.current < 0.1) return;
      lastProcessedAtRef.current = buffer.timestamp;

      const samples = audioStreamBufferToFloat32(buffer);
      if (samples.length < 1024) return;

      const pitch = detectPitch(samples, buffer.sampleRate, {
        minFrequencyHz: 70,
        maxFrequencyHz: 1200,
        silenceRms: 0.012,
        threshold: 0.15
      });

      setLevel(Math.max(0, Math.min(1, (pitch.rms ?? 0) / 0.12)));
      setFrame(
        createDetectedTunerFrame(tuningStrings, selectedIndex, {
          frequencyHz: pitch.frequencyHz,
          confidence: pitch.confidence,
          timestampMs: buffer.timestamp * 1000
        })
      );
    },
    [selectedIndex, tuningStrings]
  );

  const { stream, isStreaming } = useAudioStream({
    ...streamOptions,
    onBuffer: handleBuffer
  });

  async function start() {
    setIsBusy(true);
    setError(null);
    try {
      const nextAccess = await ensureMicrophoneAccess();
      setAccess(nextAccess);
      if (!nextAccess.granted) {
        setError(nextAccess.detail);
        return nextAccess;
      }

      const maybeStream = stream as unknown as { start?: () => Promise<void> } | null;
      if (!maybeStream?.start) {
        setError("当前平台暂不支持 expo-audio 实时 PCM 流，请使用真机 development build 验证。");
        return nextAccess;
      }

      await maybeStream.start();
      return nextAccess;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "无法启动实时 PitchFrame";
      setError(message);
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  function stop() {
    const maybeStream = stream as unknown as { stop?: () => void } | null;
    maybeStream?.stop?.();
    setFrame(null);
    setLevel(0);
  }

  return {
    frame,
    level,
    isStreaming,
    isBusy,
    error,
    access,
    start,
    stop
  };
}

function audioStreamBufferToFloat32(buffer: AudioStreamBuffer) {
  const encoding = (buffer as AudioStreamBuffer & { encoding?: string }).encoding;
  const source = encoding === "int16"
    ? int16PcmToFloat32(buffer.data)
    : new Float32Array(buffer.data);
  if (buffer.channels <= 1) {
    return source;
  }

  const mono = new Float32Array(Math.floor(source.length / buffer.channels));
  for (let i = 0; i < mono.length; i += 1) {
    mono[i] = source[i * buffer.channels];
  }
  return mono;
}

function int16PcmToFloat32(data: ArrayBuffer) {
  const input = new Int16Array(data);
  const output = new Float32Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    output[index] = Math.max(-1, Math.min(1, input[index] / 32768));
  }
  return output;
}
