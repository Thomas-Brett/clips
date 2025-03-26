"use client";

import { getUserClips } from "@/app/lib/clips";
import { useEffect, useState } from "react";
import { Clip as ClipType } from "@/app/types";
import Clip, { ClipSkeleton } from "@/app/components/Clip";

interface MoreVideosSidebarProps {
    username: string;
    currentClipId: string;
}

export default function MoreVideosSidebar({ username, currentClipId }: MoreVideosSidebarProps) {
    const [otherClips, setOtherClips] = useState<ClipType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const getOtherClips = async () => {
            const res = await getUserClips(username);
            const filteredClips = res.filter((clip) => clip.upload_id !== currentClipId);
            setOtherClips(filteredClips);
            setLoading(false);
        };
        getOtherClips();
    }, []);

    return (
        <div className="bg-primary flex h-fit w-96 flex-col rounded-lg p-2 pb-4">
            <h2 className="mb-2 ml-1 text-2xl text-white">
                More Videos from: <strong className="text-accent">{username}</strong>
            </h2>
            <div className="flex flex-col gap-2">
                {otherClips.map((clip) => (
                    <Clip key={clip.upload_id} clip={clip} type="small" />
                ))}
                {loading && <ClipSkeleton number={7} type="small" />}
                {otherClips.length === 0 && !loading && (
                    <div className="text-light text-center italic">
                        <p>No other videos found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
