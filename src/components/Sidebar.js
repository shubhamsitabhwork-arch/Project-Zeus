import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export default function Sidebar({ visible, onClose, onNavigate, theme }) {
    const items = [
        { id: 'ANALYTICS', label: '📊 Neural Analytics', color: '#00ffcc' }, // Added Analytics
        { id: 'INCOME', label: '💼 Income Radar', color: '#00C851' },
        { id: 'SUBS', label: '🔁 Subscriptions', color: '#b366ff' },
        { id: 'SETTINGS', label: '⚙️ System Settings', color: '#888' },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.panel, { backgroundColor: theme.bg }]}>
                    <Text style={styles.title}>ZEUS COMMAND</Text>
                    <View style={styles.divider} />
                    
                    {items.map(item => (
                        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => onNavigate(item.id)}>
                            <Text style={[styles.menuText, { color: item.color }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={{ color: '#ff4444' }}>Close Menu</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
    panel: { width: '85%', height: '100%', padding: 30, paddingTop: 60, borderRightWidth: 1, borderColor: '#333' },
    title: { color: '#00ffcc', fontSize: 22, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#222', marginBottom: 30 },
    menuItem: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#151515' },
    menuText: { fontSize: 16, fontWeight: 'bold' },
    closeBtn: { marginTop: 50, padding: 15, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#333' }
});