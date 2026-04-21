import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import { requestSmsPermissions, recoverMissedSms } from './src/services/SmsService';
import { exportToCSV } from './src/services/ExportService';
import { authenticateUser } from './src/services/SecurityService';
import { calculateNetSpentToday } from './src/services/MathEngine';

// UI
import { getTheme } from './src/styles/theme';
import Dashboard from './src/screens/Dashboard';
import Passbook from './src/screens/Passbook';
import Wallets from './src/screens/Wallets';
import IncomeRadar from './src/screens/IncomeRadar';
import Subscriptions from './src/screens/Subscriptions';
import Settings from './src/screens/Settings';
import Analytics from './src/screens/Analytics';
import Sidebar from './src/components/Sidebar';
import VendorModal from './src/components/VendorModal';
import ManualTxModal from './src/components/ManualTxModal';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [limits, setLimits] = useState({ monthly: '50000', weekly: '10000', visa: '60000', amazon: '150000', daily: '2000' });
  const [balances, setBalances] = useState({ bank: '0', amazonPay: '0', cash: '0' });
  const [vendorMap, setVendorMap] = useState({});
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [mandates, setMandates] = useState([]);
  const [themeMode, setThemeMode] = useState('dark');
  const [genesisDate, setGenesisDate] = useState(null);

  const [vModal, setVModal] = useState({ visible: false, tx: null, cat: '', note: '' }); // Note added
  const [mModal, setMModal] = useState(false);

  const syncData = async () => {
    const { data } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => {
    const initApp = async () => {
        const success = await authenticateUser();
        if (!success) return;
        setIsUnlocked(true);
        const stored = await AsyncStorage.multiGet(['limits', 'balances', 'vendorMap', 'incomeRecords', 'mandates', 'themeMode', 'genesisDate']);
        stored.forEach(([k, v]) => {
            if (v) {
                const p = JSON.parse(v);
                if (k === 'limits') setLimits(p);
                else if (k === 'balances') setBalances(p);
                else if (k === 'vendorMap') setVendorMap(p);
                else if (k === 'incomeRecords') setIncomeRecords(p);
                else if (k === 'mandates') setMandates(p);
                else if (k === 'themeMode') setThemeMode(p);
                else if (k === 'genesisDate') setGenesisDate(p);
            }
        });
        await syncData();
        const hasPerm = await requestSmsPermissions();
        if (hasPerm) recoverMissedSms(vendorMap, genesisDate, syncData);
    };
    initApp();
  }, []);

  const handleUpdateTransaction = async () => {
      const rawMerchant = vModal.tx.merchant.split(' | ')[1] || vModal.tx.merchant;
      const cleanName = rawMerchant.split(' [')[0].split(' ')[0];
      
      // Update Memory
      const newMap = { ...vendorMap, [cleanName]: vModal.cat };
      setVendorMap(newMap);
      await AsyncStorage.setItem('vendorMap', JSON.stringify(newMap));
      
      // Build final merchant string with Note support
      let finalStr = `${vModal.cat} | ${rawMerchant.split(' [')[0]}`;
      if (vModal.note) finalStr += ` [📝 ${vModal.note}]`;

      await supabase.from('transactions').update({ merchant: finalStr }).eq('id', vModal.tx.id);
      setVModal({ visible: false, tx: null, cat: '', note: '' });
      syncData();
  };

  const netToday = calculateNetSpentToday(transactions);
  const theme = getTheme(themeMode, netToday > parseFloat(limits.daily));

  if (!isUnlocked) return <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator color="#00ffcc" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}><Text style={{fontSize: 24, color: theme.text}}>☰</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.accent }]}>PROJECT ZEUS</Text>
        <TouchableOpacity onPress={() => setMModal(true)} style={[styles.addBtn, {backgroundColor: theme.accent}]}><Text style={{fontSize: 18, fontWeight: 'bold'}}>＋</Text></TouchableOpacity>
      </View>

      {activeTab === 'DASHBOARD' && <Dashboard transactions={transactions} weeklyLimit={limits.weekly} theme={theme} />}
      {activeTab === 'PASSBOOK' && <Passbook transactions={transactions} theme={theme} onSelectTransaction={(tx) => setVModal({ visible: true, tx, cat: tx.merchant.split(' | ')[0], note: tx.merchant.match(/\[📝 (.*?)\]/)?.[1] || '' })} onDeleteTransaction={async (id) => { await supabase.from('transactions').delete().eq('id', id); syncData(); }} />}
      {activeTab === 'WALLETS' && <Wallets transactions={transactions} limits={limits} balances={{ bank: balances.bank, amazonPay: balances.amazonPay, cash: balances.cash }} theme={theme} />}
      {activeTab === 'ANALYTICS' && <Analytics transactions={transactions} totalLiquidity={totalLiquidity} theme={theme} onExport={() => exportToCSV(transactions)} />}

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={(id) => { setActiveTab(id); setSidebarVisible(false); }} theme={theme} />
      
      {/* VENDOR MODAL WITH NOTE FIELD */}
      <VendorModal 
        visible={vModal.visible} 
        selectedTx={vModal.tx} 
        txCategory={vModal.cat} 
        setTxCategory={(c)=>setVModal({...vModal, cat: c})} 
        theme={theme}
        onSave={handleUpdateTransaction} 
        onClose={() => setVModal({ ...vModal, visible: false })} 
      >
          <TextInput 
              style={{ width: '100%', backgroundColor: theme.bg, color: theme.text, padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: theme.border }}
              placeholder="Add personal note (e.g. Tax, Gift)"
              placeholderTextColor={theme.subtext}
              value={vModal.note}
              onChangeText={(n) => setVModal({...vModal, note: n})}
          />
      </VendorModal>
      
      <ManualTxModal visible={mModal} theme={theme} onSave={async (data) => {
          await supabase.from('transactions').insert([{ transaction_date: new Date().toISOString(), amount: data.amount, type: data.type === 'INCOME' ? 'CREDIT' : 'DEBIT', account_source: data.source, merchant: data.category ? `${data.category} | ${data.desc}` : `📝 MANUAL | ${data.desc}`, raw_sms: 'Manual' }]);
          setMModal(false); syncData();
      }} onClose={() => setMModal(false)} />

      <View style={[styles.nav, {backgroundColor: theme.card, borderTopColor: theme.border}]}>
        {['DASHBOARD', 'WALLETS', 'PASSBOOK'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={styles.navItem}><Text style={{color: activeTab === t ? theme.accent : theme.subtext, fontSize: 10, fontWeight: 'bold'}}>{t}</Text></TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontWeight: 'bold', fontSize: 18, letterSpacing: 2 },
  addBtn: { width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', padding: 20, borderTopWidth: 1 },
  navItem: { flex: 1, alignItems: 'center' }
});