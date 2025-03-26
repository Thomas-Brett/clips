"use client";

import { useState, useEffect } from "react";
import Clip from "@/app/components/Clip";
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
                    const [followState, stats] = await Promise.all([isFollowingEndpoint(loggedInUser.id, initialUser.id), getFollowStats(initialUser.id)]);
                    setIsFollowing(followState);
                    setFollowStats(stats);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [initialUser.id]);

    const handleFollow = async () => {
        if (!currentUser?.id) {
            window.location.href = "/login";
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
            console.error("Failed to follow user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center p-8">
            <div className="bg-primary mb-8 w-full rounded-lg p-8">
                <div className="flex items-center gap-6">
                    <div className="bg-accent flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold text-white">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h1 className="mb-2 text-3xl font-bold text-white">{user.username}</h1>
                            {currentUser?.id !== user.id && (
                                <button
                                    id="follow-button"
                                    onClick={handleFollow}
                                    className={`min-w-[120px] rounded-full px-6 py-2 font-medium transition-colors ${
                                        isLoading
                                            ? "bg-med"
                                            : !currentUser
                                              ? "bg-med hover:bg-dark text-white"
                                              : isFollowing
                                                ? "border-light text-light border bg-transparent hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                : "bg-accent hover:bg-accent-hover text-white"
                                    }`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="border-light/20 border-t-light/80 inline-block h-4 w-4 animate-spin rounded-full border-2" />
                                    ) : !currentUser ? (
                                        "Sign in to follow"
                                    ) : (
                                        <span className={`${isFollowing ? "group relative" : ""}`}>
                                            <span className={`${isFollowing ? "group-hover:hidden" : ""}`}>{isFollowing ? "Following" : "Follow"}</span>
                                            {isFollowing && <span className="hidden text-red-500 group-hover:inline">Unfollow</span>}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="text-light flex gap-4">
                            <span>Joined {user.formattedJoinDate}</span>
                            <span>•</span>
                            <span>
                                {followStats.followersCount} {followStats.followersCount === 1 ? "follower" : "followers"}
                            </span>
                            <span>•</span>
                            <span>{followStats.followingCount} following</span>
                            <span>•</span>
                            <span>
                                {clips.length} {clips.length === 1 ? "clip" : "clips"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-primary w-full rounded-lg p-4">
                <h2 className="mb-4 text-2xl font-bold text-white">Clips</h2>
                {clips.length === 0 ? (
                    <p className="text-light text-center text-lg">No clips uploaded yet</p>
                ) : (
                    <div className="flex flex-wrap justify-center">
                        {clips.map((clip) => (
                            <Clip bgOption="primary-panel" key={clip.upload_id} clip={clip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
