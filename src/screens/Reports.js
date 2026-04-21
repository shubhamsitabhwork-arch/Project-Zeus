/**
 * PROJECT ZEUS: ANALYTICS NODE
 * Purpose: Aggregates ledger data into high-level executive summaries.
 * Complexity: O(n) time complexity for data reduction.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Reports({ transactions }) {
    // 1. DATA AGGREGATION ENGINE
    // We reduce the entire transaction array into a single object of categories
    const categoryTotals = transactions
        .filter(t => t.type === 'DEBIT')
        .reduce((acc, curr) => {
            const cat = curr.merchant.split(' | ')[0] || '⬜ GENERAL';
            acc[cat] = (acc[cat] || 0) + curr.amount;
            return acc;
        }, {});

    // 2. SORTING BY INTENSITY
    const sortedCats = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a);

    const totalSpent = sortedCats.reduce((sum, [, val]) => sum + val, 0);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>SPENDING TOPOLOGY</Text>
            
            <View style={styles.summaryCard}>
                <Text style={styles.label}>TOTAL MONTHLY DRAIN</Text>
                <Text style={styles.totalText}>₹{totalSpent.toFixed(0)}</Text>
            </View>

            <Text style={styles.sectionTitle}>CATEGORY INTENSITY</Text>
            {sortedCats.map(([name, value]) => {
                const percentage = ((value / totalSpent) * 100).toFixed(1);
                return (
                    <View key={name} style={styles.barContainer}>
                        <View style={styles.row}>
                            <Text style={styles.catName}>{name}</Text>
                            <Text style={styles.catValue}>₹{value.toFixed(0)} ({percentage}%)</Text>
                        </View>
                        {/* THE VISUAL BAR */}
                        <View style={styles.track}>
                            <View style={[styles.fill, { width: `${percentage}%` }]} />
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
    summaryCard: { backgroundColor: '#151515', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#333' },
    label: { color: '#888', fontSize: 10 },
    totalText: { color: '#ff4444', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
    sectionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
    barContainer: { marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    catName: { color: '#fff', fontSize: 12 },
    catValue: { color: '#888', fontSize: 12 },
    track: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#00ffcc', borderRadius: 2 }
});