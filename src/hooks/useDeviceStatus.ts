import { useEffect, useState } from 'react';
import { DeviceInfo } from '../types';

export function useDeviceStatus(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => ({
    batteryLevel: null,
    isCharging: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    estimatedRam: typeof navigator !== 'undefined' && (navigator as any).deviceMemory
      ? `${(navigator as any).deviceMemory} GB`
      : '1.0 GB (Samsung A2 Core)',
    cores: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4,
    platform: typeof navigator !== 'undefined' ? navigator.platform || 'Android ARMv7' : 'Android',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }));

  useEffect(() => {
    // Online / Offline tracking
    const handleOnline = () => setDeviceInfo((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setDeviceInfo((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API tracking if supported
    let batteryInstance: any = null;
    const updateBattery = (battery: any) => {
      setDeviceInfo((prev) => ({
        ...prev,
        batteryLevel: Math.round(battery.level * 100),
        isCharging: battery.charging,
      }));
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        updateBattery(battery);

        battery.addEventListener('levelchange', () => updateBattery(battery));
        battery.addEventListener('chargingchange', () => updateBattery(battery));
      }).catch(() => {
        // Battery status unavailable or blocked
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return deviceInfo;
}
