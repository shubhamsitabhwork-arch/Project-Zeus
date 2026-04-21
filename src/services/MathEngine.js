/**
 * PROJECT ZEUS MATH ENGINE v15.0
 * Purpose: Advanced financial modeling and forecasting.
 */

export const calculateNetSpentToday = (transactions) => {
    const today = new Date().toISOString().split('T')[0];
    const dSum = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(today)).reduce((s, t) => s + t.amount, 0);
    const cSum = transactions.filter(t => t.type === 'CREDIT' && t.transaction_date.startsWith(today)).reduce((s, t) => s + t.amount, 0);
    return Math.max(0, dSum - cSum);
};

export const calculateWeeklyLeft = (transactions, limit) => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() || 7) + 1);
    const monday = d.toISOString().split('T')[0];
    const spent = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date >= monday).reduce((s, t) => s + t.amount, 0);
    return Math.max(0, parseFloat(limit) - spent);
};

// NEW: Category Distribution for Analytics
export const getSpendDistribution = (transactions) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(currentMonth));
    
    const distribution = {};
    monthTxs.forEach(t => {
        const cat = t.merchant.split(' | ')[0] || '⬜ GENERAL';
        distribution[cat] = (distribution[cat] || 0) + t.amount;
    });
    return distribution;
};

// NEW: Runway Forecasting (How many days until ₹0)
export const calculateRunway = (totalLiquidity, transactions) => {
    if (transactions.length < 5) return "Need more data";
    
    // Avg daily spend over last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentDebits = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date >= last30Days.toISOString());
    
    const avgDailyBurn = recentDebits.reduce((s, t) => s + t.amount, 0) / 30;
    if (avgDailyBurn <= 0) return "∞ days";
    
    const daysLeft = totalLiquidity / avgDailyBurn;
    return `${daysLeft.toFixed(0)} days left`;
};