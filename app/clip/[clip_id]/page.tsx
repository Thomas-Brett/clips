import { getClip } from "@/app/lib/clips";
import Header from "@/app/common/Header";
import { notFound } from "next/navigation";
import VideoPlayer from "@/app/common/VideoPlayer";

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
        <div className="flex flex-col h-screen w-screen">
            <Header />
            <div className="flex flex-col items-center p-8 max-w-6xl mx-auto w-full">
                <div className="w-full aspect-video bg-panel rounded-lg overflow-hidden relative">
                    <VideoPlayer
                        src={`/api/video/${clip.upload_id}`}
                        poster={`/api/thumbnail/${clip.upload_id}`}
                    />
                </div>
                <div className="w-full mt-4">
                    <h1 className="text-3xl font-bold text-white">
                        {clip.upload_name}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-light">
                        <span>{clip.username}</span>
                        <span>•</span>
                        <span>{clipDate}</span>
                        <span>•</span>
                        <span>{clip.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
