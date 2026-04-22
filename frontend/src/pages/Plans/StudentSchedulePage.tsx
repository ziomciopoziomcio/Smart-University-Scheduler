import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    FormGroup,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import type {Faculty, Major, ScheduleEntry, StudyField, StudyPlanGroupSummary} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addWeeks, getStartOfWeek} from '@components/Schedule/utils/dateUtils';
import {getMockStudyPlanScheduleEntries} from '../../mocks/studyPlansMock';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import {useIntl} from 'react-intl';
import {getFaculty} from '@api/structures.ts';
import {getMajor, getStudyField} from '@api/courses.ts';
import {
    fetchMockStudyPlanElectiveBlockGroups,
    fetchMockStudyPlanElectiveBlocks,
    type StudyPlanElectiveBlockSummary,
} from '../../mocks/studyPlanElectiveBlocksMock';

export default function StudentSchedulePage() {
    const intl = useIntl();
    const {facultyId, fieldOfStudyId, semesterId, specializationId, groupId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
    const [isNamesLoading, setIsNamesLoading] = useState<boolean>(true);

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [specialization, setSpecialization] = useState<Major | null>(null); // Wykorzystamy w Breadcrumbs

    const [blocks, setBlocks] = useState<StudyPlanElectiveBlockSummary[]>([]);
    const [blockGroups, setBlockGroups] = useState<Record<number, StudyPlanGroupSummary[]>>({});
    const [selectedBlockGroupIds, setSelectedBlockGroupIds] = useState<Record<number, number[]>>({});

    useEffect(() => {
        if (!facultyId || !fieldOfStudyId) return;
        const fetchContext = async () => {
            setIsNamesLoading(true);
            try {
                const [facRes, fieldRes] = await Promise.all([
                    getFaculty(Number(facultyId)) as Promise<Faculty>,
                    getStudyField(Number(fieldOfStudyId))
                ]);
                setFaculty(facRes);
                setField(fieldRes);
                if (specializationId) {
                    const specRes = await getMajor(Number(specializationId));
                    setSpecialization(specRes);
                }
            } finally {
                setIsNamesLoading(false);
            }
        };
        fetchContext();
    }, [facultyId, fieldOfStudyId, specializationId]);

    useEffect(() => {
        const loadBlocks = async () => {
            if (!fieldOfStudyId || !semesterId) return;
            const res = await fetchMockStudyPlanElectiveBlocks({
                fieldOfStudyId: Number(fieldOfStudyId),
                semesterId: Number(semesterId),
                specializationId: specializationId ? Number(specializationId) : null,
            });
            setBlocks(res);
            res.forEach(async (block) => {
                const groups = await fetchMockStudyPlanElectiveBlockGroups({
                    fieldOfStudyId: Number(fieldOfStudyId),
                    semesterId: Number(semesterId),
                    blockId: block.id,
                    specializationId: specializationId ? Number(specializationId) : null,
                });
                setBlockGroups(prev => ({...prev, [block.id]: groups}));
            });
        };
        loadBlocks();
    }, [fieldOfStudyId, semesterId, specializationId]);

    useEffect(() => {
        const fetchPlan = async () => {
            setIsScheduleLoading(true);
            const res = getMockStudyPlanScheduleEntries({
                fieldOfStudyId: fieldOfStudyId!,
                semesterId: semesterId!,
                specializationId: specializationId || null,
                groupId: groupId || null,
                electiveBlockId: null
            });
            setEntries(res);
            setIsScheduleLoading(false);
        };
        fetchPlan();
    }, [fieldOfStudyId, semesterId, specializationId, groupId, currentWeekStart]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => [
        {label: intl.formatMessage({id: 'plans.plans'}), path: '/plans'},
        {label: intl.formatMessage({id: 'plans.studentsPlan.title'}), path: '/plans/study/faculty'},
        {
            label: faculty ? (faculty.faculty_short || faculty.faculty_name) : facultyId || '...',
            path: `/plans/study/faculty/${facultyId}/field`
        },
        {
            label: field ? field.field_name : fieldOfStudyId || '...',
            path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
        },
        {
            label: specialization ? specialization.major_name : (specializationId ? `Spec. ${specializationId}` : `${intl.formatMessage({id: 'plans.studentsPlan.studySemester.semester'})} ${semesterId}`),
            path: specializationId
                ? `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`
                : `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`
        },
        {label: intl.formatMessage({id: 'plans.studentsPlan.studySchedule.title'}), path: ''}
    ], [intl, faculty, field, specialization, facultyId, fieldOfStudyId, semesterId, specializationId]);

    const handleGroupToggle = (blockId: number, groupId: number) => {
        setSelectedBlockGroupIds(prev => {
            const current = prev[blockId] || [];
            const next = current.includes(groupId) ? current.filter(id => id !== groupId) : [...current, groupId];
            return {...prev, [blockId]: next};
        });
    };

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            {isNamesLoading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 10}}>
                    <CircularProgress/>
                </Box>
            ) : (
                <>
                    <WeekSchedule
                        entries={entries}
                        currentWeekStart={currentWeekStart}
                        isLoading={isScheduleLoading}
                        onPrevWeek={() => setCurrentWeekStart(prev => addWeeks(prev, -1))}
                        onNextWeek={() => setCurrentWeekStart(prev => addWeeks(prev, 1))}
                    />

                    {blocks.length > 0 && (
                        <Box sx={{mt: 4, p: 3, bgcolor: '#FBFCFF', borderRadius: 2}}>
                            <Typography variant="h6" sx={{mb: 2}}>
                                {intl.formatMessage({id: 'plans.studentsPlan.studySchedule.electiveBlocks'})}
                            </Typography>
                            {blocks.map(block => (
                                <Accordion key={block.id} elevation={0} sx={{border: '1px solid #eee', mb: 1}}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                        <Typography>{block.name}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <FormGroup>
                                            {(blockGroups[block.id] || []).map(group => (
                                                <FormControlLabel
                                                    key={group.id}
                                                    control={<Checkbox
                                                        checked={(selectedBlockGroupIds[block.id] || []).includes(group.id)}
                                                        onChange={() => handleGroupToggle(block.id, group.id)}/>}
                                                    label={`${group.group_name} (${group.group_code})`}
                                                />
                                            ))}
                                        </FormGroup>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}