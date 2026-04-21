/**
 * PROJECT ZEUS SECURITY SERVICE
 * Purpose: Interfaces with phone biometrics (Fingerprint/FaceID).
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const authenticateUser = async () => {
    try {
        // 1. Check if hardware exists
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            return true; // Fallback if phone has no biometrics
        }

        // 2. Trigger Authentication
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authorize Project Zeus Access',
            fallbackLabel: 'Use PIN',
            disableDeviceFallback: false,
        });

        return result.success;
    } catch (error) {
        Alert.alert("Security Error", "Biometric authentication failed.");
        return false;
    }
};