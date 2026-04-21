/**
 * PROJECT ZEUS SOCIAL LEDGER
 * Purpose: Track Peer-to-Peer debt (Lent/Borrowed) without affecting bank liquidity.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';

export default function Owed({ records, onSave, onDelete, theme }) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [isLent, setIsLent] = useState(true); // Lent = They owe you, Borrowed = You owe them

    const handleAdd = () => {
        if (!name || !amount) return;
        onSave({ id: Date.now().toString(), name, amount: parseFloat(amount), type: isLent ? 'LENT' : 'BORROWED' });
        setName(''); setAmount('');
    };

    const totalLent = records.filter(r => r.type === 'LENT').reduce((s, r) => s + r.amount, 0);
    const totalBorrowed = records.filter(r => r.type === 'BORROWED').reduce((s, r) => s + r.amount, 0);

    return (
        <View style={styles.container}>
            <View style={styles.summaryRow}>
                <View style={[styles.stat, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>OWED TO ME</Text>
                    <Text style={[styles.val, { color: theme.success }]}>₹{totalLent}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: theme.card }]}>
                    <Text style={styles.label}>I OWE</Text>
                    <Text style={[styles.val, { color: theme.danger }]}>₹{totalBorrowed}</Text>
                </View>
            </View>

            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TextInput style={[styles.input, { color: theme.text }]} placeholder="Person Name" placeholderTextColor={theme.subtext} value={name} onChangeText={setName} />
                <TextInput style={[styles.input, { color: theme.text }]} placeholder="Amount" placeholderTextColor={theme.subtext} keyboardType="numeric" value={amount} onChangeText={setAmount} />
                <View style={styles.row}>
                    <TouchableOpacity onPress={() => setIsLent(true)} style={[styles.toggle, isLent && { backgroundColor: theme.success }]}>
                        <Text style={{ color: isLent ? '#000' : '#888', fontSize: 10, fontWeight: 'bold' }}>LENT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsLent(false)} style={[styles.toggle, !isLent && { backgroundColor: theme.danger }]}>
                        <Text style={{ color: !isLent ? '#000' : '#888', fontSize: 10, fontWeight: 'bold' }}>BORROWED</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                        <Text style={{ fontWeight: 'bold' }}>SAVE</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={records}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.item, { backgroundColor: theme.card }]}>
                        <View>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.name}</Text>
                            <Text style={{ color: theme.subtext, fontSize: 10 }}>{item.type}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: item.type === 'LENT' ? theme.success : theme.danger, fontWeight: 'bold' }}>₹{item.amount}</Text>
                            <TouchableOpacity onPress={() => onDelete(item.id)}>
                                <Text style={{ color: theme.danger, fontSize: 10, marginTop: 5 }}>Settle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    stat: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
    label: { fontSize: 9, color: '#888', letterSpacing: 1 },
    val: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
    inputBox: { padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 20 },
    input: { borderBottomWidth: 1, borderBottomColor: '#333', padding: 8, marginBottom: 10 },
    row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    toggle: { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    addBtn: { backgroundColor: '#00ffcc', padding: 10, borderRadius: 6, flex: 0.5, alignItems: 'center' },
    item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 12, marginBottom: 10 }
});