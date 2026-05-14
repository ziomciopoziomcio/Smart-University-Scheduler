import {createTheme} from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        gradients: {
            brand: string;
        };
    }
    interface PaletteOptions {
        gradients?: {
            brand: string;
        };
    }
    interface Theme {
        iconSizes: {
            textFieldDecorator?: string;
        };
        fontSizes:{
            tiny: string;
            small: string;
            medium: string;
            large: string;
            huge: string;
        }
    }
    interface ThemeOptions {
        iconSizes?: {
            textFieldDecorator?: string;
        };
        fontSizes:{
            tiny: string;
            small: string;
            medium: string;
            large: string;
            huge: string;
        }
    }
}

export const theme = createTheme({
    palette: {
        primary: {
            main: '#045f8d'
        },
        background: {
            // default: '#eaedf5',
            default: '#f5f7fb',
            paper: '#ffffff',
        },
        gradients: {
            brand: 'linear-gradient(135deg, #045f8d 0%, #004566 100%)',
        },
    },
    iconSizes: {
        textFieldDecorator: '16px'
    },
    fontSizes: {
        tiny: '0.75rem',
        small: '0.875rem',
        medium: '1rem',
        large: '1.25rem',
        huge: '1.5rem',
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                fullWidth: true,
                variant: 'outlined',
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    height: 50,
                    textTransform: 'none',
                    fontSize: 16,
                    fontWeight: 500,
                },
            },
        },
    },
});