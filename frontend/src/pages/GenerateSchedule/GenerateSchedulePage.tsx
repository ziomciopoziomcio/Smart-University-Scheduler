import {useMemo, useState, type ReactNode, type ElementType} from 'react';
import {useIntl} from 'react-intl';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
    TextField,
    type SelectChangeEvent,
} from '@mui/material';
import {
    AccessTimeOutlined,
    AutoAwesomeOutlined,
    CheckCircleOutline,
    ErrorOutline,
    GroupsOutlined,
    PreviewOutlined,
    SaveOutlined,
    SchoolOutlined,
    WarningAmberOutlined,
} from '@mui/icons-material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {theme} from "../../theme/theme.ts";

type DashboardTileType = 'success' | 'warning' | 'error' | 'info';

interface ScheduleVersion {
    id: string;
    name: string;
    createdAt: string;
    status: 'draft' | 'ready' | 'withWarnings';
    coverage: number;
    summary: {
        lecturers: number;
        groups: number;
        rooms: number;
        conflicts: number;
    };
    tiles: DashboardTile[];
}

interface DashboardTile {
    id: string;
    type: DashboardTileType;
    title: string;
    description: string;
    value?: string;
}

const scheduleVersions: ScheduleVersion[] = [
    {
        id: 'v3',
        name: 'Wersja 3 — rekomendowana',
        createdAt: '26.04.2026, 12:40',
        status: 'ready',
        coverage: 96,
        summary: {
            lecturers: 128,
            groups: 54,
            rooms: 37,
            conflicts: 3,
        },
        tiles: [
            {
                id: 'v3-1',
                type: 'success',
                title: 'Plan prawie kompletny',
                description: 'Udało się poprawnie przydzielić większość zajęć, sal i prowadzących.',
                value: '96%',
            },
            {
                id: 'v3-2',
                type: 'warning',
                title: 'Brak preferowanej sali',
                description: 'Dla przedmiotu Projektowanie systemów wybrano salę zastępczą B-214.',
                value: '1',
            },
            {
                id: 'v3-3',
                type: 'error',
                title: 'Nie wygenerowano planu dla prowadzącego',
                description: 'dr Anna Kowalska ma konflikt dostępności w poniedziałek 10:00–12:00.',
                value: '1',
            },
            {
                id: 'v3-4',
                type: 'info',
                title: 'Największe obciążenie sal',
                description: 'Sale laboratoryjne są wykorzystane średnio w 82% dostępnego czasu.',
                value: '82%',
            },
        ],
    },
    {
        id: 'v2',
        name: 'Wersja 2 — mniej konfliktów sal',
        createdAt: '26.04.2026, 11:15',
        status: 'withWarnings',
        coverage: 89,
        summary: {
            lecturers: 121,
            groups: 51,
            rooms: 34,
            conflicts: 8,
        },
        tiles: [
            {
                id: 'v2-1',
                type: 'warning',
                title: 'Kilka grup bez pełnego planu',
                description: 'Grupy INF-3A i INF-3B mają nieprzydzielone ćwiczenia z baz danych.',
                value: '2',
            },
            {
                id: 'v2-2',
                type: 'success',
                title: 'Brak konfliktów sal laboratoryjnych',
                description: 'Wszystkie laboratoria zostały przypisane bez nakładających się terminów.',
                value: '0',
            },
            {
                id: 'v2-3',
                type: 'error',
                title: 'Konflikt prowadzącego',
                description: 'prof. Jan Nowak jest przypisany do dwóch zajęć w środę 08:00–10:00.',
                value: '1',
            },
            {
                id: 'v2-4',
                type: 'info',
                title: 'Rozłożenie zajęć',
                description: 'Najwięcej zajęć zostało zaplanowanych we wtorki i czwartki.',
                value: '2 dni',
            },
        ],
    },
    {
        id: 'v1',
        name: 'Wersja 1 — szybki szkic',
        createdAt: '25.04.2026, 18:05',
        status: 'draft',
        coverage: 72,
        summary: {
            lecturers: 98,
            groups: 44,
            rooms: 28,
            conflicts: 18,
        },
        tiles: [
            {
                id: 'v1-1',
                type: 'error',
                title: 'Nie udało się wygenerować planu dla kilku prowadzących',
                description: 'Najwięcej problemów dotyczy dostępności prowadzących z jednostki Informatyka.',
                value: '7',
            },
            {
                id: 'v1-2',
                type: 'warning',
                title: 'Braki w salach',
                description: 'Część zajęć laboratoryjnych nie ma jeszcze przypisanej sali.',
                value: '11',
            },
            {
                id: 'v1-3',
                type: 'info',
                title: 'Wersja robocza',
                description: 'Ta wersja nadaje się do analizy problemów, ale nie do zapisania jako finalny plan.',
                value: 'draft',
            },
            {
                id: 'v1-4',
                type: 'success',
                title: 'Sekcje bez konfliktów',
                description: 'Plan dla pierwszego roku studiów dziennych został wygenerowany poprawnie.',
                value: '1 rok',
            },
        ],
    },
];

