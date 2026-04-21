import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function VendorModal({ visible, selectedTx, txCategory, setTxCategory, onSave, onClose }) {
    if (!selectedTx) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>UPDATE VENDOR MEMORY</Text>
                    <Text style={styles.subtitle}>
                        Categorizing: {selectedTx.merchant.split(' | ')[1] || selectedTx.merchant}
                    </Text>
                    
                    <TextInput 
                        style={styles.input} 
                        value={txCategory} 
                        onChangeText={setTxCategory} 
                        placeholder="e.g. 🍔 Food, 👨‍👩‍👦 Family, 🏠 Rent"
                        placeholderTextColor="#444"
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                        <Text style={styles.saveText}>UPDATE NEURAL MAP</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}>
                        <Text style={{ color: '#ff4444' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    content: { width: '85%', backgroundColor: '#151515', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
    title: { color: '#00ffcc', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
    subtitle: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 20 },
    input: { width: '100%', backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, borderWeight: 1, borderColor: '#333' },
    saveBtn: { backgroundColor: '#00ffcc', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveText: { color: '#000', fontWeight: 'bold' }
});