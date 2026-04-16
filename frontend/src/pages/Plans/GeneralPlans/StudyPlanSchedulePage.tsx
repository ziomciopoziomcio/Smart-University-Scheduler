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
import type {Faculty, Group, Major, ScheduleEntry, StudyField, StudyPlanGroupSummary} from '@api/types';
import {WeekSchedule} from '@components/Schedule/WeekSchedule';
import {addDays, addWeeks, getStartOfWeek, toIsoDate} from '@components/Schedule/utils/dateUtils';
import {getMockStudyPlanScheduleEntries} from '../../../mocks/studyPlansMock';
import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import {useIntl} from 'react-intl';
import {getFaculty} from '@api/structures.ts';
import {getMajor, getStudyField} from '@api/courses.ts';
import {getGroup} from '@api/academics.ts';
import {
    fetchMockStudyPlanElectiveBlockGroups,
    fetchMockStudyPlanElectiveBlocks,
    type StudyPlanElectiveBlockSummary,
} from '../../../mocks/studyPlanElectiveBlocksMock';

// TODO: Replace with backend API call
//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/143 - fetch eelecive blocks
//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/137 - fetch groups
//DELETE MOCKS THAT ARE DOWN THERE

export async function getStudyPlanScheduleForWeek(
    facultyId: string,
    fieldOfStudyId: string,
    semesterId: string,
    specializationId: string | null,
    weekStart: Date,
): Promise<ScheduleEntry[]> {
    const weekEnd = addDays(weekStart, 6);
    const startIso = toIsoDate(weekStart);
    const endIso = toIsoDate(weekEnd);

    return new Promise((resolve) => {
        setTimeout(() => {
            const allEntries = getMockStudyPlanScheduleEntries({
                facultyId,
                fieldOfStudyId,
                semesterId,
                specializationId,
                blockId: null,
            });

            const filtered = allEntries.filter((entry) => {
                return entry.date >= startIso && entry.date <= endIso;
            });

            resolve(filtered);
        }, 700);
    });
}

interface SelectedElectiveGroupEntry {
    blockId: number;
    blockName: string;
    groupId: number;
    groupName: string;
}

function createMockElectiveGroupEntries(
    selectedItems: SelectedElectiveGroupEntry[],
    weekStart: Date,
): ScheduleEntry[] {
    const daySlots = [1, 2, 3, 4];
    const timeSlots = [
        {startTime: '08:15', endTime: '09:45'},
        {startTime: '10:15', endTime: '11:45'},
        {startTime: '12:15', endTime: '13:45'},
        {startTime: '14:15', endTime: '15:45'},
    ];

    return selectedItems.map((item, index) => {
        const slot = timeSlots[index % timeSlots.length];
        const dayOffset = daySlots[index % daySlots.length];

        return {
            id: `elective-${item.blockId}-${item.groupId}`,
            title: `${item.blockName}\n${item.groupName}`,
            date: toIsoDate(addDays(weekStart, dayOffset)),
            startTime: slot.startTime,
            endTime: slot.endTime,
            variant: 'lab',
        } as ScheduleEntry;
    });
}

