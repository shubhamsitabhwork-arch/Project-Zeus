import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, PermissionsAndroid, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Platform, RefreshControl, useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { parseBankSMS } from './parser';
import SmsListener from 'react-native-android-sms-listener';
import SmsAndroid from 'react-native-get-sms-android'; 
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo'; 

export default function App() {
  const systemTheme = useColorScheme();
  
  // --- 1. CORE SYSTEM STATES ---
  const [isUnlocked, setIsUnlocked] = useState(false); 
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Booting...'); 
  const [lastSyncTime, setLastSyncTime] = useState('Never');
  const [refreshing, setRefreshing] = useState(false); 
  
  // --- 2. UI & NAVIGATION STATES ---
  const [ghostMode, setGhostMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarView, setActiveSidebarView] = useState('MENU'); 
  const [themeMode, setThemeMode] = useState('system'); 
  
  const isDark = themeMode === 'system' ? systemTheme === 'dark' : themeMode === 'dark';
  const m = (val, isTotal = false) => ghostMode ? (isTotal ? '₹***' : '***') : (isTotal ? `₹${val}` : val);

  // --- 3. HARDWARE SETTINGS & LIMITS ---
  const [monthlyLimit, setMonthlyLimit] = useState('50000');
  const [weeklyLimit, setWeeklyLimit] = useState('10000'); // NEW: Bug 8 (Weekly Limit)
  const [dailyLimit, setDailyLimit] = useState('2000');
  const [visaLimit, setVisaLimit] = useState('60000');
  const [amazonLimit, setAmazonLimit] = useState('150000');
  const [primaryBalance, setPrimaryBalance] = useState('0'); 
  const [amazonPayBalance, setAmazonPayBalance] = useState('0'); 
  const [physicalCashBalance, setPhysicalCashBalance] = useState('0');
  const [vendorMap, setVendorMap] = useState({});

  // --- 4. DECOUPLED RECORDS (Income & Mandates) ---
  const [incomeRecords, setIncomeRecords] = useState([]); // {id, type, source, amount, date, comments}
  const [activeIncomeTab, setActiveIncomeTab] = useState('SALARY');
  const [customMandates, setCustomMandates] = useState([]); // {id, vendor, amount, date, status: 'ACTIVE'|'CLOSED'}

  // --- 5. MODAL STATES (For Manual Entry & Edits) ---
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualSource, setManualSource] = useState('ICICI_ACCOUNT'); 

  const [selectedTx, setSelectedTx] = useState(null);
  const [showTxDetailsModal, setShowTxDetailsModal] = useState(false);
  const [txCategory, setTxCategory] = useState('');

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incSource, setIncSource] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incComments, setIncComments] = useState(''); // NEW: Bug 6 (Income Comments)
  const [selectedIncome, setSelectedIncome] = useState(null);

  const [showMandateModal, setShowMandateModal] = useState(false);
  const [mandateVendor, setMandateVendor] = useState('');
  const [mandateAmount, setMandateAmount] = useState(''); // NEW: Bug 6 (Mandate Amount)
  const [mandateDate, setMandateDate] = useState('');
  const [selectedMandate, setSelectedMandate] = useState(null);

  const [selectedVendorEntity, setSelectedVendorEntity] = useState(null); // NEW: Bug 7 (Edit Vendors)

  // --- 6. BOOT SEQUENCE & DATA LOADING ---
  useEffect(() => { checkNetwork(); loadLocalDataFirst(); authenticateUser(); }, []);

  function checkNetwork() {
    NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
      if (!state.isConnected) setSyncStatus('⚠️ OFFLINE');
    });
  }

  async function loadLocalDataFirst() {
    try {
      const keys = ['monthlyLimit', 'weeklyLimit', 'dailyLimit', 'visaLimit', 'amazonLimit', 'primaryBalance', 'amazonPayBalance', 'physicalCashBalance', 'vendorMap', 'themeMode', 'lastSyncTime', 'incomeRecords', 'customMandates'];
      const values = await AsyncStorage.multiGet(keys);
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'monthlyLimit') setMonthlyLimit(value);
          if (key === 'weeklyLimit') setWeeklyLimit(value);
          if (key === 'dailyLimit') setDailyLimit(value);
          if (key === 'visaLimit') setVisaLimit(value);
          if (key === 'amazonLimit') setAmazonLimit(value);
          if (key === 'primaryBalance') setPrimaryBalance(value);
          if (key === 'amazonPayBalance') setAmazonPayBalance(value);
          if (key === 'physicalCashBalance') setPhysicalCashBalance(value);
          if (key === 'vendorMap') setVendorMap(JSON.parse(value));
          if (key === 'themeMode') setThemeMode(value);
          if (key === 'lastSyncTime') setLastSyncTime(value);
          if (key === 'incomeRecords') setIncomeRecords(JSON.parse(value));
          if (key === 'customMandates') setCustomMandates(JSON.parse(value));
        }
      });
      const cachedTx = await AsyncStorage.getItem('cachedTransactions');
      if (cachedTx) setTransactions(JSON.parse(cachedTx));
    } catch (e) { console.warn("Cache load failed."); }
  }

  async function saveSetting(key, value) { try { await AsyncStorage.setItem(key, value); } catch (e) {} }

  async function authenticateUser() {
    if (Platform.OS !== 'android') { setIsUnlocked(true); bootSystem(); return; }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Project Zeus", fallbackLabel: "Use PIN" });
      if (result.success) { setIsUnlocked(true); bootSystem(); } else { Alert.alert("Access Denied"); }
    } else { setIsUnlocked(true); bootSystem(); }
  }

  // --- 7. SYNC ENGINE (Fixing Bug 1) ---
  function bootSystem() { requestSMSPermission(); }

  async function requestSMSPermission() {
    if (Platform.OS !== 'android') { setSyncStatus('Web Mode 🌐'); syncCloudTransactions(); return; }
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      const grantedReceive = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      if (granted === PermissionsAndroid.RESULTS.GRANTED && grantedReceive === PermissionsAndroid.RESULTS.GRANTED) {
        await syncCloudTransactions(); // First pull from cloud
        startRadar(); // Start listening for live messages
      } else { setSyncStatus('SMS Permission Denied'); }
    } catch (err) { console.warn(err); }
  }

  function updateSyncTime() {
      const now = new Date();
      const timeString = `${now.getDate()}/${now.getMonth()+1} • ${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
      setLastSyncTime(timeString); saveSetting('lastSyncTime', timeString);
  }

  async function syncCloudTransactions() {
    if (isOffline) return; 
    setSyncStatus('Syncing Cloud...');
    const { data, error } = await supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (data && !error) { 
        setTransactions(data); 
        await AsyncStorage.setItem('cachedTransactions', JSON.stringify(data)); 
        setSyncStatus(`Synced 🟢`); updateSyncTime();
        
        // BUG 1 FIX: Immediately trigger SMS Inbox scan after cloud sync to catch messages received while app was closed
        if (Platform.OS === 'android') {
            const latestDate = data.length > 0 ? data[0].created_at : null;
            syncMissedMessages(latestDate);
        }
    } else { setSyncStatus('Cloud Unreachable'); }
  }

  // Reads the physical SMS inbox for anything missed while app was closed
  function syncMissedMessages(latestDbTransactionTime) {
    if (Platform.OS !== 'android' || isOffline) return;
    setSyncStatus('Scanning Inbox...');
    // Look back 7 days max, or from the last recorded transaction
    const minDate = latestDbTransactionTime ? new Date(latestDbTransactionTime).getTime() : new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    
    SmsAndroid.list(JSON.stringify({ box: 'inbox', minDate: minDate }), (fail) => { setSyncStatus('Inbox Scan Failed'); }, async (count, smsList) => {
      const messages = JSON.parse(smsList);
      let newInserts = 0;
      for (let message of messages) {
        const extractedData = parseBankSMS(message.body, vendorMap);
        if (extractedData) {
          // Check Supabase to prevent duplicate inserts
          const { data: existing } = await supabase.from('transactions').select('id').eq('raw_sms', message.body);
          if (existing && existing.length === 0) {
            await supabase.from('transactions').insert([{ transaction_date: new Date(message.date).toISOString(), amount: extractedData.amount, type: extractedData.type, account_source: extractedData.source, merchant: extractedData.merchant, raw_sms: message.body }]);
            newInserts++;
          }
        }
      }
      // If we found missing messages, refresh the cloud data
      if (newInserts > 0) { await syncCloudTransactions(); }
      else { setSyncStatus(`Synced 🟢`); }
    });
  }

  // Listens for messages while app is currently open
  function startRadar() {
    if (Platform.OS !== 'android') return;
    SmsListener.addListener(async (message) => {
      const extractedData = parseBankSMS(message.body, vendorMap);
      if (!extractedData) return; 
      const newTx = { transaction_date: new Date().toISOString(), amount: extractedData.amount, type: extractedData.type, account_source: extractedData.source, merchant: extractedData.merchant, raw_sms: message.body };
      setTransactions(prev => [newTx, ...prev]);
      if (!isOffline) { await supabase.from('transactions').insert([newTx]); syncCloudTransactions(); } 
    });
  }

  const onRefresh = useCallback(async () => { setRefreshing(true); await syncCloudTransactions(); setRefreshing(false); }, [isOffline]);

  // --- 8. CRUD OPERATIONS (Create, Read, Update, Delete) ---

  async function executeManualTransaction() {
    if (!manualAmount || !manualDesc) return Alert.alert("Error", "Fill amount and description");
    const amountFloat = parseFloat(manualAmount); const dateIso = new Date().toISOString();
    
    let builtMerchant = manualDesc;
    if (manualCategory) builtMerchant = `${manualCategory} | ${builtMerchant}`;
    else builtMerchant = `📝 MANUAL | ${builtMerchant}`;

    const inserts = [{ transaction_date: dateIso, amount: amountFloat, type: 'DEBIT', account_source: manualSource, merchant: builtMerchant, raw_sms: 'Manual Entry' }];
    const { error } = await supabase.from('transactions').insert(inserts);
    if (!error) { 
        setShowManualModal(false); setManualAmount(''); setManualDesc(''); setManualCategory(''); syncCloudTransactions(); 
    } else { Alert.alert("Error", "Could not save."); }
  }

  const handleDeepTagUpdate = async () => {
      if (!selectedTx || !txCategory) return;
      const rawMerchant = selectedTx.merchant.split(' | ')[1] || selectedTx.merchant;
      const cleanMerchantName = rawMerchant.split(' ')[0]; 
      
      // Update Neural Memory (Bug 5 Fix)
      const newMap = { ...vendorMap, [cleanMerchantName]: txCategory };
      setVendorMap(newMap); await AsyncStorage.setItem('vendorMap', JSON.stringify(newMap));
      
      // Update current transaction in Supabase
      const finalMerchantString = `${txCategory} | ${rawMerchant}`;
      const { error } = await supabase.from('transactions').update({ merchant: finalMerchantString }).eq('id', selectedTx.id);
      
      if (!error) {
          setShowTxDetailsModal(false); setTxCategory(''); syncCloudTransactions();
          Alert.alert("Success", `${cleanMerchantName} categorized as ${txCategory}`);
      }
  };

  const handleIncomeSave = () => {
      if (!incSource || !incAmount) return;
      let updated;
      if (selectedIncome) { // Modify
          updated = incomeRecords.map(r => r.id === selectedIncome.id ? {...r, source: incSource, amount: parseFloat(incAmount), comments: incComments} : r);
      } else { // Create
          const newRec = { id: Date.now().toString(), type: activeIncomeTab, source: incSource, amount: parseFloat(incAmount), date: new Date().toISOString().split('T')[0], comments: incComments };
          updated = [newRec, ...incomeRecords];
      }
      setIncomeRecords(updated); saveSetting('incomeRecords', JSON.stringify(updated));
      setShowIncomeModal(false); setIncSource(''); setIncAmount(''); setIncComments(''); setSelectedIncome(null);
  };

  const deleteIncome = (id) => {
      const updated = incomeRecords.filter(r => r.id !== id);
      setIncomeRecords(updated); saveSetting('incomeRecords', JSON.stringify(updated));
      setShowIncomeModal(false); setSelectedIncome(null);
  };

  const handleMandateSave = () => {
      if (!mandateVendor || !mandateDate || !mandateAmount) return;
      let updated;
      if (selectedMandate) { // Modify
          updated = customMandates.map(m => m.id === selectedMandate.id ? {...m, vendor: mandateVendor, date: mandateDate, amount: parseFloat(mandateAmount)} : m);
      } else { // Create
          const newMan = { id: Date.now().toString(), vendor: mandateVendor, amount: parseFloat(mandateAmount), date: mandateDate, status: 'ACTIVE' };
          updated = [newMan, ...customMandates];
      }
      setCustomMandates(updated); saveSetting('customMandates', JSON.stringify(updated));
      setShowMandateModal(false); setMandateVendor(''); setMandateDate(''); setMandateAmount(''); setSelectedMandate(null);
  };

  const deleteMandate = (id) => {
      const updated = customMandates.filter(m => m.id !== id);
      setCustomMandates(updated); saveSetting('customMandates', JSON.stringify(updated));
      setShowMandateModal(false); setSelectedMandate(null);
  };

  const changeMandateStatus = (id, status) => {
      const updated = customMandates.map(m => m.id === id ? {...m, status: status} : m);
      setCustomMandates(updated); saveSetting('customMandates', JSON.stringify(updated));
      setShowMandateModal(false); setSelectedMandate(null);
  };

  const deleteVendorMapping = (vendorName) => {
      const newMap = {...vendorMap};
      delete newMap[vendorName];
      setVendorMap(newMap); saveSetting('vendorMap', JSON.stringify(newMap));
      setSelectedVendorEntity(null);
  };

  async function clearVault() {
    Alert.alert("DANGER ZONE", "Wipe all transactions?", [{ text: "Cancel", style: "cancel" }, { text: "WIPE", style: "destructive", onPress: async () => { await supabase.from('transactions').delete().neq('id', 0); syncCloudTransactions(); }}]);
  }

  // --- 9. CORE MATHEMATICAL ENGINE ---
  const debits = transactions.filter(t => t.type === 'DEBIT');
  const credits = transactions.filter(t => t.type === 'CREDIT'); 
  const totalSpent = debits.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0); 
  const netCashflow = totalIncome - totalSpent; 

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // BUG 8: Weekly Limit Math (Resets on Monday)
  const getLastMonday = () => {
      const d = new Date();
      const day = d.getDay() || 7; 
      if (day !== 1) d.setHours(-24 * (day - 1)); 
      return d.toISOString().split('T')[0];
  };
  const lastMonday = getLastMonday();
  const spentThisWeek = debits.filter(t => t.transaction_date && t.transaction_date >= lastMonday).reduce((sum, t) => sum + t.amount, 0);

  // BUG 2: Daily Velocity is now Net Spend
  const debitsToday = debits.filter(t => t.transaction_date && t.transaction_date.startsWith(today)).reduce((sum, t) => sum + t.amount, 0);
  const creditsToday = credits.filter(t => t.transaction_date && t.transaction_date.startsWith(today)).reduce((sum, t) => sum + t.amount, 0);
  const netSpentToday = Math.max(0, debitsToday - creditsToday); // Prevent negative display

  const spentThisMonth = debits.filter(t => t.transaction_date && t.transaction_date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0);
  const earnedThisMonth = credits.filter(t => t.transaction_date && t.transaction_date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0);

  const monthlyPercent = Math.min((spentThisMonth / parseFloat(monthlyLimit || 1)) * 100, 100);
  const weeklyPercent = Math.min((spentThisWeek / parseFloat(weeklyLimit || 1)) * 100, 100);
  const isVelocityBreached = netSpentToday > parseFloat(dailyLimit);

  // Liquid Balances
  const vaultDebits = debits.filter(t => t.account_source === 'ICICI_ACCOUNT' || t.account_source === 'DEBIT_CARD').reduce((sum, t) => sum + t.amount, 0);
  const vaultCredits = credits.filter(t => t.account_source === 'ICICI_ACCOUNT' || t.account_source === 'DEBIT_CARD').reduce((sum, t) => sum + t.amount, 0);
  const currentPrimaryBalance = parseFloat(primaryBalance || 0) + vaultCredits - vaultDebits;
  
  const cashDebits = debits.filter(t => t.account_source === 'PHYSICAL_CASH').reduce((sum, t) => sum + t.amount, 0);
  const cashCredits = credits.filter(t => t.account_source === 'PHYSICAL_CASH').reduce((sum, t) => sum + t.amount, 0);
  const currentCashBalance = parseFloat(physicalCashBalance || 0) + cashCredits - cashDebits;
  
  const apayBalanceDebits = debits.filter(t => t.account_source === 'AMAZON_PAY_BALANCE').reduce((sum, t) => sum + t.amount, 0);
  const apayBalanceCredits = credits.filter(t => t.account_source === 'AMAZON_PAY_BALANCE').reduce((sum, t) => sum + t.amount, 0);
  const currentAmazonPayBalance = parseFloat(amazonPayBalance || 0) + apayBalanceCredits - apayBalanceDebits;

  // BUG 4: CC Balances and limits
  const visaSpent = debits.filter(t => t.account_source === 'VISA_CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const visaCredits = credits.filter(t => t.account_source === 'VISA_CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const netVisaUsed = Math.max(0, visaSpent - visaCredits); // Actual used amount
  
  const amazonSpent = debits.filter(t => t.account_source === 'AMAZON_CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const amazonCredits = credits.filter(t => t.account_source === 'AMAZON_CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const netAmazonUsed = Math.max(0, amazonSpent - amazonCredits);

  const visaPercent = Math.min((netVisaUsed / parseFloat(visaLimit || 1)) * 100, 100);
  const amazonPercent = Math.min((netAmazonUsed / parseFloat(amazonLimit || 1)) * 100, 100);

  const searchedTransactions = transactions.filter(t => t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) || t.account_source.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- 10. THE THEME ENGINE ---
  const colors = {
      bg: isDark ? (isVelocityBreached ? '#1a0505' : '#0a0a0a') : (isVelocityBreached ? '#ffe5e5' : '#f0f2f5'),
      card: isDark ? '#151515' : '#ffffff',
      text: isDark ? '#ffffff' : '#111111',
      subtext: isDark ? '#888888' : '#666666',
      accent: isVelocityBreached ? '#ff4444' : (isDark ? '#00ffcc' : '#00b386'),
      border: isDark ? '#333333' : '#e0e0e0',
      green: '#00C851', red: '#ff4444', blue: '#007FFF', orange: '#FF9900', purple: '#b366ff'
  };

  if (!isUnlocked) return <View style={{flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: colors.accent, fontSize: 24, fontWeight: 'bold'}}>LOCKED</Text></View>;

  // --- 11. DYNAMIC SIDEBAR RENDERER ---
  const renderSidebarContent = () => {
      switch(activeSidebarView) {
          case 'INCOME': 
              const filteredIncome = incomeRecords.filter(r => r.type === activeIncomeTab);
              const totalLoggedIncome = filteredIncome.reduce((sum, r) => sum + r.amount, 0);
              return (
              <View style={{flex: 1}}>
                  <TouchableOpacity onPress={() => setActiveSidebarView('MENU')} style={{marginBottom: 20}}><Text style={{color: colors.accent}}>← BACK TO MENU</Text></TouchableOpacity>
                  <Text style={{color: colors.green, fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>💼 INCOME LOGS</Text>
                  
                  <View style={{flexDirection: 'row', gap: 5, marginBottom: 15}}>
                      {['SALARY', 'FREELANCE', 'OTHER'].map(tab => (
                          <TouchableOpacity key={tab} onPress={() => setActiveIncomeTab(tab)} style={{flex: 1, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.green, backgroundColor: activeIncomeTab === tab ? colors.green : 'transparent', alignItems: 'center'}}>
                              <Text style={{color: activeIncomeTab === tab ? (isDark ? '#000' : '#fff') : colors.green, fontSize: 10, fontWeight: 'bold'}}>{tab}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>

                  <View style={{padding: 15, backgroundColor: colors.card, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: colors.border}}>
                      <Text style={{color: colors.subtext, fontSize: 10, letterSpacing: 1, marginBottom: 5}}>TOTAL LOGGED ({activeIncomeTab})</Text>
                      <Text style={{color: colors.green, fontSize: 24, fontWeight: 'bold'}}>₹{totalLoggedIncome}</Text>
                  </View>

                  <TouchableOpacity onPress={() => { setSelectedIncome(null); setShowIncomeModal(true); }} style={{backgroundColor: colors.green, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15}}>
                      <Text style={{color: isDark ? '#000' : '#fff', fontWeight: 'bold'}}>+ LOG {activeIncomeTab}</Text>
                  </TouchableOpacity>

                  <FlatList data={filteredIncome} keyExtractor={item => item.id} renderItem={({item}) => (
                      <TouchableOpacity onPress={() => { setSelectedIncome(item); setIncSource(item.source); setIncAmount(item.amount.toString()); setIncComments(item.comments || ''); setShowIncomeModal(true); }} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border}}>
                          <View><Text style={{color: colors.text}}>{item.source}</Text><Text style={{color: colors.subtext, fontSize: 10}}>{item.date}</Text></View>
                          <Text style={{color: colors.green, fontWeight: 'bold'}}>+₹{item.amount}</Text>
                      </TouchableOpacity>
                  )}/>
              </View>
          );
          case 'SUBS': 
              const activeCustoms = customMandates.filter(m => m.status === 'ACTIVE');
              const closedCustoms = customMandates.filter(m => m.status === 'CLOSED');
              const totalSubValue = activeCustoms.reduce((sum, m) => sum + m.amount, 0);
              return (
              <View style={{flex: 1}}>
                  <TouchableOpacity onPress={() => setActiveSidebarView('MENU')} style={{marginBottom: 20}}><Text style={{color: colors.accent}}>← BACK TO MENU</Text></TouchableOpacity>
                  <Text style={{color: colors.purple, fontSize: 18, fontWeight: 'bold', marginBottom: 5}}>🔁 SUBSCRIPTIONS & MANDATES</Text>
                  <Text style={{color: colors.orange, fontSize: 24, fontWeight: 'bold', marginBottom: 15}}>Total: ₹{totalSubValue.toFixed(0)}</Text>
                  
                  <TouchableOpacity onPress={() => { setSelectedMandate(null); setShowMandateModal(true); }} style={{backgroundColor: colors.purple, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15}}>
                      <Text style={{color: '#fff', fontWeight: 'bold'}}>+ ADD MANUAL MANDATE</Text>
                  </TouchableOpacity>

                  <ScrollView showsVerticalScrollIndicator={false}>
                      <Text style={{color: colors.subtext, fontSize: 12, fontWeight: 'bold', marginBottom: 10}}>ACTIVE MANDATES</Text>
                      {activeCustoms.length === 0 && <Text style={{color: colors.subtext, fontSize: 12, marginBottom: 15}}>No active manual mandates.</Text>}
                      {activeCustoms.map(item => (
                          <TouchableOpacity key={item.id} onPress={() => { setSelectedMandate(item); setMandateVendor(item.vendor); setMandateAmount(item.amount.toString()); setMandateDate(item.date); setShowMandateModal(true); }} style={{padding: 15, backgroundColor: colors.card, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.purple}}>
                              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}><Text style={{color: colors.text, fontWeight: 'bold'}}>{item.vendor}</Text><Text style={{color: colors.red}}>₹{item.amount}</Text></View>
                              <Text style={{color: colors.subtext, fontSize: 11, marginTop: 5}}>Deducts on: {item.date}</Text>
                          </TouchableOpacity>
                      ))}

                      <Text style={{color: colors.subtext, fontSize: 12, fontWeight: 'bold', marginTop: 15, marginBottom: 10}}>COMPLETED / CLOSED</Text>
                      {closedCustoms.map(item => (
                          <TouchableOpacity key={item.id} onPress={() => { setSelectedMandate(item); setMandateVendor(item.vendor); setMandateAmount(item.amount.toString()); setMandateDate(item.date); setShowMandateModal(true); }} style={{padding: 15, backgroundColor: colors.card, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border, opacity: 0.6}}>
                              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}><Text style={{color: colors.text, fontWeight: 'bold', textDecorationLine: 'line-through'}}>{item.vendor}</Text><Text style={{color: colors.subtext}}>₹{item.amount}</Text></View>
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              </View>
          );
          case 'SETTINGS': return (
              <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity onPress={() => setActiveSidebarView('MENU')} style={{marginBottom: 20}}><Text style={{color: colors.accent}}>← BACK TO MENU</Text></TouchableOpacity>
                  <Text style={{color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>⚙️ SYSTEM SETTINGS</Text>
                  
                  <Text style={{color: colors.subtext, fontSize: 10}}>DISPLAY THEME</Text>
                  <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
                      {['system', 'dark', 'light'].map(t => (
                          <TouchableOpacity key={t} onPress={() => {setThemeMode(t); saveSetting('themeMode', t)}} style={{flex: 1, padding: 10, backgroundColor: themeMode === t ? colors.accent : colors.bg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center'}}>
                              <Text style={{color: themeMode === t ? (isDark ? '#000' : '#fff') : colors.text, fontSize: 12}}>{t.toUpperCase()}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>

                  <Text style={{color: colors.subtext, fontSize: 10}}>BANK VAULT BALANCE (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={primaryBalance} onChangeText={(v) => {setPrimaryBalance(v); saveSetting('primaryBalance', v)}}/>
                  <Text style={{color: colors.subtext, fontSize: 10}}>PHYSICAL CASH WALLET (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={physicalCashBalance} onChangeText={(v) => {setPhysicalCashBalance(v); saveSetting('physicalCashBalance', v)}}/>
                  <Text style={{color: colors.subtext, fontSize: 10}}>AMAZON PAY BALANCE (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={amazonPayBalance} onChangeText={(v) => {setAmazonPayBalance(v); saveSetting('amazonPayBalance', v)}}/>
                  
                  <Text style={{color: colors.subtext, fontSize: 10}}>MONTHLY SPEND LIMIT (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={monthlyLimit} onChangeText={(v) => {setMonthlyLimit(v); saveSetting('monthlyLimit', v)}}/>
                  <Text style={{color: colors.subtext, fontSize: 10}}>WEEKLY SPEND LIMIT (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={weeklyLimit} onChangeText={(v) => {setWeeklyLimit(v); saveSetting('weeklyLimit', v)}}/>
                  <Text style={{color: colors.subtext, fontSize: 10}}>ICICI VISA CC LIMIT (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={visaLimit} onChangeText={(v) => {setVisaLimit(v); saveSetting('visaLimit', v)}}/>
                  <Text style={{color: colors.subtext, fontSize: 10}}>AMAZON PAY CC LIMIT (₹)</Text>
                  <TextInput style={{backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 10}} keyboardType="numeric" value={amazonLimit} onChangeText={(v) => {setAmazonLimit(v); saveSetting('amazonLimit', v)}}/>

                  <Text style={{color: colors.subtext, fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 10}}>SAVED VENDORS & ENTITIES</Text>
                  <View style={{backgroundColor: colors.card, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 20}}>
                      {Object.keys(vendorMap).length === 0 && <Text style={{color: colors.text, fontSize: 12}}>None yet. Tag vendors in Ledger.</Text>}
                      {Object.keys(vendorMap).map(v => (
                          <TouchableOpacity key={v} onPress={() => setSelectedVendorEntity(v)} style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 5}}>
                              <Text style={{color: colors.text, fontSize: 12}}>• {v}</Text>
                              <Text style={{color: colors.accent, fontSize: 12}}>{vendorMap[v]}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>

                  {/* Force Sync Button for Bug 1 redundancy */}
                  <TouchableOpacity onPress={() => {syncMissedMessages(null); Alert.alert("Scanning", "Force scanning SMS inbox...");}} style={{backgroundColor: colors.card, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 10}}>
                      <Text style={{color: colors.text, fontWeight: 'bold'}}>🔄 FORCE SCAN INBOX</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={clearVault} style={{backgroundColor: '#1a0505', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.red, alignItems: 'center', marginTop: 10, marginBottom: 40}}>
                      <Text style={{color: colors.red, fontWeight: 'bold'}}>⚠️ WIPE CLOUD VAULT</Text>
                  </TouchableOpacity>
              </ScrollView>
          );
          default: return (
              <View>
                  <Text style={{color: colors.text, fontSize: 24, fontWeight: 'bold', marginBottom: 30, letterSpacing: 1}}>COMMAND CENTER</Text>
                  <TouchableOpacity onPress={() => setActiveSidebarView('INCOME')} style={{padding: 15, backgroundColor: colors.card, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border}}><Text style={{color: colors.text, fontSize: 16}}>💼 Income Logs</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveSidebarView('SUBS')} style={{padding: 15, backgroundColor: colors.card, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border}}><Text style={{color: colors.text, fontSize: 16}}>🔁 Subscriptions & Mandates</Text></TouchableOpacity>
                  {/* <TouchableOpacity onPress={() => setActiveSidebarView('SPLIT')} style={{padding: 15, backgroundColor: colors.card, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border}}><Text style={{color: colors.text, fontSize: 16}}>👥 Owed to Me (Debt Tracker)</Text></TouchableOpacity> */}
                  <TouchableOpacity onPress={() => setActiveSidebarView('SETTINGS')} style={{padding: 15, backgroundColor: colors.card, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.border}}><Text style={{color: colors.text, fontSize: 16}}>⚙️ System Settings & Theme</Text></TouchableOpacity>
              </View>
          );
      }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 50, paddingHorizontal: 15 }}>
      
      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <TouchableOpacity onPress={() => {setIsSidebarOpen(true); setActiveSidebarView('MENU');}} style={{padding: 5}}><Text style={{fontSize: 24, color: colors.text}}>☰</Text></TouchableOpacity>
              <View>
                  <Text style={{ color: colors.accent, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }}>PROJECT ZEUS</Text>
                  <Text style={{ color: isOffline ? colors.orange : colors.subtext, fontSize: 10, letterSpacing: 1 }}>{isOffline ? '⚠️ OFFLINE' : syncStatus} • Sync: {lastSyncTime}</Text>
              </View>
          </View>
          <TouchableOpacity onPress={() => setGhostMode(!ghostMode)} style={{ backgroundColor: colors.card, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}><Text style={{fontSize: 16}}>{ghostMode ? '🙈' : '👁️'}</Text></TouchableOpacity>
      </View>

      {/* CORE NAVIGATION TABS */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 5, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
        {['DASHBOARD', 'WALLETS', 'LEDGER'].map((tab) => (
          <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: activeTab === tab ? colors.accent : 'transparent' }} onPress={() => setActiveTab(tab)}>
            <Text style={{ color: activeTab === tab ? (isDark ? '#000' : '#fff') : colors.subtext, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- DASHBOARD --- */}
      {activeTab === 'DASHBOARD' && (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
          <View style={{ backgroundColor: colors.card, padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: isVelocityBreached ? colors.red : colors.border }}>
            <Text style={{ color: colors.subtext, fontSize: 10, letterSpacing: 2, marginBottom: 5 }}>DAILY NET SPEND</Text>
            <Text style={{ color: isVelocityBreached ? colors.red : colors.text, fontSize: 40, fontWeight: 'bold', letterSpacing: -1 }}>{m(netSpentToday.toFixed(0), true)} <Text style={{fontSize: 14, color: colors.subtext}}>/ {dailyLimit}</Text></Text>
          </View>
          
          <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: colors.subtext, fontSize: 10, letterSpacing: 2 }}>WEEKLY LIMIT (Resets Mon)</Text>
              <Text style={{ color: colors.subtext, fontSize: 10 }}>{m((parseFloat(weeklyLimit) - spentThisWeek).toFixed(0), true)} left</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: '100%', borderRadius: 4, width: `${weeklyPercent}%`, backgroundColor: weeklyPercent > 90 ? colors.red : colors.blue }} /></View>
          </View>

          <View style={{ backgroundColor: colors.card, padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: colors.subtext, fontSize: 10, letterSpacing: 2 }}>MONTHLY LIMIT (₹{monthlyLimit})</Text>
              <Text style={{ color: colors.subtext, fontSize: 10 }}>{m(spentThisMonth.toFixed(0), true)} spent</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: '100%', borderRadius: 4, width: `${monthlyPercent}%`, backgroundColor: monthlyPercent > 90 ? colors.red : colors.accent }} /></View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ flex: 0.48, backgroundColor: colors.card, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.green, borderLeftWidth: 3 }}>
              <Text style={{ color: colors.subtext, fontSize: 10, letterSpacing: 2, marginBottom: 5 }}>NET CASHFLOW</Text>
              <Text style={{ color: netCashflow >= 0 ? colors.green : colors.red, fontSize: 22, fontWeight: 'bold' }}>{netCashflow >= 0 ? '+' : ''}{m(netCashflow.toFixed(0), true)}</Text>
            </View>
            <View style={{ flex: 0.48, backgroundColor: colors.card, padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.blue }}>
              <Text style={{ color: colors.subtext, fontSize: 10, letterSpacing: 2, marginBottom: 5 }}>TOTAL INCOME</Text>
              <Text style={{ color: colors.blue, fontSize: 22, fontWeight: 'bold' }}>+{m(earnedThisMonth.toFixed(0), true)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* --- WALLETS --- */}
      {activeTab === 'WALLETS' && (
        <ScrollView showsVerticalScrollIndicator={false}>
           <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginTop: 10, marginBottom: 10, marginLeft: 5 }}>LIQUID ASSETS</Text>
           
           <TouchableOpacity onPress={() => {setActiveTab('LEDGER'); setSearchQuery('ICICI_ACCOUNT');}} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.green }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>🏦 PRIMARY BANK VAULT</Text>
            <Text style={{ color: currentPrimaryBalance < 0 ? colors.red : colors.green, fontSize: 30, fontWeight: 'bold', marginTop: 10 }}>{m(currentPrimaryBalance.toFixed(2), true)}</Text>
           </TouchableOpacity>
           
           <TouchableOpacity onPress={() => {setActiveTab('LEDGER'); setSearchQuery('PHYSICAL_CASH');}} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.green }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>💵 PHYSICAL CASH</Text>
            <Text style={{ color: currentCashBalance < 0 ? colors.red : colors.green, fontSize: 30, fontWeight: 'bold', marginTop: 10 }}>{m(currentCashBalance.toFixed(2), true)}</Text>
           </TouchableOpacity>

           <TouchableOpacity onPress={() => {setActiveTab('LEDGER'); setSearchQuery('AMAZON_PAY_BALANCE');}} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.orange }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>💰 AMAZON PAY BALANCE</Text>
            <Text style={{ color: colors.orange, fontSize: 30, fontWeight: 'bold', marginTop: 10 }}>{m(currentAmazonPayBalance.toFixed(2), true)}</Text>
           </TouchableOpacity>

           <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginTop: 10, marginBottom: 10, marginLeft: 5 }}>CREDIT CARDS</Text>
           
           <TouchableOpacity onPress={() => {setActiveTab('LEDGER'); setSearchQuery('VISA');}} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: visaPercent > 85 ? colors.red : colors.border, borderLeftWidth: 4, borderLeftColor: colors.accent }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>💳 ICICI VISA CC</Text><Text style={{ color: colors.red, fontSize: 16, fontWeight: 'bold' }}>Used: {m(netVisaUsed.toFixed(0), true)}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}><Text style={{ color: colors.subtext, fontSize: 11 }}>Limit: ₹{visaLimit}</Text><Text style={{ color: colors.green, fontSize: 11, fontWeight: 'bold' }}>Left: ₹{parseFloat(visaLimit) - netVisaUsed}</Text></View>
            <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: '100%', borderRadius: 4, width: `${visaPercent}%`, backgroundColor: visaPercent > 85 ? colors.red : colors.blue }} /></View>
           </TouchableOpacity>

           <TouchableOpacity onPress={() => {setActiveTab('LEDGER'); setSearchQuery('AMAZON_CREDIT');}} style={{ backgroundColor: colors.card, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: amazonPercent > 85 ? colors.red : colors.border, borderLeftWidth: 4, borderLeftColor: colors.orange }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}><Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 }}>📦 AMAZON PAY CC</Text><Text style={{ color: colors.red, fontSize: 16, fontWeight: 'bold' }}>Used: {m(netAmazonUsed.toFixed(0), true)}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}><Text style={{ color: colors.subtext, fontSize: 11 }}>Limit: ₹{amazonLimit}</Text><Text style={{ color: colors.green, fontSize: 11, fontWeight: 'bold' }}>Left: ₹{parseFloat(amazonLimit) - netAmazonUsed}</Text></View>
            <View style={{ height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: '100%', borderRadius: 4, width: `${amazonPercent}%`, backgroundColor: amazonPercent > 85 ? colors.red : colors.orange }} /></View>
           </TouchableOpacity>
        </ScrollView>
      )}

      {/* --- LEDGER --- */}
      {activeTab === 'LEDGER' && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TextInput style={{ flex: 1, backgroundColor: colors.card, color: colors.text, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 16 }} placeholder="Search logs..." placeholderTextColor={colors.subtext} value={searchQuery} onChangeText={setSearchQuery}/>
            <TouchableOpacity onPress={() => setShowManualModal(true)} style={{ backgroundColor: colors.card, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }}><Text style={{fontSize: 20}}>➕</Text></TouchableOpacity>
          </View>
          <FlatList
            data={searchedTransactions}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            renderItem={({ item }) => {
                const isCash = item.account_source === 'PHYSICAL_CASH';
                return (
                <TouchableOpacity onPress={() => { setSelectedTx(item); setTxCategory(item.merchant.split(' | ')[0] || ''); setShowTxDetailsModal(true); }} style={{ backgroundColor: colors.card, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: isCash ? colors.green : colors.border }}>
                  <View style={{flex: 1}}>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: 'bold' }}>{item.merchant}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                        {isCash && <Text style={{backgroundColor: colors.green, color: '#000', fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginRight: 5}}>CASH</Text>}
                        <Text style={{ color: colors.accent, fontSize: 10, letterSpacing: 1, fontWeight: 'bold' }}>{item.account_source.replace('PHYSICAL_CASH', '')} • {item.transaction_date.split('T')[0]}</Text>
                    </View>
                  </View>
                  <Text style={{ color: item.type === 'DEBIT' ? colors.red : colors.green, fontSize: 18, fontWeight: 'bold' }}>{item.type === 'DEBIT' ? '-' : '+'}{m(item.amount, true)}</Text>
                </TouchableOpacity>
                )
            }}
          />
        </View>
      )}

      {/* --- SIDEBAR MODAL --- */}
      <Modal visible={isSidebarOpen} animationType="fade" transparent={true}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' }}>
              <View style={{ width: '85%', height: '100%', backgroundColor: colors.bg, padding: 20, paddingTop: 50, borderRightWidth: 1, borderColor: colors.border }}>
                  {renderSidebarContent()}
              </View>
              <TouchableOpacity style={{ width: '15%', height: '100%' }} onPress={() => {setIsSidebarOpen(false); setActiveSidebarView('MENU');}} />
          </View>
      </Modal>

      {/* --- UNIVERSAL MANUAL TX MODAL --- */}
      <Modal visible={showManualModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 15, width: '90%', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' }}>LOG TRANSACTION</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15}}>
                {['ICICI_ACCOUNT', 'PHYSICAL_CASH', 'VISA_CREDIT', 'AMAZON_CREDIT'].map(src => (
                    <TouchableOpacity key={src} onPress={() => setManualSource(src)} style={{ padding: 6, borderRadius: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: manualSource === src ? colors.border : 'transparent' }}>
                        <Text style={{ color: colors.text, fontSize: 10 }}>{src.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }} placeholder="Amount (₹)" placeholderTextColor={colors.subtext} keyboardType="numeric" value={manualAmount} onChangeText={setManualAmount}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 14, marginBottom: 10 }} placeholder="Description / Vendor" placeholderTextColor={colors.subtext} value={manualDesc} onChangeText={setManualDesc}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 14, marginBottom: 10 }} placeholder="Category (e.g. 🍔 FOOD)" placeholderTextColor={colors.subtext} value={manualCategory} onChangeText={setManualCategory}/>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity onPress={() => setShowManualModal(false)}><Text style={{color: colors.red, fontSize: 16, padding: 10}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={executeManualTransaction} style={{backgroundColor: colors.accent, padding: 10, borderRadius: 8}}><Text style={{color: isDark ? '#000' : '#fff', fontWeight: 'bold'}}>EXECUTE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- DEEP TAGGING (CATEGORY ONLY) MODAL --- */}
      <Modal visible={showTxDetailsModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 15, width: '85%', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, textAlign: 'center' }}>TRANSACTION CATEGORY</Text>
            <Text style={{color: colors.subtext, marginBottom: 15, textAlign: 'center'}}>{selectedTx?.merchant.split(' | ')[1]}</Text>
            <Text style={{color: colors.subtext, fontSize: 10}}>CATEGORY (e.g. 👨‍👩‍👦 FAMILY, 🍔 FOOD)</Text>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10 }} placeholder="Category" placeholderTextColor={colors.subtext} value={txCategory} onChangeText={setTxCategory}/>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
              <TouchableOpacity onPress={() => setShowTxDetailsModal(false)}><Text style={{color: colors.red, padding: 10}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleDeepTagUpdate} style={{backgroundColor: colors.accent, padding: 10, borderRadius: 8}}><Text style={{color: isDark ? '#000' : '#fff', fontWeight: 'bold'}}>UPDATE MEMORY</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- INCOME EDIT/CREATE MODAL --- */}
      <Modal visible={showIncomeModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 15, width: '85%', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.green, fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' }}>{selectedIncome ? 'EDIT' : 'LOG'} {activeIncomeTab}</Text>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10 }} placeholder="Source (e.g. Company Name)" placeholderTextColor={colors.subtext} value={incSource} onChangeText={setIncSource}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10, fontWeight: 'bold' }} placeholder="Amount (₹)" placeholderTextColor={colors.subtext} keyboardType="numeric" value={incAmount} onChangeText={setIncAmount}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 14, marginBottom: 10 }} placeholder="Comments / Notes (Optional)" placeholderTextColor={colors.subtext} value={incComments} onChangeText={setIncComments}/>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity onPress={() => setShowIncomeModal(false)}><Text style={{color: colors.text, padding: 10}}>Cancel</Text></TouchableOpacity>
              {selectedIncome && <TouchableOpacity onPress={() => deleteIncome(selectedIncome.id)}><Text style={{color: colors.red, padding: 10}}>Delete</Text></TouchableOpacity>}
              <TouchableOpacity onPress={handleIncomeSave} style={{backgroundColor: colors.green, padding: 10, borderRadius: 8}}><Text style={{color: '#000', fontWeight: 'bold'}}>SAVE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MANDATE EDIT/CREATE MODAL --- */}
      <Modal visible={showMandateModal} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 15, width: '85%', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.purple, fontSize: 18, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' }}>{selectedMandate ? 'EDIT' : 'ADD'} MANDATE</Text>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10 }} placeholder="Vendor Name" placeholderTextColor={colors.subtext} value={mandateVendor} onChangeText={setMandateVendor}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10 }} placeholder="Amount (₹)" placeholderTextColor={colors.subtext} keyboardType="numeric" value={mandateAmount} onChangeText={setMandateAmount}/>
            <TextInput style={{ backgroundColor: colors.bg, color: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, fontSize: 16, marginBottom: 10 }} placeholder="Date (e.g. 5th)" placeholderTextColor={colors.subtext} value={mandateDate} onChangeText={setMandateDate}/>
            
            {selectedMandate && (
                <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10}}>
                    <TouchableOpacity onPress={() => changeMandateStatus(selectedMandate.id, 'ACTIVE')} style={{borderWidth: 1, borderColor: selectedMandate.status === 'ACTIVE' ? colors.green : colors.border, padding: 8, borderRadius: 6}}><Text style={{color: selectedMandate.status === 'ACTIVE' ? colors.green : colors.subtext}}>Mark Active</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMandateStatus(selectedMandate.id, 'CLOSED')} style={{borderWidth: 1, borderColor: selectedMandate.status === 'CLOSED' ? colors.red : colors.border, padding: 8, borderRadius: 6}}><Text style={{color: selectedMandate.status === 'CLOSED' ? colors.red : colors.subtext}}>Mark Closed</Text></TouchableOpacity>
                </View>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity onPress={() => setShowMandateModal(false)}><Text style={{color: colors.text, padding: 10}}>Cancel</Text></TouchableOpacity>
              {selectedMandate && <TouchableOpacity onPress={() => deleteMandate(selectedMandate.id)}><Text style={{color: colors.red, padding: 10}}>Delete</Text></TouchableOpacity>}
              <TouchableOpacity onPress={handleMandateSave} style={{backgroundColor: colors.purple, padding: 10, borderRadius: 8}}><Text style={{color: '#fff', fontWeight: 'bold'}}>SAVE</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- VENDOR EDIT MODAL (Settings) --- */}
      <Modal visible={!!selectedVendorEntity} animationType="fade" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, padding: 25, borderRadius: 15, width: '80%', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.accent, fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>EDIT VENDOR MEMORY</Text>
            <Text style={{color: colors.text, textAlign: 'center', marginBottom: 20}}>Remove custom category mapping for "{selectedVendorEntity}"?</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity onPress={() => setSelectedVendorEntity(null)}><Text style={{color: colors.text, padding: 10}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteVendorMapping(selectedVendorEntity)} style={{backgroundColor: colors.red, padding: 10, borderRadius: 8}}><Text style={{color: '#fff', fontWeight: 'bold'}}>DELETE MAPPING</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
}