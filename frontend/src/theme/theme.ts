import { createTheme, type ThemeOptions } from '@mui/material/styles';

export const themePresets = {
    oceanic: { 
        main: '#045f8d', 
        dark: '#004566', 
        name: 'Oceanic',
        logo: { primary: '#284051', secondary: '#3CA5B2', accent: '#20739E' }
    },
    emerald: { 
        main: '#065f46', 
        dark: '#044431', 
        name: 'Emerald',
        logo: { primary: '#1B4332', secondary: '#34D399', accent: '#059669' }
    },
    amethyst: { 
        main: '#a23abf', 
        dark: '#612272', 
        name: 'Amethyst',
        logo: { primary: '#4A1D52', secondary: '#D946EF', accent: '#A23ABF' }
    },
    slate: { 
        main: '#334155', 
        dark: '#1e293b', 
        name: 'Slate',
        logo: { primary: '#0F172A', secondary: '#94A3B8', accent: '#475569' }
    },
    rose: { 
        main: '#be123c', 
        dark: '#881337', 
        name: 'Rose',
        logo: { primary: '#4C0519', secondary: '#FB7185', accent: '#E11D48' }
    },
    amber: { 
        main: '#b45309', 
        dark: '#78350f', 
        name: 'Amber',
        logo: { primary: '#451A03', secondary: '#FBBF24', accent: '#D97706' }
    },
} as const;

export type ThemePreset = keyof typeof themePresets;

export interface ThemeConfig {
    preset: ThemePreset;
    mode: 'light' | 'dark';
    baseFontSize: number;
}

declare module '@mui/material/styles' {
    interface Palette {
        gradients: { brand: string };
        logo: { primary: string; secondary: string; accent: string; };
    }
    interface PaletteOptions {
        gradients?: { brand: string };
        logo?: { primary: string; secondary: string; accent: string; };
    }
    interface TypeBackground {
        highlight: string;
        selected: string;
    }
    interface TypeBackgroundOptions {
        highlight?: string;
        selected?: string;
    }
    interface Theme {
        iconSizes: { textFieldDecorator: string };
        fontSizes: {
            tiny: string; small: string; medium: string;
            large: string; huge: string;
        };
    }
    interface ThemeOptions {
        iconSizes?: { textFieldDecorator?: string };
        fontSizes?: {
            tiny?: string; small?: string; medium?: string;
            large?: string; huge?: string;
        };
    }
}

export const createAppTheme = (config: ThemeConfig) => {
    const { preset, mode, baseFontSize } = config;
    const colors = themePresets[preset];
    const isDark = mode === 'dark';

    const backgroundDefault = isDark ? '#0f0f0f' : '#f8fafc';
    const backgroundPaper = isDark ? '#272727' : '#ffffff';

    const hoverHighlight = isDark  
        ? 'rgba(255, 255, 255, 0.08)' 
        : `${colors.main}1a`;
        
    const selectedHighlight = isDark 
        ? 'rgba(255, 255, 255, 0.15)' 
        : `${colors.main}33`;

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.main,
            },
            background: {
                default: backgroundDefault,
                paper: backgroundPaper,
                highlight: hoverHighlight,
                selected: selectedHighlight
            },
            gradients: {
                brand: `linear-gradient(135deg, ${colors.main} 0%, ${colors.dark} 100%)`,
            },
            logo: colors.logo,
        },
        fontSizes: {
            tiny: `${baseFontSize * 0.75}px`,
            small: `${baseFontSize * 0.875}px`,
            medium: `${baseFontSize}px`,
            large: `${baseFontSize * 1.25}px`,
            huge: `${baseFontSize * 1.5}px`,
        },
        iconSizes: {
            textFieldDecorator: '16px'
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: isDark 
                            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                            : '0 2px 12px rgba(0, 0, 0, 0.06)',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        height: 50,
                        textTransform: 'none',
                        fontSize: baseFontSize,
                        fontWeight: 500,
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    fullWidth: true,
                    variant: 'outlined',
                },
            },
        },
    } satisfies ThemeOptions);
};


export const theme = createAppTheme({
    preset: 'oceanic',
    mode: 'light',
    baseFontSize: 16
});
