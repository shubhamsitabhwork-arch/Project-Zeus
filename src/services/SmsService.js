/**
 * PROJECT ZEUS SMS SERVICE
 * Purpose: Handles all native hardware interactions for SMS.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import SmsAndroid from 'react-native-get-sms-android';
import { parseBankSMS } from '../../parser';
import { supabase } from '../../supabase';

export const requestSmsPermissions = async () => {
    if (Platform.OS !== 'android') return false;
    const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    return granted['android.permission.READ_SMS'] === 'granted';
};

export const recoverMissedSms = (vendorMap, callback) => {
    // Look back 7 days for missed messages
    const minDate = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    
    SmsAndroid.list(JSON.stringify({ box: 'inbox', minDate }), (fail) => {
        console.error("Inbox scan failed", fail);
    }, async (count, smsList) => {
        const messages = JSON.parse(smsList);
        let newFound = 0;
        for (let msg of messages) {
            const clean = parseBankSMS(msg.body, vendorMap);
            if (clean) {
                const { data } = await supabase.from('transactions').select('id').eq('raw_sms', msg.body);
                if (data && data.length === 0) {
                    await supabase.from('transactions').insert([{
                        transaction_date: new Date(msg.date).toISOString(),
                        amount: clean.amount,
                        type: clean.type,
                        account_source: clean.source,
                        merchant: clean.merchant,
                        raw_sms: msg.body
                    }]);
                    newFound++;
                }
            }
        }
        if (newFound > 0) callback(); // Trigger a UI refresh if new data found
    });
};