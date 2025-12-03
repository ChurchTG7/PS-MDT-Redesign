/**
 * Configuration helpers for PS-MDT
 * Stores settings like debug mode toggles
 */

// Debug Mode - shows additional debug info
export function getDebugEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem('ps-mdt:debug');
    return stored === 'true';
  } catch {}
  return false;
}

export function setDebugEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem('ps-mdt:debug', enabled ? 'true' : 'false');
  } catch {}
}
