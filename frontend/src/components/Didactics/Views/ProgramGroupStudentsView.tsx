// TODO: This component is quite large - consider splitting into smaller subcomponents if it grows more
// TODO: add group assignment icons to student list items (e.g. if they are in other groups of the same program) - waiting for issue #346

import {useState, useEffect, useMemo} from 'react';
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
    fetchGroupMembers,
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

    const [group, setGroup] = useState<Group | null>(null);
    const [program, setProgram] = useState<StudyProgram | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    const [leftSearch, setLeftSearch] = useState('');
    const [rightSearch, setRightSearch] = useState('');

    const [leftPage, setLeftPage] = useState(1);
    const [rightPage, setRightPage] = useState(1);
    const [leftPageSize, setLeftPageSize] = useState(10);
    const [rightPageSize, setRightPageSize] = useState(10);

    const [selectedLeft, setSelectedLeft] = useState<Set<number>>(new Set());
    const [selectedRight, setSelectedRight] = useState<Set<number>>(new Set());

    const loadData = async () => {
        setLoading(true);
        try {
            // Standard fetch (single call, limit 200)
            const [studentsRes, membersRes, groupRes, programRes] = await Promise.all([
                fetchStudents(1, 200, undefined, {study_program: programId}),
                fetchGroupMembers(groupId, 200),
                getGroup(groupId),
                getStudyProgram(programId)
            ]);

            setAllStudents(studentsRes.items || []);
            const currentMemberIds = new Set(membersRes.items.map(m => m.student));
            setMemberIds(currentMemberIds);
            setGroup(groupRes);
            setProgram(programRes);

            if (programRes.study_field) {
                const fieldRes = await getStudyField(programRes.study_field);
                setField(fieldRes);
            }
        } catch (error) {
            console.error('Błąd podczas ładowania danych studentów:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [groupId, programId]);

    const groupStudentsAll = useMemo(() =>
            allStudents.filter(s => memberIds.has(s.id)),
        [allStudents, memberIds]);

    const candidatesAll = useMemo(() =>
            allStudents.filter(s => !memberIds.has(s.id)),
        [allStudents, memberIds]);

    const filteredLeft = useMemo(() =>
            groupStudentsAll.filter(s =>
                `${s.user.name} ${s.user.surname} ${s.user_id}`.toLowerCase().includes(leftSearch.toLowerCase())
            ),
        [groupStudentsAll, leftSearch]);

    const filteredRight = useMemo(() =>
            candidatesAll.filter(s =>
                `${s.user.name} ${s.user.surname} ${s.user_id}`.toLowerCase().includes(rightSearch.toLowerCase())
            ),
        [candidatesAll, rightSearch]);

    const paginatedLeft = useMemo(() => {
        const start = (leftPage - 1) * leftPageSize;
        return filteredLeft.slice(start, start + leftPageSize);
    }, [filteredLeft, leftPage, leftPageSize]);

    const paginatedRight = useMemo(() => {
        const start = (rightPage - 1) * rightPageSize;
        return filteredRight.slice(start, start + rightPageSize);
    }, [filteredRight, rightPage, rightPageSize]);

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
        setLoading(true);
        try {
            const promises = Array.from(selectedRight).map(studentId => addGroupMember(groupId, studentId));
            await Promise.all(promises);
            setSelectedRight(new Set());
            await loadData();
        } catch (error) {
            console.error('Błąd podczas dodawania studentów do grupy:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveRight = async () => {
        if (selectedLeft.size === 0) return;
        setLoading(true);
        try {
            const promises = Array.from(selectedLeft).map(studentId => removeGroupMember(groupId, studentId));
            await Promise.all(promises);
            setSelectedLeft(new Set());
            await loadData();
        } catch (error) {
            console.error('Błąd podczas usuwania studentów z grupy:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && allStudents.length === 0) {
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
                            {intl.formatMessage({id: 'didactics.programs.groups.studentsCount'}, {count: groupStudentsAll.length})}
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
                            {intl.formatMessage({id: 'didactics.programs.groups.studentsCount'}, {count: candidatesAll.length})}
                        </Typography>
                    </Box>
                </Card>
            </Box>

            {/* MAIN LISTS & CONTROLS */}
            <Box sx={{display: 'flex', gap: 3, alignItems: 'stretch', justifyContent: 'center', minHeight: '550px'}}>
                {/* LEFT LIST */}
                <Card sx={{flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
                    <CardContent sx={{flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column'}}>
                        <List dense sx={{flexGrow: 1}}>
                            {paginatedLeft.map((student) => {
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
                            {filteredLeft.length === 0 && !loading && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'didactics.programs.groupStudents.empty'})}
                                </Typography>
                            )}
                        </List>
                        <Divider/>
                        <Box sx={{p: 1}}>
                            <ListPagination
                                page={leftPage}
                                totalItems={filteredLeft.length}
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
                        disabled={selectedRight.size === 0 || loading}
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
                        disabled={selectedLeft.size === 0 || loading}
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
                    <CardContent sx={{flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column'}}>
                        <List dense sx={{flexGrow: 1}}>
                            {paginatedRight.map((student) => {
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
                            {filteredRight.length === 0 && !loading && (
                                <Typography variant="body2" color="text.secondary" sx={{p: 4, textAlign: 'center'}}>
                                    {intl.formatMessage({id: 'didactics.programs.groupStudents.empty'})}
                                </Typography>
                            )}
                        </List>
                        <Divider/>
                        <Box sx={{p: 1}}>
                            <ListPagination
                                page={rightPage}
                                totalItems={filteredRight.length}
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
