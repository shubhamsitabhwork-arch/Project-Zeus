/**
 * PROJECT ZEUS PASSBOOK v17.0
 * Purpose: Narrative chronological history with meta-data support.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function Passbook({ transactions, onSelectTransaction, onDeleteTransaction, theme }) {
    
    const confirmDelete = (item) => {
        Alert.alert(
            "Delete Record",
            `Remove: "${item.merchant.split('|')[1].trim()}"? \n\nNo balance re-calc will occur.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDeleteTransaction(item.id) }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const isDebit = item.type === 'DEBIT';
                    // Extract custom notes from the merchant string if we saved them previously
                    const hasComment = item.merchant.includes(" [📝");
                    
                    return (
                        <TouchableOpacity 
                            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
                            onPress={() => onSelectTransaction(item)}
                            onLongPress={() => confirmDelete(item)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.merchant, { color: theme.text }]}>
                                    {item.merchant.split(" [📝")[0]}
                                </Text>
                                <Text style={[styles.details, { color: theme.subtext }]}>
                                    {item.account_source.replace('_', ' ')} • {item.transaction_date.split('T')[0]}
                                </Text>
                                {hasComment && (
                                    <Text style={styles.commentText}>
                                        Note: {item.merchant.match(/\[📝 (.*?)\]/)?.[1]}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.amount, { color: isDebit ? theme.danger : theme.success }]}>
                                {isDebit ? '-' : '+'}₹{item.amount}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15 },
    card: { padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1 },
    merchant: { fontSize: 13, fontWeight: 'bold' },
    details: { fontSize: 9, marginTop: 4, letterSpacing: 1 },
    commentText: { color: '#FF9900', fontSize: 10, fontStyle: 'italic', marginTop: 5 },
    amount: { fontSize: 16, fontWeight: 'bold' }
});