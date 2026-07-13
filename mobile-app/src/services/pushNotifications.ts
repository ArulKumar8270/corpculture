import { AppState, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import api from './api';
import type { RootNavigationRef } from '../context/RootNavigationContext';

export type AssignmentNotificationType =
  | 'service_enquiry'
  | 'rental_enquiry'
  | 'sales_order';

const PUSH_TOKEN_STORAGE_KEY = 'expoPushToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('assignments', {
    name: 'Assignments',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#019ee3',
    sound: 'default',
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  await ensureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('EAS projectId missing — cannot get Expo push token');
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}

export async function registerPushTokenWithServer(pushToken: string): Promise<void> {
  await api.post('/notification/register-token', { pushToken });
}

export async function unregisterPushTokenFromServer(pushToken: string): Promise<void> {
  try {
    await api.post('/notification/remove-token', { pushToken });
  } catch (error) {
    console.error('Failed to remove push token from server:', error);
  }
}

export async function setupPushNotificationsForUser(): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (!pushToken) return;

    await registerPushTokenWithServer(pushToken);
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
  } catch (error) {
    console.error('Push notification setup failed:', error);
  }
}

export async function cleanupPushNotificationsOnLogout(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (cached) {
      await unregisterPushTokenFromServer(cached);
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Push notification cleanup failed:', error);
  }
}

export function getScreenFromNotificationData(
  data: Record<string, unknown> | undefined
): string | null {
  if (!data) return null;

  if (typeof data.screen === 'string' && data.screen) {
    return data.screen;
  }

  const type = data.type as AssignmentNotificationType | undefined;
  switch (type) {
    case 'service_enquiry':
      return 'ServiceEnquiries';
    case 'rental_enquiry':
      return 'RentalEnquiries';
    case 'sales_order':
      return 'OrderList';
    default:
      return null;
  }
}

/** Map leaf screen to drawer + nested stack route (works for admin & employee navigators). */
export function getNavigationTarget(
  screen: string,
  params?: Record<string, unknown>
): { name: string; params?: Record<string, unknown> } {
  switch (screen) {
    case 'ServiceEnquiries':
      return { name: 'Services', params: { screen: 'ServiceEnquiries', params } };
    case 'RentalEnquiries':
      return { name: 'Rentals', params: { screen: 'RentalEnquiries', params } };
    case 'OrderList':
      return { name: 'Orders', params: { screen: 'OrderList', params } };
    default:
      return { name: screen, params };
  }
}

export function navigateFromNotification(
  navigationRef: RootNavigationRef,
  screen: string,
  params?: Record<string, unknown>
) {
  const target = getNavigationTarget(screen, params);
  navigationRef.current?.dispatch(
    CommonActions.navigate({
      name: target.name,
      params: target.params,
    })
  );
}

export function subscribeToNotificationResponses(navigationRef: RootNavigationRef) {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const screen = getScreenFromNotificationData(data);
    if (!screen) return;

    const params =
      data?.entityId != null ? { highlightId: String(data.entityId) } : undefined;
    navigateFromNotification(navigationRef, screen, params);
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleResponse(response);
    }
  });

  return () => subscription.remove();
}

export function subscribeToForegroundNotifications(
  onNotification: (title: string, body: string) => void
) {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const title = notification.request.content.title || 'New assignment';
    const body = notification.request.content.body || '';
    onNotification(title, body);
  });

  return () => subscription.remove();
}

/** Re-register push token when app returns to foreground (token can rotate). */
export function subscribeToAppStatePushRefresh(
  enabled: boolean,
  onRefresh: () => void
) {
  if (!enabled) return () => undefined;

  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      onRefresh();
    }
  });

  return () => subscription.remove();
}
