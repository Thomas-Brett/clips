"use server";

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { prisma } from './db';

type AuthResponse = {
    success: boolean;
    user?: any;
    error?: string;
};

const handleError = (error: unknown): AuthResponse => ({
    success: false,
    error: error instanceof Error ? error.message : 'An unknown error occurred'
});

export async function login(username: string, password: string): Promise<AuthResponse> {
    try {
        if (!username || !password) throw new Error('Username and password are required');

        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
        });

        if (!user || !await compare(password, user.password)) {
            throw new Error('Invalid username or password');
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60
        });

        return { success: true, user };
    } catch (error) {
        return handleError(error);
    }
}

export async function getUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        
        if (!token) return null;
        
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { id: string, username: string };
        
        const user = await prisma.user.findUnique({
            select: {
                id: true,
                username: true
            },
            where: { id: decoded.id }
        });
        
        return user;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
} 