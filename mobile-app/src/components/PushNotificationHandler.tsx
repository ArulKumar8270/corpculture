import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { RootState } from '../store';
import { useRootNavigation } from '../context/RootNavigationContext';
import {
  setupPushNotificationsForUser,
  subscribeToNotificationResponses,
  subscribeToForegroundNotifications,
  subscribeToAppStatePushRefresh,
} from '../services/pushNotifications';

const PushNotificationHandler = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRootNavigation();
  const shouldRegisterPush =
    isAuthenticated && !!user && (user.role === 1 || user.role === 3);

  useEffect(() => {
    if (!shouldRegisterPush) return;
    setupPushNotificationsForUser();
  }, [shouldRegisterPush, user?._id]);

  useEffect(() => {
    if (!shouldRegisterPush) return undefined;
    return subscribeToAppStatePushRefresh(true, () => {
      setupPushNotificationsForUser();
    });
  }, [shouldRegisterPush, user?._id]);

  useEffect(() => {
    if (!shouldRegisterPush) return undefined;
    return subscribeToForegroundNotifications((title, body) => {
      Toast.show({
        type: 'info',
        text1: title,
        text2: body,
        visibilityTime: 5000,
      });
    });
  }, [shouldRegisterPush]);

  useEffect(() => {
    if (!navigationRef?.current || !shouldRegisterPush) return undefined;
    return subscribeToNotificationResponses(navigationRef);
  }, [navigationRef, shouldRegisterPush]);

  return null;
};

export default PushNotificationHandler;
