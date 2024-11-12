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

export async function followUser(userId: string, followingId: string): Promise<UserResponse> {
    try {
        if (userId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        const existingFollow = await prisma.follows.findUnique({
            where: {
                userId_followingId: {
                    userId,
                    followingId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follows.delete({
                where: {
                    userId_followingId: {
                        userId,
                        followingId
                    }
                }
            });
            return { success: true, user: { isFollowing: false } };
        }

        // Follow
        await prisma.follows.create({
            data: {
                userId,
                followingId
            }
        });

        return { success: true, user: { isFollowing: true } };
    } catch (error) {
        return handleError(error);
    }
}

export async function isFollowingEndpoint(userId: string, followingId: string): Promise<boolean> {
    if (!userId || !followingId) return false;
    
    const follow = await prisma.follows.findUnique({
        where: {
            userId_followingId: {
                userId,
                followingId
            }
        }
    });
    
    return !!follow;
}

export async function getFollowStats(userId: string) {
    const stats = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            _count: {
                select: {
                    followers: true,
                    following: true
                }
            }
        }
    });
    
    return {
        followersCount: stats?._count.followers ?? 0,
        followingCount: stats?._count.following ?? 0
    };
}
