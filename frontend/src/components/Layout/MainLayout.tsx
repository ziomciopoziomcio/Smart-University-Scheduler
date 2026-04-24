import {Box, CssBaseline} from '@mui/material';
import {Outlet} from 'react-router-dom';
import {Sidebar, Navbar} from '@components/Bar';
import {theme} from "../../theme/theme.ts";

export default function MainLayout() {
    return (
        <Box sx={{display: 'flex', minHeight: '100vh', background: theme.palette.background.default}}>
            <CssBaseline/>
            <Navbar/>
            <Sidebar/>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    pt: "100px",
                    width: '100%',
                    overflowX: 'hidden',
                    gap: 2,
                    pr: 2,
                }}
            >
                <Outlet/>
            </Box>
        </Box>
    );
}