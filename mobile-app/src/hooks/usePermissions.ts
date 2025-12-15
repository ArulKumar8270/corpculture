import { useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Hook to check user permissions
 * @param key - The permission key to check
 * @param action - The action to check (default: 'view')
 * @returns boolean - Whether the user has the permission
 */
export const usePermissions = () => {
  const { permissions } = useSelector((state: RootState) => state.permissions);
  const { user } = useSelector((state: RootState) => state.auth);

  const hasPermission = (key: string, action: string = 'view'): boolean => {
    // Admins (role === 1) have all permissions
    if (user?.role === 1) {
      return true;
    }

    // Check if user has the permission with the specified action
    const permission = permissions.find((p) => p.key === key);
    if (!permission) {
      return false;
    }

    // If actions array is empty, it means no permissions
    if (permission.actions.length === 0) {
      return false;
    }

    // Check if the permission includes the required action
    return permission.actions.includes(action);
  };

  const hasAnyPermission = (keys: string[], action: string = 'view'): boolean => {
    return keys.some((key) => hasPermission(key, action));
  };

  const hasAllPermissions = (keys: string[], action: string = 'view'): boolean => {
    return keys.every((key) => hasPermission(key, action));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
  };
};

