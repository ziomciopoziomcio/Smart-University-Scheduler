import {useEffect, useMemo, useRef, useState} from 'react';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    Checkbox,
    ListItemText,
    type SelectChangeEvent,
} from '@mui/material';
import {useIntl} from 'react-intl';

import type {PaginatedResponse} from '@api/core';

import {fetchFaculties} from '@api/domains/facilities/faculties';
import {fetchCampuses} from '@api/domains/facilities/campuses';
import {fetchBuildings} from '@api/domains/facilities/buildings';
import {fetchRooms} from '@api/domains/facilities/rooms';

import {fetchCourses} from '@api/domains/courses/courses';
import {fetchFacultyInstructors} from '@api/domains/courses/courseInstructors';
import {fetchStudyFields} from '@api/domains/courses/studyFields';
import {fetchStudyPrograms} from '@api/domains/courses/studyPrograms';

import {fetchGroups} from '@api/domains/academics/groups';

import type {
    Campus,
    Building,
    Faculty,
    Room,
} from '@api/domains/facilities/types';

import type {
    Course,
    StudyField,
    StudyProgram,
} from '@api/domains/courses/types';

import type {Group} from '@api/domains/academics/types';

import type {
    CreateScheduleSessionRequest,
    DayOfWeek,
} from '@api';

import type {
    FacultyInstructor,
} from '@api/domains/courses/courseInstructors';

interface AddScheduleSessionPopupProps {
    open: boolean;
    isSaving?: boolean;
    errorMessage?: string | null;
    onClose: () => void;
    onSave: (payload: CreateScheduleSessionRequest) => Promise<void>;
}

interface FormValues {
    facultyId: string;
    courseId: number | '';
    groupIds: string[];
    weeks: string[];
    dayOfWeek: DayOfWeek | '';
    startTime: string;
    endTime: string;
    instructorId: string;
    roomId: string;
}

interface RoomOption {
    id: number;
    label: string;
}

const PAGE_SIZE = 100;

const WEEK_OPTIONS = Array.from(
    {length: 15},
    (_, index) => index + 1,
);

const EMPTY_FORM_VALUES: FormValues = {
    facultyId: '',
    courseId: '',
    groupIds: [],
    weeks: WEEK_OPTIONS.map(String),
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    instructorId: '',
    roomId: '',
};

const dayOptions: { value: DayOfWeek; label: string }[] = [
    {value: 'MONDAY', label: 'Monday'},
    {value: 'TUESDAY', label: 'Tuesday'},
    {value: 'WEDNESDAY', label: 'Wednesday'},
    {value: 'THURSDAY', label: 'Thursday'},
    {value: 'FRIDAY', label: 'Friday'},
    {value: 'SATURDAY', label: 'Saturday'},
    {value: 'SUNDAY', label: 'Sunday'},
];

async function fetchAllPages<T>(
    fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
    const result: T[] = [];

    for (let page = 1; page <= 100; page += 1) {
        const response = await fetchPage(page, PAGE_SIZE);
        const items = response.items ?? [];

        result.push(...items);

        if (
            items.length < PAGE_SIZE ||
            result.length >= response.total
        ) {
            return result;
        }
    }

    return result;
}

function deduplicateById<T extends { id: number }>(items: T[]): T[] {
    return [...new Map(items.map((item) => [item.id, item])).values()];
}

async function fetchAllFaculties(): Promise<Faculty[]> {
    return fetchAllPages((page, limit) =>
        fetchFaculties(page, limit),
    );
}

async function fetchAllCourses(): Promise<Course[]> {
    return fetchAllPages((page, limit) =>
        fetchCourses(page, limit),
    );
}

async function fetchAllInstructors(
    faculties: Faculty[],
): Promise<FacultyInstructor[]> {
    const instructorLists = await Promise.all(
        faculties.map((faculty) =>
            fetchFacultyInstructors(faculty.id),
        ),
    );

    return deduplicateById(instructorLists.flat()).sort((left, right) => {
        return `${left.surname} ${left.name}`.localeCompare(
            `${right.surname} ${right.name}`,
        );
    });
}

async function fetchAllCampuses(): Promise<Campus[]> {
    return fetchAllPages((page, limit) =>
        fetchCampuses(page, limit),
    );
}

async function fetchAllBuildingsForCampus(
    campusId: number,
): Promise<Building[]> {
    return fetchAllPages((page, limit) =>
        fetchBuildings(campusId, page, limit),
    );
}

