/**
 * PROJECT ZEUS LEDGER SCREEN
 * Purpose: Interactive list of transactions with deep-link to categorization.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function Ledger({ transactions, onSelectTransaction }) {
    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    const isDebit = item.type === 'DEBIT';
                    return (
                        <TouchableOpacity 
                            style={styles.card} 
                            onPress={() => onSelectTransaction(item)}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.merchant}>{item.merchant}</Text>
                                <Text style={styles.details}>
                                    {item.account_source} • {item.transaction_date.split('T')[0]}
                                </Text>
                            </View>
                            <Text style={[styles.amount, { color: isDebit ? '#ff4444' : '#00ffcc' }]}>
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
    card: { 
        backgroundColor: '#151515', 
        padding: 15, 
        borderRadius: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222'
    },
    merchant: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    details: { color: '#666', fontSize: 10, marginTop: 4 },
    amount: { fontSize: 16, fontWeight: 'bold' }
});