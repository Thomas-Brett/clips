import { getClip } from "@/app/lib/clips";
import Header from "@/app/components/Header";
import { notFound } from "next/navigation";
import VideoPlayer from "@/app/clip/[clip_id]/VideoPlayer";
import Link from "next/link";
import MoreVideosSidebar from "./MoreVideosSidebar";
interface PageProps {
    params: Promise<{
        clip_id: string;
    }>;
}

export default async function ClipPage({ params }: PageProps) {
    let { clip_id } = await params;
    let clip;
    try {
        clip = await getClip(clip_id);
    } catch (error) {
        notFound();
    }

    const date = new Date(clip.date_uploaded);
    const clipDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes() > 10 ? date.getMinutes() : "0" + date.getMinutes()}`;

    return (
        <div className="flex h-screen w-screen flex-col">
            <Header />
            <div className="mx-auto flex w-[75%] gap-4 p-8">
                <div className="flex w-full flex-col items-center">
                    <div className="bg-primary relative aspect-video w-full overflow-hidden rounded-lg">
                        <VideoPlayer src={`/api/video/${clip.upload_id}`} poster={`/api/thumbnail/${clip.upload_id}`} />
                    </div>
                    <div className="bg-primary mt-4 w-full rounded-lg p-4">
                        <h1 className="text-3xl font-bold text-white">{clip.upload_name}</h1>
                        <div className="text-light mt-2 flex items-center gap-4">
                            <Link href={`/user/${clip.username}`} className="text-accent hover:text-accent/80 transition-colors hover:underline">
                                {clip.username}
                            </Link>
                            <span>•</span>
                            <span>Date Uploaded: {clipDate}</span>
                            <span>•</span>
                            <span>Length: {clip.length}</span>
                        </div>
                    </div>
                </div>
                <MoreVideosSidebar username={clip.username} currentClipId={clip.upload_id} />
            </div>
        </div>
    );
}
