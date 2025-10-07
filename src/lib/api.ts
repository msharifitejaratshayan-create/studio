// This file contains helpers for interacting with the FastAPI backend.

const API_BASE_URL = 'http://10.30.30.92:8000';
const API_CLIENT_ID = 'admin';
const API_CLIENT_SECRET = 'kX3ZyTAUNl4Cvkj8mftnYVozg7VOn8tMH9nV0pqJ';

export interface User {
    id: number;
    username: string;
}

/**
 * Fetches all users from the backend. Requires admin credentials.
 * @returns A promise that resolves to a list of users.
 */
export async function getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
            'client-id': API_CLIENT_ID,
            'client-secret': API_CLIENT_SECRET,
        }
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
        throw new Error(errorData.detail || 'Failed to fetch users.');
    }
    return response.json();
}

/**
 * Creates a new user. Requires admin credentials.
 * @param username The username for the new user.
 * @param password The password for the new user.
 * @returns A promise that resolves to the newly created user.
 */
export async function createUser(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'client-id': API_CLIENT_ID,
            'client-secret': API_CLIENT_SECRET,
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred during user creation.' }));
        throw new Error(errorData.detail || 'Failed to create user.');
    }

    return response.json();
}

/**
 * Deletes a user by their ID. Requires admin credentials.
 * @param userId The ID of the user to delete.
 * @returns A promise that resolves to a success message.
 */
export async function deleteUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'client-id': API_CLIENT_ID,
            'client-secret': API_CLIENT_SECRET,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred during user deletion.' }));
        throw new Error(errorData.detail || 'Failed to delete user.');
    }

    return response.json();
}


/**
 * Logs in a user and retrieves an access token.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves to an object containing the access token.
 */
export async function loginUser(username: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed due to a network or server error.' }));
        throw new Error(errorData.detail || 'Incorrect username or password.');
    }

    return response.json();
}
