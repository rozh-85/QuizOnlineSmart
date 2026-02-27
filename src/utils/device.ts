import { STORAGE_KEYS } from '../constants/storage';

export const getDeviceFingerprint = (): string => {
  let fingerprint = localStorage.getItem(STORAGE_KEYS.DEVICE_FINGERPRINT);
  
  if (!fingerprint) {
    // Generate a simple unique fingerprint
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const userAgent = navigator.userAgent;
    const random = Math.random().toString(36).substring(2, 15);
    
    // In a real app, you'd use a more robust fingerprinting library
    // but a generated UUID saved to localStorage is often sufficient for "device lock"
    fingerprint = btoa(`${screenRes}-${userAgent}-${random}-${Date.now()}`).substring(0, 32);
    localStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);
  }
  
  return fingerprint;
};