async function fetchAllRoomsForBuilding(
    buildingId: number,
): Promise<Room[]> {
    return fetchAllPages((page, limit) =>
        fetchRooms(buildingId, page, limit),
    );
}

async function fetchAllRoomOptions(): Promise<RoomOption[]> {
    const campuses = await fetchAllCampuses();

    const buildingGroups = await Promise.all(
        campuses.map(async (campus) => ({
            campus,
            buildings: await fetchAllBuildingsForCampus(campus.id),
        })),
    );

    const nestedRooms = await Promise.all(
        buildingGroups.flatMap(({campus, buildings}) =>
            buildings.map(async (building) => {
                const rooms = await fetchAllRoomsForBuilding(building.id);

                return rooms.map((room): RoomOption => ({
                    id: room.id,
                    label: [
                        campus.campus_short,
                        building.building_number,
                        room.room_name,
                    ].join(' · '),
                }));
            }),
        ),
    );

    return deduplicateById(nestedRooms.flat()).sort((left, right) =>
        left.label.localeCompare(right.label),
    );
}

async function fetchAllStudyFieldsForFaculty(
    facultyId: number,
): Promise<StudyField[]> {
    return fetchAllPages((page, limit) =>
        fetchStudyFields(
            page,
            limit,
            {
                faculty: facultyId,
            },
        ),
    );
}

async function fetchAllStudyProgramsForField(
    studyFieldId: number,
): Promise<StudyProgram[]> {
    return fetchAllPages((page, limit) =>
        fetchStudyPrograms(
            page,
            limit,
            undefined,
            {
                study_field: studyFieldId,
            },
        ),
    );
}

async function fetchAllGroupsForProgram(
    studyProgramId: number,
): Promise<Group[]> {
    return fetchAllPages((page, limit) =>
        fetchGroups(
            page,
            limit,
            {
                study_program: studyProgramId,
                is_active: true,
            },
        ),
    );
}

async function fetchAllGroupsForFaculty(
    facultyId: number,
): Promise<Group[]> {
    const studyFields = await fetchAllStudyFieldsForFaculty(facultyId);

    const programLists = await Promise.all(
        studyFields.map((studyField) =>
            fetchAllStudyProgramsForField(studyField.id),
        ),
    );

    const programs = deduplicateById(programLists.flat());

    const groupLists = await Promise.all(
        programs.map((program) =>
            fetchAllGroupsForProgram(program.id),
        ),
    );

    return deduplicateById(groupLists.flat()).sort((left, right) =>
        left.group_name.localeCompare(right.group_name),
    );
}

