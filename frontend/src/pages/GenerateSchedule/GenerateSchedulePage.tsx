import {useEffect, useMemo, useState} from 'react';
import {Box} from '@mui/material';

import {
    type Faculty,
    type ScheduleVersion,
    ScheduleVersionIssue,
    type ScheduleNotification,
    generateSchedule,
    fetchFaculties,
} from '@api';

import {
    GenerateHero,
    NotificationsPanel,
} from '@components/Generate';

import {useAuthStore} from '@store/useAuthStore';

// TODO: WHEN BACKEND WILL BE CREATED, PUT IT IN API AND DELETE MOCKS
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

// TODO: WHEN BACKEND WILL ADD GET GENERATED SCHEDULE DETAILS, REPLACE THIS MOCK
const fetchGeneratedScheduleDetails = async (scheduleId: number): Promise<ScheduleVersion> => {
    console.log('Fetching generated schedule details for id:', scheduleId);

    return Promise.resolve(mockedGeneratedScheduleResult);
};

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

export default function GenerateSchedulePage() {
    const user = useAuthStore((state) => state.user);

    const [notifications, setNotifications] = useState<ScheduleNotification[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);

    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
    const [isFacultiesLoading, setIsFacultiesLoading] = useState(false);

    const isAdministrator = useMemo(() => {
        return isAdministratorRole(user?.roles);
    }, [user?.roles]);

    useEffect(() => {
        if (!isAdministrator) {
            setFaculties([]);
            setSelectedFacultyId(null);
            return;
        }

        let cancelled = false;

        const loadFaculties = async () => {
            setIsFacultiesLoading(true);

            try {
                const response = await fetchFaculties();

                const loadedFaculties = Array.isArray(response)
                    ? response
                    : response.items;

                if (!cancelled) {
                    setFaculties(loadedFaculties);
                    setSelectedFacultyId(loadedFaculties[0]?.id ?? null);
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
    }, [isAdministrator]);

    const handleGenerate = async () => {
        if (isAdministrator && !selectedFacultyId) {
            return;
        }

        setIsGenerating(true);
        setHasGeneratedSchedule(false);
        setNotifications([]);

        try {
            const generatedSchedule = await generateSchedule({
                faculty_id: isAdministrator ? selectedFacultyId ?? undefined : undefined,
            });


            // TODO: WHEN BACKEND WILL ADD GET DETAILS ENDPOINT, USE REAL API HERE
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
                isAdministrator={isAdministrator}
                faculties={faculties}
                selectedFacultyId={selectedFacultyId}
                onFacultyChange={setSelectedFacultyId}
                isFacultiesLoading={isFacultiesLoading}
            />

            <NotificationsPanel
                notifications={notifications}
                isLoading={isGenerating}
                hasGeneratedSchedule={hasGeneratedSchedule}
            />
        </Box>
    );
}