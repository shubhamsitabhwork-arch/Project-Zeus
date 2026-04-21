import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function Settings({ vendorMap, limits, catBudgets, onUpdateLimit, onUpdateCatBudget, theme, onToggleTheme, genesisDate, onSetGenesis }) {
    const [newCat, setNewCat] = useState('');
    const [newLimit, setNewLimit] = useState('');

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>CATEGORY BUDGETS (SENTINEL)</Text>
            <View style={styles.card}>
                {Object.keys(catBudgets).map(cat => (
                    <View key={cat} style={styles.budgetRow}>
                        <Text style={{color: theme.text, fontSize: 12}}>{cat}</Text>
                        <TextInput 
                            style={[styles.smallInput, {color: theme.accent, backgroundColor: theme.bg}]}
                            keyboardType="numeric"
                            defaultValue={catBudgets[cat].toString()}
                            onBlur={(e) => onUpdateCatBudget(cat, e.nativeEvent.text)}
                        />
                    </View>
                ))}
                <View style={[styles.budgetRow, {marginTop: 10, borderTopWidth: 1, borderColor: '#222', paddingTop: 10}]}>
                    <TextInput style={[styles.smallInput, {flex: 1, marginRight: 10}]} placeholder="New Category" placeholderTextColor="#444" value={newCat} onChangeText={setNewCat}/>
                    <TextInput style={[styles.smallInput, {width: 80}]} placeholder="Limit" placeholderTextColor="#444" keyboardType="numeric" value={newLimit} onChangeText={setNewLimit}/>
                    <TouchableOpacity onPress={() => {onUpdateCatBudget(newCat, newLimit); setNewCat(''); setNewLimit('');}} style={{backgroundColor: theme.accent, padding: 8, borderRadius: 5}}><Text style={{color:'#000', fontSize:10, fontWeight:'bold'}}>ADD</Text></TouchableOpacity>
                </View>
            </View>

            <Text style={styles.header}>GLOBAL BUDGETS</Text>
            <View style={styles.card}>
                <Text style={[styles.label, {color: theme.subtext}]}>MONTHLY TOTAL (₹)</Text>
                <TextInput style={[styles.input, {color: theme.text, backgroundColor: theme.bg}]} keyboardType="numeric" defaultValue={limits.monthly} onBlur={(e)=>onUpdateLimit('monthly', e.nativeEvent.text)}/>
                <Text style={[styles.label, {color: theme.subtext, marginTop: 10}]}>DAILY VELOCITY (₹)</Text>
                <TextInput style={[styles.input, {color: theme.text, backgroundColor: theme.bg}]} keyboardType="numeric" defaultValue={limits.daily} onBlur={(e)=>onUpdateLimit('daily', e.nativeEvent.text)}/>
            </View>

            <Text style={styles.header}>SYSTEM GENESIS</Text>
            <TouchableOpacity style={[styles.genesisBtn, {backgroundColor: theme.accent}]} onPress={onSetGenesis}>
                <Text style={{fontWeight:'bold', fontSize:12}}>RESET GENESIS TO NOW</Text>
            </TouchableOpacity>

            <View style={{height: 50}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { color: '#444', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginVertical: 15 },
    card: { backgroundColor: '#151515', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#222' },
    budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    smallInput: { backgroundColor: '#000', color: '#fff', padding: 8, borderRadius: 5, fontSize: 12, textAlign: 'center', width: 100 },
    label: { fontSize: 10, marginBottom: 5 },
    input: { padding: 12, borderRadius: 8, fontSize: 16 },
    genesisBtn: { padding: 15, borderRadius: 12, alignItems: 'center' }
});