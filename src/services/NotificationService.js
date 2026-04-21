/**
 * PROJECT ZEUS NOTIFICATION SERVICE
 * Purpose: Real-time alerts for budget breaches and daily summaries.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is OPEN
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
};

export const triggerBudgetAlert = async (category, percentage) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: `⚠️ ZEUS ALERT: ${category} LIMIT`,
            body: `You have consumed ${percentage}% of your ${category} budget. Focus on discipline.`,
            data: { category },
        },
        trigger: null, // Send immediately
    });
};