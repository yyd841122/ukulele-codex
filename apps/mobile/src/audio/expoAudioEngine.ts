import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type PermissionResponse
} from "expo-audio";

export type MicrophoneAccessState = {
  status: "unknown" | "undetermined" | "granted" | "denied";
  granted: boolean;
  canAskAgain: boolean;
  label: string;
  detail: string;
  mode: "mock" | "ready";
};

export const initialMicrophoneAccessState: MicrophoneAccessState = {
  status: "unknown",
  granted: false,
  canAskAgain: true,
  label: "未检查",
  detail: "当前使用模拟拾音",
  mode: "mock"
};

export async function getMicrophonePermissionState(): Promise<MicrophoneAccessState> {
  try {
    return mapPermissionResponse(await getRecordingPermissionsAsync());
  } catch (error) {
    return {
      ...initialMicrophoneAccessState,
      label: "权限不可用",
      detail: error instanceof Error ? error.message : "当前平台暂不支持读取麦克风权限"
    };
  }
}

export async function ensureMicrophoneAccess(): Promise<MicrophoneAccessState> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true
    });

    const current = await getRecordingPermissionsAsync();
    if (current.granted) {
      return mapPermissionResponse(current);
    }

    return mapPermissionResponse(await requestRecordingPermissionsAsync());
  } catch (error) {
    return {
      ...initialMicrophoneAccessState,
      label: "授权失败",
      detail: error instanceof Error ? error.message : "无法请求麦克风权限"
    };
  }
}

function mapPermissionResponse(response: PermissionResponse): MicrophoneAccessState {
  if (response.granted) {
    return {
      status: "granted",
      granted: true,
      canAskAgain: response.canAskAgain,
      label: "麦克风已授权",
      detail: "可读取真实麦克风电平，下一步接 Native PCM 驱动 PitchFrame",
      mode: "ready"
    };
  }

  const status = response.status === "denied" ? "denied" : "undetermined";
  return {
    status,
    granted: false,
    canAskAgain: response.canAskAgain,
    label: status === "denied" ? "麦克风被拒绝" : "等待授权",
    detail: response.canAskAgain ? "授权后可进入真实拾音流程" : "请在系统设置中开启麦克风权限",
    mode: "mock"
  };
}
