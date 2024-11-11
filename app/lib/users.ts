"use server";

import { prisma } from './db';
import { hash } from 'bcrypt';

type UserResponse = {
    success: boolean;
    user?: any;
    error?: string;
};

const validateCredentials = (username: string, password: string) => {
    if (!username || !password) throw new Error('Username and password are required');
    if (username.length < 3) throw new Error('Username must be at least 3 characters long');
    //if (password.length < 8) throw new Error('Password must be at least 8 characters long');
};

const handleError = (error: unknown): UserResponse => ({
    success: false,
    error: error instanceof Error ? error.message : 'An unknown error occurred'
});

export async function createUser(username: string, password: string): Promise<UserResponse> {
    try {
        validateCredentials(username, password);

        const existingUser = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
        });

        if (existingUser) throw new Error('Username already taken');

        const hashedPassword = await hash(password, 13);
        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                password: hashedPassword,
            },
        });

        return { success: true, user };
    } catch (error) {
        return handleError(error);
    }
}

export async function getUserByUsername(username: string) {
    if (!username) throw new Error('Username is required');
    
    return prisma.user.findUnique({
        where: { username: username.toLowerCase() }
    });
}
