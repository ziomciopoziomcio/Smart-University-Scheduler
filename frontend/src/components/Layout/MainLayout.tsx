import {Box, CssBaseline} from '@mui/material';
import {Outlet} from 'react-router-dom';
import Sidebar from '@components/Bar/Sidebar';
import Navbar from '@components/Bar/Navbar';

export default function MainLayout() {
    return (
        <Box sx={{display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb'}}>
            <CssBaseline/>
            <Navbar/>
            <Sidebar/>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    mt: '80px',
                    width: '100%',
                    overflowX: 'hidden'
                }}
            >
                <Outlet/>
            </Box>
        </Box>
    );
}