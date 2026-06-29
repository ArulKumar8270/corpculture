import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from './api';

export type AssignmentNotificationType =
  | 'service_enquiry'
  | 'rental_enquiry'
  | 'sales_order';

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
  try {
    await api.post('/notification/register-token', { pushToken });
  } catch (error) {
    console.error('Failed to register push token with server:', error);
  }
}

export async function setupPushNotificationsForUser(): Promise<void> {
  const pushToken = await registerForPushNotificationsAsync();
  if (pushToken) {
    await registerPushTokenWithServer(pushToken);
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

export function subscribeToNotificationResponses(
  onNavigate: (screen: string, params?: Record<string, unknown>) => void
) {
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const screen = getScreenFromNotificationData(data);
    if (screen) {
      const params =
        data?.entityId != null ? { highlightId: String(data.entityId) } : undefined;
      const target = getNavigationTarget(screen, params);
      onNavigate(target.name, target.params);
    }
  };

  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleResponse(response);
    }
  });

  return () => subscription.remove();
}
