import {Navigate, Outlet} from 'react-router-dom';
import {usePermissionStore} from '@store/usePermissionStore';
import {useAuthStore} from '@store/useAuthStore';
import {getFirstAccessiblePath} from './access';
import type {PermissionCode} from '@constants/permissions';

interface PermissionAnyRouteProps {
    permissions: readonly PermissionCode[];
    fallbackPath?: string;
}

export function PermissionAnyRoute({
    permissions,
    fallbackPath,
}: PermissionAnyRouteProps) {
    const user = useAuthStore((state) => state.user);
    const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);

    if (!user) {
        return <Navigate to="/login" replace/>;
    }

    if (hasAnyPermission(permissions)) {
        return <Outlet/>;
    }

    const firstAccessiblePath = getFirstAccessiblePath(hasAnyPermission);

    return <Navigate to={fallbackPath ?? firstAccessiblePath ?? '/'} replace/>;
}