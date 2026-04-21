/**
 * PROJECT ZEUS SETTINGS
 * Purpose: Manage system configurations and entity database.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function Settings({ vendorMap, limits, onUpdateLimit, onDeleteVendor, theme, onToggleTheme }) {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>DISPLAY SETTINGS</Text>
            <TouchableOpacity style={styles.card} onPress={onToggleTheme}>
                <Text style={{ color: '#fff' }}>Current Mode: {theme.toUpperCase()}</Text>
                <Text style={{ color: '#00ffcc', fontSize: 10 }}>Tap to toggle Dark / Light</Text>
            </TouchableOpacity>

            <Text style={styles.header}>BUDGET LIMITS</Text>
            <View style={styles.card}>
                <Text style={styles.label}>MONTHLY SPEND LIMIT (₹)</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    defaultValue={limits.monthly}
                    onBlur={(e) => onUpdateLimit('monthly', e.nativeEvent.text)}
                />
                <Text style={[styles.label, {marginTop: 15}]}>WEEKLY SPEND LIMIT (₹)</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    defaultValue={limits.weekly}
                    onBlur={(e) => onUpdateLimit('weekly', e.nativeEvent.text)}
                />
            </View>

            <Text style={styles.header}>SAVED VENDORS & ENTITIES</Text>
            <View style={styles.card}>
                {Object.keys(vendorMap).length === 0 && <Text style={{color: '#444'}}>No entities saved.</Text>}
                {Object.keys(vendorMap).map(v => (
                    <View key={v} style={styles.entityRow}>
                        <View>
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>{v}</Text>
                            <Text style={{color: '#00ffcc', fontSize: 10}}>{vendorMap[v]}</Text>
                        </View>
                        <TouchableOpacity onPress={() => onDeleteVendor(v)}>
                            <Text style={{color: '#ff4444'}}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginVertical: 15 },
    card: { backgroundColor: '#151515', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
    label: { color: '#888', fontSize: 10, marginBottom: 5 },
    input: { backgroundColor: '#000', color: '#fff', padding: 10, borderRadius: 8, fontSize: 16 },
    entityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' }
});