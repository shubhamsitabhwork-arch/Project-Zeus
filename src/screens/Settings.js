import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function Settings({ vendorMap, limits, onUpdateLimit, onDeleteVendor, theme, onToggleTheme, genesisDate, onSetGenesis }) {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>SYSTEM GENESIS</Text>
            <View style={[styles.card, { borderColor: theme.accent }]}>
                <Text style={[styles.label, { color: theme.text }]}>SYSTEM START POINT</Text>
                <Text style={{ color: theme.subtext, fontSize: 11, marginBottom: 15 }}>
                    {genesisDate ? `Tracking active since: ${new Date(genesisDate).toLocaleString()}` : "Not set. App is fetching historical data."}
                </Text>
                <TouchableOpacity style={[styles.genesisBtn, { backgroundColor: theme.accent }]} onPress={onSetGenesis}>
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>START TRACKING FROM NOW</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.header}>DISPLAY SETTINGS</Text>
            <TouchableOpacity style={styles.card} onPress={onToggleTheme}>
                <Text style={{ color: theme.text }}>Mode: {theme.bg === '#0a0a0a' ? 'DARK' : 'LIGHT'}</Text>
                <Text style={{ color: theme.accent, fontSize: 10 }}>Tap to toggle</Text>
            </TouchableOpacity>

            <Text style={styles.header}>BUDGET LIMITS</Text>
            <View style={styles.card}>
                <Text style={[styles.label, { color: theme.text }]}>MONTHLY SPEND LIMIT (₹)</Text>
                <TextInput 
                    style={[styles.input, { color: theme.text, backgroundColor: theme.bg }]} 
                    keyboardType="numeric" 
                    defaultValue={limits.monthly}
                    onBlur={(e) => onUpdateLimit('monthly', e.nativeEvent.text)}
                />
            </View>

            <Text style={styles.header}>SAVED ENTITIES</Text>
            <View style={styles.card}>
                {Object.keys(vendorMap).map(v => (
                    <View key={v} style={styles.entityRow}>
                        <View><Text style={{color: theme.text, fontWeight: 'bold'}}>{v}</Text><Text style={{color: theme.accent, fontSize: 10}}>{vendorMap[v]}</Text></View>
                        <TouchableOpacity onPress={() => onDeleteVendor(v)}><Text style={{color: theme.danger}}>Delete</Text></TouchableOpacity>
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
    label: { fontSize: 10, marginBottom: 5 },
    genesisBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
    input: { padding: 10, borderRadius: 8, fontSize: 16, marginTop: 5 },
    entityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }
});