"use client";

import { Clip as ClipType } from "../types";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Clip({
    clip,
    type = "large",
    bgOption = "primary",
}: {
    clip: ClipType;
    type?: "small" | "large";
    bgOption?: "primary-panel" | "primary";
}) {
    const date = new Date(Number(clip.date_uploaded));
    let clipDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes() > 10 ? date.getMinutes() : "0" + date.getMinutes()}`;

    const router = useRouter();

    const handleClick = (smallOnly: boolean = false) => {
        if ((smallOnly && type === "small") || !smallOnly) {
            router.push(`/clip/${clip.upload_id}`);
        }
    };

    const handleMouseOver = () => {
        router.prefetch(`/clip/${clip.upload_id}`);
    };

    return (
        <div
            onClick={() => handleClick(true)}
            onMouseOver={handleMouseOver}
            className={`mx-2 my-4 inline-flex overflow-hidden rounded-sm ${type === "small" ? "bg-primary-panel" : `bg-${bgOption} w-96 flex-col`}`}
        >
            <div
                onClick={() => handleClick()}
                onMouseOver={handleMouseOver}
                className={`bg-panel relative cursor-pointer overflow-hidden rounded-t-lg ${type === "small" ? "h-20 w-24" : "h-[216px] w-full"}`}
            >
                <Image
                    height={type === "small" ? 80 : 216}
                    width={type === "small" ? 96 : 384}
                    src={`/api/thumbnail/${clip.upload_id}`}
                    className={"rounded-t-lg"}
                    alt={"Thumbnail"}
                />
                <div className={"bg-opacity-40 absolute right-1 bottom-1 rounded-lg bg-black px-1 font-bold text-white select-none"}>{clip.length}</div>
            </div>
            <div className={"mx-1 flex flex-col justify-between px-2 py-1"}>
                <div onClick={() => handleClick()} onMouseOver={handleMouseOver}>
                    <h2 className={"hover:text-accent mt-1 mr-1 cursor-pointer truncate text-2xl font-bold text-white transition-colors"}>
                        {clip.upload_name || "No Title"}
                    </h2>
                </div>
                <div className={`my-1 flex ${type === "small" ? "flex-col items-start" : "flex-row items-center"}`}>
                    {type !== "small" && (
                        <div
                            onClick={() => router.push(`/user/${clip.username}`)}
                            onMouseOver={() => router.prefetch(`/user/${clip.username}`)}
                            className={"text text-light cursor-pointer hover:underline"}
                        >
                            {clip.username}
                        </div>
                    )}
                    <h3 className={`text text-light ${type === "small" ? "" : "ml-auto"}`}>{clipDate}</h3>
                </div>
            </div>
        </div>
    );
}

export function ClipSkeleton({ type = "large", number = 1 }: { type?: "small" | "large"; number?: number }) {
    return (
        <>
            {[...Array(number)].map((_, i) => (
                <div
                    key={i}
                    className={`mx-2 inline-flex animate-pulse rounded-sm ${type === "small" ? "bg-primary-panel" : "bg-secondary my-4 w-96 flex-col"}`}
                >
                    <div
                        className={`relative ${type === "small" ? "bg-secondary-hover m-1 h-20 w-24 rounded-sm" : "bg-secondary-hover h-[216px] w-full rounded-t-lg"}`}
                    >
                        <div className="bg-secondary-hover absolute right-1 bottom-1 h-5 w-10 rounded-lg" />
                    </div>
                    <div className="mx-1 flex grow px-2 py-1">
                        {type === "small" ? (
                            <div className="flex w-full flex-col items-start">
                                <div className="bg-secondary-hover mt-1 h-6 w-20 rounded-sm" />
                                <div className="bg-secondary-hover mt-auto mb-1 h-5 w-full rounded-sm" />
                            </div>
                        ) : (
                            <div className="flex w-full flex-col">
                                <div className="bg-secondary-hover mt-1 h-8 w-3/4 rounded-sm" />
                                <div className="my-1 flex items-center justify-between">
                                    <div className="bg-secondary-hover h-4 w-24 rounded-sm" />
                                    <div className="bg-secondary-hover h-4 w-32 rounded-sm" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}
