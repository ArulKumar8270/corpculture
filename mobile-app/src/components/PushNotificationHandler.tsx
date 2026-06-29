import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRootNavigation } from '../context/RootNavigationContext';
import {
  setupPushNotificationsForUser,
  subscribeToNotificationResponses,
} from '../services/pushNotifications';

const PushNotificationHandler = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRootNavigation();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== 1 && user.role !== 3) return;

    setupPushNotificationsForUser();
  }, [isAuthenticated, user?._id, user?.role]);

  useEffect(() => {
    if (!navigationRef?.current) return undefined;

    return subscribeToNotificationResponses((screen, params) => {
      navigationRef.current?.navigate(screen, params);
    });
  }, [navigationRef]);

  return null;
};

export default PushNotificationHandler;
