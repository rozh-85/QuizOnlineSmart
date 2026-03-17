import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const FINGERPRINT_KEY = 'device_fingerprint';

export const getDeviceFingerprint = async (): Promise<string> => {
  let fingerprint = await SecureStore.getItemAsync(FINGERPRINT_KEY);

  if (!fingerprint) {
    const deviceName = Device.deviceName || 'unknown';
    const brand = Device.brand || 'unknown';
    const model = Device.modelName || 'unknown';
    const os = Platform.OS;
    const osVersion = Platform.Version;
    const appId = Application.applicationId || 'mobile';
    const random = Math.random().toString(36).substring(2, 15);

    const raw = `${brand}-${model}-${deviceName}-${os}-${osVersion}-${appId}-${random}-${Date.now()}`;
    // Base64-like encoding
    fingerprint = raw.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

    await SecureStore.setItemAsync(FINGERPRINT_KEY, fingerprint);
  }

  return fingerprint;
};
