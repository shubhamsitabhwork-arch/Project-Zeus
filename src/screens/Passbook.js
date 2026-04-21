/**
 * PROJECT ZEUS PASSBOOK SCREEN
 * Purpose: A friendly, chronological view of all movements with deletion support.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function Passbook({ transactions, onSelectTransaction, onDeleteTransaction, theme }) {
    
    const confirmDelete = (item) => {
        Alert.alert(
            "Delete Record",
            `Are you sure you want to remove this entry? \n\n"${item.merchant.split('|')[1].trim()}"`,
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
                    return (
                        <TouchableOpacity 
                            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
                            onPress={() => onSelectTransaction(item)}
                            onLongPress={() => confirmDelete(item)} // Pro feature: Delete on long press
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.merchant, { color: theme.text }]}>{item.merchant}</Text>
                                <Text style={[styles.details, { color: theme.subtext }]}>
                                    {item.account_source.replace('_', ' ')} • {item.transaction_date.split('T')[0]}
                                </Text>
                            </View>
                            <Text style={[styles.amount, { color: isDebit ? theme.danger : theme.success }]}>
                                {isDebit ? '-' : '+'}₹{item.amount}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
            <Text style={{ textAlign: 'center', color: theme.subtext, fontSize: 10, marginVertical: 10 }}>
                Tip: Long-press to delete a mistake or duplicate.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15 },
    card: { 
        padding: 15, 
        borderRadius: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10,
        borderWidth: 1
    },
    merchant: { fontSize: 14, fontWeight: 'bold' },
    details: { fontSize: 10, marginTop: 4 },
    amount: { fontSize: 16, fontWeight: 'bold' }
});