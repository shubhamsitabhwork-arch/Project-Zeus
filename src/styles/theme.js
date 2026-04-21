/**
 * PROJECT ZEUS GLOBAL STYLES
 * Purpose: One place to change the app's entire look.
 */
export const COLORS = {
    // Brand Colors
    neon: '#00ffcc',
    danger: '#ff4444',
    success: '#00C851',
    warning: '#FF9900',
    mandate: '#b366ff',
    
    // Dark Mode Palette
    darkBg: '#0a0a0a',
    darkCard: '#151515',
    darkBorder: '#222',
    darkText: '#ffffff',
    darkSubtext: '#888',
    
    // Light Mode Palette
    lightBg: '#f4f7f6',
    lightCard: '#ffffff',
    lightBorder: '#ddd',
    lightText: '#111111',
    lightSubtext: '#666',
};

export const getTheme = (mode, velocityBreached = false) => {
    const isDark = mode === 'dark';
    const accent = velocityBreached ? COLORS.danger : COLORS.neon;

    return {
        bg: isDark ? COLORS.darkBg : COLORS.lightBg,
        card: isDark ? COLORS.darkCard : COLORS.lightCard,
        border: isDark ? COLORS.darkBorder : COLORS.lightBorder,
        text: isDark ? COLORS.darkText : COLORS.lightText,
        subtext: isDark ? COLORS.darkSubtext : COLORS.lightSubtext,
        accent: accent,
        ...COLORS // Include all base colors
    };
};