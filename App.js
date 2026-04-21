import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import { requestSmsPermissions, recoverMissedSms } from './src/services/SmsService';
import { exportToCSV } from './src/services/ExportService';
import { authenticateUser } from './src/services/SecurityService';
import { calculateNetSpentToday, getSpendDistribution, checkBudgetBreach } from './src/services/MathEngine';
import { triggerBudgetAlert } from './src/services/NotificationService';

// UI
import { getTheme } from './src/styles/theme';
import Dashboard from './src/screens/Dashboard';
import Passbook from './src/screens/Passbook';
import Wallets from './src/screens/Wallets';
import Insights from './src/screens/Insights';
import Analytics from './src/screens/Analytics';
import IncomeRadar from './src/screens/IncomeRadar';
import Subscriptions from './src/screens/Subscriptions';
import Settings from './src/screens/Settings';
import Owed from './src/screens/Owed'; // NEW
import Sidebar from './src/components/Sidebar';
import VendorModal from './src/components/VendorModal';
import ManualTxModal from './src/components/ManualTxModal';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  const [limits, setLimits] = useState({ monthly: '50000', weekly: '10000', visa: '60000', amazon: '150000', daily: '2000' });
  const [catBudgets, setCatBudgets] = useState({});
  const [balances, setBalances] = useState({ bank: '0', amazonPay: '0', cash: '0' });
  const [vendorMap, setVendorMap] = useState({});
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [mandates, setMandates] = useState([]);
  const [owedRecords, setOwedRecords] = useState([]); // NEW
  const [themeMode, setThemeMode] = useState('dark');
  const [genesisDate, setGenesisDate] = useState(null);

  const [vModal, setVModal] = useState({ visible: false, tx: null, cat: '', note: '' });
  const [mModal, setMModal] = useState(false);

  const syncData = async () => {
    const { data } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (data) {
        setTransactions(data);
        getSpendDistribution(data).forEach(item => {
            const breach = checkBudgetBreach(item.name, item.value, catBudgets);
            if (breach) triggerBudgetAlert(item.name, breach);
        });
    }
  };

  useEffect(() => {
    const boot = async () => {
        const success = await authenticateUser();
        if (!success) return;
        setIsUnlocked(true);
        const stored = await AsyncStorage.multiGet(['limits','catBudgets','balances','vendorMap','incomeRecords','mandates','owedRecords','themeMode','genesisDate']);
        stored.forEach(([k, v]) => {
            if (v) {
                const p = JSON.parse(v);
                if (k === 'limits') setLimits(p);
                else if (k === 'catBudgets') setCatBudgets(p);
                else if (k === 'balances') setBalances(p);
                else if (k === 'vendorMap') setVendorMap(p);
                else if (k === 'incomeRecords') setIncomeRecords(p);
                else if (k === 'mandates') setMandates(p);
                else if (k === 'owedRecords') setOwedRecords(p);
                else if (k === 'themeMode') setThemeMode(p);
                else if (k === 'genesisDate') setGenesisDate(p);
            }
        });
        await syncData();
        const hasPerm = await requestSmsPermissions();
        if (hasPerm) recoverMissedSms(vendorMap, genesisDate, syncData);
    };
    boot();
  }, []);

  const theme = getTheme(themeMode, calculateNetSpentToday(transactions) > parseFloat(limits.daily));
  const totalLiq = parseFloat(balances.bank) + parseFloat(balances.cash) + parseFloat(balances.amazonPay);

  if (!isUnlocked) return <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}><ActivityIndicator color="#00ffcc" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}><Text style={{fontSize: 24, color: theme.text}}>☰</Text></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.accent }]}>PROJECT ZEUS</Text>
        <TouchableOpacity onPress={() => setMModal(true)} style={[styles.addBtn, {backgroundColor: theme.accent}]}><Text style={{fontSize:18, fontWeight:'bold', color:'#000'}}>＋</Text></TouchableOpacity>
      </View>

      {activeTab === 'DASHBOARD' && <Dashboard transactions={transactions} limits={limits} theme={theme} />}
      {activeTab === 'PASSBOOK' && <Passbook transactions={transactions} theme={theme} onDeleteTransaction={async (id) => { await supabase.from('transactions').delete().eq('id', id); syncData(); }} onSelectTransaction={(tx) => setVModal({ visible: true, tx, cat: tx.merchant.split(' | ')[0], note: tx.merchant.match(/\[📝 (.*?)\]/)?.[1] || '' })} />}
      {activeTab === 'WALLETS' && <Wallets transactions={transactions} limits={limits} balances={balances} theme={theme} />}
      {activeTab === 'INSIGHTS' && <Insights transactions={transactions} limits={limits} totalLiquidity={totalLiq} theme={theme} />}
      {activeTab === 'ANALYTICS' && <Analytics transactions={transactions} totalLiquidity={totalLiq} theme={theme} onExport={() => exportToCSV(transactions)} />}
      
      {activeTab === 'OWED' && <Owed records={owedRecords} theme={theme} onSave={(r) => { const u = [r, ...owedRecords]; setOwedRecords(u); AsyncStorage.setItem('owedRecords', JSON.stringify(u)); }} onDelete={(id) => { const u = owedRecords.filter(x=>x.id!==id); setOwedRecords(u); AsyncStorage.setItem('owedRecords', JSON.stringify(u)); }} />}
      {activeTab === 'INCOME' && <IncomeRadar records={incomeRecords} theme={theme} onDelete={(id) => { const u = incomeRecords.filter(x=>x.id!==id); setIncomeRecords(u); AsyncStorage.setItem('incomeRecords', JSON.stringify(u)); }} />}
      {activeTab === 'SUBS' && <Subscriptions mandates={mandates} theme={theme} onUpdateStatus={(id, s) => { const u = mandates.map(m=>m.id===id?{...m, status:s}:m); setMandates(u); AsyncStorage.setItem('mandates', JSON.stringify(u)); }} onDelete={(id) => { const u = mandates.filter(m=>m.id!==id); setMandates(u); AsyncStorage.setItem('mandates', JSON.stringify(u)); }} />}
      {activeTab === 'SETTINGS' && <Settings theme={theme} themeMode={themeMode} limits={limits} catBudgets={catBudgets} onUpdateLimit={(k,v) => { const n = {...limits, [k]:v}; setLimits(n); AsyncStorage.setItem('limits', JSON.stringify(n)); }} onUpdateCatBudget={(c,l) => { const n = {...catBudgets, [c]:parseFloat(l)}; setCatBudgets(n); AsyncStorage.setItem('catBudgets', JSON.stringify(n)); }} onToggleTheme={() => { const n = themeMode === 'dark' ? 'light' : 'dark'; setThemeMode(n); AsyncStorage.setItem('themeMode', JSON.stringify(n)); }} vendorMap={vendorMap} onDeleteVendor={(v) => { const n = {...vendorMap}; delete n[v]; setVendorMap(n); AsyncStorage.setItem('vendorMap', JSON.stringify(n)); }} onSetGenesis={async () => { const now = new Date().toISOString(); setGenesisDate(now); await AsyncStorage.setItem('genesisDate', JSON.stringify(now)); syncData(); }} />}

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={(id) => { setActiveTab(id); setSidebarVisible(false); }} theme={theme} />
      <VendorModal visible={vModal.visible} theme={theme} selectedTx={vModal.tx} txCategory={vModal.cat} setTxCategory={(c)=>setVModal({...vModal, cat: c})} onSave={async () => {
          const raw = vModal.tx.merchant.split(' | ')[1] || vModal.tx.merchant;
          const clean = raw.split(' [')[0].split(' ')[0];
          const newMap = { ...vendorMap, [clean]: vModal.cat };
          setVendorMap(newMap); await AsyncStorage.setItem('vendorMap', JSON.stringify(newMap));
          let final = `${vModal.cat} | ${raw.split(' [')[0]}`;
          if (vModal.note) final += ` [📝 ${vModal.note}]`;
          await supabase.from('transactions').update({ merchant: final }).eq('id', vModal.tx.id);
          setVModal({ visible: false, tx: null, cat: '', note: '' }); syncData();
      }} onClose={() => setVModal({ ...vModal, visible: false })} />
      <ManualTxModal visible={mModal} theme={theme} onSave={async (data) => {
          await supabase.from('transactions').insert([{ transaction_date: new Date().toISOString(), amount: data.amount, type: data.type === 'INCOME' ? 'CREDIT' : 'DEBIT', account_source: data.source, merchant: data.category ? `${data.category} | ${data.desc}` : `📝 MANUAL | ${data.desc}`, raw_sms: 'Manual' }]);
          setMModal(false); syncData();
      }} onClose={() => setMModal(false)} />

      <View style={[styles.nav, {backgroundColor: theme.card, borderTopColor: theme.border}]}>
        {['DASHBOARD', 'WALLETS', 'PASSBOOK', 'INSIGHTS'].map(t => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={styles.navItem}><Text style={{color: activeTab === t ? theme.accent : theme.subtext, fontSize: 9, fontWeight: 'bold'}}>{t}</Text></TouchableOpacity>
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