const tileStyles: Record<DashboardTileType, {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    Icon: ElementType
}> = {
    success: {
        bg: '#F6FCF8',
        border: '#DCEFE3',
        iconBg: '#E7F7EC',
        iconColor: '#3B8F59',
        Icon: CheckCircleOutline,
    },
    warning: {
        bg: '#FFFBF2',
        border: '#F3E3BC',
        iconBg: '#FFF1CF',
        iconColor: '#A87316',
        Icon: WarningAmberOutlined,
    },
    error: {
        bg: '#FFF7F7',
        border: '#F0D0D0',
        iconBg: '#FFE8E8',
        iconColor: '#B14A4A',
        Icon: ErrorOutline,
    },
    info: {
        bg: '#F6F9FF',
        border: '#DCE5F5',
        iconBg: '#EAF1FF',
        iconColor: '#55739E',
        Icon: AccessTimeOutlined,
    },
};

interface GenerateHeroProps {
    versionName: string;
    onVersionNameChange: (value: string) => void;
}

function GenerateHero({versionName, onVersionNameChange}: GenerateHeroProps) {
    const intl = useIntl();

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 3.5, md: 5},
                minHeight: {xs: 280, md: 250},
                borderRadius: '24px',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 14px 34px rgba(20, 30, 55, 0.07)',
                display: 'flex',
                alignItems: {xs: 'stretch', md: 'center'},
                justifyContent: 'space-between',
                gap: {xs: 3.5, md: 5},
                flexDirection: {xs: 'column', md: 'row'},
            }}
        >
            <Box sx={{display: 'flex', alignItems: 'center', gap: {xs: 6, md: 8}, flex: 1}}>
                <CalendarTodayIcon
                    sx={{
                        fontSize: {xs: 70, md: 92},
                        color: '#A8ADB7',
                        flexShrink: 0,
                    }}
                />

                <Box sx={{textAlign: 'left', width: '100%', maxWidth: 720}}>
                    <Typography
                        sx={{
                            fontSize: {xs: 30, md: 40},
                            fontWeight: 700,
                            color: '#4F4F4F',
                            lineHeight: 1.1,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.title'})}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 1.4,
                            fontSize: {xs: 15, md: 16.5},
                            color: '#7A7A7A',
                            maxWidth: 700,
                            lineHeight: 1.6,
                            textAlign: 'left',
                        }}
                    >
                        {intl.formatMessage({id: 'generateSchedule.hero.description'})}
                    </Typography>

                    <TextField
                        fullWidth
                        value={versionName}
                        onChange={(event) => onVersionNameChange(event.target.value)}
                        label={intl.formatMessage({id: 'generateSchedule.hero.versionNameLabel'})}
                        placeholder={intl.formatMessage({id: 'generateSchedule.hero.versionNamePlaceholder'})}
                        sx={{
                            mt: 3,
                            maxWidth: 430,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                bgcolor: '#FBFCFF',
                                fontSize: 15,
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
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#7A89A8',
                            },
                        }}
                    />
                </Box>
            </Box>

            <Button
                size="large"
                variant="contained"
                startIcon={<AutoAwesomeOutlined/>}
                onClick={() => undefined}
                sx={{
                    px: {xs: 4, md: 6},
                    py: {xs: 1.9, md: 2.25},
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontSize: {xs: 17, md: 19},
                    minWidth: {xs: '100%', md: 280},
                    minHeight: 76,
                    background: theme.palette.gradients.brand,
                    color: '#FFFFFF',
                    boxShadow: '0 16px 30px rgba(79, 94, 130, 0.30)',
                    '&:hover': {
                        background: theme.palette.gradients.brand,
                        filter: 'brightness(0.96)',
                        boxShadow: '0 18px 34px rgba(79, 94, 130, 0.36)',
                    },
                }}
            >
                {intl.formatMessage({id: 'generateSchedule.hero.button'})}
            </Button>
        </Paper>
    );
}

