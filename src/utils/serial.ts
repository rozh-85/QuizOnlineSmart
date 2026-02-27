import { EMAIL_DOMAIN } from '../constants/app';

// =====================================================
// Serial ID / email utilities
// =====================================================

export const cleanSerialId = (raw: string): string => {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

export const serialIdToEmail = (serialId: string): string => {
  return `${cleanSerialId(serialId)}${EMAIL_DOMAIN}`;
};

export const extractSerialFromInput = (input: string): string => {
  let raw = input.trim();
  if (raw.includes('@')) {
    raw = raw.split('@')[0];
  }
  return cleanSerialId(raw);
};
