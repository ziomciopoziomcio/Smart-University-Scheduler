import {useEffect, useMemo, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import {
    type Faculty,
    type PlannerSettings,
    type SemesterType,
    type ValidationReport,
    createPlannerSettings,
    fetchFaculties,
    fetchPlannerSettings,
    generateSchedule,
    updatePlannerSettings,
    validateOptimizationData,
} from '@api';

import {
    GenerateHero,
} from '@components/Generate';

import {useAuthStore} from '@store/useAuthStore';
import {useIntl} from 'react-intl';

const isAdministratorRole = (roles?: string[]) => {
    return roles?.some((role) => {
        const normalizedRole = role.toLowerCase();

        return (
            normalizedRole === 'administrator' ||
            normalizedRole === 'admin' ||
            normalizedRole === 'role_admin'
        );
    }) ?? false;
};

const getCurrentAcademicYear = (): string => {
    const now = new Date();

    const startYear = now.getMonth() >= 8
        ? now.getFullYear()
        : now.getFullYear() - 1;

    const endYear = String((startYear + 1) % 100).padStart(2, '0');

    return `${startYear}/${endYear}`;
};

const getAcademicYearOptions = (): string[] => {
    const currentStartYear = Number(
        getCurrentAcademicYear().slice(0, 4),
    );

    return Array.from({length: 5}, (_, index) => {
        const startYear = currentStartYear - 1 + index;
        const endYear = String((startYear + 1) % 100).padStart(2, '0');

        return `${startYear}/${endYear}`;
    });
};

const getCurrentSemesterType = (): SemesterType => {
    const month = new Date().getMonth() + 1;

    return month >= 9 || month <= 2
        ? 'WINTER'
        : 'SUMMER';
};

const getErrorMessage = (
    error: unknown,
    fallbackMessage: string,
): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
};

