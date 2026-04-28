import {getHeaders, type PaginatedResponse, ACADEMICS_URL} from '@api/core';
import {type Employee} from './types.ts';


export const fetchEmployees = async (
    page = 1,
    limit = 10,
    search?: string,
    filters: {
        faculty_id?: number;
        unit_id?: number;
    } = {}
): Promise<PaginatedResponse<Employee>> => {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
    });

    if (search) params.append('search', search);
    if (filters.faculty_id) params.append('faculty_id', filters.faculty_id.toString());
    if (filters.unit_id) params.append('unit_id', filters.unit_id.toString());

    const response = await fetch(`${ACADEMICS_URL}/employees?${params.toString()}`, {
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error('Nie udało się pobrać listy pracowników');
    }

    return response.json();
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