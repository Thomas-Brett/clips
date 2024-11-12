'use client';

import { useState, useEffect } from "react";
import Clip from "@/app/common/Clip";
import { Clip as ClipType } from "@/app/types";
import { followUser, isFollowingEndpoint, getFollowStats } from "@/app/lib/users";
import { getUser } from "@/app/lib/auth";

interface UserData {
    username: string;
    createdAt: string;
    id: string;
    formattedJoinDate: string;
}

interface UserProfileClientProps {
    initialUser: UserData;
    initialClips: ClipType[];
}

export default function UserProfileClient({ initialUser, initialClips }: UserProfileClientProps) {
    const [user] = useState<UserData>(initialUser);
    const [clips] = useState<ClipType[]>(initialClips);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const loggedInUser = await getUser();
                setCurrentUser(loggedInUser);
                
                if (loggedInUser) {
                    const [followState, stats] = await Promise.all([
                        isFollowingEndpoint(loggedInUser.id, initialUser.id),
                        getFollowStats(initialUser.id)
                    ]);
                    setIsFollowing(followState);
                    setFollowStats(stats);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [initialUser.id]);

    const handleFollow = async () => {
        if (!currentUser?.id) {
            window.location.href = '/login';
            return;
        }
        
        try {
            setIsLoading(true);
            const response = await followUser(currentUser.id, user.id);
            
            if (response.success) {
                setIsFollowing(response.user.isFollowing);
                // Refresh follow stats
                const stats = await getFollowStats(user.id);
                setFollowStats(stats);
            }
        } catch (error) {
            console.error('Failed to follow user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-8 max-w-6xl mx-auto w-full">
            <div className="w-full bg-panel rounded-lg p-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="bg-accent rounded-full w-24 h-24 flex items-center justify-center text-white text-4xl font-bold">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {user.username}
                            </h1>
                            {currentUser?.id !== user.id && (
                                <button
                                    id="follow-button"
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-full font-medium transition-colors min-w-[120px] ${
                                        isLoading ? 'bg-med' : 
                                        !currentUser ? 'bg-med hover:bg-dark text-white' :
                                        isFollowing ? 
                                            'bg-transparent border border-light text-light hover:bg-red-500/10 hover:border-red-500 hover:text-red-500' : 
                                            'bg-accent hover:bg-accent-hover text-white'
                                    }`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="inline-block w-4 h-4 border-2 border-light/20 border-t-light/80 rounded-full animate-spin" />
                                    ) : !currentUser ? (
                                        'Sign in to follow'
                                    ) : (
                                        <span className={`${isFollowing ? 'group relative' : ''}`}>
                                            <span className={`${isFollowing ? 'group-hover:hidden' : ''}`}>
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </span>
                                            {isFollowing && (
                                                <span className="hidden group-hover:inline text-red-500">
                                                    Unfollow
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4 text-light">
                            <span>Joined {user.formattedJoinDate}</span>
                            <span>•</span>
                            <span>{followStats.followersCount} followers</span>
                            <span>•</span>
                            <span>{followStats.followingCount} following</span>
                            <span>•</span>
                            <span>{clips.length} clips</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Clips</h2>
                {clips.length === 0 ? (
                    <p className="text-center text-light text-lg">
                        No clips uploaded yet
                    </p>
                ) : (
                    <div className="flex flex-wrap justify-center">
                        {clips.map((clip) => (
                            <Clip key={clip.upload_id} clip={clip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 