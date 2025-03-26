"use client";

import { useEffect, useState } from "react";
import Clip, { ClipSkeleton } from "@/app/components/Clip";
import { getRecentClips } from "./lib/clips";
import { Clip as ClipType } from "./types";
import { getUser } from "./lib/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "./context/userContext";
import { ClipEditor } from "./components/ClipEditor";
export default function Main() {
    const [selectedTab, setSelectedTab] = useState<number>(2);
    const [loading, setLoading] = useState<boolean>(true);
    const [clips, setClips] = useState<ClipType[]>([]);
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        const fetchClips = async () => {
            setLoading(true);
            setClips([]);
            try {
                const response = await getRecentClips(100, selectedTab === 1 ? user?.id || undefined : selectedTab === 0 ? undefined : null);
                setClips(response);
            } catch (error) {
                console.error("Error fetching clips:", error);
                setClips([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClips();
    }, [selectedTab, user?.id]);

    const handleTabClick = (tabIndex: number) => {
        if ((tabIndex === 1 || tabIndex === 0) && !user?.id) {
            router.push("/login");
            return;
        }
        setSelectedTab(tabIndex);
    };

    return (
        <div className={"mx-auto mt-4 w-[75%]"}>
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

            <div className={"mt-8 flex max-h-[calc(100vh-10rem)] justify-center rounded-lg"}>
                {loading ? (
                    <div className="flex flex-wrap justify-center">
                        <ClipSkeleton number={8} />
                    </div>
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
                ) : selectedTab === 1 ? (
                    <div className="flex max-h-full w-[1200px] flex-col items-center justify-center gap-2 overflow-x-hidden overflow-y-auto">
                        <ClipEditor clips={clips} setClips={setClips} />
                    </div>
                ) : (
                    <div className="flex max-h-full flex-wrap justify-center overflow-y-auto">
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
