// src/AppRoute.tsx
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import MainLayout from '@components/Layout/MainLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ActivationPage from './pages/Auth/ActivationPage.tsx';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage.tsx';
import MyPlan from './pages/Plan/MyPlan.tsx';
import ProtectedRoute from './components/Login/ProtectedRoute';
import {useAuthStore} from '@store/useAuthStore';

function AppRoute() {
    const isAuthenticated = useAuthStore((state) => state.token !== null);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/activate" element={<ActivationPage/>}/>
                <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                <Route path="/reset-password" element={<ResetPasswordPage/>}/>

                <Route element={<ProtectedRoute/>}>
                    <Route element={<MainLayout/>}>
                        <Route path="/plan" element={<MyPlan/>}/>
                    </Route>
                </Route>

                <Route
                    path="/"
                    element={
                        isAuthenticated
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