export default function GenerateSchedulePage() {
    const intl = useIntl();
    const user = useAuthStore((state) => state.user);

    const [isGenerating, setIsGenerating] = useState(false);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [isFacultiesLoading, setIsFacultiesLoading] = useState(false);

    const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
    const [semesterType, setSemesterType] = useState<SemesterType>(
        getCurrentSemesterType(),
    );

    const [plannerSettings, setPlannerSettings] =
        useState<PlannerSettings | null>(null);

    const [validationReport, setValidationReport] =
        useState<ValidationReport | null>(null);

    const [isPlannerSettingsLoading, setIsPlannerSettingsLoading] =
        useState(false);

    const [isPlannerSettingsSaving, setIsPlannerSettingsSaving] =
        useState(false);

    const [isValidating, setIsValidating] = useState(false);
    const [isConfigurationDirty, setIsConfigurationDirty] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const academicYearOptions = useMemo(
        () => getAcademicYearOptions(),
        [],
    );

    const isAdministrator = useMemo(() => {
        return isAdministratorRole(user?.roles);
    }, [user?.roles]);

    useEffect(() => {
        let cancelled = false;

        const loadFaculties = async () => {
            setIsFacultiesLoading(true);
            setErrorMessage(null);

            try {
                const response = await fetchFaculties();

                const loadedFaculties = Array.isArray(response)
                    ? response
                    : response.items;

                if (!cancelled) {
                    setFaculties(loadedFaculties);
                    setSelectedFacultyId(loadedFaculties[0]?.id ?? null);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        getErrorMessage(
                            error,
                            intl.formatMessage({
                                id: 'generateSchedule.configuration.unexpectedError',
                            }),
                        ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsFacultiesLoading(false);
                }
            }
        };

        void loadFaculties();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedFacultyId) {
            setPlannerSettings(null);
            setValidationReport(null);
            setIsConfigurationDirty(true);

            return;
        }

        let cancelled = false;

        const loadPlannerSettings = async () => {
            setIsPlannerSettingsLoading(true);
            setErrorMessage(null);
            setValidationReport(null);

            try {
                const settings = await fetchPlannerSettings(
                    selectedFacultyId,
                );

                if (cancelled) {
                    return;
                }

                setPlannerSettings(settings);

                if (settings) {
                    setAcademicYear(settings.planned_academic_year);
                    setSemesterType(settings.planned_semester_type);
                    setIsConfigurationDirty(false);
                } else {
                    setAcademicYear(getCurrentAcademicYear());
                    setSemesterType(getCurrentSemesterType());
                    setIsConfigurationDirty(true);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        getErrorMessage(
                            error,
                            intl.formatMessage({
                                id: 'generateSchedule.configuration.unexpectedError',
                            }),
                        ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsPlannerSettingsLoading(false);
                }
            }
        };

        void loadPlannerSettings();

        return () => {
            cancelled = true;
        };
    }, [selectedFacultyId]);

    const invalidateValidation = () => {
        setValidationReport(null);
        setIsConfigurationDirty(true);
    };

    const handleFacultyChange = (facultyId: number) => {
        setSelectedFacultyId(facultyId);
        setNotifications([]);
        setHasGeneratedSchedule(false);
    };

    const handleSavePlannerSettings = async () => {
        if (!selectedFacultyId) {
            return;
        }

        setIsPlannerSettingsSaving(true);
        setValidationReport(null);
        setErrorMessage(null);

        try {
            const payload = {
                faculty_id: selectedFacultyId,
                planned_academic_year: academicYear,
                planned_semester_type: semesterType,
                is_planning_active: true,
            };

            const savedSettings = plannerSettings
                ? await updatePlannerSettings(
                    plannerSettings.id,
                    payload,
                )
                : await createPlannerSettings(payload);

            setPlannerSettings(savedSettings);
            setIsConfigurationDirty(false);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    intl.formatMessage({
                        id: 'generateSchedule.configuration.unexpectedError',
                    }),
                ),
            );
        } finally {
            setIsPlannerSettingsSaving(false);
        }
    };

    const handleValidate = async () => {
        if (
            !selectedFacultyId ||
            !plannerSettings ||
            isConfigurationDirty
        ) {
            return;
        }

        setIsValidating(true);
        setValidationReport(null);
        setErrorMessage(null);

        try {
            const report = await validateOptimizationData(
                selectedFacultyId,
            );

            setValidationReport(report);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    intl.formatMessage({
                        id: 'generateSchedule.configuration.unexpectedError',
                    }),
                ),
            );
        } finally {
            setIsValidating(false);
        }
    };

    const handleGenerate = async () => {
        if (
            !selectedFacultyId ||
            !plannerSettings ||
            !validationReport ||
            isConfigurationDirty
        ) {
            return;
        }

        setIsGenerating(true);
        setHasGeneratedSchedule(false);
        setNotifications([]);
        setErrorMessage(null);

        try {
            await generateSchedule({
                faculty_id: selectedFacultyId,
            });
            //TODO: PROGRESS
            setHasGeneratedSchedule(true);
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    intl.formatMessage({
                        id: 'generateSchedule.configuration.unexpectedError',
                    }),
                ),
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const validationIssuesCount = validationReport
        ? validationReport.missing_competencies.length +
        validationReport.workload_mismatch.length +
        validationReport.no_suitable_rooms.length +
        validationReport.oversized_groups.length +
        validationReport.semester_parity_warnings.length
        : 0;

    const isGenerateDisabled =
        !plannerSettings ||
        !validationReport ||
        isConfigurationDirty ||
        isGenerating;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
            }}
        >
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h6">
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.title',
                                })}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.description',
                                })}
                            </Typography>
                        </Box>

                        <Stack
                            direction={{
                                xs: 'column',
                                md: 'row',
                            }}
                            spacing={2}
                        >
                            <FormControl
                                fullWidth
                                disabled={
                                    isFacultiesLoading ||
                                    isPlannerSettingsLoading
                                }
                            >
                                <InputLabel id="faculty-select-label">
                                    {intl.formatMessage({
                                        id: 'generateSchedule.configuration.facultyLabel',
                                    })}
                                </InputLabel>

                                <Select
                                    labelId="faculty-select-label"
                                    label={intl.formatMessage({
                                        id: 'generateSchedule.configuration.facultyLabel',
                                    })}
                                    value={selectedFacultyId ?? ''}
                                    onChange={(event) => {
                                        handleFacultyChange(
                                            Number(event.target.value),
                                        );
                                    }}
                                >
                                    {faculties.map((faculty) => (
                                        <MenuItem
                                            key={faculty.id}
                                            value={faculty.id}
                                        >
                                            {faculty.faculty_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                select
                                fullWidth
                                label={intl.formatMessage({
                                    id: 'generateSchedule.configuration.academicYearLabel',
                                })}
                                value={academicYear}
                                disabled={isPlannerSettingsLoading}
                                onChange={(event) => {
                                    setAcademicYear(event.target.value);
                                    invalidateValidation();
                                }}
                            >
                                {academicYearOptions.map((year) => (
                                    <MenuItem
                                        key={year}
                                        value={year}
                                    >
                                        {year}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label={intl.formatMessage({
                                    id: 'generateSchedule.configuration.semesterLabel',
                                })}
                                value={semesterType}
                                disabled={isPlannerSettingsLoading}
                                onChange={(event) => {
                                    setSemesterType(
                                        event.target.value as SemesterType,
                                    );

                                    invalidateValidation();
                                }}
                            >
                                <MenuItem value="Winter">
                                    {intl.formatMessage({
                                        id: 'generateSchedule.configuration.semester.winter',
                                    })}
                                </MenuItem>

                                <MenuItem value="Summer">
                                    {intl.formatMessage({
                                        id: 'generateSchedule.configuration.semester.summer',
                                    })}
                                </MenuItem>
                            </TextField>
                        </Stack>

                        <Stack
                            direction={{
                                xs: 'column',
                                sm: 'row',
                            }}
                            spacing={1}
                        >
                            <Button
                                variant="contained"
                                onClick={handleSavePlannerSettings}
                                disabled={
                                    !selectedFacultyId ||
                                    isPlannerSettingsLoading ||
                                    isPlannerSettingsSaving
                                }
                            >
                                {isPlannerSettingsSaving
                                    ? <CircularProgress size={20}/>
                                    : intl.formatMessage({
                                        id: 'generateSchedule.configuration.saveButton',
                                    })}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleValidate}
                                disabled={
                                    !plannerSettings ||
                                    isConfigurationDirty ||
                                    isValidating ||
                                    isPlannerSettingsSaving
                                }
                            >
                                {isValidating
                                    ? <CircularProgress size={20}/>
                                    : intl.formatMessage({
                                        id: 'generateSchedule.configuration.validateButton',
                                    })}
                            </Button>
                        </Stack>

                        {isConfigurationDirty && (
                            <Alert severity="warning">
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.unsavedWarning',
                                })}
                            </Alert>
                        )}

                        {plannerSettings &&
                            !isConfigurationDirty &&
                            !validationReport && (
                                <Alert severity="info">
                                    {intl.formatMessage({
                                        id: 'generateSchedule.configuration.savedInfo',
                                    })}
                                </Alert>
                            )}

                        {validationReport && (
                            <Alert
                                severity={
                                    validationIssuesCount === 0
                                        ? 'success'
                                        : 'warning'
                                }
                            >
                                {intl.formatMessage(
                                    {
                                        id: 'generateSchedule.configuration.validationCompleted',
                                    },
                                    {
                                        issuesCount: validationIssuesCount,
                                    },
                                )}
                            </Alert>
                        )}

                        {errorMessage && (
                            <Alert severity="error">
                                {errorMessage}
                            </Alert>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            <GenerateHero
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                isAdministrator={isAdministrator}
                faculties={faculties}
                selectedFacultyId={selectedFacultyId}
                onFacultyChange={handleFacultyChange}
                isFacultiesLoading={isFacultiesLoading}
                isGenerateBlocked={isGenerateDisabled}
            />

            {!validationReport && (
                <Alert severity="info">
                    {intl.formatMessage({
                        id: 'generateSchedule.configuration.generateBlocked',
                    })}
                </Alert>
            )}
        </Box>
    );
}