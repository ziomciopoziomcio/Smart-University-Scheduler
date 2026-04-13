import type {ReactNode} from 'react';
import {Box, Paper, Typography} from '@mui/material';
import Logo from '@assets/Logo.svg';
import {theme} from "../../theme/theme.ts";

type Props = {
    title: ReactNode;
    children: ReactNode;
};

function AuthLayout({title, children}: Props) {
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
                    // borderRadius: 5,
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
                        src={Logo}
                        alt="Page Logo"
                        sx={{
                            width: '100%',
                            maxWidth: 220,
                            height: 'auto',
                            display: 'block',
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