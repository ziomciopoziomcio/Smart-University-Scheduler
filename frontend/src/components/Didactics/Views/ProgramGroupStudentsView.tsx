// TODO: This component is quite large - consider splitting into smaller subcomponents if it grows more
// TODO: add group assignment icons to student list items (e.g. if they are in other groups of the same program) - waiting for issue #346

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
    fetchStudents,
    addGroupMember,
    removeGroupMember,
    getGroup,
    getStudyProgram,
    getStudyField,
    type Student,
    type Group,
    type StudyProgram,
    type StudyField
} from '@api';
import {SearchBar, ListPagination, UserAvatar} from '@components/Common';

interface ProgramGroupStudentsViewProps {
    groupId: number;
    programId: number;
}

export function ProgramGroupStudentsView({groupId, programId}: ProgramGroupStudentsViewProps) {
    const intl = useIntl();

    // Metadata
    const [group, setGroup] = useState<Group | null>(null);
    const [program, setProgram] = useState<StudyProgram | null>(null);
    const [field, setField] = useState<StudyField | null>(null);

    // Data states
    const [leftStudents, setLeftStudents] = useState<Student[]>([]);
    const [rightStudents, setRightStudents] = useState<Student[]>([]);
    const [leftTotal, setLeftTotal] = useState(0);
    const [rightTotal, setRightTotal] = useState(0);
    const [loadingLeft, setLoadingLeft] = useState(true);
    const [loadingRight, setLoadingRight] = useState(true);
    const [loadingMetadata, setLoadingMetadata] = useState(true);

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

    const loadMetadata = useCallback(async () => {
        setLoadingMetadata(true);
        try {
            const [groupRes, programRes] = await Promise.all([
                getGroup(groupId),
                getStudyProgram(programId)
            ]);
            setGroup(groupRes);
            setProgram(programRes);

            if (programRes.study_field) {
                const fieldRes = await getStudyField(programRes.study_field);
                setField(fieldRes);
            }
        } catch (error) {
            console.error('Error loading group metadata:', error);
        } finally {
            setLoadingMetadata(false);
        }
    }, [groupId, programId]);

    const loadLeft = useCallback(async () => {
        setLoadingLeft(true);
        try {
            const res = await fetchStudents(
                leftPage,
                leftPageSize,
                debouncedLeftSearch,
                {study_program: programId, group_id: groupId}
            );
            setLeftStudents(res.items || []);
            setLeftTotal(res.total || 0);
        } catch (error) {
            console.error('Error loading group members:', error);
        } finally {
            setLoadingLeft(false);
        }
    }, [groupId, programId, leftPage, leftPageSize, debouncedLeftSearch]);

    const loadRight = useCallback(async () => {
        setLoadingRight(true);
        try {
            const res = await fetchStudents(
                rightPage,
                rightPageSize,
                debouncedRightSearch,
                {study_program: programId, exclude_group_id: groupId}
            );
            setRightStudents(res.items || []);
            setRightTotal(res.total || 0);
        } catch (error) {
            console.error('Error loading candidates:', error);
        } finally {
            setLoadingRight(false);
        }
    }, [groupId, programId, rightPage, rightPageSize, debouncedRightSearch]);

    useEffect(() => {
        void loadMetadata();
    }, [loadMetadata]);

    useEffect(() => {
        void loadLeft();
    }, [loadLeft]);

    useEffect(() => {
        void loadRight();
    }, [loadRight]);

    const handleToggleSelect = (id: number, side: 'left' | 'right') => {
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
            const promises = Array.from(selectedRight).map(studentId => addGroupMember(groupId, studentId));
            await Promise.all(promises);
            setSelectedRight(new Set());
            await Promise.all([loadLeft(), loadRight()]);
        } catch (error) {
            console.error('Błąd podczas dodawania studentów do grupy:', error);
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
            const promises = Array.from(selectedLeft).map(studentId => removeGroupMember(groupId, studentId));
            await Promise.all(promises);
            setSelectedLeft(new Set());
            await Promise.all([loadLeft(), loadRight()]);
        } catch (error) {
            console.error('Błąd podczas usuwania studentów z grupy:', error);
        } finally {
            setLoadingLeft(false);
            setLoadingRight(false);
        }
    };

    if (loadingMetadata && leftStudents.length === 0 && rightStudents.length === 0) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                <CircularProgress/>
            </Box>
        );
    }

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
                            {group?.group_name || '...'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {intl.formatMessage({id: 'didactics.programs.groups.studentsCount'}, {count: leftTotal})}
                        </Typography>
                    </Box>
                </Card>
                <Box sx={{width: 56}}/>
                <Card sx={{flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                    <Box sx={{p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                            {intl.formatMessage({id: 'sidebar.students'})} {field?.field_name} - {program?.start_year}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {intl.formatMessage({id: 'didactics.programs.groups.studentsCount'}, {count: rightTotal})}
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
                            {leftStudents.map((student) => {
                                const isSelected = selectedLeft.has(student.id);
                                return (
                                    <ListItem
                                        key={student.id}
                                        disablePadding
                                        sx={{
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => handleToggleSelect(student.id, 'left')}
                                            selected={isSelected}
                                            sx={{
                                                py: 1.5,
                                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                                '&.Mui-selected': {
                                                    bgcolor: 'action.selected',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <UserAvatar name={student.user.name} surname={student.user.surname} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Typography variant="body2" color="text.primary">
                                                            {student.user.name} {student.user.surname}
                                                        </Typography>
                                                        <Box component="span" sx={{display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary'}}>
                                                            <Tag sx={{fontSize: 14}}/>
                                                            <Typography variant="caption">{student.user_id}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                            {leftStudents.length === 0 && !loadingLeft && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'didactics.programs.groupStudents.empty'})}
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
                            width: 56,
                            height: 80,
                            borderRadius: '12px',
                            bgcolor: 'primary.main',
                            color: 'white',
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
                            width: 56,
                            height: 80,
                            borderRadius: '12px',
                            bgcolor: 'primary.main',
                            color: 'white',
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
                            {rightStudents.map((student) => {
                                const isSelected = selectedRight.has(student.id);
                                return (
                                    <ListItem
                                        key={student.id}
                                        disablePadding
                                        sx={{
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() => handleToggleSelect(student.id, 'right')}
                                            selected={isSelected}
                                            sx={{
                                                py: 1.5,
                                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                                '&.Mui-selected': {
                                                    bgcolor: 'action.selected',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <UserAvatar name={student.user.name} surname={student.user.surname} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Typography variant="body2" color="text.primary">
                                                            {student.user.name} {student.user.surname}
                                                        </Typography>
                                                        <Box component="span" sx={{display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary'}}>
                                                            <Tag sx={{fontSize: 14}}/>
                                                            <Typography variant="caption">{student.user_id}</Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                            {rightStudents.length === 0 && !loadingRight && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'didactics.programs.groupStudents.empty'})}
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
