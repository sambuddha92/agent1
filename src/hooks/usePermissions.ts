/**
 * usePermissions hook
 * Manages camera permission state and provides helpers
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkCameraPermission,
  isCameraSupported,
  type PermissionStatus,
} from '@/lib/camera/permissions';

export function usePermissions() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('prompt');
  const [isChecking, setIsChecking] = useState(true);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = useCallback(async () => {
    setIsChecking(true);
    try {
      const status = await checkCameraPermission();
      setPermissionStatus(status);
    } catch (error) {
      console.error('[usePermissions] Failed to check permission:', error);
      setPermissionStatus('unsupported');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const isSupported = isCameraSupported();
  const isGranted = permissionStatus === 'granted';
  const isDenied = permissionStatus === 'denied';
  const needsPrompt = permissionStatus === 'prompt';

  return {
    permissionStatus,
    isChecking,
    isSupported,
    isGranted,
    isDenied,
    needsPrompt,
    checkPermission,
  };
}
