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
    }
    interface ThemeOptions {
        iconSizes?: {
            textFieldDecorator?: string;
        };
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
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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