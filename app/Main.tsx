"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import Clip from "@/app/common/Clip";
import { getRecentClips } from "./lib/clips";

export default function Main() {
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [clips, setClips] = useState<any[]>([]);

    useEffect(() => {
        const fetchClips = async () => {
            setLoading(true);
            setClips([]);
            try {
                const response = await getRecentClips();
                setClips(response);
            } catch (error) {
                console.error('Error fetching clips:', error);
                setClips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClips();
    }, [selectedTab]);

    return (
        <div className={"mx-auto mt-4 w-fit max-w-[75%]"}>
            <div className={"mx-2 flex w-full select-none items-center justify-center space-x-4"}>
                <p
                    onClick={() => setSelectedTab(0)}
                    className={
                        (selectedTab === 0 ? "border-accent-hover font-bold text-accent " : "border-panel text-light ") +
                        "w-fit cursor-pointer border-b px-2 pb-1 text-2xl"
                    }
                >
                    My Feed
                </p>
                <p
                    onClick={() => setSelectedTab(1)}
                    className={
                        (selectedTab === 1 ? "border-accent-hover font-bold text-accent " : "border-panel text-light ") +
                        "w-fit cursor-pointer border-b px-2 pb-1 text-2xl"
                    }
                >
                    My Clips
                </p>
            </div>

            <div className={"mt-8 rounded-lg"}>
                {loading && (
                    <div className={"flex items-center justify-center text-center text-2xl text-white"}>
                        <FaSpinner className={"mr-4 animate-spin text-2xl"} />
                        <p>Loading...</p>
                    </div>
                )}
                {clips.length === 0 && !loading && (
                    <p className={"text-center text-2xl text-white"}>
                        {selectedTab === 0 ? "No clips in your feed. Follow some users!" : "No clips to show. Upload some!"}
                    </p>
                )}
                <div className="flex flex-wrap justify-center">
                    {clips.map((clip) => (
                        <Clip key={clip.upload_id} clip={clip} />
                    ))}
                </div>
            </div>
        </div>
    );
}
