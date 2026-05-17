import {useState, useEffect, useCallback} from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    IconButton,
    CircularProgress,
    Divider,
    ListItemAvatar,
    ListItemButton,
} from '@mui/material';
import {
    ArrowForward,
    ArrowBack,
    Tag,
} from '@mui/icons-material';
import {useIntl} from 'react-intl';
import {
    fetchUsers,
    updateUser,
    type User,
    type Role
} from '@api';
import {SearchBar, ListPagination, UserAvatar} from '@components/Common';
import {useAuthStore} from '@store/useAuthStore';

interface RoleUsersViewProps {
    role: Role;
}

export function RoleUsersView({role}: RoleUsersViewProps) {
    const intl = useIntl();
    const {user: currentUser} = useAuthStore();

    // Data states
    const [leftUsers, setLeftUsers] = useState<User[]>([]);
    const [rightUsers, setRightUsers] = useState<User[]>([]);
    const [leftTotal, setLeftTotal] = useState(0);
    const [rightTotal, setRightTotal] = useState(0);
    const [loadingLeft, setLoadingLeft] = useState(true);
    const [loadingRight, setLoadingRight] = useState(true);

    // Search & Debounce
    const [leftSearch, setLeftSearch] = useState('');
    const [debouncedLeftSearch, setDebouncedLeftSearch] = useState('');
    const [rightSearch, setRightSearch] = useState('');
    const [debouncedRightSearch, setDebouncedRightSearch] = useState('');

    // Pagination
    const [leftPage, setLeftPage] = useState(1);
    const [rightPage, setRightPage] = useState(1);
    const [leftPageSize, setLeftPageSize] = useState(10);
    const [rightPageSize, setRightPageSize] = useState(10);

    // Selection
    const [selectedLeft, setSelectedLeft] = useState<Set<number>>(new Set());
    const [selectedRight, setSelectedRight] = useState<Set<number>>(new Set());

    // Debouncing effects
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedLeftSearch(leftSearch), 500);
        return () => clearTimeout(timer);
    }, [leftSearch]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedRightSearch(rightSearch), 500);
        return () => clearTimeout(timer);
    }, [rightSearch]);

    // Data loading
    const loadLeft = useCallback(async () => {
        setLoadingLeft(true);
        try {
            const res = await fetchUsers(
                leftPageSize,
                (leftPage - 1) * leftPageSize,
                debouncedLeftSearch,
                {roles: [role.role_name]}
            );
            setLeftUsers(res.items || []);
            setLeftTotal(res.total || 0);
        } catch (error) {
            console.error('Error loading role users:', error);
        } finally {
            setLoadingLeft(false);
        }
    }, [role.role_name, leftPage, leftPageSize, debouncedLeftSearch]);

    const loadRight = useCallback(async () => {
        setLoadingRight(true);
        try {
            // Fetch users with NO roles at all
            const res = await fetchUsers(
                rightPageSize,
                (rightPage - 1) * rightPageSize,
                debouncedRightSearch,
                {has_roles: false}
            );
            setRightUsers(res.items || []);
            setRightTotal(res.total || 0);
        } catch (error) {
            console.error('Error loading unassigned users:', error);
        } finally {
            setLoadingRight(false);
        }
    }, [rightPage, rightPageSize, debouncedRightSearch]);

    useEffect(() => {
        void loadLeft();
    }, [loadLeft]);

    useEffect(() => {
        void loadRight();
    }, [loadRight]);

    const handleToggleSelect = (id: number, side: 'left' | 'right') => {
        // Prevent selecting self in the left list (assigned roles)
        if (side === 'left' && id === currentUser?.id) return;

        const target = side === 'left' ? selectedLeft : selectedRight;
        const setter = side === 'left' ? setSelectedLeft : setSelectedRight;

        const next = new Set(target);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setter(next);
    };

    const handleMoveLeft = async () => {
        if (selectedRight.size === 0) return;
        setLoadingLeft(true);
        setLoadingRight(true);
        try {
            const promises = Array.from(selectedRight).map(async (userId) => {
                const user = rightUsers.find(u => u.id === userId);
                if (!user) return;
                const newRoles = [...(user.roles || []), role.role_name];
                return updateUser(userId, {roles: newRoles});
            });
            await Promise.all(promises);
            setSelectedRight(new Set());
            await Promise.all([loadLeft(), loadRight()]);
        } catch (error) {
            console.error('Error assigning role to users:', error);
        } finally {
            setLoadingLeft(false);
            setLoadingRight(false);
        }
    };

    const handleMoveRight = async () => {
        if (selectedLeft.size === 0) return;
        setLoadingLeft(true);
        setLoadingRight(true);
        try {
            const promises = Array.from(selectedLeft).map(async (userId) => {
                const user = leftUsers.find(u => u.id === userId);
                if (!user) return;
                const newRoles = (user.roles || []).filter(r => r !== role.role_name);
                return updateUser(userId, {roles: newRoles});
            });
            await Promise.all(promises);
            setSelectedLeft(new Set());
            await Promise.all([loadLeft(), loadRight()]);
        } catch (error) {
            console.error('Error removing role from users:', error);
        } finally {
            setLoadingLeft(false);
            setLoadingRight(false);
        }
    };

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2, pb: 4}}>
            {/* TOP SEARCH BARS */}
            <Box sx={{display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center'}}>
                <Box sx={{flex: 1}}>
                    <SearchBar
                        value={leftSearch}
                        onChange={(val) => {
                            setLeftSearch(val);
                            setLeftPage(1);
                        }}
                        placeholder={intl.formatMessage({id: 'didactics.common.search'})}
                    />
                </Box>
                <Box sx={{width: 56}}/>
                <Box sx={{flex: 1}}>
                    <SearchBar
                        value={rightSearch}
                        onChange={(val) => {
                            setRightSearch(val);
                            setRightPage(1);
                        }}
                        placeholder={intl.formatMessage({id: 'didactics.common.search'})}
                    />
                </Box>
            </Box>

            {/* TITLES & COUNTS CARDS */}
            <Box sx={{display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center'}}>
                <Card sx={{flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                    <Box sx={{p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                            {role.role_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {intl.formatMessage({id: 'roles.usersCount'}, {count: leftTotal})}
                        </Typography>
                    </Box>
                </Card>
                <Box sx={{width: 56}}/>
                <Card sx={{flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                    <Box sx={{p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                            {intl.formatMessage({id: 'sidebar.users'})} {intl.formatMessage({
                                id: 'roles.usersWithoutRolesSuffix',
                                defaultMessage: '(No roles)'
                            })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {intl.formatMessage({id: 'roles.usersCount'}, {count: rightTotal})}
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* MAIN LISTS & CONTROLS */}
            <Box sx={{display: 'flex', gap: 3, alignItems: 'stretch', justifyContent: 'center', minHeight: '550px'}}>
                {/* LEFT LIST */}
                <Card sx={{flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
                    <CardContent sx={{flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', position: 'relative'}}>
                        {loadingLeft && (
                            <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.6)', zIndex: 1}}>
                                <CircularProgress size={32} />
                            </Box>
                        )}
                        <List dense sx={{flexGrow: 1}}>
                            {leftUsers.map((user) => {
                                const isSelected = selectedLeft.has(user.id);
                                const isSelf = user.id === currentUser?.id;
                                return (
                                    <ListItem key={user.id} disablePadding sx={{borderBottom: '1px solid rgba(0,0,0,0.04)'}}>
                                        <ListItemButton
                                            disabled={isSelf}
                                            onClick={() => handleToggleSelect(user.id, 'left')}
                                            selected={isSelected}
                                            sx={{
                                                py: 1.5,
                                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                                '&.Mui-selected': { bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.hover' } },
                                                opacity: isSelf ? 0.6 : 1
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <UserAvatar name={user.name} surname={user.surname} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Typography variant="body2" color="text.primary">
                                                            {user.name} {user.surname} {isSelf && `(${intl.locale.toLowerCase().startsWith('pl') ? 'Ty' : 'You'})`}
                                                        </Typography>
                                                        <Box component="span" sx={{display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary'}}>
                                                            <Tag sx={{fontSize: 14}}/>
                                                            <Typography variant="caption">{user.id}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                                secondary={user.email}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                            {leftUsers.length === 0 && !loadingLeft && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'users.view.empty'})}
                                </Typography>
                            )}
                        </List>
                        <Divider/>
                        <Box sx={{p: 1}}>
                            <ListPagination
                                page={leftPage}
                                totalItems={leftTotal}
                                pageSize={leftPageSize}
                                onPageChange={setLeftPage}
                                onPageSizeChange={(s) => {
                                    setLeftPageSize(s);
                                    setLeftPage(1);
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* CONTROLS */}
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center'}}>
                    <IconButton
                        color="primary"
                        onClick={handleMoveLeft}
                        disabled={selectedRight.size === 0 || loadingLeft || loadingRight}
                        sx={{
                            width: 56, height: 80, borderRadius: '12px',
                            bgcolor: 'primary.main', color: 'white',
                            boxShadow: '0 4px 12px rgba(43, 80, 115, 0.2)',
                            '&:hover': {bgcolor: 'primary.dark'},
                            '&.Mui-disabled': {bgcolor: 'action.disabledBackground'}
                        }}
                    >
                        <ArrowBack/>
                    </IconButton>
                    <IconButton
                        color="primary"
                        onClick={handleMoveRight}
                        disabled={selectedLeft.size === 0 || loadingLeft || loadingRight}
                        sx={{
                            width: 56, height: 80, borderRadius: '12px',
                            bgcolor: 'primary.main', color: 'white',
                            boxShadow: '0 4px 12px rgba(43, 80, 115, 0.2)',
                            '&:hover': {bgcolor: 'primary.dark'},
                            '&.Mui-disabled': {bgcolor: 'action.disabledBackground'}
                        }}
                    >
                        <ArrowForward/>
                    </IconButton>
                </Box>

                {/* RIGHT LIST */}
                <Card sx={{flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
                    <CardContent sx={{flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', position: 'relative'}}>
                        {loadingRight && (
                            <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.6)', zIndex: 1}}>
                                <CircularProgress size={32} />
                            </Box>
                        )}
                        <List dense sx={{flexGrow: 1}}>
                            {rightUsers.map((user) => {
                                const isSelected = selectedRight.has(user.id);
                                return (
                                    <ListItem key={user.id} disablePadding sx={{borderBottom: '1px solid rgba(0,0,0,0.04)'}}>
                                        <ListItemButton
                                            onClick={() => handleToggleSelect(user.id, 'right')}
                                            selected={isSelected}
                                            sx={{
                                                py: 1.5,
                                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                                '&.Mui-selected': { bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.hover' } }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <UserAvatar name={user.name} surname={user.surname} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Typography variant="body2" color="text.primary">
                                                            {user.name} {user.surname}
                                                        </Typography>
                                                        <Box component="span" sx={{display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary'}}>
                                                            <Tag sx={{fontSize: 14}}/>
                                                            <Typography variant="caption">{user.id}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                                secondary={user.email}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                            {rightUsers.length === 0 && !loadingRight && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'users.view.empty'})}
                                </Typography>
                            )}
                        </List>
                        <Divider/>
                        <Box sx={{p: 1}}>
                            <ListPagination
                                page={rightPage}
                                totalItems={rightTotal}
                                pageSize={rightPageSize}
                                onPageChange={setRightPage}
                                onPageSizeChange={(s) => {
                                    setRightPageSize(s);
                                    setRightPage(1);
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}
