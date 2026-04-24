import type {ScheduleEntryDetails} from '@api';

export const scheduleDetailsMock: Record<string, ScheduleEntryDetails> = {
    '1': {
        typeLabel: 'Wykład',
        timeLabel: '10:15 - 11:45',
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
                specialization: 'Inżynieria Oprogramowania',
            },
            {
                fieldOfStudy: 'Informatyka',
                semester: '6 semestr',
                specialization: 'Systemy i Sieci Komputerowe',
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
            building: 'Budynek A11',
            room: 'Sala L2',
        },
        lecturer: 'dr inż. Tomasz Zieliński',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '6 semestr',
                specialization: 'Inżynieria Oprogramowania',
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
                semester: '7 semestr',
                specialization: 'Architektura Systemów',
            },
        ],
    },
    '5': {
        typeLabel: 'Ćwiczenia',
        timeLabel: '12:15 - 13:45',
        location: {
            campus: 'Kampus A',
            building: 'Budynek A1',
            room: 'Sala 105',
        },
        lecturer: 'mgr Marta Sokołowska',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '4 semestr',
                specialization: 'Brak',
            },
            {
                fieldOfStudy: 'Data Science',
                semester: '2 semestr',
                specialization: 'Brak',
            },
        ],
    },
    '6': {
        typeLabel: 'Wykład',
        timeLabel: '09:15 - 10:45',
        location: {
            campus: 'Kampus A',
            building: 'Budynek A12',
            room: 'Aula F3',
        },
        lecturer: 'dr hab. inż. Paweł Domański',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '7 semestr',
                specialization: 'Inżynieria Oprogramowania',
            },
            {
                fieldOfStudy: 'Informatyka',
                semester: '7 semestr',
                specialization: 'Data Science',
            },
        ],
    },
    '7': {
        typeLabel: 'Laboratorium',
        timeLabel: '10:15 - 11:45',
        location: {
            campus: 'Kampus B',
            building: 'Budynek B4',
            room: 'Sala 301',
        },
        lecturer: 'dr inż. Karol Piasecki',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '7 semestr',
                specialization: 'Systemy Rozproszone',
            },
        ],
    },
    '8': {
        typeLabel: 'Seminarium',
        timeLabel: '14:15 - 15:45',
        location: {
            campus: 'Kampus A',
            building: 'Budynek A11',
            room: 'Sala seminaryjna S2',
        },
        lecturer: 'dr hab. Ewa Malinowska',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '7 semestr',
                specialization: 'Dyplomanci',
            },
        ],
    },
    '9': {
        typeLabel: 'Wykład',
        timeLabel: '08:15 - 09:45',
        location: {
            campus: 'Kampus B',
            building: 'Budynek B2',
            room: 'Aula 110',
        },
        lecturer: 'prof. dr hab. Jan Kurek',
        audience: [
            {
                fieldOfStudy: 'Informatyka',
                semester: '4 semestr',
                specialization: 'Brak',
            },
            {
                fieldOfStudy: 'Data Science',
                semester: '2 semestr',
                specialization: 'Brak',
            },
        ],
    },
    '10': {
        typeLabel: 'Projekt',
        timeLabel: '12:15 - 13:45',
        location: {
            campus: 'Kampus C',
            building: 'Budynek C1',
            room: 'Laboratorium 18',
        },
        lecturer: 'mgr inż. Natalia Król',
        audience: [
            {
                fieldOfStudy: 'Data Science',
                semester: '2 semestr',
                specialization: 'Analiza Danych',
            },
            {
                fieldOfStudy: 'Informatyka',
                semester: '7 semestr',
                specialization: 'Sztuczna Inteligencja',
            },
        ],
    },
};