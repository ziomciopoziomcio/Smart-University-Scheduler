import {useState} from 'react';
import {Box} from '@mui/material';

import {
    GenerateHero,
    NotificationsPanel,
    ScheduleVersionIssue,
    type GenerateScheduleResponse,
    type ScheduleNotification,
} from '@components/Generate';

//TODO: WHEN BACKEND WILL BE CREATED, PUT IT IN API AND DELETE MOCKS
//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/188
const mockedGeneratedScheduleResult: GenerateScheduleResponse = {
    id: 1,
    notifications: [
        {
            type: ScheduleVersionIssue.Warning,
            message: 'Nie udało się przypisać preferowanej sali dla przedmiotu Projektowanie systemów. Wybrano salę zastępczą B-214.',
        },
        {
            type: ScheduleVersionIssue.Warning,
            message: 'Sale laboratoryjne są wykorzystane średnio w 82% dostępnego czasu.',
        },
        {
            type: ScheduleVersionIssue.Critical,
            message: 'Plan został wygenerowany, ale część zajęć nie została przypisana do żadnego terminu.',
        },
    ],
};


const fetchGeneratedSchedule = async (): Promise<GenerateScheduleResponse> => {
    return Promise.resolve(mockedGeneratedScheduleResult);
};

export default function GenerateSchedulePage() {
    const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            const result = await fetchGeneratedSchedule();

            setNotifications(result.notifications);
            setHasGeneratedSchedule(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <GenerateHero
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
            />

            <NotificationsPanel
                notifications={notifications}
                isLoading={isGenerating}
                hasGeneratedSchedule={hasGeneratedSchedule}
            />
        </Box>
    );
}