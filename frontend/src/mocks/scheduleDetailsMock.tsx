import type {ScheduleEntryDetails} from '@api/types';

export const scheduleDetailsMock: Record<string, ScheduleEntryDetails> = {
    '1': {
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
    '2': {
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
    '3': {
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
    '4': {
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
};