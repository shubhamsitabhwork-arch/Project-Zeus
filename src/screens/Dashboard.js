import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { calculateNetSpentToday, getSpendingArchetype } from '../services/MathEngine';

export default function Dashboard({ transactions, limits, theme }) {
    const netSpent = calculateNetSpentToday(transactions);
    const archetype = getSpendingArchetype(transactions, limits.monthly);

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.tower, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.label}>NET DAILY VELOCITY</Text>
                <Text style={[styles.velocity, { color: theme.accent }]}>₹{netSpent.toFixed(0)}</Text>
                <View style={styles.indicatorContainer}>
                    <View style={[styles.dot, { backgroundColor: archetype.color }]} />
                    <Text style={{ color: theme.subtext, fontSize: 10 }}>{archetype.label} MODE</Text>
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.miniBox, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>DAILY LIMIT</Text>
                    <Text style={[styles.miniVal, {color: theme.text}]}>₹{limits.daily}</Text>
                </View>
                <View style={[styles.miniBox, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>MONTHLY FLOW</Text>
                    <Text style={[styles.miniVal, {color: theme.text}]}>₹{limits.monthly}</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    tower: { padding: 40, borderRadius: 25, alignItems: 'center', borderWidth: 1, marginBottom: 20 },
    label: { fontSize: 10, color: '#444', letterSpacing: 2 },
    velocity: { fontSize: 48, fontWeight: 'bold', marginVertical: 10 },
    indicatorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    miniBox: { flex: 0.48, padding: 20, borderRadius: 15, alignItems: 'center' },
    miniVal: { fontSize: 18, fontWeight: 'bold', marginTop: 5 }
});