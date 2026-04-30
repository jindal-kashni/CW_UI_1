let hasUnsavedAuditorSettings = false;

export function setAuditorSettingsDirty(value: boolean) {
  hasUnsavedAuditorSettings = value;
}

export function getAuditorSettingsDirty() {
  return hasUnsavedAuditorSettings;
}