export default function StudyPlanSchedulePage() {
    const intl = useIntl();

    const {
        facultyId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        groupId,
    } = useParams();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [field, setField] = useState<StudyField | null>(null);
    const [specialization, setSpecialization] = useState<Major | null>(null);
    const [group, setGroup] = useState<Group | null>(null);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        getStartOfWeek(new Date()),
    );
    const [entries, setEntries] = useState<ScheduleEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [electiveBlocks, setElectiveBlocks] = useState<StudyPlanElectiveBlockSummary[]>([]);
    const [electiveGroupsByBlock, setElectiveGroupsByBlock] = useState<Record<number, StudyPlanGroupSummary[]>>({});
    const [expandedBlocks, setExpandedBlocks] = useState<number[]>([]);
    const [selectedElectiveGroups, setSelectedElectiveGroups] = useState<Record<number, number[]>>({});
    const [electiveLoading, setElectiveLoading] = useState(false);

    const numericFacultyId = Number(facultyId);
    const numericFieldOfStudyId = Number(fieldOfStudyId);
    const numericSemesterId = Number(semesterId);
    const numericSpecializationId = specializationId ? Number(specializationId) : null;
    const numericGroupId = groupId ? Number(groupId) : null;

    useEffect(() => {
        if (
            !facultyId ||
            !fieldOfStudyId ||
            Number.isNaN(numericFacultyId) ||
            Number.isNaN(numericFieldOfStudyId)
        ) {
            setFaculty(null);
            setField(null);
            setSpecialization(null);
            setGroup(null);
            return;
        }

        let cancelled = false;

        const loadBreadcrumbData = async () => {
            const facultyPromise = getFaculty(numericFacultyId);
            const fieldPromise = getStudyField(numericFieldOfStudyId);
            const majorPromise =
                numericSpecializationId !== null ? getMajor(numericSpecializationId) : Promise.resolve(null);
            const groupPromise =
                numericGroupId !== null ? getGroup(numericGroupId) : Promise.resolve(null);

            const [facultyResult, fieldResult, majorResult, groupResult] = await Promise.allSettled([
                facultyPromise,
                fieldPromise,
                majorPromise,
                groupPromise,
            ]);

            if (cancelled) return;

            setFaculty(
                facultyResult.status === 'fulfilled' ? (facultyResult.value as Faculty) : null,
            );

            setField(
                fieldResult.status === 'fulfilled' ? (fieldResult.value as StudyField) : null,
            );

            setSpecialization(
                majorResult.status === 'fulfilled' ? (majorResult.value as Major | null) : null,
            );

            setGroup(
                groupResult.status === 'fulfilled' ? (groupResult.value as Group | null) : null,
            );
        };

        loadBreadcrumbData();

        return () => {
            cancelled = true;
        };
    }, [
        facultyId,
        fieldOfStudyId,
        specializationId,
        groupId,
        numericFacultyId,
        numericFieldOfStudyId,
        numericSpecializationId,
        numericGroupId,
    ]);

    useEffect(() => {
        if (
            !fieldOfStudyId ||
            !semesterId ||
            Number.isNaN(numericFieldOfStudyId) ||
            Number.isNaN(numericSemesterId)
        ) {
            setElectiveBlocks([]);
            setElectiveGroupsByBlock({});
            setExpandedBlocks([]);
            setSelectedElectiveGroups({});
            return;
        }

        let cancelled = false;

        const loadElectiveBlocks = async () => {
            setElectiveLoading(true);

            try {
                const blocks = await fetchMockStudyPlanElectiveBlocks({
                    fieldOfStudyId: numericFieldOfStudyId,
                    semesterId: numericSemesterId,
                    specializationId: numericSpecializationId,
                });

                if (cancelled) return;

                setElectiveBlocks(blocks);

                if (blocks.length === 0) {
                    setElectiveGroupsByBlock({});
                    setExpandedBlocks([]);
                    setSelectedElectiveGroups({});
                }
            } finally {
                if (!cancelled) {
                    setElectiveLoading(false);
                }
            }
        };

        loadElectiveBlocks();

        return () => {
            cancelled = true;
        };
    }, [
        fieldOfStudyId,
        semesterId,
        numericFieldOfStudyId,
        numericSemesterId,
        numericSpecializationId,
    ]);

    const breadcrumbs = useMemo((): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            {
                label: intl.formatMessage({id: 'plans.plans'}),
                path: '/plans',
            },
            {
                label: intl.formatMessage({id: 'plans.studentsPlan.title'}),
                path: '/plans/study/faculty',
            },
        ];

        if (facultyId) {
            items.push({
                label: faculty?.faculty_short ?? `Wydział ${facultyId}`,
                path: `/plans/study/faculty/${facultyId}/field/`,
            });
        }

        if (facultyId && fieldOfStudyId) {
            items.push({
                label: field?.field_name ?? `Kierunek ${fieldOfStudyId}`,
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester`,
            });
        }

        if (facultyId && fieldOfStudyId && semesterId && !specializationId) {
            items.push({
                label: intl.formatMessage(
                    {id: 'plans.studentsPlan.studySemester.semesterLabel'},
                    {number: semesterId},
                ),
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/group`,
            });
        }

        if (facultyId && fieldOfStudyId && semesterId && specializationId) {
            items.push({
                label: intl.formatMessage(
                    {id: 'plans.studentsPlan.studySemester.semesterLabel'},
                    {number: semesterId},
                ),
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization`,
            });
            items.push({
                label: specialization?.major_name ?? `Specjalizacja ${specializationId}`,
                path: `/plans/study/faculty/${facultyId}/field/${fieldOfStudyId}/semester/${semesterId}/specialization/${specializationId}/group`,
            });
        }

        if (facultyId && fieldOfStudyId && semesterId && groupId) {
            items.push({
                label: group?.group_name ?? `Grupa ${groupId}`,
                path: '',
            });
        }

        items.push({
            label: intl.formatMessage({
                id: 'plans.studentsPlan.studySchedule.title',
                defaultMessage: 'Plan',
            }),
            path: '',
        });

        return items;
    }, [
        intl,
        facultyId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        groupId,
        faculty,
        field,
        specialization,
        group,
    ]);

    const selectedElectiveEntries = useMemo(() => {
        return electiveBlocks.flatMap((block) => {
            const selectedIds = selectedElectiveGroups[block.id] ?? [];
            const blockGroups = electiveGroupsByBlock[block.id] ?? [];

            return selectedIds
                .map((groupIdValue) => {
                    const matchedGroup = blockGroups.find((item) => item.id === groupIdValue);
                    if (!matchedGroup) return null;

                    return {
                        blockId: block.id,
                        blockName: block.name,
                        groupId: matchedGroup.id,
                        groupName: matchedGroup.group_name,
                    };
                })
                .filter(Boolean) as SelectedElectiveGroupEntry[];
        });
    }, [electiveBlocks, electiveGroupsByBlock, selectedElectiveGroups]);

    useEffect(() => {
        if (!facultyId || !fieldOfStudyId || !semesterId) return;

        let isCancelled = false;

        const fetchWeekSchedule = async () => {
            setIsLoading(true);

            try {
                const baseEntries = await getStudyPlanScheduleForWeek(
                    facultyId,
                    fieldOfStudyId,
                    semesterId,
                    specializationId ?? null,
                    currentWeekStart,
                );

                const electiveEntries = createMockElectiveGroupEntries(
                    selectedElectiveEntries,
                    currentWeekStart,
                );

                if (!isCancelled) {
                    setEntries([...baseEntries, ...electiveEntries]);
                }
            } catch {
                if (!isCancelled) {
                    setEntries([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchWeekSchedule();

        return () => {
            isCancelled = true;
        };
    }, [
        facultyId,
        fieldOfStudyId,
        semesterId,
        specializationId,
        currentWeekStart,
        selectedElectiveEntries,
    ]);

    const handlePrevWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, -1));
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => addWeeks(prev, 1));
    };

    const handleAccordionChange = (blockId: number) => async (_event: React.SyntheticEvent, expanded: boolean) => {
        setExpandedBlocks((prev) =>
            expanded ? [...prev.filter((id) => id !== blockId), blockId] : prev.filter((id) => id !== blockId),
        );

        if (
            expanded &&
            !electiveGroupsByBlock[blockId] &&
            !Number.isNaN(numericFieldOfStudyId) &&
            !Number.isNaN(numericSemesterId)
        ) {
            const groups = await fetchMockStudyPlanElectiveBlockGroups({
                fieldOfStudyId: numericFieldOfStudyId,
                semesterId: numericSemesterId,
                blockId,
                specializationId: numericSpecializationId,
            });

            setElectiveGroupsByBlock((prev) => ({
                ...prev,
                [blockId]: groups,
            }));
        }
    };

    const handleGroupToggle = (blockId: number, groupIdValue: number) => {
        setSelectedElectiveGroups((prev) => {
            const current = prev[blockId] ?? [];
            const exists = current.includes(groupIdValue);

            return {
                ...prev,
                [blockId]: exists
                    ? current.filter((id) => id !== groupIdValue)
                    : [...current, groupIdValue],
            };
        });
    };

    const showElectiveSection = electiveBlocks.length > 0;

    return (
        <Box sx={{width: '100%', display: 'flex', flexDirection: 'column', gap: 2}}>
            <PageBreadcrumbs items={breadcrumbs}/>

            <WeekSchedule
                entries={entries}
                currentWeekStart={currentWeekStart}
                isLoading={isLoading}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
            />

            {showElectiveSection && (
                <Box
                    sx={{
                        px: {xs: 2, md: 3},
                        py: {xs: 2.5, md: 3},
                        borderRadius: 2,
                        bgcolor: '#FBFCFF',
                    }}
                >
                    <Typography
                        sx={{
                            mb: 2,
                            fontSize: '20px',
                            fontWeight: 500,
                            textAlign: 'center',
                            color: '#111111',
                        }}
                    >
                        {intl.formatMessage({
                            id: 'plans.studentsPlan.studyBlock.title',
                            defaultMessage: 'Bloki obieralne',
                        })}
                    </Typography>

                    {electiveLoading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                            <CircularProgress/>
                        </Box>
                    ) : (
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                            {electiveBlocks.map((block) => {
                                const groups = electiveGroupsByBlock[block.id] ?? [];
                                const selectedIds = selectedElectiveGroups[block.id] ?? [];
                                const expanded = expandedBlocks.includes(block.id);

                                return (
                                    <Accordion
                                        key={block.id}
                                        expanded={expanded}
                                        onChange={handleAccordionChange(block.id)}
                                        disableGutters
                                        elevation={0}
                                        sx={{
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '12px !important',
                                            '&:before': {display: 'none'},
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    pr: 1,
                                                }}
                                            >
                                                <Typography sx={{fontSize: '16px', fontWeight: 500}}>
                                                    {block.name}
                                                </Typography>

                                                {selectedIds.length > 0 && (
                                                    <Typography sx={{fontSize: '13px', color: '#666666'}}>
                                                        {selectedIds.length}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            <FormGroup>
                                                {groups.map((blockGroup) => (
                                                    <FormControlLabel
                                                        key={blockGroup.id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedIds.includes(blockGroup.id)}
                                                                onChange={() =>
                                                                    handleGroupToggle(block.id, blockGroup.id)
                                                                }
                                                            />
                                                        }
                                                        label={`${blockGroup.group_name} (${blockGroup.group_code})`}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}