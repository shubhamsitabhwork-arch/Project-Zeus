/**
 * PROJECT ZEUS WALLETS SCREEN
 * Purpose: Detailed tracking of limits, used values, and available liquidity.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Wallets({ transactions, balances, limits }) {
    // 1. Calculate Credit Card Usage
    const getUsed = (source) => {
        const debits = transactions.filter(t => t.account_source === source && t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
        const credits = transactions.filter(t => t.account_source === source && t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
        return Math.max(0, debits - credits);
    };

    const cards = [
        { name: 'ICICI VISA (xx2007)', used: getUsed('VISA_CREDIT'), limit: limits.visa },
        { name: 'AMAZON PAY CC (xx4008)', used: getUsed('AMAZON_CREDIT'), limit: limits.amazon }
    ];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionHeader}>CREDIT LINES</Text>
            {cards.map(card => {
                const percent = Math.min((card.used / card.limit) * 100, 100);
                return (
                    <View key={card.name} style={styles.card}>
                        <View style={styles.cardRow}>
                            <Text style={styles.cardName}>{card.name}</Text>
                            <Text style={styles.cardUsed}>Used: ₹{card.used.toFixed(0)}</Text>
                        </View>
                        <View style={styles.track}>
                            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: percent > 85 ? '#ff4444' : '#007FFF' }]} />
                        </View>
                        <View style={styles.cardRow}>
                            <Text style={styles.limitText}>Limit: ₹{card.limit}</Text>
                            <Text style={styles.availText}>Left: ₹{(card.limit - card.used).toFixed(0)}</Text>
                        </View>
                    </View>
                );
            })}

            <Text style={styles.sectionHeader}>LIQUID CASH</Text>
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#00ffcc' }]}>
                <Text style={styles.cardName}>🏦 BANK VAULT (A/C + DEBIT)</Text>
                <Text style={styles.balanceText}>₹{balances.bank.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#FF9900' }]}>
                <Text style={styles.cardName}>💰 AMAZON PAY BALANCE</Text>
                <Text style={styles.balanceText}>₹{balances.amazonPay.toFixed(2)}</Text>
            </View>

            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#00C851' }]}>
                <Text style={styles.cardName}>💵 PHYSICAL CASH</Text>
                <Text style={styles.balanceText}>₹{balances.cash.toFixed(2)}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15 },
    sectionHeader: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginVertical: 15 },
    card: { backgroundColor: '#151515', padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cardName: { color: '#888', fontSize: 11, fontWeight: 'bold' },
    cardUsed: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    track: { height: 6, backgroundColor: '#222', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },
    limitText: { color: '#444', fontSize: 10 },
    availText: { color: '#00ffcc', fontSize: 10, fontWeight: 'bold' },
    balanceText: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 5 }
});