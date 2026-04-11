import {Navigate, Outlet} from 'react-router-dom';
import {useAuthStore} from '@store/useAuthStore';

const ProtectedRoute = () => {
    const isAuthenticated = useAuthStore((state) => state.token !== null);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return <Outlet/>;
};

export default ProtectedRoute;