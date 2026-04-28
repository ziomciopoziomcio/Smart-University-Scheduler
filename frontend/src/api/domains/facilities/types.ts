export interface Campus {
    id: number;
    campus_name: string;
    campus_short: string;
}

export interface Building {
    id: number;
    building_name: string | null;
    building_number: string;
    campus_id: number;
    rooms_number?: number;
}

export interface Room {
    id: number;
    room_name: string;
    building_id: number;
    faculty_id: number;
    pc_amount: number;
    room_capacity: number;
    unit_id: number | null;
    projector_availability: boolean;
}

export interface Faculty {
    id: number;
    faculty_name: string;
    faculty_short: string;
    lecturers_count?: number;
}