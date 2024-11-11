"use server";
import { prisma } from './db';

export async function getRecentClips(limit: number = 100) {
    try {
        const clips = await prisma.clips.findMany({
            take: limit,
            orderBy: {
                uploadedAt: 'desc'
            },
            select: {
                id: true,
                userId: true,
                title: true,
                length: true,
                uploadedAt: true
            }
        });

        const userIds = [...new Set(clips.map(clip => clip.userId))];
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                id: true,
                username: true
            }
        });

        const userMap = new Map(users.map(user => [user.id, user.username]));

        return clips.map(clip => ({
            upload_id: clip.id,
            upload_name: clip.title,
            username: userMap.get(clip.userId) || 'Unknown User',
            length: formatDuration(clip.length),
            date_uploaded: clip.uploadedAt.getTime()
        }));
    } catch (error) {
        console.error('Error fetching recent clips:', error);
        throw error;
    }
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export async function getClip(clip_id: string) {
    try {
        const clip = await prisma.clips.findUnique({
            where: {
                id: clip_id
            },
            select: {
                id: true,
                userId: true,
                title: true,
                length: true,
                uploadedAt: true
            }
        });

        if (!clip) {
            throw new Error('Clip not found');
        }

        const user = await prisma.user.findUnique({
            where: {
                id: clip.userId
            },
            select: {
                id: true,
                username: true
            }
        });

        return {
            upload_id: clip.id,
            upload_name: clip.title,
            username: user?.username || 'Unknown User',
            length: formatDuration(clip.length),
            date_uploaded: clip.uploadedAt.getTime()
        };
    } catch (error) {
        console.error('Error fetching clip:', error);
        throw error;
    }
}
    
