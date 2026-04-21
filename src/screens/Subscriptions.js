/**
 * PROJECT ZEUS SUBSCRIPTION MASTER
 * Purpose: Track recurring mandates and their status.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function Subscriptions({ mandates, onUpdateStatus, onDelete }) {
    const active = mandates.filter(m => m.status === 'ACTIVE');
    const completed = mandates.filter(m => m.status === 'CLOSED');
    const totalActive = active.reduce((s, m) => s + m.amount, 0);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.totalHeader}>
                <Text style={styles.label}>TOTAL MONTHLY MANDATES</Text>
                <Text style={styles.totalText}>₹{totalActive.toFixed(0)}</Text>
            </View>

            <Text style={styles.sectionTitle}>ACTIVE MANDATES</Text>
            {active.map(m => (
                <View key={m.id} style={styles.card}>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.vendor}>{m.vendor}</Text>
                            <Text style={styles.date}>Date: {m.date}</Text>
                        </View>
                        <Text style={styles.amount}>₹{m.amount}</Text>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onUpdateStatus(m.id, 'CLOSED')}>
                            <Text style={styles.completeLink}>Mark Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(m.id)}>
                            <Text style={styles.deleteLink}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>COMPLETED / REVOKED</Text>
            {completed.map(m => (
                <View key={m.id} style={[styles.card, { opacity: 0.5 }]}>
                    <Text style={[styles.vendor, { textDecorationLine: 'line-through' }]}>{m.vendor}</Text>
                    <TouchableOpacity onPress={() => onUpdateStatus(m.id, 'ACTIVE')}>
                        <Text style={styles.completeLink}>Re-activate</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    totalHeader: { alignItems: 'center', marginBottom: 30 },
    label: { color: '#888', fontSize: 10, letterSpacing: 2 },
    totalText: { color: '#b366ff', fontSize: 32, fontWeight: 'bold' },
    sectionTitle: { color: '#444', fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
    card: { backgroundColor: '#151515', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    vendor: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    date: { color: '#666', fontSize: 11, marginTop: 5 },
    amount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 20, marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
    completeLink: { color: '#00ffcc', fontSize: 12 },
    deleteLink: { color: '#ff4444', fontSize: 12 }
});