/**
 * PROJECT ZEUS MATH ENGINE v19.0
 * Purpose: Behavioral analytics and advanced runway forecasting.
 */

export const calculateNetSpentToday = (transactions) => {
    const today = new Date().toISOString().split('T')[0];
    const dSum = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(today)).reduce((s,t)=>s+t.amount,0);
    const cSum = transactions.filter(t => t.type === 'CREDIT' && t.transaction_date.startsWith(today)).reduce((s,t)=>s+t.amount,0);
    return Math.max(0, dSum - cSum);
};

export const getSpendingArchetype = (transactions, monthlyLimit) => {
    const curMonth = new Date().toISOString().slice(0, 7);
    const spent = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(curMonth)).reduce((s,t)=>s+t.amount,0);
    const ratio = spent / parseFloat(monthlyLimit);

    if (ratio < 0.3) return { label: "🛡️ DEFENSIVE", color: "#00C851", advice: "High discipline. Capital is preserved." };
    if (ratio < 0.7) return { label: "⚖️ BALANCED", color: "#00ffcc", advice: "Steady burn rate. You are on track." };
    if (ratio < 0.9) return { label: "🔥 AGGRESSIVE", color: "#FF9900", advice: "High consumption. Deploy guardrails." };
    return { label: "🚨 CRITICAL", color: "#ff4444", advice: "Limit breached. Stop all non-essential flow." };
};

export const calculateRunway = (liq, txs) => {
    if (txs.length < 5) return "CALIBRATING...";
    const last14 = new Date(); last14.setDate(last14.getDate() - 14);
    const burn = txs.filter(t => t.type === 'DEBIT' && t.transaction_date >= last14.toISOString()).reduce((s,t)=>s+t.amount,0) / 14;
    return burn <= 0 ? "STABLE" : `${(liq / burn).toFixed(0)} DAYS LEFT`;
};

export const getSpendDistribution = (transactions) => {
    const curMonth = new Date().toISOString().slice(0, 7);
    const dist = {};
    transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(curMonth)).forEach(t => {
        const cat = t.merchant.split(' | ')[0] || '⬜ GENERAL';
        dist[cat] = (dist[cat] || 0) + t.amount;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
};