export function AddScheduleSessionPopup({
                                            open,
                                            isSaving = false,
                                            errorMessage = null,
                                            onClose,
                                            onSave,
                                        }: AddScheduleSessionPopupProps) {
    const {formatMessage} = useIntl();

    const [formValues, setFormValues] =
        useState<FormValues>(EMPTY_FORM_VALUES);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [instructors, setInstructors] = useState<FacultyInstructor[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);

    const [isLoadingInitialOptions, setIsLoadingInitialOptions] =
        useState(false);

    const [isLoadingGroups, setIsLoadingGroups] =
        useState(false);

    const [optionsError, setOptionsError] =
        useState<string | null>(null);

    const groupsRequestId = useRef(0);

    const [courseSearch, setCourseSearch] = useState('');
    const [instructorSearch, setInstructorSearch] = useState('');
    const [roomSearch, setRoomSearch] = useState('');
    const normalizeSearch = (value: string) =>
        value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    useEffect(() => {
        if (!open) {
            return;
        }

        let isActive = true;

        setFormValues(EMPTY_FORM_VALUES);
        setFaculties([]);
        setCourses([]);
        setGroups([]);
        setInstructors([]);
        setRooms([]);
        setOptionsError(null);
        setIsLoadingInitialOptions(true);
        setCourseSearch('');
        setInstructorSearch('');
        setRoomSearch('');

        void fetchAllFaculties()
            .then(async (loadedFaculties) => {
                const [
                    loadedCourses,
                    loadedInstructors,
                    loadedRooms,
                ] = await Promise.all([
                    fetchAllCourses(),
                    fetchAllInstructors(loadedFaculties),
                    fetchAllRoomOptions(),
                ]);

                if (!isActive) {
                    return;
                }

                setFaculties(loadedFaculties);
                setCourses(loadedCourses);
                setInstructors(loadedInstructors);
                setRooms(loadedRooms);
            })
            .catch((error: unknown) => {
                if (!isActive) {
                    return;
                }

                setOptionsError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load session form options',
                );
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingInitialOptions(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [open]);

    const selectedGroupsLabel = useMemo(() => {
        const selectedIds = new Set(formValues.groupIds);

        return groups
            .filter((group) => selectedIds.has(String(group.id)))
            .map((group) => `${group.group_name} (#${group.id})`)
            .join(', ');
    }, [formValues.groupIds, groups]);

    const selectedWeeksLabel = useMemo(() => {
        if (formValues.weeks.length === WEEK_OPTIONS.length) {
            return 'All weeks';
        }

        return formValues.weeks
            .map(Number)
            .sort((left, right) => left - right)
            .join(', ');
    }, [formValues.weeks]);

    const filteredCourses = useMemo(() => {
        const query = normalizeSearch(courseSearch);

        if (!query) {
            return courses;
        }

        return courses.filter((course) => {
            const searchable = normalizeSearch(
                [
                    course.course_code,
                    course.course_name,
                ].join(' '),
            );

            return searchable.includes(query);
        });
    }, [courseSearch, courses]);

    const filteredInstructors = useMemo(() => {
        const query = normalizeSearch(instructorSearch);

        if (!query) {
            return instructors;
        }

        return instructors.filter((instructor) => {
            const searchable = normalizeSearch(
                [
                    instructor.id,
                    instructor.degree,
                    instructor.name,
                    instructor.surname,
                ]
                    .filter(Boolean)
                    .join(' '),
            );

            return searchable.includes(query);
        });
    }, [instructorSearch, instructors]);

    const filteredRooms = useMemo(() => {
        const query = normalizeSearch(roomSearch);

        if (!query) {
            return rooms;
        }

        return rooms.filter((room) => {
            const searchable = normalizeSearch(
                [
                    room.id,
                    room.label,
                ].join(' '),
            );

            return searchable.includes(query);
        });
    }, [roomSearch, rooms]);

    const handleFacultyChange = async (
        event: SelectChangeEvent,
    ) => {
        const facultyId = event.target.value;
        const currentRequestId = groupsRequestId.current + 1;

        groupsRequestId.current = currentRequestId;

        setFormValues((current) => ({
            ...current,
            facultyId,
            groupIds: [],
        }));

        setGroups([]);
        setOptionsError(null);

        if (!facultyId) {
            return;
        }

        setIsLoadingGroups(true);

        try {
            const loadedGroups = await fetchAllGroupsForFaculty(
                Number(facultyId),
            );

            if (groupsRequestId.current !== currentRequestId) {
                return;
            }

            setGroups(loadedGroups);
        } catch (error) {
            if (groupsRequestId.current !== currentRequestId) {
                return;
            }

            setOptionsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch groups',
            );
        } finally {
            if (groupsRequestId.current === currentRequestId) {
                setIsLoadingGroups(false);
            }
        }
    };

    const handleSave = async () => {
        if (
            !formValues.dayOfWeek ||
            typeof formValues.courseId !== 'number' ||
            Number.isNaN(formValues.courseId)
        ) {
            return;
        }

        await onSave({
            courseId: formValues.courseId,
            groupIds: formValues.groupIds.map(Number),
            weeks: formValues.weeks
                .map(Number)
                .sort((left, right) => left - right),
            dayOfWeek: formValues.dayOfWeek,
            startTime: formValues.startTime,
            endTime: formValues.endTime,
            instructorId: Number(formValues.instructorId),
            roomId: Number(formValues.roomId),
        });
    };

    const isCourseInvalid =
        typeof formValues.courseId !== 'number' ||
        Number.isNaN(formValues.courseId);

    const isSaveDisabled =
        isSaving ||
        isLoadingInitialOptions ||
        isLoadingGroups ||
        Boolean(optionsError) ||
        !formValues.facultyId ||
        isCourseInvalid ||
        formValues.groupIds.length === 0 ||
        formValues.weeks.length === 0 ||
        !formValues.dayOfWeek ||
        !formValues.startTime ||
        !formValues.endTime ||
        formValues.startTime >= formValues.endTime ||
        !formValues.instructorId ||
        !formValues.roomId;

    return (
        <Dialog
            open={open}
            onClose={isSaving ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            keepMounted={false}
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    boxShadow: '0 24px 60px rgba(20, 30, 55, 0.18)',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogContent sx={{p: {xs: 3, md: 4}, bgcolor: '#FFFFFF'}}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                        mb: 3,
                    }}
                >
                    <AddCircleOutlineRoundedIcon
                        sx={{
                            fontSize: 56,
                            color: '#A8ADB7',
                            flexShrink: 0,
                        }}
                    />

                    <Box>
                        <Typography
                            sx={{
                                fontSize: {xs: 25, md: 30},
                                fontWeight: 700,
                                color: '#4F4F4F',
                                lineHeight: 1.1,
                            }}
                        >
                            {formatMessage({
                                id: 'schedule.add.title',
                                defaultMessage: 'Add schedule session',
                            })}
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.8,
                                fontSize: 14.5,
                                color: '#7A7A7A',
                            }}
                        >
                            {formatMessage({
                                id: 'schedule.add.description',
                                defaultMessage:
                                    'Complete the details of the new session.',
                            })}
                        </Typography>
                    </Box>
                </Box>

                {(optionsError || errorMessage) && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 2,
                            borderRadius: '14px',
                            '& .MuiAlert-message': {
                                overflowWrap: 'anywhere',
                            },
                        }}
                    >
                        {optionsError || errorMessage}
                    </Alert>
                )}

                {isLoadingInitialOptions && (
                    <Box
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                        }}
                    >
                        <CircularProgress size={18}/>

                        <Typography sx={{fontSize: 13, color: '#7A7A7A'}}>
                            {formatMessage({
                                id: 'schedule.add.loadingOptions',
                                defaultMessage:
                                    'Loading courses, rooms and instructors...',
                            })}
                        </Typography>
                    </Box>
                )}

                <Stack spacing={2.2}>
                    <FormControl fullWidth disabled={isLoadingInitialOptions}>
                        <InputLabel>Faculty</InputLabel>

                        <Select
                            value={formValues.facultyId}
                            label="Faculty"
                            onChange={(event) => {
                                void handleFacultyChange(event);
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            {faculties.map((faculty) => (
                                <MenuItem
                                    key={faculty.id}
                                    value={String(faculty.id)}
                                >
                                    {faculty.faculty_name}
                                    {' '}
                                    ({faculty.faculty_short})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl
                        fullWidth
                        disabled={
                            !formValues.facultyId ||
                            isLoadingGroups
                        }
                    >
                        <InputLabel>Groups</InputLabel>

                        <Select
                            multiple
                            value={formValues.groupIds}
                            label="Groups"
                            renderValue={() => selectedGroupsLabel}
                            onChange={(event) => {
                                const value = event.target.value;

                                setFormValues((current) => ({
                                    ...current,
                                    groupIds:
                                        typeof value === 'string'
                                            ? value.split(',')
                                            : value,
                                }));
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            {groups.map((group) => (
                                <MenuItem
                                    key={group.id}
                                    value={String(group.id)}
                                >
                                    {group.group_name} (#{group.id})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Weeks</InputLabel>

                        <Select
                            multiple
                            value={formValues.weeks}
                            label="Weeks"
                            renderValue={() => selectedWeeksLabel}
                            onChange={(event) => {
                                const value = event.target.value;

                                setFormValues((current) => ({
                                    ...current,
                                    weeks:
                                        typeof value === 'string'
                                            ? value.split(',')
                                            : value,
                                }));
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 360,
                                    },
                                },
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            {WEEK_OPTIONS.map((week) => {
                                const weekValue = String(week);

                                return (
                                    <MenuItem key={week} value={weekValue}>
                                        <Checkbox
                                            checked={formValues.weeks.includes(weekValue)}
                                        />

                                        <ListItemText primary={`Week ${week}`}/>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </FormControl>

                    {isLoadingGroups && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.2,
                            }}
                        >
                            <CircularProgress size={18}/>

                            <Typography sx={{fontSize: 13, color: '#7A7A7A'}}>
                                Loading groups...
                            </Typography>
                        </Box>
                    )}

                    <FormControl fullWidth disabled={isLoadingInitialOptions}>
                        <InputLabel>Course</InputLabel>

                        <Select
                            value={
                                formValues.courseId === ''
                                    ? ''
                                    : String(formValues.courseId)
                            }
                            label="Course"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 360,
                                    },
                                },
                            }}
                            onChange={(event: SelectChangeEvent) => {
                                const courseId = Number(event.target.value);

                                setFormValues((current) => ({
                                    ...current,
                                    courseId: Number.isNaN(courseId)
                                        ? ''
                                        : courseId,
                                }));
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            <MenuItem disableRipple>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    placeholder="Search by course code or name..."
                                    value={courseSearch}
                                    onChange={(event) => {
                                        setCourseSearch(event.target.value);
                                    }}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                    onKeyDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                />
                            </MenuItem>

                            {filteredCourses.map((course) => (
                                <MenuItem
                                    key={course.course_code}
                                    value={String(course.course_code)}
                                >
                                    {course.course_name} (#{course.course_code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Day of week</InputLabel>

                        <Select
                            value={formValues.dayOfWeek}
                            label="Day of week"
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    dayOfWeek:
                                        event.target.value as DayOfWeek,
                                }));
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            {dayOptions.map((day) => (
                                <MenuItem key={day.value} value={day.value}>
                                    {day.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr',
                            },
                            gap: 2,
                        }}
                    >
                        <TextField
                            fullWidth
                            type="time"
                            label="Start time"
                            value={formValues.startTime}
                            InputLabelProps={{shrink: true}}
                            onChange={(event) => {
                                setFormValues((current) => ({
                                    ...current,
                                    startTime: event.target.value,
                                }));
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    bgcolor: '#FBFCFF',
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            type="time"
                            label="End time"
                            value={formValues.endTime}
                            InputLabelProps={{shrink: true}}
                            onChange={(event) => {
                                setFormValues((current) => ({
                                    ...current,
                                    endTime: event.target.value,
                                }));
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '16px',
                                    bgcolor: '#FBFCFF',
                                },
                            }}
                        />
                    </Box>

                    <FormControl fullWidth disabled={isLoadingInitialOptions}>
                        <InputLabel>Instructor</InputLabel>

                        <Select
                            value={formValues.instructorId}
                            label="Instructor"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 360,
                                    },
                                },
                            }}
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    instructorId: event.target.value,
                                }));
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            <MenuItem disableRipple>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    placeholder="Search by instructor name or surname..."
                                    value={instructorSearch}
                                    onChange={(event) => {
                                        setInstructorSearch(event.target.value);
                                    }}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                    onKeyDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                />
                            </MenuItem>

                            {filteredInstructors.map((instructor) => (
                                <MenuItem
                                    key={instructor.id}
                                    value={String(instructor.id)}
                                >
                                    {[
                                        instructor.degree,
                                        instructor.name,
                                        instructor.surname,
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    {' '}
                                    (#{instructor.id})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={isLoadingInitialOptions}>
                        <InputLabel>Room</InputLabel>

                        <Select
                            value={formValues.roomId}
                            label="Room"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 360,
                                    },
                                },
                            }}
                            onChange={(event: SelectChangeEvent) => {
                                setFormValues((current) => ({
                                    ...current,
                                    roomId: event.target.value,
                                }));
                            }}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                            }}
                        >
                            <MenuItem disableRipple>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    size="small"
                                    placeholder="Search by room, building or campus..."
                                    value={roomSearch}
                                    onChange={(event) => {
                                        setRoomSearch(event.target.value);
                                    }}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                    }}
                                    onKeyDown={(event) => {
                                        event.stopPropagation();
                                    }}
                                />
                            </MenuItem>

                            {filteredRooms.map((room) => (
                                <MenuItem
                                    key={room.id}
                                    value={String(room.id)}
                                >
                                    {room.label} (#{room.id})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1.5,
                            pt: 1,
                        }}
                    >
                        <Button
                            onClick={onClose}
                            disabled={isSaving}
                            sx={{
                                height: 48,
                                px: 3,
                                borderRadius: '15px',
                                textTransform: 'none',
                                fontWeight: 700,
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="contained"
                            disabled={isSaveDisabled}
                            onClick={() => {
                                void handleSave();
                            }}
                            sx={{
                                height: 48,
                                px: 3.5,
                                borderRadius: '15px',
                                textTransform: 'none',
                                bgcolor: '#4F5E82',
                                fontWeight: 800,
                                '&:hover': {
                                    bgcolor: '#465577',
                                },
                            }}
                        >
                            {isSaving ? 'Saving...' : 'Add session'}
                        </Button>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}