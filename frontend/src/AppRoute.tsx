import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';

function AppRoute() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage/>}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoute;