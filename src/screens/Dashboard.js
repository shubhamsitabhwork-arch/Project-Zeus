/**
 * PROJECT ZEUS DASHBOARD SCREEN
 * Purpose: Pure UI component to show financial status.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { calculateNetSpentToday, calculateWeeklyLeft } from '../services/MathEngine';

export default function Dashboard({ transactions, weeklyLimit }) {
    const netSpent = calculateNetSpentToday(transactions);
    const weeklyLeft = calculateWeeklyLeft(transactions, weeklyLimit);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>DAILY NET SPEND</Text>
                <Text style={styles.value}>₹{netSpent.toFixed(0)}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>WEEKLY LIMIT LEFT</Text>
                <Text style={styles.value}>₹{weeklyLeft.toFixed(0)}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    card: { 
        backgroundColor: '#151515', 
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 20, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    label: { color: '#888', fontSize: 10, letterSpacing: 2 },
    value: { color: '#00ffcc', fontSize: 32, fontWeight: 'bold', marginTop: 10 }
});