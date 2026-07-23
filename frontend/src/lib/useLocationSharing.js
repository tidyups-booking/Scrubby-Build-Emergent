import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { sendCleanerLocation, stopCleanerSharing, HTTP_UNAUTHORIZED } from './api';

const LOCATION_TIME_INTERVAL_MS = 20000;
const LOCATION_DISTANCE_INTERVAL_M = 40;

/**
 * useLocationSharing — encapsulates GPS permission, location watch, and PIN-401 handling
 * for the cleaner screen. Returns { sharing, busy, lastSent, start, stop, reset } plus the
 * error string when a PIN-changed 401 forces us to stop sharing.
 */
export function useLocationSharing(profile) {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState('');
  const watchRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const stopWatch = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setSharing(false);
  };

  const sendPing = async (p, coords) => {
    try {
      await sendCleanerLocation(p.cleaner_id, p.pin, coords.latitude, coords.longitude);
      setLastSent(new Date());
      setError('');
    } catch (e) {
      if (e.code === HTTP_UNAUTHORIZED) {
        stopWatch();
        setError('The cleaner PIN was changed — please sign out and check in again.');
      }
    }
  };

  const start = async () => {
    if (!profile) return;
    setError('');
    setBusy(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location permission is required to share your position.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await sendPing(profile, pos.coords);
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_TIME_INTERVAL_MS,
          distanceInterval: LOCATION_DISTANCE_INTERVAL_M,
        },
        (p) => sendPing(profile, p.coords)
      );
      setSharing(true);
    } catch {
      setError('Could not get your location — check GPS is on and try again.');
    } finally {
      setBusy(false);
    }
  };

  const stop = () => {
    stopWatch();
    if (profile) stopCleanerSharing(profile.cleaner_id, profile.pin).catch(() => {});
  };

  const reset = () => {
    stopWatch();
    setLastSent(null);
    setError('');
  };

  return { sharing, busy, lastSent, error, setError, start, stop, reset };
}
