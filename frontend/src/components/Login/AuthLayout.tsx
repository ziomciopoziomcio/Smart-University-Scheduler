import type {ReactNode} from 'react';
import {Box, Paper, Typography} from '@mui/material';
import logo from '@assets/logotype_no_bg_no_label.png'
import {theme} from "../../theme/theme.ts";

type Props = {
    title: ReactNode;
    children: ReactNode;
};

export function AuthLayout({title, children}: Props) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.gradients.brand,
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 450,
                    px: 5,
                    py: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                    }}
                >
                    <Box
                        component="img"
                        src={logo}
                        alt="Logo"
                        sx={{
                            width: '140px',
                            height: 'auto',
                            display: 'block',
                            mx: 'auto'
                        }}
            />
                </Box>

                <Typography
                    variant="h4"
                    sx={{
                        mb: 4,
                        fontWeight: 700,
                        textAlign: 'center',
                        fontSize: theme.fontSizes.huge,
                    }}
                >
                    {title}
                </Typography>

                {children}
            </Paper>
        </Box>
    );
}

export default AuthLayout;