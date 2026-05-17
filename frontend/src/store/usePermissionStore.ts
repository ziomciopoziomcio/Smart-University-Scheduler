import {create} from 'zustand';
import {useAuthStore} from '@store/useAuthStore';
import {type PermissionCode} from '@constants/permissions';

interface PermissionState {
    getPermissionCodes: () => string[];
    hasPermission: (permission: PermissionCode) => boolean;
    hasAnyPermission: (permissions: readonly PermissionCode[]) => boolean;
    hasAllPermissions: (permissions: readonly PermissionCode[]) => boolean;
}

export const usePermissionStore = create<PermissionState>()((_, get) => ({
    getPermissionCodes: () => {
        const user = useAuthStore.getState().user;

        return user?.permissions?.map((permission) => permission.code) ?? [];
    },

    hasPermission: (permission) => {
        return get().getPermissionCodes().includes(permission);
    },

    hasAnyPermission: (permissions) => {
        const permissionCodes = get().getPermissionCodes();

        return permissions.some((permission) => permissionCodes.includes(permission));
    },

    hasAllPermissions: (permissions) => {
        const permissionCodes = get().getPermissionCodes();

        return permissions.every((permission) => permissionCodes.includes(permission));
    },
}));