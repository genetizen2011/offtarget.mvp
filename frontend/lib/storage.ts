const STORAGE_BLOCKED_MESSAGE =
  "Saves unavailable — try disabling private browsing mode.";
export const STORAGE_BLOCKED_EVENT = "offtarget:local-storage-blocked";
export const SAVED_ANALYSES_STORAGE_KEY = "offTarget_saved";
export const AUTH_TOKEN_STORAGE_KEY = "offTarget_authToken";
export const PENDING_RELOAD_STORAGE_KEY = "offTarget_pendingReload";

export function getStorageBlockedMessage() {
  return STORAGE_BLOCKED_MESSAGE;
}

function notifyStorageBlocked() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STORAGE_BLOCKED_EVENT));
}

export function getLocalStorageItem(key: string, onError?: () => void) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}".`, error);
    notifyStorageBlocked();
    onError?.();
    return null;
  }
}

export function setLocalStorageItem(key: string, value: string, onError?: () => void) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Unable to write localStorage key "${key}".`, error);
    notifyStorageBlocked();
    onError?.();
    return false;
  }
}

export function removeLocalStorageItem(key: string, onError?: () => void) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Unable to remove localStorage key "${key}".`, error);
    notifyStorageBlocked();
    onError?.();
    return false;
  }
}
