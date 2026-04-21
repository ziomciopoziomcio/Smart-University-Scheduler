import {useAuthStore} from '@store/useAuthStore';
import {type Student, type Employee, type PaginatedResponse} from './types';

const baseApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const ACADEMICS_URL = (baseApiUrl ? `${baseApiUrl}/academics` : 'http://localhost:3000/academics').replace(/\/+$/, '');

const getHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`,
    'Content-Type': 'application/json',
});

// TODO: change error messages to be more specific and customize (intl)

export const fetchStudents = async (
    limit = 100,
    offset = 0,
    search?: string
): Promise<PaginatedResponse<Student>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (search) params.append('search', search);

    const response = await fetch(`${ACADEMICS_URL}/students?${params.toString()}`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać listy studentów');
    }

    return response.json();
};

export const fetchEmployees = async (
    limit = 100,
    offset = 0,
    search?: string
): Promise<PaginatedResponse<Employee>> => {
    const params = new URLSearchParams({limit: limit.toString(), offset: offset.toString()});
    if (search) params.append('search', search);

    const response = await fetch(`${ACADEMICS_URL}/employees?${params.toString()}`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać listy pracowników');
    }

    return response.json();
};

export const getStudent = async (id: number): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów studenta');
    return response.json();
};

export const createStudent = async (data: {
    user_id: number;
    study_program: number;
    major?: number | null
}): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się przypisać profilu studenta');
    return response.json();
};

export const updateStudent = async (id: number, data: {
    study_program?: number;
    major?: number | null
}): Promise<Student> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować profilu studenta');
    return response.json();
};

export const deleteStudent = async (id: number): Promise<void> => {
    const response = await fetch(`${ACADEMICS_URL}/students/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć profilu studenta');
};

export const getEmployee = async (id: number): Promise<Employee> => {
    const response = await fetch(`${ACADEMICS_URL}/employees/${id}`, {headers: getHeaders()});
    if (!response.ok) throw new Error('Nie udało się pobrać szczegółów pracownika');
    return response.json();
};

export const createEmployee = async (data: {
    user_id: number;
    faculty_id: number;
    unit_id: number
}): Promise<Employee> => {
    const response = await fetch(`${ACADEMICS_URL}/employees`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się przypisać profilu pracownika');
    return response.json();
};

export const updateEmployee = async (id: number, data: {
    faculty_id?: number;
    unit_id?: number | null
}): Promise<Employee> => {
    const response = await fetch(`${ACADEMICS_URL}/employees/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się zaktualizować profilu pracownika');
    return response.json();
};

export const deleteEmployee = async (id: number): Promise<void> => {
    const response = await fetch(`${ACADEMICS_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Nie udało się usunąć profilu pracownika');
};