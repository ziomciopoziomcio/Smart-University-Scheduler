import {Button, type ButtonProps, CircularProgress} from '@mui/material';

export interface AppButtonProps extends ButtonProps {
    loading?: boolean;
}

export function AppButton({variant = 'contained', loading, children, sx, ...props}: AppButtonProps) {
    const baseSx = {
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 600,
        py: variant === 'text' ? 1 : 1.5,
        fontSize: '1rem',
        ...sx,
    };

    if (variant === 'contained') {
        return (
            <Button
                variant="contained"
                disableElevation
                disabled={loading || props.disabled}
                startIcon={loading ? <CircularProgress size={20} color="inherit"/> : props.startIcon}
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {bgcolor: 'primary.dark'},
                    ...baseSx,
                }}
                {...props}
            >
                {children}
            </Button>
        );
    }

    if (variant === 'outlined') {
        return (
            <Button
                variant="outlined"
                disabled={loading || props.disabled}
                startIcon={loading ? <CircularProgress size={20} color="inherit"/> : props.startIcon}
                sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    borderWidth: 2,
                    '&:hover': {
                        borderColor: 'primary.dark',
                        borderWidth: 2,
                        bgcolor: 'action.hover'
                    },
                    ...baseSx,
                }}
                {...props}
            >
                {children}
            </Button>
        );
    }

    // text variant
    return (
        <Button
            variant="text"
            disabled={loading || props.disabled}
            startIcon={loading ? <CircularProgress size={20} color="inherit"/> : props.startIcon}
            sx={{
                color: 'primary.main',
                '&:hover': {bgcolor: 'action.hover', color: 'primary.dark'},
                ...baseSx,
            }}
            {...props}
        >
            {children}
        </Button>
    );
}
