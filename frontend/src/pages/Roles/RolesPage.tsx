import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from "@components/Common/SearchBar.tsx";
import {fetchRoles, getRole, fetchPermissions} from '@api/users';
import {type Role, type Permission} from '@api/types';

import RoleView from '@components/Roles/RoleView';
import RoleDashboardView from '@components/Roles/RoleDashboardView';
import RolePermissionsView from '@components/Roles/RolePermissionsView';
import RoleUsersView from '@components/Roles/RoleUsersView';

interface RolesPageProps {
    view: 'roles' | 'dashboard' | 'permissions' | 'users';
}

export default function RolesPage({view}: RolesPageProps) {
    const {id} = useParams<{ id: string }>();
    const intl = useIntl();

    const [roles, setRoles] = useState<Role[]>([]);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [{
            label: intl.formatMessage({id: 'roles.title'}),
            path: '/roles'
        }];

        if (id && currentRole) {
            items.push({
                label: currentRole.role_name,
                path: `/roles/${id}`
            });
        }

        if (view === 'permissions' && id && currentRole) {
            items.push({
                label: intl.formatMessage({id: 'roles.tabs.permissions'}),
                path: `/roles/${id}/permissions`
            });
        }

        if (view === 'users' && id && currentRole) {
            items.push({
                label: intl.formatMessage({id: 'roles.tabs.users'}),
                path: `/roles/${id}/users`
            });
        }

        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === 'roles') {
                const res = await fetchRoles();
                setRoles(res.items);
                setCurrentRole(null);
                setPermissions([]);
            } else if (id) {
                const roleData = await getRole(Number(id));
                setCurrentRole(roleData);

                if (view === 'permissions') {
                    const permsData = await fetchPermissions();
                    setPermissions(permsData.items);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [view, id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const filteredRoles = roles.filter(r => r.role_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            {view === 'roles' && (
                <SearchBar
                    placeholder={intl.formatMessage({id: 'roles.searchPlaceholder'})}
                    value={search}
                    onChange={setSearch}
                />
            )}

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>
                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'roles' && <RoleView data={filteredRoles} onRefresh={() => {
                            void loadData();
                        }}/>}
                        {view === 'dashboard' && currentRole && <RoleDashboardView role={currentRole}/>}
                        {view === 'permissions' && currentRole &&
                            <RolePermissionsView role={currentRole} allPermissions={permissions}/>}
                        {view === 'users' && currentRole && <RoleUsersView role={currentRole}/>}
                    </>
                )}
            </Paper>
        </Box>
    );
}