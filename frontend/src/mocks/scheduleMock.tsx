import type {ScheduleEntry} from '../types/schedule';

export const scheduleMock: ScheduleEntry[] = [
    {
        id: '1',
        title: 'Programowanie\nsieciowe 1',
        date: '2026-04-15',
        startHour: 10,
        endHour: 12,
        variant: 'lecture',
        details: {
            typeLabel: 'Wykład',
            timeLabel: '11:15 - 12:45',
            location: {
                campus: 'Kampus A',
                building: 'Budynek A11',
                room: 'Aula E5',
            },
            lecturer: 'dr hab. inż. Radosław Wajman',
            audience: [
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Inżynieria Oprogramowania 1',
                },
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Inżynieria Oprogramowania 2',
                },
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Inżynieria Oprogramowania 3',
                },
            ],
        },
    },
    {
        id: '2',
        title: 'Projektowanie\ninterfejsów aplikacji\nWWW',
        date: '2026-03-10',
        startHour: 8,
        endHour: 10,
        variant: 'project',
        details: {
            typeLabel: 'Projekt',
            timeLabel: '08:15 - 09:45',
            location: {
                campus: 'Kampus B',
                building: 'Budynek B2',
                room: 'Sala 204',
            },
            lecturer: 'mgr inż. Anna Kowalska',
            audience: [
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Aplikacje Internetowe',
                },
            ],
        },
    },
    {
        id: '3',
        title: 'Programowanie\nsieciowe 1',
        date: '2026-03-10',
        startHour: 11,
        endHour: 13,
        variant: 'lab',
        details: {
            typeLabel: 'Laboratorium',
            timeLabel: '11:15 - 12:45',
            location: {
                campus: 'Kampus A',
                building: 'Budynek A10',
                room: 'Sala L2',
            },
            lecturer: 'dr inż. Tomasz Zieliński',
            audience: [
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Inżynieria Oprogramowania 1',
                },
            ],
        },
    },
    {
        id: '4',
        title: 'Podstawy\nkonteneryzacji i\narchitektury\nmikroserwisów',
        date: '2026-03-11',
        startHour: 8,
        endHour: 16,
        variant: 'lab',
        details: {
            typeLabel: 'Laboratorium',
            timeLabel: '08:15 - 15:45',
            location: {
                campus: 'Kampus C',
                building: 'Budynek C1',
                room: 'Sala 18',
            },
            lecturer: 'dr inż. Michał Nowak',
            audience: [
                {
                    fieldOfStudy: 'Informatyka',
                    semester: '6 semestr',
                    specialization: 'Systemy Rozproszone',
                },
            ],
        },
    },
];