interface VersionPanelProps {
    selectedVersion: ScheduleVersion;
    onVersionChange: (versionId: string) => void;
}

function VersionPanel({selectedVersion, onVersionChange}: VersionPanelProps) {
    const statusLabel = {
        draft: 'Robocza',
        ready: 'Gotowa',
        withWarnings: 'Z ostrzeżeniami',
    }[selectedVersion.status];

    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 2, md: 2.5},
                borderRadius: '18px',
                bgcolor: 'white',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2}}>
                <Box>
                    <Typography sx={{fontSize: 18, fontWeight: 700, color: '#111111'}}>
                        Wersje planu
                    </Typography>
                    <Typography sx={{mt: 0.4, fontSize: 14, color: '#8A8A8A'}}>
                        Wybierz wersję, aby zobaczyć jej dashboard i statystyki.
                    </Typography>
                </Box>
                <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                        bgcolor: selectedVersion.status === 'ready' ? '#E7F7EC' : selectedVersion.status === 'draft' ? '#F1F3F6' : '#FFF1CF',
                        color: selectedVersion.status === 'ready' ? '#3B8F59' : selectedVersion.status === 'draft' ? '#666666' : '#A87316',
                        fontWeight: 700,
                        borderRadius: '10px',
                    }}
                />
            </Box>

            <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr auto'}, gap: 2, alignItems: 'center'}}>
                <FormControl fullWidth>
                    <Select
                        value={selectedVersion.id}
                        onChange={(event: SelectChangeEvent) => onVersionChange(event.target.value)}
                        displayEmpty
                        sx={{
                            height: 53,
                            borderRadius: '16px',
                            bgcolor: '#FBFCFF',
                            '& .MuiOutlinedInput-notchedOutline': {borderColor: 'rgba(0,0,0,0.08)'},
                            '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: 'rgba(0,0,0,0.16)'},
                        }}
                    >
                        {scheduleVersions.map((version) => (
                            <MenuItem key={version.id} value={version.id}>
                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                    <Typography sx={{fontWeight: 600, fontSize: 15}}>{version.name}</Typography>
                                    <Typography sx={{
                                        fontSize: 12.5,
                                        color: '#8A8A8A'
                                    }}>Utworzono: {version.createdAt}</Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.25}>
                    <Button
                        variant="outlined"
                        startIcon={<PreviewOutlined/>}
                        onClick={() => undefined}
                        sx={{
                            height: 53,
                            px: 2.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            color: '#555555',
                            borderColor: 'rgba(0,0,0,0.12)',
                            fontWeight: 600,
                            '&:hover': {borderColor: 'rgba(0,0,0,0.25)', bgcolor: '#F8F9FB'},
                        }}
                    >
                        Podgląd
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveOutlined/>}
                        onClick={() => undefined}
                        sx={{
                            height: 53,
                            px: 2.5,
                            borderRadius: '16px',
                            textTransform: 'none',
                            bgcolor: '#111111',
                            fontWeight: 700,
                            boxShadow: 'none',
                            '&:hover': {bgcolor: '#2A2A2A', boxShadow: 'none'},
                        }}
                    >
                        Zapisz
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}

function SummaryCard({icon, label, value}: { icon: ReactNode; label: string; value: string | number }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.05)',
                bgcolor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}
        >
            <Box sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                bgcolor: '#F3F5F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#777777'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{fontSize: 22, fontWeight: 800, color: '#111111', lineHeight: 1}}>{value}</Typography>
                <Typography sx={{fontSize: 13, color: '#8A8A8A', mt: 0.5}}>{label}</Typography>
            </Box>
        </Paper>
    );
}

