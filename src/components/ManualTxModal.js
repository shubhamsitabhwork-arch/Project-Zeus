import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ManualTxModal({ visible, onSave, onClose }) {
    const [type, setType] = useState('SPEND'); // SPEND, INCOME, ATM
    const [source, setSource] = useState('ICICI_ACCOUNT');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('');

    const handleExecute = () => {
        if (!amount || !desc) return;
        onSave({ type, source, amount: parseFloat(amount), desc, category });
        setAmount(''); setDesc(''); setCategory('');
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>LOG TRANSACTION</Text>
                    
                    <View style={styles.row}>
                        {['SPEND', 'INCOME', 'ATM'].map(t => (
                            <TouchableOpacity key={t} onPress={() => setType(t)} style={[styles.tab, type === t && styles.activeTab]}>
                                <Text style={[styles.tabText, type === t && styles.activeTabText]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {type !== 'ATM' && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                            {['ICICI_ACCOUNT', 'PHYSICAL_CASH', 'VISA_CREDIT', 'AMAZON_CREDIT', 'AMAZON_PAY_BALANCE'].map(s => (
                                <TouchableOpacity key={s} onPress={() => setSource(s)} style={[styles.srcTab, source === s && styles.activeSrc]}>
                                    <Text style={styles.srcText}>{s.replace('_', ' ')}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <TextInput style={styles.input} placeholder="Amount (₹)" placeholderTextColor="#444" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                    <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#444" value={desc} onChangeText={setDesc} />
                    <TextInput style={styles.input} placeholder="Category (Optional)" placeholderTextColor="#444" value={category} onChangeText={setCategory} />

                    <TouchableOpacity style={styles.execBtn} onPress={handleExecute}>
                        <Text style={styles.execText}>EXECUTE TO LEDGER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}><Text style={{ color: '#ff4444' }}>Cancel</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
    content: { backgroundColor: '#151515', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: '#333' },
    title: { color: '#00ffcc', fontWeight: 'bold', fontSize: 18, marginBottom: 20, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    tab: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
    activeTab: { backgroundColor: '#00ffcc', borderColor: '#00ffcc' },
    tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
    activeTabText: { color: '#000' },
    srcTab: { padding: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 8 },
    activeSrc: { borderColor: '#00ffcc', backgroundColor: '#222' },
    srcText: { color: '#fff', fontSize: 10 },
    input: { backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
    execBtn: { backgroundColor: '#00ffcc', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    execText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 }
});