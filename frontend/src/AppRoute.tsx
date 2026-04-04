import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import MyPlan from './pages/Plan/MyPlan.tsx';
import ProtectedRoute from './components/Login/ProtectedRoute';

function AppRoute() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route element={<ProtectedRoute/>}>
                    <Route path="/plan" element={<MyPlan/>}/>
                </Route>
                <Route
                    path="/"
                    element={
                        localStorage.getItem('token')
                            ? <Navigate to="/plan" replace/>
                            : <Navigate to="/login" replace/>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoute;