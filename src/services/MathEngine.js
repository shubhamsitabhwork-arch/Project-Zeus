/**
 * PROJECT ZEUS MATH ENGINE v17.0
 * Purpose: Professional-grade financial analytics and tax estimation.
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

export const getSpendDistribution = (transactions) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = transactions.filter(t => t.type === 'DEBIT' && t.transaction_date.startsWith(currentMonth));
    
    const distribution = {};
    monthTxs.forEach(t => {
        const cat = t.merchant.split(' | ')[0] || '⬜ GENERAL';
        distribution[cat] = (distribution[cat] || 0) + t.amount;
    });
    
    const total = Object.values(distribution).reduce((s,v) => s+v, 0);
    return Object.entries(distribution).map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
    })).sort((a,b) => b.value - a.value);
};

// NEW: Tax-Related Categorization logic
export const estimateInvestments = (transactions) => {
    // Looks for categories like 📈 INVEST, 🏦 LIC, 🏠 RENT for potential tax deductions
    return transactions
        .filter(t => t.merchant.includes("INVEST") || t.merchant.includes("LIC") || t.merchant.includes("RENT"))
        .reduce((s, t) => s + t.amount, 0);
};