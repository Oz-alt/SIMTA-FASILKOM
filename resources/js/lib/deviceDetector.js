export const UI_MODE_STORAGE_KEY = 'simta_ui_mode';
export const MOBILE_BREAKPOINT_PX = 768;

/**
 * Detect device operating system and mobile viewport state.
 * Accepts optional overrides for deterministic Node/unit testing.
 */
export function detectDeviceInfo(overrides = {}) {
  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';

  const rawUserAgent =
    overrides.userAgent !== undefined
      ? overrides.userAgent
      : hasNavigator
        ? navigator.userAgent || navigator.vendor || ''
        : '';

  const platform =
    overrides.platform !== undefined
      ? overrides.platform
      : hasNavigator
        ? navigator.platform || ''
        : '';

  const maxTouchPoints =
    overrides.maxTouchPoints !== undefined
      ? Number(overrides.maxTouchPoints)
      : hasNavigator
        ? Number(navigator.maxTouchPoints || 0)
        : 0;

  const userAgentData =
    overrides.userAgentData !== undefined
      ? overrides.userAgentData
      : hasNavigator
        ? navigator.userAgentData
        : undefined;

  const innerWidth =
    overrides.innerWidth !== undefined
      ? Number(overrides.innerWidth)
      : hasWindow
        ? Number(window.innerWidth || 0)
        : 1280;

  const ua = String(rawUserAgent || '').toLowerCase();

  let os = 'desktop';
  if (/iphone|ipad|ipod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
    os = 'ios';
  } else if (/android/.test(ua)) {
    os = 'android';
  } else if (
    /webos|blackberry|iemobile|opera mini|windows phone|mobile/.test(ua) ||
    Boolean(userAgentData?.mobile)
  ) {
    os = 'mobile_other';
  }

  const isPhysicalMobile = os === 'android' || os === 'ios' || os === 'mobile_other';
  const isNarrowViewport = innerWidth > 0 && innerWidth < MOBILE_BREAKPOINT_PX;

  const osLabels = {
    android: 'Android',
    ios: 'iOS',
    mobile_other: 'Mobile',
    desktop: 'Desktop',
  };

  return {
    os,
    osLabel: osLabels[os] || 'Desktop',
    isAndroid: os === 'android',
    isIOS: os === 'ios',
    isPhysicalMobile,
    isNarrowViewport,
    innerWidth,
  };
}

/**
 * Determine whether the dedicated Mobile UI shell should be active.
 */
export function resolveIsMobileMode({ isPhysicalMobile, isNarrowViewport, viewPreference = 'auto' }) {
  if (viewPreference === 'mobile') {
    return true;
  }
  if (viewPreference === 'desktop') {
    return false;
  }
  return Boolean(isPhysicalMobile || isNarrowViewport);
}

/**
 * Read saved UI mode preference safely from localStorage.
 */
export function readStoredUiPreference() {
  if (typeof window === 'undefined') {
    return 'auto';
  }
  try {
    const stored = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
    if (stored === 'mobile' || stored === 'desktop' || stored === 'auto') {
      return stored;
    }
  } catch {
    // Ignore storage read errors (e.g. strict privacy modes)
  }
  return 'auto';
}

