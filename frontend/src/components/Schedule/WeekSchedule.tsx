import {useState} from 'react';
import {Box, CircularProgress, Paper} from '@mui/material';
import {
    createScheduleSession,
    type CreateScheduleSessionRequest,
    type ScheduleTileVariant,
    type WeekScheduleProps,
} from '@api';
import {formatWeekRange} from './utils/dateUtils';
import {WeekScheduleGrid} from './WeekScheduleGrid';
import {WeekScheduleHeader} from './WeekScheduleHeader';
import {useIntl} from 'react-intl';
import {ScheduleLegend} from './ScheduleLegend';
import {AddScheduleSessionPopup} from './AddScheduleSessionPopup';

const monthMessageIds = [
    'calendar.january',
    'calendar.february',
    'calendar.march',
    'calendar.april',
    'calendar.may',
    'calendar.june',
    'calendar.july',
    'calendar.august',
    'calendar.september',
    'calendar.october',
    'calendar.november',
    'calendar.december',
] as const;

export function WeekSchedule({
                                 entries,
                                 currentWeekStart,
                                 isLoading,
                                 onPrevWeek,
                                 onNextWeek,
                                 onSessionUpdated,
                             }: WeekScheduleProps) {
    const {formatMessage} = useIntl();

    const [hoveredVariant, setHoveredVariant] =
        useState<ScheduleTileVariant | null>(null);

    const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
    const [isSavingNewSession, setIsSavingNewSession] = useState(false);
    const [addSessionError, setAddSessionError] = useState<string | null>(null);

    const monthId = monthMessageIds[currentWeekStart.getMonth()];

    const currentDateLabel =
        `${formatMessage({id: monthId})} ${currentWeekStart.getFullYear()}`;

    const rangeLabel = formatWeekRange(currentWeekStart);


    const handleOpenAddPopup = () => {
        setAddSessionError(null);
        setIsAddPopupOpen(true);
    };

    const handleCloseAddPopup = () => {
        if (isSavingNewSession) {
            return;
        }

        setAddSessionError(null);
        setIsAddPopupOpen(false);
    };

    const handleCreateSession = async (
        payload: CreateScheduleSessionRequest,
    ) => {
        setIsSavingNewSession(true);
        setAddSessionError(null);

        try {
            await createScheduleSession(payload);

            setIsAddPopupOpen(false);
            await onSessionUpdated?.();
        } catch (error) {
            console.error('Failed to create schedule session:', error);

            setAddSessionError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create schedule session',
            );
        } finally {
            setIsSavingNewSession(false);
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: '100%',
                bgcolor: '#FBFCFF',
                borderRadius: 1,
                padding: 2,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <WeekScheduleHeader
                currentDateLabel={currentDateLabel}
                rangeLabel={rangeLabel}
                onPrevWeek={onPrevWeek}
                onNextWeek={onNextWeek}
                onAddSession={handleOpenAddPopup}
            />

            <Box
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 5,
                    display: {xs: 'none', lg: 'block'},
                }}
            >
                <ScheduleLegend variant={hoveredVariant}/>
            </Box>

            <Box sx={{position: 'relative'}}>
                <WeekScheduleGrid
                    entries={entries}
                    onSessionUpdated={onSessionUpdated}
                    onTileHoverChange={setHoveredVariant}
                />

                {isLoading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(255,255,255,0.35)',
                            zIndex: 30,
                        }}
                    >
                        <CircularProgress size={34}/>
                    </Box>
                )}
            </Box>

            <AddScheduleSessionPopup
                open={isAddPopupOpen}
                isSaving={isSavingNewSession}
                errorMessage={addSessionError}
                onClose={handleCloseAddPopup}
                onSave={handleCreateSession}
            />
        </Paper>
    );
}