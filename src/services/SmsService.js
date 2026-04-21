/**
 * PROJECT ZEUS SMS SERVICE v16.0
 * Purpose: Handles SMS interception with Genesis Date filtering.
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

/**
 * recoverMissedSms now accepts genesisDate. 
 * It will NEVER fetch anything older than this date.
 */
export const recoverMissedSms = (vendorMap, genesisDate, callback) => {
    if (!genesisDate) return;

    const genesisTimestamp = new Date(genesisDate).getTime();
    
    // Look back from now until Genesis date
    SmsAndroid.list(JSON.stringify({ box: 'inbox', minDate: genesisTimestamp }), (fail) => {
        console.error("Inbox scan failed", fail);
    }, async (count, smsList) => {
        const messages = JSON.parse(smsList);
        let newFound = 0;
        
        for (let msg of messages) {
            // Verify message is exactly AFTER genesis
            if (msg.date < genesisTimestamp) continue;

            const clean = parseBankSMS(msg.body, vendorMap);
            if (clean) {
                // Check for duplicates via raw_sms hash
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
        if (newFound > 0) callback();
    });
};