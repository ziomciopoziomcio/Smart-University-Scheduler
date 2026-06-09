import { createTheme, type ThemeOptions } from '@mui/material/styles';

export const themePresets = {
    oceanic: { main: '#045f8d', dark: '#004566', name: 'Oceanic' },
    emerald: { main: '#065f46', dark: '#044431', name: 'Emerald' },
    amethyst: { main: '#6366f1', dark: '#4338ca', name: 'Amethyst' },
    slate: { main: '#334155', dark: '#1e293b', name: 'Slate' },
    rose: { main: '#be123c', dark: '#881337', name: 'Rose' },
    amber: { main: '#b45309', dark: '#78350f', name: 'Amber' },
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
    }
    interface PaletteOptions {
        gradients?: { brand: string };
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

    const backgroundDefault = isDark ? '#0f172a' : '#f8fafc';
    const backgroundPaper = isDark ? '#1e293b' : '#ffffff';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: colors.main,
            },
            background: {
                default: backgroundDefault,
                paper: backgroundPaper,
            },
            gradients: {
                brand: `linear-gradient(135deg, ${colors.main} 0%, ${colors.dark} 100%)`,
            },
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
    } as ThemeOptions);
};


export const theme = createAppTheme({
    preset: 'amber',
    mode: 'dark',
    baseFontSize: 16
});
