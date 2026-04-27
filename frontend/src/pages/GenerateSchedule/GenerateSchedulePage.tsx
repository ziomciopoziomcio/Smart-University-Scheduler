import {useState} from 'react';
import {Box} from '@mui/material';
import {
    type ScheduleVersion,
    ScheduleVersionIssue,
    type ScheduleNotification,
    generateSchedule,
} from '@api/domains/schedules';
import {
    GenerateHero,
    NotificationsPanel,
} from '@components/Generate';

// TODO: WHEN BACKEND WILL BE CREATED, PUT IT IN API AND DELETE MOCKS
//https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/195
//// https://github.com/ziomciopoziomcio/Smart-University-Scheduler/issues/188

const mockedGeneratedScheduleResult: ScheduleVersion = {
    id: 1,
    notifications: [
        {
            issue: ScheduleVersionIssue.Warning,
            message: 'Nie udało się przypisać preferowanej sali dla przedmiotu Projektowanie systemów. Wybrano salę zastępczą B-214.',
        },
        {
            issue: ScheduleVersionIssue.Warning,
            message: 'Sale laboratoryjne są wykorzystane średnio w 82% dostępnego czasu.',
        },
        {
            issue: ScheduleVersionIssue.Critical,
            message: 'Plan został wygenerowany, ale część zajęć nie została przypisana do żadnego terminu.',
        },
    ],
};

const fetchGeneratedScheduleDetails = async (scheduleId: number): Promise<ScheduleVersion> => {
    console.log('Fetching generated schedule details for id:', scheduleId);

    return Promise.resolve(mockedGeneratedScheduleResult);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)); //todo usun

export default function GenerateSchedulePage() {
    const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setHasGeneratedSchedule(false);
        setNotifications([]);

        try {
            // TODO WHEN READY:
            // const generatedSchedule = await generateSchedule();
            const generatedSchedule = await Promise.resolve({id: mockedGeneratedScheduleResult.id});

            await sleep(3000);

            const result = await fetchGeneratedScheduleDetails(generatedSchedule.id);

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