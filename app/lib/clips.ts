"use server";
import { prisma } from './db';
import { Clip } from '../types';
import { UserSearchResult, SearchResults } from '../types';

export async function getRecentClips(limit: number = 100, userId?: string | null): Promise<Clip[]> {
    try {
        let whereClause = {};
        
        if (userId === undefined) {
            const following = await prisma.follows.findMany({
                where: {
                    userId: userId
                },
                select: {
                    followingId: true
                }
            });
            
            whereClause = {
                userId: {
                    in: following.map(f => f.followingId)
                }
            };
        } else if (userId !== null) {
            whereClause = {
                userId: userId
            };
        }

        const clips = await prisma.clips.findMany({
            where: whereClause,
            take: limit,
            orderBy: {
                uploadedAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        return clips.map(clip => ({
            upload_id: clip.id,
            upload_name: clip.title,
            username: clip.user?.username || 'Unknown User',
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

export async function getClip(clip_id: string): Promise<Clip> {
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
                uploadedAt: true,
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        if (!clip) {
            throw new Error('Clip not found');
        }

        return {
            upload_id: clip.id,
            upload_name: clip.title,
            username: clip.user?.username || 'Unknown User',
            length: formatDuration(clip.length),
            date_uploaded: clip.uploadedAt.getTime()
        };
    } catch (error) {
        console.error('Error fetching clip:', error);
        throw error;
    }
}
    
export async function searchClips(query: string): Promise<SearchResults> {
    try {
        const usernameMatch = query.match(/@(\w+)/);
        const categoryMatch = query.match(/@\([^)]+\)/);
        
        let titleQuery = query
            .replace(/@\w+/g, '')
            .replace(/@\([^)]+\)/g, '')
            .trim();

        let userResult: UserSearchResult | undefined;
        
        if (usernameMatch) {
            const username = usernameMatch[1];
            const user = await prisma.user.findFirst({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    _count: {
                        select: { clips: true }
                    }
                }
            });
            
            if (user) {
                userResult = {
                    id: user.id,
                    username: user.username,
                    clipCount: user._count.clips
                };
            }
        }

        const clips = await prisma.clips.findMany({
            where: {
                AND: [
                    titleQuery ? {
                        title: {
                            contains: titleQuery,
                        }
                    } : {},
                    usernameMatch ? {
                        user: {
                            username: {
                                equals: usernameMatch[1],
                            }
                        }
                    } : {},
                    categoryMatch ? {
                        categories: {
                            some: {
                                name: {
                                    equals: categoryMatch[1],
                                }
                            }
                        }
                    } : {}
                ]
            },
            take: 5,
            orderBy: {
                uploadedAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        username: true
                    }
                }
            }
        });

        return {
            users: userResult ? [userResult] : [],
            clips: clips.map(clip => ({
                upload_id: clip.id,
                upload_name: clip.title,
                username: clip.user?.username || 'Unknown User',
                length: formatDuration(clip.length),
                date_uploaded: clip.uploadedAt.getTime()
            }))
        };
    } catch (error) {
        console.error('Error searching clips:', error);
        return { clips: [], users: [] };
    }
}

export async function getUserClips(username: string): Promise<Clip[]> {
    const clips = await prisma.clips.findMany({
        where: { user: { username: username } },
        include: {
            user: {
                select: {
                    username: true
                }
            }
        }
    });
    
    return clips.map(clip => ({
        upload_id: clip.id,
        upload_name: clip.title,
        username: clip.user?.username || 'Unknown User',
        length: formatDuration(clip.length),
        date_uploaded: clip.uploadedAt.getTime()
    }));
}