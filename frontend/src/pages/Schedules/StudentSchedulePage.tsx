import {useIntl} from 'react-intl';
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
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';

import {
    type Faculty,
    type ScheduleEntry,
    type StudyField,
    type StudyPlanGroupSummary,
    getFaculty,
    getMajor,
    fetchElectiveBlocks,
    fetchStudyPlanGroupsSummary,
    getStudyField,
    fetchStudyFieldPlan
} from '@api';

import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {PageBreadcrumbs, type BreadcrumbItem} from '@components/Common';

export default function StudentSchedulePage() {
    const intl = useIntl();
    const {facultyId, fieldOfStudyId, semesterId, majorId, groupId} = useParams();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(false);
    const [isNamesLoading, setIsNamesLoading] = useState<boolean>(true);

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [specializationName, setSpecializationName] = useState<string | null>(null);

    const [blocks, setBlocks] = useState<{ id: number; name: string }[]>([]);
    const [blockGroups, setBlockGroups] = useState<Record<number, StudyPlanGroupSummary[]>>({});
    const [selectedBlockGroupIds, setSelectedBlockGroupIds] = useState<Record<number, number[]>>({});
    const [loadingBlockGroups, setLoadingBlockGroups] = useState<Record<number, boolean>>({});

    const selectedElectiveGroupIds = useMemo(
        () => Object.values(selectedBlockGroupIds).flat(),
        [selectedBlockGroupIds]
    );

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

                if (majorId) {
                    const major = await getMajor(Number(majorId));
                    setSpecializationName(major.major_name || `${majorId}`);
                }
            } catch (err) {
                console.error('Błąd ładowania kontekstu', err);
            } finally {
                setIsNamesLoading(false);
            }
        };

        void fetchContext();
    }, [facultyId, fieldOfStudyId, majorId]);

    useEffect(() => {
        const loadBlocks = async () => {
            if (!fieldOfStudyId || !semesterId) return;

            try {
                const res = await fetchElectiveBlocks(1, 100, undefined, {
                    study_field: Number(fieldOfStudyId),
                    semester: Number(semesterId),
                });

                setBlocks(
                    res.items.map((block) => ({
                        id: block.id,
                        name: block.elective_block_name,
                    }))
                );

                setBlockGroups({});
                setSelectedBlockGroupIds({});
                setLoadingBlockGroups({});
            } catch (err) {
                console.error('Nie udało się pobrać bloków obieralnych', err);
            }
        };

        void loadBlocks();
    }, [fieldOfStudyId, semesterId]);

    const loadBlockGroups = useCallback(async (blockId: number) => {
        if (!facultyId || !fieldOfStudyId || !semesterId) return;

        if (blockGroups[blockId]) {
            return;
        }

        setLoadingBlockGroups((prev) => ({
            ...prev,
            [blockId]: true,
        }));

        try {
            const groups = await fetchStudyPlanGroupsSummary({
                faculty_id: Number(facultyId),
                study_field: Number(fieldOfStudyId),
                semester: Number(semesterId),
                elective_block_id: blockId,
            });

            setBlockGroups((prev) => ({
                ...prev,
                [blockId]: groups,
            }));
        } catch {
            setBlockGroups((prev) => ({
                ...prev,
                [blockId]: [],
            }));
        } finally {
            setLoadingBlockGroups((prev) => ({
                ...prev,
                [blockId]: false,
            }));
        }
    }, [facultyId, fieldOfStudyId, semesterId, blockGroups]);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!fieldOfStudyId || !semesterId) return;

            setIsScheduleLoading(true);

            try {
                const commonParams = {
                    startDate: toIsoDate(currentWeekStart),
                    studyField: Number(fieldOfStudyId),
                    semester: Number(semesterId),
                };

                const basePlanPromise = fetchStudyFieldPlan({
                    ...commonParams,
                    specializationId: majorId ? Number(majorId) : null,
                    groupId: groupId ? Number(groupId) : null,
                });

                const electivePlanPromises = selectedElectiveGroupIds.map(
                    (electiveGroupId) =>
                        fetchStudyFieldPlan({
                            ...commonParams,
                            specializationId: null,
                            groupId: electiveGroupId,
                        })
                );

                const plans = await Promise.all([
                    basePlanPromise,
                    ...electivePlanPromises,
                ]);

                const mergedEntries = plans.flat();

                const uniqueEntries = Array.from(
                    new Map(
                        mergedEntries.map((entry) => [
                            `${entry.id}-${entry.date}-${entry.startTime}-${entry.endTime}`,
                            entry,
                        ])
                    ).values()
                );

                const startIso = toIsoDate(currentWeekStart);
                const endIso = toIsoDate(addDays(currentWeekStart, 6));

                setEntries(
                    uniqueEntries.filter(
                        (entry) => entry.date >= startIso && entry.date <= endIso
                    )
                );
            } catch (err) {
                console.error('Fetch plan failed', err);
                setEntries([]);
            } finally {
                setIsScheduleLoading(false);
            }
        };

        void fetchPlan();
    }, [
        fieldOfStudyId,
        semesterId,
        majorId,
        groupId,
        currentWeekStart,
        selectedElectiveGroupIds,
    ]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            {
                label: intl.formatMessage({id: 'plans.plans', defaultMessage: 'Plany'}),
                path: '/schedules'
            },
            {
                label: intl.formatMessage({
                    id: 'plans.studentsPlan.title',
                    defaultMessage: 'Plany studenckie'
                }),
                path: '/schedules/study/faculty'
            },
            {
                label: faculty ? (faculty.faculty_short || faculty.faculty_name) : facultyId ?? '...',
                path: `/schedules/study/faculty/${facultyId}/field`
            },
            {
                label: field ? field.field_name : fieldOfStudyId ?? '...',
                path: `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`
            },
            {
                label: `${intl.formatMessage({
                    id: 'plans.studentsPlan.studySemester.semester',
                    defaultMessage: 'Semestr'
                })} ${semesterId}`,
                path: majorId
                    ? `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/major`
                    : `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`
            }
        ];

        if (majorId) {
            items.push({
                label: specializationName ?? `Specjalizacja ${majorId}`,
                path: `/schedules/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/major/${majorId}/group`
            });
        }

        items.push({
            label: intl.formatMessage({
                id: 'plans.studentsPlan.studySchedule.title',
                defaultMessage: 'Plan zajęć'
            }),
            path: ''
        });

        return items;
    }, [
        intl,
        faculty,
        field,
        specializationName,
        facultyId,
        fieldOfStudyId,
        semesterId,
        majorId
    ]);

    const handleGroupToggle = (blockId: number, groupId: number) => {
        setSelectedBlockGroupIds((prev) => {
            const current = prev[blockId] || [];
            const next = current.includes(groupId)
                ? current.filter((id) => id !== groupId)
                : [...current, groupId];

            return {
                ...prev,
                [blockId]: next,
            };
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
                        onPrevWeek={() => {
                            setCurrentWeekStart((prev) => addWeeks(prev, -1));
                        }}
                        onNextWeek={() => {
                            setCurrentWeekStart((prev) => addWeeks(prev, 1));
                        }}
                    />

                    {blocks.length > 0 && (
                        <Box sx={{mt: 4, p: 3, bgcolor: '#FBFCFF', borderRadius: 2}}>
                            <Typography variant="h6" sx={{mb: 2}}>
                                {intl.formatMessage({
                                    id: 'plans.studentsPlan.studySchedule.electiveBlocks',
                                    defaultMessage: 'Bloki obieralne'
                                })}
                            </Typography>

                            {blocks.map((block) => {
                                const groups = blockGroups[block.id] || [];
                                const isGroupsLoading = loadingBlockGroups[block.id];

                                return (
                                    <Accordion
                                        key={block.id}
                                        elevation={0}
                                        sx={{border: '1px solid #eee', mb: 1}}
                                        onChange={(_, expanded) => {
                                            if (expanded) {
                                                void loadBlockGroups(block.id);
                                            }
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                            <Typography>{block.name}</Typography>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            {isGroupsLoading ? (
                                                <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                                                    <CircularProgress size={24}/>
                                                </Box>
                                            ) : groups.length > 0 ? (
                                                <FormGroup>
                                                    {groups.map((group) => (
                                                        <FormControlLabel
                                                            key={group.id}
                                                            control={
                                                                <Checkbox
                                                                    checked={(selectedBlockGroupIds[block.id] || []).includes(group.id)}
                                                                    onChange={() => handleGroupToggle(block.id, group.id)}
                                                                />
                                                            }
                                                            label={`${group.group_name}`}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {intl.formatMessage({
                                                        id: 'plans.studentsPlan.studyGroup.noGroups',
                                                        defaultMessage: 'Brak grup do wyświetlenia.'
                                                    })}
                                                </Typography>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}