/**
 * PROJECT ZEUS EXPORT SERVICE
 * Purpose: Generates CSV and handles file sharing.
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportToCSV = async (transactions) => {
    if (transactions.length === 0) return Alert.alert("No data to export");

    // Create CSV Header
    let csvString = "Date,Merchant,Amount,Type,Source\n";
    
    // Format rows
    transactions.forEach(t => {
        const date = t.transaction_date.split('T')[0];
        const cleanMerchant = t.merchant.replace(/,/g, ''); // Remove commas to prevent CSV breaking
        csvString += `${date},${cleanMerchant},${t.amount},${t.type},${t.account_source}\n`;
    });

    const fileUri = FileSystem.documentDirectory + "Zeus_Statement.csv";
    
    try {
        await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
            await Sharing.shareAsync(fileUri);
        }
    } catch (error) {
        Alert.alert("Export Failed", error.message);
    }
};