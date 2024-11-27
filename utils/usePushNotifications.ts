import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import Constants from "expo-constants";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  // Notifications.setNotificationHandler({
  //   handleNotification: async () => ({
  //     shouldPlaySound: false,
  //     shouldShowAlert: true,
  //     shouldSetBadge: false,
  //     priority: Notifications.AndroidNotificationPriority.HIGH
  //   }),
  // });

  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();

  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (!Device.isDevice) return;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas.projectId,
    });

    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    return token;
  }

  useEffect(() => {
      registerForPushNotificationsAsync().then((token) => {
        setExpoPushToken(token);
      });
      
      notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(notification, 'notification');
        setNotification(notification);
      });
      
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log(response, 'response');
          console.log(response);
        });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};