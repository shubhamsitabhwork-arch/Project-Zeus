import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export default function Sidebar({ visible, onClose, onNavigate, theme }) {
    const items = [
        { id: 'ANALYTICS', label: '📊 Neural Analytics', color: theme.accent },
        { id: 'OWED', label: '👥 Social Ledger', color: '#b366ff' }, // NEW
        { id: 'INCOME', label: '💼 Income Radar', color: '#00C851' },
        { id: 'SUBS', label: '🔁 Subscriptions', color: '#FF9900' },
        { id: 'SETTINGS', label: '⚙️ System Settings', color: '#888' },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.panel, { backgroundColor: theme.card }]}>
                    <Text style={[styles.title, { color: theme.accent }]}>ZEUS COMMAND</Text>
                    <View style={styles.divider} />
                    
                    {items.map(item => (
                        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => onNavigate(item.id)}>
                            <Text style={[styles.menuText, { color: item.color }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={{ color: theme.danger }}>Close Menu</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', flexDirection: 'row' },
    panel: { width: '80%', height: '100%', padding: 30, paddingTop: 60, borderRightWidth: 1, borderColor: '#333' },
    title: { fontSize: 20, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#222', marginBottom: 30 },
    menuItem: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    menuText: { fontSize: 15, fontWeight: '600' },
    closeBtn: { marginTop: 50, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#333' }
});