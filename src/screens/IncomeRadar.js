/**
 * PROJECT ZEUS INCOME RADAR
 * Purpose: Track earnings across streams without affecting bank liquidity.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';

export default function IncomeRadar({ records, onSave, onDelete }) {
    const [activeTab, setActiveTab] = useState('SALARY');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = records.filter(r => r.type === activeTab);
    const total = filtered.reduce((s, r) => s + r.amount, 0);

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {['SALARY', 'FREELANCE', 'OTHER'].map(t => (
                    <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.activeTab]}>
                        <Text style={[styles.tabText, activeTab === t && {color: '#000'}]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.label}>TOTAL {activeTab} INPUT</Text>
                <Text style={styles.totalVal}>₹{total.toFixed(0)}</Text>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.logCard} 
                        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                        <View style={styles.row}>
                            <Text style={styles.sourceText}>{item.source}</Text>
                            <Text style={styles.amountText}>+₹{item.amount}</Text>
                        </View>
                        {expandedId === item.id && (
                            <View style={styles.details}>
                                <Text style={styles.comment}>Note: {item.comments || 'No comments'}</Text>
                                <TouchableOpacity onPress={() => onDelete(item.id)}>
                                    <Text style={{color: '#ff4444', fontSize: 12, marginTop: 10}}>Delete Log</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    tabBar: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tab: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
    activeTab: { backgroundColor: '#00C851', borderColor: '#00C851' },
    tabText: { color: '#888', fontWeight: 'bold', fontSize: 10 },
    summaryCard: { backgroundColor: '#151515', padding: 20, borderRadius: 15, marginBottom: 20, alignItems: 'center' },
    label: { color: '#888', fontSize: 10 },
    totalVal: { color: '#00C851', fontSize: 28, fontWeight: 'bold' },
    logCard: { backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#00C851' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    sourceText: { color: '#fff', fontWeight: 'bold' },
    amountText: { color: '#00C851', fontWeight: 'bold' },
    details: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
    comment: { color: '#888', fontSize: 12, fontStyle: 'italic' }
});