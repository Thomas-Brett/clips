"use client";

import { useEffect, useState } from "react";
import Clip from "@/app/components/Clip";
import { getRecentClips } from "./lib/clips";
import { Clip as ClipType } from "./types";
import { getUser } from "./lib/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const LoadingSkeleton = () => (
    <div className="flex flex-wrap justify-center">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-secondary mx-2 my-4 inline-flex w-96 animate-pulse flex-col rounded-sm">
                <div className="bg-secondary-hover relative h-[216px] w-full rounded-t-lg">
                    <div className="bg-secondary-hover absolute right-1 bottom-1 h-5 w-10 rounded-lg" />
                </div>
                <div className="mx-1 flex w-full flex-col px-2 py-1">
                    <div className="bg-secondary-hover mt-1 h-8 w-3/4 rounded-sm" />
                    <div className="my-1 flex items-center justify-between">
                        <div className="bg-secondary-hover h-4 w-24 rounded-sm" />
                        <div className="bg-secondary-hover h-4 w-32 rounded-sm" />
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
                const response = await getRecentClips(100, selectedTab === 1 ? userId || undefined : selectedTab === 0 ? undefined : null);
                setClips(response);
            } catch (error) {
                console.error("Error fetching clips:", error);
                setClips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClips();
    }, [selectedTab, userId]);

    const handleTabClick = (tabIndex: number) => {
        if ((tabIndex === 1 || tabIndex === 0) && !userId) {
            router.push("/login");
            return;
        }
        setSelectedTab(tabIndex);
    };

    return (
        <div className={"mx-auto mt-4 w-fit max-w-[75%]"}>
            <div className={"mx-2 flex w-full items-center justify-center space-x-4 select-none"}>
                <Tab onClick={() => handleTabClick(2)} selected={selectedTab === 2}>
                    All
                </Tab>
                <Tab onClick={() => handleTabClick(0)} selected={selectedTab === 0}>
                    Following
                </Tab>
                <Tab onClick={() => handleTabClick(1)} selected={selectedTab === 1}>
                    My Clips
                </Tab>
            </div>

            <div className={"mt-8 rounded-lg"}>
                {loading ? (
                    <LoadingSkeleton />
                ) : clips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <p className={"text-center text-2xl text-white"}>
                            {selectedTab === 0
                                ? "No clips in your feed. Follow some users!"
                                : selectedTab === 1
                                  ? "No clips to show. Upload some!"
                                  : "No clips found."}
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

function Tab({ children, onClick, selected }: { children: React.ReactNode; onClick: () => void; selected: boolean }) {
    return (
        <motion.button
            onMouseDown={onClick}
            className={`flex w-fit cursor-pointer flex-col items-center gap-1 px-2 pb-1 text-2xl ${selected ? "text-accent" : "text-light hover:text-white/80"}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {children}
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: selected ? "100%" : 0 }}
                transition={{ duration: 0.2 }}
                className="bg-accent-hover h-0.5 w-full rounded-full"
            />
        </motion.button>
    );
}
