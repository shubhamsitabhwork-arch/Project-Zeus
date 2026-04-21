import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getSpendDistribution, calculateRunway } from '../services/MathEngine';

export default function Analytics({ transactions, totalLiquidity, onExport }) {
    const dist = getSpendDistribution(transactions);
    const runway = calculateRunway(totalLiquidity, transactions);
    const sortedCats = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    const maxVal = sortedCats.length > 0 ? sortedCats[0][1] : 1;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.forecastingCard}>
                <Text style={styles.label}>LIQUIDITY RUNWAY</Text>
                <Text style={styles.runwayText}>{runway}</Text>
                <Text style={styles.subLabel}>Based on your 30-day avg burn rate</Text>
            </View>

            <Text style={styles.sectionHeader}>SPEND DISTRIBUTION (Monthly)</Text>
            {sortedCats.map(([cat, val]) => (
                <View key={cat} style={styles.distRow}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                        <Text style={{color: '#fff', fontSize: 12}}>{cat}</Text>
                        <Text style={{color: '#888', fontSize: 12}}>₹{val.toFixed(0)}</Text>
                    </View>
                    <View style={styles.track}>
                        <View style={[styles.fill, { width: `${(val / maxVal) * 100}%` }]} />
                    </View>
                </View>
            ))}

            <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
                <Text style={styles.exportText}>📥 GENERATE CSV STATEMENT</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    forecastingCard: { backgroundColor: '#151515', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#00ffcc' },
    label: { color: '#888', fontSize: 10, letterSpacing: 2 },
    runwayText: { color: '#00ffcc', fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
    subLabel: { color: '#444', fontSize: 10 },
    sectionHeader: { color: '#444', fontSize: 12, fontWeight: 'bold', marginBottom: 20 },
    distRow: { marginBottom: 20 },
    track: { height: 4, backgroundColor: '#111', borderRadius: 2, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#00ffcc', borderRadius: 2 },
    exportBtn: { marginTop: 40, backgroundColor: '#222', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    exportText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});