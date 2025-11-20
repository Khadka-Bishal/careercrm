
export interface AppConfig {
  googleClientId: string;
  geminiApiKey: string;
  lastSyncTimestamp: number;
}

// Default state
export const appConfig: AppConfig = {
  googleClientId: '',
  geminiApiKey: '',
  lastSyncTimestamp: 0
};

export const setAppConfig = (config: Partial<AppConfig>) => {
  Object.assign(appConfig, config);
};

export const loadConfigFromStorage = () => {
  const stored = localStorage.getItem('career_crm_config');
  if (stored) {
    const parsed = JSON.parse(stored);
    setAppConfig(parsed);
    return true;
  }
  return false;
};

export const saveConfigToStorage = () => {
  localStorage.setItem('career_crm_config', JSON.stringify(appConfig));
};
