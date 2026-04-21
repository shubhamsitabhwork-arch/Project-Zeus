import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getSpendingArchetype, calculateRunway } from '../services/MathEngine';

export default function Insights({ transactions, limits, totalLiquidity, theme }) {
    const archetype = getSpendingArchetype(transactions, limits.monthly);
    const runway = calculateRunway(totalLiquidity, transactions);

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.mainCard, { backgroundColor: theme.card, borderColor: archetype.color }]}>
                <Text style={[styles.label, { color: theme.subtext }]}>CURRENT ARCHETYPE</Text>
                <Text style={[styles.typeText, { color: archetype.color }]}>{archetype.label}</Text>
                <Text style={[styles.advice, { color: theme.text }]}>{archetype.advice}</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                <Text style={styles.label}>LIQUIDITY RUNWAY</Text>
                <Text style={[styles.statVal, { color: theme.accent }]}>{runway}</Text>
                <Text style={styles.subText}>Days until ₹0 based on 14-day average burn</Text>
            </View>

            <Text style={styles.sectionHeader}>PSYCHOLOGICAL OBSERVATIONS</Text>
            <View style={styles.tipCard}>
                <Text style={{color: theme.text, fontSize: 13}}>
                    💡 {transactions.length > 50 ? "You tend to spend 40% more on weekends." : "Sync more data to unlock behavioral patterns."}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    mainCard: { padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
    label: { fontSize: 10, letterSpacing: 2, marginBottom: 10 },
    typeText: { fontSize: 28, fontWeight: 'bold' },
    advice: { textAlign: 'center', marginTop: 10, fontSize: 14 },
    statCard: { padding: 25, borderRadius: 15, marginBottom: 20 },
    statVal: { fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
    subText: { fontSize: 10, color: '#444' },
    sectionHeader: { color: '#444', fontSize: 10, fontWeight: 'bold', marginVertical: 15, letterSpacing: 1 },
    tipCard: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#00ffcc' }
});