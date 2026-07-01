import { useState } from "react";
import { RecordingPresets, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { ensureMicrophoneAccess, type MicrophoneAccessState } from "./expoAudioEngine";

const recorderOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1
};

export type MicrophoneRecorderMonitor = {
  isRecording: boolean;
  canRecord: boolean;
  durationMillis: number;
  metering: number | null;
  level: number;
  uri: string | null;
  isBusy: boolean;
  error: string | null;
  start: () => Promise<MicrophoneAccessState>;
  stop: () => Promise<void>;
};

export function useMicrophoneRecorderMonitor(): MicrophoneRecorderMonitor {
  const recorder = useAudioRecorder(recorderOptions);
  const recorderState = useAudioRecorderState(recorder, 120);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setIsBusy(true);
    setError(null);
    try {
      const access = await ensureMicrophoneAccess();
      if (!access.granted) {
        setError(access.detail);
        return access;
      }

      await recorder.prepareToRecordAsync(recorderOptions);
      recorder.record();
      return access;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "无法启动录音";
      setError(message);
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function stop() {
    setIsBusy(true);
    setError(null);
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法停止录音");
    } finally {
      setIsBusy(false);
    }
  }

  const metering = typeof recorderState.metering === "number" ? recorderState.metering : null;

  return {
    isRecording: recorderState.isRecording,
    canRecord: recorderState.canRecord,
    durationMillis: recorderState.durationMillis,
    metering,
    level: normalizeMetering(metering, recorderState.isRecording),
    uri: recorderState.url,
    isBusy,
    error,
    start,
    stop
  };
}

function normalizeMetering(metering: number | null, isRecording: boolean) {
  if (metering == null) {
    return isRecording ? 0.28 : 0;
  }

  // Native platforms usually report dB values around -160..0.
  if (metering <= 0) {
    return Math.max(0, Math.min(1, (metering + 60) / 60));
  }

  // Web or future adapters may expose an already-positive scalar.
  return Math.max(0, Math.min(1, metering));
}
