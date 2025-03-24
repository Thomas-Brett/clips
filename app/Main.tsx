"use client";

import { useEffect, useState } from "react";
import Clip from "@/app/common/Clip";
import { getRecentClips } from "./lib/clips";
import { Clip as ClipType } from "./types";
import { getUser } from "./lib/auth";
import { useRouter } from 'next/navigation';

const LoadingSkeleton = () => (
    <div className="flex flex-wrap justify-center">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="mx-2 my-4 inline-flex w-96 flex-col rounded-sm bg-panel animate-pulse">
                <div className="relative h-[216px] w-full rounded-t-lg bg-panel-hover">
                    <div className="absolute bottom-1 right-1 w-10 h-5 rounded-lg bg-panel-hover" />
                </div>
                <div className="mx-1 flex w-full flex-col px-2 py-1">
                    <div className="mt-1 h-8 bg-panel-hover rounded-sm w-3/4" />
                    <div className="my-1 flex items-center justify-between">
                        <div className="h-4 bg-panel-hover rounded-sm w-24" />
                        <div className="h-4 bg-panel-hover rounded-sm w-32" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default function Main() {
    const [selectedTab, setSelectedTab] = useState<number>(2);
    const [loading, setLoading] = useState<boolean>(true);
    const [clips, setClips] = useState<ClipType[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const getCurrentUserId = async () => {
            const user = await getUser();
            if (!user && selectedTab === 1) {
                setSelectedTab(0);
            }
            setUserId(user?.id || null);
        };
        getCurrentUserId();
    }, [selectedTab]);

    useEffect(() => {
        const fetchClips = async () => {
            setLoading(true);
            setClips([]);
            try {
                const response = await getRecentClips(
                    100, 
                    selectedTab === 1 ? (userId || undefined) : 
                    selectedTab === 0 ? undefined : 
                    null
                );
                setClips(response);
            } catch (error) {
                console.error('Error fetching clips:', error);
                setClips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClips();
    }, [selectedTab, userId]);

    const handleTabClick = (tabIndex: number) => {
        if ((tabIndex === 1 || tabIndex === 0) && !userId) {
            router.push('/login');
            return;
        }
        setSelectedTab(tabIndex);
    };

    return (
        <div className={"mx-auto mt-4 w-fit max-w-[75%]"}>
            <div className={"mx-2 flex w-full select-none items-center justify-center space-x-4"}>
                <button
                    onClick={() => handleTabClick(2)}
                    className={`w-fit cursor-pointer border-b px-2 pb-1 text-2xl ${
                        selectedTab === 2 
                            ? "border-accent-hover font-bold text-accent" 
                            : "border-panel text-light"
                    }`}
                    aria-label="View all clips"
                    tabIndex={0}
                >
                    All
                </button>
                <button
                    onClick={() => handleTabClick(0)}
                    className={`w-fit cursor-pointer border-b px-2 pb-1 text-2xl ${
                        selectedTab === 0 
                            ? "border-accent-hover font-bold text-accent" 
                            : "border-panel text-light"
                    }`}
                    aria-label="View feed"
                    tabIndex={0}
                >
                    Following
                </button>
                <button
                    onClick={() => handleTabClick(1)}
                    className={`w-fit cursor-pointer border-b px-2 pb-1 text-2xl ${
                        selectedTab === 1 
                            ? "border-accent-hover font-bold text-accent" 
                            : "border-panel text-light"
                    }`}
                    aria-label="View my clips"
                    tabIndex={0}
                >
                    My Clips
                </button>
            </div>

            <div className={"mt-8 rounded-lg"}>
                {loading ? (
                    <LoadingSkeleton />
                ) : clips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <p className={"text-center text-2xl text-white"}>
                            {selectedTab === 0 ? "No clips in your feed. Follow some users!" : 
                             selectedTab === 1 ? "No clips to show. Upload some!" :
                             "No clips found."}
                        </p>
                    </div>
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
