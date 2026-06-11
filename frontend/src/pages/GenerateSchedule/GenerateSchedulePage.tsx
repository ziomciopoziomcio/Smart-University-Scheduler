import {useEffect, useMemo, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    CheckCircleOutlineRounded,
    ErrorOutlineRounded,
    FactCheckOutlined,
    InfoOutlined,
    SaveOutlined,
    SettingsSuggestOutlined,
    WarningAmberRounded,
} from '@mui/icons-material';
import {useIntl} from 'react-intl';

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
import {GenerateHero} from '@components/Generate';
import {useAuthStore} from '@store/useAuthStore';
import {theme} from '../../theme/theme.ts';

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
        ? 'Winter'
        : 'Summer';
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
    const [semesterType, setSemesterType] = useState(getCurrentSemesterType());

    const [plannerSettings, setPlannerSettings] =
        useState<PlannerSettings | null>(null);

    const [validationReport, setValidationReport] =
        useState<ValidationReport | null>(null);
    const [validatedFacultyId, setValidatedFacultyId] =
        useState<number | null>(null);

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
    }, [intl]);

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
            setValidatedFacultyId(null);

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
    }, [intl, selectedFacultyId]);

    const invalidateValidation = () => {
        setValidationReport(null);
        setValidatedFacultyId(null);
        setIsConfigurationDirty(true);
    };

    const handleFacultyChange = (facultyId: number) => {
        setSelectedFacultyId(facultyId);
        setValidationReport(null);
        setValidatedFacultyId(null);
    };
    const handleSavePlannerSettings = async () => {
        if (!selectedFacultyId) {
            return;
        }

        setIsPlannerSettingsSaving(true);
        setValidationReport(null);
        setValidatedFacultyId(null);
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
            setValidatedFacultyId(selectedFacultyId);
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
            validatedFacultyId !== selectedFacultyId ||
            isConfigurationDirty
        ) {
            return;
        }

        setIsGenerating(true);
        setErrorMessage(null);

        try {
            await generateSchedule({
                faculty_id: selectedFacultyId,
            });
            // TODO: Add generation progress / success notification.
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
        !selectedFacultyId ||
        !plannerSettings ||
        !validationReport ||
        validatedFacultyId !== selectedFacultyId ||
        isConfigurationDirty ||
        isGenerating ||
        isPlannerSettingsLoading ||
        isPlannerSettingsSaving ||
        isValidating;

    const status = (() => {
        if (errorMessage) {
            return {
                icon: <ErrorOutlineRounded/>,
                background: '#FFF5F5',
                border: 'rgba(205, 74, 74, 0.18)',
                color: '#B64747',
                message: errorMessage,
            };
        }

        if (isConfigurationDirty) {
            return {
                icon: <WarningAmberRounded/>,
                background: '#FFF9EE',
                border: 'rgba(201, 145, 42, 0.20)',
                color: '#9A6A19',
                message: intl.formatMessage({
                    id: 'generateSchedule.configuration.unsavedWarning',
                }),
            };
        }

        if (validationReport) {
            const hasIssues = validationIssuesCount > 0;

            return {
                icon: hasIssues
                    ? <WarningAmberRounded/>
                    : <CheckCircleOutlineRounded/>,
                background: hasIssues ? '#FFF9EE' : '#F2FBF5',
                border: hasIssues
                    ? 'rgba(201, 145, 42, 0.20)'
                    : 'rgba(52, 145, 88, 0.20)',
                color: hasIssues ? '#9A6A19' : '#2D7C4B',
                message: intl.formatMessage(
                    {
                        id: 'generateSchedule.configuration.validationCompleted',
                    },
                    {
                        issuesCount: validationIssuesCount,
                    },
                ),
            };
        }

        return {
            icon: <InfoOutlined/>,
            background: '#F5F7FC',
            border: 'rgba(79, 94, 130, 0.14)',
            color: '#5E6C8B',
            message: intl.formatMessage({
                id: 'generateSchedule.configuration.savedInfo',
            }),
        };
    })();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                width: '100%',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: {xs: 3, md: 4.5},
                    borderRadius: '24px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 14px 34px rgba(20, 30, 55, 0.07)',
                }}
            >
                <Stack spacing={{xs: 3, md: 3.5}}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: {xs: 2, md: 2.5},
                        }}
                    >
                        <Box sx={{minWidth: 0, textAlign: 'left'}}>
                            <Typography
                                sx={{
                                    fontSize: {xs: 24, md: 30},
                                    fontWeight: 700,
                                    color: '#4F4F4F',
                                    lineHeight: 1.15,
                                }}
                            >
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.title',
                                })}
                            </Typography>

                            <Typography
                                sx={{
                                    mt: 0.8,
                                    fontSize: {xs: 14, md: 15.5},
                                    color: '#7A7A7A',
                                    maxWidth: 840,
                                    lineHeight: 1.6,
                                }}
                            >
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.description',
                                })}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack
                        direction={{xs: 'column', md: 'row'}}
                        spacing={2}
                    >
                        <FormControl
                            fullWidth
                            size="small"
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
                                sx={selectSx}
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
                            size="small"
                            label={intl.formatMessage({
                                id: 'generateSchedule.configuration.academicYearLabel',
                            })}
                            value={academicYear}
                            disabled={isPlannerSettingsLoading}
                            onChange={(event) => {
                                setAcademicYear(event.target.value);
                                invalidateValidation();
                            }}
                            sx={textFieldSx}
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
                            size="small"
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
                            sx={textFieldSx}
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

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: {xs: 'column', sm: 'row'},
                            alignItems: {xs: 'stretch', sm: 'center'},
                            gap: 2,
                        }}
                    >
                        <Stack
                            direction={{xs: 'column', sm: 'row'}}
                            spacing={1.25}
                        >
                            <Button
                                variant="contained"
                                startIcon={
                                    isPlannerSettingsSaving
                                        ? <CircularProgress size={18} color="inherit"/>
                                        : <SaveOutlined/>
                                }
                                onClick={() => void handleSavePlannerSettings()}
                                disabled={
                                    !selectedFacultyId ||
                                    isPlannerSettingsLoading ||
                                    isPlannerSettingsSaving
                                }
                                sx={{
                                    px: 2.8,
                                    py: 1.25,
                                    minHeight: 48,
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    background: theme.palette.gradients.brand,
                                    boxShadow: '0 10px 20px rgba(79, 94, 130, 0.22)',
                                    '&:hover': {
                                        background: theme.palette.gradients.brand,
                                        filter: 'brightness(0.96)',
                                        boxShadow: '0 12px 24px rgba(79, 94, 130, 0.28)',
                                    },
                                }}
                            >
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.saveButton',
                                })}
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={
                                    isValidating
                                        ? <CircularProgress size={18} color="inherit"/>
                                        : <FactCheckOutlined/>
                                }
                                onClick={() => void handleValidate()}
                                disabled={
                                    !plannerSettings ||
                                    isConfigurationDirty ||
                                    isValidating ||
                                    isPlannerSettingsSaving
                                }
                                sx={{
                                    px: 2.8,
                                    py: 1.25,
                                    minHeight: 48,
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#657493',
                                    borderColor: 'rgba(101, 116, 147, 0.28)',
                                    '&:hover': {
                                        borderColor: 'rgba(101, 116, 147, 0.50)',
                                        background: '#F8F9FC',
                                    },
                                }}
                            >
                                {intl.formatMessage({
                                    id: 'generateSchedule.configuration.validateButton',
                                })}
                            </Button>
                        </Stack>

                        {(isFacultiesLoading || isPlannerSettingsLoading) && (
                            <CircularProgress size={24} sx={{color: '#7A89A8'}}/>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            px: 2,
                            py: 1.55,
                            borderRadius: '16px',
                            background: status.background,
                            border: `1px solid ${status.border}`,
                            color: status.color,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                '& svg': {
                                    fontSize: 22,
                                },
                            }}
                        >
                            {status.icon}
                        </Box>

                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                lineHeight: 1.5,
                            }}
                        >
                            {status.message}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

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
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.1,
                        px: 2,
                        py: 1.5,
                        borderRadius: '16px',
                        color: '#5E6C8B',
                        background: '#F5F7FC',
                        border: '1px solid rgba(79, 94, 130, 0.12)',
                    }}
                >
                    <InfoOutlined sx={{fontSize: 21, flexShrink: 0}}/>

                    <Typography sx={{fontSize: 14, fontWeight: 600}}>
                        {intl.formatMessage({
                            id: 'generateSchedule.configuration.generateBlocked',
                        })}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

const selectSx = {
    height: 48,
    borderRadius: '16px',
    bgcolor: '#FBFCFF',
    fontSize: 14,
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(0,0,0,0.08)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(0,0,0,0.16)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#7A89A8',
    },
};

const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        height: 48,
        borderRadius: '16px',
        bgcolor: '#FBFCFF',
        fontSize: 14,
        '& fieldset': {
            borderColor: 'rgba(0,0,0,0.08)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(0,0,0,0.16)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#7A89A8',
        },
    },
};