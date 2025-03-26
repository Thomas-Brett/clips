"use client";

import { changeClipPrivacy } from "../lib/clips";
import { formatDate } from "../lib/clientTools";
import { FaLock, FaPenToSquare, FaSpinner, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";
import Image from "next/image";
import { Clip as ClipType } from "../types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClipEditor({ clips, setClips }: { clips: ClipType[]; setClips: (clips: ClipType[]) => void }) {
    const router = useRouter();

    return (
        <>
            {clips.map((clip) => (
                <Clip key={clip.upload_id} clip={clip} clips={clips} setClips={setClips} router={router} />
            ))}
        </>
    );
}

function Clip({
    clip,
    clips,
    setClips,
    router,
}: {
    clip: ClipType;
    clips: ClipType[];
    setClips: (clips: ClipType[]) => void;
    router: ReturnType<typeof useRouter>;
}) {
    const [privateLoading, setPrivateLoading] = useState(false);

    const setAsPrivate = async (clip: ClipType) => {
        setPrivateLoading(true);
        const isPrivate = await changeClipPrivacy(clip.upload_id, !clip.private);

        setPrivateLoading(false);
        setClips(clips.map((c: any) => (c.upload_id === clip.upload_id ? { ...c, private: isPrivate } : c)));
    };

    const handleClick = (clip: ClipType) => {
        router.push(`/clip/${clip.upload_id}`);
    };

    const handleMouseOver = (clip: ClipType) => {
        router.prefetch(`/clip/${clip.upload_id}`);
    };
    return (
        <div key={clip.upload_id} className="bg-primary mx-2 flex w-full items-center rounded-sm">
            <div
                onClick={() => handleClick(clip)}
                onMouseOver={() => handleMouseOver(clip)}
                className={`bg-panel relative h-40 w-72 cursor-pointer overflow-hidden rounded-l`}
            >
                <Image height={160} width={288} src={`/api/thumbnail/${clip.upload_id}`} className={"rounded-l"} alt={"Thumbnail"} />
                <div className={"bg-opacity-40 absolute right-1 bottom-1 rounded-lg bg-black px-1 font-bold text-white select-none"}>{clip.length}</div>
            </div>

            <div className="flex h-full flex-col items-start justify-between px-4 py-2">
                <h2 className="text-3xl font-bold text-white">{clip.upload_name || "No Title"}</h2>
                <div className="flex items-center justify-between">
                    <div className="text-light text-lg">
                        {formatDate(clip.date_uploaded)} - ({formatDate(clip.date_uploaded, true, false)})
                    </div>
                </div>
            </div>

            <div className="ml-auto flex h-full flex-col justify-center px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                    <ClipEditorButton title="Rename" icon={<FaPenToSquare />} onClick={() => {}} />
                    <ClipEditorButton
                        title="Mark as private"
                        icon={<FaLock />}
                        className={`${clip.private ? "bg-red-500/10 text-red-500/80" : "bg-green-500/10 text-green-500/80"}`}
                        onClick={() => setAsPrivate(clip)}
                        loading={privateLoading}
                    />
                    <ClipEditorButton title="Delete" icon={<FaTrash />} className="hover:bg-red-500/10 hover:text-red-500/80" onClick={() => {}} />
                </div>
            </div>
        </div>
    );
}

function ClipEditorButton({
    title,
    icon,
    onClick,
    className,
    loading,
}: {
    title: string;
    icon: React.ReactNode;
    onClick: () => void;
    className?: string;
    loading?: boolean;
}) {
    return (
        <motion.button
            title={title}
            whileTap={{ scale: 0.97 }}
            className={`text-light bg-primary-panel hover:bg-primary-panel-hover cursor-pointer rounded-lg p-2 text-xl transition-colors duration-200 ${className}`}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? <FaSpinner className="text-light animate-spin" /> : icon}
        </motion.button>
    );
}
