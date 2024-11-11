"use client";

import Link from "next/link";

export default function Clip({ clip }: { clip: any }) {
    const date = new Date(Number(clip.date_uploaded));
    let clipDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes() > 10 ? date.getMinutes() : "0" + date.getMinutes()}`;

    return (
        <div className={"mx-2 my-4 inline-flex w-96 flex-col rounded bg-panel"}>
            <Link href={`/clip/${clip.upload_id}`}>
                <div className={"relative h-[216px] w-full cursor-pointer rounded-t-lg bg-panel"}>
                    <img src={`/api/thumbnail/${clip.upload_id}`} className={"rounded-t-lg"} alt={"Thumbnail"} />
                    <div className={"absolute bottom-1 right-1 select-none rounded-lg bg-black bg-opacity-40 px-1 font-bold text-white"}>
                        {clip.length}
                    </div>
                </div>
            </Link>
            <div className={"mx-1 flex w-full flex-col px-2 py-1"}>
                <Link href={`/clip/${clip.upload_id}`}>
                    <h2 className={"mt-1 cursor-pointer text-2xl font-bold text-white hover:text-accent transition-colors"}>
                        {clip.upload_name.length ? clip.upload_name : "No Title"}
                    </h2>
                </Link>
                <div className={"my-1 flex items-center"}>
                    <h3 className={"text cursor-pointer text-light hover:underline"}>{clip.username}</h3>
                    <h3 className={"text ml-auto mr-1 text-light"}>{clipDate}</h3>
                </div>
            </div>
        </div>
    );
}