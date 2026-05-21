import {Navigate, Outlet} from 'react-router-dom';
import {usePermissionStore} from '@store/usePermissionStore';
import {useAuthStore} from '@store/useAuthStore';
import {
    type AppSection,
    canAccessSection,
    getFirstAccessiblePath,
} from './access';

interface PermissionRouteProps {
    section: AppSection;
}

export function PermissionRoute({section}: PermissionRouteProps) {
    const user = useAuthStore((state) => state.user);
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (canAccessSection(section, hasAnyPermission)) {
        return <Outlet />;
    }

    const fallbackPath = getFirstAccessiblePath(hasAnyPermission);

    return <Navigate to={fallbackPath ?? '/login'} replace />;
}