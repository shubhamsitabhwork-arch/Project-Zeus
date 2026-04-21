import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import { requestSmsPermissions, recoverMissedSms } from './src/services/SmsService';
import { exportToCSV } from './src/services/ExportService';
import { authenticateUser } from './src/services/SecurityService'; // NEW
import { calculateNetSpentToday } from './src/services/MathEngine';

// UI
import { getTheme } from './src/styles/theme'; // NEW
import Dashboard from './src/screens/Dashboard';
import Ledger from './src/screens/Ledger';
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
  
  // State initialization
  const [limits, setLimits] = useState({ monthly: '50000', weekly: '10000', visa: '60000', amazon: '150000', daily: '2000' });
  const [balances, setBalances] = useState({ bank: '0', amazonPay: '0', cash: '0' });
  const [vendorMap, setVendorMap] = useState({});
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [mandates, setMandates] = useState([]);
  const [themeMode, setThemeMode] = useState('dark');

  const [vModal, setVModal] = useState({ visible: false, tx: null, cat: '' });
  const [mModal, setMModal] = useState(false);

  // Sync Logic
  const syncData = async () => {
    const { data } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => {
    const initSentinel = async () => {
        // 1. Hardware Security Check
        const success = await authenticateUser();
        if (!success) return;
        setIsUnlocked(true);

        // 2. Load Data
        const stored = await AsyncStorage.multiGet(['limits', 'balances', 'vendorMap', 'incomeRecords', 'mandates', 'themeMode']);
        stored.forEach(([k, v]) => {
            if (v) {
                const p = JSON.parse(v);
                if (k === 'limits') setLimits(p);
                else if (k === 'balances') setBalances(p);
                else if (k === 'vendorMap') setVendorMap(p);
                else if (k === 'incomeRecords') setIncomeRecords(p);
                else if (k === 'mandates') setMandates(p);
                else if (k === 'themeMode') setThemeMode(p);
            }
        });
        await syncData();
        const hasPerm = await requestSmsPermissions();
        if (hasPerm) recoverMissedSms(vendorMap, syncData);
    };
    initSentinel();
  }, []);

  const netSpentToday = calculateNetSpentToday(transactions);
  const isVelocityBreached = netSpentToday > parseFloat(limits.daily);
  const theme = getTheme(themeMode, isVelocityBreached);

  const getLiquidBal = (src, initial) => {
    const c = transactions.filter(t => t.account_source === src && t.type === 'CREDIT').reduce((s,t)=>s+t.amount, 0);
    const d = transactions.filter(t => t.account_source === src && t.type === 'DEBIT').reduce((s,t)=>s+t.amount, 0);
    return parseFloat(initial) + c - d;
  };

  const totalLiquidity = getLiquidBal('ICICI_ACCOUNT', balances.bank) + getLiquidBal('PHYSICAL_CASH', balances.cash) + getLiquidBal('AMAZON_PAY_BALANCE', balances.amazonPay);

  // Guard Clause for Security
  if (!isUnlocked) {
      return (
          <View style={{flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center'}}>
              <Text style={{color: '#00ffcc', fontWeight: 'bold', letterSpacing: 5, marginBottom: 20}}>ZEUS SECURED</Text>
              <ActivityIndicator color="#00ffcc" />
              <TouchableOpacity onPress={() => authenticateUser().then(s => setIsUnlocked(s))} style={{marginTop: 30}}>
                  <Text style={{color: '#fff'}}>Tap to Unlock</Text>
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}><Text style={{fontSize: 24, color: theme.text}}>☰</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.accent }]}>PROJECT ZEUS</Text>
        <TouchableOpacity onPress={() => setMModal(true)} style={[styles.addBtn, {backgroundColor: theme.accent}]}>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#000'}}>＋</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'DASHBOARD' && <Dashboard transactions={transactions} weeklyLimit={limits.weekly} theme={theme} />}
      {activeTab === 'LEDGER' && <Ledger transactions={transactions} onSelectTransaction={(tx) => setVModal({ visible: true, tx, cat: tx.merchant.split(' | ')[0] })} theme={theme} />}
      {activeTab === 'WALLETS' && <Wallets transactions={transactions} limits={limits} balances={{ bank: getLiquidBal('ICICI_ACCOUNT', balances.bank), amazonPay: getLiquidBal('AMAZON_PAY_BALANCE', balances.amazonPay), cash: getLiquidBal('PHYSICAL_CASH', balances.cash) }} theme={theme} />}
      {activeTab === 'ANALYTICS' && <Analytics transactions={transactions} totalLiquidity={totalLiquidity} onExport={() => exportToCSV(transactions)} theme={theme} />}
      
      {activeTab === 'INCOME' && <IncomeRadar records={incomeRecords} theme={theme} onDelete={(id) => { const u = incomeRecords.filter(r=>r.id!==id); setIncomeRecords(u); AsyncStorage.setItem('incomeRecords', JSON.stringify(u)); }} />}
      {activeTab === 'SUBS' && <Subscriptions mandates={mandates} theme={theme} onUpdateStatus={(id, s) => { const u = mandates.map(m=>m.id===id?{...m, status:s}:m); setMandates(u); AsyncStorage.setItem('mandates', JSON.stringify(u)); }} onDelete={(id) => { const u = mandates.filter(m=>m.id!==id); setMandates(u); AsyncStorage.setItem('mandates', JSON.stringify(u)); }} />}
      {activeTab === 'SETTINGS' && <Settings themeMode={themeMode} theme={theme} onToggleTheme={() => { const n = themeMode === 'dark' ? 'light' : 'dark'; setThemeMode(n); AsyncStorage.setItem('themeMode', JSON.stringify(n)); }} vendorMap={vendorMap} limits={limits} onUpdateLimit={(k,v) => { const n = {...limits, [k]:v}; setLimits(n); AsyncStorage.setItem('limits', JSON.stringify(n)); }} onDeleteVendor={(v) => { const n = {...vendorMap}; delete n[v]; setVendorMap(n); AsyncStorage.setItem('vendorMap', JSON.stringify(n)); }} />}

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={(id) => { setActiveTab(id); setSidebarVisible(false); }} theme={theme} />
      <VendorModal visible={vModal.visible} selectedTx={vModal.tx} txCategory={vModal.cat} setTxCategory={(c)=>setVModal({...vModal, cat: c})} onSave={async () => {
          const name = vModal.tx.merchant.split(' | ')[1].split(' ')[0];
          const newMap = { ...vendorMap, [name]: vModal.cat };
          setVendorMap(newMap); await AsyncStorage.setItem('vendorMap', JSON.stringify(newMap));
          await supabase.from('transactions').update({ merchant: `${vModal.cat} | ${vModal.tx.merchant.split(' | ')[1]}` }).eq('id', vModal.tx.id);
          setVModal({ visible: false, tx: null, cat: '' }); syncData();
      }} onClose={() => setVModal({ ...vModal, visible: false })} theme={theme} />
      
      <ManualTxModal visible={mModal} onSave={async (data) => {
          const tx = { transaction_date: new Date().toISOString(), amount: data.amount, type: data.type === 'INCOME' ? 'CREDIT' : 'DEBIT', account_source: data.source, merchant: data.category ? `${data.category} | ${data.desc}` : `📝 MANUAL | ${data.desc}`, raw_sms: 'Manual' };
          await supabase.from('transactions').insert([tx]);
          setMModal(false); syncData();
      }} onClose={() => setMModal(false)} theme={theme} />

      <View style={[styles.nav, {backgroundColor: theme.card, borderTopColor: theme.border}]}>
        {['DASHBOARD', 'WALLETS', 'LEDGER'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={styles.navItem}>
                <Text style={{color: activeTab === t ? theme.accent : theme.subtext, fontSize: 10, fontWeight: 'bold'}}>{t}</Text>
            </TouchableOpacity>
        ))}
      </View>
      <StatusBar style={themeMode === 'dark' ? "light" : "dark"} />
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