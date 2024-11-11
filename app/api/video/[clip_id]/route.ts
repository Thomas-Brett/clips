import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

interface RouteParams {
    params: Promise<{ clip_id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { clip_id } = await params;
        if (!clip_id) {
            return new Response("Clip ID is required", { status: 400 });
        }

        const videoPath = join(
            process.cwd(),
            "uploads",
            clip_id,
            "video.mp4"
        );

        const videoBuffer = await readFile(videoPath);

        return new Response(videoBuffer, {
            headers: {
                "Content-Type": "video/mp4",
                "Cache-Control": "public, max-age=31536000",
            },
        });
    } catch (error) {
        console.error("Video fetch error:", error);
        return new Response("Failed to fetch video", { status: 500 });
    }
} 