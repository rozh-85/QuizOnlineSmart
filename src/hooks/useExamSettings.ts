import { useState, useEffect, useRef } from 'react';
import { examSettingsApi } from '../api/examSettingsApi';
import type { ExamSettings } from '../types/examBuilder';

const DEFAULT_SETTINGS: ExamSettings = {
  subject: '',
  department: '',
  college: '',
  date: '',
  time_allowed: '',
  header_enabled: true,
  footer_enabled: true,
};

export function useExamSettings() {
  const [settings, setSettings] = useState<ExamSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load persisted settings
  useEffect(() => {
    (async () => {
      try {
        const d = await examSettingsApi.getLatest();
        if (d) {
          setSettings({
            id: d.id,
            subject: d.subject || '',
            department: d.department || '',
            college: d.college || '',
            date: d.date || '',
            time_allowed: d.time_allowed || '',
            header_enabled: d.header_enabled ?? true,
            footer_enabled: d.footer_enabled ?? true,
          });
        }
      } catch (e) {
        console.error('Failed to load exam settings:', e);
      } finally {
        setSettingsLoaded(true);
      }
    })();
  }, []);

  // Debounced save
  const persistSettings = (newSettings: ExamSettings) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await examSettingsApi.upsert(newSettings);
        if (result && !newSettings.id) {
          setSettings(prev => ({ ...prev, id: result.id }));
        }
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }, 800);
  };

  const updateSetting = <K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      persistSettings(next);
      return next;
    });
  };

  return {
    settings,
    settingsLoaded,
    settingsOpen,
    setSettingsOpen,
    updateSetting,
  };
}
