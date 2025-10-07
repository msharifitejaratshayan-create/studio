// This file contains helpers for interacting with the FastAPI backend.

const API_BASE_URL = 'http://10.30.30.92:8000';

export interface User {
    id: number;
    username: string;
}

/**
 * Fetches all users from the backend.
 * @returns A promise that resolves to a list of users.
 */
export async function getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
        throw new Error(errorData.detail || 'Failed to fetch users.');
    }
    return response.json();
}

/**
 * Creates a new user.
 * @param username The username for the new user.
 * @param password The password for the new user.
 * @returns A promise that resolves to the newly created user.
 */
export async function createUser(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred during user creation.' }));
        throw new Error(errorData.detail || 'Failed to create user.');
    }

    return response.json();
}
