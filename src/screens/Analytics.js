import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getSpendDistribution, calculateRunway, estimateInvestments } from '../services/MathEngine';

export default function Analytics({ transactions, totalLiquidity, onExport, theme }) {
    const distribution = getSpendDistribution(transactions);
    const runway = calculateRunway(totalLiquidity, transactions);
    const taxPotential = estimateInvestments(transactions);

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.card, { borderColor: theme.accent }]}>
                <Text style={[styles.label, { color: theme.subtext }]}>LIQUIDITY RUNWAY</Text>
                <Text style={[styles.runwayText, { color: theme.accent }]}>{runway}</Text>
                <Text style={{ color: theme.subtext, fontSize: 10 }}>Based on avg daily burn rate</Text>
            </View>

            <View style={styles.row}>
                <View style={[styles.miniCard, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>INVESTED</Text>
                    <Text style={[styles.miniVal, { color: theme.success }]}>₹{taxPotential.toFixed(0)}</Text>
                </View>
                <View style={[styles.miniCard, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>TOTAL OUT</Text>
                    <Text style={[styles.miniVal, { color: theme.danger }]}>
                        ₹{distribution.reduce((s,i) => s+i.value, 0).toFixed(0)}
                    </Text>
                </View>
            </View>

            <Text style={[styles.sectionHeader, { color: theme.subtext }]}>SPEND DISTRIBUTION (Current Month)</Text>
            {distribution.map((item, index) => (
                <View key={item.name} style={styles.distItem}>
                    <View style={styles.distInfo}>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{item.name}</Text>
                        <Text style={{ color: theme.subtext, fontSize: 12 }}>{item.percentage}% (₹{item.value.toFixed(0)})</Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: theme.border }]}>
                        <View style={[styles.fill, { width: `${item.percentage}%`, backgroundColor: theme.accent }]} />
                    </View>
                </View>
            ))}

            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onExport}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>📥 GENERATE FINANCIAL STATEMENT (CSV)</Text>
            </TouchableOpacity>
            
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    card: { padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
    label: { fontSize: 10, letterSpacing: 2, marginBottom: 5 },
    runwayText: { fontSize: 32, fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    miniCard: { flex: 0.48, padding: 15, borderRadius: 15, alignItems: 'center' },
    miniVal: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
    sectionHeader: { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
    distItem: { marginBottom: 20 },
    distInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    track: { height: 6, borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },
    exportBtn: { marginTop: 20, padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1 }
});