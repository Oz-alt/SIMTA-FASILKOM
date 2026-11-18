import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  UI_MODE_STORAGE_KEY,
  detectDeviceInfo,
  readStoredUiPreference,
  resolveIsMobileMode,
} from '../lib/deviceDetector';

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const [deviceInfo, setDeviceInfo] = useState(() => detectDeviceInfo());
  const [viewPreference, setViewPreferenceState] = useState(() => readStoredUiPreference());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const syncDevice = () => {
      setDeviceInfo(detectDeviceInfo());
    };

    syncDevice();
    window.addEventListener('resize', syncDevice);
    window.addEventListener('orientationchange', syncDevice);

    return () => {
      window.removeEventListener('resize', syncDevice);
      window.removeEventListener('orientationchange', syncDevice);
    };
  }, []);

  const setViewPreference = useCallback((nextMode) => {
    const normalized =
      nextMode === 'mobile' || nextMode === 'desktop' || nextMode === 'auto'
        ? nextMode
        : 'auto';

    setViewPreferenceState(normalized);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(UI_MODE_STORAGE_KEY, normalized);
      } catch {
        // Ignore storage write errors
      }
    }
  }, []);

  const isMobileMode = useMemo(
    () =>
      resolveIsMobileMode({
        isPhysicalMobile: deviceInfo.isPhysicalMobile,
        isNarrowViewport: deviceInfo.isNarrowViewport,
        viewPreference,
      }),
    [deviceInfo.isPhysicalMobile, deviceInfo.isNarrowViewport, viewPreference]
  );

  const toggleUiMode = useCallback(() => {
    setViewPreference(isMobileMode ? 'desktop' : 'mobile');
  }, [isMobileMode, setViewPreference]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.dataset.deviceOs = deviceInfo.os;
    document.documentElement.dataset.uiMode = isMobileMode ? 'mobile' : 'desktop';
  }, [deviceInfo.os, isMobileMode]);

  const value = useMemo(
    () => ({
      ...deviceInfo,
      viewPreference,
      isMobileMode,
      setViewPreference,
      toggleUiMode,
    }),
    [deviceInfo, viewPreference, isMobileMode, setViewPreference, toggleUiMode]
  );

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    const fallback = detectDeviceInfo();
    return {
      ...fallback,
      viewPreference: 'auto',
      isMobileMode: resolveIsMobileMode({
        isPhysicalMobile: fallback.isPhysicalMobile,
        isNarrowViewport: fallback.isNarrowViewport,
        viewPreference: 'auto',
      }),
      setViewPreference: () => {},
      toggleUiMode: () => {},
    };
  }
  return ctx;
}
