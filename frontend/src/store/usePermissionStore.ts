import {create} from 'zustand';
import {useAuthStore} from '@store/useAuthStore';
import {type PermissionCode} from '@constants/permissions';

interface PermissionState {
    getPermissionCodes: () => string[];
    hasPermission: (_permission: PermissionCode | string) => boolean;
    hasAnyPermission: (_permissions: readonly (PermissionCode | string)[]) => boolean;
    hasAllPermissions: (_permissions: readonly (PermissionCode | string)[]) => boolean;
}

export const usePermissionStore = create<PermissionState>()((set, get) => {
    void set;
    return {
        getPermissionCodes: () => {
            return useAuthStore.getState().user?.permissions ?? [];
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
    };
});