function DashboardTileCard({tile}: { tile: DashboardTile }) {
    const style = tileStyles[tile.type];
    const Icon = style.Icon;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.2,
                minHeight: 168,
                borderRadius: '18px',
                border: `1px solid ${style.border}`,
                bgcolor: style.bg,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 26px rgba(0,0,0,0.06)',
                },
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 2}}>
                <Box sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    bgcolor: style.iconBg,
                    color: style.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon fontSize="small"/>
                </Box>
                {tile.value && (
                    <Typography sx={{fontSize: 22, fontWeight: 800, color: style.iconColor, lineHeight: 1}}>
                        {tile.value}
                    </Typography>
                )}
            </Box>

            <Box sx={{mt: 2}}>
                <Typography sx={{fontSize: 16, fontWeight: 800, color: '#111111', lineHeight: 1.25}}>
                    {tile.title}
                </Typography>
                <Typography sx={{mt: 1, fontSize: 14, color: '#6F6F6F', lineHeight: 1.45}}>
                    {tile.description}
                </Typography>
            </Box>
        </Paper>
    );
}

function VersionDashboard({version}: { version: ScheduleVersion }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: {xs: 2, md: 2.5},
                borderRadius: '20px',
                bgcolor: '#FBFCFF',
                border: '1px solid rgba(0,0,0,0.04)',
                minHeight: 420,
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5}}>
                <Box>
                    <Typography sx={{fontSize: 20, fontWeight: 800, color: '#111111'}}>
                        Dashboard wersji
                    </Typography>
                    <Typography sx={{mt: 0.5, fontSize: 14, color: '#8A8A8A'}}>
                        Aktualne statystyki i problemy dla: {version.name}
                    </Typography>
                </Box>
                <Box sx={{minWidth: {xs: '100%', sm: 220}}}>
                    <Typography sx={{fontSize: 13, color: '#8A8A8A', mb: 0.75}}>Pokrycie planu</Typography>
                    <LinearProgress
                        variant="determinate"
                        value={version.coverage}
                        sx={{
                            height: 10,
                            borderRadius: '999px',
                            bgcolor: '#EDEFF3',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: '999px',
                                bgcolor: version.coverage > 90 ? '#3B8F59' : version.coverage > 80 ? '#A87316' : '#B14A4A',
                            },
                        }}
                    />
                    <Typography sx={{fontSize: 13, fontWeight: 700, color: '#555555', mt: 0.75, textAlign: 'right'}}>
                        {version.coverage}%
                    </Typography>
                </Box>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)'},
                gap: 2,
                mb: 2.5
            }}>
                <SummaryCard icon={<SchoolOutlined/>} label="Prowadzący" value={version.summary.lecturers}/>
                <SummaryCard icon={<GroupsOutlined/>} label="Grupy" value={version.summary.groups}/>
                <SummaryCard icon={<CheckCircleOutline/>} label="Sale" value={version.summary.rooms}/>
                <SummaryCard icon={<ErrorOutline/>} label="Konflikty" value={version.summary.conflicts}/>
            </Box>

            <Divider sx={{my: 2.5}}/>

            {version.summary.conflicts > 10 && (
                <Alert severity="warning" sx={{mb: 2.5, borderRadius: '14px'}}>
                    Ta wersja ma dużo konfliktów. Potraktuj ją jako roboczą bazę do dalszego generowania.
                </Alert>
            )}

            <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: 'repeat(2, 1fr)'}, gap: 2}}>
                {version.tiles.map((tile) => (
                    <DashboardTileCard key={tile.id} tile={tile}/>
                ))}
            </Box>
        </Paper>
    );
}

export default function GenerateSchedulePage() {
    const intl = useIntl();

    // TODO: MOCK LISTY WERSJI Z BACKENDU
    const versionsFromBackend = scheduleVersions;

    const defaultNewVersionName = intl.formatMessage(
        {id: 'generateSchedule.hero.defaultVersionName'},
        {number: versionsFromBackend.length + 1}
    );

    const [selectedVersionId, setSelectedVersionId] = useState(scheduleVersions[0].id);
    const [newVersionName, setNewVersionName] = useState(defaultNewVersionName);

    const selectedVersion = useMemo(
        () => scheduleVersions.find((version) => version.id === selectedVersionId) ?? scheduleVersions[0],
        [selectedVersionId]
    );

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <GenerateHero
                versionName={newVersionName}
                onVersionNameChange={setNewVersionName}
            />

            <VersionPanel
                selectedVersion={selectedVersion}
                onVersionChange={setSelectedVersionId}
            />

            <VersionDashboard version={selectedVersion}/>
        </Box>
    );
}