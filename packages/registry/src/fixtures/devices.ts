export function mockDevice(
  kind: MediaDeviceKind,
  label: string,
  deviceId: string,
): MediaDeviceInfo {
  return {
    deviceId,
    groupId: "mock-group",
    kind,
    label,
    toJSON: () => ({ deviceId, kind, label }),
  } as MediaDeviceInfo;
}

export const MOCK_MICS = [
  mockDevice("audioinput", "MacBook Pro Microphone", "mic-builtin"),
  mockDevice("audioinput", "AirPods Pro", "mic-airpods"),
  mockDevice("audioinput", "Shure MV7", "mic-shure"),
];

export const MOCK_SPEAKERS = [
  mockDevice("audiooutput", "MacBook Pro Speakers", "spk-builtin"),
  mockDevice("audiooutput", "AirPods Pro", "spk-airpods"),
];

export const MOCK_CAMERAS = [
  mockDevice("videoinput", "FaceTime HD Camera", "cam-builtin"),
  mockDevice("videoinput", "Logitech Brio", "cam-brio"),
];
